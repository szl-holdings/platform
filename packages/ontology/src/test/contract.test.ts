/**
 * Contract tests for @workspace/ontology
 *
 * These tests assert that the enum values claimed in ontology.md actually
 * exist in the code. They are the mechanism that prevents the doc and the
 * code from drifting apart silently.
 *
 * If a test here fails, it means either:
 * a) The code dropped a value that ontology.md still claims → update the code.
 * b) ontology.md was updated but the code wasn't → update the code.
 * c) A new value was added to the code but not documented → update ontology.md.
 *
 * Run: pnpm --filter @workspace/ontology test
 */

import { describe, expect, it } from 'vitest';
import {
  ALL_ENTITY_TYPES,
  DOMAIN_LABELS,
  DOMAINS,
  ENTITY_LINK_TYPES,
  ENTITY_TYPE_DOMAINS,
  EVIDENCE_SOURCE_TYPES,
  EXPORT_SAFETY_STATES,
  FRESHNESS_LEVELS,
  POLICY_STATES,
  PROOF_SOURCE_CLASSES,
  REVIEW_STATES,
  SIGNAL_SEVERITIES,
  SIGNAL_TYPE_DOMAINS,
  SIGNAL_TYPES,
  SNAPSHOT_REASONS,
} from '../index.js';

