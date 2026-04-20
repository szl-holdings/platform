import { createHash, createHmac, createSign, randomUUID } from 'crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { logger } from '../../lib/logger';

interface AuthUser {
  id: number;
  role: string;
  email?: string;
  displayName?: string;
}
type ExtendedRequest = Request & { user?: AuthUser };

import {
  contentLibraryBlocksTable,
  db,
  documentCommentsTable,
  type documentsTable,
  documentTemplatesTable,
  documentVersionsTable,
  pdfBatchesTable,
  pdfJobsTable,
  signaturesTable,
} from '@szl-holdings/db';
import { and, desc, eq, ne, or, sql } from 'drizzle-orm';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { setObjectAclPolicy } from '../../lib/objectAcl';
import { ObjectNotFoundError, ObjectStorageService } from '../../lib/objectStorage';
import { renderDocumentToPdfBuffer, renderEntityDataToPdfBuffer } from '../../lib/pdf-renderer';
import type { BlockNode } from '../../lib/pdf-renderer-types';
import { authMiddleware, requireRole } from '../../middlewares/auth';

const objectStorageService = new ObjectStorageService();

// ─── Access control helpers ───────────────────────────────────────────────────

export function getRequestUserId(req: Request): number | null {
  return (req as ExtendedRequest).user?.id ?? null;
}

export function getUserRole(req: Request): string {
  return (req as ExtendedRequest).user?.role ?? 'viewer';
}

export function getRequestUserEmail(req: Request): string | null {
  return (req as ExtendedRequest).user?.email ?? null;
}

/**
 * Check if the authenticated user can access a document.
 * Admins and editors can access any document.
 * Other users can only access their own documents or demo documents.
 */
export function canAccessDocument(
  userId: number | null,
  role: string,
  doc: typeof documentsTable.$inferSelect,
): boolean {
  if (role === 'admin' || role === 'editor') return true;
  if (doc.isDemo) return true;
  if (userId !== null && doc.ownerId === userId) return true;
  return false;
}

/**
 * Check if the authenticated user can mutate (write/delete) a document.
 * Admins can mutate any. Editors can mutate any non-demo. Others can only mutate their own.
 */
export function canMutateDocument(
  userId: number | null,
  role: string,
  doc: typeof documentsTable.$inferSelect,
): boolean {
  if (role === 'admin') return true;
  if (doc.isDemo) return false;
  if (role === 'editor') return true;
  if (userId !== null && doc.ownerId === userId) return true;
  return false;
}
