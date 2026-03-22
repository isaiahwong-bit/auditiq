import { supabaseAdmin } from '../lib/supabase';

export async function getFacilityAreas(siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('facility_areas')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return data;
}

export async function getCheckItems(facilityAreaId: string) {
  const { data, error } = await supabaseAdmin
    .from('check_items')
    .select('*')
    .eq('facility_area_id', facilityAreaId)
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return data;
}

export async function createSession(params: {
  siteId: string;
  organisationId: string;
  facilityAreaId: string;
  conductedBy: string;
  shift: string | null;
}) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('pre_op_sessions')
    .insert({
      site_id: params.siteId,
      organisation_id: params.organisationId,
      facility_area_id: params.facilityAreaId,
      conducted_by: params.conductedBy,
      shift: params.shift,
      session_date: today,
      status: 'in_progress',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('pre_op_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionResponses(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('pre_op_responses')
    .select('*, check_items(*)')
    .eq('session_id', sessionId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function submitResponse(params: {
  sessionId: string;
  checkItemId: string;
  siteId: string;
  organisationId: string;
  result: 'pass' | 'fail' | 'na';
  score: number | null;
  notes: string | null;
  photoUrls: string[];
  flagged: boolean;
}) {
  const { data, error } = await supabaseAdmin
    .from('pre_op_responses')
    .insert({
      session_id: params.sessionId,
      check_item_id: params.checkItemId,
      site_id: params.siteId,
      organisation_id: params.organisationId,
      result: params.result,
      score: params.score,
      notes: params.notes,
      photo_urls: params.photoUrls,
      flagged: params.flagged,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeSession(sessionId: string) {
  // Fetch all responses for the session
  const { data: responses, error: respError } = await supabaseAdmin
    .from('pre_op_responses')
    .select('result')
    .eq('session_id', sessionId);
  if (respError) throw respError;

  const nonNa = responses.filter((r) => r.result !== 'na');
  const passed = nonNa.filter((r) => r.result === 'pass');

  // Session overall_score = (passed items / total non-NA items) * 100, rounded to 1dp
  const overallScore = nonNa.length > 0
    ? Math.round((passed.length / nonNa.length) * 1000) / 10
    : 100;
  const passRate = overallScore;

  const { data, error } = await supabaseAdmin
    .from('pre_op_sessions')
    .update({
      status: 'complete',
      overall_score: overallScore,
      pass_rate: passRate,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('status', 'in_progress') // Only complete if still in_progress
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionsForSite(siteId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('pre_op_sessions')
    .select('*, facility_areas(name)')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getTodaySessionsForArea(siteId: string, facilityAreaId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabaseAdmin
    .from('pre_op_sessions')
    .select('*')
    .eq('site_id', siteId)
    .eq('facility_area_id', facilityAreaId)
    .eq('session_date', today);
  if (error) throw error;
  return data;
}
