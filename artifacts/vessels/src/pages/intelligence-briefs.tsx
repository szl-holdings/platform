import { InlineFeedbackBar } from '@szl-holdings/shared-ui/outcome-feedback';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Loader2,
  Shield,
  Ship,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { consumeBriefSignal, getAutonomousSignal } from '../lib/briefSignal';

const BRIEFS = [
  {
    id: 'IB-0047',
    title: 'Strait of Hormuz: Elevated Iranian Naval Activity',
    type: 'Geopolitical',
    severity: 'Critical',
    generatedAt: '2026-04-14 09:22 UTC',
    triggerSignal: 'Disruption Forecast Engine — 84% probability spike',
    affectedVessels: 147,
    dollarImpact: '$2.4B cargo at risk',
    timeframe: 'Next 18–72 hours',
    affected: [
      'Commodity traders: crude long positions in Asian delivery',
      'Tanker charterers with Hormuz transit in 72h window',
      'P&I clubs with VLCC exposure in Persian Gulf',
      'OFAC compliance teams — potential sanctions proximity',
    ],
    situation:
      'Iranian Revolutionary Guard Corps (IRGC) has announced naval exercises covering transit corridor in the Strait of Hormuz (26.0°N–26.8°N, 55.5°E–56.5°E). 147 commercial vessels currently within or approaching the affected zone, including 89 crude oil tankers with aggregate cargo value of ~$1.9B. Three VLCCs have deviated from planned routes in last 6 hours.',
    impact:
      'Potential disruption to ~18.4 MB/day of crude throughput. Insurance war risk premiums have risen 2.3 percentage points in last 24h. Earliest viable alternative routing via Strait of Malacca adds 11 days to voyage time for India-bound traffic, with estimated cost uplift of $280K–$480K per voyage.',
    recommendations: [
      'Reroute vessels departing in next 36h via Cape of Good Hope or hold in UAE anchorage pending signal clarity',
      'Immediately engage war risk underwriters — existing policies may require voyage warranties',
      'Activate UKMTO Maritime Security Communications with Traders (MSCWT) reporting',
      'Compliance teams should verify no vessel has received Iranian boarding — document all communications',
    ],
    sources: [
      'Helmsman AI (AIS deviation analysis)',
      'Disruption Forecast Engine',
      "Lloyd's Market Association Joint War Committee",
    ],
  },
  {
    id: 'IB-0046',
    title: 'Black Sea Grain Corridor: 30-Day Window — Arbitrage Signal',
    type: 'Market Move',
    severity: 'High',
    generatedAt: '2026-04-14 06:14 UTC',
    triggerSignal: 'Trade Flow Heatmap — Grain volume anomaly +82%',
    affectedVessels: 41,
    dollarImpact: '$340M arbitrage opportunity identified',
    timeframe: 'Window closes in ~28 days',
    affected: [
      'Grain traders with Black Sea book positions',
      'Handymax and Supramax owners seeking spot fixtures',
      'Agriculture commodity hedge funds',
      'Black Sea port operators — Constanta, Chornomorsk, Odessa',
    ],
    situation:
      'A 30-day humanitarian corridor has reopened through the Black Sea following diplomatic negotiations. Bulk carrier bookings surged 82% in 48 hours. Current charter rates for Handymax vessels ex-Constanta are running 38% above Baltic Exchange benchmark, signaling significant demand pull. 41 vessels are currently loading or in queue.',
    impact:
      'Price arbitrage between Black Sea wheat (export-cleared) and Mediterranean benchmark is $42/MT — historically among the widest spreads in 3 years. Est. arbitrage P&L per 50,000 MT Handymax cargo: $2.1M gross. Window is short — Ukrainian authorities have indicated 30-day limit, after which corridor access subject to security review.',
    recommendations: [
      'Secure Handymax/Supramax tonnage immediately — spot market moving fast',
      'Prioritize Constanta loading queue over Chornomorsk (lower mine risk assessment)',
      'Purchase voyage insurance with Black Sea war risk rider',
      'Monitor UN Grain Deal status daily — exit plan if corridor revoked mid-voyage',
    ],
    sources: [
      'Trade Flow Heatmap AI',
      'Baltic Exchange',
      'Ukraine Ministry of Infrastructure advisory',
    ],
  },
  {
    id: 'IB-0045',
    title: 'Dark Fleet STS Transfer: Sanctioned Crude Near Kalamata',
    type: 'Sanctions',
    severity: 'Critical',
    generatedAt: '2026-04-13 22:47 UTC',
    triggerSignal: 'Dark Fleet Economics — PACIFIC MERIDIAN AIS gap analysis',
    affectedVessels: 2,
    dollarImpact: '$151M cargo + $1.2B insurance exposure',
    timeframe: 'Transfer completed — post-event analysis',
    affected: [
      'Insurance underwriters with PACIFIC MERIDIAN H&M exposure',
      'OFAC compliance — downstream cargo buyers at receiving terminal',
      'Cargo traders holding title to transferred crude',
      'Flag state (Unknown) — potential deregistration risk',
    ],
    situation:
      'PACIFIC MERIDIAN (IMO 9821045, VLCC, 300k DWT) completed a 14h 22m AIS blackout near 26.1°N 55.8°E in the Persian Gulf. Satellite imagery analysis suggests ship-to-ship transfer with KAZAN SPIRIT (sanctioned entity, OFAC SDN list). Estimated 285,000 MT crude oil transferred, cargo value ~$151M. Both vessels now showing false flag of convenience.',
    impact:
      'Any downstream buyer of cargo from KAZAN SPIRIT faces OFAC civil penalty exposure of $1.28M per violation plus potential criminal prosecution. P&I club coverage for PACIFIC MERIDIAN may be void under war risk / sanctions exclusion clause. Hull underwriters should consider policy suspension pending investigation. Cargo title chain must be traced immediately.',
    recommendations: [
      'Insurance underwriters: issue vessel alert and initiate policy review for PACIFIC MERIDIAN',
      'Compliance teams: trace cargo title chain — identify end buyer at Fujairah or Jebel Ali terminal',
      'OFAC notice filing recommended for any US-linked counterparty within 10 business days',
      'Engage maritime legal counsel — OFAC safe harbor designation may be available if voluntarily disclosed',
    ],
    sources: [
      'Dark Fleet Economics AI',
      'Helmsman AI (AIS analysis)',
      'OFAC SDN List cross-reference',
    ],
  },
  {
    id: 'IB-0044',
    title: 'LNG Spot Rate Collapse: NW Europe Overstock Signal',
    type: 'Market Move',
    severity: 'Medium',
    generatedAt: '2026-04-13 14:30 UTC',
    triggerSignal: 'Trade Flow Heatmap — LNG volume decline -4.8% + terminal booking anomaly',
    affectedVessels: 67,
    dollarImpact: '$280M unhedged exposure across 67 LNG carriers',
    timeframe: '90-day outlook',
    affected: [
      'LNG carriers on time charter with floating rate exposure',
      'US LNG exporters (Sabine Pass, Cove Point) with European book',
      'European utilities with floating price purchase agreements',
      'Short-term LNG traders with unsold cargoes',
    ],
    situation:
      'European terminal bookings declined 18% month-over-month. Spot LNG prices at TTF are contracting after a mild winter left storage facilities at 64% capacity vs historical average of 42% at this date. BLNG3 (Pacific benchmark) fell to $62,400/day from $92,100/day 90 days ago — a 32% decline. 67 LNG carriers with voyages to NW Europe are now operating at or below breakeven on Voyage P&L (see IB-0044-annex: Voyage P&L Predictor).',
    impact:
      'Charterers with floating rate exposure face aggregate shortfall of ~$280M annualized if current prices persist. Atlantic basin trade arbitrage has turned negative — rerouting to Asian spot market adds 14 days voyage time with unclear demand absorption. 12 LNG vessels may seek early redelivery from time charters in Q2 2026.',
    recommendations: [
      'Re-evaluate US Gulf LNG cargoes against Asian spot — TTF to JKM spread currently favorable',
      'Hedge time charter rate exposure with Baltic LNG derivatives for Q3',
      'Voyage P&L Predictor: run optimistic/pessimistic scenarios before committing NW Europe calls',
      'Monitor European gas storage injection — demand inflection expected by May 15 seasonal average',
    ],
    sources: [
      'Trade Flow Heatmap AI',
      'Voyage P&L Predictor',
      'Baltic Exchange BLNG3',
      'S&P Global Platts',
    ],
  },
];

