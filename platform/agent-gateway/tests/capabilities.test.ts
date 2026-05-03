/**
 * Agent Gateway — Capability Enforcement Tests
 * Phase 11 — Agent Gateway
 *
 * Tests: allowed capabilities pass, forbidden capabilities reject,
 * unknown capabilities reject, negative test per forbidden capability.
 */

import { describe, it, expect } from 'vitest';
import {
  enforceCapability,
  isForbidden,
  isAllowed,
  listCapabilities,
  CapabilityViolation,
} from '../src/capabilities/enforce.js';
import { FORBIDDEN_CAPABILITIES, ALLOWED_CAPABILITIES } from '../src/types.js';

// ---------------------------------------------------------------------------
// Positive tests — allowed capabilities pass
// ---------------------------------------------------------------------------

describe('enforceCapability — allowed capabilities', () => {
  for (const cap of ALLOWED_CAPABILITIES) {
    it(`allows '${cap}'`, () => {
      expect(() => enforceCapability(cap)).not.toThrow();
      expect(enforceCapability(cap)).toBe(cap);
    });
  }
});

// ---------------------------------------------------------------------------
// Negative tests — one per forbidden capability
// ---------------------------------------------------------------------------

describe('enforceCapability — forbidden capabilities (one negative test each)', () => {
  it('rejects direct_prod_change', () => {
    expect(() => enforceCapability('direct_prod_change')).toThrow(CapabilityViolation);
    try {
      enforceCapability('direct_prod_change');
    } catch (err) {
      expect((err as CapabilityViolation).violationType).toBe('forbidden');
      expect((err as CapabilityViolation).requestedCapability).toBe('direct_prod_change');
    }
  });

  it('rejects policy_bypass', () => {
    expect(() => enforceCapability('policy_bypass')).toThrow(CapabilityViolation);
    try {
      enforceCapability('policy_bypass');
    } catch (err) {
      expect((err as CapabilityViolation).violationType).toBe('forbidden');
    }
  });

  it('rejects pr_flow_bypass', () => {
    expect(() => enforceCapability('pr_flow_bypass')).toThrow(CapabilityViolation);
    try {
      enforceCapability('pr_flow_bypass');
    } catch (err) {
      expect((err as CapabilityViolation).violationType).toBe('forbidden');
    }
  });

  it('rejects approval_bypass', () => {
    expect(() => enforceCapability('approval_bypass')).toThrow(CapabilityViolation);
    try {
      enforceCapability('approval_bypass');
    } catch (err) {
      expect((err as CapabilityViolation).violationType).toBe('forbidden');
    }
  });

  it('rejects plaintext_secret_access', () => {
    expect(() => enforceCapability('plaintext_secret_access')).toThrow(CapabilityViolation);
    try {
      enforceCapability('plaintext_secret_access');
    } catch (err) {
      expect((err as CapabilityViolation).violationType).toBe('forbidden');
    }
  });
});

// ---------------------------------------------------------------------------
// Unknown capabilities
// ---------------------------------------------------------------------------

describe('enforceCapability — unknown capabilities', () => {
  it('rejects an unknown capability string', () => {
    expect(() => enforceCapability('delete_all_data')).toThrow(CapabilityViolation);
    try {
      enforceCapability('delete_all_data');
    } catch (err) {
      expect((err as CapabilityViolation).violationType).toBe('unknown');
    }
  });

  it('rejects empty string', () => {
    expect(() => enforceCapability('')).toThrow(CapabilityViolation);
  });

  it('rejects capability with SQL injection attempt', () => {
    expect(() => enforceCapability("'; DROP TABLE agents;--")).toThrow(CapabilityViolation);
  });
});

// ---------------------------------------------------------------------------
// Helper predicates
// ---------------------------------------------------------------------------

describe('isForbidden / isAllowed', () => {
  it('correctly identifies forbidden capabilities', () => {
    for (const cap of FORBIDDEN_CAPABILITIES) {
      expect(isForbidden(cap)).toBe(true);
      expect(isAllowed(cap)).toBe(false);
    }
  });

  it('correctly identifies allowed capabilities', () => {
    for (const cap of ALLOWED_CAPABILITIES) {
      expect(isAllowed(cap)).toBe(true);
      expect(isForbidden(cap)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// listCapabilities
// ---------------------------------------------------------------------------

describe('listCapabilities', () => {
  it('returns all allowed and forbidden capabilities', () => {
    const { allowed, forbidden } = listCapabilities();
    expect(allowed.length).toBe(ALLOWED_CAPABILITIES.size);
    expect(forbidden.length).toBe(FORBIDDEN_CAPABILITIES.size);
  });
});
