#!/usr/bin/env node
/**
 * ops/audit/url-audit.mjs
 * Crawls pages up to MAX_PAGES, checking links, response status, and basic
 * content structure (title tag, main/h1 presence).
 *
 * Environment variables:
 *   TARGET_URL    Base URL to crawl (default: http://localhost:3000)
 *   MAX_PAGES     Max pages to crawl (default: 50)
 *
 * Usage:
 *   node ops/audit/url-audit.mjs
 *   TARGET_URL=https://staging.szlholdings.com MAX_PAGES=100 node ops/audit/url-audit.mjs
 */

import {
  env,
  loadRoutes,
  buildUrl,
  fetchWithTimeout,
  writeReport,
  section,
  log,
  ok,
  fail,
  warn,
  printSummary,
} from './lib.mjs';

const LINK_REGEX = /href="([^"#][^"]*)"/g;
const ABS_URL_REGEX = /^https?:\/\//;

function extractLinks(body, baseUrl) {
  const links = [];
  let match;
  while ((match = LINK_REGEX.exec(body)) !== null) {
    const href = match[1];
    if (!href || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
    try {
      const resolved = ABS_URL_REGEX.test(href)
        ? new URL(href).href
        : new URL(href, baseUrl).href;
      links.push(resolved);
    } catch {
      // ignore unparseable hrefs
    }
  }
  return [...new Set(links)];
}

function checkStructure(body, url) {
  const issues = [];
  if (!body.includes('<title')) issues.push('missing <title> tag');
  if (!body.includes('<h1') && !body.includes('<main')) {
    issues.push('missing <h1> or <main> landmark');
  }
  return issues;
}

async function auditPage(url, visited, results, depth = 0) {
  if (visited.size >= env.MAX_PAGES) return;
  if (visited.has(url)) return;
  visited.add(url);

  log(`Crawling (${visited.size}/${env.MAX_PAGES}) ${url}`);
  const res = await fetchWithTimeout(url);

  if (res.error) {
    fail(`${url}: ${res.error}`);
    results.push({ url, passed: false, reasons: [res.error], status: 0, durationMs: res.durationMs });
    return;
  }

  const structureIssues = res.status === 200 ? checkStructure(res.body, url) : [];
  const reasons = [];
  if (res.status >= 400) reasons.push(`HTTP ${res.status}`);
  reasons.push(...structureIssues);

  const passed = reasons.length === 0;
  if (passed) {
    ok(`${url} (${res.status}, ${res.durationMs}ms)`);
  } else {
    fail(`${url}: ${reasons.join('; ')}`);
  }

  results.push({ url, passed, reasons, status: res.status, durationMs: res.durationMs });

  if (res.status === 200 && depth < 2) {
    const links = extractLinks(res.body, url);
    const sameOrigin = links.filter(l => l.startsWith(env.TARGET_URL));
    for (const link of sameOrigin) {
      if (visited.size >= env.MAX_PAGES) break;
      await auditPage(link, visited, results, depth + 1);
    }
  }
}

async function main() {
  section('URL Audit — SZL Ecosystem');
  log(`Target: ${env.TARGET_URL}`);
  log(`Max pages: ${env.MAX_PAGES}`);

  const routes = loadRoutes();
  const seedUrls = routes.map(r => buildUrl(env.TARGET_URL, r.path));
  log(`Seeding crawl from ${seedUrls.length} known routes\n`);

  const visited = new Set();
  const results = [];

  for (const url of seedUrls) {
    if (visited.size >= env.MAX_PAGES) break;
    await auditPage(url, visited, results, 0);
  }

  const summary = printSummary('URL Audit', results);

  writeReport('url-audit-report.json', {
    timestamp: new Date().toISOString(),
    targetUrl: env.TARGET_URL,
    maxPages: env.MAX_PAGES,
    pagesVisited: visited.size,
    summary,
    results,
  });

  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
