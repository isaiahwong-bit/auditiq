export type AuditType = 'internal' | 'third_party' | 'supplier';
export type AuditStatus = 'draft' | 'in_progress' | 'complete' | 'reported';
export type RiskRating = 'critical' | 'high' | 'medium' | 'low';

export interface Audit {
  id: string;
  site_id: string;
  organisation_id: string;
  conducted_by: string | null;
  audit_type: AuditType | null;
  status: AuditStatus;
  overall_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Finding {
  id: string;
  audit_id: string;
  site_id: string;
  organisation_id: string;
  raw_observation: string;
  category_code: string | null;
  finding_title: string | null;
  finding_narrative: string | null;
  recommended_action: string | null;
  risk_rating: RiskRating | null;
  photo_urls: string[];
  ai_confidence: number | null;
  created_at: string;
}

export interface FindingClauseRef {
  id: string;
  finding_id: string;
  clause_id: string;
  gap_detected: boolean;
  gap_description: string | null;
  capa_urgency: string | null;
  auto_mapped: boolean;
}