// ---------------------------------------------------------------------------
// Domains — as claimed in ontology.md § Domains
// ---------------------------------------------------------------------------
describe('Domains', () => {
  const DOC_CLAIMED_DOMAINS = [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ] as const;

  it('all doc-claimed domains exist in DOMAINS', () => {
    for (const domain of DOC_CLAIMED_DOMAINS) {
      expect(DOMAINS).toContain(domain);
    }
  });

  it('every domain has a label', () => {
    for (const domain of DOMAINS) {
      expect(DOMAIN_LABELS[domain]).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Freshness Levels — as claimed in ontology.md § Freshness Levels
// ---------------------------------------------------------------------------
describe('FreshnessLevel', () => {
  const DOC_CLAIMED = ['live', 'recent', 'stale', 'expired'] as const;

  it('all doc-claimed freshness levels exist', () => {
    for (const level of DOC_CLAIMED) {
      expect(FRESHNESS_LEVELS).toContain(level);
    }
  });
});

// ---------------------------------------------------------------------------
// Policy States — as claimed in ontology.md § Policy State
// ---------------------------------------------------------------------------
describe('PolicyState', () => {
  const DOC_CLAIMED = ['cleared', 'conditional', 'blocked', 'flagged', 'pending'] as const;

  it('all doc-claimed policy states exist', () => {
    for (const state of DOC_CLAIMED) {
      expect(POLICY_STATES).toContain(state);
    }
  });
});

// ---------------------------------------------------------------------------
// Entity Types — as claimed in ontology.md § Core Entity Types
// ---------------------------------------------------------------------------
describe('EntityType', () => {
  const DOC_CLAIMED_PLATFORM = [
    'signal',
    'recommendation',
    'action',
    'approval',
    'workflow',
    'evidence',
    'outcome',
    'policy',
    'audit_event',
    'agent_run',
    'org',
    'agent',
    'model',
  ] as const;

  const DOC_CLAIMED_DOMAIN = [
    'vessel',
    'voyage',
    'property',
    'deal',
    'incident',
    'threat',
    'matter',
    'engagement',
    'brief',
  ] as const;

  it('all doc-claimed platform entity types exist', () => {
    for (const type of DOC_CLAIMED_PLATFORM) {
      expect(ALL_ENTITY_TYPES).toContain(type);
    }
  });

  it('all doc-claimed domain entity types exist', () => {
    for (const type of DOC_CLAIMED_DOMAIN) {
      expect(ALL_ENTITY_TYPES).toContain(type);
    }
  });

  it('every entity type has a domain assignment', () => {
    for (const type of ALL_ENTITY_TYPES) {
      const domains = ENTITY_TYPE_DOMAINS[type];
      expect(domains).toBeDefined();
      expect(domains.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Signal Types — as claimed in ontology.md § Signals
// ---------------------------------------------------------------------------
describe('SignalType', () => {
  const DOC_CLAIMED = [
    // SEXTANT
    'ais_dark',
    'ais_position',
    'sanctions_hit',
    'voyage_anomaly',
    'port_arrival',
    'cargo_discrepancy',
    // DOMAINE
    'distress_filing',
    'ownership_change',
    'lien_filed',
    'tax_delinquency',
    'foreclosure_filing',
    // Security
    'threat_indicator',
    'cve_published',
    'incident_detected',
    'ttp_observed',
    // Counsel
    'court_filing',
    'matter_deadline',
    'settlement_offer',
    // Platform
    'policy_violation',
    'freshness_degraded',
    'agent_drift',
    'cross_domain_alert',
    'approval_overdue',
    'workflow_stalled',
  ] as const;

  it('all doc-claimed signal types exist', () => {
    for (const type of DOC_CLAIMED) {
      expect(SIGNAL_TYPES).toContain(type);
    }
  });

  it('every signal type has a domain assignment', () => {
    for (const type of SIGNAL_TYPES) {
      const domains = SIGNAL_TYPE_DOMAINS[type];
      expect(domains).toBeDefined();
      expect(domains.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Signal Severity — as claimed in ontology.md § Signals
// ---------------------------------------------------------------------------
describe('SignalSeverity', () => {
  const DOC_CLAIMED = ['critical', 'high', 'medium', 'low', 'info'] as const;

  it('all doc-claimed severities exist', () => {
    for (const sev of DOC_CLAIMED) {
      expect(SIGNAL_SEVERITIES).toContain(sev);
    }
  });
});

// ---------------------------------------------------------------------------
// Entity Link Types — as claimed in ontology.md § Entity Links
// ---------------------------------------------------------------------------
describe('EntityLinkType', () => {
  const DOC_CLAIMED = [
    'triggers',
    'supports',
    'approved_by',
    'part_of',
    'related_to',
    'caused_by',
    'escalated_to',
    'supersedes',
    'correlated_with',
    'owned_by',
    'assigned_to',
  ] as const;

  it('all doc-claimed link types exist', () => {
    for (const type of DOC_CLAIMED) {
      expect(ENTITY_LINK_TYPES).toContain(type);
    }
  });
});

// ---------------------------------------------------------------------------
// Snapshot Reasons — as claimed in ontology.md § Entity Snapshots
// ---------------------------------------------------------------------------
describe('SnapshotReason', () => {
  const DOC_CLAIMED = ['pre_action', 'post_action', 'scheduled', 'triggered', 'replay'] as const;

  it('all doc-claimed snapshot reasons exist', () => {
    for (const reason of DOC_CLAIMED) {
      expect(SNAPSHOT_REASONS).toContain(reason);
    }
  });
});

// ---------------------------------------------------------------------------
// Proof / Evidence — as claimed in policy-model.md
// ---------------------------------------------------------------------------
describe('ProofSourceClass', () => {
  const DOC_CLAIMED = [
    'llm_generated',
    'human_authored',
    'system_computed',
    'external_ingested',
    'hybrid',
  ] as const;

  it('all doc-claimed source classes exist', () => {
    for (const cls of DOC_CLAIMED) {
      expect(PROOF_SOURCE_CLASSES).toContain(cls);
    }
  });
});

describe('ReviewState', () => {
  const DOC_CLAIMED = ['unreviewed', 'approved', 'flagged', 'retracted'] as const;

  it('all doc-claimed review states exist', () => {
    for (const state of DOC_CLAIMED) {
      expect(REVIEW_STATES).toContain(state);
    }
  });
});

describe('ExportSafetyState', () => {
  const DOC_CLAIMED = ['safe', 'restricted', 'pending_review', 'blocked'] as const;

  it('all doc-claimed export safety states exist', () => {
    for (const state of DOC_CLAIMED) {
      expect(EXPORT_SAFETY_STATES).toContain(state);
    }
  });
});

describe('EvidenceSourceType', () => {
  const DOC_CLAIMED = [
    'ais_record',
    'sanctions_entry',
    'court_document',
    'property_record',
    'threat_feed_entry',
    'audit_log_entry',
    'simulation_result',
    'agent_output',
    'human_annotation',
    'external_api_response',
  ] as const;

  it('all doc-claimed evidence source types exist', () => {
    for (const type of DOC_CLAIMED) {
      expect(EVIDENCE_SOURCE_TYPES).toContain(type);
    }
  });
});
