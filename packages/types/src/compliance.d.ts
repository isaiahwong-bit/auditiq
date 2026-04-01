export type FrameworkType = 'international' | 'retailer' | 'regulatory';
export type ClauseSeverity = 'critical' | 'major' | 'minor';
export interface Framework {
    id: string;
    code: string;
    name: string;
    version: string | null;
    type: FrameworkType | null;
    region: string;
    last_updated: string | null;
    is_active: boolean;
}
export interface FindingCategory {
    id: string;
    code: string;
    name: string;
    description: string | null;
    risk_weight: number | null;
    keywords: string[];
}
export interface FrameworkClause {
    id: string;
    framework_id: string;
    category_id: string;
    clause_ref: string;
    clause_title: string;
    requirement: string;
    severity: ClauseSeverity | null;
    response_hours: number | null;
    zero_tolerance: boolean;
    notes: string | null;
}
export interface SiteFramework {
    id: string;
    site_id: string;
    framework_id: string;
    enabled: boolean;
    enabled_at: string | null;
    enabled_by: string | null;
}
//# sourceMappingURL=compliance.d.ts.map