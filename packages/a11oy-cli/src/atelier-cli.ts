#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import {
  type AtelierProofweaveRequest,
  verifyAtelierProofweaveResponse,
} from '@szl-holdings/a11oy-atelier/proofweave-verifier';
import { Command, InvalidArgumentError } from 'commander';
import fetch from 'node-fetch';

const program = new Command();
const baseUrl = (process.env.A11OY_ATELIER_API_BASE_URL ?? 'http://127.0.0.1:8080').replace(
  /\/$/,
  '',
);
const apiKey = process.env.A11OY_API_KEY ?? process.env.ALLOY_API_KEY ?? '';
const defaultTenant = process.env.A11OY_ATELIER_TENANT_ID ?? 'default';
const REQUEST_TIMEOUT_MS = 30_000;

type ProofweaveClaimKind = 'FACT' | 'INFERENCE' | 'RECOMMENDATION';

interface TypedClaim {
  kind: ProofweaveClaimKind;
  statement: string;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI CSI escapes are untrusted terminal control data.
const ANSI_ESCAPE = /\u001B\[[0-?]*[ -/]*[@-~]/g;

function sanitizeTerminal(value: string): string {
  return [...value.replace(ANSI_ESCAPE, '')]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join('');
}

function collectTypedClaim(value: string, previous: TypedClaim[] = []): TypedClaim[] {
  if (previous.length >= 12) {
    throw new InvalidArgumentError('At most 12 claims may be declared.');
  }
  const separator = value.indexOf(':');
  const kind = value.slice(0, separator).trim().toUpperCase();
  const statement = value.slice(separator + 1).trim();
  if (
    separator <= 0 ||
    !['FACT', 'INFERENCE', 'RECOMMENDATION'].includes(kind) ||
    statement.length === 0
  ) {
    throw new InvalidArgumentError(
      'Claims must use KIND:statement where KIND is FACT, INFERENCE, or RECOMMENDATION.',
    );
  }
  return [...previous, { kind: kind as ProofweaveClaimKind, statement }];
}

function parseIntegerInRange(
  value: string,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!/^\d+$/.test(value)) {
    throw new InvalidArgumentError(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new InvalidArgumentError(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
  return parsed;
}

function parseCost(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new InvalidArgumentError('Maximum cost must be a finite number from 0 to 100.');
  }
  return parsed;
}

function parseOutputFormat(value: string): 'BRIEF' | 'TECHNICAL_REPORT' | 'DECISION_MEMO' {
  const format = value.toUpperCase();
  if (!['BRIEF', 'TECHNICAL_REPORT', 'DECISION_MEMO'].includes(format)) {
    throw new InvalidArgumentError('Format must be BRIEF, TECHNICAL_REPORT, or DECISION_MEMO.');
  }
  return format as 'BRIEF' | 'TECHNICAL_REPORT' | 'DECISION_MEMO';
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function receiptValue(value: unknown, fallback: string): string {
  if (typeof value === 'string') return sanitizeTerminal(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  return fallback;
}

async function request(
  path: string,
  init: { method?: string; body?: unknown; tenant?: string; idempotencyKey?: string } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? 'GET',
    redirect: 'manual',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Tenant-Id': init.tenant ?? defaultTenant,
      ...(init.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = (await response
    .json()
    .catch(() => ({ error: 'Invalid JSON response' }))) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.error === 'string' ? payload.error : `HTTP ${response.status}`;
    throw new Error(`${message} [${String(payload.code ?? 'ATELIER_HTTP_ERROR')}]`);
  }
  return payload;
}

program
  .name('a11oy-atelier')
  .description('A11oy Atelier — evidence-bound intelligence')
  .version('0.1.0');

program
  .command('ask')
  .description('ask through A11oy policy, memory, provider disclosure, and receipts')
  .argument('<prompt...>', 'prompt text')
  .option('--provider <provider>', 'auto, xai, or grok-build', 'auto')
  .option('--model <model>', 'provider model')
  .option('--session <id>', 'continue a tenant-scoped session')
  .option('--idempotency-key <key>', 'reuse a request safely without another provider call')
  .option('--tenant <id>', 'tenant ID', defaultTenant)
  .option('--reasoning-effort <effort>', 'low, medium, high, or xhigh', 'medium')
  .option('--json', 'print the complete response receipt')
  .action(async (promptParts: string[], options) => {
    const idempotencyKey = options.idempotencyKey ?? randomUUID();
    const sessionId = options.session ?? randomUUID();
    try {
      const payload = await request('/api/a11oy/v1/atelier/ask', {
        method: 'POST',
        tenant: options.tenant,
        idempotencyKey,
        body: {
          prompt: promptParts.join(' '),
          provider: options.provider,
          reasoningEffort: options.reasoningEffort,
          ...(options.model ? { model: options.model } : {}),
          sessionId,
          idempotencyKey,
        },
      });
      if (options.json) {
        process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
        return;
      }
      const answer = typeof payload.answer === 'string' ? sanitizeTerminal(payload.answer) : '';
      const disclosure =
        typeof payload.disclosure === 'string' ? sanitizeTerminal(payload.disclosure) : '';
      const receipt = (payload.receipt ?? {}) as Record<string, unknown>;
      process.stdout.write(`${answer}\n\n${disclosure}\n`);
      process.stdout.write(
        `Receipt ${receiptValue(receipt.receiptId, 'unavailable')} | ${receiptValue(receipt.provider, 'unknown')}/${receiptValue(receipt.model, 'unknown')} | ${receiptValue(receipt.evidenceState, 'UNKNOWN')}\n`,
      );
      process.stdout.write(
        `Session ${receiptValue(receipt.sessionId, sessionId)} | Turn ${receiptValue(receipt.sequence, 'unavailable')} | capsule ${receiptValue(receipt.capsuleDigest, 'unavailable')} | ${receiptValue(receipt.persistenceState, 'UNAVAILABLE')}\n`,
      );
    } catch (error) {
      process.stderr.write(
        `A11oy Atelier error: ${sanitizeTerminal(error instanceof Error ? error.message : String(error))}\n`,
      );
      process.stderr.write(
        `Retry this exact request with --session ${receiptValue(sessionId, 'unavailable')} --idempotency-key ${receiptValue(idempotencyKey, 'unavailable')}\n`,
      );
      process.exitCode = 1;
    }
  });

program
  .command('doctor')
  .description('report provider configuration without charging an inference')
  .option('--tenant <id>', 'tenant ID', defaultTenant)
  .action(async (options) => {
    try {
      const payload = await request('/api/a11oy/v1/atelier/health', {
        tenant: options.tenant,
      });
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } catch (error) {
      process.stderr.write(
        `A11oy Atelier doctor failed: ${sanitizeTerminal(error instanceof Error ? error.message : String(error))}\n`,
      );
      process.exitCode = 1;
    }
  });

program
  .command('weave')
  .description('compile a deterministic Proofweave research plan without executing it')
  .argument('<objective...>', 'research or decision objective')
  .requiredOption(
    '--claim <kind:statement>',
    'typed claim; FACT, INFERENCE, or RECOMMENDATION; repeatable up to 12',
    collectTypedClaim,
  )
  .option('--tenant <id>', 'tenant ID', defaultTenant)
  .option(
    '--allow-web',
    'declare a read-only web capability request; compilation performs no fetch',
    false,
  )
  .option(
    '--allow-github',
    'declare a read-only GitHub capability request; compilation performs no fetch',
    false,
  )
  .option(
    '--max-workcells <count>',
    'future-execution budget ceiling; compilation creates or runs no Workcells (5-8)',
    (value) => parseIntegerInRange(value, 5, 8, 'Maximum Workcells'),
    5,
  )
  .option(
    '--max-provider-calls <count>',
    'maximum provider calls in a future execution',
    (value) => parseIntegerInRange(value, 0, 12, 'Maximum provider calls'),
    6,
  )
  .option(
    '--max-source-fetches <count>',
    'maximum source fetches in a future execution',
    (value) => parseIntegerInRange(value, 0, 40, 'Maximum source fetches'),
    16,
  )
  .option(
    '--max-total-tokens <count>',
    'maximum token budget for a future execution (1024-200000)',
    (value) => parseIntegerInRange(value, 1_024, 200_000, 'Maximum total tokens'),
    50_000,
  )
  .option('--max-cost-usd <amount>', 'maximum estimated future cost in USD (0-100)', parseCost, 5)
  .option(
    '--max-wall-time-ms <count>',
    'maximum wall time in milliseconds',
    (value) => parseIntegerInRange(value, 1_000, 900_000, 'Maximum wall time'),
    300_000,
  )
  .option(
    '--format <format>',
    'BRIEF, TECHNICAL_REPORT, or DECISION_MEMO',
    parseOutputFormat,
    'TECHNICAL_REPORT',
  )
  .option('--json', 'print the complete compiled plan')
  .action(async (objectiveParts: string[], options) => {
    try {
      const objective = objectiveParts.join(' ').trim();
      if (objective.length === 0) {
        throw new InvalidArgumentError('Objective must not be empty.');
      }
      const claims = options.claim as TypedClaim[];
      const compileRequest: AtelierProofweaveRequest = {
        objective,
        claims: claims.map((claim, index) => ({
          claimId: `claim-${String(index + 1)}`,
          statement: claim.statement,
          kind: claim.kind,
        })),
        materials: [],
        budget: {
          maxWorkcells: options.maxWorkcells,
          maxProviderCalls: options.maxProviderCalls,
          maxSourceFetches: options.maxSourceFetches,
          maxTotalTokens: options.maxTotalTokens,
          maxEstimatedCostUsd: options.maxCostUsd,
          maxWallTimeMs: options.maxWallTimeMs,
        },
        requestedCapabilities: {
          readWeb: options.allowWeb,
          readGitHub: options.allowGithub,
          externalWrites: false,
          providerNativeSubagents: false,
          providerDurableStorage: false,
        },
        outputFormat: options.format,
      };
      const payload = await request('/api/a11oy/v1/atelier/proofweave/compile', {
        method: 'POST',
        tenant: options.tenant,
        body: compileRequest,
      });
      const proofweave = await verifyAtelierProofweaveResponse(payload, {
        request: compileRequest,
        tenantId: options.tenant,
      });
      if (options.json) {
        process.stdout.write(`${JSON.stringify(proofweave, null, 2)}\n`);
        return;
      }
      const stages = Array.isArray(proofweave.stages)
        ? proofweave.stages
            .map((stage) =>
              typeof stage === 'object' && stage !== null && 'name' in stage
                ? String((stage as Record<string, unknown>).name)
                : 'UNKNOWN',
            )
            .join(' -> ')
        : 'UNAVAILABLE';
      const ledger = record(proofweave.ledger);
      const review = record(proofweave.review);
      process.stdout.write(
        `Proofweave ${sanitizeTerminal(String(proofweave.weaveId ?? 'unavailable'))}\n`,
      );
      process.stdout.write(
        sanitizeTerminal(String(proofweave.evidenceClass ?? 'UNKNOWN')) +
          ' | ' +
          sanitizeTerminal(String(proofweave.operationalState ?? 'UNKNOWN')) +
          ' | ' +
          sanitizeTerminal(String(proofweave.executionState ?? 'UNKNOWN')) +
          ' | ' +
          sanitizeTerminal(String(proofweave.persistenceState ?? 'UNKNOWN')) +
          '\n',
      );
      process.stdout.write(
        `Plan ${sanitizeTerminal(String(proofweave.planSha256 ?? 'unavailable'))}\n`,
      );
      process.stdout.write(`${sanitizeTerminal(stages)}\n`);
      process.stdout.write(
        'EVIDENCE LEDGER APPEND ' +
          sanitizeTerminal(String(ledger.appendState ?? 'UNAVAILABLE')) +
          ' · ' +
          sanitizeTerminal(String(ledger.entryId ?? 'UNAVAILABLE')) +
          ' · BACKEND ' +
          sanitizeTerminal(String(ledger.backendState ?? 'UNAVAILABLE')) +
          ' · DURABILITY ' +
          sanitizeTerminal(String(ledger.durablePersistenceEvidenceClass ?? 'UNKNOWN')) +
          '\n',
      );
      process.stdout.write(
        `TENANT ATTRIBUTION ${sanitizeTerminal(String(proofweave.tenantAttributionEvidenceClass ?? 'UNKNOWN'))}\n`,
      );
      process.stdout.write(
        'AUTOMATED REVIEW ' +
          sanitizeTerminal(String(review.reviewState ?? 'UNAVAILABLE')) +
          ' · HUMAN APPROVAL ' +
          sanitizeTerminal(String(review.humanApprovalState ?? 'UNAVAILABLE')) +
          '\n',
      );
      process.stdout.write(
        'Compiled plan only: no model call, source fetch, plan-execution write, or provider subagent executed. The API separately dispatched audit metadata to a configuration-dependent EvidenceLedger backend.\n',
      );
    } catch (error) {
      process.stderr.write(
        'A11oy Proofweave error: ' +
          sanitizeTerminal(error instanceof Error ? error.message : String(error)) +
          '\n',
      );
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((error) => {
  process.stderr.write(
    `A11oy Atelier fatal error: ${sanitizeTerminal(error instanceof Error ? error.message : String(error))}\n`,
  );
  process.exitCode = 1;
});
