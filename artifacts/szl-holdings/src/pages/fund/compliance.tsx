import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, ArrowLeft, ChevronRight, Calendar, AlertTriangle, CheckCircle2, FileText, Zap, Download } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const FILINGS = [
  { id: "pf-q1", form: "Form PF", period: "Q1 2026", deadline: "May 1, 2026", daysLeft: 16, status: "draft", aiStatus: "AI draft ready — review required", priority: "high", description: "AIFMD/SEC reporting for private fund advisers. Quarterly AUM, strategy, and risk data." },
  { id: "formd-fund2", form: "Form D", period: "Fund II Launch", deadline: "May 15, 2026", daysLeft: 30, status: "ai_preparing", aiStatus: "AI preparing — exempt offering data being extracted", priority: "high", description: "Regulation D exemption filing for Fund II initial close." },
  { id: "adv-annual", form: "Form ADV Part 2", period: "Annual 2026", deadline: "Mar 31, 2027", daysLeft: 350, status: "future", aiStatus: "Scheduled — auto-drafting Q4 2026", priority: "low", description: "Annual brochure update for registered investment advisers." },
  { id: "formd-fund1", form: "Form D", period: "Fund I (Filed)", deadline: "Mar 15, 2025", daysLeft: 0, status: "filed", aiStatus: "Filed — EDGAR acknowledged", priority: "none", description: "Fund I initial exemption filing — SEC confirmed." },
  { id: "form-pf-q4", form: "Form PF", period: "Q4 2025", deadline: "Feb 1, 2026", daysLeft: 0, status: "filed", aiStatus: "Filed — on time", priority: "none", description: "Q4 2025 quarterly PF report." },
];

const COMPLIANCE_TESTS = [
  { test: "Investment Diversification (15% rule)", result: "Pass", detail: "Max single investment 12.8% of NAV", status: "pass" },
  { test: "Leverage Compliance", result: "Pass", detail: "No leverage employed — cash-only fund", status: "pass" },
  { test: "Co-Investment Policy", result: "Pass", detail: "All co-investments disclosed to LP advisory board", status: "pass" },
  { test: "GP Conflict of Interest", result: "Review", detail: "SZL Holdings fee sharing arrangement requires annual disclosure update", status: "warn" },
  { test: "MNPI Controls", result: "Pass", detail: "Material non-public information policy acknowledged by all team members", status: "pass" },
  { test: "AML/KYC — All LPs", result: "Pass", detail: "All 23 LPs verified — 0 pending", status: "pass" },
  { test: "Accreditation Status", result: "Pass", detail: "21/23 current · 2 renewals due Q3 2026", status: "pass" },
  { test: "Valuation Policy", result: "Pass", detail: "ASC 820 fair value methodology applied Q1 2026", status: "pass" },
];

const CALENDAR = [
  { date: "May 1", event: "Form PF Q1 2026 due", type: "high" },
  { date: "May 15", event: "Form D — Fund II initial close", type: "high" },
  { date: "Jun 30", event: "Annual auditor selection deadline", type: "medium" },
  { date: "Jul 31", event: "LP accreditation renewals (2 LPs)", type: "medium" },
  { date: "Aug 1", event: "Form PF Q2 2026 due", type: "high" },
  { date: "Sep 30", event: "Annual GP commitment letter renewal", type: "low" },
  { date: "Nov 1", event: "Form PF Q3 2026 due", type: "high" },
  { date: "Dec 15", event: "Year-end tax prep deadline", type: "medium" },
];

const STATUS_STYLE: Record<string, string> = {
  filed: "text-[#6aaa72] border-[#6aaa72]/20 bg-[#6aaa72]/10",
  draft: "text-[#d4a054] border-[#d4a054]/20 bg-[#d4a054]/10",
  ai_preparing: "text-[#4a90b8] border-[#4a90b8]/20 bg-[#4a90b8]/10",
  future: "text-white/40 border-white/10 bg-white/[0.03]",
};

