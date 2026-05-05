import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import {
  dbInsertAgentIdentity,
  dbInsertHfAccessAudit,
  dbInsertProvenanceNode,
  dbInsertProvenanceEdge,
  dbInsertAgentReputation,
  dbComputeAgentReputation,
  dbListAgentIdentities,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';

function sha256(s: string) {
  return createHash('sha256').update(s).digest('hex');
}

function generateAgentKeypair(agentId: string) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pubDer = publicKey.export({ type: 'spki', format: 'der' });
  const pubB64 = pubDer.toString('base64');
  const fingerprint = 'SHA256:' + createHash('sha256').update(pubDer).digest('base64url');
  const certPayload = JSON.stringify({ agentId, algorithm: 'Ed25519', publicKey: pubB64 });
  const certSignature = sign(null, Buffer.from(certPayload, 'utf8'), privateKey);
  return {
    publicKey: `ed25519:${pubB64}`,
    keyFingerprint: fingerprint,
    certSignatureHex: certSignature.toString('hex'),
    certPayload,
    _privateKey: privateKey,
  };
}

function signEdge(privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'], payload: string): string {
  return sign(null, Buffer.from(payload, 'utf8'), privateKey).toString('hex');
}

const AGENT_DEFS = [
  { agentId: 'aid-cascade', agentName: 'Cascade Navigator', capabilities: ['eta-monitoring', 'port-cost-analysis', 'route-optimization', 'demurrage-calc'], maxAutonomy: 'execute_approved' as const, certId: 'cap-cert-cascade-001', certIssuer: 'spiffe://a11oy.szl/ca', certIssuedAt: new Date('2026-03-01'), certExpiresAt: new Date('2027-03-01'), attestationStatus: 'valid' as const, domain: 'vessels' },
  { agentId: 'aid-counsel', agentName: 'Counsel Sentinel', capabilities: ['deadline-tracking', 'doc-review', 'matter-monitoring', 'risk-scoring'], maxAutonomy: 'execute_approved' as const, certId: 'cap-cert-counsel-001', certIssuer: 'spiffe://a11oy.szl/ca', certIssuedAt: new Date('2026-02-15'), certExpiresAt: new Date('2027-02-15'), attestationStatus: 'valid' as const, domain: 'counsel' },
  { agentId: 'aid-guardian', agentName: 'Guardian', capabilities: ['threat-intel', 'posture-assessment', 'incident-triage', 'perimeter-hardening'], maxAutonomy: 'execute_approved' as const, certId: 'cap-cert-guardian-001', certIssuer: 'spiffe://a11oy.szl/ca', certIssuedAt: new Date('2026-01-01'), certExpiresAt: new Date('2027-01-01'), attestationStatus: 'valid' as const, domain: 'sentra' },
  { agentId: 'aid-pipeline', agentName: 'Pipeline Oracle', capabilities: ['pipeline-analysis', 'deal-scoring', 'forecast-modeling', 'churn-prediction'], maxAutonomy: 'recommend_only' as const, certId: 'cap-cert-pipeline-001', certIssuer: 'spiffe://a11oy.szl/ca', certIssuedAt: new Date('2026-03-15'), certExpiresAt: new Date('2027-03-15'), attestationStatus: 'valid' as const, domain: 'conduit' },
  { agentId: 'aid-terra', agentName: 'DOMAINE Analyst', capabilities: ['cap-rate-tracking', 'portfolio-analysis', 'valuation-modeling', 'comp-analysis'], maxAutonomy: 'recommend_only' as const, certId: 'cap-cert-terra-001', certIssuer: 'spiffe://a11oy.szl/ca', certIssuedAt: new Date('2026-04-01'), certExpiresAt: new Date('2027-04-01'), attestationStatus: 'valid' as const, domain: 'terra' },
  { agentId: 'aid-watchdog', agentName: 'Fabric Watchdog', capabilities: ['health-probe', 'proof-verification', 'layer-monitoring', 'latency-tracking'], maxAutonomy: 'full_demo_autopilot' as const, certId: 'cap-cert-watchdog-001', certIssuer: 'spiffe://a11oy.szl/ca', certIssuedAt: new Date('2026-01-01'), certExpiresAt: new Date('2027-01-01'), attestationStatus: 'valid' as const, domain: 'a11oy' },
];

