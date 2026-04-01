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

CRITICAL RULES:

1. EXTRACTION ACCURACY:
   - ONLY extract items that are ACTUALLY WRITTEN in the document. Do NOT invent, add, or suggest check items that are not explicitly listed.
   - Read EVERY row in every table carefully. Do not skip any items, even if the text is small or rotated.
   - Use the exact wording from the document for check item names where possible.

2. AREA GROUPING:
   - Areas are the MAJOR SECTIONS or ZONES (e.g. "Change Room", "Trim General", "Veg Line"). A typical site has 3-8 areas.
   - Look for section headers, bold text, dividing lines, or labelled sections in tables.
   - Do NOT create a separate area for each individual check item.
   - Each area should contain MULTIPLE check items (typically 5-25 items per area).

3. COVERAGE GAPS (separate section):
   - Items that SHOULD exist based on food safety standards but are NOT in the document go in "coverage_gaps" ONLY.
   - NEVER add suggested/missing items as check_items within areas. Those belong exclusively in coverage_gaps.

For each check item, map it to one of these 40 finding category codes:
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
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'; data: string } }
    > = [];

    if (input.imageUrl) {
      // Fetch the image and convert to base64 for Claude Vision
      const imageResponse = await fetch(input.imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');

      // Determine media type from URL or content-type
      const contentType = imageResponse.headers.get('content-type') ?? 'image/png';
      let mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png';
      if (contentType.includes('jpeg') || contentType.includes('jpg')) mediaType = 'image/jpeg';
      else if (contentType.includes('gif')) mediaType = 'image/gif';
      else if (contentType.includes('webp')) mediaType = 'image/webp';
      else if (contentType.includes('pdf')) {
        // PDFs can't be sent as images — treat as text extraction request
        throw new Error('PDF files cannot be processed via vision. Please paste the document text content instead, or upload as an image (PNG/JPG).');
      }

      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      });
      userContent.push({
        type: 'text',
        text: `Read this document image carefully. It is a pre-operational check document from an Australian food processing facility.

INSTRUCTIONS:
1. Read EVERY SINGLE ROW in the table(s). The text may be rotated sideways — read it carefully. Do not skip any rows.
2. Identify the SECTION HEADERS that divide the document into areas (e.g. "Trim / Cook Change Room", "Trim - General", "Trim - Veg Line 1", "Trim - Leaf Line 2"). These are your facility areas.
3. List ALL check items under each section exactly as written in the document.
4. Do NOT add any check items that are not explicitly written in the document. Suggested additions go ONLY in coverage_gaps.
5. Include items like equipment names, blade checks, conveyor checks, chemical storage — everything listed in each row.

${jsonInstructions}`,
      });
    } else if (input.content) {
      userContent.push({
        type: 'text',
        text: `Analyse this document and extract facility areas with their check items.\n\nDocument content:\n"""\n${input.content}\n"""\n\n${jsonInstructions}`,
      });
    } else {
      throw new Error('Either content or imageUrl must be provided');
    }

    // 2. PASS 1 — Initial extraction
    const pass1Response = await claude.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const pass1Text = pass1Response.content[0].type === 'text' ? pass1Response.content[0].text : '';
    const pass1Parsed = JSON.parse(extractJson(pass1Text));
    const pass1Result = extractionResultSchema.parse(pass1Parsed);

    // Count items from pass 1
    const pass1ItemCount = pass1Result.areas.reduce((sum, a) => sum + a.check_items.length, 0);

    // 3. PASS 2 — Verification pass: review the extraction against the image
    const verifyContent: typeof userContent = [];

    // Re-include the image if available
    if (input.imageUrl) {
      const imageResponse2 = await fetch(input.imageUrl);
      const imageBuffer2 = await imageResponse2.arrayBuffer();
      const base64_2 = Buffer.from(imageBuffer2).toString('base64');
      const contentType2 = imageResponse2.headers.get('content-type') ?? 'image/png';
      let mediaType2: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png';
      if (contentType2.includes('jpeg') || contentType2.includes('jpg')) mediaType2 = 'image/jpeg';
      else if (contentType2.includes('gif')) mediaType2 = 'image/gif';
      else if (contentType2.includes('webp')) mediaType2 = 'image/webp';

      verifyContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType2, data: base64_2 },
      });
    }

    verifyContent.push({
      type: 'text',
      text: `I previously extracted the following from this document. Please VERIFY my extraction is complete by carefully re-reading EVERY row in every table.

My previous extraction found ${pass1Result.areas.length} areas with ${pass1ItemCount} total check items:
${JSON.stringify(pass1Parsed, null, 2)}

INSTRUCTIONS:
1. Re-read the document carefully, counting every single row/item in each section.
2. Compare against my extraction above.
3. Add ANY items I missed. Look especially for:
   - Items in small or rotated text
   - Items near section boundaries
   - Equipment-specific items (blades, conveyors, tanks, etc.)
   - Environmental items (walls, floors, drains, condensation)
4. Remove any items that are NOT actually in the document.
5. Return the COMPLETE corrected extraction.

${jsonInstructions}`,
    });

    const pass2Response = await claude.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: verifyContent }],
    });

    const pass2Text = pass2Response.content[0].type === 'text' ? pass2Response.content[0].text : '';
    const pass2Parsed = JSON.parse(extractJson(pass2Text));
    const validated = extractionResultSchema.parse(pass2Parsed);

    const pass2ItemCount = validated.areas.reduce((sum, a) => sum + a.check_items.length, 0);
    console.log(`[Document] Pass 1: ${pass1ItemCount} items, Pass 2: ${pass2ItemCount} items (${pass2ItemCount - pass1ItemCount} added in verification)`);

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
