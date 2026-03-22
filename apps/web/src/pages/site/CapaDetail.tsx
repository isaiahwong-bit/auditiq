import { useParams, useNavigate } from 'react-router-dom';
import { useCapa, useUpdateCapaStatus, useCloseCapa } from '../../hooks/use-capas';

const urgencyLabels: Record<string, string> = {
  immediate: 'Immediate (4 hours)',
  '24hr': '24 hours',
  '7day': '7 days',
  standard: 'Standard (28 days)',
};

const urgencyColors: Record<string, string> = {
  immediate: 'bg-brand-red-light text-brand-red',
  '24hr': 'bg-brand-red-light text-brand-red',
  '7day': 'bg-brand-amber-light text-brand-amber',
  standard: 'bg-brand-green-light text-brand-green',
};

const statusColors: Record<string, string> = {
  open: 'bg-brand-blue-light text-brand-blue',
  in_progress: 'bg-brand-amber-light text-brand-amber',
  closed: 'bg-brand-green-light text-brand-green',
  overdue: 'bg-brand-red-light text-brand-red',
};

export default function CapaDetail() {
  const { orgSlug, siteSlug, capaId } = useParams<{
    orgSlug: string;
    siteSlug: string;
    capaId: string;
  }>();
  const navigate = useNavigate();
  const { data: capa, isLoading } = useCapa(capaId);
  const updateStatus = useUpdateCapaStatus();
  const closeCapa = useCloseCapa();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-brand-gray">Loading CAPA...</p>
      </div>
    );
  }

  if (!capa) {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-gray">CAPA not found.</p>
      </div>
    );
  }

  const isOverdue =
    capa.status !== 'closed' && capa.due_date && new Date(capa.due_date) < new Date();
  const effectiveStatus = isOverdue ? 'overdue' : capa.status;
  const isClosed = capa.status === 'closed';

  const handleStartProgress = () => {
    updateStatus.mutate({ capaId: capa.id, status: 'in_progress' });
  };

  const handleClose = () => {
    closeCapa.mutate({ capaId: capa.id });
  };

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 md:px-8">
        <button
          onClick={() => navigate(`/${orgSlug}/sites/${siteSlug}/capas`)}
          className="mb-2 flex items-center gap-1 text-sm text-brand-gray hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to CAPAs
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{capa.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[effectiveStatus] ?? ''}`}>
                {effectiveStatus.replace('_', ' ')}
              </span>
              {capa.urgency && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgencyColors[capa.urgency] ?? ''}`}>
                  {urgencyLabels[capa.urgency] ?? capa.urgency}
                </span>
              )}
            </div>
          </div>
          {!isClosed && (
            <div className="flex gap-2">
              {capa.status === 'open' && (
                <button
                  onClick={handleStartProgress}
                  disabled={updateStatus.isPending}
                  className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  Start Work
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={closeCapa.isPending}
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {closeCapa.isPending ? 'Closing...' : 'Close CAPA'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Details */}
          <div className="space-y-4">
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
                Details
              </h2>
              <dl className="space-y-2 text-sm">
                {capa.description && (
                  <div>
                    <dt className="font-medium text-gray-700">Description</dt>
                    <dd className="mt-0.5 text-gray-600">{capa.description}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Due date</dt>
                  <dd className={isOverdue ? 'font-medium text-brand-red' : 'text-gray-600'}>
                    {capa.due_date
                      ? new Date(capa.due_date).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Created</dt>
                  <dd className="text-gray-600">
                    {new Date(capa.created_at).toLocaleDateString('en-AU')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Assigned to</dt>
                  <dd className="text-gray-600">
                    {capa.user_profiles?.full_name ?? 'Unassigned'}
                  </dd>
                </div>
                {capa.closed_at && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Closed</dt>
                    <dd className="text-gray-600">
                      {new Date(capa.closed_at).toLocaleDateString('en-AU')}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          {/* Evidence */}
          <div>
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
                Evidence
              </h2>
              {capa.evidence_urls?.length > 0 ? (
                <ul className="space-y-2">
                  {capa.evidence_urls.map((url, i) => (
                    <li key={i} className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2">
                      <svg className="h-4 w-4 text-brand-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="truncate text-sm text-brand-blue">{url}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-brand-gray">
                  {isClosed ? 'No evidence attached.' : 'No evidence yet. Submit evidence to close this CAPA.'}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
