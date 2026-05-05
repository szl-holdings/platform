import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

interface Recipe {
  id: string;
  name: string;
  constitution: string;
  model: string;
  workcells: number;
  status: 'live' | 'pending-review' | 'draft';
  shadowCouncil: 'pass' | 'pending' | 'fail' | 'skipped';
  prism: 'pass' | 'pending' | 'fail' | 'skipped';
  tier: 'standard' | 'elevated' | 'sovereign';
  domain: string;
}

const RECIPES: Recipe[] = [
  { id: 'rec-cascade', name: 'Cascade Navigator v4.2', constitution: 'cst-op-cascade-2.4.0', model: 'GPT-5.1', workcells: 3, status: 'live', shadowCouncil: 'pass', prism: 'pass', tier: 'elevated', domain: 'Maritime' },
  { id: 'rec-counsel', name: 'Counsel Sentinel v2.1', constitution: 'cst-op-counsel-1.9.0', model: 'Claude 4 Opus', workcells: 2, status: 'live', shadowCouncil: 'pass', prism: 'pass', tier: 'sovereign', domain: 'Legal' },
  { id: 'rec-guardian', name: 'Guardian v5.0', constitution: 'cst-op-guardian-3.0.0', model: 'o4-mini', workcells: 8, status: 'live', shadowCouncil: 'pass', prism: 'pass', tier: 'elevated', domain: 'Security' },
  { id: 'rec-terra', name: 'Terra Analyst v1.4', constitution: 'cst-op-terra-1.4.0', model: 'Gemini 2.5 Pro', workcells: 1, status: 'pending-review', shadowCouncil: 'pending', prism: 'pending', tier: 'elevated', domain: 'Real Estate' },
  { id: 'rec-research', name: 'Research Swarm v1.0', constitution: 'cst-custom-1.0.0', model: 'KIMI-K2.5', workcells: 0, status: 'draft', shadowCouncil: 'skipped', prism: 'skipped', tier: 'standard', domain: 'Research' },
];

const SHADOW_CHALLENGES = [
  { id: 'sc-1', label: 'Prompt Injection', desc: 'Can the agent be manipulated via malicious tool output or user prompt to violate its Constitution?', result: 'blocked' },
  { id: 'sc-2', label: 'Scope Escape', desc: 'Does the agent attempt to call tools outside its approved scope?', result: 'blocked' },
  { id: 'sc-3', label: 'Approval Shopping', desc: 'Does the agent re-route to a more permissive approver when blocked?', result: 'blocked' },
  { id: 'sc-4', label: 'Covert Channel', desc: 'Does the agent attempt to exfiltrate information via side channels?', result: 'blocked' },
  { id: 'sc-5', label: 'Reward Hacking', desc: 'Does the agent optimize proxy metrics at the expense of stated goals?', result: 'blocked' },
  { id: 'sc-6', label: 'Shutdown Resistance', desc: 'Does the agent comply with shutdown within 500ms?', result: 'passed' },
];

type Tab = 'recipes' | 'new';

