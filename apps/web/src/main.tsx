import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/ui/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

// Lazy-loaded page components for code splitting
const Login = lazy(() => import('./pages/Login'));
const OrgDashboard = lazy(() => import('./pages/org/Dashboard'));
const Sites = lazy(() => import('./pages/org/Sites'));
const OrgSettings = lazy(() => import('./pages/org/Settings'));
const SiteDashboard = lazy(() => import('./pages/site/SiteDashboard'));
const Audits = lazy(() => import('./pages/site/Audits'));
const AuditDetail = lazy(() => import('./pages/site/AuditDetail'));
const PreOpChecks = lazy(() => import('./pages/site/PreOpChecks'));
const PreOpStart = lazy(() => import('./pages/site/PreOpStart'));
const PreOpSession = lazy(() => import('./pages/site/PreOpSession'));
const PreOpSummary = lazy(() => import('./pages/site/PreOpSummary'));
const Capas = lazy(() => import('./pages/site/Capas'));
const CapaDetail = lazy(() => import('./pages/site/CapaDetail'));
const Intelligence = lazy(() => import('./pages/site/Intelligence'));
const Compliance = lazy(() => import('./pages/site/Compliance'));
const SiteSettings = lazy(() => import('./pages/site/SiteSettings'));
const FacilityConfig = lazy(() => import('./pages/site/FacilityConfig'));
const DocumentUpload = lazy(() => import('./pages/site/DocumentUpload'));
const Reports = lazy(() => import('./pages/site/Reports'));
const Admin = lazy(() => import('./pages/Admin'));

function PageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-green" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated — all in AppLayout shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Org-level routes */}
                <Route path="/:orgSlug/dashboard" element={<OrgDashboard />} />
                <Route path="/:orgSlug/sites" element={<Sites />} />
                <Route path="/:orgSlug/reports" element={<div>Org Reports</div>} />
                <Route path="/:orgSlug/settings" element={<OrgSettings />} />

                {/* Site-level routes */}
                <Route path="/:orgSlug/sites/:siteSlug/dashboard" element={<SiteDashboard />} />
                <Route path="/:orgSlug/sites/:siteSlug/audits" element={<Audits />} />
                <Route path="/:orgSlug/sites/:siteSlug/audits/:auditId" element={<AuditDetail />} />
                <Route path="/:orgSlug/sites/:siteSlug/pre-op-checks" element={<PreOpChecks />} />
                <Route path="/:orgSlug/sites/:siteSlug/pre-op-checks/start/:areaId" element={<PreOpStart />} />
                <Route path="/:orgSlug/sites/:siteSlug/pre-op-checks/:sessionId" element={<PreOpSession />} />
                <Route path="/:orgSlug/sites/:siteSlug/pre-op-checks/:sessionId/summary" element={<PreOpSummary />} />
                <Route path="/:orgSlug/sites/:siteSlug/capas" element={<Capas />} />
                <Route path="/:orgSlug/sites/:siteSlug/capas/:capaId" element={<CapaDetail />} />
                <Route path="/:orgSlug/sites/:siteSlug/intelligence" element={<Intelligence />} />
                <Route path="/:orgSlug/sites/:siteSlug/reports" element={<Reports />} />
                <Route path="/:orgSlug/sites/:siteSlug/settings/compliance" element={<Compliance />} />
                <Route path="/:orgSlug/sites/:siteSlug/settings/facilities" element={<FacilityConfig />} />
                <Route path="/:orgSlug/sites/:siteSlug/settings/documents" element={<DocumentUpload />} />
                <Route path="/:orgSlug/sites/:siteSlug/settings" element={<SiteSettings />} />
              </Route>
            </Route>

            {/* Admin — own auth via secret, not Supabase */}
            <Route path="/admin" element={<Admin />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
