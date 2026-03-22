import { Router } from 'express';
import { z } from 'zod';
import * as reportService from '../services/report.service';
import { scheduleAuditReport, scheduleCertPack } from '../jobs/pdf.job';

export const reportRoutes = Router();

// POST /audit-report — generate an audit report (async via Bull)
const auditReportSchema = z.object({
  audit_id: z.string().uuid(),
});

reportRoutes.post('/audit-report', async (req, res, next) => {
  try {
    const body = auditReportSchema.parse(req.body);
    await scheduleAuditReport({
      auditId: body.audit_id,
      siteId: req.site!.id,
      organisationId: req.org!.id,
      requestedBy: req.user!.id,
    });
    res.json({ data: { status: 'queued', message: 'Report is being generated. You will receive an email when ready.' } });
  } catch (err) {
    next(err);
  }
});

// POST /cert-pack — generate certification evidence package (async via Bull)
reportRoutes.post('/cert-pack', async (req, res, next) => {
  try {
    await scheduleCertPack({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      requestedBy: req.user!.id,
    });
    res.json({ data: { status: 'queued', message: 'Certification package is being generated. You will receive an email when ready.' } });
  } catch (err) {
    next(err);
  }
});

// GET /audit-report/:auditId/preview — get report data for inline preview
reportRoutes.get('/audit-report/:auditId/preview', async (req, res, next) => {
  try {
    const data = await reportService.getAuditReportData(req.params.auditId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /cert-pack/preview — get cert pack data for inline preview
reportRoutes.get('/cert-pack/preview', async (req, res, next) => {
  try {
    const data = await reportService.getCertPackData(req.site!.id, req.org!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
