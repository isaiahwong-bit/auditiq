import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAudits } from '../../hooks/use-audits';
import {
  useGenerateAuditReport,
  useGenerateCertPack,
  useCertPackPreview,
} from '../../hooks/use-reports';

export default function Reports() {
  const { data: audits } = useAudits();
  const generateReport = useGenerateAuditReport();
  const generateCertPack = useGenerateCertPack();
  const { data: certPreview } = useCertPackPreview();
  const [message, setMessage] = useState<string | null>(null);

  const completedAudits = (audits ?? []).filter(
    (a) => a.status === 'complete' || a.status === 'reported',
  );

  const handleAuditReport = async (auditId: string) => {
    const result = await generateReport.mutateAsync(auditId);
    setMessage(result.message);
  };

  const handleCertPack = async () => {
    const result = await generateCertPack.mutateAsync();
    setMessage(result.message);
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generate audit reports and certification evidence packages" />
      <div className="p-6 md:p-8">
        {message && (
          <div className="mb-6 rounded-md bg-brand-blue-light px-4 py-3 text-sm text-brand-blue">
            {message}
            <button
              onClick={() => setMessage(null)}
              className="ml-2 font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Audit Reports */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
              Audit Reports
            </h2>
            {completedAudits.length === 0 ? (
              <p className="text-sm text-brand-gray">No completed audits to report on.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {completedAudits.map((audit) => (
                  <li key={audit.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {audit.audit_type?.replace('_', ' ')} audit
                      </p>
                      <p className="text-xs text-brand-gray">
                        {audit.completed_at
                          ? new Date(audit.completed_at).toLocaleDateString('en-AU')
                          : 'N/A'}
                        {audit.overall_score !== null && ` \u00b7 ${audit.overall_score}%`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAuditReport(audit.id)}
                      disabled={generateReport.isPending}
                      className="rounded-md border border-brand-blue px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue-light disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Certification Evidence Package */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
              Certification Evidence Package
            </h2>
            <p className="mb-4 text-sm text-brand-gray">
              Comprehensive evidence package for auditor visits — includes compliance status,
              rectification plans, pre-op completion rates, and CAPA summary.
            </p>

            {certPreview && (
              <div className="mb-4 space-y-2 rounded-md bg-gray-50 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-gray">Active frameworks</span>
                  <span className="font-medium">{certPreview.frameworks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Clauses covered</span>
                  <span className="font-medium text-brand-green">
                    {certPreview.gap_summary.covered} / {certPreview.gap_summary.total_clauses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Rectification plans</span>
                  <span className="font-medium text-brand-amber">
                    {certPreview.gap_summary.plans_in_place}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Unaddressed gaps</span>
                  <span className="font-medium text-brand-red">
                    {certPreview.gap_summary.gaps}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Pre-op pass rate (30d)</span>
                  <span className="font-medium">
                    {certPreview.preop_completion.avg_pass_rate?.toFixed(1) ?? '—'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Open CAPAs</span>
                  <span className="font-medium">{certPreview.open_capas}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCertPack}
              disabled={generateCertPack.isPending}
              className="w-full rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {generateCertPack.isPending ? 'Generating...' : 'Generate Certification Package'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
