export type DocumentType = 'pre_op_checklist' | 'scope_of_works' | 'haccp_plan' | 'other';
export type ProcessingStatus = 'pending' | 'processing' | 'review' | 'approved';
export interface UploadedDocument {
    id: string;
    site_id: string;
    organisation_id: string;
    file_url: string;
    file_name: string;
    document_type: DocumentType | null;
    processing_status: ProcessingStatus;
    extracted_json: Record<string, unknown> | null;
    uploaded_by: string | null;
    created_at: string;
}
//# sourceMappingURL=document.d.ts.map