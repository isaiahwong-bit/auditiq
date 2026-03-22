import { supabaseAdmin } from '../lib/supabase';

// ── Urgency → due date calculation ──────────────────────────────────────────

const URGENCY_HOURS: Record<string, number> = {
  immediate: 4,
  '24hr': 24,
  '7day': 168,
  standard: 672, // 28 days
};

function calculateDueDate(urgency: string, createdAt: Date): Date {
  const hours = URGENCY_HOURS[urgency] ?? URGENCY_HOURS.standard;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createCapa(params: {
  findingId: string | null;
  preOpResponseId: string | null;
  siteId: string;
  organisationId: string;
  assignedTo: string | null;
  title: string;
  description: string | null;
  urgency: string;
}) {
  const now = new Date();
  const dueDate = calculateDueDate(params.urgency, now);

  const { data, error } = await supabaseAdmin
    .from('capas')
    .insert({
      finding_id: params.findingId,
      pre_op_response_id: params.preOpResponseId,
      site_id: params.siteId,
      organisation_id: params.organisationId,
      assigned_to: params.assignedTo,
      title: params.title,
      description: params.description,
      urgency: params.urgency,
      due_date: dueDate.toISOString(),
      status: 'open',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCapa(capaId: string) {
  const { data, error } = await supabaseAdmin
    .from('capas')
    .select('*, user_profiles!capas_assigned_to_fkey(full_name, role)')
    .eq('id', capaId)
    .single();
  if (error) throw error;
  return data;
}

export async function listCapas(siteId: string, status?: string) {
  let query = supabaseAdmin
    .from('capas')
    .select('*, user_profiles!capas_assigned_to_fkey(full_name)')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateCapaStatus(capaId: string, status: string) {
  const updates: Record<string, unknown> = { status };

  if (status === 'closed') {
    updates.closed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('capas')
    .update(updates)
    .eq('id', capaId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignCapa(capaId: string, assignedTo: string) {
  const { data, error } = await supabaseAdmin
    .from('capas')
    .update({ assigned_to: assignedTo })
    .eq('id', capaId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addEvidence(capaId: string, evidenceUrls: string[]) {
  // Fetch existing evidence
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('capas')
    .select('evidence_urls')
    .eq('id', capaId)
    .single();
  if (fetchError) throw fetchError;

  const combined = [...(existing?.evidence_urls ?? []), ...evidenceUrls];

  const { data, error } = await supabaseAdmin
    .from('capas')
    .update({ evidence_urls: combined })
    .eq('id', capaId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function closeCapa(capaId: string, evidenceUrls: string[]) {
  if (evidenceUrls.length > 0) {
    await addEvidence(capaId, evidenceUrls);
  }
  return updateCapaStatus(capaId, 'closed');
}

export async function getOpenCapaCount(siteId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('capas')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .in('status', ['open', 'in_progress', 'overdue']);
  if (error) throw error;
  return count ?? 0;
}

export async function markOverdueCapas(): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('capas')
    .update({ status: 'overdue' })
    .in('status', ['open', 'in_progress'])
    .lt('due_date', now)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

export async function getAssigneeEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

export async function getPlantManagers(organisationId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name')
    .eq('organisation_id', organisationId)
    .eq('role', 'plant_manager');
  if (error) throw error;
  return data ?? [];
}
