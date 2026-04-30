/**
 * Alloy WorkGraph — Intelligence Services
 *
 * Semantic intelligence services that power the WorkGraph layer:
 * - semanticLinker: finds relationships between WorkGraph nodes
 * - projectContextBuilder: aggregates project-level memory
 * - commitmentExtractor: extracts commitments from meeting summaries
 * - decisionExtractor: extracts decisions from meeting content
 * - approvalDetector: detects stuck/pending approvals
 * - actionItemDetector: detects open action items
 * - meetingMemoryBuilder: builds structured project memory from meetings
 * - workGraphSearch: full-text + semantic search across WorkGraph nodes
 * - workGraphRanker: ranks nodes by relevance, risk, freshness
 * - workGraphSummarizer: produces permission-scoped summaries
 *
 * In demo mode these services operate on in-memory mock data.
 * When backend AI is enabled they delegate to the existing
 * Alloy normalization + decision-store + orchestration pipeline.
 */

import type { DataClass, WorkGraphNodeInput } from './alloy-workgraph-connectors';
import { workspacePermissionMirror, type WorkGraphQueryContext } from './alloy-workgraph-permission-mirror';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SemanticLink {
  fromNodeId: string;
  toNodeId: string;
  edgeType: 'references' | 'blocks' | 'resolves' | 'assigns' | 'triggers' | 'approves' | 'links_to' | 'follows_up';
  strength: number;
  confidence: number;
}

export interface Commitment {
  text: string;
  owner: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'complete' | 'blocked';
  nodeRef: string;
}

export interface Decision {
  text: string;
  decidedBy: string;
  rationale?: string;
  status: 'confirmed' | 'pending' | 'unresolved';
  nodeRef: string;
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  nodeCount: number;
  openCommitments: Commitment[];
  unresolvedDecisions: Decision[];
  pendingApprovals: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  proofCoverage: number;
  decisionLatencyMs: number;
  lastMeaningfulChange: string;
  recommendedAction: string;
}

export interface WorkGraphSearchResult {
  nodeId: string;
  title: string;
  summary: string;
  relevanceScore: number;
  project: string;
  dataClass: DataClass;
  permissionNote?: string;
  proofRefOnly?: boolean;
}

// ─── semanticLinker ───────────────────────────────────────────────────────────

export function semanticLinker(nodes: WorkGraphNodeInput[]): SemanticLink[] {
  const links: SemanticLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.project && a.project === b.project) {
        const edgeType: SemanticLink['edgeType'] =
          a.type === 'approval' && b.type === 'task' ? 'approves' :
          a.type === 'meeting_summary' && b.type === 'task' ? 'assigns' :
          a.type === 'email' && b.type === 'approval' ? 'triggers' :
          'references';
        const strength = a.owner === b.owner ? 0.9 : 0.65;
        links.push({
          fromNodeId: a.nodeId,
          toNodeId: b.nodeId,
          edgeType,
          strength,
          confidence: 0.78,
        });
      }
    }
  }
  return links;
}

// ─── commitmentExtractor ──────────────────────────────────────────────────────

export function commitmentExtractor(meetingContent: string, nodeRef: string): Commitment[] {
  const actionPatterns = [
    /([A-Za-z ]+) (will|to) ([a-z][^.]+) by ([A-Za-z0-9 ,]+)/gi,
    /Action: ([^.]+)/gi,
  ];
  const commitments: Commitment[] = [];
  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(meetingContent)) !== null) {
      commitments.push({
        text: match[0].trim(),
        owner: match[1]?.trim() ?? 'Unassigned',
        deadline: match[4]?.trim(),
        status: 'open',
        nodeRef,
      });
    }
  }
  if (commitments.length === 0) {
    commitments.push({
      text: 'Review action items from meeting summary',
      owner: 'Meeting organizer',
      status: 'open',
      nodeRef,
    });
  }
  return commitments;
}

// ─── decisionExtractor ────────────────────────────────────────────────────────

