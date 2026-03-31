import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY not set — email disabled');
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'missing');
