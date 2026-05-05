/**
 * Seed rationale payloads for A11oy structural attestation envelopes.
 *
 * These are the canonical rationale bodies for the chain-001/002/003 reasoning
 * nodes shown in the Proof Ledger. The envelope wrapper (envelopeId,
 * contentHash, signer, timestamp, nonce) is derived deterministically by
 * `buildEnvelope` in the attestation store — only the rationale payload is
 * the content-addressed source of truth.
 */

export interface RationaleSeed {
  envelopeId: string;
  rationale: Record<string, unknown>;
  /** Frozen timestamp so contentHash is stable across reads. */
  timestamp: string;
  /** Frozen nonce so contentHash is stable across reads. */
  nonce: string;
}

export const SEED_RATIONALE_ENVELOPES: RationaleSeed[] = [
  {
    envelopeId: 'env-chain-001-n3',
    timestamp: '2026-04-25T03:52:30Z',
    nonce: 'a8f3c2b1',
    rationale: {
      chainId: 'chain-001',
      nodeId: 'n3',
      domain: 'Maritime',
      actor: 'Cascade Navigator',
      summary: 'Recommend port standby at anchorage 1.28N 103.67E for MV Cascade.',
      reasoningTrace: [
        { type: 'premise', content: 'MV Cascade ETA delayed 18h due to Tanjung Pelepas port congestion (AIS feed confirmed)', confidence: 0.98 },
        { type: 'premise', content: 'Demurrage contract clause 4.2: $14,200/day rate applies after 24h delay', confidence: 0.99 },
        { type: 'premise', content: 'Historical standby at alternative anchorage saves avg $42,000 per event (12 prior cases)', confidence: 0.94 },
        { type: 'inference', content: 'Port standby at anchorage 1.28N 103.67E reduces demurrage exposure by ~$42K vs. waiting at berth', confidence: 0.96 },
        { type: 'inference', content: 'No alternative port within 6h offers lower total cost when factoring fuel + port charges', confidence: 0.92 },
        { type: 'conclusion', content: 'Recommend port standby at anchorage 1.28N 103.67E. Expected savings: $42,000. MirrorEval: 94%.', confidence: 0.945 },
      ],
      evidenceRefs: ['action-brief-cascade'],
    },
  },
  {
    envelopeId: 'env-chain-002-n3',
    timestamp: '2026-04-24T18:44:30Z',
    nonce: 'b7e2d1c0',
    rationale: {
      chainId: 'chain-002',
      nodeId: 'n3',
      domain: 'Defense',
      actor: 'Guardian',
      summary: 'Escalate TG-Ember to ORANGE; apply 14 perimeter hardening rules.',
      reasoningTrace: [
        { type: 'premise', content: 'TG-Ember C2 beacons detected on ports 443 and 8080 from 3 internal hosts', confidence: 0.97 },
        { type: 'premise', content: 'TG-Ember TTPs match known APT campaign (MITRE ATT&CK T1071, T1041)', confidence: 0.95 },
        { type: 'inference', content: 'Confidence-weighted threat score exceeds ORANGE threshold (0.92 > 0.90)', confidence: 0.96 },
        { type: 'conclusion', content: 'Escalate to ORANGE. Apply 14 perimeter hardening rules. Notify CISO.', confidence: 0.96 },
      ],
      evidenceRefs: ['guardian-brief-01'],
    },
  },
  {
    envelopeId: 'env-chain-003-n3',
    timestamp: '2026-04-24T08:05:00Z',
    nonce: 'c6d3e2f1',
    rationale: {
      chainId: 'chain-003',
      nodeId: 'n3',
      domain: 'Legal',
      actor: 'Counsel Sentinel',
      summary: 'Immediate escalation to lead counsel + co-counsel for Talbot discovery.',
      reasoningTrace: [
        { type: 'premise', content: '340 documents remain outstanding with T-48h discovery deadline', confidence: 0.99 },
        { type: 'premise', content: 'Opposing counsel has filed late in 3 of 5 prior cases — adverse inference motion risk is HIGH', confidence: 0.94 },
        { type: 'inference', content: 'Production rate of 15 docs/hour requires 22.7h — exceeds available time by 4.7h', confidence: 0.97 },
        { type: 'conclusion', content: 'Immediate escalation to lead counsel + co-counsel required. Risk: adverse inference motion.', confidence: 0.97 },
      ],
      evidenceRefs: ['counsel-brief-001'],
    },
  },
];
