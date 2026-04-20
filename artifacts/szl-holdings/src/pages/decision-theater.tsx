import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Shield, Ship, Building2, Briefcase, Users, Clock, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import DecisionTheater from "@/components/decision-theater";
import { LOOP_STAGES } from "@/components/decision-theater/scenarios";
import { DECISION_CASES, DEFAULT_CASE_ID } from "@/data/decision-theater-cases";
import type { DecisionCase, CaseSeverity, CaseDomain } from "@/data/decision-theater-cases";
import { cn } from "@/lib/utils";

const BG = "hsl(214,16%,4%)";
const BORDER = "hsla(0,0%,100%,0.07)";
const TEXT = "hsl(38,8%,94%)";
const TEXT_SEC = "hsl(214,7%,60%)";
const TEXT_FAINT = "hsl(214,7%,38%)";
const LYTE = "hsl(192,72%,48%)";
const MONO = "var(--font-mono)";

const DOMAIN_ICON: Record<CaseDomain, typeof Shield> = {
  Aegis: Shield,
  Vessels: Ship,
  Terra: Building2,
  "PRISM Counsel": Briefcase,
  "Carlota Jo": Users,
};

const SEV_COLOR: Record<CaseSeverity, string> = {
  critical: "hsl(0,72%,54%)",
  high: "hsl(30,90%,52%)",
  medium: "hsl(48,90%,52%)",
  info: "hsl(192,72%,48%)",
};

function CaseSelectorCard({ c, active, onSelect }: { c: DecisionCase; active: boolean; onSelect: () => void }) {
  const Icon = DOMAIN_ICON[c.domain];
  const stageLabel = LOOP_STAGES[c.currentStage]?.label ?? "—";
  const sevColor = SEV_COLOR[c.severity];
  return (
    <button
      data-testid={`case-card-${c.id}`}
      onClick={onSelect}
      className={cn(
        "text-left rounded-xl border p-4 transition-all w-full",
        active
          ? "border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_0_1px_hsla(192,72%,48%,0.15)]"
          : "border-border/30 bg-card/40 hover:border-border/60 hover:bg-card/60"
      )}
      style={active ? undefined : { borderColor: BORDER }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${sevColor}18`, border: `1px solid ${sevColor}30` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: sevColor }} />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: TEXT_FAINT }}>{c.id}</p>
            <p className="text-[11px] font-semibold" style={{ color: TEXT }}>{c.domain}</p>
          </div>
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
          style={{ color: sevColor, background: `${sevColor}10`, borderColor: `${sevColor}30` }}
        >
          {c.severity}
        </span>
      </div>
      <p className="text-[12px] font-semibold leading-snug mb-2" style={{ color: TEXT }}>{c.title}</p>
      <div className="flex items-center justify-between text-[10px]" style={{ color: TEXT_FAINT }}>
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {c.openedAt}
        </span>
        <span className="font-mono">Stage {c.currentStage + 1}/9 · {stageLabel}</span>
      </div>
    </button>
  );
}

export default function DecisionTheaterPage() {
  const __pageMeta = usePageMeta({
    title: "Decision Theater — Lyte",
    description: "Walk a live decision case from signal to learning through the nine-stage governed decision loop.",
  });

  const [activeCaseId, setActiveCaseId] = useState<string>(DEFAULT_CASE_ID);
  const activeCase = DECISION_CASES.find((c) => c.id === activeCaseId) ?? DECISION_CASES[0]!;
  const sevColor = SEV_COLOR[activeCase.severity];

  return (
    <>
      {__pageMeta}
      <div style={{ background: BG, color: TEXT, minHeight: "100vh" }}>
        <SiteNav />
  
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem,4vw,3rem) clamp(1rem,3vw,2rem)" }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: "1.5rem" }}>
            <Link
              href="/lyte"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: TEXT_FAINT, textDecoration: "none", fontFamily: MONO }}
            >
              <ArrowLeft size={12} />
              Back to Lyte
            </Link>
          </div>
  
          {/* Header */}
          <header style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.625rem" }}>
              Decision Theater · Flagship Governed Flow
            </p>
            <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: TEXT, margin: "0 0 0.75rem" }}>
              Walk a live decision through nine governed stages
            </h1>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: TEXT_SEC, maxWidth: "70ch", margin: 0 }}>
              Pick an active situation. Step through Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning.
              Every stage shows the artifact, every approval is logged, and every decision lands in the proof chain.
            </p>
          </header>
  
          {/* Case selector */}
          <section style={{ marginBottom: "2rem" }} data-testid="case-selector">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.75rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_SEC, margin: 0 }}>
                Active situations · {DECISION_CASES.length}
              </h2>
              <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Click a card to load it into the theater below</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
              {DECISION_CASES.map((c) => (
                <CaseSelectorCard
                  key={c.id}
                  c={c}
                  active={c.id === activeCaseId}
                  onSelect={() => setActiveCaseId(c.id)}
                />
              ))}
            </div>
          </section>
  
          {/* Active case context bar */}
          <section
            data-testid="active-case-context"
            style={{
              borderRadius: "12px",
              border: `1px solid ${sevColor}30`,
              background: `linear-gradient(180deg, ${sevColor}08, transparent)`,
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <AlertTriangle size={20} style={{ color: sevColor, flexShrink: 0, marginTop: "0.125rem" }} />
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: sevColor }}>
                    {activeCase.severity} · {activeCase.domain}
                  </span>
                  <span style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT }}>{activeCase.id}</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, margin: "0 0 0.375rem" }}>{activeCase.title}</h3>
                <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, lineHeight: 1.55, margin: 0 }}>{activeCase.summary}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "180px" }}>
                <div>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Owner</p>
                  <p style={{ fontSize: "0.8125rem", color: TEXT, margin: "0.125rem 0 0", fontWeight: 600 }}>{activeCase.owner}</p>
                  <p style={{ fontSize: "0.6875rem", color: TEXT_FAINT, margin: 0 }}>{activeCase.ownerRole}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Opened</p>
                  <p style={{ fontSize: "0.75rem", fontFamily: MONO, color: TEXT_SEC, margin: "0.125rem 0 0" }}>{activeCase.openedAt}</p>
                </div>
              </div>
            </div>
          </section>
  
          {/* Theater */}
          <section
            data-testid="decision-theater-section"
            style={{
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              background: "hsla(0,0%,100%,0.025)",
              padding: "clamp(1.25rem, 2vw, 2rem)",
            }}
          >
            <DecisionTheater key={activeCase.id} activeCase={activeCase} />
          </section>
        </main>
  
        <SiteFooter />
      </div>
        </>
  );
}
