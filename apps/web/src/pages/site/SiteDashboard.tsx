import { Link, useParams } from 'react-router-dom';
import { useSite } from '../../hooks/use-site';
import { useOrg } from '../../hooks/use-org';
import { useAuth } from '../../hooks/use-auth';

// ── Demo / fallback data ────────────────────────────────────────────────────

const DEMO_FRAMEWORKS = ['HACCP', 'BRCGS', 'Coles'];

const DEMO_PREOP_AREAS = [
  { id: '1', area: 'Kill Floor',        operator: 'J. Santos',    passRate: 96.4 },
  { id: '2', area: 'Boning Room',       operator: 'M. Nguyen',    passRate: 88.2 },
  { id: '3', area: 'Chiller 1',         operator: 'R. Okafor',    passRate: 72.0 },
  { id: '4', area: 'Dispatch',          operator: 'K. Williams',  passRate: null  },
  { id: '5', area: 'Offal Processing',  operator: 'T. Baker',     passRate: 100  },
];

const DEMO_ALERTS = [
  {
    id: 'a1',
    title: 'Declining hand-wash compliance in Boning Room',
    description: 'Pass rate dropped from 94% to 72% over the last 5 sessions. Investigate root cause before next audit.',
    severity: 'high' as const,
    type: 'declining_trend',
  },
  {
    id: 'a2',
    title: 'Chiller 1 temp sensor drift detected',
    description: 'Temperature readings trending 0.8 C above baseline over 14 days. Schedule recalibration.',
    severity: 'medium' as const,
    type: 'pattern_detected',
  },
  {
    id: 'a3',
    title: 'Seasonal pest-pressure increase expected',
    description: 'Historical data indicates a 40% rise in pest-related NCARs during April in this region.',
    severity: 'low' as const,
    type: 'seasonal_risk',
  },
];

const DEMO_CAPAS = [
  { id: 'c1', title: 'Replace worn door seals — Chiller 1',           urgency: 'immediate' as const, dueLabel: 'Overdue',  overdue: true  },
  { id: 'c2', title: 'Retrain boning room staff on hand-wash SOP',    urgency: '24hr' as const,      dueLabel: 'Today',    overdue: false },
  { id: 'c3', title: 'Install secondary drain cover — Kill Floor',    urgency: '7day' as const,      dueLabel: '3 days',   overdue: false },
  { id: 'c4', title: 'Update allergen signage in Dispatch',           urgency: 'standard' as const,  dueLabel: '12 days',  overdue: false },
];

