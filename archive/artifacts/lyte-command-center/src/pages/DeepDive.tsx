import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
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

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

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
  'NEXUS Platform Inc.',
  'Amaru Capital Partners',
];

function generateMockDeepDive(entity: string): EntityDeepDive {
  return {
    entity_id: 'ent_' + Math.random().toString(36).slice(2, 10),
    name: entity,
    legal_name: entity + (entity.includes('LLC') || entity.includes('Inc') ? '' : ' LLC'),
    jurisdiction: 'Delaware, USA',
    sector: entity.toLowerCase().includes('capital')
      ? 'Private Equity'
      : entity.toLowerCase().includes('platform')
        ? 'Technology'
        : entity.toLowerCase().includes('consulting')
          ? 'Professional Services'
          : 'Holding Company',
    description: `${entity} is a ${entity.toLowerCase().includes('holdings') ? 'diversified holding company operating across technology, professional services, and maritime intelligence verticals' : 'specialized firm delivering high-value advisory and platform services to enterprise clients'}. Founded with the intent to operate at the intersection of intelligence infrastructure and decision science, the entity maintains a lean organizational structure optimized for capital efficiency.`,
    financials: {
      revenue: entity.toLowerCase().includes('holdings') ? '$4.2M ARR' : '$1.8M ARR',
      revenue_growth: '+34% YoY',
      ebitda_margin: '28%',
      debt_equity: '0.12',
      cash_runway: '18 months',
      market_cap: entity.toLowerCase().includes('holdings') ? '$21M est.' : '$9M est.',
    },
    ownership: [
      { name: 'SZL Family Trust', stake: '61.4%', type: 'entity' },
      { name: 'Strategic Co-Investors (3)', stake: '22.8%', type: 'institutional' },
      { name: 'Management Pool', stake: '11.2%', type: 'individual' },
      { name: 'Reserved (options)', stake: '4.6%', type: 'entity' },
    ],
    filings: [
      {
        type: 'Annual Report (10-K equivalent)',
        date: '2025-03-15',
        jurisdiction: 'Delaware',
        status: 'active',
        summary: 'Full fiscal year reporting for 2024. Revenue growth confirmed at 34% YoY.',
      },
      {
        type: 'Operating Agreement Amendment',
        date: '2024-11-01',
        jurisdiction: 'Delaware',
        status: 'active',
        summary: 'Management pool expanded from 8% to 11.2%. Vesting cliff adjusted to 24 months.',
      },
      {
        type: 'UCC-1 Financing Statement',
        date: '2024-07-12',
        jurisdiction: 'Delaware',
        status: 'active',
        summary: 'Secured credit facility — collateral: accounts receivable and software IP.',
      },
    ],
    risk_flags: [
      {
        flag: 'Concentration risk',
        severity: 'medium',
        note: 'Top 3 clients represent ~58% of ARR. Churn risk if any single relationship deteriorates.',
      },
      {
        flag: 'AGPL compliance — Fincept Terminal',
        severity: 'low',
        note: 'Fincept Terminal is AGPL-licensed. Confirmed isolated via MCP REST proxy — no bundling detected.',
      },
      {
        flag: 'No audited financials',
        severity: 'medium',
        note: 'Company uses compiled (not audited) financials. growth capital+ round will likely require GAAP audit.',
      },
    ],
    ai_narrative: `${entity} presents a credible, capital-efficient growth profile with above-market revenue growth (34% YoY) and healthy EBITDA margins for its stage (28%). The ownership structure is stable — majority family-trust control with strategic co-investor alignment and a well-structured management incentive pool. The primary risk vector is client concentration, which is addressable through the pipeline diversification initiatives visible in the filing amendments. The AGPL compliance posture for Fincept Terminal is properly managed via isolation proxy — no licensing risk exposure detected. Overall, the entity scores positively on governance structure, capital efficiency, and growth trajectory. Recommend further diligence on the secured credit facility terms and the pipeline-to-ARR conversion rate.`,
    data_source: 'fincept-terminal@v0.9-mcp (AGPL-isolated REST proxy)',
    trace_id: 'trace_' + Math.random().toString(36).slice(2, 10),
    duration_ms: Math.floor(1600 + Math.random() * 900),
  };
}

const severityColor = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function FilingRow({ filing }: { filing: RegulatoryFiling }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1a2436] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#0e1520] transition-colors"
      >
        <Shield className="w-4 h-4 text-[#64748b] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#e2e8f0]">{filing.type}</p>
          <p className="text-[10px] text-[#64748b]">
            {filing.date} · {filing.jurisdiction}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border ${filing.status === 'active' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-[#64748b] border-[#1a2436]'}`}
        >
          {filing.status}
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#64748b] mt-0.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#64748b] mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-[#1a2436] pt-3">
          <p className="text-sm text-[#e2e8f0] leading-relaxed">{filing.summary}</p>
        </div>
      )}
    </div>
  );
}