const AUDIT_ENTRIES = [
  { externalId: 'hfa-001', agentId: 'aid-cascade', agentName: 'Cascade Navigator', resourceUri: 'hf://models/Qwen/Qwen3-8B', resourceType: 'model' as const, purpose: 'Route optimization reasoning', identityToken: 'aid-cascade', durationMs: 2340, success: true, accessedAt: new Date('2026-05-04T10:15:00Z') },
  { externalId: 'hfa-002', agentId: 'aid-guardian', agentName: 'Guardian', resourceUri: 'hf://models/BAAI/bge-m3', resourceType: 'model' as const, purpose: 'Threat intel embedding for IOC correlation', identityToken: 'aid-guardian', durationMs: 890, success: true, accessedAt: new Date('2026-05-04T10:12:00Z') },
  { externalId: 'hfa-003', agentId: 'aid-counsel', agentName: 'Counsel Sentinel', resourceUri: 'hf://models/Qwen/Qwen3-8B', resourceType: 'model' as const, purpose: 'Legal document summarization', identityToken: 'aid-counsel', durationMs: 3120, success: true, accessedAt: new Date('2026-05-04T10:08:00Z') },
  { externalId: 'hfa-004', agentId: 'aid-pipeline', agentName: 'Pipeline Oracle', resourceUri: 'hf://datasets/szl-holdings/pipeline-training-v3', resourceType: 'dataset' as const, purpose: 'Pipeline scoring model calibration', identityToken: 'aid-pipeline', durationMs: 1450, success: true, accessedAt: new Date('2026-05-04T09:55:00Z') },
  { externalId: 'hfa-005', agentId: 'aid-terra', agentName: 'DOMAINE Analyst', resourceUri: 'hf://models/sentence-transformers/all-MiniLM-L6-v2', resourceType: 'model' as const, purpose: 'Property comp embedding search', identityToken: 'aid-terra', durationMs: 670, success: true, accessedAt: new Date('2026-05-04T09:42:00Z') },
  { externalId: 'hfa-006', agentId: 'aid-watchdog', agentName: 'Fabric Watchdog', resourceUri: 'hf://models/Qwen/Qwen3-0.6B', resourceType: 'model' as const, purpose: 'Health probe latency baseline', identityToken: 'aid-watchdog', durationMs: 210, success: true, accessedAt: new Date('2026-05-04T09:30:00Z') },
  { externalId: 'hfa-007', agentId: 'aid-guardian', agentName: 'Guardian', resourceUri: 'hf://datasets/szl-holdings/threat-intel-corpus', resourceType: 'dataset' as const, purpose: 'TG-Ember campaign attribution training', identityToken: 'aid-guardian', durationMs: 4200, success: true, accessedAt: new Date('2026-05-04T09:15:00Z') },
  { externalId: 'hfa-008', agentId: 'aid-cascade', agentName: 'Cascade Navigator', resourceUri: 'hf://spaces/szl-holdings/port-congestion-viz', resourceType: 'space' as const, purpose: 'Port congestion prediction visualization', identityToken: 'aid-cascade', durationMs: 1800, success: true, accessedAt: new Date('2026-05-04T08:50:00Z') },
  { externalId: 'hfa-009', agentId: 'aid-counsel', agentName: 'Counsel Sentinel', resourceUri: 'hf://models/dslim/bert-base-NER', resourceType: 'model' as const, purpose: 'Named entity extraction from legal filings', identityToken: 'aid-counsel', durationMs: 540, success: true, accessedAt: new Date('2026-05-04T08:30:00Z') },
  { externalId: 'hfa-010', agentId: 'aid-pipeline', agentName: 'Pipeline Oracle', resourceUri: 'hf://models/facebook/bart-large-mnli', resourceType: 'model' as const, purpose: 'Deal stage zero-shot classification', identityToken: 'aid-pipeline', durationMs: 1120, success: false, accessedAt: new Date('2026-05-04T08:10:00Z') },
];