const severityColors: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const typeColors: Record<string, string> = {
  Geopolitical: 'text-red-400',
  Sanctions: 'text-purple-400',
  'Market Move': 'text-emerald-400',
  Weather: 'text-[#c9b787]',
};

const typeIcons: Record<string, typeof Globe> = {
  Geopolitical: Globe,
  Sanctions: Shield,
  'Market Move': TrendingUp,
  Weather: Activity,
};

function BriefCard({ brief }: { brief: (typeof BRIEFS)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = typeIcons[brief.type] ?? Globe;

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all',
        expanded
          ? 'border-[#c9b787]/24 bg-[#0e0e0e]/90'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.08]',
      )}
    >
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
                brief.severity === 'Critical'
                  ? 'bg-red-500/5 border-red-500/15'
                  : brief.severity === 'High'
                    ? 'bg-orange-500/5 border-orange-500/15'
                    : 'bg-amber-500/5 border-amber-500/15',
              )}
            >
              <TypeIcon className={cn('w-4 h-4', typeColors[brief.type])} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[9px] font-mono text-[#6a6a6a]">{brief.id}</span>
                <Badge
                  variant="outline"
                  className={cn('text-[9px]', severityColors[brief.severity])}
                >
                  {brief.severity}
                </Badge>
                <Badge variant="outline" className="text-[9px] text-[#6a6a6a] border-white/[0.08]">
                  {brief.type}
                </Badge>
              </div>
              <p className="text-sm font-bold text-[#f5f5f5] mb-1.5">{brief.title}</p>
              <div className="flex items-center gap-4 text-[10px] text-[#8a8a8a] flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {brief.generatedAt}
                </span>
                <span className="flex items-center gap-1">
                  <Ship className="w-3 h-3" /> {brief.affectedVessels} vessels
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {brief.dollarImpact}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {brief.triggerSignal}
                </span>
              </div>
            </div>
            <ChevronRight
              className={cn(
                'w-4 h-4 text-[#5a5a5a] shrink-0 transition-transform mt-1',
                expanded && 'rotate-90',
              )}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] divide-y divide-sky-500/10">
          {/* Who is affected */}
          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Affected Parties
              </p>
              <ul className="space-y-1.5">
                {brief.affected.map((a, i) => (
                  <li key={i} className="text-xs text-[#d4c598]/60 flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-[#5a5a5a] shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-[#c9b787]/14 border border-white/[0.06] rounded-lg">
                <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">
                  Timeframe
                </p>
                <p className="text-xs text-[#e0e0e0]">{brief.timeframe}</p>
              </div>
              <div className="p-3 bg-[#c9b787]/14 border border-white/[0.06] rounded-lg">
                <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">
                  Dollar Impact Estimate
                </p>
                <p className="text-sm font-bold font-mono text-orange-400">{brief.dollarImpact}</p>
              </div>
            </div>
          </div>

          {/* Situation */}
          <div className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-2">
              Situation Summary
            </p>
            <p className="text-xs text-[#a0a08a] leading-relaxed">{brief.situation}</p>
          </div>

          {/* Impact */}
          <div className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-2">
              Financial & Operational Impact
            </p>
            <p className="text-xs text-[#a0a08a] leading-relaxed">{brief.impact}</p>
          </div>

          {/* Recommendations */}
          <div className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Recommended Actions
            </p>
            <ul className="space-y-2">
              {brief.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#e0e0e0]/70">
                  <span className="w-4 h-4 rounded-full bg-[#c9b787]/10 border border-white/[0.08] flex items-center justify-center shrink-0 text-[8px] font-bold text-[#c9b787]">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div className="px-5 py-3 bg-[#c9b787]/14">
            <p className="text-[10px] uppercase tracking-widest text-[#5a5a5a] mb-1">
              Intelligence Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {brief.sources.map((s, i) => (
                <span
                  key={i}
                  className="text-[9px] text-[#6a6a6a] px-2 py-0.5 rounded border border-white/[0.06] bg-[#c9b787]/14"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Inline feedback */}
          <div className="px-5 py-3 border-t border-white/[0.06] bg-[#c9b787]/14">
            <InlineFeedbackBar
              recommendationKey={`vessels-intel-brief-${brief.id}`}
              domain="maritime"
              recommendationText={brief.recommendations[0] ?? brief.title}
              apiBaseUrl="/api"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface GeneratedBrief {
  loading: boolean;
  content: string;
  error?: string;
}

export default function IntelligenceBriefs() {
  const [generatedBrief, setGeneratedBrief] = useState<GeneratedBrief | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(
    'Strait of Hormuz disruption assessment for crude traders',
  );
  const [autoAlert, setAutoAlert] = useState<{ source: string; query: string } | null>(null);
  const autoFiredRef = useRef(false);

  useEffect(() => {
    if (autoFiredRef.current) return;
    autoFiredRef.current = true;
    const signal = consumeBriefSignal() ?? getAutonomousSignal();
    if (signal) {
      setAutoAlert({ source: signal.source, query: signal.query });
      setSelectedTopic(signal.query.slice(0, 120));
      setGeneratedBrief({ loading: true, content: '' });
      fetch('/api/intelligence/ai/maritime-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: signal.query, context: signal.context }),
      })
        .then((r) => r.json())
        .then((data: { response?: string; result?: string }) => {
          setGeneratedBrief({
            loading: false,
            content: data.response || data.result || 'No content returned',
          });
        })
        .catch(() => {
          setGeneratedBrief({
            loading: false,
            content: '',
            error: 'Failed to generate brief — AI service unavailable',
          });
        });
    }
  }, []);

  const criticalCount = BRIEFS.filter((b) => b.severity === 'Critical').length;
  const highCount = BRIEFS.filter((b) => b.severity === 'High').length;

  const generateBrief = async () => {
    setGeneratedBrief({ loading: true, content: '' });
    try {
      const res = await fetch('/api/intelligence/ai/maritime-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Generate a structured maritime intelligence brief for: ${selectedTopic}. Include: situation summary, affected parties, dollar impact estimate, and 3 recommended actions. Format as an executive intelligence brief.`,
          context: 'Vessels maritime intelligence platform — predictive trade disruption analysis',
        }),
      });
      if (!res.ok) throw new Error('Failed to generate brief');
      const data = (await res.json()) as { response?: string; result?: string };
      setGeneratedBrief({
        loading: false,
        content: data.response || data.result || 'No content generated',
      });
    } catch {
      setGeneratedBrief({
        loading: false,
        content: '',
        error: 'Failed to generate brief — AI service unavailable',
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-[#f5f5f5] font-display">Intelligence Briefs</h1>
          <Badge
            variant="outline"
            className="text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
          >
            AUTO-GENERATED
          </Badge>
        </div>
        <p className="text-xs text-[#8a8a8a]">
          Structured disruption reports auto-generated when significant signals are detected —
          affected parties, dollar impact, and recommended actions
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Briefs Generated',
            value: BRIEFS.length,
            sub: 'last 48 hours',
            icon: FileText,
            color: 'text-[#c9b787]',
          },
          {
            label: 'Critical Alerts',
            value: criticalCount,
            sub: 'require immediate action',
            icon: AlertTriangle,
            color: 'text-red-400',
          },
          {
            label: 'High Priority',
            value: highCount,
            sub: 'monitor closely',
            icon: Zap,
            color: 'text-orange-400',
          },
          {
            label: 'Trigger Sources',
            value: 4,
            sub: 'AI signal engines',
            icon: Activity,
            color: 'text-purple-400',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a]">{kpi.label}</p>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <p className={cn('text-2xl font-bold font-mono', kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-[#6a6a6a] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Auto-trigger alert banner — fires when navigated from Disruption Forecast or Dark Fleet */}
      {autoAlert && (
        <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/25 rounded-xl px-4 py-3 animate-in fade-in duration-500">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-300">
              Auto-trigger fired — Intelligence Brief generating
            </p>
            <p className="text-[11px] text-emerald-400/70 mt-0.5">
              Source: <span className="text-emerald-300">{autoAlert.source}</span>
            </p>
          </div>
          <button
            className="text-[10px] text-emerald-400/50 hover:text-emerald-300 shrink-0"
            onClick={() => setAutoAlert(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* On-demand brief generator */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <p className="text-sm font-semibold text-[#e0e0e0]">
            Generate Intelligence Brief On-Demand
          </p>
        </div>
        <p className="text-[11px] text-[#8a8a8a]">
          Helmsman AI will produce a structured brief for any maritime intelligence topic
        </p>
        <div className="flex gap-2">
          <input
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="flex-1 bg-[#c9b787]/8 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#e0e0e0] placeholder-sky-400/30 outline-none focus:border-[#c9b787]/24"
            placeholder="Describe the scenario to brief..."
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={generateBrief}
            disabled={generatedBrief?.loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#c9b787]/10 border border-white/[0.08] text-[#d4c598] hover:bg-[#c9b787]/14 disabled:opacity-50 transition-colors shrink-0"
          >
            {generatedBrief?.loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {generatedBrief?.loading ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>
        {generatedBrief && !generatedBrief.loading && (
          <div
            className={cn(
              'rounded-lg p-4 text-xs leading-relaxed',
              generatedBrief.error
                ? 'bg-red-500/5 border border-red-500/10 text-red-400/70'
                : 'bg-[#c9b787]/14 border border-white/[0.06] text-[#e0e0e0]/80',
            )}
          >
            {generatedBrief.error ? generatedBrief.error : generatedBrief.content}
          </div>
        )}
      </div>

      {/* Briefs list */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#e0e0e0]">Recent Intelligence Briefs</p>
        {BRIEFS.map((b) => (
          <BriefCard key={b.id} brief={b} />
        ))}
      </div>
    </div>
  );
}
