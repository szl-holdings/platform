import type { EvidenceRef } from "./decision-objects.js";

export type EvidenceSourceType =
  | "alert"
  | "incident"
  | "playbook"
  | "approval"
  | "analyst_note"
  | "asset_metadata"
  | "user_metadata"
  | "control_doc"
  | "retention_policy"
  | "incident_timeline"
  | "prior_decision"
  | "retrieval";

export interface EvidenceIndexEntry {
  id: string;
  caseId: string | null;
  incidentId: string | null;
  source: string;
  sourceType: EvidenceSourceType;
  title: string;
  content: string;
  tags: string[];
  freshness: "current" | "recent" | "stale" | "unknown";
  timestamp: string;
  objectId: string | null;
  relevanceBoost: number;
  embedding?: number[];
}

export interface EvidenceQuery {
  query: string;
  caseId?: string;
  incidentId?: string;
  sourceTypes?: EvidenceSourceType[];
  maxResults?: number;
  minRelevance?: number;
  embedding?: number[];
}

export interface EvidenceQueryResult {
  entries: Array<EvidenceIndexEntry & { score: number }>;
  totalIndexed: number;
  method: "semantic" | "keyword" | "hybrid";
  confidenceDowngraded: boolean;
  confidenceDowngradeReason: string | null;
  weakRetrievalWarning: string | null;
  latencyMs: number;
}

function scoreFreshness(timestamp: string | null): { freshness: EvidenceIndexEntry["freshness"]; boost: number } {
  if (!timestamp) return { freshness: "unknown", boost: 0.7 };
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 24) return { freshness: "current", boost: 1.0 };
  if (ageHours < 72) return { freshness: "recent", boost: 0.85 };
  if (ageHours < 720) return { freshness: "stale", boost: 0.6 };
  return { freshness: "stale", boost: 0.4 };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

const SECURITY_VOCAB = [
  "lateral","movement","exploit","malware","ransomware","phishing","exfiltration","intrusion",
  "alert","incident","critical","high","medium","low","severity","threat","attack","adversary",
  "apt","c2","beacon","credential","compromise","access","privilege","escalation","persistence",
  "discovery","collection","command","control","execution","defense","evasion","reconnaissance",
  "network","host","endpoint","server","domain","user","account","service","application",
  "firewall","detection","response","remediation","isolation","containment","recovery","patch",
  "vulnerability","cve","ioc","ttp","mitre","sigma","yara","siem","edr","xdr","soar",
  "compliance","audit","policy","control","risk","assessment","finding","gap","review",
  "analyst","investigation","case","memory","evidence","decision","recommendation","action",
  "approved","pending","rejected","active","closed","open","confirmed","monitoring",
  "asset","infrastructure","cloud","on-prem","production","staging","development","environment",
  "retention","policy","classification","restricted","confidential","sensitive","public",
  "owner","assigned","operator","manager","soc","ciso","board","executive","brief",
  "playbook","workflow","procedure","runbook","step","phase","timeline","event","log",
  "hardening","configuration","baseline","benchmark","cis","nist","iso","gdpr","hipaa","pci",
  "encryption","authentication","authorization","token","certificate","key","hash","signature",
  "anomaly","behavior","baseline","deviation","pattern","correlation","signal","noise",
];

