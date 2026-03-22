import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePreOpSession, useSessionResponses } from '../../hooks/use-preop';

export default function PreOpSummary() {
  const { orgSlug, siteSlug, sessionId } = useParams<{
    orgSlug: string;
    siteSlug: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const { data: session, isLoading: sessionLoading } = usePreOpSession(sessionId);
  const { data: responses, isLoading: responsesLoading } = useSessionResponses(sessionId);

  const basePath = `/${orgSlug}/sites/${siteSlug}/pre-op-checks`;

  if (sessionLoading || responsesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-brand-gray">Loading summary...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-brand-gray">Session not found.</p>
      </div>
    );
  }

  const passed = responses?.filter((r) => r.result === 'pass') ?? [];
  const failed = responses?.filter((r) => r.result === 'fail') ?? [];
  const na = responses?.filter((r) => r.result === 'na') ?? [];

  const scoreColor =
    (session.pass_rate ?? 100) >= 80
      ? 'text-brand-green'
      : (session.pass_rate ?? 100) >= 50
        ? 'text-brand-amber'
        : 'text-brand-red';

  return (
    <div className="flex min-h-screen flex-col bg-white md:min-h-0">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-4 md:px-8">
        <button
          onClick={() => navigate(basePath)}
          className="mb-2 flex items-center gap-1 text-sm text-brand-gray hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Checks
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Session Summary</h1>
        <p className="text-sm text-brand-gray">
          {new Date(session.session_date).toLocaleDateString('en-AU')}
          {session.shift && ` \u00b7 ${session.shift.toUpperCase()} shift`}
        </p>
      </div>

      <div className="flex-1 p-4 md:p-8">
        {/* Score card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm font-medium text-brand-gray">Overall Score</p>
          <p className={`text-4xl font-bold ${scoreColor}`}>
            {session.pass_rate?.toFixed(1) ?? '—'}%
          </p>
          <div className="mt-3 flex justify-center gap-6 text-sm">
            <span className="text-brand-green">{passed.length} passed</span>
            <span className="text-brand-red">{failed.length} failed</span>
            <span className="text-brand-gray">{na.length} N/A</span>
          </div>
        </div>

        {/* Failed items */}
        {failed.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-red">
              Failed Items
            </h2>
            <ul className="divide-y divide-gray-100 rounded-lg border border-brand-red/20 bg-brand-red-light">
              {failed.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {r.check_items?.name ?? 'Check item'}
                  </p>
                  {r.notes && <p className="mt-0.5 text-xs text-brand-gray">{r.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* All responses */}
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            All Responses
          </h2>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {responses?.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.check_items?.name ?? 'Check item'}
                  </p>
                  {r.notes && <p className="mt-0.5 text-xs text-brand-gray">{r.notes}</p>}
                </div>
                <ResultChip result={r.result} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-200 p-4 md:px-8">
        <Link
          to={basePath}
          className="block w-full rounded-md bg-brand-green px-4 py-3 text-center text-sm font-medium text-white hover:bg-opacity-90 md:w-auto md:inline-block"
        >
          Done
        </Link>
      </div>
    </div>
  );
}

function ResultChip({ result }: { result: string | null }) {
  switch (result) {
    case 'pass':
      return (
        <span className="rounded-full bg-brand-green-light px-2 py-0.5 text-xs font-medium text-brand-green">
          Pass
        </span>
      );
    case 'fail':
      return (
        <span className="rounded-full bg-brand-red-light px-2 py-0.5 text-xs font-medium text-brand-red">
          Fail
        </span>
      );
    case 'na':
      return (
        <span className="rounded-full bg-brand-gray-light px-2 py-0.5 text-xs font-medium text-brand-gray">
          N/A
        </span>
      );
    default:
      return null;
  }
}
