import { Router } from 'express';
import * as complianceService from '../services/compliance.service';

export const frameworkRoutes = Router();

// GET / — list all active frameworks (public, no auth required)
frameworkRoutes.get('/', async (_req, res, next) => {
  try {
    const frameworks = await complianceService.getAllFrameworks();
    res.json({ data: frameworks });
  } catch (err) {
    next(err);
  }
});
