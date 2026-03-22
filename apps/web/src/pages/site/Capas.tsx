import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useCapas, useCreateCapa } from '../../hooks/use-capas';

const statusStyles: Record<string, string> = {
  open: 'bg-brand-blue-light text-brand-blue',
  in_progress: 'bg-brand-amber-light text-brand-amber',
  closed: 'bg-brand-green-light text-brand-green',
  overdue: 'bg-brand-red-light text-brand-red',
};

const urgencyLabels: Record<string, string> = {
  immediate: 'Immediate (4hrs)',
  '24hr': '24 hours',
  '7day': '7 days',
  standard: 'Standard (28 days)',
};

type FilterStatus = 'all' | 'open' | 'in_progress' | 'overdue' | 'closed';

export default function Capas() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { data: capas, isLoading } = useCapas(filter === 'all' ? undefined : filter);
  const createCapa = useCreateCapa();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('standard');

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createCapa.mutateAsync({
      title,
      description: description || null,
      urgency,
    });
    setTitle('');
    setDescription('');
    setUrgency('standard');
    setShowCreate(false);
  };

  const filters: FilterStatus[] = ['all', 'open', 'in_progress', 'overdue', 'closed'];

  return (
    <div>
      <PageHeader
        title="CAPAs"
        description="Corrective and preventive actions"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            New CAPA
          </button>
        }
      />
      <div className="p-6 md:p-8">
        {/* Create form */}
        {showCreate && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Create CAPA</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Describe the corrective action required"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="immediate">Immediate (4 hours)</option>
                  <option value="24hr">24 hours</option>
                  <option value="7day">7 days</option>
                  <option value="standard">Standard (28 days)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || createCapa.isPending}
                  className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  {createCapa.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status filters */}
        <div className="mb-4 flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* CAPA list */}
        {isLoading ? (
          <p className="text-sm text-brand-gray">Loading CAPAs...</p>
        ) : !capas?.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-brand-gray">No CAPAs found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {capas.map((capa) => {
              const isOverdue =
                capa.status !== 'closed' &&
                capa.due_date &&
                new Date(capa.due_date) < new Date();
              const effectiveStatus = isOverdue ? 'overdue' : capa.status;

              return (
                <Link
                  key={capa.id}
                  to={`/${orgSlug}/sites/${siteSlug}/capas/${capa.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{capa.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-brand-gray">
                      {capa.urgency && <span>{urgencyLabels[capa.urgency] ?? capa.urgency}</span>}
                      {capa.due_date && (
                        <span>Due {new Date(capa.due_date).toLocaleDateString('en-AU')}</span>
                      )}
                      {capa.user_profiles?.full_name && (
                        <span>{capa.user_profiles.full_name}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[effectiveStatus] ?? ''}`}
                  >
                    {effectiveStatus.replace('_', ' ')}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