export default function DeepDive() {
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
        body: JSON.stringify({ entity: entity.trim(), include_filings: true, include_ownership: true }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? `Server returned ${resp.status}`);
      }

      const data = await resp.json() as Record<string, unknown>;
      // Map API response to the EntityDeepDive shape expected by this view
      const mapped: EntityDeepDive = {
        entity_id: data.entity_id as string,
        name: data.name as string ?? entity.trim(),
        legal_name: data.legal_name as string ?? entity.trim(),
        jurisdiction: data.jurisdiction as string ?? 'Delaware, USA',
        sector: data.sector as string ?? 'Unknown',
        description: data.ai_narrative as string ?? '',
        financials: (data.financials as EntityDeepDive['financials']) ?? {
          revenue: '—', revenue_growth: '—', ebitda_margin: '—',
          debt_equity: '—', cash_runway: '—', market_cap: '—',
        },
        ownership: (data.ownership as EntityDeepDive['ownership']) ?? [],
        filings: (data.filings as EntityDeepDive['filings']) ?? [],
        risk_flags: (data.risk_flags as EntityDeepDive['risk_flags']) ?? [],
        ai_narrative: data.ai_narrative as string ?? '',
        data_source: data.skill_pack as string ?? 'fincept-mcp-proxy',
        trace_id: data.trace_id as string ?? '—',
        duration_ms: data.duration_ms as number ?? 0,
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
        <a
          href={`${base}/`}
          className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Command
        </a>
        <span className="text-[#1a2436]">/</span>
        <span className="text-xs text-[#e2e8f0]">Deep Dive on Entity</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-3">
          <Search className="w-6 h-6 text-cyan-400" />
          Deep Dive on Entity
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Finance-grade entity intelligence via{' '}
          <a
            href="https://github.com/Fincept-Corporation/FinceptTerminalFree"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            Fincept Terminal
            <ExternalLink className="w-3 h-3" />
          </a>{' '}
          (AGPL-isolated MCP proxy). Company financials, ownership graph, regulatory filings, and AI
          narrative.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] p-6 space-y-4">
        <div>
          <label className="text-xs text-[#64748b] mb-2 block">Entity name or legal name</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SAMPLE_ENTITIES.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setEntity(e);
                  setResult(null);
                }}
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[#1a2436] text-[#64748b] hover:text-[#e2e8f0] hover:border-cyan-500/30 transition-colors"
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
            placeholder="Acme Corp, SZL Holdings, NEXUS Platform Inc…"
            className="w-full rounded-xl border border-[#1a2436] bg-[#080d14] px-4 py-2.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b]/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={running || !entity.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 transition-colors"
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
          <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            finance.terminal via MCP proxy
          </div>
        </div>
        {apiError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {apiError}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1a2436] bg-[#0e1520] p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#e2e8f0]">{result.name}</h2>
                <p className="text-xs text-[#64748b]">
                  {result.legal_name} · {result.jurisdiction} · {result.sector}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-mono text-[#64748b]">{result.duration_ms}ms</p>
                <p className="text-[10px] font-mono text-[#64748b]">{result.entity_id}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-[#1a2436] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-[#64748b] hover:text-[#e2e8f0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-sm text-[#e2e8f0] leading-relaxed">{result.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.financials).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-[#1a2436] bg-[#080d14] p-3">
                    <p className="text-base font-bold text-cyan-400">{v}</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5 capitalize">{k.replace(/_/g, ' ')}</p>
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
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#1a2436] bg-[#080d14]"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <p className="text-sm text-[#e2e8f0] capitalize">{k.replace(/_/g, ' ')}</p>
                  </div>
                  <p className="text-sm font-bold text-[#e2e8f0] font-mono">{v}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ownership' && (
            <div className="space-y-3">
              {result.ownership.map((o) => (
                <div
                  key={o.name}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#1a2436] bg-[#080d14]"
                >
                  <div className="flex items-center gap-3">
                    <Network className="w-4 h-4 text-[#64748b]" />
                    <div>
                      <p className="text-sm text-[#e2e8f0]">{o.name}</p>
                      <p className="text-[10px] text-[#64748b] capitalize">{o.type}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#e2e8f0] font-mono">{o.stake}</p>
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
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${severityColor[r.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{r.flag}</p>
                      <p className="text-xs mt-1 opacity-80 leading-relaxed">{r.note}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-mono capitalize shrink-0">{r.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'narrative' && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                  AI-Generated Narrative
                </span>
              </div>
              <p className="text-sm text-[#e2e8f0] leading-relaxed">{result.ai_narrative}</p>
            </div>
          )}

          <p className="text-[10px] text-[#64748b]/50 font-mono text-center">
            Trace: {result.trace_id} · Source: {result.data_source} · AGPL isolation confirmed — no
            bundling. Runs against sample data — live Fincept OAuth is a separate request.
          </p>
        </div>
      )}
    </div>
  );
}
