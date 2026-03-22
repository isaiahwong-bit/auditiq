import { supabaseAdmin } from '../lib/supabase';

export async function listAlerts(siteId: string, status?: string) {
  let query = supabaseAdmin
    .from('intelligence_alerts')
    .select('*, facility_areas(name), check_items(name)')
    .eq('site_id', siteId)
    .order('generated_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getActiveAlertCount(siteId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('intelligence_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}

export async function acknowledgeAlert(alertId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('intelligence_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resolveAlert(alertId: string) {
  const { data, error } = await supabaseAdmin
    .from('intelligence_alerts')
    .update({ status: 'resolved' })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createAlert(params: {
  siteId: string;
  organisationId: string;
  alertType: string;
  categoryCode: string | null;
  facilityAreaId: string | null;
  checkItemId: string | null;
  frameworkCodes: string[];
  title: string;
  description: string;
  severity: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('intelligence_alerts')
    .insert({
      site_id: params.siteId,
      organisation_id: params.organisationId,
      alert_type: params.alertType,
      category_code: params.categoryCode,
      facility_area_id: params.facilityAreaId,
      check_item_id: params.checkItemId,
      framework_codes: params.frameworkCodes,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── 30-day pre-op analysis data fetch ────────────────────────────────────────

export async function get30DayResponses(siteId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabaseAdmin
    .from('pre_op_responses')
    .select(`
      *,
      pre_op_sessions!inner(session_date, shift, facility_area_id),
      check_items!inner(name, category_code, facility_area_id)
    `)
    .eq('site_id', siteId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getActiveSites() {
  const { data, error } = await supabaseAdmin
    .from('sites')
    .select('id, organisation_id, name, site_type')
    .eq('is_active', true);
  if (error) throw error;
  return data ?? [];
}
