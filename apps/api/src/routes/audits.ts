import { Router } from 'express';
import { z } from 'zod';
import * as auditService from '../services/audit.service';

export const auditRoutes = Router();

// GET / — list audits for the site
auditRoutes.get('/', async (req, res, next) => {
  try {
    const audits = await auditService.listAudits(req.site!.id);
    res.json({ data: audits });
  } catch (err) {
    next(err);
  }
});

// POST / — create a new audit
const createSchema = z.object({
  audit_type: z.enum(['internal', 'third_party', 'supplier']),
});

auditRoutes.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const audit = await auditService.createAudit({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      conductedBy: req.user!.id,
      auditType: body.audit_type,
    });
    res.status(201).json({ data: audit });
  } catch (err) {
    next(err);
  }
});

// GET /:auditId — get a single audit with findings
auditRoutes.get('/:auditId', async (req, res, next) => {
  try {
    const audit = await auditService.getAudit(req.params.auditId);
    const findings = await auditService.getFindingsForAudit(req.params.auditId);
    res.json({ data: { ...audit, findings } });
  } catch (err) {
    next(err);
  }
});

// POST /:auditId/start — transition audit to in_progress
auditRoutes.post('/:auditId/start', async (req, res, next) => {
  try {
    const audit = await auditService.startAudit(req.params.auditId);
    res.json({ data: audit });
  } catch (err) {
    next(err);
  }
});

// POST /:auditId/complete — transition audit to complete
auditRoutes.post('/:auditId/complete', async (req, res, next) => {
  try {
    const audit = await auditService.completeAudit(req.params.auditId);
    res.json({ data: audit });
  } catch (err) {
    next(err);
  }
});
