import { Queue, Worker } from 'bullmq';
import { z } from 'zod';
import { getRedisOptions, redisAvailable } from '../lib/redis';
import { claude } from '../lib/claude';
import { resend } from '../lib/resend';
import * as intelligenceService from '../services/intelligence.service';
import * as capaService from '../services/capa.service';

// ── Queue (lazy) ────────────────────────────────────────────────────────────

let _intelligenceQueue: Queue | null = null;
function getIntelligenceQueue(): Queue {
  if (!_intelligenceQueue) {
    _intelligenceQueue = new Queue('intelligence', { connection: getRedisOptions() });
  }
  return _intelligenceQueue;
}

// ── Schedule nightly run ─────────────────────────────────────────────────────

export async function scheduleNightlyAnalysis() {
  if (!redisAvailable) {
    console.warn('[Intelligence] Redis not available — skipping nightly schedule');
    return;
  }
  await getIntelligenceQueue().add(
    'nightly-analysis',
    { type: 'nightly' },
    {
      repeat: { pattern: '0 2 * * *' }, // 2 AM daily
      removeOnComplete: true,
    },
  );
}

// ── Zod schema for Claude response ──────────────────────────────────────────

const alertSchema = z.object({
  alerts: z.array(
    z.object({
      alert_type: z.enum(['declining_trend', 'pattern_detected', 'threshold_approaching', 'seasonal_risk']),
      category_code: z.string().nullable(),
      title: z.string(),
      description: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
      check_item_name: z.string().nullable(),
      facility_area_name: z.string().nullable(),
    }),
  ),
});

// ── Worker (only starts when Redis is available) ────────────────────────────

if (redisAvailable) {
  const intelligenceWorker = new Worker(
    'intelligence',
    async () => {
      console.log('[Intelligence] Starting nightly analysis...');
      const sites = await intelligenceService.getActiveSites();

      for (const site of sites) {
        try {
          await analyseSite(site.id, site.organisation_id);
        } catch (err) {
          console.error(`[Intelligence] Failed for site ${site.id}:`, err);
        }
      }

      console.log(`[Intelligence] Completed analysis for ${sites.length} sites`);
    },
    { connection: getRedisOptions() },
  );

  intelligenceWorker.on('failed', (job, err) => {
    console.error(`[Intelligence Job] Failed ${job?.name}: ${err.message}`);
  });
}

// ── Per-site analysis ────────────────────────────────────────────────────────

async function analyseSite(siteId: string, organisationId: string) {
  const responses = await intelligenceService.get30DayResponses(siteId);

  if (responses.length === 0) return;

  // Build summary stats for Claude
  const summary = buildResponseSummary(responses);

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 1024,
    system: `You are a food safety intelligence analyst. Analyse 30 days of pre-operational check data and identify:
- Declining trends (pass rates dropping over time)
- Pattern detection (recurring failures on specific items or shifts)
- Threshold approaching (pass rates nearing unacceptable levels)
- Seasonal risk indicators

Respond with JSON only. Only flag genuinely concerning patterns — do not create alerts for normal variation.`,
    messages: [
      {
        role: 'user',
        content: `Here is 30 days of pre-op check data for analysis:

${summary}

Respond with JSON: { "alerts": [{ "alert_type": "declining_trend"|"pattern_detected"|"threshold_approaching"|"seasonal_risk", "category_code": string|null, "title": "concise title", "description": "detailed explanation with data points", "severity": "high"|"medium"|"low", "check_item_name": string|null, "facility_area_name": string|null }] }

Return an empty alerts array if no concerning patterns are detected.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{"alerts":[]}';
  const parsed = alertSchema.parse(JSON.parse(text));

  // Create alerts
  for (const alert of parsed.alerts) {
    await intelligenceService.createAlert({
      siteId,
      organisationId,
      alertType: alert.alert_type,
      categoryCode: alert.category_code,
      facilityAreaId: null,
      checkItemId: null,
      frameworkCodes: [],
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
    });

    // Email high severity alerts
    if (alert.severity === 'high') {
      const managers = await capaService.getPlantManagers(organisationId);
      for (const manager of managers) {
        const email = await capaService.getAssigneeEmail(manager.id);
        if (email) {
          await resend.emails.send({
            from: 'AuditArmour <notifications@auditarmour.com.au>',
            to: email,
            subject: `Intelligence Alert: ${alert.title}`,
            html: `
              <h2>High Severity Intelligence Alert</h2>
              <p><strong>${alert.title}</strong></p>
              <p>${alert.description}</p>
              <p>Log in to AuditArmour to review and take action.</p>
            `,
          });
        }
      }
    }
  }
}

// ── Build summary from raw responses ─────────────────────────────────────────

interface ResponseRow {
  result: string | null;
  check_items: { name: string; category_code: string | null; facility_area_id: string };
  pre_op_sessions: { session_date: string; shift: string | null; facility_area_id: string };
}

function buildResponseSummary(responses: ResponseRow[]): string {
  // Group by check item
  const byItem = new Map<string, { total: number; pass: number; fail: number; dates: string[] }>();

  for (const r of responses) {
    const key = r.check_items.name;
    const entry = byItem.get(key) ?? { total: 0, pass: 0, fail: 0, dates: [] };
    if (r.result !== 'na') {
      entry.total++;
      if (r.result === 'pass') entry.pass++;
      if (r.result === 'fail') entry.fail++;
    }
    if (r.result === 'fail') {
      entry.dates.push(r.pre_op_sessions.session_date);
    }
    byItem.set(key, entry);
  }

  const lines: string[] = [];
  for (const [name, stats] of byItem) {
    const rate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 100;
    lines.push(
      `- ${name}: ${rate}% pass rate (${stats.pass}/${stats.total}), ${stats.fail} failures${
        stats.dates.length > 0 ? ` on: ${stats.dates.join(', ')}` : ''
      }`,
    );
  }

  return `Total responses: ${responses.length}\nCheck items:\n${lines.join('\n')}`;
}
