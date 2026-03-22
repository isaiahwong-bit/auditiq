import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFacilityAreas, useRecentSessions } from '../../hooks/use-preop';

export default function PreOpChecks() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { data: areas, isLoading: areasLoading } = useFacilityAreas();
  const { data: sessions, isLoading: sessionsLoading } = useRecentSessions();

  const basePath = `/${orgSlug}/sites/${siteSlug}/pre-op-checks`;

  return (
    <div>
      <PageHeader
        title="Pre-op Checks"
        description="Daily pre-operational inspection sessions"
      />
      <div className="p-6 md:p-8">
        {/* Area list — start a new session */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Start a Check
          </h2>
          {areasLoading ? (
            <p className="text-sm text-brand-gray">Loading areas...</p>
          ) : !areas?.length ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm text-brand-gray">
                No facility areas configured yet. Set them up in Site Settings.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area) => (
                <Link
                  key={area.id}
                  to={`${basePath}/start/${area.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{area.name}</h3>
                    {area.area_type && (
                      <span className="mt-1 inline-block text-xs text-brand-gray">
                        {area.area_type}
                      </span>
                    )}
                  </div>
                  <svg
                    className="h-5 w-5 text-brand-gray"
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Recent Sessions
          </h2>
          {sessionsLoading ? (
            <p className="text-sm text-brand-gray">Loading sessions...</p>
          ) : !sessions?.length ? (
            <p className="text-sm text-brand-gray">No sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  to={`${basePath}/${session.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.facility_areas?.name ?? 'Area'}
                    </p>
                    <p className="text-xs text-brand-gray">
                      {new Date(session.session_date).toLocaleDateString('en-AU')}
                      {session.shift && ` \u00b7 ${session.shift.toUpperCase()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.status === 'complete' ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          (session.pass_rate ?? 100) >= 80
                            ? 'bg-brand-green-light text-brand-green'
                            : (session.pass_rate ?? 100) >= 50
                              ? 'bg-brand-amber-light text-brand-amber'
                              : 'bg-brand-red-light text-brand-red'
                        }`}
                      >
                        {session.pass_rate?.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-brand-blue-light px-2 py-0.5 text-xs font-medium text-brand-blue">
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
