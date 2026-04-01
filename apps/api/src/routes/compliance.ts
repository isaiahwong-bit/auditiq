import { Router } from 'express';
import { z } from 'zod';
import * as complianceService from '../services/compliance.service';

export const complianceRoutes = Router();

// GET /frameworks — site frameworks with status
complianceRoutes.get('/frameworks', async (req, res, next) => {
  try {
    const siteFrameworks = await complianceService.getSiteFrameworks(req.site!.id);
    res.json({ data: siteFrameworks });
  } catch (err) {
    next(err);
  }
});

// POST /frameworks/toggle — enable/disable a framework for the site
const toggleSchema = z.object({
  framework_id: z.string().uuid(),
  enabled: z.boolean(),
});

complianceRoutes.post('/frameworks/toggle', async (req, res, next) => {
  try {
    const body = toggleSchema.parse(req.body);
    const result = await complianceService.toggleFramework({
      siteId: req.site!.id,
      frameworkId: body.framework_id,
      enabled: body.enabled,
      userId: req.user!.id,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /gaps — full gap analysis for the site
complianceRoutes.get('/gaps', async (req, res, next) => {
  try {
    const analysis = await complianceService.analyseGaps(req.site!.id, req.org!.id);
    res.json({ data: analysis });
  } catch (err) {
    next(err);
  }
});

// POST /plans — create a rectification plan for a clause gap
const planSchema = z.object({
  clause_id: z.string().uuid(),
  facility_area_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  target_date: z.string().nullable().optional(),
});

complianceRoutes.post('/plans', async (req, res, next) => {
  try {
    const body = planSchema.parse(req.body);
    const plan = await complianceService.createRectificationPlan({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      clauseId: body.clause_id,
      facilityAreaId: body.facility_area_id ?? null,
      description: body.description,
      targetDate: body.target_date ?? null,
      createdBy: req.user!.id,
    });
    res.json({ data: plan });
  } catch (err) {
    next(err);
  }
});

// POST /plans/:planId/complete — mark a rectification plan as completed
complianceRoutes.post('/plans/:planId/complete', async (req, res, next) => {
  try {
    const plan = await complianceService.completeRectificationPlan(req.params.planId);
    res.json({ data: plan });
  } catch (err) {
    next(err);
  }
});

// ── Clause evidence ────────────────────────────────────────────────────────

// GET /evidence/:clauseId — list evidence for a clause
complianceRoutes.get('/evidence/:clauseId', async (req, res, next) => {
  try {
    const evidence = await complianceService.listClauseEvidence(
      req.site!.id,
      req.params.clauseId,
    );
    res.json({ data: evidence });
  } catch (err) {
    next(err);
  }
});

// POST /evidence — create evidence (file upload or reference)
const evidenceSchema = z.object({
  clause_id: z.string().uuid(),
  facility_area_id: z.string().uuid().nullable().optional(),
  evidence_type: z.enum(['file', 'reference']),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  reference_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

complianceRoutes.post('/evidence', async (req, res, next) => {
  try {
    const body = evidenceSchema.parse(req.body);
    const evidence = await complianceService.createClauseEvidence({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      clauseId: body.clause_id,
      facilityAreaId: body.facility_area_id ?? null,
      evidenceType: body.evidence_type,
      fileUrl: body.file_url ?? null,
      fileName: body.file_name ?? null,
      referenceText: body.reference_text ?? null,
      description: body.description ?? null,
      uploadedBy: req.user!.id,
    });
    res.json({ data: evidence });
  } catch (err) {
    next(err);
  }
});

// DELETE /evidence/:evidenceId — delete evidence
complianceRoutes.delete('/evidence/:evidenceId', async (req, res, next) => {
  try {
    await complianceService.deleteClauseEvidence(req.params.evidenceId);
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});
