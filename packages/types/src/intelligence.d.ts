export type AlertType = 'declining_trend' | 'pattern_detected' | 'threshold_approaching' | 'seasonal_risk';
export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type PlanStatus = 'active' | 'completed' | 'overdue';
export interface IntelligenceAlert {
    id: string;
    site_id: string;
    organisation_id: string;
    alert_type: AlertType;
    category_code: string | null;
    facility_area_id: string | null;
    check_item_id: string | null;
    framework_codes: string[];
    title: string;
    description: string;
    severity: AlertSeverity | null;
    status: AlertStatus;
    generated_at: string;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
}
export interface RectificationPlan {
    id: string;
    site_id: string;
    organisation_id: string;
    clause_id: string;
    facility_area_id: string | null;
    description: string;
    target_date: string | null;
    status: PlanStatus;
    created_by: string | null;
    created_at: string;
    completed_at: string | null;
}
//# sourceMappingURL=intelligence.d.ts.map