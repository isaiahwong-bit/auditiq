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
        className="flex w-full items-center justify-between rounded-xl border border-gray-200/60 bg-white/60 px-3 py-2.5 text-sm font-medium text-gray-900 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 dark:border-gray-700/40 dark:bg-gray-800/60 dark:text-white dark:hover:bg-gray-800/80"
      >
        <span className="truncate">{currentSite?.name ?? 'Select site'}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-white/40 bg-white/90 py-1 shadow-lg shadow-black/5 backdrop-blur-lg dark:border-gray-700/40 dark:bg-gray-800/90 dark:shadow-black/20">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                navigate(`/${orgSlug}/sites/${site.slug}/dashboard`);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 ${
                site.slug === siteSlug
                  ? 'bg-gray-900 font-medium text-white dark:bg-white dark:text-gray-900'
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
