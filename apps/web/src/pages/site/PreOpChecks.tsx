import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFacilityAreas, useRecentSessions } from '../../hooks/use-preop';
import type { CareLevel } from '@auditarmour/types';

const CARE_LEVELS: Array<{ value: CareLevel | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'high', label: 'High Care' },
  { value: 'medium', label: 'Medium Care' },
  { value: 'low', label: 'Low Care' },
];

function careLevelPillClasses(level: CareLevel | null, isActive: boolean): string {
  if (!isActive) {
    return 'bg-white/60 text-gray-600 hover:bg-white/80 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10';
  }
  switch (level) {
    case 'high':
      return 'bg-red-50/80 text-brand-red border-red-200/50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30';
    case 'medium':
      return 'bg-amber-50/80 text-brand-amber border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
    case 'low':
      return 'bg-emerald-50/80 text-brand-green border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
    default:
      return 'bg-gray-900 text-white dark:bg-white dark:text-gray-900';
  }
}

function careLevelBadge(level: string): string {
  switch (level) {
    case 'high':
      return 'bg-red-50/80 text-brand-red dark:bg-red-500/10 dark:text-red-400';
    case 'medium':
      return 'bg-amber-50/80 text-brand-amber dark:bg-amber-500/10 dark:text-amber-400';
    case 'low':
      return 'bg-emerald-50/80 text-brand-green dark:bg-emerald-500/10 dark:text-emerald-400';
    default:
      return 'bg-gray-100/80 text-gray-500 dark:bg-white/10 dark:text-gray-400';
  }
}

export default function PreOpChecks() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const [selectedCareLevel, setSelectedCareLevel] = useState<CareLevel | null>(null);
  const { data: areas, isLoading: areasLoading } = useFacilityAreas(selectedCareLevel ?? undefined);
  const { data: sessions, isLoading: sessionsLoading } = useRecentSessions();

  const basePath = `/${orgSlug}/sites/${siteSlug}/pre-op-checks`;

  return (
    <div className="bg-transparent">
      <PageHeader
        title="Pre-op Checks"
        description="Daily pre-operational inspection sessions"
      />
      <div className="p-6 md:p-8">
        {/* Care level filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CARE_LEVELS.map((cl) => (
            <button
              key={cl.value ?? 'all'}
              onClick={() => setSelectedCareLevel(cl.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${careLevelPillClasses(
                cl.value,
                selectedCareLevel === cl.value,
              )}`}
            >
              {cl.label}
            </button>
          ))}
        </div>

        {/* Area list — start a new session */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Start a Check
          </h2>
          {areasLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading areas...</p>
          ) : !areas?.length ? (
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No facility areas configured yet. Set them up in Site Settings.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area) => (
                <Link
                  key={area.id}
                  to={`${basePath}/start/${area.id}`}
                  className="flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-xl p-4 shadow-sm border border-white/20 hover:bg-gray-50/50 transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{area.name}</h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      {area.area_type && (
                        <span className="inline-block text-xs text-gray-500 dark:text-gray-400">
                          {area.area_type}
                        </span>
                      )}
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${careLevelBadge(
                          area.care_level,
                        )}`}
                      >
                        {area.care_level} care
                      </span>
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400 dark:text-gray-500"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent sessions */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Recent Sessions
          </h2>
          {sessionsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading sessions...</p>
          ) : !sessions?.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  to={`${basePath}/${session.id}`}
                  className="flex items-center justify-between rounded-xl bg-white/70 backdrop-blur-xl px-4 py-3.5 shadow-sm border border-white/20 hover:bg-gray-50/50 transition-colors dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.facility_areas?.name ?? 'Area'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.session_date).toLocaleDateString('en-AU')}
                      {session.shift && ` \u00b7 ${session.shift.toUpperCase()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.status === 'complete' ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          (session.pass_rate ?? 100) >= 80
                            ? 'bg-emerald-50/80 text-brand-green dark:bg-emerald-500/10 dark:text-emerald-400'
                            : (session.pass_rate ?? 100) >= 50
                              ? 'bg-amber-50/80 text-brand-amber dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-red-50/80 text-brand-red dark:bg-red-500/10 dark:text-red-400'
                        }`}
                      >
                        {session.pass_rate?.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50/80 px-2.5 py-0.5 text-xs font-medium text-brand-blue dark:bg-blue-500/10 dark:text-blue-400">
                        In progress
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
