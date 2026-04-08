import {
  db,
  atlasArtifactsTable,
  atlasExportJobsTable,
  type InsertAtlasArtifact,
  type AtlasArtifact,
  type AtlasExportJob,
  type AtlasTemplateType,
  type AtlasExportFormat,
  type AtlasArtifactDomain,
  ATLAS_TEMPLATE_TYPES,
  ATLAS_EXPORT_FORMATS,
} from "@szl-holdings/db";
import { tagAIContent } from "@szl-holdings/proof-chain";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export type {
  AtlasArtifact,
  AtlasExportJob,
  AtlasTemplateType,
  AtlasExportFormat,
  AtlasArtifactDomain,
};
export { ATLAS_TEMPLATE_TYPES, ATLAS_EXPORT_FORMATS };

export interface ArtifactSection {
  id: string;
  title: string;
  content: string;
  type: "text" | "table" | "chart" | "image" | "list" | "kpi_grid";
  data?: Record<string, unknown>;
  order: number;
}

export interface GenerateArtifactParams {
  orgId?: number | null;
  title: string;
  templateType: AtlasTemplateType;
  domain: AtlasArtifactDomain;
  entityType?: string;
  entityId?: string;
  sections: ArtifactSection[];
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  generatedBy?: string;
  generatedByUserId?: number | null;
  correlationId?: string;
  outcomeGraphId?: number | null;
  attachProvenance?: boolean;
}

export interface ArtifactVersionInfo {
  id: number;
  version: number;
  title: string;
  status: string;
  isLatest: boolean;
  createdAt: Date;
}

function generateSlug(title: string, templateType: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const suffix = randomBytes(4).toString("hex");
  return `${templateType}-${base}-${suffix}`;
}

function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

const TEMPLATE_STRUCTURE: Record<AtlasTemplateType, string[]> = {
  deck: ["overview", "key_findings", "recommendations", "next_steps"],
  brief: ["executive_summary", "background", "analysis", "conclusion"],
  memo: ["to_from", "subject", "summary", "details", "action_items"],
  executive_summary: ["situation", "key_metrics", "risks", "recommendations"],
  report: ["executive_summary", "methodology", "findings", "analysis", "appendix"],
  approval_packet: ["request_overview", "justification", "risk_assessment", "approval_chain"],
  incident_packet: ["incident_summary", "timeline", "impact_assessment", "response_actions", "lessons_learned"],
  readiness_report: ["readiness_score", "capability_gaps", "maturity_matrix", "roadmap"],
  proposal: ["executive_summary", "problem_statement", "proposed_solution", "timeline", "investment"],
  voyage_report: ["voyage_summary", "route_data", "incidents", "fuel_consumption", "recommendations"],
  property_brief: ["property_overview", "market_analysis", "valuation", "opportunity_score", "due_diligence"],
  threat_assessment: ["threat_landscape", "attack_vectors", "risk_matrix", "mitigations", "response_plan"],
};

export async function generateArtifact(params: GenerateArtifactParams): Promise<AtlasArtifact> {
  const slug = generateSlug(params.title, params.templateType);

  const [artifact] = await db.insert(atlasArtifactsTable).values({
    orgId: params.orgId ?? null,
    slug,
    title: params.title,
    templateType: params.templateType,
    domain: params.domain,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    version: 1,
    status: "generating",
    content: params.content ?? {},
    sections: params.sections,
    metadata: params.metadata ?? {},
    generatedBy: params.generatedBy ?? "atlas",
    generatedByUserId: params.generatedByUserId ?? null,
    correlationId: params.correlationId ?? null,
    outcomeGraphId: params.outcomeGraphId ?? null,
    isLatest: true,
  }).returning();

  if (params.attachProvenance) {
    try {
      const proof = await tagAIContent({
        orgId: params.orgId,
        contentId: String(artifact.id),
        contentType: "atlas_artifact",
        sourceClass: "llm_generated",
        confidenceScore: 0.85,
        serviceAttribution: params.generatedBy ?? "atlas",
        correlationId: params.correlationId,
        metadata: { templateType: params.templateType, domain: params.domain },
      });

      await db.update(atlasArtifactsTable)
        .set({ proofChainId: proof.id, status: "ready", updatedAt: new Date() })
        .where(eq(atlasArtifactsTable.id, artifact.id));

      return { ...artifact, proofChainId: proof.id, status: "ready" };
    } catch {
      await db.update(atlasArtifactsTable)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(atlasArtifactsTable.id, artifact.id));
    }
  } else {
    await db.update(atlasArtifactsTable)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(atlasArtifactsTable.id, artifact.id));
  }

  const [ready] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, artifact.id));
  return ready;
}

export async function regenerateArtifact(
  artifactId: number,
  updates: Partial<Pick<GenerateArtifactParams, "title" | "sections" | "content" | "metadata">>,
): Promise<AtlasArtifact> {
  const [existing] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, artifactId));
  if (!existing) {
    throw Object.assign(new Error(`Atlas artifact ${artifactId} not found`), { code: "NOT_FOUND" });
  }

  await db.update(atlasArtifactsTable)
    .set({ isLatest: false })
    .where(eq(atlasArtifactsTable.id, artifactId));

  const [newVersion] = await db.insert(atlasArtifactsTable).values({
    orgId: existing.orgId,
    slug: existing.slug,
    title: updates.title ?? existing.title,
    templateType: existing.templateType as AtlasTemplateType,
    domain: existing.domain as AtlasArtifactDomain,
    entityType: existing.entityType,
    entityId: existing.entityId,
    version: existing.version + 1,
    parentArtifactId: artifactId,
    status: "ready",
    content: updates.content ?? existing.content ?? {},
    sections: updates.sections ?? existing.sections ?? [],
    metadata: updates.metadata ?? existing.metadata ?? {},
    generatedBy: existing.generatedBy,
    generatedByUserId: existing.generatedByUserId,
    correlationId: existing.correlationId,
    outcomeGraphId: existing.outcomeGraphId,
    isLatest: true,
  }).returning();

  return newVersion;
}

