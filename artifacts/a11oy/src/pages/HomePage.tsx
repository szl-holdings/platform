import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';

interface NowData {
  signals?: number;
  activeOutcomes?: number;
  pendingActions?: number;
  fabricStatus?: string;
}

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

const FABRIC_API_BASE = (import.meta.env.VITE_FABRIC_API_BASE as string | undefined) ?? '/api/a11oy';
function getApiUrl(path: string): string {
  return `${FABRIC_API_BASE}${path}`;
}

function useLiveData() {
  const [data, setData] = useState<NowData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(getApiUrl('/now'))
      .then(r => r.json())
      .then(json => {
        if (json?.data) setData(json.data);
        else setData({ signals: json.signals ?? 30, activeOutcomes: json.activeOutcomes ?? 5 });
      })
      .catch(() => {
        setError(true);
        setData({ signals: 30, activeOutcomes: 5, pendingActions: 5, fabricStatus: 'demo' });
      });
  }, []);

  return { data, error };
}

export function HomePage() {
  const { data } = useLiveData();

  return (
    <Layout>
      <HeroSection data={data} />
      <PhilosophySection />
      <FabricSection />
      <ProofSection />
      <CtaSection />
    </Layout>
  );
}

function HeroSection({ data }: { data: NowData | null }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8 border"
          style={{
            backgroundColor: 'var(--color-a11oy-card)',
            borderColor: 'var(--color-a11oy-blue)',
            color: 'var(--color-a11oy-blue)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-a11oy-blue)' }}
          />
          {data ? (
            <span>{data.signals ?? '—'} live signals · {data.activeOutcomes ?? '—'} active outcomes</span>
          ) : (
            <span>Live Enterprise Execution Fabric — Phase 1 Foundation</span>
          )}
        </div>

        <h1
          className="font-display font-semibold tracking-tight mb-6 leading-none"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--color-a11oy-text)' }}
        >
          BUSINESS AT THE
          <br />
          <span style={{ color: 'var(--color-a11oy-blue)' }}>SPEED OF NOW</span>
        </h1>

        <p
          className="text-lg max-w-2xl mx-auto mb-4 leading-relaxed"
          style={{ color: 'var(--color-a11oy-text-sub)' }}
        >
          A11oy is the Live Enterprise Execution Fabric. It senses, structures, correlates, explains,
          recommends, approves, executes, verifies, and preserves proof — in real time, with
          cryptographic accountability at every step.
        </p>

        <p
          className="text-sm max-w-xl mx-auto mb-10"
          style={{ color: 'var(--color-a11oy-text-ghost)' }}
        >
          Not an automation tool. Not a workflow builder. A governed, reasoning layer between
          your data and your decisions — for enterprises where the cost of a wrong move is real.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={`${BASE}/command`}
            className="px-6 py-3 rounded font-medium text-sm transition-all"
            style={{ backgroundColor: 'var(--color-a11oy-blue)', color: 'white', textDecoration: 'none' }}
          >
            Open Command Surface
          </a>
          <a
            href={`${BASE}/fabric`}
            className="px-6 py-3 rounded font-medium text-sm border transition-all"
            style={{
              borderColor: 'var(--color-a11oy-border)',
              color: 'var(--color-a11oy-text-sub)',
              textDecoration: 'none',
              backgroundColor: 'transparent',
            }}
          >
            Explore the Fabric
          </a>
        </div>

        {data && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <StatPill label="Live Signals" value={data.signals ?? '—'} />
            <StatPill label="Active Outcomes" value={data.activeOutcomes ?? '—'} />
            <StatPill label="Pending Actions" value={data.pendingActions ?? '—'} />
            <StatPill label="Fabric Status" value={data.fabricStatus ?? 'operational'} isText />
          </div>
        )}
      </div>
    </section>
  );
}

function StatPill({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="text-center">
      <div
        className="text-2xl font-display font-semibold"
        style={{ color: isText ? 'var(--color-a11oy-ok)' : 'var(--color-a11oy-blue)' }}
      >
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{label}</div>
    </div>
  );
}

function PhilosophySection() {
  return (
    <section
      className="border-y py-16"
      style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-deep)' }}
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <p
          className="text-xl leading-relaxed font-display"
          style={{ color: 'var(--color-a11oy-text)', fontWeight: 400 }}
        >
          The enterprise does not need another dashboard. It needs a fabric that{' '}
          <em style={{ color: 'var(--color-a11oy-blue)', fontStyle: 'normal', fontWeight: 500 }}>acts</em>{' '}
          — that senses signals across every domain, understands their cause, recommends governed
          responses, executes them with human approval, and proves it did so correctly.
        </p>
        <p
          className="mt-6 text-sm leading-relaxed"
          style={{ color: 'var(--color-a11oy-text-sub)' }}
        >
          Every action A11oy takes carries a Proof-Carrying Execution contract — a cryptographic
          chain of custody from the originating signal through causal reasoning, policy evaluation,
          approval, and verified execution. Not for compliance theater. For operational certainty.
        </p>
      </div>
    </section>
  );
}

