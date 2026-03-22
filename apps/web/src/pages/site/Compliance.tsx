import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useAllFrameworks,
  useSiteFrameworks,
  useToggleFramework,
  useGapAnalysis,
  useCreatePlan,
} from '../../hooks/use-compliance';
import type { ClauseStatus } from '../../hooks/use-compliance-types';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Compliance Page
 * Route: /[org]/sites/[site-slug]/settings/compliance
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface ActivationNotification {
  frameworkName: string;
  frameworkCode: string;
  covered: number;
  total: number;
  newGaps: number;
  areasAffected: number;
}

export default function Compliance() {
  const { data: allFrameworks, isLoading: fwLoading } = useAllFrameworks();
  const { data: siteFrameworks } = useSiteFrameworks();
  const toggleFramework = useToggleFramework();
  const { data: gapData, isLoading: gapLoading } = useGapAnalysis();

  const [activationNotice, setActivationNotice] = useState<ActivationNotification | null>(null);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const prevGapDataRef = useRef(gapData);

  const enabledIds = new Set(
    (siteFrameworks ?? []).filter((sf) => sf.enabled).map((sf) => sf.framework_id),
  );

  // When gap data updates after a framework activation, compute notification values
  useEffect(() => {
    if (gapData && activationNotice && !noticeVisible) {
      // Gap data has refreshed — update the notification with real numbers
      const totalClauses = gapData.summary.total_clauses;
      const covered = gapData.summary.covered;
      const gaps = gapData.summary.gaps;
      const areasWithGaps = gapData.areas.filter((a) => a.gaps > 0).length;

      setActivationNotice((prev) =>
        prev
          ? {
              ...prev,
              covered,
              total: totalClauses,
              newGaps: gaps,
              areasAffected: areasWithGaps,
            }
          : null,
      );
      setNoticeVisible(true);
    }
    prevGapDataRef.current = gapData;
  }, [gapData, activationNotice, noticeVisible]);

  const handleToggle = useCallback(
    async (frameworkId: string, frameworkName: string, frameworkCode: string, currentlyEnabled: boolean) => {
      if (!currentlyEnabled) {
        // Activating — prepare notification state (values will fill in after gap data refreshes)
        setActivationNotice({
          frameworkName,
          frameworkCode,
          covered: 0,
          total: 0,
          newGaps: 0,
          areasAffected: 0,
        });
        setNoticeVisible(false);
      } else {
        // Deactivating — clear any notification
        setActivationNotice(null);
        setNoticeVisible(false);
      }

      await toggleFramework.mutateAsync({
        framework_id: frameworkId,
        enabled: !currentlyEnabled,
      });
    },
    [toggleFramework],
  );

  const dismissNotice = useCallback(() => {
    setNoticeVisible(false);
    setActivationNotice(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-700 dark:bg-gray-800 md:px-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Compliance frameworks
        </h1>
        <p className="mt-1 text-sm text-brand-gray dark:text-gray-400">
          Kelso NSW &mdash; Toggle active standards. Gaps surface by area below
        </p>
      </div>

      <div className="px-6 py-6 md:px-8">
        {/* ── Framework list ───────────────────────────────────────────── */}
        <section className="mb-6">
          {fwLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              {(allFrameworks ?? []).map((fw, idx) => {
                const isEnabled = enabledIds.has(fw.id);
                const isLast = idx === (allFrameworks ?? []).length - 1;

                return (
                  <div
                    key={fw.id}
                    className={`
                      relative flex items-center justify-between px-4 py-3.5 transition-colors
                      ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}
                      ${isEnabled ? 'bg-brand-green-light/30 dark:bg-brand-green/10' : ''}
                    `}
                  >
                    {/* Active left border indicator */}
                    {isEnabled && (
                      <div className="absolute inset-y-0 left-0 w-[3px] rounded-r bg-brand-green" />
                    )}

                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          isEnabled ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-500'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {fw.name}
                        </p>
                        <p className="text-xs text-brand-gray dark:text-gray-400">
                          {fw.version}
                          {fw.type && (
                            <span className="ml-1.5 inline-block rounded-full bg-gray-100 px-1.5 py-px text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {fw.type}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(fw.id, fw.name, fw.code, isEnabled)}
                      disabled={toggleFramework.isPending}
                      aria-label={`${isEnabled ? 'Deactivate' : 'Activate'} ${fw.name}`}
                      className={`
                        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center
                        rounded-full border-2 border-transparent transition-colors
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2
                        disabled:cursor-not-allowed disabled:opacity-50
                        dark:focus-visible:ring-offset-gray-800
                        ${isEnabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-600'}
                      `}
                    >
                      <span
                        className={`
                          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
                          ring-0 transition-transform
                          ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Activation notification banner ───────────────────────────── */}
        {noticeVisible && activationNotice && (
          <div
            className={`
              mb-6 overflow-hidden rounded-lg border border-brand-blue/30 bg-gradient-to-r
              from-brand-blue/15 to-brand-blue-light
              dark:border-brand-blue/40 dark:from-brand-blue/20 dark:to-brand-blue/10
              animate-in fade-in slide-in-from-top-2
            `}
            style={{
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <div className="flex items-start gap-3 px-5 py-4">
              {/* Check-circle icon */}
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 dark:bg-brand-blue/30">
                <svg
                  className="h-5 w-5 text-brand-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activationNotice.frameworkName}{' '}
                  <span className="font-normal text-brand-gray dark:text-gray-300">activated</span>
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Your existing check items already satisfy{' '}
                  <span className="font-semibold text-brand-green">
                    {activationNotice.covered} of {activationNotice.total}
                  </span>{' '}
                  {activationNotice.frameworkName} requirements.{' '}
                  <span className="font-semibold text-brand-red">
                    {activationNotice.newGaps} new gap{activationNotice.newGaps !== 1 ? 's' : ''}
                  </span>{' '}
                  identified across{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {activationNotice.areasAffected} facility area
                    {activationNotice.areasAffected !== 1 ? 's' : ''}
                  </span>
                  .
                </p>
              </div>
              <button
                onClick={dismissNotice}
                className="mt-0.5 shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Dismiss notification"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Summary bar ──────────────────────────────────────────────── */}
        {gapData && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              label="Active frameworks"
              value={gapData.summary.active_frameworks}
              color="blue"
            />
            <SummaryCard
              label="Gaps"
              value={gapData.summary.gaps}
              color="red"
            />
            <SummaryCard
              label="Plans in place"
              value={gapData.summary.plans_in_place}
              color="amber"
            />
            <SummaryCard
              label="Unaddressed"
              value={gapData.summary.gaps - gapData.summary.plans_in_place}
              color="red"
            />
          </div>
        )}

        {/* ── Area section ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-gray dark:text-gray-400">
            Gaps by facility area &mdash; tap an area to review
          </h2>
          {gapLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : !gapData?.areas.length ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-800">
              <svg
                className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No facility areas configured, or no frameworks active.
              </p>
              <p className="mt-1 text-xs text-brand-gray dark:text-gray-500">
                Toggle a framework above to begin gap analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {gapData.areas.map((area) => (
                <AreaAccordion key={area.area_id} area={area} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Inline keyframes for the notification animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Summary Card
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'green' | 'amber' | 'red' | 'blue';
}) {
  const bgStyles: Record<string, string> = {
    green: 'border-brand-green/20 bg-brand-green-light dark:bg-brand-green/10 dark:border-brand-green/20',
    amber: 'border-brand-amber/20 bg-brand-amber-light dark:bg-brand-amber/10 dark:border-brand-amber/20',
    red: 'border-brand-red/20 bg-brand-red-light dark:bg-brand-red/10 dark:border-brand-red/20',
    blue: 'border-brand-blue/20 bg-brand-blue-light dark:bg-brand-blue/10 dark:border-brand-blue/20',
  };
  const textStyles: Record<string, string> = {
    green: 'text-brand-green',
    amber: 'text-brand-amber',
    red: 'text-brand-red',
    blue: 'text-brand-blue',
  };

  return (
    <div className={`rounded-lg border p-3 ${bgStyles[color]}`}>
      <p className={`text-2xl font-bold tabular-nums ${textStyles[color]}`}>{value}</p>
      <p className="text-xs text-brand-gray dark:text-gray-400">{label}</p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Area Accordion
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AreaAccordion({
  area,
}: {
  area: {
    area_id: string;
    area_name: string;
    total_clauses: number;
    covered: number;
    gaps: number;
    plans_in_place: number;
    clauses: ClauseStatus[];
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Accordion header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 dark:hover:bg-gray-700/50"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-4 w-4 shrink-0 text-brand-gray transition-transform duration-200 dark:text-gray-400 ${
              expanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {area.area_name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {area.covered > 0 && (
            <span className="inline-flex items-center rounded-full bg-brand-green-light px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand-green dark:bg-brand-green/15">
              <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {area.covered}
            </span>
          )}
          {area.gaps > 0 && (
            <span className="inline-flex items-center rounded-full bg-brand-red-light px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand-red dark:bg-brand-red/15">
              {area.gaps}
            </span>
          )}
          {area.plans_in_place > 0 && (
            <span className="inline-flex items-center rounded-full bg-brand-amber-light px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand-amber dark:bg-brand-amber/15">
              {area.plans_in_place}
            </span>
          )}
        </div>
      </button>

      {/* Expanded clause list */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {area.clauses.length === 0 ? (
            <p className="px-4 py-4 text-sm text-brand-gray dark:text-gray-400">
              No clauses mapped to this area.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {area.clauses.map((clause) => (
                <ClauseRow key={clause.clause_id} clause={clause} areaId={area.area_id} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Clause Row
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ClauseRow({ clause, areaId }: { clause: ClauseStatus; areaId: string }) {
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planDesc, setPlanDesc] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [showRequirement, setShowRequirement] = useState(false);
  const createPlan = useCreatePlan();

  const handleCreatePlan = async () => {
    if (!planDesc.trim()) return;
    await createPlan.mutateAsync({
      clause_id: clause.clause_id,
      facility_area_id: areaId,
      description: planDesc,
      target_date: planDate || null,
    });
    setShowPlanForm(false);
    setPlanDesc('');
    setPlanDate('');
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Status badge */}
        {clause.covered ? (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-green-light px-2 py-0.5 text-xs font-semibold text-brand-green dark:bg-brand-green/15">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Covered
          </span>
        ) : clause.has_plan ? (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-amber-light px-2 py-0.5 text-xs font-semibold text-brand-amber dark:bg-brand-amber/15">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
            </svg>
            NCAR eligible
          </span>
        ) : (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-red-light px-2 py-0.5 text-xs font-semibold text-brand-red dark:bg-brand-red/15">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
            </svg>
            Gap
          </span>
        )}

        <div className="min-w-0 flex-1">
          {/* Clause reference + zero tolerance flag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-brand-blue dark:text-blue-400">
              [{clause.framework_code}] {clause.clause_ref}
            </span>
            {clause.zero_tolerance && (
              <span className="rounded bg-brand-red-light px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-brand-red dark:bg-brand-red/15">
                Zero tolerance
              </span>
            )}
          </div>

          {/* Clause title */}
          <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
            {clause.clause_title}
          </p>

          {/* Covered: show covering check item */}
          {clause.covered && clause.covering_check_item_name && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-gray dark:text-gray-400">
              <svg className="h-3.5 w-3.5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              Covered by: {clause.covering_check_item_name}
            </p>
          )}

          {/* NCAR eligible: show plan details */}
          {clause.has_plan && clause.plan_description && (
            <div className="mt-2 rounded-lg border border-brand-amber/20 bg-brand-amber-light/50 px-3 py-2.5 dark:border-brand-amber/30 dark:bg-brand-amber/10">
              <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                {clause.plan_description}
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-brand-amber">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Visible to auditors in report
              </p>
            </div>
          )}

          {/* Expandable requirement text */}
          <button
            onClick={() => setShowRequirement(!showRequirement)}
            className="mt-1.5 text-xs font-medium text-brand-blue transition-colors hover:text-brand-blue/80 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {showRequirement ? 'Hide requirement' : 'Show requirement'}
          </button>
          {showRequirement && (
            <p className="mt-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {clause.requirement}
            </p>
          )}

          {/* Gap actions: create rectification plan */}
          {!clause.covered && !clause.has_plan && (
            <div className="mt-2.5">
              {!showPlanForm ? (
                <button
                  onClick={() => setShowPlanForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-red/30 bg-brand-red-light/50 px-3 py-1.5 text-xs font-semibold text-brand-red transition-colors hover:border-brand-red/50 hover:bg-brand-red-light dark:border-brand-red/40 dark:bg-brand-red/10 dark:hover:bg-brand-red/20"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create rectification plan
                </button>
              ) : (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Describe the rectification plan
                    </label>
                    <textarea
                      value={planDesc}
                      onChange={(e) => setPlanDesc(e.target.value)}
                      placeholder="e.g. Install additional hand wash station in packing area..."
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Target completion date
                    </label>
                    <input
                      type="date"
                      value={planDate}
                      onChange={(e) => setPlanDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreatePlan}
                      disabled={!planDesc.trim() || createPlan.isPending}
                      className="inline-flex items-center rounded-md bg-brand-amber px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-amber/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {createPlan.isPending ? (
                        <>
                          <svg className="mr-1.5 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save plan'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowPlanForm(false);
                        setPlanDesc('');
                        setPlanDate('');
                      }}
                      className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
