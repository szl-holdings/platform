/**
 * Eval Submission CLI
 *
 * Scaffolds an .eval_results/<entity-id>.yaml file, validates it against the
 * shared EvalResultsYamlSchema, and optionally submits it to the platform
 * Eval Registry API (or opens a community PR via GitHub).
 *
 * Usage:
 *   # Scaffold a new results file
 *   pnpm eval-submit scaffold --entity-id my-agent-v1 --domain maritime
 *
 *   # Validate an existing file
 *   pnpm eval-submit validate --file .eval_results/my-agent-v1.yaml
 *
 *   # Submit to the registry API
 *   pnpm eval-submit submit --file .eval_results/my-agent-v1.yaml --api-url https://...
 *
 *   # Open a community PR
 *   pnpm eval-submit pr --file .eval_results/my-agent-v1.yaml
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { EvalResultsYamlSchema } from '@szl-holdings/shared-contracts/eval-types';

const RESULTS_DIR = '.eval_results';

function slugify(s: string): string {
  // Cap input length to avoid polynomial-redos on pathological CLI args.
  const capped = s.length > 1024 ? s.slice(0, 1024) : s;
  // Build slug character-by-character (linear, no regex on raw input).
  let out = '';
  let lastDash = false;
  for (let i = 0; i < capped.length; i += 1) {
    const c = capped.charCodeAt(i);
    const isAlphaNum =
      (c >= 97 && c <= 122) || // a-z
      (c >= 65 && c <= 90)  || // A-Z
      (c >= 48 && c <= 57);    // 0-9
    if (isAlphaNum) {
      out += String.fromCharCode(c >= 65 && c <= 90 ? c + 32 : c);
      lastDash = false;
    } else if (!lastDash) {
      out += '-';
      lastDash = true;
    }
  }
  // Trim leading/trailing dashes (bounded).
  let start = 0;
  let end = out.length;
  while (start < end && out.charCodeAt(start) === 45) start += 1;
  while (end > start && out.charCodeAt(end - 1) === 45) end -= 1;
  return out.slice(start, end);
}

// ─── Scaffold ─────────────────────────────────────────────────────────────────

function scaffold(args: string[]): void {
  const entityId = getFlag(args, '--entity-id') ?? 'my-entity-v1';
  const entityLabel = getFlag(args, '--entity-label') ?? entityId;
  const entityType = getFlag(args, '--entity-type') ?? 'agent';
  const domain = getFlag(args, '--domain') ?? 'cross-platform';
  const benchmarkId = getFlag(args, '--benchmark-id') ?? 'maritime-threat-detection-v1';

  const filename = `${slugify(entityId)}.yaml`;
  const outPath = resolve(RESULTS_DIR, filename);

  // mkdir is idempotent with recursive (CodeQL js/file-system-race).
  mkdirSync(RESULTS_DIR, { recursive: true });

  const force = args.includes('--force');
  if (!force && existsSync(outPath)) {
    console.error(`File already exists: ${outPath}`);
    console.error('Use --force to overwrite.');
    process.exit(1);
  }

  const yaml = `# eval_results.yaml — Open Evaluation Layer
# Schema: @szl-holdings/shared-contracts/eval-types EvalResultsYamlSchema
version: "1"
entityId: "${entityId}"
entityLabel: "${entityLabel}"
entityType: "${entityType}"    # agent | model | workflow | intelligence-product | dataset | tool
domain: "${domain}"

results:
  - datasetId: "${benchmarkId}"
    taskId: "threat-detection"          # see benchmark spec for available taskIds
    metric: "accuracy"                  # primary metric name
    value: 0.92                         # numeric | boolean | string
    unit: ""                            # optional: "%" | "ms" | etc.
    higherIsBetter: true
    evaluationFramework: "szl-native"   # inspect-ai | math-arena | szl-native | custom | ...
    # verifyToken: ""                   # uncomment to enable sandboxed re-run → verified badge
    date: "${new Date().toISOString().slice(0, 10)}"
    # sourceUrl: "https://..."          # optional: trace, paper, or report URL
    notes: |
      Describe the evaluation setup, model config, and any caveats here.
    tags:
      - ${domain}
`;

  // Use atomic create/replace: 'wx' fails if exists (no TOCTOU window), 'w'
  // only when --force is passed.
  writeFileSync(outPath, yaml, { encoding: 'utf8', flag: force ? 'w' : 'wx' });
  console.log(`\n✅  Scaffolded: ${outPath}`);
  console.log('\nNext steps:');
  console.log(`  1. Edit ${outPath} with your actual results`);
  console.log(`  2. pnpm eval-submit validate --file ${outPath}`);
  console.log(`  3. pnpm eval-submit submit --file ${outPath}  (or --pr for community PR)`);
}

// ─── Validate ─────────────────────────────────────────────────────────────────

async function validate(args: string[]): Promise<void> {
  const filePath = getFlag(args, '--file');
  if (!filePath) {
    console.error('Error: --file is required');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const raw = readFileSync(absPath, 'utf8');

  let parsed: Record<string, unknown>;
  try {
    const { parse } = await import('yaml');
    parsed = parse(raw) as Record<string, unknown>;
  } catch (err) {
    console.error('YAML parse error:', err);
    process.exit(1);
  }

  const result = EvalResultsYamlSchema.safeParse(parsed);
  if (!result.success) {
    console.error('\n❌  Validation failed:\n');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')} — ${issue.message}`);
    }
    process.exit(1);
  }

  console.log('\n✅  Validation passed');
  console.log(`   Entity:  ${result.data.entityLabel} (${result.data.entityType})`);
  console.log(`   Domain:  ${result.data.domain}`);
  console.log(`   Results: ${result.data.results.length}`);
  for (const r of result.data.results) {
    console.log(
      `     · ${r.datasetId} / ${r.taskId} — ${r.metric}=${r.value}${r.unit ? ` ${r.unit}` : ''}`,
    );
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submit(args: string[]): Promise<void> {
  const filePath = getFlag(args, '--file');
  const apiUrl = getFlag(args, '--api-url') ?? process.env.SZL_API_URL;
  const apiKey = getFlag(args, '--api-key') ?? process.env.SZL_API_KEY;

  if (!filePath) {
    console.error('Error: --file is required');
    process.exit(1);
  }
  if (!apiUrl) {
    console.error('Error: --api-url or SZL_API_URL env var is required');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  const raw = readFileSync(absPath, 'utf8');

  const { parse } = await import('yaml');
  const parsed = parse(raw) as Record<string, unknown>;

  const validation = EvalResultsYamlSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('Validation failed — run `eval-submit validate` first');
    process.exit(1);
  }

  const endpoint = `${apiUrl.replace(/\/$/, '')}/eval-registry/results`;
  console.log(`\n→ Submitting to ${endpoint} …`);

  const resp = await globalThis.fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(validation.data),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error(`\n❌  Submission failed (${resp.status}):`, body);
    process.exit(1);
  }

  const body = await resp.json() as { inserted?: number; results?: unknown[] };
  console.log(`\n✅  Submitted ${body.inserted ?? 0} result(s)`);
}

// ─── PR ───────────────────────────────────────────────────────────────────────

async function openPr(args: string[]): Promise<void> {
  const filePath = getFlag(args, '--file');
  const apiUrl = getFlag(args, '--api-url') ?? process.env.SZL_API_URL;
  const apiKey = getFlag(args, '--api-key') ?? process.env.SZL_API_KEY;
  const description = getFlag(args, '--description');

  if (!filePath) {
    console.error('Error: --file is required');
    process.exit(1);
  }
  if (!apiUrl) {
    console.error('Error: --api-url or SZL_API_URL env var is required');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  const raw = readFileSync(absPath, 'utf8');

  const { parse } = await import('yaml');
  const parsed = parse(raw) as Record<string, unknown>;

  const validation = EvalResultsYamlSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('Validation failed — run `eval-submit validate` first');
    process.exit(1);
  }

  const endpoint = `${apiUrl.replace(/\/$/, '')}/eval-registry/submissions`;
  console.log(`\n→ Opening community PR via ${endpoint} …`);

  const resp = await globalThis.fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      yaml: validation.data,
      prDescription: description,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error(`\n❌  PR creation failed (${resp.status}):`, body);
    process.exit(1);
  }

  const body = await resp.json() as {
    submissionId?: string;
    branchName?: string;
    title?: string;
    message?: string;
  };
  console.log(`\n✅  Community PR created`);
  console.log(`   Submission ID: ${body.submissionId}`);
  console.log(`   Branch:        ${body.branchName}`);
  console.log(`   ${body.message ?? ''}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx >= args.length - 1) return undefined;
  return args[idx + 1];
}

function printHelp(): void {
  console.log(`
Eval Submission CLI — Open Evaluation Layer

Commands:
  scaffold   Scaffold a .eval_results/<entity-id>.yaml template
             --entity-id <id>       Entity identifier (slug)
             --entity-label <name>  Human display name
             --entity-type <type>   agent | model | workflow | ...
             --domain <domain>      Domain (maritime | legal | terra | ...)
             --benchmark-id <id>    Benchmark to reference
             --force                Overwrite existing file

  validate   Validate a results YAML file
             --file <path>          Path to .eval_results/*.yaml

  submit     Submit results to the registry API
             --file <path>          Path to .eval_results/*.yaml
             --api-url <url>        Registry API base URL (or SZL_API_URL)
             --api-key <key>        API key (or SZL_API_KEY)

  pr         Open a community PR for results
             --file <path>          Path to .eval_results/*.yaml
             --api-url <url>        Registry API base URL (or SZL_API_URL)
             --api-key <key>        API key (or SZL_API_KEY)
             --description <text>   PR description / motivation

Examples:
  pnpm eval-submit scaffold --entity-id maritime-agent-v3 --domain maritime
  pnpm eval-submit validate --file .eval_results/maritime-agent-v3.yaml
  pnpm eval-submit submit   --file .eval_results/maritime-agent-v3.yaml \\
                            --api-url https://api.szlholdings.com
  pnpm eval-submit pr       --file .eval_results/maritime-agent-v3.yaml \\
                            --description "Add Q1 2026 eval results for Maritime Agent v3"
`);
}

export async function runSubmitCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'scaffold':
      scaffold(args.slice(1));
      break;
    case 'validate':
      await validate(args.slice(1));
      break;
    case 'submit':
      await submit(args.slice(1));
      break;
    case 'pr':
      await openPr(args.slice(1));
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

// Allow direct invocation
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('submit-cli.ts') || process.argv[1].endsWith('submit-cli.js'))
) {
  runSubmitCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
