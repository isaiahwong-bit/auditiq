import { Router } from 'express';
import { z } from 'zod';
import * as aiService from '../services/ai.service';

export const aiRoutes = Router();

// POST /classify — Step 1 only (classification)
const classifySchema = z.object({
  raw_observation: z.string().min(1),
  site_type: z.string().nullable().optional(),
});

aiRoutes.post('/classify', async (req, res, next) => {
  try {
    const body = classifySchema.parse(req.body);
    const result = await aiService.classifyObservation(
      body.raw_observation,
      body.site_type ?? null,
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /generate-finding — Full two-step finding generation
const generateSchema = z.object({
  raw_observation: z.string().min(1),
  site_id: z.string().uuid(),
  site_type: z.string().nullable().optional(),
});

aiRoutes.post('/generate-finding', async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body);
    const result = await aiService.generateFinding({
      rawObservation: body.raw_observation,
      siteId: body.site_id,
      siteType: body.site_type ?? null,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
