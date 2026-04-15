import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeftRight, ArrowLeft, ChevronRight, Clock, CheckCircle2,
  AlertCircle, DollarSign, FileText, Users, Scale, Plus,
  ShieldCheck, TrendingUp, BarChart3, Download, Send,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type TransferStatus = "pending_rofr" | "rofr_waived" | "valuation_pending" | "docs_in_progress" | "completed" | "declined";

type LpTransfer = {
  id: string;
  transferorName: string;
  transfereeName: string;
  transferType: "secondary_sale" | "gift" | "estate" | "restructure";
  interestPct: number;
  navAtTransfer: number;
  agreedPrice: number;
  discount: number;
  status: TransferStatus;
  rofrDeadline: string;
  rofrExercisedBy: string | null;
  initiated: string;
  completedDate: string | null;
  sideLetter: boolean;
  notes: string;
};

const TRANSFERS: LpTransfer[] = [
  {
    id: "t1",
    transferorName: "Astor Family Office",
    transfereeName: "Greenway Ventures III LP",
    transferType: "secondary_sale",
    interestPct: 2.5,
    navAtTransfer: 4_200_000,
    agreedPrice: 3_780_000,
    discount: 10,
    status: "rofr_waived",
    rofrDeadline: "Apr 20, 2026",
    rofrExercisedBy: null,
    initiated: "Apr 5, 2026",
    completedDate: null,
    sideLetter: true,
    notes: "ROFR period expired. Transfer docs being drafted. Side letter negotiated for info rights.",
  },
  {
    id: "t2",
    transferorName: "Meridian Capital Fund I",
    transfereeName: "Blackrock Endowment Fund",
    transferType: "secondary_sale",
    interestPct: 5.0,
    navAtTransfer: 8_400_000,
    agreedPrice: 7_140_000,
    discount: 15,
    status: "pending_rofr",
    rofrDeadline: "May 2, 2026",
    rofrExercisedBy: null,
    initiated: "Apr 12, 2026",
    completedDate: null,
    sideLetter: false,
    notes: "ROFR notice sent to all LPs. 20-day window expires May 2. GP review in progress.",
  },
  {
    id: "t3",
    transferorName: "Hartwell Family Trust",
    transfereeName: "Hartwell Capital GP (Estate Transfer)",
    transferType: "estate",
    interestPct: 1.8,
    navAtTransfer: 3_024_000,
    agreedPrice: 3_024_000,
    discount: 0,
    status: "completed",
    rofrDeadline: "Feb 28, 2026",
    rofrExercisedBy: null,
    initiated: "Feb 10, 2026",
    completedDate: "Mar 15, 2026",
    sideLetter: false,
    notes: "Estate transfer exempt from ROFR per LPA Section 9.4. Cap table updated. K-1 re-issued.",
  },
  {
    id: "t4",
    transferorName: "FounderPath Ventures",
    transfereeName: "Halcyon Growth LP",
    transferType: "secondary_sale",
    interestPct: 3.2,
    navAtTransfer: 5_376_000,
    agreedPrice: 4_300_800,
    discount: 20,
    status: "docs_in_progress",
    rofrDeadline: "Apr 1, 2026",
    rofrExercisedBy: null,
    initiated: "Mar 15, 2026",
    completedDate: null,
    sideLetter: true,
    notes: "ROFR waived. Assignment Agreement, LPAC consent, and side letter in final review.",
  },
];

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; description: string }> = {
  pending_rofr: { label: "ROFR Period Active", color: "#d4a054", description: "Right of first refusal window is open — existing LPs may exercise" },
  rofr_waived: { label: "ROFR Waived", color: "#4a90b8", description: "ROFR period expired without exercise — docs being prepared" },
  valuation_pending: { label: "Valuation Pending", color: "#8b7ac8", description: "GP valuation approval required before proceeding" },
  docs_in_progress: { label: "Docs in Progress", color: "#d4a054", description: "Transfer documentation under preparation and review" },
  completed: { label: "Completed", color: "#6aaa72", description: "Transfer complete — cap table updated" },
  declined: { label: "Declined", color: "#c45a4a", description: "Transfer declined by GP or ROFR exercised" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

const ROFR_STEPS = [
  { step: "Transfer Notice Filed", description: "GP receives transfer notice from transferor with proposed price and transferee details" },
  { step: "LP Notification Sent", description: "All existing LPs receive ROFR notice with 20-30 day exercise window per LPA" },
  { step: "ROFR Window Active", description: "LPs evaluate and may exercise their right to purchase at the proposed price" },
  { step: "ROFR Decision", description: "GP determines if any LP exercised ROFR or if window expired without exercise" },
  { step: "Valuation Approval", description: "GP approves or challenges the proposed transfer price vs. current NAV" },
  { step: "Transfer Documentation", description: "Assignment Agreement, LP Consent, and any side letters drafted and executed" },
  { step: "Cap Table Update", description: "Cap table updated to reflect new LP and ownership percentages" },
  { step: "Tax & Reporting", description: "K-1s re-issued, capital account re-assigned, LP reports updated" },
];

const MARKET_DATA = [
  { label: "Avg. Secondary Discount", value: "14.2%", trend: "-2.1pp vs Q4 2025", color: "#d4a054" },
  { label: "Completed Transfers (YTD)", value: "1", trend: "vs 3 in 2025 full year", color: "#6aaa72" },
  { label: "Pending Transfer Value", value: fmt(TRANSFERS.filter(t => t.status !== "completed").reduce((s, t) => s + t.agreedPrice, 0)), trend: "2 transactions in progress", color: "#4a90b8" },
  { label: "Avg. Time to Close", value: "48 days", trend: "vs 62 days industry avg", color: "#8b7ac8" },
];

export default function SecondaryMarketPage() {
  usePageMeta({
    title: "Secondary Market & LP Transfer Desk — SZL Holdings Fund",
    description: "LP interest transfers with ROFR workflow, valuation approval, transfer document generation, and cap table automation.",
    canonical: "https://szlholdings.com/fund/secondary-market",
  });

  const [tab, setTab] = useState<"transfers" | "workflow" | "market">("transfers");
  const [selectedTransfer, setSelectedTransfer] = useState<LpTransfer | null>(null);

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="flex items-center gap-3 mb-6">
            <Link href="/fund">
              <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence
              </button>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-white/20" />
            <span className="text-xs text-white/60">Secondary Market</span>
          </div>

          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/15">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-[#4a90b8]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4a90b8]">LP Liquidity Desk</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Secondary Market & LP Transfer Desk</h1>
              <p className="text-white/50 text-sm max-w-xl">
                Managed LP interest transfers with ROFR workflow, GP valuation approval, document generation, and automated cap table updates.
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-[#4a90b8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#4a90b8]/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Initiate Transfer
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {MARKET_DATA.map(item => (
              <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="text-2xl font-semibold text-white mb-1">{item.value}</div>
                <div className="text-xs text-white/40">{item.label}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{item.trend}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 mb-6">
            {(["transfers", "workflow", "market"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSelectedTransfer(null); }}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${tab === t ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/60"}`}>
                {t === "transfers" ? "Active Transfers" : t === "workflow" ? "ROFR Workflow" : "Market Context"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "transfers" && !selectedTransfer && (
              <m.div key="transfers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {TRANSFERS.map((transfer, i) => {
                  const s = STATUS_CONFIG[transfer.status];
                  return (
                    <m.div key={transfer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <button onClick={() => setSelectedTransfer(transfer)} className="w-full text-left">
                        <div className="group flex items-center gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 flex-shrink-0" style={{ color: s.color }}>
                            <ArrowLeftRight className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-white">{transfer.transferorName} → {transfer.transfereeName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-white/40">
                              <span>{transfer.interestPct}% LP Interest</span>
                              <span>NAV: {fmt(transfer.navAtTransfer)}</span>
                              <span>Price: {fmt(transfer.agreedPrice)}</span>
                              {transfer.discount > 0 && <span className="text-[#d4a054]">-{transfer.discount}% discount</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                              style={{ color: s.color, borderColor: `${s.color}30`, background: `${s.color}12` }}>
                              {s.label}
                            </span>
                            {transfer.sideLetter && (
                              <span className="text-[9px] text-[#8b7ac8] border border-[#8b7ac8]/30 rounded-full px-2 py-0.5 font-semibold">Side Letter</span>
                            )}
                            <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                          </div>
                        </div>
                      </button>
                    </m.div>
                  );
                })}
              </m.div>
            )}

            {tab === "transfers" && selectedTransfer && (
              <m.div key="transfer-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => setSelectedTransfer(null)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Transfers
                </button>
                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2 space-y-5">
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <h2 className="text-lg font-semibold text-white mb-1">
                        {selectedTransfer.transferorName} → {selectedTransfer.transfereeName}
                      </h2>
                      <div className="flex items-center gap-2 mb-5">
                        <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                          style={{ color: STATUS_CONFIG[selectedTransfer.status].color, borderColor: `${STATUS_CONFIG[selectedTransfer.status].color}30`, background: `${STATUS_CONFIG[selectedTransfer.status].color}12` }}>
                          {STATUS_CONFIG[selectedTransfer.status].label}
                        </span>
                        <span className="text-[10px] text-white/35">{STATUS_CONFIG[selectedTransfer.status].description}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        {[
                          { label: "LP Interest", value: `${selectedTransfer.interestPct}%` },
                          { label: "NAV at Transfer", value: fmt(selectedTransfer.navAtTransfer) },
                          { label: "Agreed Price", value: fmt(selectedTransfer.agreedPrice) },
                          { label: "Discount to NAV", value: selectedTransfer.discount > 0 ? `-${selectedTransfer.discount}%` : "At par" },
                          { label: "Transfer Type", value: selectedTransfer.transferType.replace("_", " ") },
                          { label: "Initiated", value: selectedTransfer.initiated },
                        ].map(m => (
                          <div key={m.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <div className="text-[10px] text-white/35 mb-1 uppercase tracking-[0.1em]">{m.label}</div>
                            <div className="text-sm font-semibold text-white capitalize">{m.value}</div>
                          </div>
                        ))}
                      </div>
                      {selectedTransfer.notes && (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-2">GP Notes</div>
                          <p className="text-sm text-white/60">{selectedTransfer.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-[#d4a054]" />
                        <span className="text-sm font-semibold text-white">Transfer Documents</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: "LP Transfer Notice", status: selectedTransfer.status !== "pending_rofr" ? "complete" : "pending" },
                          { name: "ROFR Notice to LPs", status: selectedTransfer.status !== "pending_rofr" ? "complete" : "sent" },
                          { name: "Assignment Agreement", status: selectedTransfer.status === "completed" || selectedTransfer.status === "docs_in_progress" ? "complete" : "pending" },
                          { name: "LP Consent Form", status: selectedTransfer.status === "completed" ? "complete" : "pending" },
                          ...(selectedTransfer.sideLetter ? [{ name: "Side Letter — Info Rights", status: selectedTransfer.status === "completed" ? "complete" : "draft" }] : []),
                          { name: "Cap Table Amendment", status: selectedTransfer.status === "completed" ? "complete" : "pending" },
                        ].map((doc, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
                            {doc.status === "complete" ? <CheckCircle2 className="h-4 w-4 text-[#6aaa72] flex-shrink-0" />
                              : doc.status === "sent" ? <Clock className="h-4 w-4 text-[#4a90b8] flex-shrink-0" />
                              : doc.status === "draft" ? <FileText className="h-4 w-4 text-[#8b7ac8] flex-shrink-0" />
                              : <AlertCircle className="h-4 w-4 text-white/25 flex-shrink-0" />}
                            <span className="text-sm text-white/70 flex-1">{doc.name}</span>
                            <span className={`text-[10px] font-semibold uppercase ${doc.status === "complete" ? "text-[#6aaa72]" : doc.status === "sent" ? "text-[#4a90b8]" : doc.status === "draft" ? "text-[#8b7ac8]" : "text-white/25"}`}>
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedTransfer.status === "pending_rofr" && (
                      <div className="rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.06] p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-[#d4a054]" />
                          <span className="text-sm font-semibold text-white">ROFR Deadline</span>
                        </div>
                        <div className="text-xl font-semibold text-[#d4a054] mb-1">{selectedTransfer.rofrDeadline}</div>
                        <div className="text-xs text-white/50">LPs have until this date to exercise their right of first refusal at the proposed price of {fmt(selectedTransfer.agreedPrice)}</div>
                      </div>
                    )}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-4">Actions</div>
                      <div className="space-y-2">
                        {[
                          { label: "Download Transfer Package", icon: Download },
                          { label: "Send to LPAC for Consent", icon: Send },
                          { label: "Update Cap Table", icon: Scale },
                        ].map((action, i) => (
                          <button key={i} className="w-full flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors">
                            <action.icon className="h-3.5 w-3.5" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {tab === "workflow" && (
              <m.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 max-w-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Scale className="h-4 w-4 text-[#4a90b8]" />
                    <span className="text-sm font-semibold text-white">LP Transfer ROFR Workflow</span>
                  </div>
                  <div className="space-y-0">
                    {ROFR_STEPS.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4a90b8]/30 bg-[#4a90b8]/10 text-[#4a90b8] text-xs font-semibold flex-shrink-0">
                            {i + 1}
                          </div>
                          {i < ROFR_STEPS.length - 1 && (
                            <div className="w-px h-8 bg-white/[0.06] mt-1" />
                          )}
                        </div>
                        <div className="pb-8">
                          <div className="text-sm font-semibold text-white mb-1">{step.step}</div>
                          <div className="text-xs text-white/45 leading-relaxed">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 rounded-xl border border-[#4a90b8]/20 bg-[#4a90b8]/[0.06] p-4">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#4a90b8] flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">GP Approval Required</div>
                        <div className="text-xs text-white/50">All LP transfers require GP approval regardless of ROFR outcome. GP may reject transfers that violate LPA restrictions on transferee eligibility, bad actor rules, or minimum holding thresholds.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {tab === "market" && (
              <m.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Secondary Market Context</h3>
                    <p className="text-xs text-white/40 mb-5">LP secondary activity benchmark — VC fund universe</p>
                    <div className="space-y-3">
                      {[
                        { label: "2025 Secondary Volume (VC)", value: "$48.2B", note: "Record year, up 22% YoY" },
                        { label: "Average Discount to NAV", value: "12–18%", note: "Narrowing from 2023 lows of 30–40%" },
                        { label: "Top Buyers", value: "Secondaries GPs", note: "Lexington, HarbourVest, Ares" },
                        { label: "Most Traded Vintage", value: "2019–2021", note: "LPs seeking liquidity before IPO window" },
                        { label: "Time to Close (avg)", value: "45–70 days", note: "Dependent on ROFR complexity" },
                        { label: "SZL vs Market Discount", value: "14.2% (SZL)", note: "In-line with market range" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                          <div>
                            <div className="text-xs text-white/60">{item.label}</div>
                            <div className="text-[10px] text-white/30">{item.note}</div>
                          </div>
                          <div className="text-sm font-semibold text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                    <h3 className="text-sm font-semibold text-white mb-5">SZL Transfer History</h3>
                    <div className="space-y-3">
                      {TRANSFERS.map(t => (
                        <div key={t.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-xs font-semibold text-white">{t.transferorName}</div>
                              <div className="text-[10px] text-white/35">→ {t.transfereeName}</div>
                            </div>
                            <span className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase"
                              style={{ color: STATUS_CONFIG[t.status].color, borderColor: `${STATUS_CONFIG[t.status].color}30`, background: `${STATUS_CONFIG[t.status].color}12` }}>
                              {STATUS_CONFIG[t.status].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-white/35">
                            <span>{t.interestPct}% interest</span>
                            <span>{fmt(t.agreedPrice)}</span>
                            {t.discount > 0 && <span className="text-[#d4a054]">-{t.discount}% discount</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>

        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}

