import { Router } from 'express';
import { z } from 'zod';
import * as preopService from '../services/preop.service';

export const preopRoutes = Router();

// GET /preop/areas — list facility areas for the site
preopRoutes.get('/areas', async (req, res, next) => {
  try {
    const careLevel = req.query.care_level as string | undefined;
    const areas = await preopService.getFacilityAreas(req.site!.id, careLevel);
    res.json({ data: areas });
  } catch (err) {
    next(err);
  }
});

// GET /preop/areas/:areaId/items — list check items for an area
preopRoutes.get('/areas/:areaId/items', async (req, res, next) => {
  try {
    const items = await preopService.getCheckItems(req.params.areaId);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

// GET /preop/areas/:areaId/today — get today's sessions for an area
preopRoutes.get('/areas/:areaId/today', async (req, res, next) => {
  try {
    const sessions = await preopService.getTodaySessionsForArea(
      req.site!.id,
      req.params.areaId,
    );
    res.json({ data: sessions });
  } catch (err) {
    next(err);
  }
});

// POST /preop/sessions — create a new pre-op session
const createSessionSchema = z.object({
  facility_area_id: z.string().uuid(),
  shift: z.enum(['am', 'pm', 'night']).nullable().optional(),
});

preopRoutes.post('/sessions', async (req, res, next) => {
  try {
    const body = createSessionSchema.parse(req.body);
    const session = await preopService.createSession({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      facilityAreaId: body.facility_area_id,
      conductedBy: req.user!.id,
      shift: body.shift ?? null,
    });
    res.status(201).json({ data: session });
  } catch (err) {
    next(err);
  }
});

// GET /preop/sessions — list sessions for the site
preopRoutes.get('/sessions', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const sessions = await preopService.getSessionsForSite(req.site!.id, limit);
    res.json({ data: sessions });
  } catch (err) {
    next(err);
  }
});

// GET /preop/sessions/:sessionId — get a single session
preopRoutes.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const session = await preopService.getSession(req.params.sessionId);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
});

// GET /preop/sessions/:sessionId/responses — get all responses for a session
preopRoutes.get('/sessions/:sessionId/responses', async (req, res, next) => {
  try {
    const responses = await preopService.getSessionResponses(req.params.sessionId);
    res.json({ data: responses });
  } catch (err) {
    next(err);
  }
});

// POST /preop/sessions/:sessionId/responses — submit a check item response
const submitResponseSchema = z.object({
  check_item_id: z.string().uuid(),
  result: z.enum(['pass', 'fail', 'na']),
  score: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  photo_urls: z.array(z.string()).optional(),
  flagged: z.boolean().optional(),
});

preopRoutes.post('/sessions/:sessionId/responses', async (req, res, next) => {
  try {
    const body = submitResponseSchema.parse(req.body);
    const response = await preopService.submitResponse({
      sessionId: req.params.sessionId,
      checkItemId: body.check_item_id,
      siteId: req.site!.id,
      organisationId: req.org!.id,
      result: body.result,
      score: body.score ?? null,
      notes: body.notes ?? null,
      photoUrls: body.photo_urls ?? [],
      flagged: body.flagged ?? false,
    });
    res.status(201).json({ data: response });
  } catch (err) {
    next(err);
  }
});

// POST /preop/sessions/:sessionId/complete — complete a session
preopRoutes.post('/sessions/:sessionId/complete', async (req, res, next) => {
  try {
    const session = await preopService.completeSession(req.params.sessionId);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
});
