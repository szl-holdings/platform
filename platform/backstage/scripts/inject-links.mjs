#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'szl-holdings/monorepo';
const PKGS_DIR = 'packages';
let updated = 0;

for (const dir of readdirSync(PKGS_DIR)) {
  const path = join(PKGS_DIR, dir, 'catalog-info.yaml');
  let txt;
  try { txt = readFileSync(path, 'utf8'); } catch { continue; }
  const runbook = txt.match(/szl\.io\/runbook:\s*(.+)/)?.[1]?.trim();
  const techdocs = txt.match(/backstage\.io\/techdocs-ref:\s*(.+)/)?.[1]?.trim();
  const health   = txt.match(/szl\.io\/health-endpoint:\s*(.+)/)?.[1]?.trim();
  const slug     = txt.match(/github\.com\/project-slug:\s*(.+)/)?.[1]?.trim() ?? REPO;
  const pkgDir   = dir;

  const links = [];
  if (runbook) {
    links.push(`    - url: https://github.com/${slug}/blob/main/${runbook}`);
    links.push(`      title: Runbook`);
    links.push(`      icon: docs`);
  }
  if (techdocs) {
    links.push(`    - url: https://github.com/${slug}/tree/main/packages/${pkgDir}/docs`);
    links.push(`      title: TechDocs Source`);
    links.push(`      icon: techdocs`);
  }
  if (health) {
    const healthUrl = /^https?:/.test(health) ? health : `https://internal.szl-holdings.local${health}`;
    links.push(`    - url: ${healthUrl}`);
    links.push(`      title: Health Endpoint`);
    links.push(`      icon: dashboard`);
  }
  if (!links.length) continue;

  txt = txt.replace(/(\n  links:\n(?:    .+\n)+)/, '\n');

  const out = txt.replace(
    /(metadata:\n(?:.*\n)*?  annotations:\n(?:    .+\n)*)/,
    (m) => `${m}  links:\n${links.join('\n')}\n`
  );
  if (out !== txt) {
    writeFileSync(path, out);
    updated++;
    console.log(`✓ ${path}`);
  }
}
console.log(`\nUpdated ${updated} catalog files with metadata.links`);