const PROVENANCE_NODES = [
  { nodeId: 'pn-qwen3-base', kind: 'base_model' as const, label: 'Qwen/Qwen3-8B', description: 'Base foundation model — 8B parameter Qwen3', metadata: { parameters: '8B', architecture: 'Transformer', license: 'Apache-2.0' }, nodeCreatedAt: new Date('2025-09-15') },
  { nodeId: 'pn-bge-m3-base', kind: 'base_model' as const, label: 'BAAI/bge-m3', description: 'Multi-lingual embedding model — M3 variant', metadata: { parameters: '568M', architecture: 'BERT-variant', license: 'MIT' }, nodeCreatedAt: new Date('2024-11-01') },
  { nodeId: 'pn-bert-ner', kind: 'base_model' as const, label: 'dslim/bert-base-NER', description: 'Named entity recognition — BERT base', metadata: { parameters: '110M', architecture: 'BERT', license: 'MIT' }, nodeCreatedAt: new Date('2023-06-01') },
  { nodeId: 'pn-bart-mnli', kind: 'base_model' as const, label: 'facebook/bart-large-mnli', description: 'Zero-shot classification — BART NLI', metadata: { parameters: '407M', architecture: 'BART', license: 'MIT' }, nodeCreatedAt: new Date('2023-01-01') },
  { nodeId: 'pn-threat-corpus', kind: 'dataset' as const, label: 'Threat Intel Corpus', description: 'TG-Ember campaign TTPs, IOCs, and attribution data — 24K labeled samples', metadata: { samples: '24,000', domains: 'APT, malware, phishing', freshness: '2026-05-01' }, nodeCreatedAt: new Date('2026-01-15') },
  { nodeId: 'pn-maritime-corpus', kind: 'dataset' as const, label: 'Maritime Operations Corpus', description: 'Port congestion, route delays, demurrage events — 18K labeled voyages', metadata: { samples: '18,000', domains: 'shipping, logistics', freshness: '2026-04-30' }, nodeCreatedAt: new Date('2026-02-01') },
  { nodeId: 'pn-legal-corpus', kind: 'dataset' as const, label: 'Legal Filings Corpus', description: 'Court filings, contracts, and regulatory docs — 32K annotated documents', metadata: { samples: '32,000', domains: 'litigation, contracts, regulatory', freshness: '2026-04-15' }, nodeCreatedAt: new Date('2025-11-01') },
  { nodeId: 'pn-pipeline-dataset', kind: 'dataset' as const, label: 'Pipeline Training v3', description: 'CRM pipeline stage transitions, win/loss outcomes — 45K deals', metadata: { samples: '45,000', domains: 'sales, revenue', freshness: '2026-04-28' }, nodeCreatedAt: new Date('2026-03-01') },
  { nodeId: 'pn-cascade-ft', kind: 'fine_tuned_model' as const, label: 'Cascade-Maritime-FT', description: 'Qwen3 fine-tuned on maritime ops — route optimization + ETA', metadata: { baseModel: 'Qwen/Qwen3-8B', epochs: '3', loraRank: '16' }, nodeCreatedAt: new Date('2026-03-15') },
  { nodeId: 'pn-guardian-ft', kind: 'fine_tuned_model' as const, label: 'Guardian-ThreatIntel-FT', description: 'BGE-M3 fine-tuned on threat intel corpus — IOC embedding', metadata: { baseModel: 'BAAI/bge-m3', epochs: '5', loraRank: '8' }, nodeCreatedAt: new Date('2026-02-20') },
  { nodeId: 'pn-counsel-ft', kind: 'fine_tuned_model' as const, label: 'Counsel-Legal-FT', description: 'BERT-NER fine-tuned on legal entity extraction', metadata: { baseModel: 'dslim/bert-base-NER', epochs: '4', loraRank: '12' }, nodeCreatedAt: new Date('2026-01-20') },
  { nodeId: 'pn-eval-cascade', kind: 'evaluation' as const, label: 'Cascade Maritime Eval', description: 'Route optimization accuracy and ETA prediction benchmarks', metadata: { accuracy: '94.2%', benchmark: 'maritime-ops-v2', samples: '2,400' }, nodeCreatedAt: new Date('2026-03-20') },
  { nodeId: 'pn-eval-guardian', kind: 'evaluation' as const, label: 'Guardian ThreatIntel Eval', description: 'IOC correlation and campaign attribution benchmarks', metadata: { accuracy: '98.1%', benchmark: 'threat-intel-v3', samples: '4,800' }, nodeCreatedAt: new Date('2026-02-25') },
  { nodeId: 'pn-eval-counsel', kind: 'evaluation' as const, label: 'Counsel NER Eval', description: 'Legal entity extraction F1 and precision benchmarks', metadata: { f1: '96.3%', benchmark: 'legal-ner-v1', samples: '6,400' }, nodeCreatedAt: new Date('2026-01-25') },
  { nodeId: 'pn-deploy-cascade', kind: 'deployment' as const, label: 'Cascade Production', description: 'Cascade Navigator production deployment — vessels domain', metadata: { environment: 'production', replicas: '2', region: 'us-east-1' }, nodeCreatedAt: new Date('2026-04-01') },
  { nodeId: 'pn-deploy-guardian', kind: 'deployment' as const, label: 'Guardian Production', description: 'Guardian production deployment — sentra domain', metadata: { environment: 'production', replicas: '3', region: 'us-east-1' }, nodeCreatedAt: new Date('2026-03-01') },
  { nodeId: 'pn-deploy-counsel', kind: 'deployment' as const, label: 'Counsel Production', description: 'Counsel Sentinel production deployment — counsel domain', metadata: { environment: 'production', replicas: '2', region: 'us-east-1' }, nodeCreatedAt: new Date('2026-02-01') },
  { nodeId: 'pn-agent-cascade', kind: 'agent' as const, label: 'Cascade Navigator', description: 'Maritime logistics agent — route optimization and ETA prediction', metadata: { agentId: 'aid-cascade', trustScore: '94.2' }, nodeCreatedAt: new Date('2026-04-01') },
  { nodeId: 'pn-agent-guardian', kind: 'agent' as const, label: 'Guardian', description: 'Cybersecurity agent — threat intel and incident triage', metadata: { agentId: 'aid-guardian', trustScore: '98.5' }, nodeCreatedAt: new Date('2026-03-01') },
  { nodeId: 'pn-agent-counsel', kind: 'agent' as const, label: 'Counsel Sentinel', description: 'Legal agent — document review and deadline tracking', metadata: { agentId: 'aid-counsel', trustScore: '97.8' }, nodeCreatedAt: new Date('2026-02-01') },
  { nodeId: 'pn-agent-pipeline', kind: 'agent' as const, label: 'Pipeline Oracle', description: 'Sales pipeline agent — deal scoring and forecasting', metadata: { agentId: 'aid-pipeline', trustScore: '88.4' }, nodeCreatedAt: new Date('2026-03-15') },
  { nodeId: 'pn-agent-terra', kind: 'agent' as const, label: 'DOMAINE Analyst', description: 'Real estate agent — cap rate tracking and valuation', metadata: { agentId: 'aid-terra', trustScore: '85.1' }, nodeCreatedAt: new Date('2026-04-01') },
  { nodeId: 'pn-agent-watchdog', kind: 'agent' as const, label: 'Fabric Watchdog', description: 'Infrastructure monitoring agent — health probes and latency tracking', metadata: { agentId: 'aid-watchdog', trustScore: '99.9' }, nodeCreatedAt: new Date('2026-01-01') },
];

