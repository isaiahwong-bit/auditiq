import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSites } from '../../hooks/use-sites';
import { useOrg } from '../../hooks/use-org';

export function SiteSwitcher() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { org } = useOrg();
  const { sites } = useSites(org?.id);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentSite = sites.find((s) => s.slug === siteSlug);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (sites.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      >
        <span className="truncate">{currentSite?.name ?? 'Select site'}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-brand-gray transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                navigate(`/${orgSlug}/sites/${site.slug}/dashboard`);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-brand-green-light dark:hover:bg-brand-green/10 ${
                site.slug === siteSlug
                  ? 'bg-brand-green-light font-medium text-brand-green dark:bg-brand-green/10'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {site.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
