export type AreaType = 'production' | 'storage' | 'amenities' | 'dispatch' | 'external' | 'equipment';
export type ScoringType = 'pass_fail' | 'numeric' | 'percentage';
export type Frequency = 'daily' | 'per_shift' | 'weekly' | 'monthly';
export type SessionStatus = 'in_progress' | 'complete' | 'missed';
export type ResponseResult = 'pass' | 'fail' | 'na';

export interface FacilityArea {
  id: string;
  site_id: string;
  organisation_id: string;
  name: string;
  area_type: AreaType | null;
  display_order: number;
  is_active: boolean;
  source_document_id: string | null;
  created_at: string;
}

export interface CheckItem {
  id: string;
  facility_area_id: string;
  site_id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  scoring_type: ScoringType;
  score_min: number | null;
  score_max: number | null;
  pass_threshold: number | null;
  frequency: Frequency;
  frequency_times: number;
  assignable_to: 'qa_manager' | 'operator' | 'any';
  category_code: string | null;
  display_order: number;
  is_active: boolean;
  source_document_id: string | null;
  created_at: string;
}

export interface CheckItemClauseRef {
  check_item_id: string;
  clause_id: string;
}

export interface PreOpSession {
  id: string;
  site_id: string;
  organisation_id: string;
  facility_area_id: string;
  conducted_by: string;
  shift: 'am' | 'pm' | 'night' | null;
  session_date: string;
  status: SessionStatus;
  overall_score: number | null;
  pass_rate: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface PreOpResponse {
  id: string;
  session_id: string;
  check_item_id: string;
  site_id: string;
  organisation_id: string;
  result: ResponseResult | null;
  score: number | null;
  notes: string | null;
  photo_urls: string[];
  flagged: boolean;
  created_at: string;
}
