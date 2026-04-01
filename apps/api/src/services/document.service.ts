import { z } from 'zod';
import { claude } from '../lib/claude';
import { supabaseAdmin } from '../lib/supabase';

// ── Zod schemas for extraction result ────────────────────────────────────

const extractedCheckItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  scoring_type: z.enum(['pass_fail', 'numeric', 'percentage']).optional().default('pass_fail'),
  frequency: z.enum(['daily', 'per_shift', 'weekly', 'monthly']).optional().default('daily'),
  category_code: z.string().nullable().optional(),
  suggested_clause_refs: z.array(z.string()).optional().default([]),
});

const extractedAreaSchema = z.object({
  name: z.string(),
  area_type: z
    .enum(['production', 'storage', 'amenities', 'dispatch', 'external', 'equipment'])
    .nullable()
    .optional(),
  display_order: z.number().int().min(0).optional().default(0),
  check_items: z.array(extractedCheckItemSchema).optional().default([]),
});

const coverageGapSchema = z.object({
  framework_code: z.string(),
  category_code: z.string(),
  description: z.string(),
});

const extractionResultSchema = z.object({
  areas: z.array(extractedAreaSchema),
  coverage_gaps: z.array(coverageGapSchema).optional().default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;

function extractJson(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

// ── CRUD operations ──────────────────────────────────────────────────────

export async function listDocuments(siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('uploaded_documents')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDocument(documentId: string) {
  const { data, error } = await supabaseAdmin
    .from('uploaded_documents')
    .select('*')
    .eq('id', documentId)
    .single();
  if (error) throw error;
  return data;
}

export async function createDocument(params: {
  siteId: string;
  organisationId: string;
  fileUrl: string;
  fileName: string;
  documentType: string | null;
  uploadedBy: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('uploaded_documents')
    .insert({
      site_id: params.siteId,
      organisation_id: params.organisationId,
      file_url: params.fileUrl,
      file_name: params.fileName,
      document_type: params.documentType,
      processing_status: 'pending',
      uploaded_by: params.uploadedBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(documentId: string, siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('uploaded_documents')
    .delete()
    .eq('id', documentId)
    .eq('site_id', siteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── AI extraction ────────────────────────────────────────────────────────

const FINDING_CATEGORIES = [
  'pest_control', 'personal_hygiene', 'temperature_control', 'chemical_storage',
  'allergen_management', 'documentation', 'traceability', 'cleaning_sanitation',
  'equipment_maintenance', 'water_quality', 'waste_management', 'supplier_approval',
  'label_compliance', 'foreign_body', 'microbiological_risk', 'training_records',
  'ccp_monitoring', 'gmp_breach', 'facility_condition', 'cold_chain',
  'glass_brittle_plastic', 'metal_contamination', 'pest_proofing', 'product_recall',
  'environmental_monitoring', 'handwashing_facilities', 'protective_clothing',
  'segregation_raw_rte', 'cooking_temperature', 'cooling_temperature',
  'storage_conditions', 'receiving_inspection', 'dispatch_checks', 'calibration',
  'maintenance_program', 'non_conforming_product', 'customer_complaints',
  'internal_audit', 'management_review', 'corrective_action_effectiveness',
] as const;

export async function processDocument(
  documentId: string,
  input: { content?: string; imageUrl?: string },
) {
  // 1. Set status to 'processing'
  const { error: updateError } = await supabaseAdmin
    .from('uploaded_documents')
    .update({ processing_status: 'processing' })
    .eq('id', documentId);
  if (updateError) throw updateError;

  try {
    const systemPrompt = `You are a food safety document analysis engine for Australian food manufacturers. You extract facility areas and pre-operational check items from uploaded documents (pre-op checklists, HACCP plans, scope of works).

For each area, identify all check items with their appropriate scoring type and frequency. Map each check item to one of these 40 finding category codes:
${FINDING_CATEGORIES.join(', ')}

Respond with JSON only, no prose.`;

    const jsonInstructions = `Respond with JSON:
{
  "areas": [
    {
      "name": "Area name",
      "area_type": "production|storage|amenities|dispatch|external|equipment",
      "display_order": 0,
      "check_items": [
        {
          "name": "Check item name",
          "description": "What to check and how",
          "scoring_type": "pass_fail|numeric|percentage",
          "frequency": "daily|per_shift|weekly|monthly",
          "category_code": "one of the 40 category codes",
          "suggested_clause_refs": ["clause references if identifiable"]
        }
      ]
    }
  ],
  "coverage_gaps": [
    {
      "framework_code": "e.g. haccp, brcgs, sqf",
      "category_code": "category not covered",
      "description": "what is missing"
    }
  ]
}`;

    // Build message content — text or image (vision)
    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'url'; url: string } }
    > = [];

    if (input.imageUrl) {
      userContent.push({
        type: 'image',
        source: { type: 'url', url: input.imageUrl },
      });
      userContent.push({
        type: 'text',
        text: `Analyse this document image and extract all facility areas with their check items.\n\n${jsonInstructions}`,
      });
    } else if (input.content) {
      userContent.push({
        type: 'text',
        text: `Analyse this document and extract facility areas with their check items.\n\nDocument content:\n"""\n${input.content}\n"""\n\n${jsonInstructions}`,
      });
    } else {
      throw new Error('Either content or imageUrl must be provided');
    }

    // 2. Call Claude (vision-capable model handles both text and images)
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(extractJson(text));
    const validated = extractionResultSchema.parse(parsed);

    // 3. Store result and set status to 'review'
    const { error: saveError } = await supabaseAdmin
      .from('uploaded_documents')
      .update({
        extracted_json: validated,
        processing_status: 'review',
      })
      .eq('id', documentId);
    if (saveError) throw saveError;

    return validated;
  } catch (err) {
    // On failure, revert to pending
    await supabaseAdmin
      .from('uploaded_documents')
      .update({ processing_status: 'pending' })
      .eq('id', documentId);
    throw err;
  }
}

// ── Approval — creates real facility areas + check items ─────────────────

export async function approveDocument(
  documentId: string,
  siteId: string,
  orgId: string,
) {
  // Fetch the document
  const { data: doc, error: docError } = await supabaseAdmin
    .from('uploaded_documents')
    .select('*')
    .eq('id', documentId)
    .eq('site_id', siteId)
    .single();
  if (docError || !doc) throw new Error('Document not found');

  if (doc.processing_status !== 'review') {
    throw new Error(`Document must be in "review" status to approve. Current status: ${doc.processing_status}`);
  }

  const extracted = extractionResultSchema.parse(doc.extracted_json);

  // Get active framework IDs for clause linking
  const { data: activeFrameworks } = await supabaseAdmin
    .from('site_frameworks')
    .select('framework_id')
    .eq('site_id', siteId)
    .eq('enabled', true);
  const frameworkIds = (activeFrameworks ?? []).map((sf) => sf.framework_id);

  // Create facility areas and check items from extracted data
  for (const area of extracted.areas) {
    const { data: newArea, error: areaError } = await supabaseAdmin
      .from('facility_areas')
      .insert({
        site_id: siteId,
        organisation_id: orgId,
        name: area.name,
        area_type: area.area_type ?? null,
        display_order: area.display_order,
        source_document_id: documentId,
      })
      .select()
      .single();
    if (areaError) throw areaError;

    for (let i = 0; i < area.check_items.length; i++) {
      const item = area.check_items[i];

      const { data: newItem, error: itemError } = await supabaseAdmin
        .from('check_items')
        .insert({
          facility_area_id: newArea.id,
          site_id: siteId,
          organisation_id: orgId,
          name: item.name,
          description: item.description ?? null,
          scoring_type: item.scoring_type ?? 'pass_fail',
          frequency: item.frequency ?? 'daily',
          category_code: item.category_code ?? null,
          display_order: i,
          source_document_id: documentId,
        })
        .select()
        .single();
      if (itemError) throw itemError;

      // Auto-link clause refs if category_code is set and frameworks are active
      if (item.category_code && frameworkIds.length > 0) {
        await autoLinkClauseRefs(newItem.id, siteId, item.category_code, frameworkIds);
      }
    }
  }

  // Set document status to approved
  const { error: approveError } = await supabaseAdmin
    .from('uploaded_documents')
    .update({ processing_status: 'approved' })
    .eq('id', documentId);
  if (approveError) throw approveError;

  return { approved: true, areas_created: extracted.areas.length };
}

// ── Auto clause linking (same pattern as facility.service.ts) ────────────

async function autoLinkClauseRefs(
  checkItemId: string,
  siteId: string,
  categoryCode: string,
  frameworkIds: string[],
) {
  // Look up category_id from code
  const { data: category, error: catError } = await supabaseAdmin
    .from('finding_categories')
    .select('id')
    .eq('code', categoryCode)
    .single();
  if (catError || !category) return;

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
