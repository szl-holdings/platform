#!/usr/bin/env node
/**
 * Broken Link Detection — SZL Holdings Platform
 * Checks all public routes for broken internal and external links.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/check-links.js
 *   node scripts/qa/check-links.js  (defaults to http://localhost:3000)
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const PAGES_TO_CHECK = [
  "/",
  "/platform",
  "/lyte",
  "/alloy-fabric",
  "/solutions",
  "/solutions/aegis",
  "/solutions/vessels",
  "/solutions/terra",
  "/solutions/prism-counsel",
  "/contact",
  "/trust-center",
  "/trust",
];

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SZL-QA-LinkCheck/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }
    if (href.startsWith("http://") || href.startsWith("https://")) {
      links.add(href);
    } else if (href.startsWith("/")) {
      links.add(baseUrl + href);
    }
  }
  return Array.from(links);
}

async function checkLink(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "SZL-QA-LinkCheck/1.0" },
    });
    clearTimeout(timer);
    return { url, status: res.status, ok: res.status < 400 };
  } catch (err) {
    clearTimeout(timer);
    return { url, status: 0, ok: false, error: err.message };
  }
}

async function main() {
  console.log(`\nSZL Holdings — Broken Link Detection`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const checked = new Map();
  let totalBroken = 0;

  for (const page of PAGES_TO_CHECK) {
    const pageUrl = BASE_URL + page;
    console.log(`Checking page: ${pageUrl}`);
    const html = await fetchPage(pageUrl);
    if (!html) {
      console.error(`  Could not fetch page: ${pageUrl}`);
      continue;
    }

    const links = extractLinks(html, BASE_URL);
    const broken = [];

    for (const link of links) {
      if (checked.has(link)) {
        if (!checked.get(link)) broken.push(link);
        continue;
      }
      const result = await checkLink(link);
      checked.set(link, result.ok);
      if (!result.ok) {
        broken.push(link);
        console.error(`    ✗ ${result.status} ${link}`);
      }
    }

    if (broken.length === 0) {
      console.log(`  ✓ All ${links.length} links OK`);
    } else {
      console.error(`  ✗ ${broken.length} broken link(s) found`);
      totalBroken += broken.length;
    }
  }

  console.log(`\nTotal broken links: ${totalBroken}`);
  if (totalBroken > 0) {
    console.error(`\nFAIL — ${totalBroken} broken link(s) detected`);
    process.exit(1);
  } else {
    console.log(`\nPASS — No broken links detected`);
    process.exit(0);
  }
}

main();
