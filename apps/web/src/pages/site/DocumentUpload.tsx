import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { supabase } from '../../lib/supabase';
import {
  useDocuments,
  useDocument,
  useUploadDocument,
  useProcessDocument,
  useApproveDocument,
  useDeleteDocument,
} from '../../hooks/use-documents';

const DOCUMENT_TYPES = [
  { value: 'pre_op_checklist', label: 'Pre-op Checklist' },
  { value: 'scope_of_works', label: 'Scope of Works' },
  { value: 'haccp_plan', label: 'HACCP Plan' },
  { value: 'other', label: 'Other' },
] as const;

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    case 'processing':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'review':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'approved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
}

function docTypeLabel(type: string | null) {
  const found = DOCUMENT_TYPES.find((d) => d.value === type);
  return found ? found.label : 'Unknown';
}

function areaTypeBadge(type: string | null | undefined) {
  switch (type) {
    case 'production':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'storage':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'amenities':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'dispatch':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'external':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    case 'equipment':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
}

interface ExtractedCheckItem {
  name: string;
  description?: string | null;
  scoring_type?: string;
  frequency?: string;
  category_code?: string | null;
  suggested_clause_refs?: string[];
}

interface ExtractedArea {
  name: string;
  area_type?: string | null;
  display_order?: number;
  check_items?: ExtractedCheckItem[];
}

interface CoverageGap {
  framework_code: string;
  category_code: string;
  description: string;
}

interface ExtractionResult {
  areas: ExtractedArea[];
  coverage_gaps?: CoverageGap[];
}

export default function DocumentUpload() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const processDocument = useProcessDocument();
  const approveDocument = useApproveDocument();
  const deleteDocument = useDeleteDocument();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const { data: selectedDoc } = useDocument(selectedDocId);

  // Upload form state
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState<string>('pre_op_checklist');
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Review state
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());

  const toggleArea = useCallback((index: number) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const isImageOrPdf = (file: File) =>
    file.type.startsWith('image/') || file.type === 'application/pdf';

  const handleFile = useCallback((file: File) => {
    setDocName(file.name);
    if (isImageOrPdf(file)) {
      setSelectedFile(file);
      setDocContent('');
    } else {
      setSelectedFile(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') setDocContent(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUploadAndProcess = useCallback(async () => {
    if (!docContent.trim() && !selectedFile) return;

    const fileName = docName.trim() || 'Pasted document';

    try {
      let fileUrl = `text://${fileName}`;
      let imageUrl: string | undefined;

      // If we have a file (image or PDF), upload to Supabase Storage
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop() ?? 'bin';
        const storagePath = `documents/${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, selectedFile, { contentType: selectedFile.type });

        if (uploadError) {
          // Try creating the bucket if it doesn't exist
          if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
            await supabase.storage.createBucket('documents', { public: true });
            const { error: retryError } = await supabase.storage
              .from('documents')
              .upload(storagePath, selectedFile, { contentType: selectedFile.type });
            if (retryError) throw retryError;
          } else {
            throw uploadError;
          }
        }

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
        fileUrl = urlData.publicUrl;
        imageUrl = fileUrl;
      }

      // Create the document record
      const doc = await uploadDocument.mutateAsync({
        file_url: fileUrl,
        file_name: fileName,
        document_type: docType,
      });

      // Trigger processing — with image URL or text content
      await processDocument.mutateAsync({
        documentId: doc.id,
        content: docContent.trim() || undefined,
        image_url: imageUrl,
      });

      // Select the document to show results
      setSelectedDocId(doc.id);
      setShowUpload(false);
      setDocName('');
      setDocContent('');
      setSelectedFile(null);
      setExpandedAreas(new Set());
    } catch {
      // Error is surfaced by TanStack Query
    }
  }, [docContent, docName, docType, selectedFile, uploadDocument, processDocument]);

  const handleApprove = useCallback(
    async (documentId: string) => {
      try {
        await approveDocument.mutateAsync(documentId);
        setSelectedDocId(null);
      } catch {
        // Error surfaced by TanStack Query
      }
    },
    [approveDocument],
  );

  const handleReprocess = useCallback(
    async (documentId: string) => {
      const doc = documents?.find((d) => d.id === documentId);
      if (!doc) return;

      // For re-processing, we need the content again. Since we stored it as text://,
      // prompt the user to paste again or use stored content
      const content = prompt('Paste the document content to re-process:');
      if (!content) return;

      try {
        await processDocument.mutateAsync({ documentId, content });
        setExpandedAreas(new Set());
      } catch {
        // Error surfaced by TanStack Query
      }
    },
    [documents, processDocument],
  );

  const handleDelete = useCallback(
    async (documentId: string) => {
      if (!confirm('Delete this document? This cannot be undone.')) return;
      try {
        await deleteDocument.mutateAsync(documentId);
        if (selectedDocId === documentId) {
          setSelectedDocId(null);
        }
      } catch {
        // Error surfaced by TanStack Query
      }
    },
    [deleteDocument, selectedDocId],
  );

  const extracted: ExtractionResult | null =
    selectedDoc?.extracted_json && selectedDoc.processing_status === 'review'
      ? (selectedDoc.extracted_json as unknown as ExtractionResult)
      : null;

  const isProcessing = processDocument.isPending || uploadDocument.isPending;
  const isApproving = approveDocument.isPending;

  return (
    <div>
      <PageHeader
        title="Document Ingestion"
        description="Upload documents for AI-powered facility area and check item extraction"
        actions={
          <Link
            to={`/${orgSlug}/sites/${siteSlug}/settings`}
            className="text-sm text-brand-gray hover:text-gray-700 dark:hover:text-gray-300"
          >
            Back to Settings
          </Link>
        }
      />
      <div className="p-6 md:p-8">
        {/* Upload section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gray">
              Upload Document
            </h2>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="rounded-lg bg-brand-green px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-green/90 transition-colors"
            >
              {showUpload ? 'Cancel' : 'New Upload'}
            </button>
          </div>

          {showUpload && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              {/* Document type */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-brand-gray mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag and drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mb-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-brand-green bg-brand-green-light/20 dark:bg-brand-green/5'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                }`}
              >
                <UploadIcon />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop a file here, or{' '}
                  <label className="cursor-pointer font-medium text-brand-green hover:text-brand-green/80">
                    browse
                    <input
                      type="file"
                      accept=".txt,.csv,.md,.doc,.docx,.pdf,.png,.jpg,.jpeg,.webp,.heic"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="mt-1 text-xs text-brand-gray">
                  Images (PNG, JPG), PDFs, or text files. AI reads documents directly.
                </p>
                {docName && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Selected: {docName}
                    </p>
                    {selectedFile?.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="mt-2 mx-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                    )}
                    {selectedFile?.type === 'application/pdf' && (
                      <p className="mt-1 text-xs text-brand-blue">PDF will be analysed by AI vision</p>
                    )}
                  </div>
                )}
              </div>

              {/* Or paste content */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-brand-gray mb-1">
                  Or paste document content directly
                </label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Paste your pre-op checklist, HACCP plan, or scope of works content here..."
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              {/* Document name override */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-brand-gray mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Kelso Pre-op Checklist v2"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              {/* Errors */}
              {(uploadDocument.error || processDocument.error) && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  {uploadDocument.error?.message || processDocument.error?.message}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleUploadAndProcess}
                disabled={(!docContent.trim() && !selectedFile) || isProcessing}
                className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Extracting with AI...
                  </span>
                ) : (
                  'Upload & Extract'
                )}
              </button>
            </div>
          )}
        </section>

        {/* Document list */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Documents ({documents?.length ?? 0})
          </h2>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
              <span className="ml-2 text-sm text-brand-gray">Loading documents...</span>
            </div>
          )}

          {!isLoading && (!documents || documents.length === 0) && (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <DocumentIcon />
              <p className="mt-2 text-sm text-brand-gray">
                No documents uploaded yet. Upload a pre-op checklist, HACCP plan, or scope of works
                to get started.
              </p>
            </div>
          )}

          {documents && documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`rounded-lg border p-4 transition-all cursor-pointer ${
                    selectedDocId === doc.id
                      ? 'border-brand-green bg-brand-green-light/10 dark:border-brand-green/40 dark:bg-brand-green/5'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedDocId(doc.id === selectedDocId ? null : doc.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        <FileIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-brand-gray">
                          {docTypeLabel(doc.document_type)} &middot;{' '}
                          {new Date(doc.created_at).toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(doc.processing_status)}`}
                      >
                        {doc.processing_status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="rounded p-1 text-brand-gray hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete document"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Review section — shows when a "review" status document is selected */}
        {selectedDoc && selectedDoc.processing_status === 'review' && extracted && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
              AI Extraction Review
            </h2>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 mb-4 dark:border-amber-800/40 dark:bg-amber-900/10">
              <div className="flex items-start gap-2">
                <InfoIcon />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Review required before creating facility areas
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    Claude AI extracted {extracted.areas.length} area(s) with{' '}
                    {extracted.areas.reduce(
                      (sum, a) => sum + (a.check_items?.length ?? 0),
                      0,
                    )}{' '}
                    check item(s). Review the results below and approve to create real facility
                    areas and check items.
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted areas tree */}
            <div className="space-y-2 mb-4">
              {extracted.areas.map((area, areaIdx) => (
                <div
                  key={areaIdx}
                  className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* Area header */}
                  <button
                    onClick={() => toggleArea(areaIdx)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronIcon expanded={expandedAreas.has(areaIdx)} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {area.name}
                        </p>
                        <p className="text-xs text-brand-gray">
                          {area.check_items?.length ?? 0} check item(s)
                        </p>
                      </div>
                    </div>
                    {area.area_type && (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${areaTypeBadge(area.area_type)}`}
                      >
                        {area.area_type.replace('_', ' ')}
                      </span>
                    )}
                  </button>

                  {/* Check items */}
                  {expandedAreas.has(areaIdx) && area.check_items && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {area.check_items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="border-b border-gray-50 px-4 py-3 last:border-b-0 dark:border-gray-700/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="mt-0.5 text-xs text-brand-gray">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                              {item.scoring_type && (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  {item.scoring_type.replace('_', '/')}
                                </span>
                              )}
                              {item.frequency && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                  {item.frequency.replace('_', ' ')}
                                </span>
                              )}
                              {item.category_code && (
                                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                  {item.category_code.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          {item.suggested_clause_refs &&
                            item.suggested_clause_refs.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.suggested_clause_refs.map((ref, refIdx) => (
                                  <span
                                    key={refIdx}
                                    className="rounded bg-brand-green-light px-1.5 py-0.5 text-[10px] font-medium text-brand-green dark:bg-brand-green/10 dark:text-green-300"
                                  >
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Coverage gaps */}
            {extracted.coverage_gaps && extracted.coverage_gaps.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                  Coverage Gaps ({extracted.coverage_gaps.length})
                </h3>
                <div className="space-y-1.5">
                  {extracted.coverage_gaps.map((gap, gapIdx) => (
                    <div
                      key={gapIdx}
                      className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800/40 dark:bg-red-900/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300 uppercase">
                          {gap.framework_code}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {gap.category_code.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                        {gap.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approve error */}
            {approveDocument.error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {approveDocument.error.message}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleApprove(selectedDoc.id)}
                disabled={isApproving}
                className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproving ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Creating areas...
                  </span>
                ) : (
                  `Approve & Create ${extracted.areas.length} Area(s)`
                )}
              </button>
              <button
                onClick={() => handleReprocess(selectedDoc.id)}
                disabled={processDocument.isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Re-process
              </button>
            </div>
          </section>
        )}

        {/* Approved document info */}
        {selectedDoc && selectedDoc.processing_status === 'approved' && (
          <section>
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800/40 dark:bg-green-900/10">
              <div className="flex items-start gap-2">
                <CheckCircleIcon />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Document approved
                  </p>
                  <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
                    Facility areas and check items have been created from this document. View them
                    in{' '}
                    <Link
                      to={`/${orgSlug}/sites/${siteSlug}/settings/facilities`}
                      className="font-medium underline"
                    >
                      Facility Areas
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Processing state */}
        {selectedDoc && selectedDoc.processing_status === 'processing' && (
          <section>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
              <div className="flex items-center gap-2">
                <Spinner />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  AI is analysing this document. This may take a moment...
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Pending state */}
        {selectedDoc && selectedDoc.processing_status === 'pending' && (
          <section>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-brand-gray">
                This document has not been processed yet. Paste the document content and click
                process to extract facility areas with AI.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg
      className="mx-auto h-10 w-10 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="h-5 w-5 text-brand-gray"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-brand-gray transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