function buildTfIdfEmbedding(text: string): number[] {
  const lower = text.toLowerCase();
  const wordCounts: Record<string, number> = {};
  const words = lower.split(/\W+/).filter(w => w.length > 2);
  for (const w of words) wordCounts[w] = (wordCounts[w] ?? 0) + 1;
  const total = words.length || 1;
  const vec = new Array<number>(SECURITY_VOCAB.length);
  for (let i = 0; i < SECURITY_VOCAB.length; i++) {
    const term = SECURITY_VOCAB[i]!;
    const tf = (wordCounts[term] ?? 0) / total;
    vec[i] = tf;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? vec.map(v => v / mag) : vec;
}

function buildQueryEmbedding(query: string): number[] {
  return buildTfIdfEmbedding(query);
}

async function generateNeuralEmbedding(text: string): Promise<number[] | null> {
  try {
    const { openai } = await import("@szl-holdings/integrations-openai-ai-server");
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    return response.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function persistEntryToDb(entry: EvidenceIndexEntry): Promise<void> {
  try {
    const { db, alloyEvidenceIndex } = await import("@szl-holdings/db");
    await db.insert(alloyEvidenceIndex).values({
      id: entry.id,
      caseId: entry.caseId,
      incidentId: entry.incidentId,
      source: entry.source,
      sourceType: entry.sourceType,
      title: entry.title,
      content: entry.content.slice(0, 4000),
      tags: entry.tags,
      freshness: entry.freshness,
      entryTimestamp: entry.timestamp,
      objectId: entry.objectId,
      relevanceBoost: entry.relevanceBoost,
      embedding: entry.embedding ? (entry.embedding as unknown as Record<string, unknown>) : null,
    }).onConflictDoUpdate({
      target: alloyEvidenceIndex.id,
      set: {
        content: entry.content.slice(0, 4000),
        freshness: entry.freshness,
        relevanceBoost: entry.relevanceBoost,
        embedding: entry.embedding ? (entry.embedding as unknown as Record<string, unknown>) : null,
      },
    });
  } catch {
  }
}

export class EvidencePipeline {
  private index: EvidenceIndexEntry[] = [];
  private static readonly MAX_ENTRIES = 50000;
  private static readonly WEAK_RETRIEVAL_THRESHOLD = 0.2;
  private static readonly MIN_RESULTS_FOR_CONFIDENCE = 3;
  private _hydrated = false;

  get totalIndexed(): number {
    return this.index.length;
  }

  async hydrateFromDb(): Promise<void> {
    if (this._hydrated) return;
    this._hydrated = true;
    try {
      const { db, alloyEvidenceIndex } = await import("@szl-holdings/db");
      if (!alloyEvidenceIndex?.entryTimestamp) {
        console.warn("[evidence-pipeline] Schema missing entryTimestamp column — skipping hydration");
        return;
      }
      const { desc, sql: rawSql } = await import("drizzle-orm");
      const tableCheck = await db.execute(rawSql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'alloy_evidence_index'
        ) AS table_exists
      `);
      const exists = (tableCheck as { rows?: { table_exists?: boolean }[] }).rows?.[0]?.table_exists ?? false;
      if (!exists) {
        console.warn("[evidence-pipeline] alloy_evidence_index table not found — skipping hydration");
        return;
      }
      const rows = await db
        .select()
        .from(alloyEvidenceIndex)
        .orderBy(desc(alloyEvidenceIndex.entryTimestamp))
        .limit(10000);

      for (const row of rows) {
        const entry: EvidenceIndexEntry = {
          id: row.id,
          caseId: row.caseId,
          incidentId: row.incidentId,
          source: row.source,
          sourceType: row.sourceType as EvidenceSourceType,
          title: row.title,
          content: row.content,
          tags: row.tags,
          freshness: row.freshness as EvidenceIndexEntry["freshness"],
          timestamp: row.entryTimestamp ?? new Date().toISOString(),
          objectId: row.objectId,
          relevanceBoost: row.relevanceBoost,
          embedding: row.embedding ? (row.embedding as number[]) : buildTfIdfEmbedding(`${row.title} ${row.content}`),
        };
        const existing = this.index.findIndex(e => e.id === entry.id);
        if (existing >= 0) {
          this.index[existing] = entry;
        } else {
          this.index.push(entry);
        }
      }
      console.log(`[evidence-pipeline] Hydrated ${rows.length} entries from DB`);
    } catch (err) {
      console.warn("[evidence-pipeline] Hydration failed:", err);
    }
  }

  ingestAlert(data: {
    id: string | number;
    title: string;
    description: string | null;
    severity: string;
    source: string;
    status: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }): EvidenceIndexEntry {
    const { freshness } = scoreFreshness(data.createdAt);
    const entry: EvidenceIndexEntry = {
      id: `alert_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `Alert: ${data.title}`,
      sourceType: "alert",
      title: data.title,
      content: [
        `ALERT: ${data.title}`,
        `Severity: ${data.severity} | Status: ${data.status} | Source: ${data.source}`,
        data.description || "",
        data.metadata ? `Metadata: ${JSON.stringify(data.metadata).slice(0, 500)}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["alert", data.severity, data.source, data.status],
      freshness,
      timestamp: data.createdAt,
      objectId: String(data.id),
      relevanceBoost: data.severity === "critical" ? 1.3 : data.severity === "high" ? 1.1 : 1.0,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestIncident(data: {
    id: string | number;
    title: string;
    description: string | null;
    severity: string;
    status: string;
    attackTechnique: string | null;
    timeline: unknown;
    notes: string | null;
    detectedAt: string;
    assignedAnalyst: string | null;
  }): EvidenceIndexEntry {
    const { freshness } = scoreFreshness(data.detectedAt);
    const timelineStr = data.timeline ? JSON.stringify(data.timeline).slice(0, 800) : "";
    const entry: EvidenceIndexEntry = {
      id: `incident_${data.id}`,
      caseId: null,
      incidentId: String(data.id),
      source: `Incident #${data.id}: ${data.title}`,
      sourceType: "incident",
      title: data.title,
      content: [
        `INCIDENT #${data.id}: ${data.title}`,
        `Severity: ${data.severity} | Status: ${data.status}`,
        `Detected: ${data.detectedAt}`,
        data.attackTechnique ? `Attack Technique: ${data.attackTechnique}` : "",
        data.description || "",
        data.notes ? `Notes: ${data.notes}` : "",
        timelineStr ? `Timeline: ${timelineStr}` : "",
        data.assignedAnalyst ? `Analyst: ${data.assignedAnalyst}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["incident", data.severity, data.status, data.attackTechnique || ""].filter(Boolean),
      freshness,
      timestamp: data.detectedAt,
      objectId: String(data.id),
      relevanceBoost: data.severity === "critical" ? 1.3 : 1.1,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestIncidentTimeline(incidentId: string | number, timeline: Array<{ event: string; at: string; actor?: string; detail?: string }>): EvidenceIndexEntry {
    const latestEvent = timeline.at(-1);
    const { freshness } = scoreFreshness(latestEvent?.at || null);
    const content = timeline.map(t => `[${t.at}] ${t.event}${t.actor ? ` (by ${t.actor})` : ""}${t.detail ? `: ${t.detail}` : ""}`).join("\n");
    const entry: EvidenceIndexEntry = {
      id: `timeline_${incidentId}`,
      caseId: null,
      incidentId: String(incidentId),
      source: `Incident Timeline #${incidentId}`,
      sourceType: "incident_timeline",
      title: `Incident #${incidentId} Timeline (${timeline.length} events)`,
      content: `INCIDENT TIMELINE #${incidentId}\n${content}`,
      tags: ["timeline", "incident"],
      freshness,
      timestamp: latestEvent?.at || new Date().toISOString(),
      objectId: String(incidentId),
      relevanceBoost: 1.2,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestPlaybook(data: {
    id: string | number;
    name: string;
    description: string | null;
    steps: unknown;
    triggerConditions?: string;
    category?: string;
  }): EvidenceIndexEntry {
    const entry: EvidenceIndexEntry = {
      id: `playbook_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `Playbook: ${data.name}`,
      sourceType: "playbook",
      title: data.name,
      content: [
        `PLAYBOOK: ${data.name}`,
        data.description || "",
        data.triggerConditions ? `Trigger Conditions: ${data.triggerConditions}` : "",
        data.category ? `Category: ${data.category}` : "",
        data.steps ? `Steps: ${JSON.stringify(data.steps).slice(0, 1000)}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["playbook", data.category || ""].filter(Boolean),
      freshness: "current",
      timestamp: new Date().toISOString(),
      objectId: String(data.id),
      relevanceBoost: 1.15,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestApproval(data: {
    id: string;
    decisionId: string;
    action: string;
    status: string;
    approvedBy: string | null;
    approvedAt: string | null;
    rationale?: string;
    riskLevel?: string;
    createdAt: string;
  }): EvidenceIndexEntry {
    const { freshness } = scoreFreshness(data.createdAt);
    const entry: EvidenceIndexEntry = {
      id: `approval_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `Approval Record: ${data.decisionId}`,
      sourceType: "approval",
      title: `Approval: ${data.action}`,
      content: [
        `APPROVAL RECORD`,
        `Action: ${data.action}`,
        `Status: ${data.status}`,
        data.riskLevel ? `Risk Level: ${data.riskLevel}` : "",
        data.approvedBy ? `Approved By: ${data.approvedBy} at ${data.approvedAt}` : "",
        data.rationale ? `Rationale: ${data.rationale}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["approval", data.status, data.riskLevel || ""].filter(Boolean),
      freshness,
      timestamp: data.createdAt,
      objectId: data.id,
      relevanceBoost: 1.0,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestAnalystNote(data: {
    id: string;
    caseId: string | null;
    incidentId: string | null;
    content: string;
    author: string;
    noteType?: string;
    createdAt: string;
  }): EvidenceIndexEntry {
    const { freshness } = scoreFreshness(data.createdAt);
    const entry: EvidenceIndexEntry = {
      id: `note_${data.id}`,
      caseId: data.caseId,
      incidentId: data.incidentId,
      source: `Analyst Note by ${data.author}`,
      sourceType: "analyst_note",
      title: `Analyst Note (${data.noteType || "general"})`,
      content: `ANALYST NOTE [${data.createdAt}] by ${data.author}\n${data.content}`,
      tags: ["analyst_note", data.noteType || "general", data.author],
      freshness,
      timestamp: data.createdAt,
      objectId: data.id,
      relevanceBoost: 1.1,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestAssetMetadata(data: {
    id: string | number;
    name: string;
    assetType: string;
    owner: string;
    environment: string;
    exposureLevel: string;
    riskScore: number | string;
    criticalFindings: number;
    highFindings: number;
    tags?: unknown;
  }): EvidenceIndexEntry {
    const entry: EvidenceIndexEntry = {
      id: `asset_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `Asset: ${data.name}`,
      sourceType: "asset_metadata",
      title: `Asset Metadata: ${data.name}`,
      content: [
        `ASSET: ${data.name}`,
        `Type: ${data.assetType} | Owner: ${data.owner}`,
        `Environment: ${data.environment} | Exposure: ${data.exposureLevel}`,
        `Risk Score: ${data.riskScore}`,
        `Critical Findings: ${data.criticalFindings} | High Findings: ${data.highFindings}`,
        data.tags ? `Tags: ${JSON.stringify(data.tags)}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["asset", data.assetType, data.environment, data.exposureLevel],
      freshness: "current",
      timestamp: new Date().toISOString(),
      objectId: String(data.id),
      relevanceBoost: Number(data.riskScore) > 7 ? 1.2 : 1.0,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestControlDoc(data: {
    id: string | number;
    controlId: string;
    name: string;
    description: string | null;
    framework: string;
    category: string;
    status: string;
    evidenceNotes?: string | null;
  }): EvidenceIndexEntry {
    const entry: EvidenceIndexEntry = {
      id: `control_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `Control: ${data.controlId}`,
      sourceType: "control_doc",
      title: `${data.framework} - ${data.controlId}: ${data.name}`,
      content: [
        `CONTROL DOCUMENT`,
        `ID: ${data.controlId} | Framework: ${data.framework}`,
        `Name: ${data.name}`,
        `Category: ${data.category} | Status: ${data.status}`,
        data.description || "",
        data.evidenceNotes ? `Evidence Notes: ${data.evidenceNotes}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["control", data.framework, data.category, data.status],
      freshness: "current",
      timestamp: new Date().toISOString(),
      objectId: String(data.id),
      relevanceBoost: data.status === "not_implemented" ? 1.2 : 1.0,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestUserMetadata(data: {
    id: string;
    name: string;
    role: string;
    department?: string | null;
    accessLevel?: string | null;
    associatedAssets?: string[];
    tags?: string[];
  }): EvidenceIndexEntry {
    const entry: EvidenceIndexEntry = {
      id: `user_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `User/Owner: ${data.name}`,
      sourceType: "user_metadata",
      title: `${data.name} — ${data.role}`,
      content: [
        `OWNER/USER: ${data.name}`,
        `Role: ${data.role}`,
        data.department ? `Department: ${data.department}` : null,
        data.accessLevel ? `Access Level: ${data.accessLevel}` : null,
        data.associatedAssets?.length ? `Associated Assets: ${data.associatedAssets.join(", ")}` : null,
      ].filter(Boolean).join("\n"),
      tags: ["owner", "user", data.role, ...(data.tags ?? [])],
      freshness: "current",
      timestamp: new Date().toISOString(),
      objectId: data.id,
      relevanceBoost: 0.8,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestRetentionPolicy(data: {
    id: string;
    name: string;
    content: string;
    policyClass: string;
    effectiveDate?: string;
  }): EvidenceIndexEntry {
    const entry: EvidenceIndexEntry = {
      id: `policy_${data.id}`,
      caseId: null,
      incidentId: null,
      source: `Retention Policy: ${data.name}`,
      sourceType: "retention_policy",
      title: data.name,
      content: `RETENTION POLICY: ${data.name}\nClass: ${data.policyClass}\n${data.content}`,
      tags: ["policy", data.policyClass],
      freshness: "current",
      timestamp: data.effectiveDate || new Date().toISOString(),
      objectId: data.id,
      relevanceBoost: 1.0,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  ingestPriorDecision(data: {
    objectId: string;
    decisionType: string;
    summary: string;
    caseId: string | null;
    confidence: number;
    recommendedAction: string;
    createdAt: string;
  }): EvidenceIndexEntry {
    const { freshness } = scoreFreshness(data.createdAt);
    const entry: EvidenceIndexEntry = {
      id: `prior_decision_${data.objectId}`,
      caseId: data.caseId,
      incidentId: null,
      source: `Prior Decision: ${data.decisionType}`,
      sourceType: "prior_decision",
      title: `Prior ${data.decisionType}: ${data.summary.slice(0, 80)}`,
      content: [
        `PRIOR DECISION [${data.createdAt}]`,
        `Type: ${data.decisionType}`,
        `Summary: ${data.summary}`,
        `Action: ${data.recommendedAction}`,
        `Confidence: ${Math.round(data.confidence * 100)}%`,
        data.caseId ? `Case: ${data.caseId}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["prior_decision", data.decisionType, data.caseId || ""].filter(Boolean),
      freshness,
      timestamp: data.createdAt,
      objectId: data.objectId,
      relevanceBoost: 1.05,
    };
    this.addOrUpdate(entry);
    return entry;
  }

  private addOrUpdate(entry: EvidenceIndexEntry): void {
    if (!entry.embedding || entry.embedding.length === 0) {
      entry.embedding = buildTfIdfEmbedding(`${entry.title} ${entry.content} ${entry.tags.join(" ")}`);
    }
    const idx = this.index.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      this.index[idx] = entry;
    } else {
      this.index.push(entry);
      if (this.index.length > EvidencePipeline.MAX_ENTRIES) {
        this.index.splice(0, this.index.length - EvidencePipeline.MAX_ENTRIES);
      }
    }
    void this.enrichWithNeuralEmbeddingAndPersist(entry);
  }

  private async enrichWithNeuralEmbeddingAndPersist(entry: EvidenceIndexEntry): Promise<void> {
    const textForEmbedding = `${entry.title} ${entry.content.slice(0, 1000)}`;
    const neural = await generateNeuralEmbedding(textForEmbedding);
    if (neural) {
      entry.embedding = neural;
      const inMemory = this.index.find(e => e.id === entry.id);
      if (inMemory) inMemory.embedding = neural;
    }
    await persistEntryToDb(entry);
  }

  setEmbedding(entryId: string, embedding: number[]): void {
    const entry = this.index.find(e => e.id === entryId);
    if (entry) entry.embedding = embedding;
  }

  /**
   * Async retrieval using neural embeddings by default.
   * Generates a neural query embedding (OpenAI text-embedding-3-small) and
   * falls back to keyword-only retrieval if the embedding call fails.
   * Callers should always prefer this over querySync() for best ranking quality.
   */
  async query(params: EvidenceQuery): Promise<EvidenceQueryResult> {
    const neuralEmbedding = params.embedding ?? (await generateNeuralEmbedding(params.query)) ?? undefined;
    return this.querySync({ ...params, embedding: neuralEmbedding });
  }

  /**
   * Synchronous retrieval. Uses TF-IDF query vector unless an explicit embedding
   * is passed. Neural-embedded index entries will not be semantically scored
   * (dimension mismatch yields 0); keyword scoring still operates.
   * Prefer query() for full semantic retrieval quality.
   */
  querySync(params: EvidenceQuery): EvidenceQueryResult {
    const start = Date.now();
    const { query, caseId, incidentId, sourceTypes, maxResults = 15, minRelevance = 0.0 } = params;
    const queryEmbedding = params.embedding ?? buildQueryEmbedding(query);

    let pool = this.index;

    if (sourceTypes && sourceTypes.length > 0) {
      pool = pool.filter(e => sourceTypes.includes(e.sourceType));
    }

    const semanticResults = this.querySemantic(pool, queryEmbedding, maxResults * 2);
    const keywordResults = this.queryKeyword(pool, query, maxResults * 2);

    const merged = new Map<string, EvidenceIndexEntry & { score: number }>();

    for (const r of semanticResults) {
      merged.set(r.id, { ...r, score: r.score * 0.65 * r.relevanceBoost });
    }

    for (const r of keywordResults) {
      const existing = merged.get(r.id);
      if (existing) {
        existing.score += r.score * 0.35 * r.relevanceBoost;
      } else {
        merged.set(r.id, { ...r, score: r.score * 0.35 * r.relevanceBoost });
      }
    }

    let results = [...merged.values()]
      .filter(r => r.score >= minRelevance)
      .sort((a, b) => {
        const caseBias = (caseId ? (b.caseId === caseId ? 0.1 : 0) - (a.caseId === caseId ? 0.1 : 0) : 0);
        const incidentBias = (incidentId ? (b.incidentId === incidentId ? 0.1 : 0) - (a.incidentId === incidentId ? 0.1 : 0) : 0);
        return (b.score + caseBias + incidentBias) - (a.score + caseBias + incidentBias);
      })
      .slice(0, maxResults);

    const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0;
    const weakRetrieval = results.length < EvidencePipeline.MIN_RESULTS_FOR_CONFIDENCE || avgScore < EvidencePipeline.WEAK_RETRIEVAL_THRESHOLD;

    let confidenceDowngraded = false;
    let confidenceDowngradeReason: string | null = null;
    let weakRetrievalWarning: string | null = null;

    if (weakRetrieval) {
      confidenceDowngraded = true;
      if (results.length < EvidencePipeline.MIN_RESULTS_FOR_CONFIDENCE) {
        confidenceDowngradeReason = `Only ${results.length} evidence entries found (minimum ${EvidencePipeline.MIN_RESULTS_FOR_CONFIDENCE} for full confidence)`;
        weakRetrievalWarning = `Confidence automatically downgraded: insufficient evidence retrieved (${results.length} entries). Analytic conclusion should be treated as low-confidence.`;
      } else {
        confidenceDowngradeReason = `Average relevance score ${avgScore.toFixed(2)} below threshold ${EvidencePipeline.WEAK_RETRIEVAL_THRESHOLD}`;
        weakRetrievalWarning = `Confidence automatically downgraded: low relevance evidence (avg score ${avgScore.toFixed(2)}). Treat conclusions with caution.`;
      }
    }

    return {
      entries: results,
      totalIndexed: this.index.length,
      method: params.embedding ? "hybrid" : (this.index.some(e => e.embedding && e.embedding.length > 200) ? "hybrid" : "keyword"),
      confidenceDowngraded,
      confidenceDowngradeReason,
      weakRetrievalWarning,
      latencyMs: Date.now() - start,
    };
  }

  /**
   * @deprecated Use query() directly — it now generates neural embeddings by default.
   */
  async queryWithNeuralEmbedding(params: EvidenceQuery): Promise<EvidenceQueryResult> {
    return this.query(params);
  }

  private querySemantic(pool: EvidenceIndexEntry[], embedding: number[], topK: number): Array<EvidenceIndexEntry & { score: number }> {
    return pool
      .filter(e => e.embedding)
      .map(e => ({ ...e, score: cosineSimilarity(embedding, e.embedding!) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private queryKeyword(pool: EvidenceIndexEntry[], query: string, topK: number): Array<EvidenceIndexEntry & { score: number }> {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return [];
    return pool
      .map(e => {
        const haystack = `${e.title} ${e.content} ${e.tags.join(" ")}`.toLowerCase();
        const matched = terms.filter(t => haystack.includes(t)).length;
        return { ...e, score: terms.length > 0 ? matched / terms.length : 0 };
      })
      .filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  toEvidenceRefs(results: Array<EvidenceIndexEntry & { score: number }>): EvidenceRef[] {
    return results.map(r => ({
      refId: r.id,
      source: r.source,
      sourceType: r.sourceType as EvidenceRef["sourceType"],
      content: r.content.slice(0, 600),
      relevanceScore: Math.min(r.score, 1),
      freshness: r.freshness,
      timestamp: r.timestamp,
      objectId: r.objectId,
    }));
  }

  getByCase(caseId: string): EvidenceIndexEntry[] {
    return this.index.filter(e => e.caseId === caseId);
  }

  getByIncident(incidentId: string): EvidenceIndexEntry[] {
    return this.index.filter(e => e.incidentId === incidentId);
  }

  getStats() {
    const byType: Record<string, number> = {};
    for (const e of this.index) {
      byType[e.sourceType] = (byType[e.sourceType] || 0) + 1;
    }
    const withNeuralEmbeddings = this.index.filter(e => e.embedding && e.embedding.length > 200).length;
    return {
      totalEntries: this.index.length,
      withEmbeddings: this.index.filter(e => e.embedding).length,
      withNeuralEmbeddings,
      bySourceType: byType,
    };
  }

  clear(): void { this.index = []; }
}

export const evidencePipeline = new EvidencePipeline();
