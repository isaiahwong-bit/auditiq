import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token', code: 'AUTH_MISSING' });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_INVALID' });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    res.status(403).json({ error: 'User profile not found', code: 'PROFILE_MISSING' });
    return;
  }

  req.user = profile;
  req.accessToken = token;
  next();
}
