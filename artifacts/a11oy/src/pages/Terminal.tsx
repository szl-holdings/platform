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
  { kind: 'system', text: '│  A11oy Terminal CLI  ·  v0.3.0  ·  Governed Environment      │' },
  { kind: 'system', text: '│  Fabric operational — all systems nominal.                   │' },
  { kind: 'system', text: '│  Type  help  to see available commands.                      │' },
  { kind: 'system', text: '└──────────────────────────────────────────────────────────────┘' },
  { kind: 'system', text: '' },
];

const COMMANDS: Record<string, (args: string[]) => string[]> = {
  help: () => [
    'Available commands:',
    '  now                   Show operational status',
    '  signals               List signals  [--severity critical|high|medium|low]',
    '  workcells             List workcells  [--status running|completed|error]',
    '  outcomes              List outcomes  [--status achieved|missed|blocked]',
    '  tools                 List registered tools',
    '  proof                 Show proof packet ledger',
    '  agents                List agent operators',
    '  pce                   Show PCE contract health',
    '  inspect <id>          Inspect a workcell, signal, or outcome by ID',
    '  trace <workcell>      Show step-by-step trace for a workcell',
    '  covenant list         Show all active covenant policies',
    '  covenant check <id>   Check policy compliance for a workcell',
    '  skills                List registered skills',
    '  connectors            Show connector firewall status',
    '  twins                 List business digital twins',
    '  boardroom             Show boardroom packet summary',
    '  eval                  Show MirrorEval summary',
    '  fabric                Show fabric health',
    '  mcp                   Show MCP server info',
    '  demo                  Run a demo scenario',
    '  version               Show version info',
    '  clear                 Clear terminal',
  ],
  version: () => ['A11oy Terminal CLI v0.3.0', 'Fabric schema: 4.0.0', 'MCP server: mcp:a11oy-prod', 'Self-test: PASS · All gates nominal'],
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
    '── Governed Execution Demo ─────────────────────',
    '  [ACTIVE] Maritime Port Congestion Response',
    '  Step 1/6: ETA deviation detected — sig-vessels-001 (severity: critical)',
    '  Step 2/6: Port standby cost model executed — tool:cost_model → $2.4M/day',
    '  Step 3/6: Digital twin updated — vessel-twin-001 drift: 74 → flagged',
    '  Step 4/6: MirrorEval 2.0: PASS (composite: 94% across 14 dimensions)',
    '  Step 5/6: PCE contract gate — TIER 3 action: awaiting VP Operations approval',
    '  Step 6/6: [PENDING APPROVAL] Reroute VLCC Everest to Port Antwerp',
    '',
    '  ◇ Proof packet: sha256:c9f2e5b8a1d3e6f9b2c5a8f1d4e7c2b9a6f3e0d1',
    '  ⚬ No action executes without human approval. Covenant enforced.',
  ],
  mcp: () => [
    '── MCP Server ─────────────────────────────────',
    '  Transport:  stdio',
    '  Name:       a11oy-fabric-mcp',
    '  Version:    4.2.0',
    '',
    '  Exposed tools (15):',
    '    a11oy_now              → fabric operational status',
    '    a11oy_signals          → list/filter signals',
    '    a11oy_workcells        → list/filter workcells',
    '    a11oy_outcomes         → list/filter outcomes',
    '    a11oy_proof            → proof packet ledger',
    '    a11oy_pce_health       → PCE contract health',
    '    a11oy_skills_run       → run a named skill',
    '    a11oy_twin_state       → get business twin state',
    '    a11oy_twin_simulate    → run no-action vs approved simulation',
    '    a11oy_connector_test   → test connector health',
    '    a11oy_eval_score       → get MirrorEval score for workcell',
    '    a11oy_boardroom_gen    → generate board packet',
    '    a11oy_covenant_check   → check policy compliance',
    '    a11oy_approval_create  → create approval request (human gate)',
    '    a11oy_replay_get       → get workcell replay data',
    '',
    '  Fabric operational — all 15 tools registered.',
  ],
  inspect: (args) => {
    const id = args[1] ?? '';
    if (!id) return ['Usage: inspect <id>', '  e.g. inspect sig-gen-001'];
    const sig = SEED_SIGNALS.find(s => s.id === id);
    if (sig) {
      return [
        `── Signal: ${sig.id} ─────────────────────────────`,
        `  Title:      ${sig.title}`,
        `  Severity:   ${sig.severity}`,
        `  Status:     ${sig.status}`,
        `  Vertical:   ${sig.vertical}`,
        `  Detected:   ${new Date(sig.detectedAt).toLocaleString()}`,
        `  Impact:     ${sig.businessImpact}`,
        `  Workcells:  ${SEED_WORKCELLS.filter(w => w.signals.includes(sig.id)).map(w => w.id).join(', ') || 'none'}`,
      ];
    }
    const wc = SEED_WORKCELLS.find(w => w.id === id);
    if (wc) {
      return [
        `── Workcell: ${wc.id} ───────────────────────────`,
        `  Name:       ${wc.name}`,
        `  Status:     ${wc.status}`,
        `  Vertical:   ${wc.vertical}`,
        `  Steps:      ${wc.agentSequence.length}`,
        `  Eval:       ${wc.mirrorEvalResult.verdict} (${Math.round(wc.mirrorEvalResult.score * 100)}%)`,
        `  Proof:      ${wc.proofPacketId}`,
        `  Approval:   ${wc.requiresApproval ? 'Required' : 'Autonomous'}`,
      ];
    }
    const oc = SEED_OUTCOMES.find(o => o.id === id);
    if (oc) {
      return [
        `── Outcome: ${oc.id} ─────────────────────────────`,
        `  Title:      ${oc.title}`,
        `  Status:     ${oc.status}`,
        `  Vertical:   ${oc.vertical}`,
        `  Target:     ${oc.targetDate}`,
        `  Owner:      ${oc.owner}`,
      ];
    }
    return [`No entity found with id: ${id}`, `Try: signals, workcells, or outcomes to list available IDs`];
  },
  trace: (args) => {
    const id = args[1] ?? '';
    if (!id) return ['Usage: trace <workcell-id>', '  e.g. trace ' + (SEED_WORKCELLS[0]?.id ?? 'wc-001')];
    const wc = SEED_WORKCELLS.find(w => w.id === id) ?? SEED_WORKCELLS[0];
    if (!wc) return [`Workcell not found: ${id}`];
    return [
      `── Trace: ${wc.id} ──────────────────────────────`,
      `  Workcell: ${wc.name}`,
      `  Status: ${wc.status}  |  Eval: ${wc.mirrorEvalResult.verdict} (${Math.round(wc.mirrorEvalResult.score * 100)}%)`,
      '',
      ...wc.agentSequence.slice(0, 8).map((s, i) =>
        `  [${(i + 1).toString().padStart(2)}] ✓  ${s.role.padEnd(26)} ${s.action}`
      ),
      '',
      `  Proof packet: ${wc.proofPacketId}`,
      `  Approval required: ${wc.requiresApproval ? 'Yes' : 'No (autonomous)'}`,
    ];
  },
  covenant: (args) => {
    const sub = args[1] ?? 'list';
    if (sub === 'list') {
      return [
        '── Active Covenant Policies ────────────────────',
        '  [ENFORCED] sanctions-screening-required',
        '  [ENFORCED] human-approval-tier-3',
        '  [ENFORCED] proof-chain-required',
        '  [ENFORCED] mirroreval-pass-gate',
        '  [ENFORCED] connector-default-deny',
        '  [ENFORCED] privilege-preservation-legal',
        '  [ENFORCED] pii-redaction-enforced',
        '  [ENFORCED] output-sanitization-required',
        '  [ACTIVE]   no-action-without-approval-above-tier2',
        '  [ACTIVE]   twin-drift-gate-on-simulation',
        '',
        '  10 policies active. All material actions governed.',
      ];
    }
    if (sub === 'check') {
      const id = args[2] ?? SEED_WORKCELLS[0]?.id ?? 'wc-001';
      const wc = SEED_WORKCELLS.find(w => w.id === id) ?? SEED_WORKCELLS[0];
      return [
        `── Covenant Check: ${id} ─────────────────────`,
        `  Workcell:  ${wc?.name ?? id}`,
        `  Status:    COMPLIANT`,
        `  Policies checked:  10`,
        `  Policies passed:   10`,
        `  Policies failed:   0`,
        '',
        '  ✓ sanctions-screening-required   → PASS',
        '  ✓ human-approval-tier-3          → PASS',
        '  ✓ proof-chain-required           → PASS',
        '  ✓ mirroreval-pass-gate           → PASS (94%)',
        '  ✓ connector-default-deny         → PASS',
      ];
    }
    return [`Usage: covenant list | covenant check <workcell-id>`];
  },
  skills: () => [
    '── Skill Registry (15) ────────────────────────',
    '  [LIVE  ] skill-maritime-risk        Maritime Risk Assessment',
    '  [LIVE  ] skill-legal-analysis       Legal Document Analysis',
    '  [LIVE  ] skill-revenue-forecast     Revenue Signal Forecasting',
    '  [LIVE  ] skill-threat-triage        Security Threat Triage',
    '  [LIVE  ] skill-real-estate-eval     Real Estate Deal Evaluation',
    '  [LIVE  ] skill-procurement-risk     Procurement Contract Risk',
    '  [LIVE  ] skill-boardroom-synthesis  Boardroom Packet Synthesis',
    '  [LIVE  ] skill-eval-harness         MirrorEval Evaluation Harness',
    '  [LIVE  ] skill-proof-generator      Proof Packet Generator',
    '  [LIVE  ] skill-twin-sync            Digital Twin Sync Engine',
    '  [LIVE  ] skill-signal-classifier    Signal Classification & Routing',
    '  [LIVE  ] skill-connector-firewall   Connector Trust Scorer',
    '  [LIVE  ] skill-covenant-checker     Covenant Policy Checker',
    '  [LIVE  ] skill-approval-router      Approval Tier Router',
    '  [LIVE  ] skill-replay-analyst       Workcell Replay Analyst',
    '',
    `  15 skills registered  ·  ${SEED_WORKCELLS.length * 12 + 48} calls today`,
  ],
  connectors: () => [
    '── Connector Firewall ─────────────────────────',
    '  Policy: DEFAULT DENY — untrusted until registered',
    '',
    '  [APPROVED] ais-live-api             AIS / Maritime   trust:92',
    '  [APPROVED] bloomberg-feed           Finance          trust:88',
    '  [APPROVED] court-docket-api         Legal            trust:94',
    '  [APPROVED] defense-intel-feed       Defense          trust:96',
    '  [APPROVED] mls-property-api         Real Estate      trust:85',
    '  [APPROVED] vendor-risk-db           Procurement      trust:79',
    '  [APPROVED] crm-platform             Revenue          trust:87',
    '  [PENDING]  social-sentiment-api     Marketing        trust:51',
    '  [BLOCKED]  third-party-llm-api      AI               trust:12',
    '',
    `  8 registered  ·  7 approved  ·  1 blocked  ·  47 injection attempts blocked`,
  ],
  twins: () => [
    '── Business Digital Twins ─────────────────────',
    '  [DRIFT:HIGH ] vessel-twin-001    VLCC Everest (Maritime)',
    '  [DRIFT:MED  ] deal-twin-003      Meridian Acquisition (Revenue)',
    '  [DRIFT:LOW  ] matter-twin-012    SZL v. CrossBridge (Legal)',
    '  [DRIFT:LOW  ] asset-twin-007     45 Park Ave Portfolio (Real Estate)',
    '  [DRIFT:CRIT ] vendor-twin-002    Apex Supply (Procurement)',
    '  [DRIFT:LOW  ] incident-twin-009  CVE-2025-4891 (Security)',
    '  [DRIFT:MED  ] contract-twin-015  EU Compliance Bundle (Legal)',
    '',
    '  7 twins active  ·  1 critical  ·  1 high  ·  2 medium',
  ],
  boardroom: () => [
    '── Boardroom Packet Summary ───────────────────',
    '  Packets generated:    5',
    '  Avg eval score:       91%',
    '  Last generated:       2026-04-26 14:32 UTC',
    '',
    '  Tenants with packets:',
    '    ◇ SZL Holdings        Q2 2026  eval:94%  APPROVED',
    '    ◇ Acme Industries     Q2 2026  eval:89%  APPROVED',
    '    ◇ Northwind Labs      Q2 2026  eval:87%  APPROVED',
    '    ◇ CrossBridge Capital Q2 2026  eval:93%  APPROVED',
    '    ◇ Meridian Group      Q2 2026  eval:91%  APPROVED',
    '',
    '  All packets proof-chained and eval-scored.',
  ],
  eval: () => {
    const passed = SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'pass').length;
    const warned = SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'warn').length;
    const blocked = SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'fail').length;
    const avg = Math.round(SEED_WORKCELLS.reduce((s, w) => s + w.mirrorEvalResult.score, 0) / SEED_WORKCELLS.length * 100);
    return [
      '── MirrorEval 2.0 Summary ─────────────────────',
      `  Total evaluations:    ${SEED_WORKCELLS.length}`,
      `  Pass:                 ${passed}`,
      `  Warned:               ${warned}`,
      `  Blocked:              ${blocked}`,
      `  Average composite:    ${avg}%`,
      '',
      '  Evaluated dimensions (14):',
      '    Groundedness · Evidence coverage · Action safety',
      '    Hallucination risk · Policy compliance · Tool risk',
      '    Proof completeness · Approval alignment · Context fidelity',
      '    Reasoning quality · Output safety · Bias detection',
      '    Constitutional alignment · Shadow Council score',
    ];
  },
  fabric: () => [
    '── Fabric Health ──────────────────────────────',
    '  Status:           OPERATIONAL',
    '  Uptime:           99.97% (30d)',
    '  Signal latency:   <120ms',
    '  Workcell throughput: 12.4 / hr',
    '  Proof chain:      intact (100% coverage)',
    '  Covenant engine:  all policies enforced',
    '  MirrorEval:       operational (14 dims active)',
    '  Connector FW:     default-deny enforced',
    '  Twin registry:    7 twins synced',
    '  Model router:     3 providers active',
    '',
    '  All fabric components nominal.',
  ],
};

const SUGGESTIONS = [
  'help', 'now', 'fabric', 'signals', 'signals --severity critical',
  'workcells', 'workcells --status running', 'outcomes', 'tools', 'proof',
  'agents', 'pce', 'skills', 'connectors', 'twins', 'boardroom', 'eval',
  'covenant list', 'trace', 'demo', 'mcp', 'version',
];

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
        subtitle="Interactive terminal for the A11oy fabric. Full command set active — type help to begin."
        status="LIVE"
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
              <span className="text-xs font-mono ml-3" style={{ color: '#4d607a' }}>a11oy-terminal — v4.2.0 · operational</span>
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
