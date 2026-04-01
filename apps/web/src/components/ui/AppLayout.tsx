import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ThemeProvider } from './ThemeProvider';

export function AppLayout() {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        {/* Desktop sidebar — hidden below 768px */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav — visible below 768px */}
        <MobileNav />
      </div>
    </ThemeProvider>
  );
}
