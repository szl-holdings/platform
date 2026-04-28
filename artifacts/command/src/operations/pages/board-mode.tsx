import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  HelpCircle,
  Shield,
  Target,
  TrendingDown,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'wouter';

const BG = { page: 'var(--gi-bg-base)', surface: 'var(--gi-bg-surface)', elevated: 'var(--gi-bg-raised)', panel: '#0e1219' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const GOLD = '#d4a054';
const RED = '#c45a4a';
const AMBER = '#c8953c';

interface BoardItem {
  id: string;
  title: string;
  sub: string;
  urgency: string;
  impact: string;
  owner: string;
  deadline: string;
  pack: string;
  packColor: string;
  detail?: string;
  href?: string;
}

const DECISIONS: BoardItem[] = [
  {
    id: 'D-1',
    title: 'Approve Q2 pricing revision',
    sub: '31h overdue — downstream go-live blocked',
    urgency: 'Today',
    impact: '$1.2M',
    owner: 'CEO',
    deadline: 'Board deadline T+48h',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    detail:
      'Pricing revision submitted by Ops 31h ago. Board distribution requires executive sign-off. Every hour of delay risks the Q2 go-live window. Approver calendar conflict is the only blocker.',
    href: '/approvals',
  },
  {
    id: 'D-2',
    title: 'Resolve AR ownership conflict',
    sub: 'Payments withheld — 18h unresolved',
    urgency: 'Today',
    impact: '$650K',
    owner: 'COO',
    deadline: 'Finance reconciliation stalled',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    detail:
      'Two team leads have claimed the same AR account. Payments on hold. A single assignment decision unlocks $650K in reconciliation and resumes cash flow.',
    href: '/blocker-board',
  },
  {
    id: 'D-3',
    title: 'Authorize fuel surcharge — 3 vessels',
    sub: '22h stalled — SLA breach in 4h',
    urgency: 'Immediate',
    impact: '$2.1M',
    owner: 'Finance VP',
    deadline: 'SLA breach at 26h',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    detail:
      'Three vessels are awaiting fuel surcharge approval before re-routing can proceed. The SLA breach window is 4 hours. Finance VP sign-off is required.',
    href: '/blocker-board',
  },
];

const RISKS: BoardItem[] = [
  {
    id: 'R-1',
    title: 'Fleet ETA compliance gap',
    sub: '3 vessels outside SLA — escalating',
    urgency: 'Critical',
    impact: '$2.1M',
    owner: 'Fleet Ops',
    deadline: 'SLA breach imminent',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    detail:
      'Vessel M/V Meridian, Pacific Star, and Coral Wind are all operating outside SLA windows. If no corrective action is taken in the next 4 hours, penalty clauses activate automatically.',
  },
  {
    id: 'R-2',
    title: 'Q2 pricing miss window risk',
    sub: 'If not approved in 17h, Q2 pricing expires',
    urgency: 'High',
    impact: '$1.2M',
    owner: 'Revenue',
    deadline: 'Decision deadline in 17h',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    detail:
      'The Q2 pricing revision was calculated for a specific market window. If executive approval does not come through in the next 17 hours, the market conditions will have shifted and the revision must be recalculated.',
  },
  {
    id: 'R-3',
    title: 'DOMAINE lease renewal legal exposure',
    sub: '48h past due — tenant window closing',
    urgency: 'High',
    impact: '$320K',
    owner: 'Legal',
    deadline: 'Tenant deadline in 3d',
    pack: 'DOMAINE',
    packColor: '#a07848',
    detail:
      'Exhibit B missing from the lease renewal document. If not resolved within 3 days, tenant has the right to void the renewal. A signed exhibit B must be obtained from the property manager.',
  },
];

const ASKS: BoardItem[] = [
  {
    id: 'A-1',
    title: 'Confirm escalation path for Finance VP absence',
    sub: 'If VP unavailable, who approves fuel surcharge?',
    urgency: 'Now',
    impact: '$2.1M at stake',
    owner: 'CFO',
    deadline: 'Need answer in 2h',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    detail:
      'The Finance VP who must approve the fuel surcharge is currently in a calendar conflict. Clarification is needed: who is the designated backup approver for fleet surcharge decisions?',
  },
  {
    id: 'A-2',
    title: 'Assign AR account owner — clear the conflict',
    sub: 'One assignment unblocks $650K',
    urgency: 'Today',
    impact: '$650K',
    owner: 'COO Office',
    deadline: 'Finance reconciliation at risk',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    detail:
      'A single decision from the COO — assigning the AR account to one team — will immediately unblock $650K in payment processing. No other action is needed from leadership.',
  },
  {
    id: 'A-3',
    title: 'Authorize property manager escalation for DOMAINE lease',
    sub: 'PM unresponsive — need authorization to escalate',
    urgency: 'This week',
    impact: '$320K',
    owner: 'Carlota Jo Account',
    deadline: '3d tenant window',
    pack: 'DOMAINE',
    packColor: '#a07848',
    detail:
      "The property manager responsible for obtaining Exhibit B has been unresponsive for 48 hours. Authorization is requested to escalate directly to the property management firm's director and, if needed, engage legal to obtain the document.",
  },
];

function BoardCard({ item, type }: { item: BoardItem; type: 'decision' | 'risk' | 'ask' }) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<
    'decision' | 'risk' | 'ask',
    { accent: string; Icon: React.ElementType }
  > = {
    decision: { accent: GOLD, Icon: Target },
    risk: { accent: RED, Icon: AlertTriangle },
    ask: { accent: '#8b7ac8', Icon: HelpCircle },
  };
  const { accent, Icon: TypeIcon } = typeColors[type];

  const urgencyColor =
    item.urgency === 'Immediate' || item.urgency === 'Critical' || item.urgency === 'Now'
      ? RED
      : item.urgency === 'Today' || item.urgency === 'High'
        ? AMBER
        : GOLD;

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: BG.surface, border: `1px solid ${accent}18` }}
    >
      <div className="px-4 py-3.5 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-start gap-3">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${accent}12` }}
          >
            <TypeIcon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
                style={{ color: item.packColor, background: `${item.packColor}14` }}
              >
                {item.pack}
              </span>
              <span
                className="text-[8px] font-mono px-1.5 py-px rounded uppercase"
                style={{ color: urgencyColor, background: `${urgencyColor}12` }}
              >
                {item.urgency}
              </span>
            </div>
            <p
              className="text-[12px] font-semibold leading-snug mb-0.5"
              style={{ color: TEXT.primary }}
            >
              {item.title}
            </p>
            <p className="text-[10px]" style={{ color: TEXT.secondary }}>
              {item.sub}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-mono font-bold" style={{ color: AMBER }}>
              {item.impact}
            </span>
            <div className="flex items-center gap-1">
              {expanded ? (
                <ChevronUp className="w-3 h-3" style={{ color: TEXT.tertiary }} />
              ) : (
                <ChevronDown className="w-3 h-3" style={{ color: TEXT.tertiary }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3 space-y-3">
            {item.detail && (
              <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
                {item.detail}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'Owner', v: item.owner },
                { k: 'Deadline', v: item.deadline },
                { k: 'Pack', v: item.pack },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="rounded p-2"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div
                    className="text-[7px] uppercase tracking-wider mb-0.5"
                    style={{ color: TEXT.muted }}
                  >
                    {k}
                  </div>
                  <div className="text-[9px] font-medium" style={{ color: TEXT.secondary }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
            {item.href && (
              <Link href={item.href}>
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-medium hover:opacity-80 transition-opacity"
                  style={{ color: accent }}
                >
                  View full detail <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoardModePage() {
  const totalImpact = '$4.17M';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-4 md:p-5 space-y-6" style={{ background: BG.page }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: GOLD }}
            >
              Executive Board Mode
            </span>
            <span
              className="text-[8px] font-mono px-1.5 py-px rounded"
              style={{
                color: 'rgba(212,160,84,0.5)',
                background: 'rgba(212,160,84,0.06)',
                border: '1px solid rgba(212,160,84,0.12)',
              }}
            >
              Zero Clutter · Maximum Clarity
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Board Mode
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            {today} · {totalImpact} total exposure · 3 decisions, 3 risks, 3 asks
          </p>
        </div>
        <div
          className="rounded px-3 py-2 shrink-0"
          style={{ background: 'rgba(196,90,74,0.08)', border: '1px solid rgba(196,90,74,0.16)' }}
        >
          <div className="text-[13px] font-mono font-bold" style={{ color: RED }}>
            {totalImpact}
          </div>
          <div
            className="text-[7px] uppercase tracking-wider"
            style={{ color: 'rgba(196,90,74,0.55)' }}
          >
            Total at Stake
          </div>
        </div>
      </div>

      <div
        className="rounded-md p-3 flex items-start gap-3"
        style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
      >
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: TEXT.muted }} />
        <p className="text-[10px] leading-relaxed" style={{ color: TEXT.tertiary }}>
          Board Mode compresses the entire operating state into exactly 3 decisions, 3 risks, and 3
          asks. Every item is the highest-value action the system has surfaced. Expand each card for
          full context. Nothing below this line requires your attention today.
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: `${GOLD}12` }}
          >
            <Target className="w-3 h-3" style={{ color: GOLD }} />
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: GOLD }}
          >
            3 Decisions Required
          </span>
          <span
            className="text-[8px] font-mono px-1.5 py-px rounded ml-auto"
            style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
          >
            Ranked by impact · Collapse when done
          </span>
        </div>
        {DECISIONS.map((d) => (
          <BoardCard key={d.id} item={d} type="decision" />
        ))}
      </div>

      <div className="h-px" style={{ background: BORDER.subtle }} />

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: `${RED}12` }}
          >
            <AlertTriangle className="w-3 h-3" style={{ color: RED }} />
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: RED }}
          >
            3 Risks on Your Radar
          </span>
          <span
            className="text-[8px] font-mono px-1.5 py-px rounded ml-auto"
            style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
          >
            No action needed yet — awareness only
          </span>
        </div>
        {RISKS.map((r) => (
          <BoardCard key={r.id} item={r} type="risk" />
        ))}
      </div>

      <div className="h-px" style={{ background: BORDER.subtle }} />

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: 'rgba(139,122,200,0.12)' }}
          >
            <HelpCircle className="w-3 h-3" style={{ color: '#8b7ac8' }} />
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: '#8b7ac8' }}
          >
            3 Asks from the System
          </span>
          <span
            className="text-[8px] font-mono px-1.5 py-px rounded ml-auto"
            style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
          >
            Clarification or authorization needed
          </span>
        </div>
        {ASKS.map((a) => (
          <BoardCard key={a.id} item={a} type="ask" />
        ))}
      </div>

      <div className="h-px" style={{ background: BORDER.subtle }} />

      <div className="grid grid-cols-3 gap-2">
        {[
          { href: '/blocker-board', label: 'Blocker Board', icon: AlertTriangle, color: RED },
          { href: '/bottleneck-heatmap', label: 'Heatmap', icon: TrendingDown, color: AMBER },
          { href: '/approvals', label: 'Approvals', icon: CheckCircle2, color: GOLD },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-all hover:opacity-80"
              style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
            >
              <link.icon className="w-3.5 h-3.5 shrink-0" style={{ color: link.color }} />
              <span className="text-[10px] font-medium" style={{ color: TEXT.secondary }}>
                {link.label}
              </span>
              <ChevronRight className="w-3 h-3 ml-auto" style={{ color: TEXT.muted }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
