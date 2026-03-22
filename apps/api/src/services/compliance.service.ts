import { supabaseAdmin } from '../lib/supabase';

// ── Framework listing & toggling ────────────────────────────────────────────

export async function getAllFrameworks() {
  const { data, error } = await supabaseAdmin
    .from('frameworks')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
}

export async function getSiteFrameworks(siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('site_frameworks')
    .select('*, frameworks(*)')
    .eq('site_id', siteId);
  if (error) throw error;
  return data;
}

export async function toggleFramework(params: {
  siteId: string;
  frameworkId: string;
  enabled: boolean;
  userId: string;
}) {
  // Upsert site_framework
  const { data: existing } = await supabaseAdmin
    .from('site_frameworks')
    .select('id')
    .eq('site_id', params.siteId)
    .eq('framework_id', params.frameworkId)
    .single();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('site_frameworks')
      .update({
        enabled: params.enabled,
        enabled_at: params.enabled ? new Date().toISOString() : null,
        enabled_by: params.enabled ? params.userId : null,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('site_frameworks')
    .insert({
      site_id: params.siteId,
      framework_id: params.frameworkId,
      enabled: params.enabled,
      enabled_at: params.enabled ? new Date().toISOString() : null,
      enabled_by: params.enabled ? params.userId : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Gap analysis ────────────────────────────────────────────────────────────

export interface ClauseStatus {
  clause_id: string;
  clause_ref: string;
  clause_title: string;
  requirement: string;
  severity: string | null;
  zero_tolerance: boolean;
  framework_code: string;
  framework_name: string;
  category_id: string;
  // Coverage
  covered: boolean;
  covering_check_item_name: string | null;
  // Rectification plan
  has_plan: boolean;
  plan_description: string | null;
  plan_id: string | null;
  plan_status: string | null;
}

export interface AreaGapSummary {
  area_id: string;
  area_name: string;
  area_type: string | null;
  total_clauses: number;
  covered: number;
  gaps: number;
  plans_in_place: number;
  clauses: ClauseStatus[];
}

export async function analyseGaps(siteId: string, organisationId: string): Promise<{
  summary: { active_frameworks: number; total_clauses: number; covered: number; gaps: number; plans_in_place: number };
  areas: AreaGapSummary[];
}> {
  // 1. Get active framework IDs for this site
  const { data: siteFrameworks } = await supabaseAdmin
    .from('site_frameworks')
    .select('framework_id, frameworks(code, name)')
    .eq('site_id', siteId)
    .eq('enabled', true);

  const activeFrameworkIds = (siteFrameworks ?? []).map((sf) => sf.framework_id);
  if (activeFrameworkIds.length === 0) {
    return { summary: { active_frameworks: 0, total_clauses: 0, covered: 0, gaps: 0, plans_in_place: 0 }, areas: [] };
  }

  // 2. Get all clauses for active frameworks
  const { data: allClauses } = await supabaseAdmin
    .from('framework_clauses')
    .select('*, frameworks!inner(code, name)')
    .in('framework_id', activeFrameworkIds);

  // 3. Get facility areas
  const { data: areas } = await supabaseAdmin
    .from('facility_areas')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('display_order');

  // 4. Get all check_item_clause_refs for this site's check items
  const { data: checkItemRefs } = await supabaseAdmin
    .from('check_item_clause_refs')
    .select('clause_id, check_items!inner(id, name, facility_area_id, site_id)')
    .eq('check_items.site_id', siteId);

  // Build a map: clause_id → { check_item_name, area_id }
  const coverageMap = new Map<string, { name: string; areaId: string }>();
  for (const ref of checkItemRefs ?? []) {
    const ci = ref.check_items as unknown as { id: string; name: string; facility_area_id: string; site_id: string };
    coverageMap.set(ref.clause_id, { name: ci.name, areaId: ci.facility_area_id });
  }

  // 5. Get rectification plans for this site
  const { data: plans } = await supabaseAdmin
    .from('rectification_plans')
    .select('*')
    .eq('site_id', siteId);

  const planMap = new Map<string, { id: string; description: string; status: string }>();
  for (const plan of plans ?? []) {
    planMap.set(plan.clause_id, { id: plan.id, description: plan.description, status: plan.status });
  }

  // 6. Build clause statuses per area
  const clausesList = allClauses ?? [];
  const areaResults: AreaGapSummary[] = (areas ?? []).map((area) => {
    // Find clauses relevant to this area (covered by a check item in this area)
    // Plus all clauses that are NOT covered anywhere (gaps)
    const areaClauses: ClauseStatus[] = [];

    for (const clause of clausesList) {
      const fw = clause.frameworks as unknown as { code: string; name: string };
      const coverage = coverageMap.get(clause.id);
      const plan = planMap.get(clause.id);

      // Include if this clause is covered by a check item in this area,
      // or if it has a plan linked to this area
      const isInThisArea = coverage?.areaId === area.id ||
        (plan && (plans ?? []).find((p) => p.clause_id === clause.id && p.facility_area_id === area.id));

      if (isInThisArea || !coverage) {
        areaClauses.push({
          clause_id: clause.id,
          clause_ref: clause.clause_ref,
          clause_title: clause.clause_title,
          requirement: clause.requirement,
          severity: clause.severity,
          zero_tolerance: clause.zero_tolerance,
          framework_code: fw.code,
          framework_name: fw.name,
          category_id: clause.category_id,
          covered: !!coverage,
          covering_check_item_name: coverage?.name ?? null,
          has_plan: !!plan,
          plan_description: plan?.description ?? null,
          plan_id: plan?.id ?? null,
          plan_status: plan?.status ?? null,
        });
      }
    }

    // Deduplicate — only show uncovered clauses in the first area
    const covered = areaClauses.filter((c) => c.covered).length;
    const withPlan = areaClauses.filter((c) => !c.covered && c.has_plan).length;
    const gaps = areaClauses.filter((c) => !c.covered && !c.has_plan).length;

    return {
      area_id: area.id,
      area_name: area.name,
      area_type: area.area_type,
      total_clauses: areaClauses.length,
      covered,
      gaps,
      plans_in_place: withPlan,
      clauses: areaClauses,
    };
  });

  // Overall summary
  const totalClauses = clausesList.length;
  const totalCovered = clausesList.filter((c) => coverageMap.has(c.id)).length;
  const totalWithPlan = clausesList.filter((c) => !coverageMap.has(c.id) && planMap.has(c.id)).length;
  const totalGaps = totalClauses - totalCovered - totalWithPlan;

  return {
    summary: {
      active_frameworks: activeFrameworkIds.length,
      total_clauses: totalClauses,
      covered: totalCovered,
      gaps: totalGaps,
      plans_in_place: totalWithPlan,
    },
    areas: areaResults,
  };
}

// ── Rectification plans ─────────────────────────────────────────────────────

export async function createRectificationPlan(params: {
  siteId: string;
  organisationId: string;
  clauseId: string;
  facilityAreaId: string | null;
  description: string;
  targetDate: string | null;
  createdBy: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('rectification_plans')
    .insert({
      site_id: params.siteId,
      organisation_id: params.organisationId,
      clause_id: params.clauseId,
      facility_area_id: params.facilityAreaId,
      description: params.description,
      target_date: params.targetDate,
      status: 'active',
      created_by: params.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeRectificationPlan(planId: string) {
  const { data, error } = await supabaseAdmin
    .from('rectification_plans')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
