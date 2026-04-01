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
    <div className="bg-transparent">
      <PageHeader title="Reports" description="Generate audit reports and certification evidence packages" />
      <div className="p-6 md:p-8">
        {message && (
          <div className="mb-6 rounded-2xl bg-blue-50/50 backdrop-blur-xl px-5 py-3.5 text-sm text-brand-blue border border-blue-200/50 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
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
          <section className="rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Audit Reports
            </h2>
            {completedAudits.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No completed audits to report on.</p>
            ) : (
              <ul className="divide-y divide-gray-100/50 dark:divide-white/5">
                {completedAudits.map((audit) => (
                  <li key={audit.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {audit.audit_type?.replace('_', ' ')} audit
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {audit.completed_at
                          ? new Date(audit.completed_at).toLocaleDateString('en-AU')
                          : 'N/A'}
                        {audit.overall_score !== null && ` \u00b7 ${audit.overall_score}%`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAuditReport(audit.id)}
                      disabled={generateReport.isPending}
                      className="rounded-xl border border-gray-200 bg-white/50 px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50/50 disabled:opacity-50 transition-colors dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                      Generate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Certification Evidence Package */}
          <section className="rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Certification Evidence Package
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Comprehensive evidence package for auditor visits -- includes compliance status,
              rectification plans, pre-op completion rates, and CAPA summary.
            </p>

            {certPreview && (
              <div className="mb-4 space-y-2 rounded-xl bg-gray-50/50 p-3.5 text-xs dark:bg-white/5">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Active frameworks</span>
                  <span className="font-medium text-gray-900 dark:text-white">{certPreview.frameworks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Clauses covered</span>
                  <span className="font-medium text-brand-green">
                    {certPreview.gap_summary.covered} / {certPreview.gap_summary.total_clauses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Rectification plans</span>
                  <span className="font-medium text-brand-amber">
                    {certPreview.gap_summary.plans_in_place}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Unaddressed gaps</span>
                  <span className="font-medium text-brand-red">
                    {certPreview.gap_summary.gaps}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pre-op pass rate (30d)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {certPreview.preop_completion.avg_pass_rate?.toFixed(1) ?? '\u2014'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Open CAPAs</span>
                  <span className="font-medium text-gray-900 dark:text-white">{certPreview.open_capas}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCertPack}
              disabled={generateCertPack.isPending}
              className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {generateCertPack.isPending ? 'Generating...' : 'Generate Certification Package'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
