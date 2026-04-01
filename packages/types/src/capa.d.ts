export type CapaUrgency = 'immediate' | '24hr' | '7day' | 'standard';
export type CapaStatus = 'open' | 'in_progress' | 'closed' | 'overdue';
export interface Capa {
    id: string;
    finding_id: string | null;
    pre_op_response_id: string | null;
    site_id: string;
    organisation_id: string;
    assigned_to: string | null;
    title: string;
    description: string | null;
    due_date: string | null;
    urgency: CapaUrgency | null;
    status: CapaStatus;
    evidence_urls: string[];
    closed_at: string | null;
    created_at: string;
}
//# sourceMappingURL=capa.d.ts.map