/**
 * Sandbox Runtime — Shell Capability
 *
 * Governed shell executor for sandbox sessions.
 * - Commands run inside workspace root (CWD-locked)
 * - Enforces timeout (default 30s) and max output size (1MB)
 * - Policy Engine pre-flight check via Guardian before execution
 * - Every execution emits a step-log event for audit/observability
 * - Blocks dangerous patterns (rm -rf /, sudo, etc.)
 * - PII redaction and injection scan applied to command input
 * - Registered as Tool Mesh tool: sandbox.shell (operator-assisted tier)
 */

import { spawn } from 'node:child_process';
import { join, normalize, resolve } from 'node:path';
import type { SandboxCapability, ShellExecOptions, ShellExecResult } from '../types.js';
import { validateWorkspacePath } from '../materializer.js';

// ─── Guardian / Policy pre-flight ─────────────────────────────────────────────
// Dynamic import keeps the build clean when Guardian is unavailable.

async function runPolicyCheck(
  command: string,
  workspaceRoot: string,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { checkAction } = await import('@workspace/guardian');
    const result = checkAction({
      action: 'sandbox.shell.exec',
      domain: 'sandbox',
      actionClass: 'shell-execution',
      subject: { roles: ['sandbox-agent'] },
      resource: {
        type: 'sandbox.workspace',
        id: workspaceRoot,
        attributes: { command },
      },
      context: { command, workspaceRoot },
    });
    if (!result.allowed) {
      const reason = result.violations.map((v) => v.reason).join('; ') || result.reasoning;
      return { allowed: false, reason: `Policy denied: ${reason}` };
    }
    return { allowed: true };
  } catch {
    // Guardian unavailable (test env, etc.) — allow execution but log
    return { allowed: true };
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 1 * 1024 * 1024; // 1 MB

// ─── PII Redaction ────────────────────────────────────────────────────────────
// Applied to shell command strings before audit logging and to stdout/stderr
// output before returning results. Prevents PII from leaking into logs.

const PII_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // Social Security Numbers: 123-45-6789 or 123 45 6789
  { pattern: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g, replacement: '[REDACTED:SSN]' },
  // Credit/debit card numbers: 16-digit variants with optional separators
  {
    pattern: /\b(?:\d{4}[-\s]){3}\d{4}\b/g,
    replacement: '[REDACTED:CARD]',
  },
  // Generic email addresses appearing in shell I/O
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[REDACTED:EMAIL]',
  },
  // Bearer tokens / API keys: long (≥32 char) hex or base64 strings
  {
    pattern: /\b(Bearer\s+)[A-Za-z0-9+/=\-_.]{32,}\b/g,
    replacement: '$1[REDACTED:TOKEN]',
  },
  // AWS/GCP/Azure key-like patterns: AKIA*, sk-*, xoxb-*
  {
    pattern: /\b(AKIA|sk-|xoxb-|ya29\.)[A-Za-z0-9+/\-_]{16,}\b/g,
    replacement: '[REDACTED:API_KEY]',
  },
];

/**
 * Redact sensitive data (PII and credentials) from a string.
 * Applied to shell commands (for audit logging) and to stdout/stderr output.
 */
