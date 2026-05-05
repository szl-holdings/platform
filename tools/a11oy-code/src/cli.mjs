// Command-line surface for a11oy-code.
// Subcommands:
//   (none)            — interactive REPL (default), or one-shot if a prompt is given
//   evolve disable    — flip the global kill-switch
//   evolve enable     — clear the global kill-switch
//   evolve revert     — revert last N safe-class auto-applies
//   evolve status     — show evolution state
//   tools list        — list registered tools
//   --version         — print version
//   --help            — print help

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startRepl, runOneShot } from './agent.mjs';
import * as evolveStore from './evolve/store.mjs';
import { TOOLS } from './tools/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

function parseArgs(argv) {
  const opts = { provider: null, model: null, json: false, autonomy: true, telemetry: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--version' || a === '-v') opts.version = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--no-autonomy') opts.autonomy = false;
    else if (a === '--telemetry') opts.telemetry = true;
    else if (a === '--provider') opts.provider = argv[++i];
    else if (a === '--model') opts.model = argv[++i];
    else if (a === '--last') opts.last = Number(argv[++i]);
    else positional.push(a);
  }
  return { opts, positional };
}

function printHelp() {
  console.log(`a11oy-code v${PKG.version}

Terminal-native, governed, self-evolving agentic coding tool.

Usage:
  a11oy-code                            start interactive REPL
  a11oy-code "<prompt>"                 one-shot
  a11oy-code evolve <disable|enable|status|revert --last N>
  a11oy-code tools list

Flags:
  --provider <name>    pin model provider (anthropic|openai|gemini|kimi|hf)
  --model <id>         pin a specific model id
  --json               JSON output (for scripting / CI)
  --no-autonomy        disable bounded autonomous self-evolution for this session
  --telemetry          opt-in anonymized session telemetry (off by default)
  --version, -v        print version
  --help, -h           print this help

Docs:
  ${PKG.homepage}
`);
}

export async function run(argv) {
  const { opts, positional } = parseArgs(argv);
  if (opts.version) { console.log(PKG.version); return; }
  if (opts.help)    { printHelp(); return; }

  const [cmd, sub] = positional;

  if (cmd === 'evolve') {
    if (sub === 'disable')      return void evolveStore.setKillSwitch(true,  console.log);
    if (sub === 'enable')       return void evolveStore.setKillSwitch(false, console.log);
    if (sub === 'status')       return void console.log(JSON.stringify(evolveStore.status(), null, 2));
    if (sub === 'revert') {
      const n = Number.isFinite(opts.last) ? opts.last : 1;
      const reverted = evolveStore.revertLast(n);
      console.log(`reverted ${reverted.length} auto-apply(ies):`);
      for (const r of reverted) console.log(`  - ${r.id} (${r.kind})`);
      return;
    }
    console.error(`unknown evolve subcommand: ${sub}`);
    process.exit(2);
  }

  if (cmd === 'tools' && sub === 'list') {
    for (const t of TOOLS) console.log(`${t.name.padEnd(18)} ${t.description}`);
    return;
  }

  // Default: REPL or one-shot.
  if (positional.length > 0) {
    return runOneShot(positional.join(' '), opts);
  }
  return startRepl(opts);
}
