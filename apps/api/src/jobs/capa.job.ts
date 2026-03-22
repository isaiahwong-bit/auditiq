import { Queue, Worker } from 'bullmq';
import { getRedisOptions } from '../lib/redis';
import { resend } from '../lib/resend';
import * as capaService from '../services/capa.service';

// ── Queues ───────────────────────────────────────────────────────────────────

export const capaQueue = new Queue('capa', { connection: getRedisOptions() });

// ── Job types ────────────────────────────────────────────────────────────────

interface CapaAssignedJob {
  type: 'capa_assigned';
  capaId: string;
}

interface CapaReminderJob {
  type: 'capa_reminder';
  capaId: string;
}

interface CapaOverdueCheckJob {
  type: 'capa_overdue_check';
}

type CapaJobData = CapaAssignedJob | CapaReminderJob | CapaOverdueCheckJob;

// ── Schedule jobs on CAPA creation ──────────────────────────────────────────

export async function scheduleCapaJobs(capaId: string, dueDate: string) {
  // 1. Send assignment email immediately
  await capaQueue.add('capa_assigned', {
    type: 'capa_assigned',
    capaId,
  });

  // 2. Schedule reminder 24hrs before due date
  const dueDateMs = new Date(dueDate).getTime();
  const reminderMs = dueDateMs - 24 * 60 * 60 * 1000;
  const delayMs = Math.max(0, reminderMs - Date.now());

  if (delayMs > 0) {
    await capaQueue.add(
      'capa_reminder',
      { type: 'capa_reminder', capaId },
      { delay: delayMs },
    );
  }

  // 3. Schedule overdue escalation at due_date + 24hrs
  const escalationMs = dueDateMs + 24 * 60 * 60 * 1000;
  const escalationDelay = Math.max(0, escalationMs - Date.now());

  await capaQueue.add(
    'capa_overdue_escalation',
    { type: 'capa_overdue_check', capaId },
    { delay: escalationDelay },
  );
}

// ── Worker ───────────────────────────────────────────────────────────────────

export const capaWorker = new Worker<CapaJobData>(
  'capa',
  async (job) => {
    switch (job.data.type) {
      case 'capa_assigned':
        await handleCapaAssigned(job.data.capaId);
        break;
      case 'capa_reminder':
        await handleCapaReminder(job.data.capaId);
        break;
      case 'capa_overdue_check':
        await handleOverdueCheck();
        break;
    }
  },
  { connection: getRedisOptions() },
);

capaWorker.on('failed', (job, err) => {
  console.error(`[CAPA Job] Failed ${job?.name}: ${err.message}`);
});

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleCapaAssigned(capaId: string) {
  const capa = await capaService.getCapa(capaId);
  if (!capa || !capa.assigned_to) return;

  const email = await capaService.getAssigneeEmail(capa.assigned_to);
  if (!email) return;

  await resend.emails.send({
    from: 'AuditIQ <notifications@auditiq.com.au>',
    to: email,
    subject: `CAPA Assigned: ${capa.title}`,
    html: `
      <h2>A CAPA has been assigned to you</h2>
      <p><strong>Title:</strong> ${capa.title}</p>
      <p><strong>Urgency:</strong> ${capa.urgency}</p>
      <p><strong>Due date:</strong> ${capa.due_date ? new Date(capa.due_date).toLocaleDateString('en-AU') : 'Not set'}</p>
      ${capa.description ? `<p><strong>Description:</strong> ${capa.description}</p>` : ''}
      <p>Log in to AuditIQ to view and take action.</p>
    `,
  });
}

async function handleCapaReminder(capaId: string) {
  const capa = await capaService.getCapa(capaId);
  if (!capa || capa.status === 'closed') return;
  if (!capa.assigned_to) return;

  const email = await capaService.getAssigneeEmail(capa.assigned_to);
  if (!email) return;

  await resend.emails.send({
    from: 'AuditIQ <notifications@auditiq.com.au>',
    to: email,
    subject: `CAPA Reminder: ${capa.title} — due in 24 hours`,
    html: `
      <h2>CAPA Due Soon</h2>
      <p><strong>Title:</strong> ${capa.title}</p>
      <p><strong>Due date:</strong> ${capa.due_date ? new Date(capa.due_date).toLocaleDateString('en-AU') : 'Not set'}</p>
      <p>This CAPA is due within the next 24 hours. Please submit evidence and close it before the deadline.</p>
    `,
  });
}

async function handleOverdueCheck() {
  const overdueCount = await capaService.markOverdueCapas();
  if (overdueCount > 0) {
    console.log(`[CAPA Job] Marked ${overdueCount} CAPAs as overdue`);
  }
}
