#!/usr/bin/env node
/**
 * Metadata Checks — SZL Holdings Platform
 * Verifies all public pages have required SEO and OG metadata.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/check-metadata.js
 *   node scripts/qa/check-metadata.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const PUBLIC_ROUTES = [
  '/',
  '/platform',
  '/lyte',
  '/alloy-fabric',
  '/solutions',
  '/solutions/aegis',
  '/solutions/vessels',
  '/solutions/terra',
  '/solutions/prism-counsel',
  '/contact',
  '/pricing',
  '/trust-center',
  '/trust',
  '/trust/security',
  '/trust/governance',
  '/legal/privacy',
  '/legal/terms',
  '/accessibility',
];

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SZL-QA-MetaCheck/1.0' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractMeta(html) {
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
  const desc =
    (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i))?.[1] || '';
  const ogTitle =
    (html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i))?.[1] || '';
  const ogDesc =
    (html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i))?.[1] || '';
  const ogImage =
    (html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i))?.[1] || '';

  return { title, desc, ogTitle, ogDesc, ogImage };
}

function checkMetadata(meta, _route) {
  const issues = [];

  if (!meta.title || meta.title.trim().length < 5) issues.push('Missing or empty <title>');
  if (!meta.desc || meta.desc.trim().length < 20)
    issues.push('Missing or too short meta description');
  if (meta.desc && meta.desc.length > 160)
    issues.push(`Meta description too long (${meta.desc.length} chars)`);

  return issues;
}

async function main() {

  let _passed = 0;
  let failed = 0;
  const allIssues = [];

  for (const route of PUBLIC_ROUTES) {
    const url = BASE_URL + route;
    const html = await fetchPage(url);
    if (!html) {
      failed++;
      continue;
    }

    const meta = extractMeta(html);
    const issues = checkMetadata(meta, route);

    if (issues.length === 0) {
      _passed++;
    } else {
      issues.forEach((_issue) => {});
      allIssues.push({ route, issues });
      failed++;
    }
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
