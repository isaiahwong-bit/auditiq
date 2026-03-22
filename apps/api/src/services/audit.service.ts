import { supabaseAdmin } from '../lib/supabase';

export async function createAudit(params: {
  siteId: string;
  organisationId: string;
  conductedBy: string;
  auditType: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('audits')
    .insert({
      site_id: params.siteId,
      organisation_id: params.organisationId,
      conducted_by: params.conductedBy,
      audit_type: params.auditType,
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAudit(auditId: string) {
  const { data, error } = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .single();
  if (error) throw error;
  return data;
}

export async function listAudits(siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function startAudit(auditId: string) {
  const { data, error } = await supabaseAdmin
    .from('audits')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', auditId)
    .eq('status', 'draft')
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeAudit(auditId: string) {
  // Calculate overall score from findings
  const { data: findings } = await supabaseAdmin
    .from('findings')
    .select('risk_rating')
    .eq('audit_id', auditId);

  const total = findings?.length ?? 0;
  const critical = findings?.filter((f) => f.risk_rating === 'critical').length ?? 0;
  const high = findings?.filter((f) => f.risk_rating === 'high').length ?? 0;

  // Simple scoring: 100 - (critical * 15) - (high * 8) - (medium * 3) - (low * 1)
  const medium = findings?.filter((f) => f.risk_rating === 'medium').length ?? 0;
  const low = findings?.filter((f) => f.risk_rating === 'low').length ?? 0;
  const score = Math.max(0, 100 - critical * 15 - high * 8 - medium * 3 - low * 1);

  const { data, error } = await supabaseAdmin
    .from('audits')
    .update({
      status: 'complete',
      overall_score: total > 0 ? score : null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', auditId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createFinding(params: {
  auditId: string;
  siteId: string;
  organisationId: string;
  rawObservation: string;
  categoryCode: string | null;
  findingTitle: string | null;
  findingNarrative: string | null;
  recommendedAction: string | null;
  riskRating: string | null;
  photoUrls: string[];
  aiConfidence: number | null;
}) {
  const { data, error } = await supabaseAdmin
    .from('findings')
    .insert({
      audit_id: params.auditId,
      site_id: params.siteId,
      organisation_id: params.organisationId,
      raw_observation: params.rawObservation,
      category_code: params.categoryCode,
      finding_title: params.findingTitle,
      finding_narrative: params.findingNarrative,
      recommended_action: params.recommendedAction,
      risk_rating: params.riskRating,
      photo_urls: params.photoUrls,
      ai_confidence: params.aiConfidence,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createFindingClauseRefs(
  findingId: string,
  clauseRefs: Array<{
    clauseId: string;
    gapDetected: boolean;
    gapDescription: string | null;
    capaUrgency: string | null;
  }>,
) {
  if (clauseRefs.length === 0) return [];

  const rows = clauseRefs.map((ref) => ({
    finding_id: findingId,
    clause_id: ref.clauseId,
    gap_detected: ref.gapDetected,
    gap_description: ref.gapDescription,
    capa_urgency: ref.capaUrgency,
    auto_mapped: true,
  }));

  const { data, error } = await supabaseAdmin
    .from('finding_clause_refs')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

export async function getFindingsForAudit(auditId: string) {
  const { data, error } = await supabaseAdmin
    .from('findings')
    .select('*, finding_clause_refs(*, framework_clauses(clause_ref, clause_title, frameworks(code, name)))')
    .eq('audit_id', auditId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function resolveClauseIds(
  siteId: string,
  clauseRefs: Array<{ framework_code: string; clause_ref: string }>,
): Promise<Map<string, string>> {
  // Resolve framework_code + clause_ref pairs to clause IDs
  const map = new Map<string, string>();
  if (clauseRefs.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from('framework_clauses')
    .select('id, clause_ref, frameworks!inner(code)')
    .in(
      'framework_id',
      (await supabaseAdmin
        .from('site_frameworks')
        .select('framework_id')
        .eq('site_id', siteId)
        .eq('enabled', true)
      ).data?.map((sf) => sf.framework_id) ?? [],
    );
  if (error) throw error;

  for (const clause of data ?? []) {
    const fwCode = (clause.frameworks as unknown as { code: string }).code;
    map.set(`${fwCode}:${clause.clause_ref}`, clause.id);
  }
  return map;
}
