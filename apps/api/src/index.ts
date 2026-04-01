import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { orgMiddleware } from './middleware/org';
import { siteMiddleware } from './middleware/site';
import { auditRoutes } from './routes/audits';
import { findingRoutes } from './routes/findings';
import { capaRoutes } from './routes/capas';
import { preopRoutes } from './routes/preop';
import { intelligenceRoutes } from './routes/intelligence';
import { facilityRoutes } from './routes/facilities';
import { frameworkRoutes } from './routes/frameworks';
import { documentRoutes } from './routes/documents';
import { complianceRoutes } from './routes/compliance';
import { aiRoutes } from './routes/ai';
import { webhookRoutes } from './routes/webhooks';
import { reportRoutes } from './routes/reports';
import { billingRoutes } from './routes/billing';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/errors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Webhooks need raw body for Stripe signature verification — mount before json parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

// Health check — no auth
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public routes — no auth
app.use('/api/v1/frameworks', frameworkRoutes);

// All routes below require auth
app.use(authMiddleware);

// Org-scoped routes: /api/v1/org/:orgSlug/...
const orgRouter = express.Router({ mergeParams: true });
orgRouter.use(orgMiddleware);

// Site-scoped routes nested under org: /api/v1/org/:orgSlug/sites/:siteSlug/...
const siteRouter = express.Router({ mergeParams: true });
siteRouter.use(siteMiddleware);
siteRouter.use('/audits', auditRoutes);
siteRouter.use('/findings', findingRoutes);
siteRouter.use('/capas', capaRoutes);
siteRouter.use('/preop', preopRoutes);
siteRouter.use('/intelligence', intelligenceRoutes);
siteRouter.use('/facilities', facilityRoutes);
siteRouter.use('/documents', documentRoutes);
siteRouter.use('/compliance', complianceRoutes);
siteRouter.use('/reports', reportRoutes);

orgRouter.use('/sites/:siteSlug', siteRouter);
orgRouter.use('/billing', billingRoutes);
app.use('/api/v1/org/:orgSlug', orgRouter);

// Admin routes — protected by AUDITARMOUR_ADMIN_SECRET header, not Supabase auth
app.use('/api/admin', adminRoutes);

// AI routes — auth required but not org/site scoped (site context passed in body)
app.use('/api/v1/ai', aiRoutes);

// Error handling
app.use(errorHandler);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`AuditArmour API running on 0.0.0.0:${PORT}`);
});

export default app;
