import { z } from 'zod';
import { claude } from '../lib/claude';
import { supabaseAdmin } from '../lib/supabase';

// ── Zod schemas for Claude response validation ──────────────────────────────

const classificationSchema = z.object({
  category_code: z.string(),
  confidence: z.number(),
  risk_rating: z.enum(['critical', 'high', 'medium', 'low']),
  keywords_matched: z.array(z.string()),
});

const clauseRefSchema = z.object({
  framework_code: z.string(),
  clause_ref: z.string(),
  gap_detected: z.boolean(),
  gap_description: z.string().nullable(),
  capa_urgency: z.enum(['immediate', '24hr', '7day', 'standard']).nullable(),
});

const narrativeSchema = z.object({
  finding_title: z.string(),
  finding_narrative: z.string(),
  recommended_action: z.string(),
  clause_refs: z.array(clauseRefSchema),
});

export type ClassificationResult = z.infer<typeof classificationSchema>;
export type NarrativeResult = z.infer<typeof narrativeSchema>;

// ── Step 1: Classification (claude-sonnet-4-6) ──────────────────────────────

export async function classifyObservation(
  rawObservation: string,
  siteType: string | null,
): Promise<ClassificationResult> {
  // Fetch all 40 finding categories with keywords
  const { data: categories, error } = await supabaseAdmin
    .from('finding_categories')
    .select('code, name, keywords')
    .order('code');
  if (error) throw error;

  const categoryList = categories
    .map((c) => `${c.code} | ${c.name} | keywords: ${(c.keywords ?? []).join(', ')}`)
    .join('\n');

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 256,
    system: `You are a food safety audit classification engine. Given an observation, classify it into exactly one of the following categories. Respond with JSON only, no prose.

Categories (code | name | keywords):
${categoryList}`,
    messages: [
      {
        role: 'user',
        content: `Observation: "${rawObservation}"
Site type: ${siteType ?? 'unknown'}

Respond with JSON: { "category_code": string, "confidence": number (0-1), "risk_rating": "critical"|"high"|"medium"|"low", "keywords_matched": string[] }`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);
  return classificationSchema.parse(parsed);
}

// ── Step 2: Narrative generation (claude-opus-4-6) ──────────────────────────

export async function generateNarrative(params: {
  rawObservation: string;
  categoryCode: string;
  riskRating: string;
  siteId: string;
  siteType: string | null;
}): Promise<NarrativeResult> {
  // Look up category_id from code
  const { data: category, error: catError } = await supabaseAdmin
    .from('finding_categories')
    .select('id, name')
    .eq('code', params.categoryCode)
    .single();
  if (catError || !category) throw new Error(`Category not found: ${params.categoryCode}`);

  // Pre-fetch clauses for active frameworks at this site, filtered by category
  const { data: clauses, error: clauseError } = await supabaseAdmin
    .from('framework_clauses')
    .select(`
      *,
      frameworks!inner(code, name)
    `)
    .eq('category_id', category.id)
    .in(
      'framework_id',
      // Subquery: active framework IDs for this site
      (await supabaseAdmin
        .from('site_frameworks')
        .select('framework_id')
        .eq('site_id', params.siteId)
        .eq('enabled', true)
      ).data?.map((sf) => sf.framework_id) ?? [],
    );
  if (clauseError) throw clauseError;

  const clauseContext = (clauses ?? [])
    .map(
      (c) =>
        `[${(c.frameworks as { code: string }).code}] ${c.clause_ref} — ${c.clause_title}\n  Requirement: ${c.requirement}\n  Severity: ${c.severity ?? 'n/a'} | Response: ${c.response_hours ?? 'n/a'}hrs | Zero tolerance: ${c.zero_tolerance}`,
    )
    .join('\n\n');

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 1024,
    system: `You are a food safety audit narrative generator for Australian food manufacturers. Given an observation, its classification, and the relevant framework clauses, generate a professional finding with clause mapping.

Respond with JSON only, no prose.`,
    messages: [
      {
        role: 'user',
        content: `Observation: "${params.rawObservation}"
Category: ${params.categoryCode} (${category.name})
Risk rating: ${params.riskRating}
Site type: ${params.siteType ?? 'unknown'}

Active framework clauses for this category:
${clauseContext || 'No active framework clauses found for this category.'}

Respond with JSON:
{
  "finding_title": "concise professional title",
  "finding_narrative": "detailed narrative explaining the finding, its impact, and context",
  "recommended_action": "specific corrective action recommendation",
  "clause_refs": [
    {
      "framework_code": "the framework code",
      "clause_ref": "the clause reference",
      "gap_detected": true/false,
      "gap_description": "description of the gap if detected, null otherwise",
      "capa_urgency": "immediate|24hr|7day|standard or null"
    }
  ]
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);
  return narrativeSchema.parse(parsed);
}

// ── Combined two-step finding generation ────────────────────────────────────

export async function generateFinding(params: {
  rawObservation: string;
  siteId: string;
  siteType: string | null;
}) {
  // Step 1: Classification
  const classification = await classifyObservation(params.rawObservation, params.siteType);

  // Step 2: Narrative generation with pre-fetched clauses
  const narrative = await generateNarrative({
    rawObservation: params.rawObservation,
    categoryCode: classification.category_code,
    riskRating: classification.risk_rating,
    siteId: params.siteId,
    siteType: params.siteType,
  });

  return {
    classification,
    narrative,
  };
}
