import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;
const GOLD = '#c9b787';

const ANNOUNCEMENT_DATE = 'May 5, 2026';

const CHANGES = [
  {
    category: 'NEW',
    color: '#22c55e',
    items: [
      { title: 'Agent Foundry', desc: 'The consolidated workspace for provisioning, deploying, and governing AI agents. Replaces Model Router (PRAXIS), Constitution editor (Lyte), Key manager (Command), and Covenant Lift (scattered). One surface: Constitution → Agent Recipe → Workcell.', path: '/foundry' },
      { title: 'Primitives Section', desc: 'PRAXIS capabilities — Research Swarm, Memory Fabric, Protocol Bridge, Skills Library, Cross-App Orchestrator, Tokens Governance — ported to A11oy brand and governance model.', path: '/primitives' },
      { title: 'Decisions Expansion', desc: 'Decision Intelligence expanded with Decision-Twin PRISM, Autonomy Modes, Entity Knowledge Graph, Workflow Health, and a Sentient Layer. Lyte Dashboard and ROI Lens now live here.', path: '/decisions' },
      { title: 'Strategy → Briefings', desc: 'Pulse signal digest and briefing engine moved under Strategy. Eight briefing sub-surfaces: Today\'s Brief, Engine, Custom, Library, Watchlist, Confidence, Dissent Channel, Governed Cockpit.', path: '/strategy/briefings' },
      { title: 'Trust Hub', desc: 'Dedicated top-level Trust section aggregating Proof Chain, Covenant Lift $, Shadow Council, PRISM, Doctrine, Welfare, Transparency Report, and Zero-Trust Layer.', path: '/trust' },
    ],
  },
  {
    category: 'NAVIGATION',
    color: GOLD,
    items: [
      { title: 'New Top-Level IA', desc: 'Navigation restructured to 8 sections: Foundry · Strategy · Operations · Infrastructure · Decisions · Primitives · Doctrine · Trust. Mirrors the A11oy governance model.', path: '/' },
      { title: 'Foundry in Sidebar', desc: 'Agent Foundry surfaces (Catalog, Provision, Deployments, Workcells, Keys, Sovereign Mode, Monitoring, Quickstarts) now accessible from the Foundry sidebar group.', path: '/foundry' },
      { title: 'Primitives in Sidebar', desc: 'New Primitives sidebar group with all 6 PRAXIS primitives linked directly.', path: '/primitives' },
      { title: 'Trust in Sidebar', desc: 'New Trust sidebar group linking all trust surfaces in one place.', path: '/trust' },
    ],
  },
  {
    category: 'DEPRECATIONS',
    color: '#8a8a8a',
    items: [
      { title: 'PRAXIS (/nexus/) → Deprecated', desc: 'PRAXIS now shows a deprecation splash redirecting to A11oy Primitives. All capabilities are preserved under /primitives/*.', path: '/primitives' },
      { title: 'Lyte (/lyte/) → Deprecated', desc: 'Lyte Command Center now shows a deprecation splash. Dashboard → /decisions, DeepDive → /decisions/twin, ROI Lens → /decisions/workflow-health.', path: '/decisions' },
      { title: 'Unified Command (/command/) → Deprecated', desc: 'Command capabilities fully migrated. Policy Manager → /foundry/keys. Executive briefings → /strategy. Operations → /operations.', path: '/strategy' },
      { title: 'Pulse (/pulse/) → Deprecated', desc: 'Pulse signal digest migrated to Strategy → Briefings. Signal sources, confidence scoring, and Dissent Channel are all preserved.', path: '/strategy/briefings' },
    ],
  },
  {
    category: 'ARCHITECTURE',
    color: '#a78bfa',
    items: [
      { title: 'Three-Level Agent Hierarchy', desc: 'Constitution → Agent Recipe → Workcell. Every governed AI asset is traceable from its behavioral contract through its deployment instances.', path: '/foundry' },
      { title: 'Covenant Lift $ Unified', desc: 'Harm-avoided dollar accounting is now the universal metric across Foundry, Monitoring, Decisions, and Briefings. One ledger, all surfaces.', path: '/foundry/monitoring' },
      { title: 'Cross-Protocol Correlation IDs', desc: 'Every agent call — REST, A2A, ACP, MCP, ANP — receives a unified correlation ID in format a11oy-wc-<cell>:<seq>. End-to-end tracing across protocol boundaries.', path: '/foundry/monitoring' },
      { title: 'Shadow Council + PRISM as Non-Negotiable Gates', desc: 'Pre-deploy gates are now enforced platform-wide. No Recipe can go live without both Shadow Council adversarial review and PRISM simulation passing.', path: '/foundry/deployments' },
    ],
  },
];

export function WhatsNew() {
  return (
    <Layout>
      <PageHeader
        label={`WHAT'S NEW · ${ANNOUNCEMENT_DATE}`}
        title="Agent Foundry Consolidation"
        subtitle="PRAXIS, Lyte Command Center, Unified Command, and Pulse are now consolidated into A11oy as the Agent Foundry. New navigation, new primitives, expanded decisions, unified Covenant Lift $."
        status="LIVE"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Apps Consolidated', value: '4', desc: 'PRAXIS · Lyte · Command · Pulse', color: GOLD },
          { label: 'New Pages Built', value: '40+', desc: 'Across all 8 sections', color: GOLD },
          { label: 'New Nav Sections', value: '8', desc: 'Foundry → Trust', color: GOLD },
          { label: 'Zero Capabilities Lost', value: '✓', desc: 'All ported and expanded', color: '#22c55e' },
        ].map(m => (
          <div key={m.label} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {CHANGES.map(section => (
          <div key={section.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-a11oy-border)' }} />
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${section.color}18`, color: section.color }}>{section.category}</span>
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-a11oy-border)' }} />
            </div>
            <div className="space-y-3">
              {section.items.map(item => (
                <Link key={item.title} href={b(item.path)}>
                  <a className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:border-[rgba(201,183,135,0.3)]"
                    style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded mt-0.5 shrink-0" style={{ backgroundColor: `${section.color}18`, color: section.color }}>→</span>
                    <div>
                      <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{item.title}</div>
                      <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Migration Note</div>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          Visiting any of the deprecated app URLs (<span className="font-mono" style={{ color: GOLD }}>/nexus/</span>, <span className="font-mono" style={{ color: GOLD }}>/lyte/</span>, <span className="font-mono" style={{ color: GOLD }}>/command/</span>, <span className="font-mono" style={{ color: GOLD }}>/pulse/</span>) now shows a deprecation splash with direct links to the new locations. No bookmarks are permanently broken — every deprecated URL maps to a specific new location documented in the splash page.
        </p>
      </Card>
    </Layout>
  );
}
