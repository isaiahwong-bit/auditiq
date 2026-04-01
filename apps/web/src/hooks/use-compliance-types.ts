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
  covered: boolean;
  covering_check_item_name: string | null;
  has_plan: boolean;
  plan_description: string | null;
  plan_id: string | null;
  plan_status: string | null;
  has_evidence: boolean;
  evidence_count: number;
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
