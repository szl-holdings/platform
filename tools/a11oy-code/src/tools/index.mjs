// Tool registry. Each tool is a pure async function with a schema and an
// implementation. Tools are dispatched through `runTool(name, args)` so the
// agent loop never reaches in directly. Implementations are deliberately
// modest in scope — read-first by default, mutations confined to the working
// directory tree, shell limited to a configurable allowlist.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, statSync, readdirSync, realpathSync, existsSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { proof } from '../proof.mjs';

const exec = promisify(execFile);

// Strict allowlist: only read-only, single-purpose binaries. General-purpose
// interpreters (node, python, deno, bash, sh, ruby, perl, php) and package
// managers (npm, pnpm, yarn, pip) are deliberately excluded — they would
// turn `shell` into an arbitrary-code-execution lever and bypass the file
// sandbox enforced by `safeJoin`. Test runners and build tools should be
// invoked by the operator, not by the agent.
const SHELL_ALLOWLIST = new Set([
  'ls', 'cat', 'head', 'tail', 'wc', 'echo', 'pwd', 'rg',
]);

// `git` is dispatched through its own dedicated tool with a subcommand
// allowlist; it is intentionally NOT in SHELL_ALLOWLIST so dangerous git
// invocations cannot be smuggled in via `shell`.

// Per-binary argument validators. A command is rejected unless its binary is
// in the allowlist AND its arguments pass the validator (or no validator is
// registered, in which case any args are allowed). This blocks `rg --exec`
// and similar arbitrary-execution flags.
const SHELL_ARG_DENY = {
  rg:  (args) => args.some((a) => /^(--exec|--pre|--search-zip|--no-config|--files-with-matches=)/.test(a)) ? `rg flag not allowed: ${args.find((a) => /^(--exec|--pre|--search-zip)/.test(a))}` : null,
  ls:  () => null,
  cat: () => null,
  head: () => null,
  tail: () => null,
  wc: () => null,
  echo: () => null,
  pwd: () => null,
};

