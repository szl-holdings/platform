import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID, createHash, createSign, createHmac } from "crypto";
import { logger } from "../../lib/logger";

interface AuthUser { id: number; role: string; email?: string; displayName?: string }
type ExtendedRequest = Request & { user?: AuthUser }
import { db, documentsTable, documentVersionsTable, documentCommentsTable, documentTemplatesTable, contentLibraryBlocksTable, signaturesTable, pdfJobsTable, pdfBatchesTable } from "@szl-holdings/db";
import { eq, desc, sql, and, or, ne } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { renderEntityDataToPdfBuffer, renderDocumentToPdfBuffer } from "../../lib/pdf-renderer";
import type { BlockNode } from "../../lib/pdf-renderer-types";
import { ObjectStorageService, ObjectNotFoundError } from "../../lib/objectStorage";
import { setObjectAclPolicy } from "../../lib/objectAcl";

const objectStorageService = new ObjectStorageService();

// ─── Access control helpers ───────────────────────────────────────────────────

export function getRequestUserId(req: Request): number | null {
  return (req as ExtendedRequest).user?.id ?? null;
}

export function getUserRole(req: Request): string {
  return (req as ExtendedRequest).user?.role ?? "viewer";
}

export function getRequestUserEmail(req: Request): string | null {
  return (req as ExtendedRequest).user?.email ?? null;
}

/**
 * Check if the authenticated user can access a document.
 * Admins and editors can access any document.
 * Other users can only access their own documents or demo documents.
 */
export function canAccessDocument(userId: number | null, role: string, doc: typeof documentsTable.$inferSelect): boolean {
  if (role === "admin" || role === "editor") return true;
  if (doc.isDemo) return true;
  if (userId !== null && doc.ownerId === userId) return true;
  return false;
}

/**
 * Check if the authenticated user can mutate (write/delete) a document.
 * Admins can mutate any. Editors can mutate any non-demo. Others can only mutate their own.
 */
export function canMutateDocument(userId: number | null, role: string, doc: typeof documentsTable.$inferSelect): boolean {
  if (role === "admin") return true;
  if (doc.isDemo) return false;
  if (role === "editor") return true;
  if (userId !== null && doc.ownerId === userId) return true;
  return false;
}

