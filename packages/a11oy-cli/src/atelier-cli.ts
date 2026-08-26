#!/usr/bin/env node
import { Command } from 'commander';
import fetch from 'node-fetch';

const program = new Command();
const baseUrl = (process.env.A11OY_ATELIER_API_BASE_URL ?? 'http://127.0.0.1:8080').replace(
  /\/$/,
  '',
);
const apiKey = process.env.A11OY_API_KEY ?? process.env.ALLOY_API_KEY ?? '';
const defaultTenant = process.env.A11OY_ATELIER_TENANT_ID ?? 'default';

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

async function request(
  path: string,
  init: { method?: string; body?: unknown; tenant?: string } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? 'GET',
    redirect: 'manual',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Tenant-Id': init.tenant ?? defaultTenant,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
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
  .option('--tenant <id>', 'tenant ID', defaultTenant)
  .option('--reasoning-effort <effort>', 'low, medium, or high', 'medium')
  .option('--json', 'print the complete response receipt')
  .action(async (promptParts: string[], options) => {
    try {
      const payload = await request('/api/a11oy/v1/atelier/ask', {
        method: 'POST',
        tenant: options.tenant,
        body: {
          prompt: promptParts.join(' '),
          provider: options.provider,
          reasoningEffort: options.reasoningEffort,
          ...(options.model ? { model: options.model } : {}),
          ...(options.session ? { sessionId: options.session } : {}),
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
        `Receipt ${String(receipt.receiptId ?? 'unavailable')} | ${String(receipt.provider ?? 'unknown')}/${String(receipt.model ?? 'unknown')} | ${String(receipt.evidenceState ?? 'UNKNOWN')}\n`,
      );
    } catch (error) {
      process.stderr.write(
        `A11oy Atelier error: ${sanitizeTerminal(error instanceof Error ? error.message : String(error))}\n`,
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
      const payload = await request('/api/a11oy/v1/atelier/health', { tenant: options.tenant });
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } catch (error) {
      process.stderr.write(
        `A11oy Atelier doctor failed: ${sanitizeTerminal(error instanceof Error ? error.message : String(error))}\n`,
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
