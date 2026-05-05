import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard, StatusPill } from '../../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const GOLD = '#c9b787';

const FOUNDRY_SURFACES = [
  {
    id: 'catalog',
    icon: '⬡',
    label: 'Catalog',
    desc: 'Models, tools, skills, and protocols (MCP / A2A / ACP / ANP). Filter and inspect any capability before provisioning.',
    path: '/foundry/catalog',
    status: 'LIVE' as const,
    color: GOLD,
  },
  {
    id: 'provision',
    icon: '📜',
    label: 'Provision',
    desc: 'Author a Constitution — the behavioral contract that every Agent Recipe inherits. Three-level hierarchy: Constitution → Agent Recipe → Workcell.',
    path: '/foundry/provision',
    status: 'LIVE' as const,
    color: GOLD,
  },
  {
    id: 'deployments',
    icon: '🚀',
    label: 'Deployments',
    desc: 'Create Agent Recipes. Pre-deploy gates: Shadow Council adversarial review and Decision-Twin PRISM simulation must pass before any recipe goes live.',
    path: '/foundry/deployments',
    status: 'LIVE' as const,
    color: GOLD,
  },
  {
    id: 'workcells',
    icon: '⚙',
    label: 'Workcells',
    desc: 'Live running instances of Agent Recipes. Monitor status, latency, cost in tokens and in Covenant Lift $.',
    path: '/foundry/workcells',
    status: 'LIVE' as const,
    color: GOLD,
  },
  {
    id: 'keys',
    icon: '🔑',
    label: 'Keys & Auth',
    desc: 'Three auth modes: Covenant Key (scoped API keys), Identity Federation (Entra / Okta / Google Workspace), and Proof-Bound Token (SPIFFE / SVID).',
    path: '/foundry/keys',
    status: 'LIVE' as const,
    color: GOLD,
  },
  {
    id: 'sovereign',
    icon: '🛡',
    label: 'Sovereign Mode',
    desc: 'Air-gapped deployment configurator for regulated industries. No external API calls, full data residency, on-premise Proof Chain.',
    path: '/foundry/sovereign',
    status: 'LIVE' as const,
    color: '#a78bfa',
  },
  {
    id: 'monitoring',
    icon: '📊',
    label: 'Monitoring',
    desc: 'Latency, cost (tokens AND Covenant Lift $), cross-protocol correlation IDs, provider health, fallback events.',
    path: '/foundry/monitoring',
    status: 'LIVE' as const,
    color: GOLD,
  },
  {
    id: 'quickstarts',
    icon: '⚡',
    label: 'Quickstarts',
    desc: 'Branded cURL / Python / TypeScript snippets. Mirror the Microsoft Foundry doc structure but speak A11oy\'s vocabulary.',
    path: '/foundry/quickstarts',
    status: 'LIVE' as const,
    color: GOLD,
  },
];

const VS_MSFT = [
  { ours: 'Constitution', theirs: 'Deployment (config file)', why: 'Machine-readable behavioral contract ratified by alignment review, not just a settings file.' },
  { ours: 'Agent Recipe', theirs: 'Model Deployment', why: 'Bundles model + tools + skills + protocol adapters + Covenant Policy into a governed unit.' },
  { ours: 'Workcell', theirs: 'Endpoint', why: 'Live instance with Proof Chain attribution, Covenant Lift $ billing, and Shadow Council watchdog.' },
  { ours: 'Covenant Key', theirs: 'API Key', why: 'Scoped to specific domains, tools, and governance tiers — not an opaque secret.' },
  { ours: 'Identity Federation', theirs: 'Managed Identity / AAD', why: 'Supports Entra, Okta, Google Workspace — federated, not vendor-locked.' },
  { ours: 'Proof-Bound Token', theirs: '—', why: 'SPIFFE/SVID-based credential that binds identity to a specific proof chain execution.' },
  { ours: 'Covenant Lift $', theirs: 'Token spend', why: 'Bills in harm-avoided dollars, not just token count. Quantifies safety ROI.' },
  { ours: 'Shadow Council', theirs: '—', why: 'Pre-deploy adversarial review panel that must approve before a Recipe goes live.' },
  { ours: 'Decision-Twin PRISM', theirs: '—', why: 'Runs a simulation of the Agent Recipe against historical decisions before deployment.' },
  { ours: 'Sovereign Mode', theirs: 'Disconnected / Private', why: 'Full on-premise execution with air-gap verification, not just "no internet" toggle.' },
];

export function FoundryHome() {
  const [showVocab, setShowVocab] = useState(false);

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY"
        title="Provision · Deploy · Govern"
        subtitle="Where Microsoft Foundry stops at models, Agent Foundry goes further: Constitution → Agent Recipe → Workcell, three auth modes, Covenant Lift $ billing, pre-deploy Shadow Council review, and sovereign air-gapped deployments."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="CONSTITUTIONS" value="6" sub="ratified" accent={GOLD} />
        <KpiCard label="ACTIVE RECIPES" value="14" sub="deployed" accent={GOLD} />
        <KpiCard label="WORKCELLS LIVE" value="38" sub="running" accent={GOLD} />
        <KpiCard label="COVENANT LIFT $" value="$1.4M" sub="harm avoided (30d)" accent="#22c55e" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {FOUNDRY_SURFACES.map(s => (
          <Link key={s.id} href={b(s.path)}>
            <a className="block rounded-lg border p-4 cursor-pointer transition-colors hover:border-[rgba(201,183,135,0.3)] hover:bg-[rgba(201,183,135,0.03)]"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <StatusPill status={s.status} />
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: s.color }}>{s.label}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.desc}</p>
            </a>
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <button
          type="button"
          onClick={() => setShowVocab(v => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Foundry Vocabulary</div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>How Agent Foundry innovates on Microsoft Foundry</div>
          </div>
          <span className="text-xs font-mono" style={{ color: GOLD }}>{showVocab ? '↑ collapse' : '↓ expand'}</span>
        </button>

        {showVocab && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <th className="text-left py-2 pr-4 font-mono uppercase" style={{ color: GOLD }}>A11oy Concept</th>
                  <th className="text-left py-2 pr-4 font-mono uppercase" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Microsoft Foundry Equiv.</th>
                  <th className="text-left py-2 font-mono uppercase" style={{ color: 'var(--color-a11oy-text-ghost)' }}>What We Do Differently</th>
                </tr>
              </thead>
              <tbody>
                {VS_MSFT.map((row, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="py-2 pr-4 font-medium" style={{ color: GOLD }}>{row.ours}</td>
                    <td className="py-2 pr-4 font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.theirs || '—'}</td>
                    <td className="py-2" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.6 }}>{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Agent Foundry absorbs and unifies the Model Router (formerly PRAXIS), the Constitution wizard (formerly Lyte Workspace Constitution), the Keys manager (formerly Unified Command Policy Manager), and the Covenant Lift metric (formerly tracked separately). One surface, one doctrine, one ledger.
      </div>
    </Layout>
  );
}
