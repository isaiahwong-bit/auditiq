import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useCapas, useCreateCapa } from '../../hooks/use-capas';

const statusStyles: Record<string, string> = {
  open: 'bg-blue-50/80 text-brand-blue dark:bg-blue-500/10 dark:text-blue-400',
  in_progress: 'bg-amber-50/80 text-brand-amber dark:bg-amber-500/10 dark:text-amber-400',
  closed: 'bg-emerald-50/80 text-brand-green dark:bg-emerald-500/10 dark:text-emerald-400',
  overdue: 'bg-red-50/80 text-brand-red dark:bg-red-500/10 dark:text-red-400',
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
  const { data: capas, isLoading, isError } = useCapas(filter === 'all' ? undefined : filter);
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
    <div className="bg-transparent">
      <PageHeader
        title="CAPAs"
        description="Corrective and preventive actions"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            New CAPA
          </button>
        }
      />
      <div className="p-6 md:p-8">
        {/* Create form */}
        {showCreate && (
          <div className="mb-6 rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Create CAPA</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Describe the corrective action required"
                  className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-white/5 dark:text-white"
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
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {createCapa.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50/50 transition-colors dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* CAPA list */}
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading CAPAs...</p>
        ) : isError ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">No CAPAs found.</p>
          </div>
        ) : !capas?.length ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">No CAPAs found.</p>
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
                  className="flex items-center justify-between rounded-xl bg-white/70 backdrop-blur-xl px-4 py-3.5 shadow-sm border border-white/20 hover:bg-gray-50/50 transition-colors dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{capa.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[effectiveStatus] ?? ''}`}
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
