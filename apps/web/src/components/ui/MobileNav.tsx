import { NavLink, useParams } from 'react-router-dom';

export function MobileNav() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();

  if (!siteSlug) return null;

  const basePath = `/${orgSlug}/sites/${siteSlug}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/30 bg-white/80 backdrop-blur-xl md:hidden dark:border-gray-700/40 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-lg">
        <MobileTab to={`${basePath}/pre-op-checks`} label="Checks">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </MobileTab>
        <MobileTab to={`${basePath}/capas`} label="CAPAs">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </MobileTab>
        <MobileTab to={`${basePath}/dashboard`} label="History">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </MobileTab>
      </div>
    </nav>
  );
}

function MobileTab({ to, label, children }: { to: string; label: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-all duration-200 ${
          isActive
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-gray-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`rounded-xl px-4 py-1 transition-all duration-200 ${isActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : ''}`}>
            {children}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
