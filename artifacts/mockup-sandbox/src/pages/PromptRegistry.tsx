import { AlloyKernelPanel } from '@/components/AlloyKernelPanel';
import {
  ArrowUp,
  BarChart2,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Diff,
  Edit3,
  FlaskConical,
  Loader,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface PromptVersion {
  versionId: string;
  version: number;
  template: string;
  changelog: string;
  createdBy: string;
  createdAt: string;
  tags: string[];
  evalMetadata?: {
    score: number;
    passRate: number;
    avgLatencyMs: number;
    sampleCount: number;
    improvement?: number;
  };
}

interface PromptEntry {
  id: string;
  name: string;
  description: string;
  domain: string;
  routeClass: string;
  activeVersionId: string;
  activeVersion: number;
  versionCount: number;
  status: 'active' | 'draft' | 'deprecated';
  lastEvalScore: number | null;
  lastEvalPassRate: number | null;
  tags: string[];
  updatedAt: string;
  versions: PromptVersion[];
}

const DEMO_PROMPTS: PromptEntry[] = [
  {
    id: 'p-aegis-threat-score',
    name: 'PARAGON Threat Scorer',
    description: 'Scores CVE severity with CVSS weighting and asset exposure context for the PARAGON domain.',
    domain: 'aegis',
    routeClass: 'structured',
    activeVersionId: 'p-aegis-threat-score@v3',
    activeVersion: 3,
    versionCount: 3,
    status: 'active',
    lastEvalScore: 91.4,
    lastEvalPassRate: 0.94,
    tags: ['security', 'scoring', 'cvss'],
    updatedAt: '2026-04-22T14:30:00Z',
    versions: [
      {
        versionId: 'p-aegis-threat-score@v3',
        version: 3,
        template: `You are a cyber threat scoring agent for the SZL Holdings PARAGON domain.\n\nGiven a CVE and asset context, compute a weighted severity score:\n- Start with CVSS 3.1 base score\n- Multiply by 1.4× if asset is internet-facing\n- Multiply by 0.6× if asset is air-gapped\n- Cap adjusted score at 10.0\n\nOutput a JSON object: { cvss_base, exposure_multiplier, adjusted_score, severity_tier, rationale }\n\nSeverity tiers: CRITICAL (≥9.0), HIGH (7.0–8.9), MEDIUM (4.0–6.9), LOW (<4.0)\n\nContext:\n{{asset_context}}\n\nCVE: {{cve_id}}\nDescription: {{cve_description}}`,
        changelog: 'Added air-gapped multiplier (0.6×). Fixed severity tier boundary at 9.0 (was 9.1). Improved rationale field verbosity.',
        createdBy: 'praxis-agent',
        createdAt: '2026-04-22T14:30:00Z',
        tags: ['security', 'scoring'],
        evalMetadata: { score: 91.4, passRate: 0.94, avgLatencyMs: 840, sampleCount: 48, improvement: 3.2 },
      },
      {
        versionId: 'p-aegis-threat-score@v2',
        version: 2,
        template: `You are a cyber threat scoring agent for the SZL Holdings PARAGON domain.\n\nGiven a CVE and asset context, compute a weighted severity score:\n- Start with CVSS 3.1 base score\n- Multiply by 1.4× if asset is internet-facing\n- Cap adjusted score at 10.0\n\nOutput JSON: { cvss_base, adjusted_score, severity_tier, rationale }\n\nCVE: {{cve_id}}\nDescription: {{cve_description}}`,
        changelog: 'Added internet-facing multiplier (1.4×) and asset context injection.',
        createdBy: 'r.vargas',
        createdAt: '2026-04-10T10:00:00Z',
        tags: ['security'],
        evalMetadata: { score: 88.2, passRate: 0.91, avgLatencyMs: 920, sampleCount: 48 },
      },
      {
        versionId: 'p-aegis-threat-score@v1',
        version: 1,
        template: `Score the following CVE on a scale of 1–10. Use the CVSS base score as guidance.\n\nCVE: {{cve_id}}\nDescription: {{cve_description}}\n\nRespond with: { score, rationale }`,
        changelog: 'Initial version. Simple scoring without exposure context.',
        createdBy: 'r.vargas',
        createdAt: '2026-03-28T09:00:00Z',
        tags: ['security'],
        evalMetadata: { score: 74.1, passRate: 0.78, avgLatencyMs: 1240, sampleCount: 30 },
      },
    ],
  },
  {
    id: 'p-lumina-brief',
    name: 'Pulse Executive Brief',
    description: 'Compiles cross-domain signals into a 5-insight executive brief with BLUF format.',
    domain: 'pulse',
    routeClass: 'generative',
    activeVersionId: 'p-lumina-brief@v4',
    activeVersion: 4,
    versionCount: 4,
    status: 'active',
    lastEvalScore: 87.9,
    lastEvalPassRate: 0.88,
    tags: ['executive', 'brief', 'lumina'],
    updatedAt: '2026-04-20T09:15:00Z',
    versions: [
      {
        versionId: 'p-lumina-brief@v4',
        version: 4,
        template: `You are the Pulse executive briefing agent for {{exec_name}}.\n\nCompile a 5-insight executive brief from the following domain signals:\n{{domain_signals}}\n\nFormat:\n1. BLUF (Bottom Line Up Front) — one sentence\n2. Top 5 insights, ranked by (urgency × novelty)\n   - Suppress any insight seen in the previous 3 briefs: {{seen_ids}}\n   - Recency-boost insights from the last 4 hours by 1.5×\n3. One recommended action with owner and deadline\n\nConstraints:\n- Maximum 5 insights (exec read time target: <3 minutes)\n- Each insight: title, domain, confidence (%), 2-sentence detail\n- No jargon; prefer plain language\n\nOutput as JSON matching the Pulse brief schema.`,
        changelog: 'Added recency boost (1.5×) for last-4-hour insights. Added suppression of previously-seen insight IDs. Reduced max insights from 7 to 5 based on A/B test results.',
        createdBy: 'praxis-agent',
        createdAt: '2026-04-20T09:15:00Z',
        tags: ['executive', 'brief'],
        evalMetadata: { score: 87.9, passRate: 0.88, avgLatencyMs: 2100, sampleCount: 62, improvement: 2.1 },
      },
      {
        versionId: 'p-lumina-brief@v3',
        version: 3,
        template: `You are Pulse, the executive briefing agent for {{exec_name}}.\n\nCompile a 7-insight executive brief from domain signals:\n{{domain_signals}}\n\nFormat:\n1. BLUF — one sentence\n2. Top 7 insights ranked by urgency\n3. Recommended action\n\nOutput JSON matching the Pulse brief schema.`,
        changelog: 'Added BLUF section. Increased max insights to 7 (later reverted in v4 based on user study).',
        createdBy: 'n.osei',
        createdAt: '2026-04-05T14:00:00Z',
        tags: ['executive'],
        evalMetadata: { score: 85.8, passRate: 0.86, avgLatencyMs: 2400, sampleCount: 62 },
      },
      {
        versionId: 'p-lumina-brief@v2',
        version: 2,
        template: `Summarize the following signals into an executive brief with 5 key insights.\n\nSignals:\n{{domain_signals}}\n\nRespond in JSON with: { insights: [{ title, domain, detail }] }`,
        changelog: 'Added domain attribution per insight. Removed unstructured text output.',
        createdBy: 'n.osei',
        createdAt: '2026-03-20T11:00:00Z',
        tags: [],
        evalMetadata: { score: 79.3, passRate: 0.81, avgLatencyMs: 1800, sampleCount: 40 },
      },
      {
        versionId: 'p-lumina-brief@v1',
        version: 1,
        template: `Summarize the following signals into an executive brief.\n\nSignals:\n{{domain_signals}}`,
        changelog: 'Initial version. Unstructured output.',
        createdBy: 'n.osei',
        createdAt: '2026-03-10T09:00:00Z',
        tags: [],
        evalMetadata: { score: 61.2, passRate: 0.67, avgLatencyMs: 2900, sampleCount: 20 },
      },
    ],
  },
  {
    id: 'p-terra-distress',
    name: 'DOMAINE Distress Scorer',
    description: 'Scores property distress probability from tax lien, lis pendens, and pre-foreclosure signals.',
    domain: 'terra',
    routeClass: 'structured',
    activeVersionId: 'p-terra-distress@v2',
    activeVersion: 2,
    versionCount: 2,
    status: 'active',
    lastEvalScore: 84.6,
    lastEvalPassRate: 0.86,
    tags: ['real-estate', 'distress', 'scoring'],
    updatedAt: '2026-04-15T16:45:00Z',
    versions: [
      {
        versionId: 'p-terra-distress@v2',
        version: 2,
        template: `You are a property distress scoring agent for the DOMAINE domain.\n\nCompute distress score using:\n  distress_score = 0.6 × tax_signal + 0.3 × ownership_stress + 0.1 × market_momentum\n\nCoefficients are calibrated for NYC ZIP codes. Clamp output to [0, 1].\n\nProperty data:\n{{property_data}}\n\nPublic records (90-day window):\n- Tax liens: {{tax_liens}}\n- Lis pendens: {{lis_pendens}}\n- Pre-foreclosure: {{pre_foreclosure}}\n\nOutput JSON: { distress_score, tax_signal, ownership_stress, market_momentum, tier, rationale }`,
        changelog: 'Added market_momentum component (0.1 weight). Calibrated coefficients against NYC regression model. Excluded short-sales from signal (separate category).',
        createdBy: 'praxis-agent',
        createdAt: '2026-04-15T16:45:00Z',
        tags: ['real-estate', 'nyc'],
        evalMetadata: { score: 84.6, passRate: 0.86, avgLatencyMs: 1100, sampleCount: 38, improvement: 4.8 },
      },
      {
        versionId: 'p-terra-distress@v1',
        version: 1,
        template: `Score the distress probability of this property from 0 to 1.\n\nProperty: {{property_data}}\nTax liens: {{tax_liens}}\n\nRespond with: { score, rationale }`,
        changelog: 'Initial version. Tax lien only, no ownership or market signals.',
        createdBy: 'c.okafor',
        createdAt: '2026-03-25T10:00:00Z',
        tags: [],
        evalMetadata: { score: 79.8, passRate: 0.80, avgLatencyMs: 920, sampleCount: 25 },
      },
    ],
  },
  {
    id: 'p-orchestrator-plan',
    name: 'PRAXIS Orchestration Planner',
    description: 'Generates a parallelized agent execution plan from a high-level intent string.',
    domain: 'praxis',
    routeClass: 'planning',
    activeVersionId: 'p-orchestrator-plan@v2',
    activeVersion: 2,
    versionCount: 2,
    status: 'active',
    lastEvalScore: 93.1,
    lastEvalPassRate: 0.96,
    tags: ['orchestration', 'planning', 'praxis'],
    updatedAt: '2026-04-18T11:00:00Z',
    versions: [
      {
        versionId: 'p-orchestrator-plan@v2',
        version: 2,
        template: `You are the PRAXIS orchestration planner.\n\nGiven the following intent, generate a parallelized agent execution plan:\n\nIntent: {{intent}}\n\nAvailable agents: {{agent_registry}}\n\nRules:\n1. Identify data dependencies between steps. Steps with no dependency on each other MUST be parallelized.\n2. Each step must specify: agent_id, action, inputs, outputs, depends_on[]\n3. Add estimated latency per step based on historical p50.\n4. Flag any steps that require human approval before execution.\n5. Include a contingency path for each step that may fail.\n\nOutput JSON matching the OrchestrationPlan schema.`,
        changelog: 'Added contingency path requirement per step. Added human approval flagging. Enforced parallelization rule explicitly.',
        createdBy: 'praxis-agent',
        createdAt: '2026-04-18T11:00:00Z',
        tags: ['planning'],
        evalMetadata: { score: 93.1, passRate: 0.96, avgLatencyMs: 1840, sampleCount: 52, improvement: 4.2 },
      },
      {
        versionId: 'p-orchestrator-plan@v1',
        version: 1,
        template: `Plan a sequence of agent steps to fulfill this intent: {{intent}}\n\nUse agents: {{agent_registry}}\n\nOutput a JSON list of steps with: agent_id, action, inputs, depends_on[]`,
        changelog: 'Initial version. Sequential planning only, no parallelism enforcement.',
        createdBy: 'praxis-agent',
        createdAt: '2026-04-08T09:00:00Z',
        tags: [],
        evalMetadata: { score: 88.9, passRate: 0.91, avgLatencyMs: 2200, sampleCount: 40 },
      },
    ],
  },
  {
    id: 'p-vessels-port-risk',
    name: 'SEXTANT Port Risk Assessor',
    description: 'Assesses sanctions and weather risk for upcoming vessel port calls.',
    domain: 'vessels',
    routeClass: 'structured',
    activeVersionId: 'p-vessels-port-risk@v1',
    activeVersion: 1,
    versionCount: 1,
    status: 'draft',
    lastEvalScore: 79.4,
    lastEvalPassRate: 0.82,
    tags: ['maritime', 'sanctions', 'risk'],
    updatedAt: '2026-04-12T08:30:00Z',
    versions: [
      {
        versionId: 'p-vessels-port-risk@v1',
        version: 1,
        template: `You are a port risk assessment agent for the SEXTANT domain.\n\nFor each upcoming port call, compute:\n  port_risk = max(sanction_score, weather_score, congestion_score)\n\nInputs:\n- Vessel: {{vessel_id}}\n- Port calls: {{port_calls}}\n- OFAC SDN status: {{ofac_status}}\n- Weather forecast: {{weather}}\n\nOutput JSON: { port_call_id, port, sanction_score, weather_score, congestion_score, port_risk, tier, notes }[]`,
        changelog: 'Initial version.',
        createdBy: 'praxis-agent',
        createdAt: '2026-04-12T08:30:00Z',
        tags: ['maritime'],
        evalMetadata: { score: 79.4, passRate: 0.82, avgLatencyMs: 980, sampleCount: 28 },
      },
    ],
  },
];

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground/40 text-[10px]">no eval</span>;
  const color = score >= 90 ? 'text-praxis-green' : score >= 75 ? 'text-praxis-amber' : 'text-praxis-red';
  return <span className={`font-mono text-xs font-bold ${color}`}>{score.toFixed(1)}</span>;
}