export async function getArtifactVersionHistory(slug: string): Promise<ArtifactVersionInfo[]> {
  const rows = await db
    .select({
      id: atlasArtifactsTable.id,
      version: atlasArtifactsTable.version,
      title: atlasArtifactsTable.title,
      status: atlasArtifactsTable.status,
      isLatest: atlasArtifactsTable.isLatest,
      createdAt: atlasArtifactsTable.createdAt,
    })
    .from(atlasArtifactsTable)
    .where(eq(atlasArtifactsTable.slug, slug))
    .orderBy(desc(atlasArtifactsTable.version));

  return rows;
}

export async function compareArtifactVersions(
  idA: number,
  idB: number,
): Promise<{ added: string[]; removed: string[]; changed: string[] }> {
  const [a, b] = await Promise.all([
    db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, idA)).then(r => r[0]),
    db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, idB)).then(r => r[0]),
  ]);

  if (!a || !b) throw Object.assign(new Error("One or both artifacts not found"), { code: "NOT_FOUND" });

  const sectionsA = (Array.isArray(a.sections) ? a.sections : []) as ArtifactSection[];
  const sectionsB = (Array.isArray(b.sections) ? b.sections : []) as ArtifactSection[];

  const idsA = new Set(sectionsA.map(s => s.id));
  const idsB = new Set(sectionsB.map(s => s.id));

  const added = sectionsB.filter(s => !idsA.has(s.id)).map(s => s.title);
  const removed = sectionsA.filter(s => !idsB.has(s.id)).map(s => s.title);
  const changed = sectionsA
    .filter(s => idsB.has(s.id))
    .filter(s => {
      const match = sectionsB.find(b => b.id === s.id);
      return match && match.content !== s.content;
    })
    .map(s => s.title);

  return { added, removed, changed };
}

export async function createExportJob(params: {
  orgId?: number | null;
  artifactId: number;
  format: AtlasExportFormat;
  requestedByUserId?: number | null;
}): Promise<AtlasExportJob> {
  const [artifact] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, params.artifactId));
  if (!artifact) {
    throw Object.assign(new Error(`Atlas artifact ${params.artifactId} not found`), { code: "NOT_FOUND" });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [job] = await db.insert(atlasExportJobsTable).values({
    orgId: params.orgId ?? null,
    artifactId: params.artifactId,
    format: params.format,
    status: "pending",
    requestedByUserId: params.requestedByUserId ?? null,
    expiresAt,
    metadata: { templateType: artifact.templateType, title: artifact.title },
  }).returning();

  return job;
}

export async function createShareLink(artifactId: number, expiresInHours = 72): Promise<string> {
  const token = generateShareToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await db.update(atlasArtifactsTable)
    .set({ shareToken: token, shareExpiresAt: expiresAt, updatedAt: new Date() })
    .where(eq(atlasArtifactsTable.id, artifactId));

  return token;
}

export async function getArtifactByShareToken(token: string): Promise<AtlasArtifact | undefined> {
  const [row] = await db
    .select()
    .from(atlasArtifactsTable)
    .where(eq(atlasArtifactsTable.shareToken, token));

  if (!row) return undefined;
  if (row.shareExpiresAt && row.shareExpiresAt < new Date()) return undefined;

  return row;
}

export async function getArtifactById(id: number): Promise<AtlasArtifact | undefined> {
  const [row] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, id));
  return row;
}

export async function listArtifacts(options: {
  orgId?: number;
  domain?: AtlasArtifactDomain;
  templateType?: AtlasTemplateType;
  entityType?: string;
  entityId?: string;
  status?: string;
  latestOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AtlasArtifact[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(atlasArtifactsTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(atlasArtifactsTable.domain, options.domain));
  if (options.templateType) conditions.push(eq(atlasArtifactsTable.templateType, options.templateType));
  if (options.entityType) conditions.push(eq(atlasArtifactsTable.entityType, options.entityType));
  if (options.entityId) conditions.push(eq(atlasArtifactsTable.entityId, options.entityId));
  if (options.status) conditions.push(eq(atlasArtifactsTable.status, options.status));
  if (options.latestOnly) conditions.push(eq(atlasArtifactsTable.isLatest, true));

  const q = db
    .select()
    .from(atlasArtifactsTable)
    .orderBy(desc(atlasArtifactsTable.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}

export function getTemplateStructure(templateType: AtlasTemplateType): string[] {
  return TEMPLATE_STRUCTURE[templateType] ?? ["content"];
}

export function buildSectionFromTemplate(
  templateType: AtlasTemplateType,
  data: Record<string, string>,
): ArtifactSection[] {
  const sections = getTemplateStructure(templateType);
  return sections.map((sectionId, index) => ({
    id: sectionId,
    title: sectionId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    content: data[sectionId] ?? "",
    type: "text" as const,
    order: index,
  }));
}
