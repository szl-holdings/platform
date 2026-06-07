import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readEntityFromLocation } from '../../lib/shared-ui/src/evidence-explorer';

function setSearch(search: string): void {
  const url = new URL(window.location.href);
  url.search = search;
  window.history.replaceState(null, '', url.toString());
}

describe('EvidenceExplorer ?entity= deep-link', () => {
  beforeEach(() => {
    setSearch('');
  });

  afterEach(() => {
    setSearch('');
  });

  it('returns null when ?entity= is absent', () => {
    expect(readEntityFromLocation()).toBeNull();
  });

  it('returns null when ?entity= is empty', () => {
    setSearch('?entity=');
    expect(readEntityFromLocation()).toBeNull();
  });

  it('returns null when ?entity= is whitespace only', () => {
    setSearch('?entity=%20%20');
    expect(readEntityFromLocation()).toBeNull();
  });

  it('returns the property entity id when ?entity=<property-id> is present', () => {
    setSearch('?entity=prop-001');
    expect(readEntityFromLocation()).toBe('prop-001');
  });

  it('returns the prefixed vessel entity id', () => {
    setSearch('?entity=vessel-poseidon');
    expect(readEntityFromLocation()).toBe('vessel-poseidon');
  });

  it('returns the prefixed matter entity id', () => {
    setSearch('?entity=matter-M-2024-001');
    expect(readEntityFromLocation()).toBe('matter-M-2024-001');
  });

  it('preserves additional query params alongside ?entity=', () => {
    setSearch('?domain=legal&entity=matter-M-2024-002&status=open');
    expect(readEntityFromLocation()).toBe('matter-M-2024-002');
  });

  it('re-reads the entity after history changes (popstate scenario)', () => {
    setSearch('?entity=prop-001');
    expect(readEntityFromLocation()).toBe('prop-001');

    setSearch('?entity=vessel-poseidon');
    expect(readEntityFromLocation()).toBe('vessel-poseidon');

    setSearch('');
    expect(readEntityFromLocation()).toBeNull();
  });
});
