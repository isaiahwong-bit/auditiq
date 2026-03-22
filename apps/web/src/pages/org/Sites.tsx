import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOrg } from '../../hooks/use-org';
import { useSites } from '../../hooks/use-sites';

export default function Sites() {
  const { org, orgSlug } = useOrg();
  const { sites, loading } = useSites(org?.id);

  return (
    <div>
      <PageHeader title="Sites" description="Manage your facilities" />
      <div className="p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-brand-gray">Loading sites...</p>
        ) : sites.length === 0 ? (
          <p className="text-sm text-brand-gray">No sites configured yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <Link
                key={site.id}
                to={`/${orgSlug}/sites/${site.slug}/dashboard`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="font-medium text-gray-900">{site.name}</h3>
                {site.address && (
                  <p className="mt-1 text-sm text-brand-gray">{site.address}</p>
                )}
                {site.site_type && (
                  <span className="mt-2 inline-block rounded-full bg-brand-blue-light px-2 py-0.5 text-xs font-medium text-brand-blue">
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
