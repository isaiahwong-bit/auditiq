import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export const adminRoutes = Router();

// Admin auth — protected by AUDITIQ_ADMIN_SECRET, not Supabase role
function adminAuth(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.AUDITIQ_ADMIN_SECRET) {
    res.status(403).json({ error: 'Unauthorized', code: 'ADMIN_FORBIDDEN' });
    return;
  }
  next();
}

adminRoutes.use(adminAuth);

// GET /organisations — list all organisations
adminRoutes.get('/organisations', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('organisations')
      .select('*, sites(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /organisations/:orgId — get org details with users and sites
adminRoutes.get('/organisations/:orgId', async (req, res, next) => {
  try {
    const { data: org } = await supabaseAdmin
      .from('organisations')
      .select('*')
      .eq('id', req.params.orgId)
      .single();

    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('organisation_id', req.params.orgId);

    const { data: users } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('organisation_id', req.params.orgId);

    res.json({ data: { ...org, sites, users } });
  } catch (err) {
    next(err);
  }
});

// PATCH /organisations/:orgId — update org (plan, name, etc)
adminRoutes.patch('/organisations/:orgId', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('organisations')
      .update(req.body)
      .eq('id', req.params.orgId)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /stats — platform-wide stats
adminRoutes.get('/stats', async (_req, res, next) => {
  try {
    const [orgs, sites, users, audits, capas] = await Promise.all([
      supabaseAdmin.from('organisations').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('sites').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('audits').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('capas').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'overdue']),
    ]);

    res.json({
      data: {
        organisations: orgs.count ?? 0,
        sites: sites.count ?? 0,
        users: users.count ?? 0,
        audits: audits.count ?? 0,
        open_capas: capas.count ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
