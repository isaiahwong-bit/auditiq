import { Router } from 'express';
import { z } from 'zod';
import * as documentService from '../services/document.service';

export const documentRoutes = Router();

// GET / — list documents for the site
documentRoutes.get('/', async (req, res, next) => {
  try {
    const documents = await documentService.listDocuments(req.site!.id);
    res.json({ data: documents });
  } catch (err) {
    next(err);
  }
});

// GET /:documentId — get single document with extracted data
documentRoutes.get('/:documentId', async (req, res, next) => {
  try {
    const document = await documentService.getDocument(req.params.documentId);
    res.json({ data: document });
  } catch (err) {
    next(err);
  }
});

// POST / — create document record
const createDocumentSchema = z.object({
  file_url: z.string().min(1),
  file_name: z.string().min(1),
  document_type: z
    .enum(['pre_op_checklist', 'scope_of_works', 'haccp_plan', 'other'])
    .nullable()
    .optional(),
  content: z.string().optional(),
});

documentRoutes.post('/', async (req, res, next) => {
  try {
    const body = createDocumentSchema.parse(req.body);
    const document = await documentService.createDocument({
      siteId: req.site!.id,
      organisationId: req.org!.id,
      fileUrl: body.file_url,
      fileName: body.file_name,
      documentType: body.document_type ?? null,
      uploadedBy: req.user!.id,
    });
    res.status(201).json({ data: document });
  } catch (err) {
    next(err);
  }
});

// POST /:documentId/process — trigger AI extraction
const processDocumentSchema = z.object({
  content: z.string().min(1, 'Document content is required for extraction'),
});

documentRoutes.post('/:documentId/process', async (req, res, next) => {
  try {
    const body = processDocumentSchema.parse(req.body);
    const result = await documentService.processDocument(
      req.params.documentId,
      body.content,
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /:documentId/approve — approve and create facility areas + check items
documentRoutes.post('/:documentId/approve', async (req, res, next) => {
  try {
    const result = await documentService.approveDocument(
      req.params.documentId,
      req.site!.id,
      req.org!.id,
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /:documentId — delete document
documentRoutes.delete('/:documentId', async (req, res, next) => {
  try {
    const document = await documentService.deleteDocument(
      req.params.documentId,
      req.site!.id,
    );
    res.json({ data: document });
  } catch (err) {
    next(err);
  }
});
