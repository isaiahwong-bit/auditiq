import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { requireStripe } from '../lib/stripe';
import { resend } from '../lib/resend';
import * as billingService from '../services/billing.service';

export const webhookRoutes = Router();

// POST /api/webhooks/stripe — Stripe webhook handler
webhookRoutes.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = requireStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await billingService.handleSubscriptionCreated({
          metadata: subscription.metadata as { organisation_id?: string; plan?: string },
        });
        console.log(`[Stripe] Subscription created for org ${subscription.metadata.organisation_id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await billingService.handleSubscriptionUpdated({
          metadata: subscription.metadata as { organisation_id?: string; plan?: string },
        });
        console.log(`[Stripe] Subscription updated for org ${subscription.metadata.organisation_id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await billingService.handleSubscriptionDeleted({
          metadata: subscription.metadata as { organisation_id?: string },
        });
        console.log(`[Stripe] Subscription deleted for org ${subscription.metadata.organisation_id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;
        if (customerEmail) {
          await resend.emails.send({
            from: 'AuditIQ <billing@auditiq.com.au>',
            to: customerEmail,
            subject: 'Payment Failed — AuditIQ',
            html: `
              <h2>Payment Failed</h2>
              <p>We were unable to process your payment for your AuditIQ subscription.</p>
              <p>Please update your payment method within 7 days to avoid service interruption.</p>
              <p>Your data will be retained — no data will be deleted.</p>
            `,
          });
        }
        console.log(`[Stripe] Payment failed for customer ${invoice.customer}`);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});