const DEMO_COMPLIANCE = [
  { id: 'f1', framework: 'HACCP',  covered: 14, total: 14, status: 'green' as const  },
  { id: 'f2', framework: 'BRCGS',  covered: 11, total: 14, status: 'amber' as const },
  { id: 'f3', framework: 'Coles',  covered: 8,  total: 12, status: 'red' as const   },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayFormatted(): string {
  const d = new Date();
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function passRateColor(rate: number): string {
  if (rate >= 90) return 'text-brand-green';
  if (rate >= 70) return 'text-brand-amber';
  return 'text-brand-red';
}

function passRateBg(rate: number): string {
  if (rate >= 90) return 'bg-brand-green-light dark:bg-brand-green/10';
  if (rate >= 70) return 'bg-brand-amber-light dark:bg-brand-amber/10';
  return 'bg-brand-red-light dark:bg-brand-red/10';
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function SiteDashboard() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { site } = useSite();
  useOrg();
  useAuth();

  const basePath = `/${orgSlug}/sites/${siteSlug}`;

  // Derive aggregate metrics from demo data
  const completedAreas = DEMO_PREOP_AREAS.filter((a) => a.passRate !== null);
  const avgScore =
    completedAreas.length > 0
      ? Math.round(
          completedAreas.reduce((sum, a) => sum + (a.passRate ?? 0), 0) / completedAreas.length * 10,
        ) / 10
      : null;
  const openCapaCount = DEMO_CAPAS.length;
  const overdueCount = DEMO_CAPAS.filter((c) => c.overdue).length;
  const daysSinceAudit = 18;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5 md:px-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {site?.name ?? 'Site Dashboard'}
            </h1>
            <p className="mt-0.5 text-sm text-brand-gray dark:text-gray-400">
              {todayFormatted()}
              {' \u00b7 '}
              {DEMO_FRAMEWORKS.map((fw, i) => (
                <span key={fw}>
                  <span className="font-medium text-gray-600 dark:text-gray-300">{fw}</span>
                  {i < DEMO_FRAMEWORKS.length - 1 ? ' \u00b7 ' : ''}
                </span>
              ))}
              {' active'}
            </p>
          </div>
          <Link
            to={`${basePath}/audits`}
            className="shrink-0 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90 transition-colors"
          >
            Start audit
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8 space-y-6">
        {/* ── Row 1: Key metrics ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Pre-op score today */}
          <StatCard
            label="Pre-op score today"
            value={avgScore !== null ? `${avgScore}%` : '--'}
            color={avgScore !== null ? (avgScore >= 90 ? 'green' : avgScore >= 70 ? 'amber' : 'red') : 'gray'}
          />
          {/* Open CAPAs */}
          <StatCard
            label="Open CAPAs"
            value={String(openCapaCount)}
            color={openCapaCount === 0 ? 'green' : openCapaCount <= 3 ? 'amber' : 'red'}
          />
          {/* Overdue */}
          <StatCard
            label="Overdue"
            value={String(overdueCount)}
            color={overdueCount === 0 ? 'green' : 'red'}
          />
          {/* Since last audit */}
          <StatCard
            label="Since last audit"
            value={`${daysSinceAudit}d`}
            color="blue"
          />
        </div>

        {/* ── Row 2: Pre-op checks + Predictive alerts ─────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Pre-op checks today */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gray dark:text-gray-400">
                Pre-op Checks Today
              </h2>
              <Link
                to={`${basePath}/pre-op-checks`}
                className="text-xs font-medium text-brand-blue hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {DEMO_PREOP_AREAS.map((area) => (
                <div key={area.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{area.area}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-brand-gray dark:text-gray-500 sm:inline">
                      {area.operator}
                    </span>
                    {area.passRate !== null ? (
                      <span
                        className={`inline-flex min-w-[3.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${passRateBg(area.passRate)} ${passRateColor(area.passRate)}`}
                      >
                        {area.passRate}%
                      </span>
                    ) : (
                      <span className="inline-flex min-w-[3.5rem] justify-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-brand-gray dark:text-gray-400">
                        Not started
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {DEMO_PREOP_AREAS.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-brand-gray dark:text-gray-500">No areas configured.</p>
                </div>
              )}
            </div>
          </section>

          {/* Right — Predictive alerts */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gray dark:text-gray-400">
                Predictive Alerts
              </h2>
              <Link
                to={`${basePath}/intelligence`}
                className="text-xs font-medium text-brand-blue hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {DEMO_ALERTS.map((alert) => (
                <div key={alert.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-gray dark:text-gray-500 line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                </div>
              ))}
              {DEMO_ALERTS.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-brand-gray dark:text-gray-500">No active alerts.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Row 3: Open CAPAs + Compliance posture ───────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Open CAPAs */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gray dark:text-gray-400">
                Open CAPAs
              </h2>
              <Link
                to={`${basePath}/capas`}
                className="text-xs font-medium text-brand-blue hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {DEMO_CAPAS.map((capa) => (
                <Link
                  key={capa.id}
                  to={`${basePath}/capas`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <UrgencyDot urgency={capa.urgency} />
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {capa.title}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ml-3 text-xs font-medium ${
                      capa.overdue
                        ? 'text-brand-red'
                        : capa.dueLabel === 'Today'
                          ? 'text-brand-amber'
                          : 'text-brand-gray dark:text-gray-400'
                    }`}
                  >
                    {capa.dueLabel}
                  </span>
                </Link>
              ))}
              {DEMO_CAPAS.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-brand-green">All clear — no open CAPAs.</p>
                </div>
              )}
            </div>
          </section>

          {/* Right — Compliance posture */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gray dark:text-gray-400">
                Compliance Posture
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {DEMO_COMPLIANCE.map((fw) => (
                <div key={fw.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        fw.status === 'green'
                          ? 'bg-brand-green'
                          : fw.status === 'amber'
                            ? 'bg-brand-amber'
                            : 'bg-brand-red'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {fw.framework}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      fw.status === 'green'
                        ? 'text-brand-green'
                        : fw.status === 'amber'
                          ? 'text-brand-amber'
                          : 'text-brand-red'
                    }`}
                  >
                    {fw.covered}/{fw.total}
                  </span>
                </div>
              ))}
              {DEMO_COMPLIANCE.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-brand-gray dark:text-gray-500">No frameworks active.</p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5">
              <Link
                to={`${basePath}/compliance`}
                className="text-xs font-medium text-brand-blue hover:underline"
              >
                View gaps and plans
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}) {
  const borderColor = {
    green: 'border-brand-green/20',
    amber: 'border-brand-amber/20',
    red: 'border-brand-red/20',
    blue: 'border-brand-blue/20',
    gray: 'border-gray-200 dark:border-gray-600',
  }[color];

  const valueColor = {
    green: 'text-brand-green',
    amber: 'text-brand-amber',
    red: 'text-brand-red',
    blue: 'text-brand-blue',
    gray: 'text-brand-gray dark:text-gray-400',
  }[color];

  const bgTint = {
    green: 'bg-brand-green-light/40 dark:bg-brand-green/5',
    amber: 'bg-brand-amber-light/40 dark:bg-brand-amber/5',
    red: 'bg-brand-red-light/40 dark:bg-brand-red/5',
    blue: 'bg-brand-blue-light/40 dark:bg-brand-blue/5',
    gray: 'bg-white dark:bg-gray-800',
  }[color];

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgTint} px-4 py-3`}
    >
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-brand-gray dark:text-gray-400">{label}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-brand-red-light dark:bg-brand-red/10 text-brand-red border-brand-red/20',
    medium: 'bg-brand-amber-light dark:bg-brand-amber/10 text-brand-amber border-brand-amber/20',
    low: 'bg-brand-blue-light dark:bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  }[severity];

  const labels = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {labels[severity]}
    </span>
  );
}

function UrgencyDot({ urgency }: { urgency: 'immediate' | '24hr' | '7day' | 'standard' }) {
  const dotColor = {
    immediate: 'bg-brand-red',
    '24hr': 'bg-brand-red',
    '7day': 'bg-brand-amber',
    standard: 'bg-brand-green',
  }[urgency];

  return <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />;
}
