#!/usr/bin/env node
/**
 * Trust & Legal Page Existence Checks — SZL Holdings Platform
 * Verifies all trust, legal, and compliance pages exist and have content.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/check-trust.js
 *   node scripts/qa/check-trust.js
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const REQUIRED_TRUST_ROUTES = [
  { route: "/legal/privacy", label: "Privacy Policy" },
  { route: "/legal/terms", label: "Terms of Service" },
  { route: "/accessibility", label: "Accessibility Statement" },
  { route: "/trust-center", label: "Trust Center" },
  { route: "/trust", label: "Trust Overview" },
  { route: "/trust/security", label: "Security" },
  { route: "/trust/governance", label: "Governance" },
  { route: "/trust/architecture", label: "Architecture" },
  { route: "/trust/ai", label: "AI Governance" },
  { route: "/trust/approvals", label: "Approvals" },
  { route: "/trust/operations", label: "Operations" },
  { route: "/status", label: "Status Page" },
  { route: "/solutions/aegis/trust", label: "Aegis Trust" },
  { route: "/solutions/vessels/trust", label: "Vessels Trust" },
  { route: "/solutions/terra/trust", label: "Terra Trust" },
  { route: "/solutions/lyte/trust", label: "Lyte Trust" },
];

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /coming soon/i,
  /placeholder/i,
  /todo/i,
  /under construction/i,
];

async function checkRoute(url, label) {
  const issues = [];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SZL-QA-Trust/1.0" },
    });

    if (!res.ok) {
      return {
        ok: false,
        label,
        url,
        issues: [`HTTP ${res.status} — page not found or error`],
      };
    }

    const html = await res.text();

    // Check for placeholder content
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(html)) {
        issues.push(`Contains placeholder text matching: ${pattern}`);
      }
    }

    // Check minimum content length (sparse pages are suspicious)
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (textContent.length < 200) {
      issues.push(`Page content is very short (${textContent.length} chars) — may be incomplete`);
    }

    return { ok: issues.length === 0, label, url, issues };
  } catch (err) {
    return { ok: false, label, url, issues: [err.message] };
  }
}

async function main() {
  console.log(`\nSZL Holdings — Trust & Legal Page Checks`);
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const { route, label } of REQUIRED_TRUST_ROUTES) {
    const url = BASE_URL + route;
    const result = await checkRoute(url, label);

    if (result.ok) {
      console.log(`  ✓ ${label} (${route})`);
      passed++;
    } else {
      console.error(`  ✗ ${label} (${route})`);
      result.issues.forEach((issue) => console.error(`      - ${issue}`));
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error(`\nFAIL — ${failed} required trust/legal page(s) have issues`);
    process.exit(1);
  } else {
    console.log(`\nPASS — All required trust and legal pages exist and have content`);
    process.exit(0);
  }
}

main();
