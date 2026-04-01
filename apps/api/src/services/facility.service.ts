import { supabaseAdmin } from '../lib/supabase';

// ── Facility areas ────────────────────────────────────────────────────────

export async function listAreas(siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('facility_areas')
    .select('*, check_items(id)')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;

  return (data ?? []).map((area) => ({
    ...area,
    check_item_count: Array.isArray(area.check_items) ? area.check_items.length : 0,
    check_items: undefined,
  }));
}

export async function createArea(params: {
  siteId: string;
  organisationId: string;
  name: string;
  areaType: string | null;
  displayOrder: number;
}) {
  const { data, error } = await supabaseAdmin
    .from('facility_areas')
    .insert({
      site_id: params.siteId,
      organisation_id: params.organisationId,
      name: params.name,
      area_type: params.areaType,
      display_order: params.displayOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateArea(
  areaId: string,
  siteId: string,
  params: {
    name?: string;
    areaType?: string | null;
    displayOrder?: number;
  },
) {
  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.areaType !== undefined) updates.area_type = params.areaType;
  if (params.displayOrder !== undefined) updates.display_order = params.displayOrder;

  const { data, error } = await supabaseAdmin
    .from('facility_areas')
    .update(updates)
    .eq('id', areaId)
    .eq('site_id', siteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteArea(areaId: string, siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('facility_areas')
    .update({ is_active: false })
    .eq('id', areaId)
    .eq('site_id', siteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reorderAreas(
  siteId: string,
  orderings: Array<{ id: string; display_order: number }>,
) {
  const results = [];
  for (const item of orderings) {
    const { data, error } = await supabaseAdmin
      .from('facility_areas')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
      .eq('site_id', siteId)
      .select()
      .single();
    if (error) throw error;
    results.push(data);
  }
  return results;
}

// ── Check items ───────────────────────────────────────────────────────────

export async function listCheckItems(areaId: string, siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('check_items')
    .select('*')
    .eq('facility_area_id', areaId)
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function createCheckItem(params: {
  facilityAreaId: string;
  siteId: string;
  organisationId: string;
  name: string;
  description: string | null;
  scoringType: string;
  frequency: string;
  categoryCode: string | null;
  displayOrder: number;
}) {
  const { data, error } = await supabaseAdmin
    .from('check_items')
    .insert({
      facility_area_id: params.facilityAreaId,
      site_id: params.siteId,
      organisation_id: params.organisationId,
      name: params.name,
      description: params.description,
      scoring_type: params.scoringType,
      frequency: params.frequency,
      category_code: params.categoryCode,
      display_order: params.displayOrder,
    })
    .select()
    .single();
  if (error) throw error;

  // Auto-link clause refs if category_code is set
  if (params.categoryCode) {
    await autoLinkClauseRefs(data.id, params.siteId, params.categoryCode);
  }

  return data;
}

export async function updateCheckItem(
  itemId: string,
  areaId: string,
  siteId: string,
  params: {
    name?: string;
    description?: string | null;
    scoringType?: string;
    frequency?: string;
    categoryCode?: string | null;
    displayOrder?: number;
  },
) {
  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.scoringType !== undefined) updates.scoring_type = params.scoringType;
  if (params.frequency !== undefined) updates.frequency = params.frequency;
  if (params.categoryCode !== undefined) updates.category_code = params.categoryCode;
  if (params.displayOrder !== undefined) updates.display_order = params.displayOrder;

  const { data, error } = await supabaseAdmin
    .from('check_items')
    .update(updates)
    .eq('id', itemId)
    .eq('facility_area_id', areaId)
    .eq('site_id', siteId)
    .select()
    .single();
  if (error) throw error;

  // Re-link clause refs if category_code changed
  if (params.categoryCode !== undefined) {
    // Remove existing auto-linked refs
    await supabaseAdmin
      .from('check_item_clause_refs')
      .delete()
      .eq('check_item_id', itemId);

    if (params.categoryCode) {
      await autoLinkClauseRefs(itemId, siteId, params.categoryCode);
    }
  }

  return data;
}

export async function deleteCheckItem(itemId: string, areaId: string, siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('check_items')
    .update({ is_active: false })
    .eq('id', itemId)
    .eq('facility_area_id', areaId)
    .eq('site_id', siteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Auto clause linking ──────────────────────────────────────────────────

async function autoLinkClauseRefs(
  checkItemId: string,
  siteId: string,
  categoryCode: string,
) {
  // Look up category_id from code
  const { data: category, error: catError } = await supabaseAdmin
    .from('finding_categories')
    .select('id')
    .eq('code', categoryCode)
    .single();
  if (catError || !category) return;

  // Get active framework clauses for this category
  const { data: activeFrameworkIds } = await supabaseAdmin
    .from('site_frameworks')
    .select('framework_id')
    .eq('site_id', siteId)
    .eq('enabled', true);

  if (!activeFrameworkIds || activeFrameworkIds.length === 0) return;

  const frameworkIds = activeFrameworkIds.map((sf) => sf.framework_id);

  const { data: clauses, error: clauseError } = await supabaseAdmin
    .from('framework_clauses')
    .select('id')
    .eq('category_id', category.id)
    .in('framework_id', frameworkIds);
  if (clauseError || !clauses || clauses.length === 0) return;

  const rows = clauses.map((clause) => ({
    check_item_id: checkItemId,
    clause_id: clause.id,
  }));

  await supabaseAdmin
    .from('check_item_clause_refs')
    .upsert(rows, { onConflict: 'check_item_id,clause_id' });
}

// ── Finding categories (for dropdowns) ───────────────────────────────────

export async function listFindingCategories() {
  const { data, error } = await supabaseAdmin
    .from('finding_categories')
    .select('id, code, name')
    .order('code');
  if (error) throw error;
  return data ?? [];
}
