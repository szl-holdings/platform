import { describe, expect, it } from 'vitest';
import { getOperationsNav } from '../unified-layout';

describe('getOperationsNav', () => {
  it('does not include the Governance Admin section for non-admin users', () => {
    const groups = getOperationsNav(false);
    expect(groups.find((g) => g.section === 'Governance Admin')).toBeUndefined();
    const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(allHrefs).not.toContain('/operations/governance-tiers');
    expect(allHrefs).not.toContain('/operations/guardrail-configs');
  });

  it('exposes Governance Tiers and Guardrail Configs entries for admins', () => {
    const groups = getOperationsNav(true);
    const adminGroup = groups.find((g) => g.section === 'Governance Admin');
    expect(adminGroup).toBeDefined();
    const hrefs = adminGroup!.items.map((i) => i.href);
    expect(hrefs).toEqual(['/operations/governance-tiers', '/operations/guardrail-configs']);
    const labels = adminGroup!.items.map((i) => i.label);
    expect(labels).toEqual(['Governance Tiers', 'Guardrail Configs']);
  });

  it('inserts the Governance Admin section before the Ecosystem Apps section', () => {
    const groups = getOperationsNav(true);
    const adminIdx = groups.findIndex((g) => g.section === 'Governance Admin');
    const ecosystemIdx = groups.findIndex((g) => g.section === 'Ecosystem Apps');
    expect(adminIdx).toBeGreaterThanOrEqual(0);
    expect(ecosystemIdx).toBeGreaterThan(adminIdx);
  });
});