function FabricSection() {
  const layers = [
    { label: 'Coverage Graph', desc: 'Maps which business domains are sensed and how completely', icon: '◎' },
    { label: 'Signal Mesh', desc: 'Ingests and routes business signals across all seven verticals', icon: '⬡' },
    { label: 'State Engine', desc: 'Maintains authoritative current state of the enterprise', icon: '△' },
    { label: 'Causal Core', desc: 'Explains why states changed and correlates cause-effect chains', icon: '⟳' },
    { label: 'Action Rail', desc: 'Recommends and queues governed actions with approval gates', icon: '→' },
    { label: 'Covenant Layer', desc: 'Evaluates every action against policy before any execution', icon: '◇' },
    { label: 'Proof Ledger', desc: 'Records immutable cryptographic proof of every decision', icon: '◈' },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div
            className="text-xs font-mono mb-3"
            style={{ color: 'var(--color-a11oy-gold)' }}
          >
            THE SEVEN-LAYER FABRIC
          </div>
          <h2
            className="text-3xl font-display font-semibold"
            style={{ color: 'var(--color-a11oy-text)' }}
          >
            Every Layer. Every Decision. On Record.
          </h2>
          <p
            className="mt-3 text-sm max-w-xl mx-auto"
            style={{ color: 'var(--color-a11oy-text-sub)' }}
          >
            A11oy's fabric is not a stack of tools. It is a single, coherent execution layer
            where each stage is accountable to the next.
          </p>
        </div>

        <div className="grid gap-3">
          {layers.map((layer, i) => (
            <div
              key={layer.label}
              className="flex items-start gap-4 p-4 rounded-lg border transition-all"
              style={{
                backgroundColor: 'var(--color-a11oy-card)',
                borderColor: 'var(--color-a11oy-border)',
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center font-mono text-sm flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: 'var(--color-a11oy-muted)',
                  color: 'var(--color-a11oy-blue)',
                }}
              >
                {i + 1}
              </div>
              <div>
                <div
                  className="font-display font-medium text-sm mb-0.5"
                  style={{ color: 'var(--color-a11oy-text)' }}
                >
                  {layer.label}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  {layer.desc}
                </div>
              </div>
              <div
                className="ml-auto font-mono text-lg flex-shrink-0"
                style={{ color: 'var(--color-a11oy-border)' }}
              >
                {layer.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section
      className="border-t py-20 px-6"
      style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-deep)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="text-xs font-mono mb-3"
              style={{ color: 'var(--color-a11oy-gold)' }}
            >
              PROOF-CARRYING EXECUTION
            </div>
            <h2
              className="text-3xl font-display font-semibold mb-4"
              style={{ color: 'var(--color-a11oy-text)' }}
            >
              Every Action. Proven.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              In A11oy, no action executes without a Proof-Carrying Execution contract. Every contract
              traces the cryptographic chain from originating signal through causal analysis, policy
              evaluation, human approval, and verified execution outcome.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              The Proof Ledger is the board-level audit trail your governance function has been asking for —
              not a compliance checkbox, but a structural guarantee that what was decided matches
              what was done.
            </p>
          </div>
          <div
            className="rounded-lg border p-5 font-mono text-xs"
            style={{
              backgroundColor: 'var(--color-a11oy-card)',
              borderColor: 'var(--color-a11oy-border)',
              color: 'var(--color-a11oy-text-sub)',
              lineHeight: 1.8,
            }}
          >
            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>// ProofCarryingExecutionContract</div>
            <div className="mt-2">
              <span style={{ color: 'var(--color-a11oy-blue)' }}>originSignal</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span style={{ color: 'var(--color-a11oy-gold)' }}>"sig-lyte-002"</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-a11oy-blue)' }}>causalChain</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span>4 links verified</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-a11oy-blue)' }}>policyEval</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span>pol-001 → require_approval</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-a11oy-blue)' }}>approval</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span style={{ color: 'var(--color-a11oy-ok)' }}>executive:vp-revenue ✓</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-a11oy-blue)' }}>execution</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span style={{ color: 'var(--color-a11oy-ok)' }}>completed</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-a11oy-blue)' }}>proof</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span>sha256:c9f2e5b8...</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-a11oy-blue)' }}>isVerified</span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>: </span>
              <span style={{ color: 'var(--color-a11oy-ok)' }}>true</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2
          className="text-3xl font-display font-semibold mb-4"
          style={{ color: 'var(--color-a11oy-text)' }}
        >
          The Enterprise Runs on Proof, Now.
        </h2>
        <p
          className="text-sm mb-10 leading-relaxed"
          style={{ color: 'var(--color-a11oy-text-sub)' }}
        >
          A11oy is operational across seven enterprise verticals — Revenue, Maritime, Real Estate,
          Defense, Legal, Consulting, and the Fabric itself. Phase 2 brings the full agent runtime,
          Workcell engine, and the A11oy Terminal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={`${BASE}/command`}
            className="px-6 py-3 rounded font-medium text-sm transition-all"
            style={{ backgroundColor: 'var(--color-a11oy-blue)', color: 'white', textDecoration: 'none' }}
          >
            Open Command Surface
          </a>
          <a
            href={`${BASE}/fabric`}
            className="px-6 py-3 rounded font-medium text-sm border transition-all"
            style={{
              borderColor: 'var(--color-a11oy-border)',
              color: 'var(--color-a11oy-text-sub)',
              textDecoration: 'none',
            }}
          >
            Explore the Fabric →
          </a>
        </div>
      </div>
    </section>
  );
}
