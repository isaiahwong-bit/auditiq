import { Router } from 'express';
import * as intelligenceService from '../services/intelligence.service';

export const intelligenceRoutes = Router();

// GET / — list alerts for the site
intelligenceRoutes.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const alerts = await intelligenceService.listAlerts(req.site!.id, status);
    res.json({ data: alerts });
  } catch (err) {
    next(err);
  }
});

// GET /count — active alert count for badge
intelligenceRoutes.get('/count', async (req, res, next) => {
  try {
    const count = await intelligenceService.getActiveAlertCount(req.site!.id);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
});

// POST /:alertId/acknowledge — acknowledge an alert
intelligenceRoutes.post('/:alertId/acknowledge', async (req, res, next) => {
  try {
    const alert = await intelligenceService.acknowledgeAlert(
      req.params.alertId,
      req.user!.id,
    );
    res.json({ data: alert });
  } catch (err) {
    next(err);
  }
});

// POST /:alertId/resolve — resolve an alert
intelligenceRoutes.post('/:alertId/resolve', async (req, res, next) => {
  try {
    const alert = await intelligenceService.resolveAlert(req.params.alertId);
    res.json({ data: alert });
  } catch (err) {
    next(err);
  }
});