const PROVENANCE_EDGE_DEFS = [
  { edgeId: 'pe-qwen-maritime', sourceNodeId: 'pn-qwen3-base', targetNodeId: 'pn-cascade-ft', relation: 'fine_tuned_from' as const, signerAgentId: 'aid-cascade', metadata: { method: 'LoRA', rank: '16' }, edgeTimestamp: new Date('2026-03-15') },
  { edgeId: 'pe-maritime-data', sourceNodeId: 'pn-maritime-corpus', targetNodeId: 'pn-cascade-ft', relation: 'trained_on' as const, signerAgentId: 'aid-cascade', metadata: { samples: '18,000' }, edgeTimestamp: new Date('2026-03-15') },
  { edgeId: 'pe-bge-threat', sourceNodeId: 'pn-bge-m3-base', targetNodeId: 'pn-guardian-ft', relation: 'fine_tuned_from' as const, signerAgentId: 'aid-guardian', metadata: { method: 'LoRA', rank: '8' }, edgeTimestamp: new Date('2026-02-20') },
  { edgeId: 'pe-threat-data', sourceNodeId: 'pn-threat-corpus', targetNodeId: 'pn-guardian-ft', relation: 'trained_on' as const, signerAgentId: 'aid-guardian', metadata: { samples: '24,000' }, edgeTimestamp: new Date('2026-02-20') },
  { edgeId: 'pe-bert-legal', sourceNodeId: 'pn-bert-ner', targetNodeId: 'pn-counsel-ft', relation: 'fine_tuned_from' as const, signerAgentId: 'aid-counsel', metadata: { method: 'LoRA', rank: '12' }, edgeTimestamp: new Date('2026-01-20') },
  { edgeId: 'pe-legal-data', sourceNodeId: 'pn-legal-corpus', targetNodeId: 'pn-counsel-ft', relation: 'trained_on' as const, signerAgentId: 'aid-counsel', metadata: { samples: '32,000' }, edgeTimestamp: new Date('2026-01-20') },
  { edgeId: 'pe-eval-cascade', sourceNodeId: 'pn-cascade-ft', targetNodeId: 'pn-eval-cascade', relation: 'evaluated_by' as const, signerAgentId: 'aid-watchdog', metadata: { benchmark: 'maritime-ops-v2' }, edgeTimestamp: new Date('2026-03-20') },
  { edgeId: 'pe-eval-guardian', sourceNodeId: 'pn-guardian-ft', targetNodeId: 'pn-eval-guardian', relation: 'evaluated_by' as const, signerAgentId: 'aid-watchdog', metadata: { benchmark: 'threat-intel-v3' }, edgeTimestamp: new Date('2026-02-25') },
  { edgeId: 'pe-eval-counsel', sourceNodeId: 'pn-counsel-ft', targetNodeId: 'pn-eval-counsel', relation: 'evaluated_by' as const, signerAgentId: 'aid-watchdog', metadata: { benchmark: 'legal-ner-v1' }, edgeTimestamp: new Date('2026-01-25') },
  { edgeId: 'pe-deploy-cascade', sourceNodeId: 'pn-eval-cascade', targetNodeId: 'pn-deploy-cascade', relation: 'deployed_under' as const, signerAgentId: 'aid-watchdog', metadata: { policy: 'auto-promote-on-pass' }, edgeTimestamp: new Date('2026-04-01') },
  { edgeId: 'pe-deploy-guardian', sourceNodeId: 'pn-eval-guardian', targetNodeId: 'pn-deploy-guardian', relation: 'deployed_under' as const, signerAgentId: 'aid-watchdog', metadata: { policy: 'auto-promote-on-pass' }, edgeTimestamp: new Date('2026-03-01') },
  { edgeId: 'pe-deploy-counsel', sourceNodeId: 'pn-eval-counsel', targetNodeId: 'pn-deploy-counsel', relation: 'deployed_under' as const, signerAgentId: 'aid-watchdog', metadata: { policy: 'auto-promote-on-pass' }, edgeTimestamp: new Date('2026-02-01') },
  { edgeId: 'pe-agent-cascade', sourceNodeId: 'pn-deploy-cascade', targetNodeId: 'pn-agent-cascade', relation: 'accessed_by' as const, signerAgentId: 'aid-cascade', metadata: { role: 'primary-consumer' }, edgeTimestamp: new Date('2026-04-01') },
  { edgeId: 'pe-agent-guardian', sourceNodeId: 'pn-deploy-guardian', targetNodeId: 'pn-agent-guardian', relation: 'accessed_by' as const, signerAgentId: 'aid-guardian', metadata: { role: 'primary-consumer' }, edgeTimestamp: new Date('2026-03-01') },
  { edgeId: 'pe-agent-counsel', sourceNodeId: 'pn-deploy-counsel', targetNodeId: 'pn-agent-counsel', relation: 'accessed_by' as const, signerAgentId: 'aid-counsel', metadata: { role: 'primary-consumer' }, edgeTimestamp: new Date('2026-02-01') },
  { edgeId: 'pe-pipeline-bart', sourceNodeId: 'pn-bart-mnli', targetNodeId: 'pn-agent-pipeline', relation: 'accessed_by' as const, signerAgentId: 'aid-pipeline', metadata: { usage: 'zero-shot-classification' }, edgeTimestamp: new Date('2026-03-15') },
];

