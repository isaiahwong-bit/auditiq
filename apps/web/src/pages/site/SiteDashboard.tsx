import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSite } from '../../hooks/use-site';
import { useOrg } from '../../hooks/use-org';
import { useAuth } from '../../hooks/use-auth';
import { supabase } from '../../lib/supabase';

interface PreopArea {
  id: string;
  area: string;
  passRate: number | null;
}

interface DashAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface DashCapa {
  id: string;
  title: string;
  urgency: 'immediate' | '24hr' | '7day' | 'standard';
  dueLabel: string;
  overdue: boolean;
}

interface DashCompliance {
  id: string;
  framework: string;
  covered: number;
  total: number;
  status: 'green' | 'amber' | 'red';
}

function useDashboardData(siteId: string | undefined) {
  const today = new Date().toISOString().split('T')[0];

  const preop = useQuery({
    queryKey: ['dashboard-preop', siteId, today],
    queryFn: async (): Promise<PreopArea[]> => {
      const { data: areas } = await supabase
        .from('facility_areas')
        .select('id, name')
        .eq('site_id', siteId!)
        .eq('is_active', true)
        .order('display_order');

      if (!areas?.length) return [];

      const { data: sessions } = await supabase
        .from('pre_op_sessions')
        .select('id, facility_area_id, pass_rate, status')
        .eq('site_id', siteId!)
        .eq('session_date', today);

      return areas.map((a) => {
        const session = sessions?.find((s) => s.facility_area_id === a.id);
        return {
          id: a.id,
          area: a.name,
          passRate: session?.status === 'complete' ? Number(session.pass_rate) : null,
        };
      });
    },
    enabled: !!siteId,
  });

  const alerts = useQuery({
    queryKey: ['dashboard-alerts', siteId],
    queryFn: async (): Promise<DashAlert[]> => {
      const { data } = await supabase
        .from('intelligence_alerts')
        .select('id, title, description, severity')
        .eq('site_id', siteId!)
        .eq('status', 'active')
        .order('generated_at', { ascending: false })
        .limit(5);
      return (data ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        severity: a.severity as 'high' | 'medium' | 'low',
      }));
    },
    enabled: !!siteId,
  });

  const capas = useQuery({
    queryKey: ['dashboard-capas', siteId],
    queryFn: async (): Promise<DashCapa[]> => {
      const { data } = await supabase
        .from('capas')
        .select('id, title, urgency, due_date, status')
        .eq('site_id', siteId!)
        .in('status', ['open', 'in_progress', 'overdue'])
        .order('due_date')
        .limit(6);
      const now = new Date();
      return (data ?? []).map((c) => {
        const due = c.due_date ? new Date(c.due_date) : null;
        const overdue = due ? due < now : false;
        let dueLabel = '\u2014';
        if (due) {
          const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) dueLabel = 'Overdue';
          else if (diff === 0) dueLabel = 'Today';
          else dueLabel = `${diff} day${diff === 1 ? '' : 's'}`;
        }
        return {
          id: c.id,
          title: c.title,
          urgency: c.urgency as 'immediate' | '24hr' | '7day' | 'standard',
          dueLabel,
          overdue,
        };
      });
    },
    enabled: !!siteId,
  });

  const compliance = useQuery({
    queryKey: ['dashboard-compliance', siteId],
    queryFn: async (): Promise<DashCompliance[]> => {
      const { data: siteFrameworks } = await supabase
        .from('site_frameworks')
        .select('framework_id, frameworks(id, code, name)')
        .eq('site_id', siteId!)
        .eq('enabled', true);
      if (!siteFrameworks?.length) return [];

      const results: DashCompliance[] = [];
      for (const sf of siteFrameworks) {
        const fw = (sf as Record<string, unknown>).frameworks as { id: string; code: string; name: string } | null;
        if (!fw) continue;
        const { count: totalCount } = await supabase
          .from('framework_clauses')
          .select('id', { count: 'exact', head: true })
          .eq('framework_id', fw.id);
        const { data: coveredItems } = await supabase
          .from('check_item_clause_refs')
          .select('clause_id, check_items!inner(site_id)')
          .eq('check_items.site_id', siteId!);
        const { data: allClauses } = await supabase
          .from('framework_clauses')
          .select('id')
          .eq('framework_id', fw.id);
        const clauseIds = new Set((allClauses ?? []).map((c) => c.id));
        const covered = (coveredItems ?? []).filter((ci) => clauseIds.has(ci.clause_id)).length;
        const total = totalCount ?? 0;
        const ratio = total > 0 ? covered / total : 0;
        results.push({
          id: fw.id,
          framework: fw.code.toUpperCase(),
          covered,
          total,
          status: ratio >= 1 ? 'green' : ratio >= 0.7 ? 'amber' : 'red',
        });
      }
      return results;
    },
    enabled: !!siteId,
  });

  const auditDays = useQuery({
    queryKey: ['dashboard-last-audit', siteId],
    queryFn: async (): Promise<number | null> => {
      const { data } = await supabase
        .from('audits')
        .select('completed_at')
        .eq('site_id', siteId!)
        .eq('status', 'complete')
        .order('completed_at', { ascending: false })
        .limit(1);
      if (!data?.length || !data[0].completed_at) return null;
      const diff = Math.floor(
        (Date.now() - new Date(data[0].completed_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      return diff;
    },
    enabled: !!siteId,
  });

  const frameworks = useQuery({
    queryKey: ['dashboard-frameworks', siteId],
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase
        .from('site_frameworks')
        .select('frameworks(code)')
        .eq('site_id', siteId!)
        .eq('enabled', true);
      return (data ?? [])
        .map((sf) => {
          const fw = (sf as Record<string, unknown>).frameworks as { code: string } | null;
          return fw?.code?.toUpperCase() ?? '';
        })
        .filter(Boolean);
    },
    enabled: !!siteId,
  });

  return { preop, alerts, capas, compliance, auditDays, frameworks };
}

// -- Helpers ------------------------------------------------------------------

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
  if (rate >= 90) return 'bg-brand-green/10';
  if (rate >= 70) return 'bg-brand-amber/10';
  return 'bg-brand-red/10';
}

