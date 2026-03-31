import { Queue, Worker } from 'bullmq';
import { getRedisOptions, redisAvailable } from '../lib/redis';
import { supabaseAdmin } from '../lib/supabase';
import { resend } from '../lib/resend';
import * as reportService from '../services/report.service';
import * as capaService from '../services/capa.service';

// ── Queue (lazy) ────────────────────────────────────────────────────────────

let _pdfQueue: Queue | null = null;
function getPdfQueue(): Queue {
  if (!_pdfQueue) {
    _pdfQueue = new Queue('pdf', { connection: getRedisOptions() });
  }
  return _pdfQueue;
}

// ── Job types ────────────────────────────────────────────────────────────────

interface AuditReportJob {
  type: 'audit_report';
  auditId: string;
  siteId: string;
  organisationId: string;
  requestedBy: string;
}

interface CertPackJob {
  type: 'cert_pack';
  siteId: string;
  organisationId: string;
  requestedBy: string;
}

type PdfJobData = AuditReportJob | CertPackJob;

// ── Schedule jobs ────────────────────────────────────────────────────────────

export async function scheduleAuditReport(params: {
  auditId: string;
  siteId: string;
  organisationId: string;
  requestedBy: string;
}) {
  if (!redisAvailable) {
    console.warn('[PDF Job] Redis not available — skipping');
    return;
  }
  await getPdfQueue().add('audit_report', {
    type: 'audit_report',
    ...params,
  });
}

export async function scheduleCertPack(params: {
  siteId: string;
  organisationId: string;
  requestedBy: string;
}) {
  if (!redisAvailable) {
    console.warn('[PDF Job] Redis not available — skipping');
    return;
  }
  await getPdfQueue().add('cert_pack', {
    type: 'cert_pack',
    ...params,
  });
}

// ── Worker (only starts when Redis is available) ────────────────────────────

if (redisAvailable) {
  const pdfWorker = new Worker<PdfJobData>(
    'pdf',
    async (job) => {
      switch (job.data.type) {
        case 'audit_report':
          await generateAuditReport(job.data);
          break;
        case 'cert_pack':
          await generateCertPack(job.data);
          break;
      }
    },
    { connection: getRedisOptions() },
  );

  pdfWorker.on('failed', (job, err) => {
    console.error(`[PDF Job] Failed ${job?.name}: ${err.message}`);
  });
}

// ── Audit report generation ─────────────────────────────────────────────────

async function generateAuditReport(job: AuditReportJob) {
  const data = await reportService.getAuditReportData(job.auditId);

  // Generate HTML report
  const html = renderAuditReportHtml(data);

  // Upload to Supabase Storage
  const fileName = `audit-report-${job.auditId}-${Date.now()}.html`;
  const filePath = `reports/${job.organisationId}/${job.siteId}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('reports')
    .upload(filePath, html, { contentType: 'text/html' });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAdmin.storage.from('reports').getPublicUrl(filePath);
  const reportUrl = urlData.publicUrl;

  // Email the requester
  const email = await capaService.getAssigneeEmail(job.requestedBy);
  if (email) {
    await resend.emails.send({
      from: 'AuditIQ <notifications@auditiq.com.au>',
      to: email,
      subject: `Audit Report Ready: ${data.site.name}`,
      html: `
        <h2>Your audit report is ready</h2>
        <p><strong>Site:</strong> ${data.site.name}</p>
        <p><strong>Score:</strong> ${data.audit.overall_score ?? 'N/A'}%</p>
        <p><strong>Findings:</strong> ${data.summary.total_findings}</p>
        <p><a href="${reportUrl}">View Report</a></p>
      `,
    });
  }
}

// ── Certification pack generation ────────────────────────────────────────────

async function generateCertPack(job: CertPackJob) {
  const data = await reportService.getCertPackData(job.siteId, job.organisationId);

  const html = renderCertPackHtml(data);

  const fileName = `cert-pack-${job.siteId}-${Date.now()}.html`;
  const filePath = `reports/${job.organisationId}/${job.siteId}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('reports')
    .upload(filePath, html, { contentType: 'text/html' });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAdmin.storage.from('reports').getPublicUrl(filePath);
  const reportUrl = urlData.publicUrl;

  const email = await capaService.getAssigneeEmail(job.requestedBy);
  if (email) {
    await resend.emails.send({
      from: 'AuditIQ <notifications@auditiq.com.au>',
      to: email,
      subject: `Certification Evidence Package Ready: ${data.site.name}`,
      html: `
        <h2>Your certification evidence package is ready</h2>
        <p><strong>Site:</strong> ${data.site.name}</p>
        <p><strong>Frameworks:</strong> ${data.frameworks.map((f) => f.code).join(', ')}</p>
        <p><a href="${reportUrl}">View Package</a></p>
      `,
    });
  }
}

// ── HTML renderers ───────────────────────────────────────────────────────────

