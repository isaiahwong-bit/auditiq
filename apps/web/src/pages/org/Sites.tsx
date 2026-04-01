import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOrg } from '../../hooks/use-org';
import { useSites, useCreateSite } from '../../hooks/use-sites';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Sites() {
  const { org, orgSlug } = useOrg();
  const { sites, loading } = useSites(org?.id);
  const createSite = useCreateSite();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [address, setAddress] = useState('');
  const [siteType, setSiteType] = useState('processing');
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) setSlug(toSlug(val));
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim() || !org) return;
    setError(null);
    try {
      await createSite.mutateAsync({
        organisation_id: org.id,
        name: name.trim(),
        slug: slug.trim(),
        address: address.trim() || undefined,
        site_type: siteType,
      });
      setShowCreate(false);
      setName('');
      setSlug('');
      setSlugEdited(false);
      setAddress('');
      setSiteType('processing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    }
  };

  return (
    <div className="bg-transparent">
      <PageHeader
        title="Sites"
        description="Manage your facilities"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Add Site
          </button>
        }
      />
      <div className="p-6 md:p-8">
        {/* Create form */}
        {showCreate && (
          <div className="mb-6 rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">New Site</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site Name
                </label>
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Kelso Processing Plant"
                  className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">/{orgSlug}/sites/</span>
                  <input
                    value={slug}
                    onChange={(e) => { setSlug(toSlug(e.target.value)); setSlugEdited(true); }}
                    placeholder="kelso-nsw"
                    className="flex-1 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm font-mono focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 Industrial Ave, Kelso NSW 2795"
                  className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site Type
                </label>
                <select
                  value={siteType}
                  onChange={(e) => setSiteType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-white/5 dark:text-white"
                >
                  <option value="processing">Processing</option>
                  <option value="cold_chain">Cold Chain</option>
                  <option value="co_manufacturer">Co-Manufacturer</option>
                </select>
              </div>
              {error && (
                <p className="text-sm text-brand-red">{error}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || !slug.trim() || createSite.isPending}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {createSite.isPending ? 'Creating...' : 'Create Site'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setError(null); }}
                  className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50/50 transition-colors dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Site list */}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading sites...</p>
        ) : sites.length === 0 ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-8 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">No sites configured yet. Click "Add Site" to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <Link
                key={site.id}
                to={`/${orgSlug}/sites/${site.slug}/dashboard`}
                className="rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 hover:bg-gray-50/50 transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{site.name}</h3>
                {site.address && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{site.address}</p>
                )}
                {site.site_type && (
                  <span className="mt-2 inline-block rounded-full bg-blue-50/80 px-2.5 py-0.5 text-xs font-medium text-brand-blue dark:bg-blue-500/10 dark:text-blue-400">
                    {site.site_type.replace('_', ' ')}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
