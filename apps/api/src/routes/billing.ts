import { Router } from 'express';
import { z } from 'zod';
import * as billingService from '../services/billing.service';

export const billingRoutes = Router();

// GET /status — get current subscription status
billingRoutes.get('/status', async (req, res, next) => {
  try {
    const status = await billingService.getSubscriptionStatus(req.org!.id);
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

// POST /checkout — create a Stripe checkout session
const checkoutSchema = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

billingRoutes.post('/checkout', async (req, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body);
    const session = await billingService.createCheckoutSession({
      organisationId: req.org!.id,
      plan: body.plan,
      email: req.user!.id, // Will be resolved to email in the service
      successUrl: body.success_url,
      cancelUrl: body.cancel_url,
    });
    res.json({ data: { checkout_url: session.url } });
  } catch (err) {
    next(err);
  }
});

// POST /portal — create a Stripe billing portal session
const portalSchema = z.object({
  return_url: z.string().url(),
});

billingRoutes.post('/portal', async (req, res, next) => {
  try {
    const body = portalSchema.parse(req.body);
    const session = await billingService.createPortalSession(req.org!.id, body.return_url);
    res.json({ data: { portal_url: session.url } });
  } catch (err) {
    next(err);
  }
});

// GET /limits/sites — check site limit
billingRoutes.get('/limits/sites', async (req, res, next) => {
  try {
    const check = await billingService.checkSiteLimit(req.org!.id);
    res.json({ data: check });
  } catch (err) {
    next(err);
  }
});
