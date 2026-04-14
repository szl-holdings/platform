import { randomUUID } from "crypto";
import type { AnyDecisionObject } from "./decision-objects.js";
import type { EvidenceIndexEntry } from "./evidence-pipeline.js";

export interface CaseMemoryEntry {
  caseId: string;
  incidentId: string | null;
  decisions: Array<{
    objectId: string;
    decisionType: string;
    summary: string;
    confidence: number;
    confidenceLabel: string;
    impactLevel: string;
    urgency: string;
    recommendedAction: string;
    approvalRequired: boolean;
    humanReviewRequired: boolean;
    gapsAndUnknowns: string[];
    createdAt: string;
  }>;
  evidenceSnapshots: Array<{
    snapshotId: string;
    decisionObjectId: string;
    evidenceCount: number;
    evidenceQuality: string;
    dominantSourceTypes: string[];
    capturedAt: string;
  }>;
  analystNotes: Array<{
    noteId: string;
    content: string;
    author: string;
    noteType: "observation" | "hypothesis" | "assumption" | "gap" | "dissent" | "general";
    createdAt: string;
  }>;
  changeLog: Array<{
    changeId: string;
    fieldChanged: string;
    previousValue: string | null;
    newValue: string;
    changedBy: string;
    changedAt: string;
    decisionObjectId: string | null;
  }>;
  lifecycle: {
    phase: "detection" | "triage" | "investigation" | "containment" | "eradication" | "recovery" | "closed";
    openedAt: string;
    lastUpdatedAt: string;
    closedAt: string | null;
    phaseHistory: Array<{ phase: string; enteredAt: string; exitedAt: string | null }>;
  };
  summary: {
    totalDecisions: number;
    lastDecisionAt: string | null;
    currentRiskLevel: string | null;
    pendingApprovals: number;
    humanReviewRequired: boolean;
  };
}

export interface DecisionDiff {
  previousDecisionId: string | null;
  currentDecisionId: string;
  changes: Array<{
    field: string;
    previous: unknown;
    current: unknown;
    significance: "critical" | "notable" | "minor";
  }>;
  confidenceDelta: number;
  impactChanged: boolean;
  urgencyChanged: boolean;
  newGaps: string[];
  resolvedGaps: string[];
  newAlternatives: number;
  summary: string;
}

