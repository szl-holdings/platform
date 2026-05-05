import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;
const GOLD = '#c9b787';

const PRIMITIVES = [
  { id: 'research-swarm', icon: '🔬', label: 'Parallel Research Swarm', desc: 'Multi-agent research with gatherer, peer-reviewer, drafter, and verifier lanes. Runs in parallel; results merged and cited.', path: '/primitives/research-swarm', from: 'PRAXIS' },
  { id: 'memory-fabric', icon: '🧠', label: 'Memory Fabric', desc: 'Four-tier memory: working (task-scoped), session (conversation), episodic (event-based), semantic (long-term knowledge). Persistent across Workcell runs.', path: '/primitives/memory-fabric', from: 'PRAXIS' },
  { id: 'protocol-bridge', icon: '🌉', label: 'Universal Protocol Bridge', desc: 'Live call tester for MCP, A2A, ACP, and ANP. Connect any tool or agent protocol with a single unified adapter layer.', path: '/primitives/protocol-bridge', from: 'PRAXIS' },
  { id: 'skills-library', icon: '📚', label: 'Skills Library', desc: '50+ adapted primitive skills — Skill, Hook, Command, Agent, MemorySchema, RAGStrategy, Tool. Each shows original-vs-A11oy diff.', path: '/primitives/skills-library', from: 'PRAXIS' },
  { id: 'orchestrator', icon: '🕸', label: 'Cross-App Orchestrator', desc: 'Routes tasks across multiple A11oy agents with ExplainPanel attribution. Shows which agent handled which step and why.', path: '/primitives/orchestrator', from: 'PRAXIS' },
  { id: 'tokens-governance', icon: '🔐', label: 'Tokens Governance', desc: 'Manage and audit Proof-Bound Tokens, Covenant Keys, and protocol credentials. Full rotation history and revocation audit.', path: '/primitives/tokens-governance', from: 'PRAXIS' },
];

export function PrimitivesHub() {
  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES"
        title="A11oy Primitives"
        subtitle="The foundational building blocks of the A11oy platform — ported and normalized from PRAXIS. Each primitive is a reusable capability available to any Agent Recipe."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <KpiCard label="PRIMITIVES" value="6" sub="categories" accent={GOLD} />
        <KpiCard label="SKILLS" value="50+" sub="in library" accent={GOLD} />
        <KpiCard label="PROTOCOLS" value="4" sub="MCP/A2A/ACP/ANP" accent="#22c55e" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PRIMITIVES.map(p => (
          <Link key={p.id} href={b(p.path)}>
            <a className="block rounded-lg border p-4 cursor-pointer transition-colors hover:border-[rgba(201,183,135,0.3)] hover:bg-[rgba(201,183,135,0.03)]"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="font-medium text-sm mb-1" style={{ color: GOLD }}>{p.label}</div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.desc}</p>
              <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Provenance: <span style={{ color: GOLD }}>{p.from}</span>
              </div>
            </a>
          </Link>
        ))}
      </div>

      <Card>
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>About Primitives</div>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Primitives were originally built in PRAXIS (preview path <span className="font-mono" style={{ color: GOLD }}>/nexus/</span>). They have been ported and normalized to A11oy's brand tokens, shell conventions, and governance model. PRAXIS now shows a deprecation splash linking here.
        </p>
      </Card>
    </Layout>
  );
}
