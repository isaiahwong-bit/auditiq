import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export async function siteMiddleware(req: Request, res: Response, next: NextFunction) {
  const siteSlug = req.params.siteSlug;
  if (!siteSlug) {
    res.status(400).json({ error: 'Site slug is required', code: 'SITE_SLUG_MISSING' });
    return;
  }

  if (!req.org) {
    res.status(500).json({ error: 'Org middleware must run before site middleware', code: 'MIDDLEWARE_ORDER' });
    return;
  }

  const { data: site, error } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('slug', siteSlug)
    .eq('organisation_id', req.org.id)
    .single();

  if (error || !site) {
    res.status(404).json({ error: 'Site not found', code: 'SITE_NOT_FOUND' });
    return;
  }

  // Verify user has access to this site (admins get all sites in their org)
  if (req.user?.role !== 'admin') {
    const { data: siteUser } = await supabaseAdmin
      .from('site_users')
      .select('user_id')
      .eq('user_id', req.user!.id)
      .eq('site_id', site.id)
      .single();

    if (!siteUser) {
      res.status(403).json({ error: 'No access to this site', code: 'SITE_FORBIDDEN' });
      return;
    }
  }

  req.site = site;
  next();
}
