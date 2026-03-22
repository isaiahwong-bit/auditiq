import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useSite } from '../../hooks/use-site';

export default function SiteSettings() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { site } = useSite();

  const settingsSections = [
    {
      title: 'Compliance Setup',
      description: 'Toggle frameworks, review gaps, and create rectification plans',
      link: `/${orgSlug}/sites/${siteSlug}/settings/compliance`,
      icon: ShieldIcon,
      highlight: true,
    },
    {
      title: 'Facility Areas',
      description: 'Configure production zones, storage areas, and check item assignments',
      link: null,
      icon: BuildingIcon,
      highlight: false,
    },
    {
      title: 'Pre-op Configuration',
      description: 'Set check frequencies, deadlines, shift schedules, and operator assignments',
      link: null,
      icon: ClipboardIcon,
      highlight: false,
    },
    {
      title: 'Notifications',
      description: 'Configure email alerts for CAPAs, pre-op misses, and intelligence alerts',
      link: null,
      icon: BellIcon,
      highlight: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Site Settings"
        description={site?.name ?? 'Facility configuration and preferences'}
      />
      <div className="p-6 md:p-8">
        {/* Site info */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Site Details
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-brand-gray">Name</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {site?.name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-gray">Address</dt>
                <dd className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                  {site?.address ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-gray">Type</dt>
                <dd className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                  {site?.site_type?.replace('_', ' ') ?? '—'}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Settings sections */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Configuration
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {settingsSections.map((section) => {
              const Card = (
                <div
                  className={`rounded-lg border p-4 transition-shadow ${
                    section.highlight
                      ? 'border-brand-green/30 bg-brand-green-light/10 hover:shadow-md dark:bg-brand-green/5 dark:border-brand-green/20'
                      : 'border-gray-200 bg-white hover:shadow-md dark:border-gray-700 dark:bg-gray-800'
                  } ${section.link ? 'cursor-pointer' : 'opacity-75'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 ${
                      section.highlight
                        ? 'bg-brand-green-light text-brand-green dark:bg-brand-green/10'
                        : 'bg-gray-100 text-brand-gray dark:bg-gray-700'
                    }`}>
                      <section.icon />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {section.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-brand-gray">{section.description}</p>
                      {!section.link && (
                        <span className="mt-1.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-gray dark:bg-gray-700">
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );

              return section.link ? (
                <Link key={section.title} to={section.link}>{Card}</Link>
              ) : (
                <div key={section.title}>{Card}</div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
