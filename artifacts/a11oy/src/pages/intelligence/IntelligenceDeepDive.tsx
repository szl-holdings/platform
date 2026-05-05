import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader,
  Network,
  Search,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface FinancialMetrics {
  revenue: string;
  revenue_growth: string;
  ebitda_margin: string;
  debt_equity: string;
  cash_runway: string;
  market_cap: string;
}

interface OwnershipNode {
  name: string;
  stake: string;
  type: 'institutional' | 'individual' | 'entity';
}

interface RegulatoryFiling {
  type: string;
  date: string;
  jurisdiction: string;
  status: 'active' | 'archived';
  summary: string;
}

interface EntityDeepDive {
  entity_id: string;
  name: string;
  legal_name: string;
  jurisdiction: string;
  sector: string;
  description: string;
  financials: FinancialMetrics;
  ownership: OwnershipNode[];
  filings: RegulatoryFiling[];
  risk_flags: { flag: string; severity: 'high' | 'medium' | 'low'; note: string }[];
  ai_narrative: string;
  data_source: string;
  trace_id: string;
  duration_ms: number;
}

const SAMPLE_ENTITIES = [
  'Carlota Jo Consulting LLC',
  'SZL Holdings',
  'A11oy Platform Inc.',
  'Amaru Capital Partners',
];

const severityColor: Record<EntityDeepDive['risk_flags'][number]['severity'], string> = {
  high: 'border-[var(--color-a11oy-critical)] bg-[var(--color-a11oy-card)] text-[var(--color-a11oy-critical)]',
  medium: 'border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)] text-[var(--color-a11oy-gold)]',
  low: 'border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] text-[var(--color-a11oy-text-sub)]',
};

