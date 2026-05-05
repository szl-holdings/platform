import { db } from '../index.js';
import {
  a11oyAgentIdentitiesTable,
  a11oyHfAccessAuditTable,
  a11oyProvenanceNodesTable,
  a11oyProvenanceEdgesTable,
  a11oyAgentReputationTable,
} from '../schema/a11oy_zero_trust.js';
import type {
  InsertA11oyAgentIdentity,
  InsertA11oyHfAccessAudit,
  InsertA11oyProvenanceNode,
  InsertA11oyProvenanceEdge,
  InsertA11oyAgentReputation,
  A11oyAgentIdentity,
  A11oyHfAccessAudit,
  A11oyProvenanceNode,
  A11oyProvenanceEdge,
  A11oyAgentReputation,
} from '../schema/a11oy_zero_trust.js';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

export async function dbInsertAgentIdentity(row: InsertA11oyAgentIdentity): Promise<void> {
  await db.insert(a11oyAgentIdentitiesTable).values(row).onConflictDoNothing();
}

export async function dbListAgentIdentities(opts?: {
  attestationStatus?: string;
  domain?: string;
  limit?: number;
}): Promise<A11oyAgentIdentity[]> {
  const conditions = [];
  if (opts?.attestationStatus) conditions.push(eq(a11oyAgentIdentitiesTable.attestationStatus, opts.attestationStatus as A11oyAgentIdentity['attestationStatus']));
  if (opts?.domain) conditions.push(eq(a11oyAgentIdentitiesTable.domain, opts.domain));
  return db
    .select()
    .from(a11oyAgentIdentitiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(a11oyAgentIdentitiesTable.createdAt))
    .limit(opts?.limit ?? 200);
}

export async function dbGetAgentIdentity(agentId: string): Promise<A11oyAgentIdentity | undefined> {
  const [row] = await db
    .select()
    .from(a11oyAgentIdentitiesTable)
    .where(eq(a11oyAgentIdentitiesTable.agentId, agentId))
    .limit(1);
  return row;
}

export async function dbInsertHfAccessAudit(row: InsertA11oyHfAccessAudit): Promise<void> {
  await db.insert(a11oyHfAccessAuditTable).values(row).onConflictDoNothing();
}

export async function dbListHfAccessAudit(opts?: {
  agentId?: string;
  resourceType?: string;
  since?: Date;
  success?: boolean;
  limit?: number;
}): Promise<A11oyHfAccessAudit[]> {
  const conditions = [];
  if (opts?.agentId) conditions.push(eq(a11oyHfAccessAuditTable.agentId, opts.agentId));
  if (opts?.resourceType) conditions.push(eq(a11oyHfAccessAuditTable.resourceType, opts.resourceType as A11oyHfAccessAudit['resourceType']));
  if (opts?.since) conditions.push(gte(a11oyHfAccessAuditTable.accessedAt, opts.since));
  if (opts?.success !== undefined) conditions.push(eq(a11oyHfAccessAuditTable.success, opts.success));
  return db
    .select()
    .from(a11oyHfAccessAuditTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(a11oyHfAccessAuditTable.accessedAt))
    .limit(opts?.limit ?? 100);
}

export async function dbInsertProvenanceNode(row: InsertA11oyProvenanceNode): Promise<void> {
  await db.insert(a11oyProvenanceNodesTable).values(row).onConflictDoNothing();
}

export async function dbListProvenanceNodes(opts?: {
  kind?: string;
  limit?: number;
}): Promise<A11oyProvenanceNode[]> {
  const conditions = [];
  if (opts?.kind) conditions.push(eq(a11oyProvenanceNodesTable.kind, opts.kind as A11oyProvenanceNode['kind']));
  return db
    .select()
    .from(a11oyProvenanceNodesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(a11oyProvenanceNodesTable.nodeCreatedAt))
    .limit(opts?.limit ?? 200);
}

export async function dbInsertProvenanceEdge(row: InsertA11oyProvenanceEdge): Promise<void> {
  await db.insert(a11oyProvenanceEdgesTable).values(row).onConflictDoNothing();
}

export async function dbListProvenanceEdges(opts?: {
  sourceNodeId?: string;
  targetNodeId?: string;
  relation?: string;
  limit?: number;
}): Promise<A11oyProvenanceEdge[]> {
  const conditions = [];
  if (opts?.sourceNodeId) conditions.push(eq(a11oyProvenanceEdgesTable.sourceNodeId, opts.sourceNodeId));
  if (opts?.targetNodeId) conditions.push(eq(a11oyProvenanceEdgesTable.targetNodeId, opts.targetNodeId));
  if (opts?.relation) conditions.push(eq(a11oyProvenanceEdgesTable.relation, opts.relation as A11oyProvenanceEdge['relation']));
  return db
    .select()
    .from(a11oyProvenanceEdgesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(a11oyProvenanceEdgesTable.edgeTimestamp))
    .limit(opts?.limit ?? 200);
}

