export type DocumentStatus = "draft" | "review" | "approved" | "signed" | "archived";
export type SignatureStatus = "pending" | "viewed" | "signed" | "declined" | "expired";
export type PdfJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type AppSource = "terra" | "aegis" | "carlota_jo" | "vessels" | "alloy" | "szl" | "general";

export interface DocumentRecord {
  id: number;
  title: string;
  type: string;
  templateId: string | null;
  contentJson: Record<string, unknown>;
  status: DocumentStatus;
  ownerId: number | null;
  appSource: AppSource;
  entityType: string | null;
  entityId: string | null;
  mergeFieldValues: Record<string, string>;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  signatures?: SignatureRecord[];
  comments?: DocumentComment[];
  versions?: DocumentVersionMeta[];
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  version: number;
  contentJson: Record<string, unknown>;
  changeNote: string | null;
  savedById: number | null;
  createdAt: string;
}

export interface DocumentVersionMeta {
  id: number;
  version: number;
  changeNote: string | null;
  savedById: number | null;
  createdAt: string;
}

export interface DocumentComment {
  id: number;
  documentId: number;
  authorId: number | null;
  authorName: string;
  sectionRef: string | null;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export interface SignatureRecord {
  id: number;
  documentId: number;
  signerEmail: string;
  signerName: string;
  signingOrder: number;
  status: SignatureStatus;
  signatureData: string | null;
  signatureType: "typed" | "drawn" | "uploaded" | null;
  signedAt: string | null;
  viewedAt: string | null;
  expiresAt: string | null;
  auditHash: string | null;
  signingToken: string | null;
  reminderSentAt: string | null;
  createdAt: string;
}

export interface DocumentTemplate {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  appSource: AppSource;
  documentType: string;
  contentJson: Record<string, unknown>;
  mergeFields: Array<{ key: string; label: string; description?: string; required?: boolean }>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ContentLibraryBlock {
  id: number;
  title: string;
  category: string;
  appSource: string;
  contentJson: Record<string, unknown>;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PdfJob {
  id: number;
  batchId: string;
  templateId: string;
  entityType: string;
  entityId: string;
  entityData: Record<string, unknown>;
  appSource: string;
  status: PdfJobStatus;
  outputUrl: string | null;
  outputFilename: string | null;
  error: string | null;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  requestedById: number | null;
  isDemo: boolean;
  createdAt: string;
}

export interface PdfBatch {
  id: number;
  batchId: string;
  title: string;
  templateId: string;
  appSource: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  status: PdfJobStatus;
  zipUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EditorNode {
  type: string;
  children: EditorNode[] | { text: string; bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean; color?: string; fontSize?: string }[];
  align?: "left" | "center" | "right" | "justify";
  level?: number;
  mergeField?: string;
  url?: string;
}

export interface DocumentContent {
  nodes: EditorNode[];
}
