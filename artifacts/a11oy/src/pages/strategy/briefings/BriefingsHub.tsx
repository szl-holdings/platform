import { Link } from 'wouter';
import { Layout } from '../../../components/layout';
import { PageHeader, Card, KpiCard } from '../../../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;
const GOLD = '#c9b787';

const BRIEFING_SURFACES = [
  { id: 'today', icon: '📰', label: "Today's Brief", desc: 'AI-curated daily intelligence digest — signals, risks, decisions, and Covenant Lift summary.', path: '/strategy/briefings/today', status: 'LIVE' },
  { id: 'engine', icon: '⚡', label: 'Briefing Engine', desc: 'Configure automated brief cadence, signal sources, and AI synthesis parameters.', path: '/strategy/briefings/engine', status: 'LIVE' },
  { id: 'custom', icon: '✏', label: 'Custom Brief', desc: 'Author an ad hoc intelligence brief with AI assistance. Export to PDF or share securely.', path: '/strategy/briefings/custom', status: 'LIVE' },
  { id: 'library', icon: '📚', label: 'Brief Library', desc: 'Searchable archive of all published briefs. Filter by domain, author, or date range.', path: '/strategy/briefings/library', status: 'LIVE' },
  { id: 'watchlist', icon: '👁', label: 'Watchlist', desc: 'Entities, signals, and thresholds you are actively monitoring. Alerts surface in Today\'s Brief.', path: '/strategy/briefings/watchlist', status: 'LIVE' },
  { id: 'confidence', icon: '📊', label: 'Confidence Dashboard', desc: 'Source reliability, citation verification scores, and AI confidence calibration over time.', path: '/strategy/briefings/confidence', status: 'LIVE' },
  { id: 'dissent', icon: '⚖', label: 'Dissent Channel', desc: 'Record formal disagreements with agent assessments. Dissents are linked to the Proof Chain and reviewed in alignment audits.', path: '/strategy/briefings/dissent', status: 'LIVE' },
  { id: 'cockpit', icon: '🖥', label: 'Governed Cockpit', desc: 'Full-screen executive briefing mode with approval gates for time-sensitive decisions surfaced in briefs.', path: '/strategy/briefings/cockpit', status: 'LIVE' },
];

const RECENT_BRIEFS = [
  { id: 'br-1', title: 'Maritime Risk Digest — May 5', date: '2026-05-05T06:00Z', domain: 'Maritime', signals: 14, decisions: 3, lift: 42000 },
  { id: 'br-2', title: 'Legal Matter Digest — May 5', date: '2026-05-05T06:00Z', domain: 'Legal', signals: 8, decisions: 2, lift: 125000 },
  { id: 'br-3', title: 'Weekly Strategic Review — May 4', date: '2026-05-04T18:00Z', domain: 'Strategy', signals: 28, decisions: 7, lift: 195000 },
  { id: 'br-4', title: 'Security NOC Brief — May 4', date: '2026-05-04T12:00Z', domain: 'Security', signals: 42, decisions: 12, lift: 280000 },
];

export function BriefingsHub() {
  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS"
        title="Intelligence Briefings"
        subtitle="AI-curated intelligence digests across all domains. Powered by the Briefing Engine — which ingests signals, verifies citations, and synthesizes governance-aware briefs. Pulse is now here."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="BRIEFS TODAY" value="4" sub="published" accent={GOLD} />
        <KpiCard label="SIGNALS PROCESSED" value="92" sub="today" accent={GOLD} />
        <KpiCard label="DECISIONS IN BRIEFS" value="24" sub="today" accent={GOLD} />
        <KpiCard label="COVENANT LIFT $" value="$642k" sub="from brief-driven decisions" accent="#22c55e" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {BRIEFING_SURFACES.map(s => (
          <Link key={s.id} href={b(s.path)}>
            <a className="block rounded-lg border p-4 cursor-pointer transition-colors hover:border-[rgba(201,183,135,0.3)] hover:bg-[rgba(201,183,135,0.03)]"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="font-medium text-xs mb-1" style={{ color: GOLD }}>{s.label}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.desc}</p>
            </a>
          </Link>
        ))}
      </div>

      <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Recent Briefs</div>
      <div className="space-y-2">
        {RECENT_BRIEFS.map(br => (
          <div key={br.id} className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{br.title}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{br.domain} · {new Date(br.date).toLocaleTimeString()}</div>
              </div>
              <div className="text-right text-xs">
                <div style={{ color: '#22c55e' }}>+${br.lift.toLocaleString()} lift</div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{br.signals} signals · {br.decisions} decisions</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Briefings absorbs the Pulse standalone app (preview path /pulse/). Pulse's signal ingestion, confidence scoring, and digest format are preserved. Governance gates and Covenant Lift $ attribution are A11oy additions.
      </div>
    </Layout>
  );
}
