import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export async function orgMiddleware(req: Request, res: Response, next: NextFunction) {
  const orgSlug = req.params.orgSlug;
  if (!orgSlug) {
    res.status(400).json({ error: 'Organisation slug is required', code: 'ORG_SLUG_MISSING' });
    return;
  }

  const { data: org, error } = await supabaseAdmin
    .from('organisations')
    .select('*')
    .eq('slug', orgSlug)
    .single();

  if (error || !org) {
    res.status(404).json({ error: 'Organisation not found', code: 'ORG_NOT_FOUND' });
    return;
  }

  // Verify user belongs to this organisation
  if (req.user?.organisation_id !== org.id) {
    res.status(403).json({ error: 'Not a member of this organisation', code: 'ORG_FORBIDDEN' });
    return;
  }

  req.org = org;
  next();
}
