import { useParams, useNavigate } from 'react-router-dom';
import { useAudit, useStartAudit, useCompleteAudit } from '../../hooks/use-audits';
import { FindingEntry } from '../../components/audit/FindingEntry';

const riskColors: Record<string, string> = {
  critical: 'bg-brand-red-light text-brand-red',
  high: 'bg-brand-red-light text-brand-red',
  medium: 'bg-brand-amber-light text-brand-amber',
  low: 'bg-brand-green-light text-brand-green',
};

export default function AuditDetail() {
  const { orgSlug, siteSlug, auditId } = useParams<{
    orgSlug: string;
    siteSlug: string;
    auditId: string;
  }>();
  const navigate = useNavigate();
  const { data: audit, isLoading, refetch } = useAudit(auditId);
  const startAudit = useStartAudit();
  const completeAudit = useCompleteAudit();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-brand-gray">Loading audit...</p>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-gray">Audit not found.</p>
      </div>
    );
  }

  const canAddFindings = audit.status === 'in_progress';
  const canStart = audit.status === 'draft';
  const canComplete = audit.status === 'in_progress';

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 md:px-8">
        <button
          onClick={() => navigate(`/${orgSlug}/sites/${siteSlug}/audits`)}
          className="mb-2 flex items-center gap-1 text-sm text-brand-gray hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Audits
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {audit.audit_type?.replace('_', ' ')} audit
            </h1>
            <p className="text-sm text-brand-gray">
              {new Date(audit.created_at).toLocaleDateString('en-AU')}
              {audit.overall_score !== null && ` \u00b7 Score: ${audit.overall_score}%`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canStart && (
              <button
                onClick={() => startAudit.mutateAsync(audit.id)}
                disabled={startAudit.isPending}
                className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                Start Audit
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => completeAudit.mutateAsync(audit.id)}
                disabled={completeAudit.isPending}
                className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-light disabled:opacity-50"
              >
                Complete Audit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Add finding */}
        {canAddFindings && (
          <div className="mb-6">
            <FindingEntry auditId={audit.id} onCreated={() => refetch()} />
          </div>
        )}

        {/* Findings list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Findings ({audit.findings?.length ?? 0})
          </h2>
          {!audit.findings?.length ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm text-brand-gray">
                {canAddFindings
                  ? 'No findings yet. Enter an observation above to generate one.'
                  : 'No findings recorded.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {audit.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {finding.finding_title ?? 'Untitled finding'}
                    </h3>
                    {finding.risk_rating && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${riskColors[finding.risk_rating] ?? ''}`}
                      >
                        {finding.risk_rating}
                      </span>
                    )}
                  </div>

                  {finding.finding_narrative && (
                    <p className="mb-2 text-sm text-gray-600">{finding.finding_narrative}</p>
                  )}

                  {finding.recommended_action && (
                    <div className="mb-2 rounded-md bg-brand-blue-light px-3 py-2 text-sm text-brand-blue">
                      <span className="font-medium">Action: </span>
                      {finding.recommended_action}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-brand-gray">
                    {finding.category_code && (
                      <span>{finding.category_code.replace(/_/g, ' ')}</span>
                    )}
                    {finding.ai_confidence !== null && (
                      <span>{Math.round(finding.ai_confidence * 100)}% AI confidence</span>
                    )}
                    {finding.finding_clause_refs?.length > 0 && (
                      <span>{finding.finding_clause_refs.length} clause refs</span>
                    )}
                  </div>

                  {/* Raw observation */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-brand-gray hover:text-gray-700">
                      Original observation
                    </summary>
                    <p className="mt-1 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      {finding.raw_observation}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
