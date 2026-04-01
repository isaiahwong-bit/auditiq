import { Router } from 'express';
import { z } from 'zod';
import * as facilityService from '../services/facility.service';

export const facilityRoutes = Router();

// ── Area routes ──────────────────────────────────────────────────────────

// GET / — list facility areas with check item counts
facilityRoutes.get('/', async (req, res, next) => {
  try {
    const areas = await facilityService.listAreas(req.site!.id);
    res.json({ data: areas });
  } catch (err) {
    next(err);
  }
});

// POST / — create a facility area
const createAreaSchema = z.object({
  name: z.string().min(1).max(200),
  area_type: z
    .enum(['production', 'storage', 'amenities', 'dispatch', 'external', 'equipment'])
    .nullable()
    .optional(),
  care_level: z.enum(['high', 'medium', 'low']).optional(),
  display_order: z.number().int().min(0).optional(),
});

facilityRoutes.post('/', async (req, res, next) => {
  try {
    const body = createAreaSchema.parse(req.body);
    const area = await facilityService.createArea({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      name: body.name,
      areaType: body.area_type ?? null,
      careLevel: body.care_level,
      displayOrder: body.display_order ?? 0,
    });
    res.status(201).json({ data: area });
  } catch (err) {
    next(err);
  }
});

// POST /reorder — update display_order for multiple areas
const reorderSchema = z.object({
  orderings: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().min(0),
    }),
  ),
});

facilityRoutes.post('/reorder', async (req, res, next) => {
  try {
    const body = reorderSchema.parse(req.body);
    const areas = await facilityService.reorderAreas(req.site!.id, body.orderings);
    res.json({ data: areas });
  } catch (err) {
    next(err);
  }
});

// GET /categories — list finding categories for dropdowns
facilityRoutes.get('/categories', async (_req, res, next) => {
  try {
    const categories = await facilityService.listFindingCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

// PATCH /:areaId — update a facility area
const updateAreaSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  area_type: z
    .enum(['production', 'storage', 'amenities', 'dispatch', 'external', 'equipment'])
    .nullable()
    .optional(),
  care_level: z.enum(['high', 'medium', 'low']).optional(),
  display_order: z.number().int().min(0).optional(),
});

facilityRoutes.patch('/:areaId', async (req, res, next) => {
  try {
    const body = updateAreaSchema.parse(req.body);
    const area = await facilityService.updateArea(req.params.areaId, req.site!.id, {
      name: body.name,
      areaType: body.area_type,
      careLevel: body.care_level,
      displayOrder: body.display_order,
    });
    res.json({ data: area });
  } catch (err) {
    next(err);
  }
});

// DELETE /:areaId — soft delete a facility area
facilityRoutes.delete('/:areaId', async (req, res, next) => {
  try {
    const area = await facilityService.deleteArea(req.params.areaId, req.site!.id);
    res.json({ data: area });
  } catch (err) {
    next(err);
  }
});

// ── Check item routes ────────────────────────────────────────────────────

// GET /:areaId/items — list check items for an area
facilityRoutes.get('/:areaId/items', async (req, res, next) => {
  try {
    const items = await facilityService.listCheckItems(req.params.areaId, req.site!.id);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

// POST /:areaId/items — create a check item
const createItemSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().nullable().optional(),
  scoring_type: z.enum(['pass_fail', 'numeric', 'percentage']).optional(),
  frequency: z.enum(['daily', 'per_shift', 'weekly', 'monthly']).optional(),
  category_code: z.string().nullable().optional(),
  display_order: z.number().int().min(0).optional(),
});

facilityRoutes.post('/:areaId/items', async (req, res, next) => {
  try {
    const body = createItemSchema.parse(req.body);
    const item = await facilityService.createCheckItem({
      facilityAreaId: req.params.areaId,
      siteId: req.site!.id,
      organisationId: req.org!.id,
      name: body.name,
      description: body.description ?? null,
      scoringType: body.scoring_type ?? 'pass_fail',
      frequency: body.frequency ?? 'daily',
      categoryCode: body.category_code ?? null,
      displayOrder: body.display_order ?? 0,
    });
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

// PATCH /:areaId/items/:itemId — update a check item
const updateItemSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  scoring_type: z.enum(['pass_fail', 'numeric', 'percentage']).optional(),
  frequency: z.enum(['daily', 'per_shift', 'weekly', 'monthly']).optional(),
  category_code: z.string().nullable().optional(),
  display_order: z.number().int().min(0).optional(),
});

facilityRoutes.patch('/:areaId/items/:itemId', async (req, res, next) => {
  try {
    const body = updateItemSchema.parse(req.body);
    const item = await facilityService.updateCheckItem(
      req.params.itemId,
      req.params.areaId,
      req.site!.id,
      {
        name: body.name,
        description: body.description,
        scoringType: body.scoring_type,
        frequency: body.frequency,
        categoryCode: body.category_code,
        displayOrder: body.display_order,
      },
    );
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /:areaId/items/:itemId — soft delete a check item
facilityRoutes.delete('/:areaId/items/:itemId', async (req, res, next) => {
  try {
    const item = await facilityService.deleteCheckItem(
      req.params.itemId,
      req.params.areaId,
      req.site!.id,
    );
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});