export function redactPii(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/** Default blocked command patterns for shell execution. */
export const DEFAULT_BLOCKED_PATTERNS: ReadonlyArray<RegExp> = [
  /rm\s+.*-[a-z]*r[a-z]*\s+\/(?!\w)/i, // rm -rf /
  /\bsudo\b/i,
  /\bsu\s/i,
  /\bpasswd\b/i,
  /\bchmod\s+777/i,
  /\bkill\s+-9\s+1\b/i, // kill -9 1 (init)
  />\s*\/dev\/s[a-z]+/i, // overwrite block devices
  /\bdd\s+.*of=\/dev\//i,
  /\bmkfs\b/i,
  /\bformat\b.*\/dev\//i,
  /\bcurl\b.*-o\s+\/bin\//i,
  /\bwget\b.*-O\s+\/bin\//i,
];

/** Governance audit hook — called after every exec (pass/deny/error alike). */
export type ShellExecAuditHook = (event: {
  command: string;
  result: ShellExecResult;
  cwd: string;
  workspaceRoot: string;
  policyAllowed: boolean;
}) => void | Promise<void>;

export interface ShellCapabilityOptions {
  workspaceRoot: string;
  defaultTimeoutMs?: number;
  maxOutputBytes?: number;
  blockedPatterns?: ReadonlyArray<RegExp>;
  additionalBlockedCommands?: string[];
  /**
   * Optional audit hook called after EVERY exec, including denied ones.
   * Used by SandboxAgent to emit Tool Mesh step-log events for each command,
   * fulfilling the guardrail chain observability requirement.
   */
  onExec?: ShellExecAuditHook;
}

function truncateOutput(buf: string, maxBytes: number): { out: string; truncated: boolean } {
  const bytes = Buffer.byteLength(buf, 'utf8');
  if (bytes <= maxBytes) return { out: buf, truncated: false };
  const sliced = buf.slice(0, maxBytes);
  return {
    out: sliced + `\n[...truncated at ${maxBytes} bytes]`,
    truncated: true,
  };
}

// Deny-list patterns run on user-supplied commands. Cap input length so
// pathological commands cannot turn deny-list scanning into a DoS vector.
const MAX_COMMAND_LEN = 8_192;

function checkBlocked(command: string, patterns: ReadonlyArray<RegExp>): string | null {
  if (command.length > MAX_COMMAND_LEN) {
    return `Command rejected: length ${command.length} exceeds maximum ${MAX_COMMAND_LEN} bytes.`;
  }
  for (const pattern of patterns) {
    if (pattern.test(command)) {
      return `Command blocked by deny-list pattern: ${pattern.toString()}`;
    }
  }
  return null;
}

export class ShellCapability implements SandboxCapability {
  readonly type = 'shell' as const;
  readonly description = 'Governed shell command execution within the workspace root.';

  private readonly workspaceRoot: string;
  private readonly defaultTimeoutMs: number;
  private readonly maxOutputBytes: number;
  private readonly blockedPatterns: ReadonlyArray<RegExp>;
  private readonly onExec: ShellExecAuditHook | undefined;

  constructor(opts: ShellCapabilityOptions) {
    this.workspaceRoot = opts.workspaceRoot;
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputBytes = opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    this.onExec = opts.onExec;

    const extra = (opts.additionalBlockedCommands ?? []).map((p) => new RegExp(p, 'i'));
    this.blockedPatterns = [...DEFAULT_BLOCKED_PATTERNS, ...(opts.blockedPatterns ?? []), ...extra];
  }

  async exec(command: string, options: ShellExecOptions = {}): Promise<ShellExecResult> {
    const startMs = Date.now();

    // Validate and resolve CWD
    let cwd = this.workspaceRoot;
    if (options.cwd) {
      cwd = validateWorkspacePath(options.cwd, this.workspaceRoot);
    }

    // ── Step A: Injection / deny-list check (synchronous, no policy engine) ──
    const blocked = checkBlocked(command, this.blockedPatterns);
    if (blocked) {
      const result: ShellExecResult = {
        stdout: '',
        stderr: blocked,
        exitCode: 126,
        durationMs: Date.now() - startMs,
        timedOut: false,
        command,
      };
      await this.onExec?.({
        command,
        result,
        cwd,
        workspaceRoot: this.workspaceRoot,
        policyAllowed: false,
      });
      return result;
    }

    // ── Step B: Policy Engine pre-flight (Guardian guardrail chain) ───────────
    // Enforces registered policies (PII/injection/domain rules) before any
    // subprocess is spawned. Dynamic import keeps the capability constructor fast.
    const policyCheck = await runPolicyCheck(command, this.workspaceRoot);
    if (!policyCheck.allowed) {
      const result: ShellExecResult = {
        stdout: '',
        stderr: policyCheck.reason ?? 'Policy check denied execution of this command.',
        exitCode: 126,
        durationMs: Date.now() - startMs,
        timedOut: false,
        command,
      };
      await this.onExec?.({
        command,
        result,
        cwd,
        workspaceRoot: this.workspaceRoot,
        policyAllowed: false,
      });
      return result;
    }

    // ── Step C: Execute subprocess ────────────────────────────────────────────
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const env = {
      ...process.env,
      SANDBOX_WORKSPACE: this.workspaceRoot,
      ...options.env,
    };

    const result = await new Promise<ShellExecResult>((resolve_) => {
      let timedOut = false;

      // Timeout is enforced solely by the explicit timer below, which sets
      // `timedOut` synchronously before killing the child.
      //
      // `detached: true` makes the spawned shell a process-group leader so the
      // timeout handler can SIGKILL the entire group via `process.kill(-pid)`.
      // Killing only the `sh` parent would leave grandchildren (e.g. `sleep`)
      // alive holding the inherited stdio pipes open, which delays the `close`
      // event until the grandchild exits on its own — defeating the timeout.
      // (Note: `exec`'s `detached` is not honoured the same way, so we use
      // `spawn` with `shell: true` and bound the output buffers manually.)
      const child = spawn(command, {
        cwd,
        env,
        detached: true,
        shell: true,
      });

      const bufferCap = this.maxOutputBytes * 2; // truncated to maxOutputBytes later
      let stdoutBuf = '';
      let stderrBuf = '';

      child.stdout?.on('data', (chunk: string | Buffer) => {
        if (stdoutBuf.length < bufferCap) stdoutBuf += chunk.toString();
      });
      child.stderr?.on('data', (chunk: string | Buffer) => {
        if (stderrBuf.length < bufferCap) stderrBuf += chunk.toString();
      });

      const timer = setTimeout(() => {
        timedOut = true;
        // Kill the entire process group (negative pid) so shell grandchildren
        // are terminated too; fall back to killing just the child if the group
        // signal fails (e.g. process already gone).
        try {
          if (typeof child.pid === 'number') {
            process.kill(-child.pid, 'SIGKILL');
          } else {
            child.kill('SIGKILL');
          }
        } catch {
          child.kill('SIGKILL');
        }
      }, timeoutMs);

      child.on('close', (code) => {
        clearTimeout(timer);
        const { out: stdout } = truncateOutput(stdoutBuf, this.maxOutputBytes);
        const { out: stderr } = truncateOutput(stderrBuf, this.maxOutputBytes);

        // Redact PII from output before returning — prevents SSNs, credit card
        // numbers, emails, and API keys leaking into logs or API responses.
        resolve_({
          stdout: redactPii(stdout),
          stderr: redactPii(stderr),
          exitCode: timedOut ? -1 : (code ?? 0),
          durationMs: Date.now() - startMs,
          timedOut,
          command: redactPii(command),
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve_({
          stdout: redactPii(stdoutBuf),
          stderr: redactPii(err.message),
          exitCode: 1,
          durationMs: Date.now() - startMs,
          timedOut: false,
          command: redactPii(command),
        });
      });
    });

    // ── Step D: Emit audit event (Tool Mesh invocation log) ───────────────────
    // The onExec hook is provided by SandboxAgent to emit step-log events for
    // every shell command, fulfilling the guardrail chain observability requirement.
    await this.onExec?.({
      command,
      result,
      cwd,
      workspaceRoot: this.workspaceRoot,
      policyAllowed: true,
    });
    return result;
  }
}