function validateShell(bin, args) {
  if (!SHELL_ALLOWLIST.has(bin)) return `not in allowlist: ${bin}`;
  // Reject any argument that contains shell metacharacters even though
  // execFile does not invoke a shell — defense in depth.
  for (const a of args) {
    if (/[;&|`$<>\n]/.test(a)) return `argument contains shell metacharacter: ${a}`;
  }
  // Reject path arguments that escape the working directory.
  for (const a of args) {
    if (a.startsWith('-')) continue;
    if (a.includes('/') || a === '..') {
      try { safeJoin(a); }
      catch (e) { return String(e?.message || e); }
    }
  }
  const v = SHELL_ARG_DENY[bin];
  return v ? v(args) : null;
}

// Sandbox containment: every path must resolve inside the realpath of the
// working directory. We reject:
//   - paths whose lexical resolve escapes cwd (e.g. "../../etc/passwd")
//   - paths that resolve to a symlink whose target leaves cwd
//   - paths whose nearest existing ancestor's realpath leaves cwd (covers the
//     case where the leaf does not exist yet but a parent is a symlink)
function safeJoin(p) {
  const rootReal = realpathSync(process.cwd());
  if (!p || p === '.') return rootReal;
  const abs = resolve(rootReal, p);
  const rootWithSep = rootReal.endsWith('/') ? rootReal : rootReal + '/';
  const lexicalOk = abs === rootReal || abs.startsWith(rootWithSep);
  if (!lexicalOk) throw new Error(`path escapes working directory: ${p}`);

  // Walk to the nearest existing ancestor and compare its realpath.
  let probe = abs;
  while (probe !== dirname(probe) && !existsSync(probe)) probe = dirname(probe);
  let probeReal;
  try { probeReal = realpathSync(probe); }
  catch (_) { throw new Error(`path could not be resolved: ${p}`); }
  const probeOk = probeReal === rootReal || probeReal.startsWith(rootWithSep);
  if (!probeOk) throw new Error(`path escapes working directory via symlink: ${p}`);

  // If the leaf itself exists, also realpath it (catches symlink leaves).
  if (existsSync(abs)) {
    const leafReal = realpathSync(abs);
    if (leafReal !== rootReal && !leafReal.startsWith(rootWithSep)) {
      throw new Error(`path escapes working directory via symlink: ${p}`);
    }
    // Refuse to follow non-symlink? No — symlinks pointing inside cwd are fine.
    void lstatSync(abs);
  }
  return abs;
}

export const TOOLS = [
  {
    name: 'read',
    description: 'read a file or list a directory',
    async run({ path }) {
      const target = safeJoin(path);
      const st = statSync(target);
      if (st.isDirectory()) return { ok: true, kind: 'dir', entries: readdirSync(target).slice(0, 200) };
      return { ok: true, kind: 'file', content: readFileSync(target, 'utf8').slice(0, 64 * 1024) };
    },
  },
  {
    name: 'write',
    description: 'overwrite a file with new contents',
    async run({ path, content }) {
      writeFileSync(safeJoin(path), content ?? '');
      return { ok: true, bytes: (content ?? '').length };
    },
  },
  {
    name: 'edit',
    description: 'replace one occurrence of old_string with new_string in a file',
    async run({ path, old_string, new_string }) {
      const target = safeJoin(path);
      const cur = readFileSync(target, 'utf8');
      if (old_string && !cur.includes(old_string)) return { ok: false, error: 'old_string not found' };
      const next = old_string ? cur.replace(old_string, new_string ?? '') : cur;
      writeFileSync(target, next);
      return { ok: true, bytes: next.length };
    },
  },
  {
    name: 'shell',
    description: 'run an allowlisted, read-only shell command (no interpreters, no pipes, no redirects, no path escape)',
    async run({ cmd }) {
      const [bin, ...args] = (cmd || '').split(' ').filter(Boolean);
      const reason = validateShell(bin, args);
      if (reason) return { ok: false, error: reason };
      try {
        const { stdout, stderr } = await exec(bin, args, { timeout: 30_000, maxBuffer: 1024 * 1024, cwd: process.cwd() });
        return { ok: true, stdout: stdout.slice(0, 32_000), stderr: stderr.slice(0, 8_000) };
      } catch (e) {
        return { ok: false, error: String(e?.message || e) };
      }
    },
  },
  {
    name: 'git',
    description: 'read-only git subcommand: status, log, diff, show',
    async run({ sub = 'status', args = [] }) {
      const allowed = new Set(['status', 'log', 'diff', 'show', 'branch', 'rev-parse']);
      if (!allowed.has(sub)) return { ok: false, error: `git ${sub} not allowed` };
      try {
        const { stdout } = await exec('git', [sub, ...args], { timeout: 15_000, maxBuffer: 1024 * 1024 });
        return { ok: true, stdout: stdout.slice(0, 32_000) };
      } catch (e) { return { ok: false, error: String(e?.message || e) }; }
    },
  },
  {
    name: 'web_search',
    description: 'governed web search (no-op stub in offline mode)',
    async run({ q }) { return { ok: true, q, results: [], note: 'offline stub — wire WEB_SEARCH_API_KEY to enable' }; },
  },
  {
    name: 'hf_search',
    description: 'Hugging Face hub search (no-op stub in offline mode)',
    async run({ q }) { return { ok: true, q, results: [], note: 'offline stub — set HF_TOKEN to enable' }; },
  },
  {
    name: 'thesis_lookup',
    description: 'lookup an entry in the thesis corpus',
    async run({ q }) { return { ok: true, q, hits: [{ title: 'Ouroboros (v6)', section: 'self-revision' }] }; },
  },
  {
    name: 'formula_lookup',
    description: 'lookup a canonical formula',
    async run({ q }) { return { ok: true, q, hits: ['lutarInvariant5', 'mirrorEval', 'ouroboros'] }; },
  },
  {
    name: 'proof_query',
    description: 'query the local proof ledger',
    async run({ session, kind, limit }) { return { ok: true, entries: proof.read({ session, kind, limit }) }; },
  },
  {
    name: 'subagent',
    description: 'spawn a sub-agent for a focused task',
    async run({ task }) { return { ok: true, task, note: 'sub-agent stub — wire to lib/a11oy-agent for full execution' }; },
  },
  {
    name: 'finish',
    description: 'declare the goal complete',
    async run() { return { ok: true, done: true }; },
  },
];

export async function runTool(name, args, ctx = {}) {
  const t = TOOLS.find((x) => x.name === name);
  if (!t) return { ok: false, error: `unknown tool: ${name}` };
  try {
    return await t.run(args || {}, ctx);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}