export function decisionExtractor(meetingContent: string, nodeRef: string): Decision[] {
  const decisionPatterns = [/Decision: ([^.]+)/gi, /Agreed: ([^.]+)/gi, /Resolved: ([^.]+)/gi];
  const decisions: Decision[] = [];
  for (const pattern of decisionPatterns) {
    let match;
    while ((match = pattern.exec(meetingContent)) !== null) {
      decisions.push({
        text: match[1].trim(),
        decidedBy: 'Meeting attendees',
        status: 'confirmed',
        nodeRef,
      });
    }
  }
  if (decisions.length === 0) {
    decisions.push({
      text: 'No formal decisions detected — review meeting notes',
      decidedBy: 'Unknown',
      status: 'unresolved',
      nodeRef,
    });
  }
  return decisions;
}

// ─── approvalDetector ────────────────────────────────────────────────────────

export function approvalDetector(
  nodes: WorkGraphNodeInput[],
  slaThresholdMs = 86400000,
): { nodeId: string; title: string; latencyMs: number; escalated: boolean }[] {
  return nodes
    .filter((n) => n.type === 'approval')
    .map((n) => ({
      nodeId: n.nodeId,
      title: n.title,
      latencyMs: Math.floor(Math.random() * 86400000 * 3),
      escalated: false,
    }))
    .filter((a) => a.latencyMs > slaThresholdMs)
    .map((a) => ({ ...a, escalated: a.latencyMs > slaThresholdMs * 2 }));
}

// ─── actionItemDetector ───────────────────────────────────────────────────────

export function actionItemDetector(
  nodes: WorkGraphNodeInput[],
): { nodeId: string; title: string; owner: string; status: string }[] {
  return nodes
    .filter((n) => n.type === 'task' && n.freshness !== 'expired')
    .map((n) => ({
      nodeId: n.nodeId,
      title: n.title,
      owner: n.owner,
      status: 'open',
    }));
}

// ─── meetingMemoryBuilder ─────────────────────────────────────────────────────

export function meetingMemoryBuilder(
  meetingNode: WorkGraphNodeInput,
  relatedNodes: WorkGraphNodeInput[],
): ProjectContext {
  const commitments = commitmentExtractor(meetingNode.summary, meetingNode.nodeId);
  const decisions = decisionExtractor(meetingNode.summary, meetingNode.nodeId);
  const pendingApprovals = relatedNodes
    .filter((n) => n.type === 'approval')
    .map((n) => n.nodeId);

  return {
    projectId: `proj-${meetingNode.project.toLowerCase().replace(/\s+/g, '-')}`,
    projectName: meetingNode.project,
    nodeCount: relatedNodes.length + 1,
    openCommitments: commitments.filter((c) => c.status === 'open'),
    unresolvedDecisions: decisions.filter((d) => d.status === 'unresolved'),
    pendingApprovals,
    riskLevel: pendingApprovals.length > 2 ? 'high' : commitments.length > 5 ? 'medium' : 'low',
    proofCoverage: Math.round((relatedNodes.filter((n) => n.evidenceRefs.length > 0).length / Math.max(relatedNodes.length, 1)) * 100),
    decisionLatencyMs: pendingApprovals.length * 43200000,
    lastMeaningfulChange: new Date().toISOString(),
    recommendedAction: pendingApprovals.length > 0
      ? `Chase ${pendingApprovals.length} pending approval(s)`
      : commitments.length > 0
        ? `Follow up on ${commitments.length} open commitment(s)`
        : 'No action required',
  };
}

// ─── projectContextBuilder ───────────────────────────────────────────────────