export async function dbQueryLineage(
  direction: 'upstream' | 'downstream',
  nodeId: string,
  maxDepth: number = 10,
): Promise<{ nodes: A11oyProvenanceNode[]; edges: A11oyProvenanceEdge[] }> {
  const visitedNodeIds = new Set<string>();
  const resultEdges: A11oyProvenanceEdge[] = [];
  const frontier = [nodeId];
  let depth = 0;

  while (frontier.length > 0 && depth < maxDepth) {
    const current = frontier.splice(0, frontier.length);
    for (const nid of current) {
      if (visitedNodeIds.has(nid)) continue;
      visitedNodeIds.add(nid);

      const edges = direction === 'upstream'
        ? await db.select().from(a11oyProvenanceEdgesTable).where(eq(a11oyProvenanceEdgesTable.targetNodeId, nid))
        : await db.select().from(a11oyProvenanceEdgesTable).where(eq(a11oyProvenanceEdgesTable.sourceNodeId, nid));

      for (const edge of edges) {
        resultEdges.push(edge);
        const nextId = direction === 'upstream' ? edge.sourceNodeId : edge.targetNodeId;
        if (!visitedNodeIds.has(nextId)) frontier.push(nextId);
      }
    }
    depth++;
  }

  const allNodeIds = [...visitedNodeIds];
  const nodes: A11oyProvenanceNode[] = [];
  for (const nid of allNodeIds) {
    const [node] = await db.select().from(a11oyProvenanceNodesTable).where(eq(a11oyProvenanceNodesTable.nodeId, nid)).limit(1);
    if (node) nodes.push(node);
  }

  return { nodes, edges: resultEdges };
}

