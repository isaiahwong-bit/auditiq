import { Router } from 'express';
import { z } from 'zod';
import * as capaService from '../services/capa.service';
import { scheduleCapaJobs } from '../jobs/capa.job';

export const capaRoutes = Router();

// GET / — list CAPAs for the site
capaRoutes.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const capas = await capaService.listCapas(req.site!.id, status);
    res.json({ data: capas });
  } catch (err) {
    next(err);
  }
});

// GET /count — open CAPA count for badge
capaRoutes.get('/count', async (req, res, next) => {
  try {
    const count = await capaService.getOpenCapaCount(req.site!.id);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
});

// POST / — create a CAPA
const createSchema = z.object({
  finding_id: z.string().uuid().nullable().optional(),
  pre_op_response_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  urgency: z.enum(['immediate', '24hr', '7day', 'standard']),
});

capaRoutes.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const capa = await capaService.createCapa({
      findingId: body.finding_id ?? null,
      preOpResponseId: body.pre_op_response_id ?? null,
      siteId: req.site!.id,
      organisationId: req.org!.id,
      assignedTo: body.assigned_to ?? null,
      title: body.title,
      description: body.description ?? null,
      urgency: body.urgency,
    });

    // Schedule Bull jobs for notifications
    if (capa.due_date) {
      await scheduleCapaJobs(capa.id, capa.due_date);
    }

    res.status(201).json({ data: capa });
  } catch (err) {
    next(err);
  }
});

// GET /:capaId — get a single CAPA
capaRoutes.get('/:capaId', async (req, res, next) => {
  try {
    const capa = await capaService.getCapa(req.params.capaId);
    res.json({ data: capa });
  } catch (err) {
    next(err);
  }
});

// PATCH /:capaId/assign — reassign a CAPA
const assignSchema = z.object({
  assigned_to: z.string().uuid(),
});

capaRoutes.patch('/:capaId/assign', async (req, res, next) => {
  try {
    const body = assignSchema.parse(req.body);
    const capa = await capaService.assignCapa(req.params.capaId, body.assigned_to);
    res.json({ data: capa });
  } catch (err) {
    next(err);
  }
});

// PATCH /:capaId/status — update CAPA status
const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed', 'overdue']),
});

capaRoutes.patch('/:capaId/status', async (req, res, next) => {
  try {
    const body = statusSchema.parse(req.body);
    const capa = await capaService.updateCapaStatus(req.params.capaId, body.status);
    res.json({ data: capa });
  } catch (err) {
    next(err);
  }
});

// POST /:capaId/close — close CAPA with evidence
const closeSchema = z.object({
  evidence_urls: z.array(z.string()).optional(),
});

capaRoutes.post('/:capaId/close', async (req, res, next) => {
  try {
    const body = closeSchema.parse(req.body);
    const capa = await capaService.closeCapa(
      req.params.capaId,
      body.evidence_urls ?? [],
    );
    res.json({ data: capa });
  } catch (err) {
    next(err);
  }
});
