import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '..', '..');

function read(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('Evidence deep-link targets in entity pages', () => {
  it('property detail links to /evidence?entity=<property.id>', () => {
    const src = read('artifacts/terra/src/pages/property-detail.tsx');
    expect(src).toMatch(
      /href=\{`\/evidence\?entity=\$\{encodeURIComponent\(property\.id\)\}`\}/,
    );
    expect(src).toMatch(/View Evidence/);
  });

  it('vessel detail links to /evidence?entity=vessel-<id>', () => {
    const src = read('artifacts/vessels/src/pages/vessel-detail-enhanced.tsx');
    expect(src).toMatch(
      /href=\{`\/evidence\?entity=\$\{encodeURIComponent\(`vessel-\$\{vessel\.id\}`\)\}`\}/,
    );
    expect(src).toMatch(/View Evidence/);
  });

  it('matter overview links to /evidence?entity=matter-<id>', () => {
    const src = read('artifacts/counsel/src/pages/matter-overview.tsx');
    expect(src).toMatch(
      /href=\{`\/evidence\?entity=\$\{encodeURIComponent\(`matter-\$\{m\.id\}`\)\}`\}/,
    );
    expect(src).toMatch(/View Evidence/);
  });

  it('counsel app mounts an /evidence route hosting the shared Evidence Explorer', () => {
    const src = read('artifacts/counsel/src/App.tsx');
    expect(src).toMatch(/path=["']\/evidence["']/);
    expect(src).toMatch(/EvidenceExplorer/);
    expect(src).toMatch(/domainFilter=["']legal["']/);
  });

  it('shared EvidenceExplorer seeds selectedEntity from ?entity= and listens for popstate', () => {
    const src = read('lib/shared-ui/src/evidence-explorer.tsx');
    expect(src).toMatch(/readEntityFromLocation\(\)/);
    expect(src).toMatch(/window\.addEventListener\(\s*['"]popstate['"]/);
  });
});
