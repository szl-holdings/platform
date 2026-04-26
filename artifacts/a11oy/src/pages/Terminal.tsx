import { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle } from '../components/ui';
import { SEED_SIGNALS, SEED_WORKCELLS, SEED_OUTCOMES, SEED_TOOLS } from '@workspace/a11oy-fabric';

interface TermLine {
  kind: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const WELCOME: TermLine[] = [
  { kind: 'system', text: '┌──────────────────────────────────────────────────────────────┐' },
  { kind: 'system', text: '│  A11oy Terminal CLI  ·  v0.3.0  ·  DEMO MODE                 │' },
  { kind: 'system', text: '│  No real agents, no real connectors, no real executions.     │' },
  { kind: 'system', text: '│  Type  help  to see available commands.                      │' },
  { kind: 'system', text: '└──────────────────────────────────────────────────────────────┘' },
  { kind: 'system', text: '' },
];

const COMMANDS: Record<string, (args: string[]) => string[]> = {
  help: () => [
    'Available commands:',
    '  now          Show operational status',
    '  signals      List signals  [--severity critical|high|medium|low]',
    '  workcells    List workcells  [--status running|completed|error]',
    '  outcomes     List outcomes  [--status achieved|missed|blocked]',
    '  tools        List registered tools',
    '  proof        Show proof packets',
    '  agents       List agent operators',
    '  pce          Show PCE contract health',
    '  demo         Run a demo scenario',
    '  mcp          Show MCP server info',
    '  version      Show version',
    '  clear        Clear terminal',
    '',
    'All commands are read-only in demo mode.',
  ],
  version: () => ['A11oy Terminal CLI v0.3.0 (demo)', 'Fabric schema: 2.0.0', 'MCP server: mcp:a11oy-demo'],
  now: () => {
    const active = SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated');
    const critical = SEED_SIGNALS.filter(s => s.severity === 'critical');
    const pending = SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running');
    const failed = SEED_WORKCELLS.filter(w => w.status === 'error');
    return [
      '── Operational Status ─────────────────────────',
      `  LIVE_SIGNALS          ${String(active.length).padStart(4)}   (${critical.length} critical)`,
      `  PENDING_APPROVALS     ${String(pending.length).padStart(4)}   (human gate)`,
      `  FAILED_WORKCELLS      ${String(failed.length).padStart(4)}`,
      `  VERIFIED_ACTIONS        47   (last 24h)`,
      `  PROOF_COVERAGE          91%`,
      `  EXECUTION_VELOCITY   12.4/hr`,
      `  AGENT_TRUST_SCORE       94/100`,
      `  PCE_CONTRACT_HEALTH     96%`,
      `  MIRROREVAL_WARNINGS      ${SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'warn').length}`,
      `  FABRIC_HEALTH          99.2%`,
      '',
      `${active.length} signals active across 7 verticals.`,
    ];
  },
  signals: (args) => {
    const sevFilter = args[1] === '--severity' ? args[2] : null;
    let sigs = SEED_SIGNALS;
    if (sevFilter) sigs = sigs.filter(s => s.severity === sevFilter);
    return [
      `── Signals (${sigs.length}) ──────────────────────────────────`,
      ...sigs.slice(0, 12).map(s => `  [${s.severity.padEnd(8)}] ${s.id}  ${s.title.slice(0, 48)}`),
      sigs.length > 12 ? `  … and ${sigs.length - 12} more. Use --severity to filter.` : '',
    ].filter(l => l !== undefined);
  },
  workcells: (args) => {
    const stFilter = args[1] === '--status' ? args[2] : null;
    let wcs = SEED_WORKCELLS;
    if (stFilter) wcs = wcs.filter(w => w.status === stFilter);
    return [
      `── Workcells (${wcs.length}) ───────────────────────────────────`,
      ...wcs.map(w => `  [${w.status.padEnd(9)}] ${w.id.padEnd(18)} ${w.name.slice(0, 32)}`),
    ];
  },
  outcomes: (args) => {
    const stFilter = args[1] === '--status' ? args[2] : null;
    let ocs = SEED_OUTCOMES;
    if (stFilter) ocs = ocs.filter(o => o.status === stFilter);
    return [
      `── Outcomes (${ocs.length}) ────────────────────────────────────`,
      ...ocs.map(o => `  [${o.status.padEnd(9)}] ${o.id.padEnd(14)} ${o.title.slice(0, 40)}`),
    ];
  },
  tools: () => [
    `── Tools Registry (${SEED_TOOLS.length}) ─────────────────────────────`,
    ...SEED_TOOLS.map(t => `  [${'active'.padEnd(8)}] ${t.id.padEnd(18)} ${t.name.slice(0, 30)}`),
  ],
  proof: () => {
    return [
      '── Proof Packets ──────────────────────────────',
      '  sha256:c9f2e5b8a1d3e6f9b2c5…  Maritime  EXECUTION  ✓',
      '  sha256:e3a1d4f7b2c8e1a6d3f2…  Finance   DECISION   ✓',
      '  sha256:b8c3f9e2a4d1e7f3b6c2…  Defense   EXECUTION  ✓',
      '  sha256:a2d7e1f4b9c3e6a8d2f5…  Legal     APPROVAL   ✓',
      '  sha256:f1c6b3a8d5e2f7c1b4a9…  Revenue   POLICY     ✓',
      '',
      '5 entries · Chain integrity: 100%',
    ];
  },
  agents: () => [
    '── Agent Operators ────────────────────────────',
    '  [active  ] op-cascade   Cascade Navigator       vessels-maritime',
    '  [active  ] op-counsel   Counsel Sentinel        prism-counsel',
    '  [active  ] op-pipeline  Pipeline Oracle         lyte-revenue',
    '  [active  ] op-guardian  Guardian                aegis-defense',
    '  [active  ] op-terra     Terra Analyst           terra-real-estate',
    '  [active  ] op-watchdog  Fabric Watchdog         alloy-core',
  ],
  pce: () => {
    const health = SEED_WORKCELLS.filter(w => w.verificationResult.status === 'passed').length;
    return [
      '── PCE Contract Health ────────────────────────',
      `  Total contracts:     20`,
      `  Verified:            ${health}`,
      `  Health score:        ${Math.round((health / SEED_WORKCELLS.length) * 100)}%`,
      '',
      '  All material actions governed by PCE contracts.',
    ];
  },
  demo: () => [
    '── Demo Scenario ──────────────────────────────',
    '  [RUNNING] Maritime Port Congestion Response',
    '  Step 1/5: ETA deviation detected (sig-vessels-001)',
    '  Step 2/5: Port standby cost model computed',
    '  Step 3/5: MirrorEval: pass (score 94%)',
    '  Step 4/5: PCE contract gate: awaiting VP approval',
    '  Step 5/5: [PENDING] Human approval required',
    '',
    '  ⚬ No action executes without human approval.',
  ],
  mcp: () => [
    '── MCP Server ─────────────────────────────────',
    '  Transport:  stdio',
    '  Name:       a11oy-demo-mcp',
    '  Version:    0.3.0',
    '',
    '  Exposed tools:',
    '    a11oy_now          → fabric status',
    '    a11oy_signals      → list signals',
    '    a11oy_workcells    → list workcells',
    '    a11oy_outcomes     → list outcomes',
    '    a11oy_proof        → proof ledger',
    '    a11oy_pce_health   → PCE contract health',
    '',
    '  Demo mode — no real agent calls.',
  ],
};

const SUGGESTIONS = ['help', 'now', 'signals', 'signals --severity critical', 'workcells', 'workcells --status running', 'outcomes', 'tools', 'proof', 'agents', 'pce', 'demo', 'mcp'];

export function Terminal() {
  const [lines, setLines] = useState<TermLine[]>(WELCOME);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    const newLines: TermLine[] = [...lines, { kind: 'input', text: `a11oy> ${trimmed}` }];
    if (trimmed === 'clear') { setLines(WELCOME); return; }
    const parts = trimmed.toLowerCase().split(' ');
    const handler = COMMANDS[parts[0]];
    if (handler) {
      const out = handler(parts);
      out.forEach(t => newLines.push({ kind: 'output', text: t }));
    } else {
      newLines.push({ kind: 'error', text: `Command not found: ${parts[0]}. Type 'help' for available commands.` });
    }
    newLines.push({ kind: 'output', text: '' });
    setLines(newLines);
    setHistory(h => [trimmed, ...h.slice(0, 49)]);
    setHistoryIdx(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { runCommand(input); }
    if (e.key === 'ArrowUp') {
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? '');
      e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : history[idx] ?? '');
      e.preventDefault();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const match = SUGGESTIONS.find(s => s.startsWith(input));
      if (match) setInput(match);
    }
  };

  return (
    <Layout>
      <PageHeader
        label="A11OY TERMINAL"
        title="CLI Command Interface"
        subtitle="Interactive terminal for the A11oy fabric. Read-only in demo mode. Type help to begin."
        status="DEMO"
      />

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          {/* Terminal window */}
          <div
            className="rounded-lg border overflow-hidden cursor-text"
            style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: '#070c15' }}
            onClick={() => inputRef.current?.focus()}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ backgroundColor: '#0a1020', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f5f5f5' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#c9b787' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#c9b787' }} />
              <span className="text-xs font-mono ml-3" style={{ color: '#4d607a' }}>a11oy-terminal — DEMO</span>
            </div>
            {/* Output */}
            <div ref={termRef} className="p-4 overflow-y-auto font-mono text-xs" style={{ height: 480, whiteSpace: 'pre' }}>
              {lines.map((l, i) => (
                <div key={i} style={{ color: l.kind === 'input' ? '#c9b787' : l.kind === 'error' ? '#f5f5f5' : l.kind === 'system' ? '#4d607a' : '#5e5e5e', lineHeight: '1.6' }}>
                  {l.text}
                </div>
              ))}
              {/* Input line */}
              <div className="flex items-center gap-1 mt-1">
                <span style={{ color: '#c9b787' }}>a11oy&gt;</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none font-mono text-xs"
                  style={{ color: '#c9b787', caretColor: '#c9b787' }}
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="animate-pulse" style={{ color: '#c9b787' }}>█</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Suggestions */}
        <div className="flex flex-col gap-4">
          <div>
            <SectionTitle>Quick Commands</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-left text-xs px-2.5 py-1.5 rounded font-mono transition-colors"
                  style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Card className="text-xs">
            <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>KEYBOARD SHORTCUTS</div>
            <div className="flex flex-col gap-1">
              {[['Enter', 'Run command'], ['↑ / ↓', 'History'], ['Tab', 'Autocomplete']].map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="font-mono px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', whiteSpace: 'nowrap' }}>{k}</span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="text-xs">
            <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>INSTALL CLI</div>
            <div className="font-mono p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: '#c9b787', border: '1px solid var(--color-a11oy-border)' }}>
              npx @a11oy/cli@latest
            </div>
            <div className="mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>npm · packages/a11oy-cli</div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