// -- Shared card class --------------------------------------------------------

const glassCard =
  'bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10';

// -- Main Component -----------------------------------------------------------

export default function SiteDashboard() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { site } = useSite();
  useOrg();
  useAuth();

  const basePath = `/${orgSlug}/sites/${siteSlug}`;
  const { preop, alerts, capas, compliance, auditDays, frameworks } = useDashboardData(site?.id);

  const isLoading =
    preop.isLoading || alerts.isLoading || capas.isLoading || compliance.isLoading || auditDays.isLoading || frameworks.isLoading;

  const preopAreas = preop.data ?? [];
  const alertsList = alerts.data ?? [];
  const capasList = capas.data ?? [];
  const complianceList = compliance.data ?? [];
  const activeFrameworks = frameworks.data ?? [];
  const daysSinceAudit = auditDays.data;

  const completedAreas = preopAreas.filter((a) => a.passRate !== null);
  const avgScore =
    completedAreas.length > 0
      ? Math.round(
          completedAreas.reduce((sum, a) => sum + (a.passRate ?? 0), 0) / completedAreas.length * 10,
        ) / 10
      : null;
  const openCapaCount = capasList.length;
  const overdueCount = capasList.filter((c) => c.overdue).length;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      {/* -- Header ---------------------------------------------------------- */}
      <div className="px-6 pt-8 pb-2 md:px-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {site?.name ?? 'Site Dashboard'}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {todayFormatted()}
              {activeFrameworks.length > 0 && (
                <>
                  {' \u00b7 '}
                  {activeFrameworks.map((fw, i) => (
                    <span key={fw}>
                      <span className="font-medium text-gray-600 dark:text-gray-300">{fw}</span>
                      {i < activeFrameworks.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {' active'}
                </>
              )}
            </p>
          </div>
          <Link
            to={`${basePath}/audits`}
            className="shrink-0 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 hover:bg-gray-800 transition-all dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:shadow-white/5"
          >
            Start audit
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 md:px-10 space-y-6">
        {/* -- Row 1: Stat cards (bento top row) ----------------------------- */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pre-op score today"
            value={avgScore !== null ? `${avgScore}%` : '--'}
            color={avgScore !== null ? (avgScore >= 90 ? 'green' : avgScore >= 70 ? 'amber' : 'red') : 'gray'}
          />
          <StatCard
            label="Open CAPAs"
            value={String(openCapaCount)}
            color={openCapaCount === 0 ? 'green' : openCapaCount <= 3 ? 'amber' : 'red'}
          />
          <StatCard
            label="Overdue"
            value={String(overdueCount)}
            color={overdueCount === 0 ? 'green' : 'red'}
          />
          <StatCard
            label="Since last audit"
            value={daysSinceAudit !== null ? `${daysSinceAudit}d` : '--'}
            color="blue"
          />
        </div>

        {/* -- Row 2: Pre-op checks + Predictive alerts ---------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pre-op checks today */}
          <section className={glassCard}>
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Pre-op Checks Today
              </h2>
              <Link
                to={`${basePath}/pre-op-checks`}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="px-6 pb-5">
              <div className="space-y-1">
                {preopAreas.map((area, i) => (
                  <div
                    key={area.id}
                    className={`flex items-center justify-between py-3 ${
                      i < preopAreas.length - 1
                        ? 'border-b border-gray-100 dark:border-white/5'
                        : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {area.area}
                    </p>
                    {area.passRate !== null ? (
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold tabular-nums ${passRateBg(area.passRate)} ${passRateColor(area.passRate)}`}
                      >
                        {area.passRate}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-gray-100/80 dark:bg-white/5 px-3 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                        Not started
                      </span>
                    )}
                  </div>
                ))}
                {preopAreas.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      No areas configured.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Predictive alerts */}
          <section className={glassCard}>
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Predictive Alerts
              </h2>
              <Link
                to={`${basePath}/intelligence`}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="px-6 pb-5">
              <div className="space-y-1">
                {alertsList.map((alert, i) => (
                  <div
                    key={alert.id}
                    className={`py-3 ${
                      i < alertsList.length - 1
                        ? 'border-b border-gray-100 dark:border-white/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                  </div>
                ))}
                {alertsList.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      No active alerts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* -- Row 3: Open CAPAs + Compliance posture ------------------------ */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Open CAPAs */}
          <section className={glassCard}>
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Open CAPAs
              </h2>
              <Link
                to={`${basePath}/capas`}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="px-6 pb-5">
              <div className="space-y-1">
                {capasList.map((capa, i) => (
                  <Link
                    key={capa.id}
                    to={`${basePath}/capas`}
                    className={`flex items-center justify-between py-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors -mx-2 px-2 ${
                      i < capasList.length - 1
                        ? 'border-b border-gray-100 dark:border-white/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <UrgencyDot urgency={capa.urgency} />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {capa.title}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 ml-3 text-xs font-semibold tabular-nums ${
                        capa.overdue
                          ? 'text-brand-red'
                          : capa.dueLabel === 'Today'
                            ? 'text-brand-amber'
                            : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {capa.dueLabel}
                    </span>
                  </Link>
                ))}
                {capasList.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-brand-green font-medium">
                      All clear -- no open CAPAs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Compliance posture */}
          <section className={glassCard}>
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Compliance Posture
              </h2>
              <Link
                to={`${basePath}/compliance`}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                View gaps
              </Link>
            </div>
            <div className="px-6 pb-5">
              <div className="space-y-1">
                {complianceList.map((fw, i) => {
                  const ratio = fw.total > 0 ? fw.covered / fw.total : 0;
                  return (
                    <div
                      key={fw.id}
                      className={`py-3 ${
                        i < complianceList.length - 1
                          ? 'border-b border-gray-100 dark:border-white/5'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              fw.status === 'green'
                                ? 'bg-brand-green'
                                : fw.status === 'amber'
                                  ? 'bg-brand-amber'
                                  : 'bg-brand-red'
                            }`}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {fw.framework}
                          </span>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                          {fw.covered}/{fw.total}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            fw.status === 'green'
                              ? 'bg-brand-green'
                              : fw.status === 'amber'
                                ? 'bg-brand-amber'
                                : 'bg-brand-red'
                          }`}
                          style={{ width: `${Math.round(ratio * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {complianceList.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      No frameworks active.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// -- Sub-components -----------------------------------------------------------

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}) {
  const bgTint = {
    green: 'bg-brand-green/5 dark:bg-brand-green/5',
    amber: 'bg-brand-amber/5 dark:bg-brand-amber/5',
    red: 'bg-brand-red/5 dark:bg-brand-red/5',
    blue: 'bg-brand-blue/5 dark:bg-brand-blue/5',
    gray: 'bg-white/70 dark:bg-white/5',
  }[color];

  const valueColor = {
    green: 'text-brand-green',
    amber: 'text-brand-amber',
    red: 'text-brand-red',
    blue: 'text-brand-blue',
    gray: 'text-gray-400 dark:text-gray-500',
  }[color];

  return (
    <div
      className={`${glassCard} ${bgTint} px-6 py-5`}
    >
      <p className={`text-4xl font-bold tabular-nums tracking-tight ${valueColor}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-brand-red/10 text-brand-red',
    medium: 'bg-brand-amber/10 text-brand-amber',
    low: 'bg-brand-blue/10 text-brand-blue',
  }[severity];

  const labels = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles}`}>
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

// -- Loading Skeleton ---------------------------------------------------------

function SkeletonBox({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/60 dark:bg-white/10 ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950">
      {/* Header skeleton */}
      <div className="px-6 pt-8 pb-2 md:px-10">
        <div className="flex items-start justify-between">
          <div>
            <SkeletonBox className="h-8 w-56" />
            <SkeletonBox className="mt-3 h-4 w-72" />
          </div>
          <SkeletonBox className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <div className="px-6 py-6 md:px-10 space-y-6">
        {/* Row 1: Stat cards skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`${glassCard} px-6 py-5`}
            >
              <SkeletonBox className="h-10 w-20" />
              <SkeletonBox className="mt-3 h-3 w-28" />
            </div>
          ))}
        </div>

        {/* Row 2: Two panels skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((panel) => (
            <div key={panel} className={glassCard}>
              <div className="flex items-center justify-between px-6 py-4">
                <SkeletonBox className="h-4 w-36" />
                <SkeletonBox className="h-3 w-14" />
              </div>
              <div className="px-6 pb-5 space-y-1">
                {[1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                  >
                    <SkeletonBox className="h-4 w-40" />
                    <SkeletonBox className="h-6 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Two panels skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((panel) => (
            <div key={panel} className={glassCard}>
              <div className="flex items-center justify-between px-6 py-4">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-14" />
              </div>
              <div className="px-6 pb-5 space-y-1">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                  >
                    <SkeletonBox className="h-4 w-44" />
                    <SkeletonBox className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