export async function seedA11oyZeroTrust(): Promise<void> {
  try {
    const hf = services.huggingface;

    hf.setDbAuditPersister(async (entry) => {
      try {
        await dbInsertHfAccessAudit({
          externalId: entry.id,
          agentId: entry.agentId,
          agentName: entry.agentName,
          resourceUri: entry.resourceUri,
          resourceType: entry.resourceType as 'model' | 'dataset' | 'space',
          purpose: entry.purpose,
          identityToken: entry.identityToken,
          durationMs: entry.durationMs,
          success: entry.success,
          proofHash: entry.proofHash,
          accessedAt: new Date(entry.timestamp),
        });
      } catch (err) {
        console.error('[zero-trust-audit] Failed to persist HF access audit entry:', entry.id, err);
      }
    });

    const existing = await dbListAgentIdentities({ limit: 100 });
    if (existing.length > 0) {
      for (const row of existing) {
        hf.registerIdentity(row.agentId, {
          publicKey: row.publicKey,
          fingerprint: row.keyFingerprint,
          capabilities: (row.capabilities ?? []) as string[],
          attestationStatus: row.attestationStatus,
          certSignatureHex: row.certSignatureHex ?? undefined,
          certPayload: row.certPayload ?? undefined,
        });
      }
      console.log(`[seed-a11oy-zero-trust] Already seeded — hydrated ${existing.length} identities from DB + audit persister`);
      return;
    }

    const IDENTITIES = AGENT_DEFS.map(def => {
      const keys = generateAgentKeypair(def.agentId);
      return { ...def, ...keys };
    });

    for (const id of IDENTITIES) {
      try {
        await dbInsertAgentIdentity({
          ...id,
          publicKeyAlgorithm: 'Ed25519',
        });
      } catch (err) {
        console.error(`[seed-a11oy-zero-trust] Failed to insert identity ${id.agentId}:`, err);
      }

      hf.registerIdentity(id.agentId, {
        publicKey: id.publicKey,
        fingerprint: id.keyFingerprint,
        capabilities: id.capabilities as string[],
        attestationStatus: id.attestationStatus,
        certSignatureHex: id.certSignatureHex,
        certPayload: id.certPayload,
      });
    }

    for (const entry of AUDIT_ENTRIES) {
      try {
        await dbInsertHfAccessAudit({
          ...entry,
          proofHash: `sha256:${sha256(JSON.stringify(entry))}`,
        });
      } catch (err) {
        console.error(`[seed-a11oy-zero-trust] Failed to insert audit entry ${entry.externalId}:`, err);
      }
    }

    for (const node of PROVENANCE_NODES) {
      try {
        await dbInsertProvenanceNode({
          ...node,
          proofHash: `sha256:${sha256(node.nodeId + node.label)}`,
        });
      } catch (err) {
        console.error(`[seed-a11oy-zero-trust] Failed to insert provenance node ${node.nodeId}:`, err);
      }
    }

    const keyMap = new Map(IDENTITIES.map(id => [id.agentId, id]));

    for (const edgeDef of PROVENANCE_EDGE_DEFS) {
      try {
        const { signerAgentId, ...edgeFields } = edgeDef;
        const signer = keyMap.get(signerAgentId);
        const edgePayload = JSON.stringify({
          edgeId: edgeDef.edgeId,
          sourceNodeId: edgeDef.sourceNodeId,
          targetNodeId: edgeDef.targetNodeId,
          relation: edgeDef.relation,
        });
        const proofHash = `sha256:${sha256(edgePayload)}`;
        const edgeSignatureHex = signer
          ? signEdge(signer._privateKey, edgePayload)
          : undefined;

        await dbInsertProvenanceEdge({
          ...edgeFields,
          proofHash,
          signerAgentId,
          signerFingerprint: signer?.keyFingerprint,
          edgeSignatureHex,
        });
      } catch (err) {
        console.error(`[seed-a11oy-zero-trust] Failed to insert provenance edge ${edgeDef.edgeId}:`, err);
      }
    }

    for (const id of IDENTITIES) {
      try {
        const rep = await dbComputeAgentReputation(id.agentId, id.agentName);
        await dbInsertAgentReputation(rep);
      } catch (err) {
        console.error(`[seed-a11oy-zero-trust] Failed to insert reputation for ${id.agentId}:`, err);
      }
    }

    console.log('[seed-a11oy-zero-trust] Seeded zero-trust data:', {
      identities: IDENTITIES.length,
      auditEntries: AUDIT_ENTRIES.length,
      provenanceNodes: PROVENANCE_NODES.length,
      provenanceEdges: PROVENANCE_EDGE_DEFS.length,
    });
  } catch (err) {
    console.error('[seed-a11oy-zero-trust] Seed failed:', err);
  }
}
