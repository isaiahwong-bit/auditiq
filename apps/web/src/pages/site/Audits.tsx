import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAudits, useCreateAudit } from '../../hooks/use-audits';

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100/80 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  in_progress: 'bg-blue-50/80 text-brand-blue dark:bg-blue-500/10 dark:text-blue-400',
  complete: 'bg-emerald-50/80 text-brand-green dark:bg-emerald-500/10 dark:text-emerald-400',
  reported: 'bg-amber-50/80 text-brand-amber dark:bg-amber-500/10 dark:text-amber-400',
};

export default function Audits() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { data: audits, isLoading, isError } = useAudits();
  const createAudit = useCreateAudit();
  const [showCreate, setShowCreate] = useState(false);
  const [auditType, setAuditType] = useState<string>('internal');

  const handleCreate = async () => {
    await createAudit.mutateAsync({ audit_type: auditType });
    setShowCreate(false);
  };

  return (
    <div className="bg-transparent">
      <PageHeader
        title="Audits"
        description="Internal and third-party audit records"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            New Audit
          </button>
        }
      />
      <div className="p-6 md:p-8">
        {/* Create modal */}
        {showCreate && (
          <div className="mb-6 rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Create New Audit</h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Audit Type</label>
              <select
                value={auditType}
                onChange={(e) => setAuditType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-white/5 dark:text-white"
              >
                <option value="internal">Internal</option>
                <option value="third_party">Third Party</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={createAudit.isPending}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {createAudit.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50/50 transition-colors dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Audit list */}
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading audits...</p>
        ) : isError ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">No audits yet. Create one to get started.</p>
          </div>
        ) : !audits?.length ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">No audits yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map((audit) => (
              <Link
                key={audit.id}
                to={`/${orgSlug}/sites/${siteSlug}/audits/${audit.id}`}
                className="flex items-center justify-between rounded-xl bg-white/70 backdrop-blur-xl px-4 py-3.5 shadow-sm border border-white/20 hover:bg-gray-50/50 transition-colors dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {audit.audit_type?.replace('_', ' ')} audit
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(audit.created_at).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {audit.overall_score !== null && (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {audit.overall_score}%
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[audit.status] ?? ''}`}
                  >
                    {audit.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