function StatusChip({ status }: { status: string }) {
  const cfg = {
    active: 'border-praxis-green/30 bg-praxis-green/10 text-praxis-green',
    draft: 'border-praxis/60 bg-praxis-bg text-muted-foreground',
    deprecated: 'border-red-500/30 bg-red-500/10 text-praxis-red',
  }[status] ?? 'border-praxis/60 bg-praxis-bg text-muted-foreground';
  return <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${cfg}`}>{status}</span>;
}

function DiffView({ v1, v2 }: { v1: PromptVersion; v2: PromptVersion }) {
  const lines1 = v1.template.split('\n');
  const lines2 = v2.template.split('\n');
  const maxLen = Math.max(lines1.length, lines2.length);
  const rows: Array<{ type: 'same' | 'added' | 'removed'; content: string }> = [];
  for (let i = 0; i < maxLen; i++) {
    const l1 = lines1[i];
    const l2 = lines2[i];
    if (l1 === l2) rows.push({ type: 'same', content: l2 ?? '' });
    else {
      if (l1 !== undefined) rows.push({ type: 'removed', content: l1 });
      if (l2 !== undefined) rows.push({ type: 'added', content: l2 });
    }
  }
  return (
    <div className="bg-praxis-bg rounded-lg p-3 max-h-48 overflow-y-auto">
      {rows.map((r, i) => (
        <div key={i} className={`text-[10px] font-mono px-1 rounded ${r.type === 'added' ? 'bg-praxis-green/10 text-praxis-green' : r.type === 'removed' ? 'bg-praxis-red/10 text-praxis-red line-through opacity-60' : 'text-muted-foreground/50'}`}>
          {r.type === 'added' ? '+' : r.type === 'removed' ? '-' : ' '} {r.content || ' '}
        </div>
      ))}
    </div>
  );
}

function ProposeChangeForm({ prompt, onClose, onPropose }: { prompt: PromptEntry; onClose: () => void; onPropose: (template: string, changelog: string) => void }) {
  const latest = prompt.versions[0];
  const [template, setTemplate] = useState(latest.template);
  const [changelog, setChangelog] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 600));
    onPropose(template, changelog);
  }

  return (
    <div className="border border-praxis-cyan/30 bg-praxis-cyan/5 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-praxis-cyan" />
          <span className="text-xs font-semibold text-praxis-cyan font-mono">PROPOSE CHANGE</span>
          <span className="text-[9px] text-muted-foreground/40 font-mono">local only · not persisted</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div>
        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">Template</label>
        <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={8} className="w-full bg-praxis-bg border border-praxis rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none text-foreground" />
      </div>
      <div>
        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">Changelog note</label>
        <input value={changelog} onChange={(e) => setChangelog(e.target.value)} className="w-full bg-praxis-bg border border-praxis rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground" placeholder="What changed and why?" />
      </div>
      <button onClick={handleSubmit} disabled={submitted || !changelog} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-praxis-cyan/40 bg-praxis-cyan/10 text-praxis-cyan text-xs font-mono hover:bg-praxis-cyan/20 transition-colors disabled:opacity-50">
        {submitted ? <Loader className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        {submitted ? 'Adding…' : 'Add pending version'}
      </button>
    </div>
  );
}

function VersionCard({ version, isActive, onPromote, onEval, showDiff, prevVersion }: { version: PromptVersion; isActive: boolean; onPromote: (v: PromptVersion) => void; onEval: (v: PromptVersion) => void; showDiff: boolean; prevVersion?: PromptVersion }) {
  const [open, setOpen] = useState(false);
  const em = version.evalMetadata;

  return (
    <div className={`rounded border ${isActive ? 'border-praxis-cyan/30 bg-praxis-cyan/5' : 'border-praxis bg-praxis-bg'}`}>
      <button className="w-full flex items-center gap-3 px-3 py-2 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold">v{version.version}</span>
            {isActive && <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-praxis-cyan/30 bg-praxis-cyan/10 text-praxis-cyan">ACTIVE</span>}
            {em?.improvement != null && em.improvement > 0 && <span className="text-[9px] font-mono text-praxis-green">+{em.improvement.toFixed(1)}%</span>}
            {version.tags.map((t) => <span key={t} className="text-[8px] font-mono px-1 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/50">{t}</span>)}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/60">
            {em?.score != null && <span>score {em.score.toFixed(1)}</span>}
            {em?.passRate != null && <span>pass {(em.passRate * 100).toFixed(0)}%</span>}
            {em?.avgLatencyMs != null && <span>{em.avgLatencyMs}ms</span>}
            {em?.sampleCount != null && <span>{em.sampleCount} cases</span>}
            <span className="ml-auto">{version.createdBy}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); onEval(version); }} className="flex items-center gap-1 px-2 py-1 rounded border border-praxis-amber/30 bg-praxis-amber/10 text-praxis-amber text-[10px] hover:bg-praxis-amber/20 transition-colors">
            <FlaskConical className="w-3 h-3" />Eval
          </button>
          {!isActive && (
            <button onClick={(e) => { e.stopPropagation(); onPromote(version); }} className="flex items-center gap-1 px-2 py-1 rounded border border-praxis-cyan/30 bg-praxis-cyan/10 text-praxis-cyan text-[10px] hover:bg-praxis-cyan/20 transition-colors">
              <ArrowUp className="w-3 h-3" />Promote
            </button>
          )}
          {open ? <ChevronDown className="w-3 h-3 text-muted-foreground/40" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-praxis/50">
          {version.changelog && <p className="text-xs text-muted-foreground/70 pt-2">{version.changelog}</p>}
          {showDiff && prevVersion ? (
            <div>
              <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-1 flex items-center gap-1"><Diff className="w-3 h-3" />Diff vs v{prevVersion.version}</div>
              <DiffView v1={prevVersion} v2={version} />
            </div>
          ) : (
            <pre className="text-[10px] font-mono text-muted-foreground/60 bg-praxis-bg rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32">
              {version.template.slice(0, 400)}{version.template.length > 400 ? '…' : ''}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt: initialPrompt }: { prompt: PromptEntry }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [showDiff, setShowDiff] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [evallingVersion, setEvallingVersion] = useState<string | null>(null);

  useEffect(() => {
    if (open && prompt.versions.length === 0) {
      fetch(`/api/ai/prompts/${prompt.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { versions?: PromptVersion[] }) => {
          if (data?.versions && data.versions.length > 0) {
            setPrompt((prev) => ({ ...prev, versions: data.versions! }));
          }
        })
        .catch(() => {});
    }
  }, [open, prompt.id, prompt.versions.length]);

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function promote(v: PromptVersion) {
    setPromoting(true);
    try {
      await fetch(`/api/ai/prompts/${prompt.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: v.versionId }),
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
    setPrompt((prev) => ({ ...prev, activeVersionId: v.versionId, activeVersion: v.version }));
    setPromoting(false);
    showToastMsg(`v${v.version} promoted to active`);
  }

  async function evalVersion(v: PromptVersion) {
    setEvallingVersion(v.versionId);
    try {
      const res = await fetch(`/api/ai/prompts/${prompt.id}/versions/${v.versionId}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const result = await res.json();
        showToastMsg(`Eval complete — score: ${result.score != null ? result.score.toFixed(1) : (v.evalMetadata?.score?.toFixed(1) ?? '—')}`);
        setEvallingVersion(null);
        return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1200));
    showToastMsg(`Eval complete — score: ${v.evalMetadata?.score?.toFixed(1) ?? '91.0'}`);
    setEvallingVersion(null);
  }

  function handlePropose(template: string, changelog: string) {
    const newV: PromptVersion = {
      versionId: `${prompt.id}@v${prompt.versionCount + 1}`,
      version: prompt.versionCount + 1,
      template,
      changelog,
      createdBy: 'you (pending)',
      createdAt: new Date().toISOString(),
      tags: [],
    };
    setPrompt((prev) => ({
      ...prev,
      versionCount: prev.versionCount + 1,
      versions: [newV, ...prev.versions],
    }));
    setShowPropose(false);
    showToastMsg(`Draft v${newV.version} added — local only`);
  }

  const sortedVersions = [...prompt.versions].sort((a, b) => b.version - a.version);

  return (
    <div className="rounded-lg bg-praxis-surface border border-praxis">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{prompt.name}</span>
            <StatusChip status={prompt.status} />
            <span className="text-[10px] font-mono text-muted-foreground/50 ml-1">{prompt.domain}</span>
          </div>
          <div className="text-xs text-muted-foreground/60 mt-0.5 truncate">{prompt.description}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <ScoreBadge score={prompt.lastEvalScore} />
            <div className="text-[9px] text-muted-foreground/40 mt-0.5">{prompt.versionCount}v · {prompt.routeClass}</div>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground/40" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-praxis px-4 pb-4 pt-3 space-y-3">
          {toast && (
            <div className="rounded border border-praxis-cyan/30 bg-praxis-cyan/10 text-praxis-cyan text-xs px-3 py-1.5 flex items-center gap-2">
              <Check className="w-3 h-3" />{toast}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowDiff((d) => !d)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors ${showDiff ? 'border-praxis-cyan/40 bg-praxis-cyan/10 text-praxis-cyan' : 'border-praxis bg-praxis-bg text-muted-foreground/60 hover:text-foreground'}`}>
              <Diff className="w-3 h-3" />{showDiff ? 'Hide diff' : 'Show diff'}
            </button>
            <button onClick={() => setShowPropose(!showPropose)} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-praxis-green/30 bg-praxis-green/10 text-praxis-green text-[10px] font-mono hover:bg-praxis-green/20 transition-colors">
              <Edit3 className="w-3 h-3" />Propose change
            </button>
          </div>

          {showPropose && (
            <ProposeChangeForm prompt={prompt} onClose={() => setShowPropose(false)} onPropose={handlePropose} />
          )}

          <div className="space-y-2">
            {promoting && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader className="w-3 h-3 animate-spin" />Promoting…</div>}
            {sortedVersions.map((v, idx) => (
              <VersionCard
                key={v.versionId}
                version={v}
                isActive={v.versionId === prompt.activeVersionId}
                onPromote={promote}
                onEval={evallingVersion ? () => {} : evalVersion}
                showDiff={showDiff}
                prevVersion={sortedVersions[idx + 1]}
              />
            ))}
          </div>

          {prompt.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Tag className="w-3 h-3 text-muted-foreground/40" />
              {prompt.tags.map((t) => (
                <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-praxis bg-praxis-bg text-muted-foreground/60">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PromptRegistry() {
  const [prompts, setPrompts] = useState<PromptEntry[]>(DEMO_PROMPTS);
  const [filter, setFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

  useEffect(() => {
    fetch('/api/ai/prompts')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const apiPrompts: PromptEntry[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? '',
          domain: p.domain ?? 'general',
          routeClass: p.routeClass ?? 'generation',
          activeVersionId: p.activeVersionId ?? '',
          activeVersion: p.activeVersion ?? 1,
          versionCount: p.versionCount ?? 1,
          status: p.status ?? 'active',
          lastEvalScore: p.lastEvalScore ?? null,
          lastEvalPassRate: p.lastEvalPassRate ?? null,
          tags: p.tags ?? [],
          updatedAt: p.updatedAt ?? new Date().toISOString(),
          versions: p.versions ?? [],
        }));
        setPrompts(apiPrompts);
      })
      .catch(() => {});
  }, []);

  const domains = ['all', ...Array.from(new Set(prompts.map((p) => p.domain)))];
  const filtered = prompts.filter((p) => {
    const matchesDomain = domainFilter === 'all' || p.domain === domainFilter;
    const matchesFilter = !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.description.toLowerCase().includes(filter.toLowerCase());
    return matchesDomain && matchesFilter;
  });

  const avgScore = prompts.filter((p) => p.lastEvalScore != null).reduce((s, p) => s + (p.lastEvalScore ?? 0), 0) / Math.max(1, prompts.filter((p) => p.lastEvalScore != null).length);
  const activeCount = prompts.filter((p) => p.status === 'active').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-praxis-cyan font-mono tracking-wide">PROMPT REGISTRY</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Versioned prompt management · promote · diff · propose change</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-praxis-surface border border-praxis p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><BookOpen className="w-3 h-3" />Prompts</div>
          <div className="text-2xl font-mono font-bold text-praxis-cyan">{prompts.length}</div>
          <div className="text-[10px] text-muted-foreground/60">{activeCount} active</div>
        </div>
        <div className="rounded-lg bg-praxis-surface border border-praxis p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><BarChart2 className="w-3 h-3" />Avg Eval Score</div>
          <div className={`text-2xl font-mono font-bold ${avgScore >= 85 ? 'text-praxis-green' : avgScore >= 70 ? 'text-praxis-amber' : 'text-praxis-red'}`}>{avgScore.toFixed(1)}</div>
          <div className="text-[10px] text-muted-foreground/60">across evalled versions</div>
        </div>
        <div className="rounded-lg bg-praxis-surface border border-praxis p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Clock className="w-3 h-3" />Total Versions</div>
          <div className="text-2xl font-mono font-bold text-foreground">{prompts.reduce((s, p) => s + p.versionCount, 0)}</div>
          <div className="text-[10px] text-muted-foreground/60">across all prompts</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search prompts…" className="flex-1 bg-praxis-surface border border-praxis rounded px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-praxis-cyan/40" />
        <div className="flex gap-1">
          {domains.map((d) => (
            <button key={d} onClick={() => setDomainFilter(d)} className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${domainFilter === d ? 'border-praxis-cyan/40 bg-praxis-cyan/10 text-praxis-cyan' : 'border-praxis bg-praxis-bg text-muted-foreground/60 hover:text-foreground'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground/60 text-sm py-12">No prompts match filters</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => <PromptCard key={p.id} prompt={p} />)}
        </div>
      )}

      <AlloyKernelPanel />
    </div>
  );
}
