import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/ui/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import Login from './pages/Login';
import OrgDashboard from './pages/org/Dashboard';
import Sites from './pages/org/Sites';
import OrgSettings from './pages/org/Settings';
import SiteDashboard from './pages/site/SiteDashboard';
import Audits from './pages/site/Audits';
import PreOpChecks from './pages/site/PreOpChecks';
import Capas from './pages/site/Capas';
import CapaDetail from './pages/site/CapaDetail';
import Intelligence from './pages/site/Intelligence';
import Compliance from './pages/site/Compliance';
import SiteSettings from './pages/site/SiteSettings';
import FacilityConfig from './pages/site/FacilityConfig';
import AuditDetail from './pages/site/AuditDetail';
import PreOpStart from './pages/site/PreOpStart';
import PreOpSession from './pages/site/PreOpSession';
import PreOpSummary from './pages/site/PreOpSummary';
import Reports from './pages/site/Reports';
import DocumentUpload from './pages/site/DocumentUpload';
import Admin from './pages/Admin';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
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
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