async function persistCaseToDb(entry: CaseMemoryEntry): Promise<void> {
  try {
    const { db, alloyCaseMemory } = await import("@szl-holdings/db");
    await db.insert(alloyCaseMemory).values({
      caseId: entry.caseId,
      snapshot: entry as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: alloyCaseMemory.caseId,
      set: {
        snapshot: entry as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
  } catch {
  }
}

async function loadCasesFromDb(): Promise<CaseMemoryEntry[]> {
  try {
    const { db, alloyCaseMemory } = await import("@szl-holdings/db");
    const rows = await db.select().from(alloyCaseMemory);
    return rows.map(r => r.snapshot as unknown as CaseMemoryEntry);
  } catch {
    return [];
  }
}

export class CaseMemoryStore {
  private store = new Map<string, CaseMemoryEntry>();
  private _hydrated = false;

  async hydrateFromDb(): Promise<void> {
    if (this._hydrated) return;
    this._hydrated = true;
    try {
      const entries = await loadCasesFromDb();
      for (const entry of entries) {
        this.store.set(entry.caseId, entry);
      }
      if (entries.length > 0) {
        console.log(`[case-memory] Hydrated ${entries.length} cases from DB`);
      }
    } catch (err) {
      console.warn("[case-memory] Hydration failed:", err);
    }
  }

  getOrCreate(caseId: string, incidentId: string | null = null): CaseMemoryEntry {
    if (!this.store.has(caseId)) {
      const now = new Date().toISOString();
      const entry: CaseMemoryEntry = {
        caseId,
        incidentId,
        decisions: [],
        evidenceSnapshots: [],
        analystNotes: [],
        changeLog: [],
        lifecycle: {
          phase: "detection",
          openedAt: now,
          lastUpdatedAt: now,
          closedAt: null,
          phaseHistory: [{ phase: "detection", enteredAt: now, exitedAt: null }],
        },
        summary: {
          totalDecisions: 0,
          lastDecisionAt: null,
          currentRiskLevel: null,
          pendingApprovals: 0,
          humanReviewRequired: false,
        },
      };
      this.store.set(caseId, entry);
    }
    return this.store.get(caseId)!;
  }

  recordDecision(caseId: string, decision: AnyDecisionObject, evidenceEntries: EvidenceIndexEntry[]): void {
    const memory = this.getOrCreate(caseId);
    const now = new Date().toISOString();

    memory.decisions.push({
      objectId: decision.objectId,
      decisionType: decision.decisionType,
      summary: decision.summary,
      confidence: decision.confidence,
      confidenceLabel: decision.confidenceLabel,
      impactLevel: decision.impactLevel,
      urgency: decision.urgency,
      recommendedAction: decision.recommendedAction,
      approvalRequired: decision.approvalRequired,
      humanReviewRequired: decision.humanReviewRequired,
      gapsAndUnknowns: decision.gapsAndUnknowns,
      createdAt: decision.createdAt,
    });

    const sourceTypeCounts: Record<string, number> = {};
    for (const e of evidenceEntries) {
      sourceTypeCounts[e.sourceType] = (sourceTypeCounts[e.sourceType] || 0) + 1;
    }
    const dominant = Object.entries(sourceTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    memory.evidenceSnapshots.push({
      snapshotId: `snap_${decision.objectId}`,
      decisionObjectId: decision.objectId,
      evidenceCount: evidenceEntries.length,
      evidenceQuality: decision.evidenceQuality,
      dominantSourceTypes: dominant,
      capturedAt: now,
    });

    memory.summary.totalDecisions++;
    memory.summary.lastDecisionAt = now;
    memory.summary.currentRiskLevel = decision.impactLevel;
    memory.summary.pendingApprovals = memory.decisions.filter(d => d.approvalRequired).length;
    memory.summary.humanReviewRequired = memory.decisions.some(d => d.humanReviewRequired);
    memory.lifecycle.lastUpdatedAt = now;

    void persistCaseToDb(memory);

    void this.runPatternDetectionAfterDecision();
  }

  private async runPatternDetectionAfterDecision(): Promise<void> {
    try {
      const { runPatternDetectionAndStore } = await import("../learning/pattern-detector.js");
      await runPatternDetectionAndStore(this.getAll());
    } catch {
    }
  }

  recordNote(
    caseId: string,
    content: string,
    author: string,
    noteType: CaseMemoryEntry["analystNotes"][0]["noteType"] = "general"
  ): void {
    const memory = this.getOrCreate(caseId);
    memory.analystNotes.push({
      noteId: `note_${randomUUID()}`,
      content,
      author,
      noteType,
      createdAt: new Date().toISOString(),
    });
    memory.lifecycle.lastUpdatedAt = new Date().toISOString();
    void persistCaseToDb(memory);
  }

  transitionPhase(caseId: string, newPhase: CaseMemoryEntry["lifecycle"]["phase"], changedBy: string): void {
    const memory = this.getOrCreate(caseId);
    const now = new Date().toISOString();
    const currentPhase = memory.lifecycle.phaseHistory.at(-1);
    if (currentPhase && !currentPhase.exitedAt) {
      currentPhase.exitedAt = now;
    }
    memory.lifecycle.phase = newPhase;
    memory.lifecycle.phaseHistory.push({ phase: newPhase, enteredAt: now, exitedAt: null });
    memory.lifecycle.lastUpdatedAt = now;
    if (newPhase === "closed") memory.lifecycle.closedAt = now;
    memory.changeLog.push({
      changeId: `change_${Date.now()}`,
      fieldChanged: "lifecycle.phase",
      previousValue: currentPhase?.phase || null,
      newValue: newPhase,
      changedBy,
      changedAt: now,
      decisionObjectId: null,
    });
    void persistCaseToDb(memory);
  }

  computeDecisionDiff(caseId: string, currentDecision: AnyDecisionObject): DecisionDiff {
    const memory = this.getOrCreate(caseId);
    const decisions = memory.decisions;
    const prevEntry = decisions.length >= 2 ? decisions.at(-2) : null;

    const changes: DecisionDiff["changes"] = [];

    if (prevEntry) {
      if (prevEntry.confidence !== currentDecision.confidence) {
        changes.push({
          field: "confidence",
          previous: prevEntry.confidence,
          current: currentDecision.confidence,
          significance: Math.abs(prevEntry.confidence - currentDecision.confidence) > 0.2 ? "critical" : "notable",
        });
      }
      if (prevEntry.impactLevel !== currentDecision.impactLevel) {
        changes.push({ field: "impactLevel", previous: prevEntry.impactLevel, current: currentDecision.impactLevel, significance: "critical" });
      }
      if (prevEntry.urgency !== currentDecision.urgency) {
        changes.push({ field: "urgency", previous: prevEntry.urgency, current: currentDecision.urgency, significance: "notable" });
      }
      if (prevEntry.approvalRequired !== currentDecision.approvalRequired) {
        changes.push({ field: "approvalRequired", previous: prevEntry.approvalRequired, current: currentDecision.approvalRequired, significance: "critical" });
      }
      if (prevEntry.humanReviewRequired !== currentDecision.humanReviewRequired) {
        changes.push({ field: "humanReviewRequired", previous: prevEntry.humanReviewRequired, current: currentDecision.humanReviewRequired, significance: "critical" });
      }
      if (prevEntry.recommendedAction !== currentDecision.recommendedAction) {
        changes.push({ field: "recommendedAction", previous: prevEntry.recommendedAction, current: currentDecision.recommendedAction, significance: "notable" });
      }
    }

    const prevGaps = new Set<string>(prevEntry?.gapsAndUnknowns ?? []);
    const currentGaps = new Set(currentDecision.gapsAndUnknowns);
    const newGaps = [...currentGaps].filter(g => !prevGaps.has(g));
    const resolvedGaps = [...prevGaps].filter(g => !currentGaps.has(g));

    if (newGaps.length > 0) {
      changes.push({ field: "newGaps", previous: null, current: newGaps.join("; "), significance: "notable" });
    }
    if (resolvedGaps.length > 0) {
      changes.push({ field: "resolvedGaps", previous: resolvedGaps.join("; "), current: null, significance: "minor" });
    }

    return {
      previousDecisionId: prevEntry ? prevEntry.objectId : null,
      currentDecisionId: currentDecision.objectId,
      changes,
      confidenceDelta: prevEntry ? currentDecision.confidence - prevEntry.confidence : 0,
      impactChanged: changes.some(c => c.field === "impactLevel"),
      urgencyChanged: changes.some(c => c.field === "urgency"),
      newGaps,
      resolvedGaps,
      newAlternatives: currentDecision.alternatives.length,
      summary: changes.length === 0
        ? "No significant changes from previous decision"
        : `${changes.length} change(s) detected: ${changes.map(c => c.field).join(", ")}`,
    };
  }

  get(caseId: string): CaseMemoryEntry | null {
    return this.store.get(caseId) || null;
  }

  getAll(): CaseMemoryEntry[] {
    return [...this.store.values()];
  }

  getRelatedCases(incidentId: string): CaseMemoryEntry[] {
    return [...this.store.values()].filter(m => m.incidentId === incidentId);
  }
}

export const caseMemory = new CaseMemoryStore();