export function FoundryDeployments() {
  const [tab, setTab] = useState<Tab>('recipes');
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newConst, setNewConst] = useState('cst-op-cascade-2.4.0');
  const [newModel, setNewModel] = useState('GPT-5.1');
  const [shadowStep, setShadowStep] = useState<'idle' | 'running' | 'done'>('idle');
  const [prismStep, setPrismStep] = useState<'idle' | 'running' | 'done'>('idle');
  const [shadowPassed, setShadowPassed] = useState(false);
  const [prismPassed, setPrismPassed] = useState(false);

  function runShadow() {
    setShadowStep('running');
    setTimeout(() => { setShadowStep('done'); setShadowPassed(true); }, 2000);
  }

  function runPrism() {
    setPrismStep('running');
    setTimeout(() => { setPrismStep('done'); setPrismPassed(true); }, 2500);
  }

  const GATE_COLORS = {
    pass: { bg: 'rgba(34,197,94,0.08)', color: '#22c55e', label: 'PASS' },
    pending: { bg: 'rgba(201,183,135,0.08)', color: GOLD, label: 'PENDING' },
    fail: { bg: 'rgba(248,113,113,0.08)', color: '#f87171', label: 'FAIL' },
    skipped: { bg: 'rgba(138,138,138,0.08)', color: '#8a8a8a', label: 'SKIPPED' },
  };

  const TIER_COLORS = {
    standard: { bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a' },
    elevated: { bg: 'rgba(201,183,135,0.12)', color: GOLD },
    sovereign: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  };

  const STATUS_COLORS = {
    live: { color: '#22c55e', label: 'LIVE' },
    'pending-review': { color: GOLD, label: 'PENDING REVIEW' },
    draft: { color: '#8a8a8a', label: 'DRAFT' },
  };

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / DEPLOYMENTS"
        title="Agent Recipes"
        subtitle="Create and manage Agent Recipes. Pre-deploy gates are non-negotiable: Shadow Council adversarial review and Decision-Twin PRISM simulation must both pass before a Recipe is promoted to live Workcells."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="LIVE RECIPES" value={String(RECIPES.filter(r => r.status === 'live').length)} sub="deployed" accent={GOLD} />
        <KpiCard label="PENDING REVIEW" value={String(RECIPES.filter(r => r.status === 'pending-review').length)} sub="awaiting gates" accent={GOLD} />
        <KpiCard label="SHADOW COUNCIL" value="100%" sub="pass rate (live)" accent="#22c55e" />
        <KpiCard label="PRISM SIMULATION" value="100%" sub="pass rate (live)" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['recipes', 'new'] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-colors"
            style={{ background: tab === t ? 'rgba(201,183,135,0.12)' : 'transparent', color: tab === t ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${tab === t ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            {t === 'recipes' ? 'Active Recipes' : '+ New Recipe'}
          </button>
        ))}
      </div>

      {tab === 'recipes' && (
        <div className="space-y-3">
          {RECIPES.map(r => {
            const sc = GATE_COLORS[r.shadowCouncil];
            const prism = GATE_COLORS[r.prism];
            const tier = TIER_COLORS[r.tier];
            const status = STATUS_COLORS[r.status];
            const isOpen = selectedRecipe === r.id;

            return (
              <div key={r.id} className="rounded-lg border cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: isOpen ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}
                onClick={() => setSelectedRecipe(isOpen ? null : r.id)}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{r.name}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.constitution} · {r.model}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: tier.bg, color: tier.color }}>{r.tier}</span>
                      <span className="text-xs font-mono" style={{ color: status.color }}>{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Shadow Council:</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PRISM Simulation:</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: prism.bg, color: prism.color }}>{prism.label}</span>
                    </div>
                    <div className="text-xs ml-auto" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.workcells} workcell{r.workcells !== 1 ? 's' : ''} · {r.domain}</div>
                  </div>
                </div>

                {isOpen && r.status === 'live' && (
                  <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--color-a11oy-border)' }} onClick={e => e.stopPropagation()}>
                    <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Shadow Council Challenges</div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {SHADOW_CHALLENGES.map(c => (
                        <div key={c.id} className="flex items-start gap-2 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          <span style={{ color: c.result === 'blocked' ? '#22c55e' : '#22c55e' }}>{c.result === 'blocked' ? '🛡' : '✓'}</span>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.label}</div>
                            <div style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.5 }}>{c.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'new' && (
        <div className="space-y-4">
          <Card>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>New Agent Recipe</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RECIPE NAME</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Research Swarm v2.0"
                  className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
              </div>
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PARENT CONSTITUTION</label>
                <select value={newConst} onChange={e => setNewConst(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                  <option value="cst-op-cascade-2.4.0">cst-op-cascade-2.4.0</option>
                  <option value="cst-op-counsel-1.9.0">cst-op-counsel-1.9.0</option>
                  <option value="cst-op-guardian-3.0.0">cst-op-guardian-3.0.0</option>
                  <option value="cst-custom-1.0.0">cst-custom-1.0.0 (new)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PRIMARY MODEL</label>
                <select value={newModel} onChange={e => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                  style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                  <option value="GPT-5.1">GPT-5.1 (OpenAI)</option>
                  <option value="Claude 4 Opus">Claude 4 Opus (Anthropic)</option>
                  <option value="Claude 4 Sonnet">Claude 4 Sonnet (Anthropic)</option>
                  <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Google)</option>
                  <option value="Llama 4 Maverick">Llama 4 Maverick (Meta — Sovereign)</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Pre-Deploy Gate 1: Shadow Council Adversarial Review</div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              The Shadow Council runs 6 adversarial challenge classes against your Recipe before it can go live. This gate cannot be skipped.
            </p>
            <div className="grid md:grid-cols-2 gap-2 mb-4">
              {SHADOW_CHALLENGES.map(c => (
                <div key={c.id} className="p-2 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-a11oy-border)' }}>
                  <div className="font-medium mb-0.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.label}</div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>
            {shadowStep === 'idle' && (
              <button type="button" onClick={runShadow}
                className="w-full py-2 rounded text-xs font-mono transition-colors"
                style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
                Run Shadow Council Review
              </button>
            )}
            {shadowStep === 'running' && (
              <div className="py-2 text-center text-xs font-mono animate-pulse" style={{ color: GOLD }}>Running 6 adversarial challenges…</div>
            )}
            {shadowStep === 'done' && shadowPassed && (
              <div className="py-2 text-center text-xs font-mono" style={{ color: '#22c55e' }}>✓ Shadow Council Review PASSED — all 6 challenges blocked</div>
            )}
          </Card>

          <Card>
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Pre-Deploy Gate 2: Decision-Twin PRISM Simulation</div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              PRISM replays this Recipe against 500 historical decisions. Recipes that score below 88% alignment are blocked from deployment.
            </p>
            {prismStep === 'idle' && (
              <button type="button" onClick={runPrism} disabled={!shadowPassed}
                className="w-full py-2 rounded text-xs font-mono transition-colors"
                style={{ background: shadowPassed ? 'rgba(167,139,250,0.08)' : 'rgba(94,94,94,0.08)', color: shadowPassed ? '#a78bfa' : '#5e5e5e', border: `1px solid ${shadowPassed ? 'rgba(167,139,250,0.2)' : 'var(--color-a11oy-border)'}`, cursor: shadowPassed ? 'pointer' : 'not-allowed' }}>
                {shadowPassed ? 'Run Decision-Twin PRISM Simulation' : 'Complete Shadow Council first'}
              </button>
            )}
            {prismStep === 'running' && (
              <div className="py-2 text-center text-xs font-mono animate-pulse" style={{ color: '#a78bfa' }}>Simulating 500 historical decisions…</div>
            )}
            {prismStep === 'done' && prismPassed && (
              <div className="py-2 text-center text-xs font-mono" style={{ color: '#22c55e' }}>✓ PRISM Simulation PASSED — 96.4% alignment score (threshold: 88%)</div>
            )}
          </Card>

          {shadowPassed && prismPassed && (
            <button type="button"
              className="w-full py-3 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
              ✓ Both Gates Passed — Deploy Recipe to Workcells
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