function renderAuditReportHtml(data: reportService.AuditReportData): string {
  const riskColor = (r: string | null) => {
    switch (r) {
      case 'critical': return '#E24B4A';
      case 'high': return '#E24B4A';
      case 'medium': return '#BA7517';
      case 'low': return '#1D9E75';
      default: return '#888780';
    }
  };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Audit Report</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
  h1 { color: #1D9E75; border-bottom: 2px solid #E1F5EE; padding-bottom: 8px; }
  .meta { color: #888780; font-size: 14px; margin-bottom: 24px; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; }
  .stat { background: #F1EFE8; padding: 16px; border-radius: 8px; text-align: center; flex: 1; }
  .stat-value { font-size: 28px; font-weight: bold; }
  .finding { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .risk-badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; color: white; }
  .clause-ref { font-family: monospace; font-size: 12px; color: #378ADD; background: #E6F1FB; padding: 2px 6px; border-radius: 4px; }
  .action-box { background: #E6F1FB; border-radius: 6px; padding: 12px; margin-top: 8px; font-size: 14px; }
</style></head><body>
<h1>Audit Report</h1>
<div class="meta">
  <p><strong>${data.organisation.name}</strong> — ${data.site.name}</p>
  <p>Type: ${data.audit.audit_type ?? 'N/A'} | Conducted by: ${data.audit.conducted_by_name ?? 'N/A'}</p>
  <p>Completed: ${data.audit.completed_at ? new Date(data.audit.completed_at).toLocaleDateString('en-AU') : 'In progress'}</p>
</div>
<div class="summary">
  <div class="stat"><div class="stat-value" style="color:#1D9E75">${data.audit.overall_score ?? '—'}%</div><div>Score</div></div>
  <div class="stat"><div class="stat-value">${data.summary.total_findings}</div><div>Findings</div></div>
  <div class="stat"><div class="stat-value" style="color:#E24B4A">${data.summary.critical}</div><div>Critical</div></div>
  <div class="stat"><div class="stat-value" style="color:#BA7517">${data.summary.high}</div><div>High</div></div>
</div>
<h2>Findings</h2>
${data.findings.map((f, i) => `
<div class="finding">
  <div class="finding-header">
    <strong>${i + 1}. ${f.finding_title ?? 'Finding'}</strong>
    <span class="risk-badge" style="background:${riskColor(f.risk_rating)}">${f.risk_rating ?? 'N/A'}</span>
  </div>
  ${f.finding_narrative ? `<p>${f.finding_narrative}</p>` : ''}
  ${f.recommended_action ? `<div class="action-box"><strong>Recommended Action:</strong> ${f.recommended_action}</div>` : ''}
  ${f.clause_refs.length > 0 ? `<div style="margin-top:8px">${f.clause_refs.map((cr) => `<span class="clause-ref">[${cr.framework_code}] ${cr.clause_ref}</span> `).join('')}</div>` : ''}
</div>`).join('')}
<hr><p style="color:#888780;font-size:12px">Generated by AuditIQ on ${new Date().toLocaleDateString('en-AU')}</p>
</body></html>`;
}

function renderCertPackHtml(data: reportService.CertPackData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Certification Evidence Package</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
  h1 { color: #1D9E75; border-bottom: 2px solid #E1F5EE; padding-bottom: 8px; }
  h2 { color: #378ADD; margin-top: 32px; }
  .meta { color: #888780; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #e5e5e5; padding: 8px 12px; text-align: left; font-size: 14px; }
  th { background: #F1EFE8; font-weight: 600; }
  .stat-row { display: flex; gap: 16px; margin: 16px 0; }
  .stat { background: #F1EFE8; padding: 16px; border-radius: 8px; text-align: center; flex: 1; }
  .stat-value { font-size: 24px; font-weight: bold; }
  .green { color: #1D9E75; } .red { color: #E24B4A; } .amber { color: #BA7517; }
</style></head><body>
<h1>Certification Evidence Package</h1>
<div class="meta">
  <p><strong>${data.organisation.name}</strong> — ${data.site.name}</p>
  <p>Generated: ${new Date(data.generated_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}</p>
</div>

<h2>Active Frameworks</h2>
<table><tr><th>Framework</th><th>Version</th></tr>
${data.frameworks.map((f) => `<tr><td>${f.name}</td><td>${f.version ?? '—'}</td></tr>`).join('')}
</table>

<h2>Compliance Summary</h2>
<div class="stat-row">
  <div class="stat"><div class="stat-value">${data.gap_summary.total_clauses}</div><div>Total Clauses</div></div>
  <div class="stat"><div class="stat-value green">${data.gap_summary.covered}</div><div>Covered</div></div>
  <div class="stat"><div class="stat-value amber">${data.gap_summary.plans_in_place}</div><div>Plans in Place</div></div>
  <div class="stat"><div class="stat-value red">${data.gap_summary.gaps}</div><div>Gaps</div></div>
</div>

<h2>Rectification Plans</h2>
${data.rectification_plans.length === 0 ? '<p>No rectification plans.</p>' : `
<table><tr><th>Clause</th><th>Framework</th><th>Plan</th><th>Target</th><th>Status</th></tr>
${data.rectification_plans.map((p) => `
<tr><td>${p.clause_ref} — ${p.clause_title}</td><td>${p.framework_code}</td><td>${p.description}</td>
<td>${p.target_date ? new Date(p.target_date).toLocaleDateString('en-AU') : '—'}</td>
<td>${p.status}</td></tr>`).join('')}
</table>`}

<h2>Pre-operational Checks (30 days)</h2>
<div class="stat-row">
  <div class="stat"><div class="stat-value">${data.preop_completion.total_sessions_30d}</div><div>Total Sessions</div></div>
  <div class="stat"><div class="stat-value green">${data.preop_completion.completed}</div><div>Completed</div></div>
  <div class="stat"><div class="stat-value red">${data.preop_completion.missed}</div><div>Missed</div></div>
  <div class="stat"><div class="stat-value">${data.preop_completion.avg_pass_rate?.toFixed(1) ?? '—'}%</div><div>Avg Pass Rate</div></div>
</div>

<h2>CAPAs</h2>
<p>Open: ${data.open_capas} | Overdue: ${data.overdue_capas}</p>

<hr><p style="color:#888780;font-size:12px">Generated by AuditIQ on ${new Date().toLocaleDateString('en-AU')}</p>
</body></html>`;
}
