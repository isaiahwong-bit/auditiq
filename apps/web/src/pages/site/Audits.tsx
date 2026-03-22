import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAudits, useCreateAudit } from '../../hooks/use-audits';

const statusStyles: Record<string, string> = {
  draft: 'bg-brand-gray-light text-brand-gray',
  in_progress: 'bg-brand-blue-light text-brand-blue',
  complete: 'bg-brand-green-light text-brand-green',
  reported: 'bg-brand-amber-light text-brand-amber',
};

export default function Audits() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { data: audits, isLoading } = useAudits();
  const createAudit = useCreateAudit();
  const [showCreate, setShowCreate] = useState(false);
  const [auditType, setAuditType] = useState<string>('internal');

  const handleCreate = async () => {
    await createAudit.mutateAsync({ audit_type: auditType });
    setShowCreate(false);
  };

  return (
    <div>
      <PageHeader
        title="Audits"
        description="Internal and third-party audit records"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            New Audit
          </button>
        }
      />
      <div className="p-6 md:p-8">
        {/* Create modal */}
        {showCreate && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Create New Audit</h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Audit Type</label>
              <select
                value={auditType}
                onChange={(e) => setAuditType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {createAudit.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Audit list */}
        {isLoading ? (
          <p className="text-sm text-brand-gray">Loading audits...</p>
        ) : !audits?.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-brand-gray">No audits yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map((audit) => (
              <Link
                key={audit.id}
                to={`/${orgSlug}/sites/${siteSlug}/audits/${audit.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {audit.audit_type?.replace('_', ' ')} audit
                  </p>
                  <p className="text-xs text-brand-gray">
                    {new Date(audit.created_at).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {audit.overall_score !== null && (
                    <span className="text-sm font-medium text-gray-900">
                      {audit.overall_score}%
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[audit.status] ?? ''}`}
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
