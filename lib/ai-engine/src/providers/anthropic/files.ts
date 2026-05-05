/**
 * Anthropic Files API
 *
 * Wrapper for the Anthropic Files API (/v1/files).
 * Allows uploading large documents (PDFs, text, etc.) once and referencing
 * them in multiple Messages API calls via file_id, avoiding repeated uploads
 * for long-context scenarios.
 *
 * Cost: Files are stored per-API-key. No extra charge for storage (as of May 2026).
 * Max file size: 32 MB. Supported: PDF, TXT, MD, CSV, HTML, images.
 *
 * Usage:
 *   const file = await uploadFile({ content: pdfBuffer, filename: 'contract.pdf', mimeType: 'application/pdf' });
 *   // Use file.id in a message: { type: "document", source: { type: "file", file_id: file.id } }
 */

import { anthropic } from './client.js';

export type FileMimeType =
  | 'application/pdf'
  | 'text/plain'
  | 'text/markdown'
  | 'text/csv'
  | 'text/html'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export interface FileObject {
  id: string;
  object: 'file';
  filename: string;
  size: number;
  created_at: number;
  purpose: string;
}

export interface UploadFileOptions {
  content: Buffer | string;
  filename: string;
  mimeType: FileMimeType;
  purpose?: string;
}

export interface FileDocumentBlock {
  type: 'document';
  source: {
    type: 'file';
    file_id: string;
  };
  title?: string;
  context?: string;
  citations?: { enabled: boolean };
}

const MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024;

export function buildFileDocumentBlock(
  fileId: string,
  options?: { title?: string; context?: string; enableCitations?: boolean },
): FileDocumentBlock {
  return {
    type: 'document',
    source: { type: 'file', file_id: fileId },
    ...(options?.title ? { title: options.title } : {}),
    ...(options?.context ? { context: options.context } : {}),
    ...(options?.enableCitations ? { citations: { enabled: true } } : {}),
  };
}

export async function uploadFile(options: UploadFileOptions): Promise<FileObject> {
  const content = typeof options.content === 'string'
    ? Buffer.from(options.content, 'utf-8')
    : options.content;

  if (content.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File too large: ${(content.byteLength / 1024 / 1024).toFixed(1)}MB. Maximum is 32MB.`,
    );
  }

  const blob = new Blob([content], { type: options.mimeType });
  const file = new File([blob], options.filename, { type: options.mimeType });

  const result = await anthropic.beta.files.upload({ file }) as FileObject;
  return result;
}

export async function getFile(fileId: string): Promise<FileObject> {
  const result = await anthropic.beta.files.retrieveMetadata(fileId) as FileObject;
  return result;
}

export async function deleteFile(fileId: string): Promise<{ id: string; deleted: boolean }> {
  const result = await anthropic.beta.files.delete(fileId);
  return { id: result.id, deleted: result.deleted };
}

export async function listFiles(): Promise<FileObject[]> {
  const result = await anthropic.beta.files.list();
  return result.data as FileObject[];
}

export function estimateFileTokens(fileSizeBytes: number, mimeType: FileMimeType): number {
  if (mimeType === 'application/pdf') {
    return Math.ceil(fileSizeBytes / 6);
  }
  if (mimeType.startsWith('image/')) {
    return Math.min(Math.ceil(fileSizeBytes / 100), 1500);
  }
  return Math.ceil(fileSizeBytes / 4);
}