export default function CompliancePage() {
  const __pageMeta = usePageMeta({ title: "SEC & Compliance — SZL Fund Intelligence", description: "Automated form preparation, deadline tracking, and compliance testing." });
  const [tab, setTab] = useState<"filings" | "tests" | "calendar">("filings");

  const dueSoon = FILINGS.filter(f => f.daysLeft > 0 && f.daysLeft <= 30).length;
  const passed = COMPLIANCE_TESTS.filter(t => t.status === "pass").length;

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6">
              <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
              <ChevronRight className="h-3 w-3 text-white/20" />
              <span className="text-[11px] text-white/60">SEC & Compliance</span>
            </div>
  
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4a90b8]/15">
                <ShieldCheck className="h-4.5 w-4.5 text-[#4a90b8]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">SEC & Regulatory Compliance Automation</h1>
                <p className="text-xs text-white/40">Form D · Form PF · Form ADV · deadline tracking · evidence generation</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: "Filings Due (30d)", value: String(dueSoon), color: "#c45a4a" },
                { label: "Compliance Tests Passed", value: `${passed}/${COMPLIANCE_TESTS.length}`, color: "#6aaa72" },
                { label: "Next Deadline", value: "May 1", color: "#d4a054" },
                { label: "Overall Compliance", value: "94%", color: "#4a90b8" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="flex gap-2 mb-5">
              {(["filings", "tests", "calendar"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${tab === t ? "bg-[#4a90b8] text-white" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                  {t === "filings" ? "Filings" : t === "tests" ? "Compliance Tests" : "Regulatory Calendar"}
                </button>
              ))}
            </div>
  
            {tab === "filings" && (
              <div className="space-y-3">
                {FILINGS.map(f => (
                  <div key={f.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a90b8]/15 flex-shrink-0">
                          <FileText className="h-4 w-4 text-[#4a90b8]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{f.form}</span>
                            <span className="text-xs text-white/40">—</span>
                            <span className="text-xs text-white/40">{f.period}</span>
                          </div>
                          <div className="text-xs text-white/50 mt-0.5">{f.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {f.daysLeft > 0 && (
                          <span className={`text-xs font-semibold ${f.daysLeft <= 16 ? "text-[#c45a4a]" : "text-[#d4a054]"}`}>
                            {f.daysLeft}d remaining
                          </span>
                        )}
                        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase ${STATUS_STYLE[f.status] ?? "text-white/40 border-white/10 bg-white/[0.03]"}`}>
                          {f.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Zap className="h-3 w-3 text-[#d4a054]" />
                        {f.aiStatus}
                      </div>
                      <div className="flex gap-2">
                        {f.status !== "future" && f.status !== "filed" && (
                          <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/[0.04]">
                            <Download className="h-3 w-3" /> Export Draft
                          </button>
                        )}
                        {f.status !== "filed" && f.status !== "future" && (
                          <button className="rounded-lg bg-[#4a90b8] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#4a90b8]/80">
                            Review & Sign
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
  
            {tab === "tests" && (
              <div className="space-y-2">
                {COMPLIANCE_TESTS.map((t, i) => (
                  <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${t.status === "pass" ? "border-[#6aaa72]/15 bg-[#6aaa72]/[0.03]" : "border-[#d4a054]/20 bg-[#d4a054]/[0.04]"}`}>
                    {t.status === "pass" ? <CheckCircle2 className="h-4 w-4 text-[#6aaa72] flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-[#d4a054] flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{t.test}</div>
                      <div className="text-xs text-white/40 mt-0.5">{t.detail}</div>
                    </div>
                    <span className={`text-xs font-bold ${t.status === "pass" ? "text-[#6aaa72]" : "text-[#d4a054]"}`}>{t.result}</span>
                  </div>
                ))}
              </div>
            )}
  
            {tab === "calendar" && (
              <div className="space-y-2">
                {CALENDAR.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                    <div className={`flex h-10 w-16 flex-col items-center justify-center rounded-lg flex-shrink-0 ${c.type === "high" ? "bg-[#c45a4a]/15 text-[#c45a4a]" : c.type === "medium" ? "bg-[#d4a054]/15 text-[#d4a054]" : "bg-white/[0.05] text-white/40"}`}>
                      <Calendar className="h-3.5 w-3.5 mb-0.5" />
                      <span className="text-[9px] font-bold">{c.date}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{c.event}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase ${c.type === "high" ? "bg-[#c45a4a]/15 text-[#c45a4a]" : c.type === "medium" ? "bg-[#d4a054]/15 text-[#d4a054]" : "bg-white/[0.05] text-white/30"}`}>
                      {c.type} priority
                    </span>
                  </div>
                ))}
              </div>
            )}
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