export async function dbInsertAgentReputation(row: InsertA11oyAgentReputation): Promise<void> {
  const existing = await db
    .select({ id: a11oyAgentReputationTable.id })
    .from(a11oyAgentReputationTable)
    .where(eq(a11oyAgentReputationTable.agentId, row.agentId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(a11oyAgentReputationTable)
      .set({
        agentName: row.agentName,
        overallScore: row.overallScore,
        successfulDeployments: row.successfulDeployments,
        totalDeployments: row.totalDeployments,
        evaluationPassRate: row.evaluationPassRate,
        governanceComplianceRate: row.governanceComplianceRate,
        costEfficiency: row.costEfficiency,
        provenanceDepth: row.provenanceDepth,
        computedAt: row.computedAt ?? new Date(),
      })
      .where(eq(a11oyAgentReputationTable.id, existing[0]!.id));
  } else {
    await db.insert(a11oyAgentReputationTable).values(row);
  }
}

export async function dbListAgentReputation(opts?: {
  agentId?: string;
  limit?: number;
}): Promise<A11oyAgentReputation[]> {
  const conditions = [];
  if (opts?.agentId) conditions.push(eq(a11oyAgentReputationTable.agentId, opts.agentId));
  return db
    .select()
    .from(a11oyAgentReputationTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(a11oyAgentReputationTable.computedAt))
    .limit(opts?.limit ?? 200);
}

export async function dbQueryProvenanceSemantic(
  query: string,
): Promise<{ nodes: A11oyProvenanceNode[]; edges: A11oyProvenanceEdge[]; interpretation: string }> {
  const q = query.toLowerCase().trim();

  const trainedOnMatch = q.match(/models?\s+trained\s+on\s+(?:dataset\s+)?["""]?(.+?)["""]?\s*$/i)
    ?? q.match(/trained\s+on\s+["""]?(.+?)["""]?\s*$/i);
  const deployedByMatch = q.match(/(?:agents?|who)\s+deployed\s+(?:model\s+)?["""]?(.+?)["""]?\s*$/i)
    ?? q.match(/deployed\s+["""]?(.+?)["""]?\s*$/i);
  const datasetForMatch = q.match(/datasets?\s+(?:used\s+)?(?:for|by|in)\s+["""]?(.+?)["""]?\s*$/i);
  const lineageMatch = q.match(/lineage\s+(?:of|for)\s+["""]?(.+?)["""]?\s*$/i)
    ?? q.match(/provenance\s+(?:of|for)\s+["""]?(.+?)["""]?\s*$/i);

  let interpretation = '';
  const resultNodeIds = new Set<string>();
  const resultEdgeIds = new Set<string>();

  const allNodes = await db.select().from(a11oyProvenanceNodesTable).limit(500);
  const allEdges = await db.select().from(a11oyProvenanceEdgesTable).limit(500);
  const nodeMap = new Map(allNodes.map(n => [n.nodeId, n]));

  function findNodeByLabel(label: string): A11oyProvenanceNode | undefined {
    const l = label.toLowerCase();
    return allNodes.find(n => n.label.toLowerCase().includes(l) || n.nodeId.toLowerCase().includes(l));
  }

  if (trainedOnMatch) {
    const datasetName = trainedOnMatch[1]!;
    const datasetNode = findNodeByLabel(datasetName);
    interpretation = `Models trained on dataset matching "${datasetName}"`;
    if (datasetNode) {
      resultNodeIds.add(datasetNode.nodeId);
      for (const edge of allEdges) {
        if (edge.relation === 'trained_on' && edge.sourceNodeId === datasetNode.nodeId) {
          resultEdgeIds.add(edge.edgeId);
          resultNodeIds.add(edge.targetNodeId);
          const targetNode = nodeMap.get(edge.targetNodeId);
          if (targetNode) resultNodeIds.add(targetNode.nodeId);
        }
      }
    }
  } else if (deployedByMatch) {
    const modelName = deployedByMatch[1]!;
    const modelNode = findNodeByLabel(modelName);
    interpretation = `Agents that deployed model matching "${modelName}"`;
    if (modelNode) {
      resultNodeIds.add(modelNode.nodeId);
      const visited = new Set<string>([modelNode.nodeId]);
      const frontier = [modelNode.nodeId];
      while (frontier.length > 0) {
        const nid = frontier.pop()!;
        for (const edge of allEdges) {
          if (edge.sourceNodeId === nid && !visited.has(edge.targetNodeId)) {
            resultEdgeIds.add(edge.edgeId);
            resultNodeIds.add(edge.targetNodeId);
            visited.add(edge.targetNodeId);
            frontier.push(edge.targetNodeId);
          }
        }
      }
    }
  } else if (datasetForMatch) {
    const targetName = datasetForMatch[1]!;
    const targetNode = findNodeByLabel(targetName);
    interpretation = `Datasets used for "${targetName}"`;
    if (targetNode) {
      resultNodeIds.add(targetNode.nodeId);
      const visited = new Set<string>([targetNode.nodeId]);
      const frontier = [targetNode.nodeId];
      while (frontier.length > 0) {
        const nid = frontier.pop()!;
        for (const edge of allEdges) {
          if (edge.targetNodeId === nid && !visited.has(edge.sourceNodeId)) {
            const srcNode = nodeMap.get(edge.sourceNodeId);
            if (srcNode && (srcNode.kind === 'dataset' || edge.relation === 'trained_on' || edge.relation === 'fine_tuned_from')) {
              resultEdgeIds.add(edge.edgeId);
              resultNodeIds.add(edge.sourceNodeId);
              visited.add(edge.sourceNodeId);
              frontier.push(edge.sourceNodeId);
            }
          }
        }
      }
    }
  } else if (lineageMatch) {
    const name = lineageMatch[1]!;
    const node = findNodeByLabel(name);
    interpretation = `Full lineage of "${name}"`;
    if (node) {
      const lineage = await dbQueryLineage('upstream', node.nodeId, 10);
      for (const n of lineage.nodes) resultNodeIds.add(n.nodeId);
      for (const e of lineage.edges) resultEdgeIds.add(e.edgeId);
      const downstream = await dbQueryLineage('downstream', node.nodeId, 10);
      for (const n of downstream.nodes) resultNodeIds.add(n.nodeId);
      for (const e of downstream.edges) resultEdgeIds.add(e.edgeId);
    }
  } else {
    interpretation = `Text search for "${q}"`;
    for (const n of allNodes) {
      if (n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || JSON.stringify(n.metadata).toLowerCase().includes(q)) {
        resultNodeIds.add(n.nodeId);
        for (const edge of allEdges) {
          if (edge.sourceNodeId === n.nodeId || edge.targetNodeId === n.nodeId) {
            resultEdgeIds.add(edge.edgeId);
            resultNodeIds.add(edge.sourceNodeId);
            resultNodeIds.add(edge.targetNodeId);
          }
        }
      }
    }
  }

  const nodes = allNodes.filter(n => resultNodeIds.has(n.nodeId));
  const edges = allEdges.filter(e => resultEdgeIds.has(e.edgeId));

  return { nodes, edges, interpretation };
}

export async function dbComputeAgentReputation(agentId: string, agentName: string): Promise<InsertA11oyAgentReputation> {
  const agentNodeId = `pn-agent-${agentId.replace('aid-', '')}`;

  const agentAccessEdges = await db
    .select()
    .from(a11oyProvenanceEdgesTable)
    .where(and(
      eq(a11oyProvenanceEdgesTable.relation, 'accessed_by'),
      eq(a11oyProvenanceEdgesTable.targetNodeId, agentNodeId),
    ));

  const deploymentNodeIds = agentAccessEdges.map(e => e.sourceNodeId);

  let successfulDeployments = 0;
  let totalDeployments = 0;
  const evaluatedModelNodeIds = new Set<string>();

  for (const deployNodeId of deploymentNodeIds) {
    totalDeployments++;
    const deployNode = await db
      .select()
      .from(a11oyProvenanceNodesTable)
      .where(eq(a11oyProvenanceNodesTable.nodeId, deployNodeId))
      .limit(1);
    if (deployNode.length > 0 && deployNode[0]!.kind === 'deployment') {
      successfulDeployments++;
    }

    const evalToDeployEdges = await db
      .select()
      .from(a11oyProvenanceEdgesTable)
      .where(and(
        eq(a11oyProvenanceEdgesTable.relation, 'deployed_under'),
        eq(a11oyProvenanceEdgesTable.targetNodeId, deployNodeId),
      ));
    for (const ede of evalToDeployEdges) {
      evaluatedModelNodeIds.add(ede.sourceNodeId);
    }
  }

  let evalPassCount = 0;
  let evalTotalCount = 0;
  for (const evalNodeId of evaluatedModelNodeIds) {
    const evalNode = await db
      .select()
      .from(a11oyProvenanceNodesTable)
      .where(eq(a11oyProvenanceNodesTable.nodeId, evalNodeId))
      .limit(1);
    if (evalNode.length > 0 && evalNode[0]!.kind === 'evaluation') {
      evalTotalCount++;
      const meta = evalNode[0]!.metadata as Record<string, string> | null;
      const accuracy = meta?.accuracy ?? meta?.f1;
      if (accuracy) {
        const pct = parseFloat(accuracy.replace('%', ''));
        if (!isNaN(pct) && pct >= 80) evalPassCount++;
      } else {
        evalPassCount++;
      }
    }
  }

  const auditRows = await db
    .select()
    .from(a11oyHfAccessAuditTable)
    .where(eq(a11oyHfAccessAuditTable.agentId, agentId));
  const totalCalls = auditRows.length;
  const successCalls = auditRows.filter(r => r.success).length;
  const avgDuration = totalCalls > 0
    ? auditRows.reduce((sum, r) => sum + r.durationMs, 0) / totalCalls
    : 0;

  const signedEdges = await db
    .select()
    .from(a11oyProvenanceEdgesTable)
    .where(eq(a11oyProvenanceEdgesTable.signerAgentId, agentId));
  const signedWithProof = signedEdges.filter(e => e.edgeSignatureHex && e.proofHash);
  const governanceComplianceRate = signedEdges.length > 0
    ? signedWithProof.length / signedEdges.length
    : (totalCalls > 0 ? successCalls / totalCalls : 1);

  const lineage = await dbQueryLineage('upstream', agentNodeId, 10);
  const provenanceDepth = lineage.edges.length;

  const evalPassRate = evalTotalCount > 0 ? evalPassCount / evalTotalCount : 0;
  const deploySuccessRate = totalDeployments > 0 ? successfulDeployments / totalDeployments : 0;
  const costEff = avgDuration > 0 ? Math.min(1, 1000 / avgDuration) : 0.9;

  const overallScore = Math.round(
    (deploySuccessRate * 30 + evalPassRate * 25 + governanceComplianceRate * 25 + costEff * 10 + Math.min(provenanceDepth / 15, 1) * 10) * 10
  ) / 10;

  return {
    agentId,
    agentName,
    overallScore,
    successfulDeployments,
    totalDeployments,
    evaluationPassRate: Math.round(evalPassRate * 100) / 100,
    governanceComplianceRate: Math.round(governanceComplianceRate * 100) / 100,
    costEfficiency: Math.round(costEff * 100) / 100,
    provenanceDepth,
    computedAt: new Date(),
  };
}