function FilingRow({ filing }: { filing: RegulatoryFiling }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--color-a11oy-border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--color-a11oy-surface)] transition-colors"
      >
        <Shield className="w-4 h-4 text-[var(--color-a11oy-text-ghost)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-a11oy-text)]">{filing.type}</p>
          <p className="text-[10px] text-[var(--color-a11oy-text-ghost)]">
            {filing.date} · {filing.jurisdiction}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border ${
            filing.status === 'active'
              ? 'text-[var(--color-a11oy-gold)] border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)]'
              : 'text-[var(--color-a11oy-text-ghost)] border-[var(--color-a11oy-border)]'
          }`}
        >
          {filing.status}
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-a11oy-text-ghost)] mt-0.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--color-a11oy-text-ghost)] mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-[var(--color-a11oy-border)] pt-3">
          <p className="text-sm text-[var(--color-a11oy-text)] leading-relaxed">{filing.summary}</p>
        </div>
      )}
    </div>
  );
}

export function IntelligenceDeepDive() {
  const [entity, setEntity] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EntityDeepDive | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'financials' | 'ownership' | 'filings' | 'risks' | 'narrative'
  >('overview');

  async function handleRun() {
    if (!entity.trim() || running) return;
    setRunning(true);
    setResult(null);
    setApiError(null);

    try {
      const resp = await fetch('/api/praxis-tools/finance-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: entity.trim(),
          include_filings: true,
          include_ownership: true,
        }),
      });

      if (!resp.ok) {
        const errBody = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? `Server returned ${resp.status}`);
      }

      const data = (await resp.json()) as Record<string, unknown>;
      const mapped: EntityDeepDive = {
        entity_id: (data.entity_id as string) ?? 'ent_unknown',
        name: (data.name as string) ?? entity.trim(),
        legal_name: (data.legal_name as string) ?? entity.trim(),
        jurisdiction: (data.jurisdiction as string) ?? 'Delaware, USA',
        sector: (data.sector as string) ?? 'Unknown',
        description: (data.ai_narrative as string) ?? '',
        financials:
          (data.financials as EntityDeepDive['financials']) ?? {
            revenue: '—',
            revenue_growth: '—',
            ebitda_margin: '—',
            debt_equity: '—',
            cash_runway: '—',
            market_cap: '—',
          },
        ownership: (data.ownership as EntityDeepDive['ownership']) ?? [],
        filings: (data.filings as EntityDeepDive['filings']) ?? [],
        risk_flags: (data.risk_flags as EntityDeepDive['risk_flags']) ?? [],
        ai_narrative: (data.ai_narrative as string) ?? '',
        data_source: (data.skill_pack as string) ?? 'fincept-mcp-proxy',
        trace_id: (data.trace_id as string) ?? '—',
        duration_ms: (data.duration_ms as number) ?? 0,
      };

      setResult(mapped);
      setActiveTab('overview');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Deep dive failed — please try again.');
    } finally {
      setRunning(false);
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'financials', label: 'Financials' },
    { key: 'ownership', label: 'Ownership' },
    { key: 'filings', label: 'Filings' },
    { key: 'risks', label: 'Risk Flags' },
    { key: 'narrative', label: 'AI Narrative' },
  ] as const;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href={`${base}/intelligence`}
          className="flex items-center gap-1 text-xs text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Intelligence
        </Link>
        <span className="text-[var(--color-a11oy-border)]">/</span>
        <span className="text-xs text-[var(--color-a11oy-text)]">Entity Deep Dive</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)] flex items-center gap-3">
          <Search className="w-6 h-6 text-[var(--color-a11oy-gold)]" />
          Entity Deep Dive
        </h1>
        <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1">
          Finance-grade entity intelligence via{' '}
          <a
            href="https://github.com/Fincept-Corporation/FinceptTerminalFree"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-a11oy-gold)] hover:underline inline-flex items-center gap-1"
          >
            Fincept Terminal
            <ExternalLink className="w-3 h-3" />
          </a>{' '}
          (AGPL-isolated MCP proxy). Company financials, ownership graph, regulatory filings, and AI
          narrative.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-6 space-y-4">
        <div>
          <label className="text-xs text-[var(--color-a11oy-text-ghost)] mb-2 block">
            Entity name or legal name
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SAMPLE_ENTITIES.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setEntity(e);
                  setResult(null);
                }}
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)] hover:border-[var(--color-a11oy-gold-dim)] transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="Acme Corp, SZL Holdings, A11oy Platform Inc…"
            className="w-full rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)] px-4 py-2.5 text-sm text-[var(--color-a11oy-text)] placeholder:text-[var(--color-a11oy-text-ghost)] focus:outline-none focus:ring-2 focus:ring-[var(--color-a11oy-gold-dim)] font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={running || !entity.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--color-a11oy-gold)] text-[var(--color-a11oy-navy)] text-sm font-semibold hover:bg-[var(--color-a11oy-gold-dim)] disabled:opacity-40 transition-colors"
          >
            {running ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Querying Fincept Terminal…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Run Deep Dive
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-a11oy-text-ghost)] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-gold)]" />
            finance.terminal via MCP proxy
          </div>
        </div>
        {apiError && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'rgba(245,245,245,0.2)', color: 'var(--color-a11oy-critical)' }}
          >
            {apiError}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-a11oy-gold-glow)] border border-[var(--color-a11oy-gold-dim)] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[var(--color-a11oy-gold)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-a11oy-text)]">{result.name}</h2>
                <p className="text-xs text-[var(--color-a11oy-text-ghost)]">
                  {result.legal_name} · {result.jurisdiction} · {result.sector}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
                  {result.duration_ms}ms
                </p>
                <p className="text-[10px] font-mono text-[var(--color-a11oy-text-ghost)]">
                  {result.entity_id}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-[var(--color-a11oy-border)] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--color-a11oy-gold)] text-[var(--color-a11oy-gold)]'
                    : 'border-transparent text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-a11oy-text)] leading-relaxed">
                {result.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.financials).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)] p-3"
                  >
                    <p className="text-base font-semibold text-[var(--color-a11oy-gold)]">{v}</p>
                    <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] mt-0.5 capitalize">
                      {k.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-3">
              {Object.entries(result.financials).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)]"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-[var(--color-a11oy-gold)]" />
                    <p className="text-sm text-[var(--color-a11oy-text)] capitalize">
                      {k.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-a11oy-text)] font-mono">{v}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ownership' && (
            <div className="space-y-3">
              {result.ownership.map((o) => (
                <div
                  key={o.name}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-navy)]"
                >
                  <div className="flex items-center gap-3">
                    <Network className="w-4 h-4 text-[var(--color-a11oy-text-ghost)]" />
                    <div>
                      <p className="text-sm text-[var(--color-a11oy-text)]">{o.name}</p>
                      <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] capitalize">
                        {o.type}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-a11oy-text)] font-mono">
                    {o.stake}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'filings' && (
            <div className="space-y-3">
              {result.filings.map((f, i) => (
                <FilingRow key={i} filing={f} />
              ))}
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-3">
              {result.risk_flags.map((r, i) => (
                <div key={i} className={`rounded-xl border p-4 ${severityColor[r.severity]}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{r.flag}</p>
                      <p className="text-xs mt-1 opacity-80 leading-relaxed">{r.note}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-mono capitalize shrink-0">
                      {r.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'narrative' && (
            <div className="rounded-2xl border border-[var(--color-a11oy-gold-dim)] bg-[var(--color-a11oy-gold-glow)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-[var(--color-a11oy-gold)]" />
                <span className="text-xs font-semibold text-[var(--color-a11oy-gold)] uppercase tracking-widest">
                  AI-Generated Narrative
                </span>
              </div>
              <p className="text-sm text-[var(--color-a11oy-text)] leading-relaxed">
                {result.ai_narrative}
              </p>
            </div>
          )}

          <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] font-mono text-center">
            Trace: {result.trace_id} · Source: {result.data_source} · AGPL isolation confirmed — no
            bundling. Sample data unless live Fincept OAuth is provisioned.
          </p>
        </div>
      )}
    </div>
  );
}
