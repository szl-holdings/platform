import { EvidencePipeline } from "@szl-holdings/ai-engine";
import type { EvidenceQueryResult } from "@szl-holdings/ai-engine";
import {
  db,
  firestormAlertsTable,
  firestormIncidentsTable,
  firestormCasesTable,
  firestormTradecraftDecisionsTable,
  firestormAssetsTable,
  firestormHardeningControlsTable,
  firestormComplianceControlsTable,
  firestormAnalystNotebookTable,
  workflowsTable,
} from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger";

const pipeline = new EvidencePipeline();
let lastRefreshAt: Date | null = null;
const REFRESH_TTL_MS = 5 * 60 * 1000;

async function refreshFromDb(): Promise<void> {
  const now = new Date();
  if (lastRefreshAt && now.getTime() - lastRefreshAt.getTime() < REFRESH_TTL_MS) return;
  try {
    pipeline.clear();

    const [
      alerts, incidents, cases, decisions,
      assets, hardeningControls, complianceControls,
      notebookEntries, playbooks,
    ] = await Promise.all([
      db.select({
        id: firestormAlertsTable.id,
        title: firestormAlertsTable.title,
        description: firestormAlertsTable.description,
        severity: firestormAlertsTable.severity,
        source: firestormAlertsTable.source,
        status: firestormAlertsTable.status,
        createdAt: firestormAlertsTable.createdAt,
        metadata: firestormAlertsTable.metadata,
      }).from(firestormAlertsTable).orderBy(desc(firestormAlertsTable.createdAt)).limit(500),

      db.select({
        id: firestormIncidentsTable.id,
        title: firestormIncidentsTable.title,
        description: firestormIncidentsTable.description,
        severity: firestormIncidentsTable.severity,
        status: firestormIncidentsTable.status,
        attackTechnique: firestormIncidentsTable.attackTechnique,
        timeline: firestormIncidentsTable.timeline,
        notes: firestormIncidentsTable.notes,
        assignedAnalyst: firestormIncidentsTable.assignedAnalyst,
        detectedAt: firestormIncidentsTable.detectedAt,
      }).from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.detectedAt)).limit(200),

      db.select({
        id: firestormCasesTable.id,
        title: firestormCasesTable.title,
        description: firestormCasesTable.description,
        status: firestormCasesTable.status,
        priority: firestormCasesTable.priority,
        assignedAnalyst: firestormCasesTable.assignedAnalyst,
        notes: firestormCasesTable.notes,
        evidence: firestormCasesTable.evidence,
        createdAt: firestormCasesTable.createdAt,
      }).from(firestormCasesTable).orderBy(desc(firestormCasesTable.createdAt)).limit(200),

      db.select({
        objectId: firestormTradecraftDecisionsTable.objectId,
        decisionType: firestormTradecraftDecisionsTable.decisionType,
        summary: firestormTradecraftDecisionsTable.summary,
        caseId: firestormTradecraftDecisionsTable.caseId,
        confidence: firestormTradecraftDecisionsTable.confidence,
        recommendedAction: firestormTradecraftDecisionsTable.recommendedAction,
        status: firestormTradecraftDecisionsTable.status,
        approvalRequired: firestormTradecraftDecisionsTable.approvalRequired,
        approvedBy: firestormTradecraftDecisionsTable.approvedBy,
        approvedAt: firestormTradecraftDecisionsTable.approvedAt,
        impactLevel: firestormTradecraftDecisionsTable.impactLevel,
        createdAt: firestormTradecraftDecisionsTable.createdAt,
      }).from(firestormTradecraftDecisionsTable).orderBy(desc(firestormTradecraftDecisionsTable.createdAt)).limit(200),

      db.select({
        id: firestormAssetsTable.id,
        name: firestormAssetsTable.name,
        assetType: firestormAssetsTable.assetType,
        owner: firestormAssetsTable.owner,
        environment: firestormAssetsTable.environment,
        exposureLevel: firestormAssetsTable.exposureLevel,
        riskScore: firestormAssetsTable.riskScore,
        criticalFindings: firestormAssetsTable.criticalFindings,
        highFindings: firestormAssetsTable.highFindings,
        tags: firestormAssetsTable.tags,
      }).from(firestormAssetsTable).orderBy(desc(firestormAssetsTable.createdAt)).limit(300),

      db.select({
        id: firestormHardeningControlsTable.id,
        controlId: firestormHardeningControlsTable.controlId,
        name: firestormHardeningControlsTable.name,
        description: firestormHardeningControlsTable.description,
        category: firestormHardeningControlsTable.category,
        status: firestormHardeningControlsTable.status,
      }).from(firestormHardeningControlsTable).limit(200),

      db.select({
        id: firestormComplianceControlsTable.id,
        controlId: firestormComplianceControlsTable.controlId,
        controlName: firestormComplianceControlsTable.controlName,
        description: firestormComplianceControlsTable.description,
        framework: firestormComplianceControlsTable.framework,
        category: firestormComplianceControlsTable.category,
        status: firestormComplianceControlsTable.status,
        evidenceNotes: firestormComplianceControlsTable.evidenceNotes,
      }).from(firestormComplianceControlsTable).limit(200),

      db.select({
        noteId: firestormAnalystNotebookTable.noteId,
        caseId: firestormAnalystNotebookTable.caseId,
        incidentId: firestormAnalystNotebookTable.incidentId,
        content: firestormAnalystNotebookTable.content,
        author: firestormAnalystNotebookTable.author,
        noteType: firestormAnalystNotebookTable.noteType,
        isKey: firestormAnalystNotebookTable.isKey,
        createdAt: firestormAnalystNotebookTable.createdAt,
      }).from(firestormAnalystNotebookTable).orderBy(desc(firestormAnalystNotebookTable.createdAt)).limit(300),

      db.select({
        id: workflowsTable.id,
        name: workflowsTable.name,
        description: workflowsTable.description,
        steps: workflowsTable.steps,
        status: workflowsTable.status,
        product: workflowsTable.product,
      }).from(workflowsTable).where(eq(workflowsTable.product, "firestorm")).limit(100),
    ]);

    for (const a of alerts) {
      pipeline.ingestAlert({
        id: a.id,
        title: a.title,
        description: a.description ?? null,
        severity: a.severity,
        source: a.source,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        metadata: a.metadata as Record<string, unknown> | undefined,
      });
    }

    for (const i of incidents) {
      pipeline.ingestIncident({
        id: i.id,
        title: i.title,
        description: i.description ?? null,
        severity: i.severity,
        status: i.status,
        attackTechnique: i.attackTechnique ?? null,
        timeline: i.timeline,
        notes: i.notes ?? null,
        detectedAt: i.detectedAt.toISOString(),
        assignedAnalyst: i.assignedAnalyst ?? null,
      });
      if (i.timeline && Array.isArray(i.timeline) && i.timeline.length > 0) {
        pipeline.ingestIncidentTimeline(
          i.id,
          (i.timeline as Array<{ event: string; at: string; actor?: string; detail?: string }>),
        );
      }
    }

    for (const c of cases) {
      const notesText = Array.isArray(c.notes) ? c.notes.map((n: { content: string; author: string }) => `[${n.author}]: ${n.content}`).join("\n") : "";
      const evidenceText = Array.isArray(c.evidence) ? c.evidence.map((e: { name: string; type: string }) => `${e.type}: ${e.name}`).join(", ") : "";
      pipeline.ingestAnalystNote({
        id: `case_${c.id}`,
        caseId: String(c.id),
        incidentId: null,
        author: c.assignedAnalyst ?? "system",
        noteType: "case_summary",
        content: [
          `CASE: ${c.title}`,
          `Status: ${c.status} | Priority: ${c.priority}`,
          c.description ?? "",
          notesText ? `Notes:\n${notesText}` : "",
          evidenceText ? `Evidence: ${evidenceText}` : "",
        ].filter(Boolean).join("\n"),
        createdAt: c.createdAt.toISOString(),
      });
    }

    for (const d of decisions) {
      pipeline.ingestPriorDecision({
        objectId: d.objectId,
        decisionType: d.decisionType,
        summary: d.summary,
        caseId: d.caseId ?? null,
        confidence: parseFloat(String(d.confidence ?? "0")),
        recommendedAction: d.recommendedAction,
        createdAt: d.createdAt.toISOString(),
      });

      if (d.approvalRequired && d.approvedBy) {
        pipeline.ingestApproval({
          id: `approval_${d.objectId}`,
          decisionId: d.objectId,
          action: `Approved decision: ${d.decisionType} — ${d.recommendedAction.slice(0, 100)}`,
          status: d.status,
          approvedBy: d.approvedBy,
          approvedAt: d.approvedAt ? d.approvedAt.toISOString() : null,
          riskLevel: d.impactLevel,
          createdAt: d.createdAt.toISOString(),
        });
      }
    }

    for (const asset of assets) {
      pipeline.ingestAssetMetadata({
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType,
        owner: asset.owner,
        environment: asset.environment,
        exposureLevel: asset.exposureLevel,
        riskScore: Number(asset.riskScore ?? 0),
        criticalFindings: asset.criticalFindings,
        highFindings: asset.highFindings,
        tags: asset.tags,
      });
    }

    for (const hc of hardeningControls) {
      pipeline.ingestControlDoc({
        id: hc.id,
        controlId: hc.controlId,
        name: hc.name,
        description: hc.description ?? null,
        framework: "hardening",
        category: hc.category,
        status: hc.status,
      });
    }

    for (const cc of complianceControls) {
      pipeline.ingestControlDoc({
        id: cc.id,
        controlId: cc.controlId,
        name: cc.controlName,
        description: cc.description ?? null,
        framework: cc.framework,
        category: cc.category,
        status: cc.status,
        evidenceNotes: cc.evidenceNotes ?? null,
      });
    }

    for (const note of notebookEntries) {
      pipeline.ingestAnalystNote({
        id: note.noteId,
        caseId: note.caseId ?? null,
        incidentId: note.incidentId ?? null,
        content: note.content,
        author: note.author,
        noteType: note.noteType,
        createdAt: note.createdAt.toISOString(),
      });
    }

    for (const wf of playbooks) {
      pipeline.ingestPlaybook({
        id: wf.id,
        name: wf.name,
        description: wf.description ?? null,
        steps: wf.steps,
        category: wf.product,
      });
    }

    const distinctOwners = [...new Map(
      assets.filter(a => a.owner).map(a => [a.owner, a])
    ).values()];
    for (const ownerAsset of distinctOwners) {
      const ownedAssets = assets.filter(a => a.owner === ownerAsset.owner).map(a => a.name);
      pipeline.ingestUserMetadata({
        id: `owner_${ownerAsset.owner}`,
        name: ownerAsset.owner,
        role: ownerAsset.assetType ? `${ownerAsset.assetType} owner` : "asset owner",
        department: ownerAsset.environment ?? null,
        accessLevel: ownerAsset.exposureLevel ?? null,
        associatedAssets: ownedAssets,
        tags: ownerAsset.tags as string[] | undefined,
      });
    }

    const frameworkGroups: Record<string, typeof complianceControls> = {};
    for (const cc of complianceControls) {
      if (!frameworkGroups[cc.framework]) frameworkGroups[cc.framework] = [];
      frameworkGroups[cc.framework]!.push(cc);
    }
    for (const [framework, controls] of Object.entries(frameworkGroups)) {
      const notCompliant = controls.filter(c => c.status === "not_implemented" || c.status === "partial");
      const compliant = controls.filter(c => c.status === "implemented");
      pipeline.ingestRetentionPolicy({
        id: `framework_${framework}`,
        name: `${framework.toUpperCase()} Compliance Retention Policy`,
        policyClass: framework,
        content: [
          `Framework: ${framework}`,
          `Total Controls: ${controls.length}`,
          `Compliant: ${compliant.length} | Non-Compliant / Partial: ${notCompliant.length}`,
          notCompliant.length > 0
            ? `Non-Compliant Controls: ${notCompliant.map(c => `${c.controlId} ${c.controlName}`).slice(0, 10).join("; ")}`
            : "All controls compliant.",
          controls[0]?.category ? `Categories: ${[...new Set(controls.map(c => c.category))].join(", ")}` : "",
        ].filter(Boolean).join("\n"),
      });
    }

    lastRefreshAt = now;
    logger.info({ indexed: pipeline.totalIndexed }, "[tradecraft-evidence-store] Evidence index refreshed from DB");
  } catch (err) {
    logger.warn({ err }, "[tradecraft-evidence-store] Failed to refresh evidence index from DB — using stale index");
  }
}

export async function queryEvidenceIndex(params: {
  query: string;
  caseId?: string;
  incidentId?: string;
  sourceTypes?: string[];
  maxResults?: number;
  minRelevance?: number;
}): Promise<EvidenceQueryResult> {
  await refreshFromDb();
  return pipeline.query({
    query: params.query,
    caseId: params.caseId,
    incidentId: params.incidentId,
    sourceTypes: params.sourceTypes as Parameters<typeof pipeline.query>[0]["sourceTypes"],
    maxResults: params.maxResults ?? 15,
    minRelevance: params.minRelevance ?? 0.0,
  });
}

export async function ingestDecisionToEvidenceIndex(data: {
  objectId: string;
  decisionType: string;
  summary: string;
  caseId: string | null;
  confidence: number;
  recommendedAction: string;
  createdAt: string;
}): Promise<void> {
  pipeline.ingestPriorDecision(data);
}

export function forceRefreshEvidenceIndex(): void {
  lastRefreshAt = null;
}
