#!/usr/bin/env node
/**
 * Reject newly introduced hard-coded claim counts that disagree with
 * artifacts/SOURCE_OF_TRUTH.json.
 *
 * Existing public-claim debt is scanned with --all. Pull requests and pushes
 * pass --base <sha> so the required gate prevents new drift without disguising
 * the pre-existing reconciliation backlog as green.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Metric = {
  value: number | string | boolean | null;
  label: string;
  source: string;
};

type Rule = {
  name: string;
  literals: string[];
  words: RegExp;
  context?: RegExp;
  metric: string | ((path: string, line: string) => string);
};

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const TRUTH_PATH = resolve(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const ALLOWLIST_PATH = resolve(ROOT, '.truth-allowlist');
const SCANNED_EXTENSIONS = new Set(['.html', '.md', '.mdx', '.tsx']);

function writeOut(message: string): void {
  process.stdout.write(`${message}\n`);
}

function writeError(message: string): void {
  process.stderr.write(`${message}\n`);
}

const RULES: Rule[] = [
  {
    name: 'repository count',
    literals: ['19', '27'],
    words: /\brepos(?:itories)?\b/i,
    context: /\b(?:public|github|org|estate)\b/i,
    metric: 'github_public_repositories',
  },
  {
    name: 'package count',
    literals: ['126'],
    words: /\bpackages?\b/i,
    metric: 'monorepo_packages',
  },
  {
    name: 'endpoint count',
    literals: ['144'],
    words: /\bendpoints?\b/i,
    metric: 'api_endpoints',
  },
  {
    name: 'workflow count',
    literals: ['23'],
    words: /\b(?:ci\s+)?workflows?\b/i,
    metric: 'ci_workflows',
  },
  {
    name: 'Hugging Face model count',
    literals: ['15'],
    words: /\bmodels?\b/i,
    context: /\b(?:hugging\s*face|hf|szlholdings)\b/i,
    metric: 'hf_models',
  },
  {
    name: 'Hugging Face dataset count',
    literals: ['24', '26'],
    words: /\bdatasets?\b/i,
    context: /\b(?:hugging\s*face|hf|szlholdings)\b/i,
    metric: 'hf_datasets',
  },
  {
    name: 'Hugging Face Space count',
    literals: ['7', '8', '9', '15', '22', '24', '25', '26'],
    words: /\bspaces?\b/i,
    context: /\b(?:hugging\s*face|hf|szlholdings)\b/i,
    metric: 'hf_spaces',
  },
  {
    name: 'customer-facing vertical count',
    literals: ['5', '7', '8', '9', '67', '76'],
    words: /\b(?:customer-facing\s+verticals?|product\s+surfaces?|surfaces?)\b/i,
    context: /\b(?:customer|product|vertical|holographic|hero|org|public)\b/i,
    metric: 'surfaces_customer_facing',
  },
  {
    name: 'test count',
    literals: ['218', '848', '1,220', '1220', '5,524', '5524'],
    words: /\btests?\b/i,
    context: /\b(?:pass(?:ed|ing)?|suite|vitest|ouroboros|platform)\b/i,
    metric: (path, line) =>
      /ouroboros/i.test(`${path} ${line}`) ? 'ouroboros_tests' : 'platform_tests',
  },
];

function runGit(args: string[]): string {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function candidateFiles(): string[] {
  const all = process.argv.includes('--all');
  const baseIndex = process.argv.indexOf('--base');
  const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : undefined;
  const output =
    all || !base
      ? runGit(['ls-files'])
      : runGit(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`, '--']);
  return output
    .split(/\r?\n/)
    .map((path) => path.trim())
    .filter((path) => path.length > 0 && SCANNED_EXTENSIONS.has(extname(path)));
}

function parseAllowlist(): Set<string> {
  const entries = new Set<string>();
  if (!existsSync(ALLOWLIST_PATH)) return entries;
  for (const raw of readFileSync(ALLOWLIST_PATH, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [target, reason] = line.split(/\s+#\s+reason:\s*/i);
    if (!target || !reason?.trim()) {
      throw new Error(`.truth-allowlist entry requires "# reason:": ${line}`);
    }
    entries.add(target.trim().replaceAll('\\', '/'));
  }
  return entries;
}

function numericValue(value: number | string | boolean | null): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const single = /^(\d+)$/.exec(value.replaceAll(',', ''));
  return single ? Number(single[1]) : null;
}

function lineContainsLiteral(line: string, literal: string): boolean {
  const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\d,])${escaped}(?![\\d,])`).test(line);
}

function vocabularyFinding(line: string): string | null {
  if (/\b(?:holographic|customer-facing|policy(?:-gate)?|organ)\s+surfaces?\b/i.test(line)) {
    return 'ambiguous surface vocabulary; use lab module, product surface, policy gate, or runtime organ';
  }
  if (
    /\b\d+\s+surfaces?\b/i.test(line) &&
    /\b(?:customer|product|vertical|holographic|policy|organ|public)\b/i.test(line) &&
    !/\b\d+\s+product\s+surfaces?\b/i.test(line)
  ) {
    return 'numeric surface claim must name the product-surface metric explicitly';
  }
  return null;
}

function main(): void {
  if (!existsSync(TRUTH_PATH)) {
    writeError('artifacts/SOURCE_OF_TRUTH.json is missing.');
    process.exit(1);
  }
  const truth = JSON.parse(readFileSync(TRUTH_PATH, 'utf8')) as {
    metrics: Record<string, Metric>;
  };
  const allowlist = parseAllowlist();
  const findings: string[] = [];
  let unavailable = 0;

  for (const path of candidateFiles()) {
    const absolute = resolve(ROOT, path);
    if (!existsSync(absolute)) continue;
    const normalized = relative(ROOT, absolute).replaceAll('\\', '/');
    const lines = readFileSync(absolute, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const key = `${normalized}:${index + 1}`;
      if (allowlist.has(key) || allowlist.has(normalized)) return;

      const vocabulary = vocabularyFinding(line);
      if (vocabulary) findings.push(`${key}: ${vocabulary}`);

      for (const rule of RULES) {
        if (!rule.words.test(line)) continue;
        if (rule.context && !rule.context.test(line)) continue;
        const metricName =
          typeof rule.metric === 'function' ? rule.metric(normalized, line) : rule.metric;
        const current = truth.metrics[metricName];
        const correct = current ? numericValue(current.value) : null;
        if (!current || current.label === 'UNAVAILABLE' || correct === null) {
          unavailable += 1;
          continue;
        }
        for (const literal of rule.literals) {
          if (!lineContainsLiteral(line, literal)) continue;
          const observed = Number(literal.replaceAll(',', ''));
          if (observed === correct) continue;
          findings.push(
            `${key}: stale ${rule.name} ${literal}; current ${metricName}=${correct} (${current.label}, ${current.source})`,
          );
        }
      }
    });
  }

  if (unavailable > 0) {
    writeError(
      `Skipped ${unavailable} candidate comparison(s) whose canonical metric is UNAVAILABLE.`,
    );
  }
  if (findings.length > 0) {
    writeError(`Claim drift detected (${findings.length}):`);
    for (const finding of findings) writeError(`  - ${finding}`);
    process.exit(1);
  }
  writeOut('No claim drift detected in the scanned files.');
}

main();
