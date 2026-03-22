import { Router } from 'express';
import { z } from 'zod';
import * as auditService from '../services/audit.service';

export const findingRoutes = Router();

// GET /:auditId/findings — list findings for an audit
findingRoutes.get('/:auditId', async (req, res, next) => {
  try {
    const findings = await auditService.getFindingsForAudit(req.params.auditId);
    res.json({ data: findings });
  } catch (err) {
    next(err);
  }
});

// POST / — create a finding (after AI generation or manual entry)
const createFindingSchema = z.object({
  audit_id: z.string().uuid(),
  raw_observation: z.string().min(1),
  category_code: z.string().nullable().optional(),
  finding_title: z.string().nullable().optional(),
  finding_narrative: z.string().nullable().optional(),
  recommended_action: z.string().nullable().optional(),
  risk_rating: z.enum(['critical', 'high', 'medium', 'low']).nullable().optional(),
  photo_urls: z.array(z.string()).optional(),
  ai_confidence: z.number().nullable().optional(),
  clause_refs: z
    .array(
      z.object({
        framework_code: z.string(),
        clause_ref: z.string(),
        gap_detected: z.boolean(),
        gap_description: z.string().nullable(),
        capa_urgency: z.enum(['immediate', '24hr', '7day', 'standard']).nullable(),
      }),
    )
    .optional(),
});

findingRoutes.post('/', async (req, res, next) => {
  try {
    const body = createFindingSchema.parse(req.body);

    // Create the finding
    const finding = await auditService.createFinding({
      auditId: body.audit_id,
      siteId: req.site!.id,
      organisationId: req.org!.id,
      rawObservation: body.raw_observation,
      categoryCode: body.category_code ?? null,
      findingTitle: body.finding_title ?? null,
      findingNarrative: body.finding_narrative ?? null,
      recommendedAction: body.recommended_action ?? null,
      riskRating: body.risk_rating ?? null,
      photoUrls: body.photo_urls ?? [],
      aiConfidence: body.ai_confidence ?? null,
    });

    // Resolve clause refs and create finding_clause_refs
    if (body.clause_refs?.length) {
      const clauseIdMap = await auditService.resolveClauseIds(
        req.site!.id,
        body.clause_refs.map((cr) => ({
          framework_code: cr.framework_code,
          clause_ref: cr.clause_ref,
        })),
      );

      const resolved = body.clause_refs
        .map((cr) => {
          const clauseId = clauseIdMap.get(`${cr.framework_code}:${cr.clause_ref}`);
          if (!clauseId) return null;
          return {
            clauseId,
            gapDetected: cr.gap_detected,
            gapDescription: cr.gap_description,
            capaUrgency: cr.capa_urgency,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (resolved.length > 0) {
        await auditService.createFindingClauseRefs(finding.id, resolved);
      }
    }

    res.status(201).json({ data: finding });
  } catch (err) {
    next(err);
  }
});