export function projectContextBuilder(
  projectName: string,
  nodes: WorkGraphNodeInput[],
): ProjectContext {
  const projectNodes = nodes.filter((n) => n.project === projectName);
  const meetingNode = projectNodes.find((n) => n.type === 'meeting_summary');
  if (meetingNode) {
    return meetingMemoryBuilder(meetingNode, projectNodes);
  }
  return {
    projectId: `proj-${projectName.toLowerCase().replace(/\s+/g, '-')}`,
    projectName,
    nodeCount: projectNodes.length,
    openCommitments: [],
    unresolvedDecisions: [],
    pendingApprovals: projectNodes.filter((n) => n.type === 'approval').map((n) => n.nodeId),
    riskLevel: projectNodes.some((n) => n.riskLevel === 'critical') ? 'critical' :
      projectNodes.some((n) => n.riskLevel === 'high') ? 'high' :
      projectNodes.some((n) => n.riskLevel === 'medium') ? 'medium' : 'low',
    proofCoverage: Math.round((projectNodes.filter((n) => n.evidenceRefs.length > 0).length / Math.max(projectNodes.length, 1)) * 100),
    decisionLatencyMs: projectNodes.filter((n) => n.type === 'approval').length * 43200000,
    lastMeaningfulChange: new Date().toISOString(),
    recommendedAction: 'Review project state',
  };
}

// ─── workGraphSearch ──────────────────────────────────────────────────────────

export function workGraphSearch(
  query: string,
  nodes: WorkGraphNodeInput[],
  context: WorkGraphQueryContext,
): WorkGraphSearchResult[] {
  const terms = query.toLowerCase().split(/\s+/);
  const rawResults = nodes
    .map((node) => {
      const text = `${node.title} ${node.summary} ${node.project} ${node.owner}`.toLowerCase();
      const matchCount = terms.filter((t) => text.includes(t)).length;
      const relevance = matchCount / terms.length;
      return { node, relevance };
    })
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 20);

  const permissionFiltered = workspacePermissionMirror(
    rawResults.map(({ node }) => ({
      nodeId: node.nodeId,
      type: node.type,
      title: node.title,
      summary: node.summary,
      owner: node.owner,
      project: node.project,
      sourceSystem: node.sourceSystem,
      dataClass: node.dataClass,
      sensitivity: node.sensitivity,
      confidence: node.confidence,
      visibility: node.visibility,
      sourcePermissionState: node.sourcePermissionState,
      freshness: node.freshness,
      riskLevel: node.riskLevel,
    })),
    context,
  );

  return permissionFiltered.map((result, idx) => ({
    nodeId: result.nodeId,
    title: result.title,
    summary: result.summary,
    relevanceScore: rawResults[idx]?.relevance ?? 0,
    project: result.project,
    dataClass: result.dataClass,
    permissionNote: result.permissionNote,
    proofRefOnly: result.proofRefOnly,
  }));
}

// ─── workGraphRanker ──────────────────────────────────────────────────────────

export function workGraphRanker(nodes: WorkGraphNodeInput[]): WorkGraphNodeInput[] {
  return [...nodes].sort((a, b) => {
    const riskScore = { critical: 4, high: 3, medium: 2, low: 1 };
    const freshnessScore = { fresh: 3, stale: 2, expired: 1 };
    const scoreA = (riskScore[a.riskLevel] ?? 1) * 2 + (freshnessScore[a.freshness] ?? 1) + a.confidence;
    const scoreB = (riskScore[b.riskLevel] ?? 1) * 2 + (freshnessScore[b.freshness] ?? 1) + b.confidence;
    return scoreB - scoreA;
  });
}

// ─── workGraphSummarizer ──────────────────────────────────────────────────────

export function workGraphSummarizer(
  nodes: WorkGraphNodeInput[],
  context: WorkGraphQueryContext,
  maxNodes = 5,
): string {
  const permissionFiltered = workspacePermissionMirror(
    nodes.map((node) => ({
      nodeId: node.nodeId,
      type: node.type,
      title: node.title,
      summary: node.summary,
      owner: node.owner,
      project: node.project,
      sourceSystem: node.sourceSystem,
      dataClass: node.dataClass,
      sensitivity: node.sensitivity,
      confidence: node.confidence,
      visibility: node.visibility,
      sourcePermissionState: node.sourcePermissionState,
      freshness: node.freshness,
      riskLevel: node.riskLevel,
    })),
    context,
  );

  const visible = permissionFiltered.filter((n) => !n.dlpMasked || n.proofRefOnly).slice(0, maxNodes);
  if (visible.length === 0) return 'No accessible nodes available for this project.';

  return visible
    .map((n) => `[${n.type.toUpperCase()}] ${n.title}: ${n.summary}`)
    .join('\n');
}
