#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function resolvePython() {
  const fromEnv = process.env.PYTHON ?? process.env.PYTHON3;
  if (fromEnv) return fromEnv;
  const candidates = ['python3', 'python'];
  return candidates[0];
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('[run-python] Usage: run-python.mjs <script.py | -m module> [args...]');
    process.exit(2);
  }

  const resolved = args.map((arg, idx) => {
    if (idx > 0 && args[idx - 1] === '-m') return arg;
    if (arg.startsWith('-')) return arg;
    if (arg.endsWith('.py')) {
      const abs = path.isAbsolute(arg) ? arg : path.resolve(REPO_ROOT, arg);
      if (!existsSync(abs)) {
        console.error(`[run-python] Script not found: ${abs}`);
        process.exit(2);
      }
      return abs;
    }
    return arg;
  });

  const py = resolvePython();
  // Pin PYTHONPATH to REPO_ROOT only so vertical packs always import from this
  // checkout. Inherited PYTHONPATH from the surrounding shell is intentionally
  // discarded to keep substrate behaviour deterministic across environments.
  const env = {
    ...process.env,
    PYTHONPATH: REPO_ROOT,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
  };

  const child = spawn(py, resolved, {
    cwd: REPO_ROOT,
    env,
    stdio: 'inherit',
  });

  // Forward common termination signals to the child so Ctrl-C and orchestrator
  // shutdowns propagate cleanly instead of leaving an orphaned interpreter.
  const forward = (sig) => {
    if (!child.killed) {
      try {
        child.kill(sig);
      } catch {
        /* child already exited */
      }
    }
  };
  process.on('SIGINT', () => forward('SIGINT'));
  process.on('SIGTERM', () => forward('SIGTERM'));

  child.on('error', (err) => {
    console.error(`[run-python] Failed to spawn ${py}: ${err.message}`);
    process.exit(127);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`[run-python] Killed by signal ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });
}

main();
