import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronRight, Building2, TrendingUp, Globe, Lock, Mail, Calendar } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NoiseGrain } from "@szl-holdings/shared-ui";
import { Link } from "wouter";

type IntentLevel = "strategic" | "financial" | "partnership" | "acquirer" | null;
type QualStep = "intent" | "depth" | "timeline" | "routing";

const intentOptions = [
  {
    id: "strategic" as const,
    label: "Strategic Investor",
    description: "Looking to invest in the SZL ecosystem or a specific platform",
    icon: TrendingUp,
    color: "#6366F1",
    route: "data-room",
  },
  {
    id: "financial" as const,
    label: "Financial Buyer",
    description: "Evaluating acquisition or partial acquisition of SZL Holdings",
    icon: Building2,
    color: "#D4A054",
    route: "acquisition",
  },
  {
    id: "partnership" as const,
    label: "Strategic Partner",
    description: "Exploring commercial partnerships, integrations, or co-development",
    icon: Globe,
    color: "#22C55E",
    route: "partnership",
  },
  {
    id: "acquirer" as const,
    label: "Platform Acquirer",
    description: "Interested in acquiring a specific platform from the portfolio",
    icon: Lock,
    color: "#00D4FF",
    route: "platform-acquisition",
  },
];

const depthQuestions = [
  { id: "early", label: "Early exploration", description: "First look, gathering information" },
  { id: "active", label: "Active evaluation", description: "Conducting due diligence, have a mandate" },
  { id: "ready", label: "Ready to move", description: "Term sheet or LOI ready to discuss" },
];

const timelineOptions = [
  { id: "immediate", label: "Immediate", description: "Within 30 days" },
  { id: "quarter", label: "This quarter", description: "30–90 days" },
  { id: "six-months", label: "6 months", description: "Exploratory, 90–180 days" },
  { id: "strategic", label: "Strategic", description: "No fixed timeline" },
];

const routeContent = {
  "data-room": {
    icon: Lock,
    title: "Access the Investor Data Room",
    description: "A curated data room with platform metrics, architecture overview, and strategic positioning documents. NDA-protected, accessible within 24 hours.",
    cta: "Request Data Room Access",
    href: "mailto:stephenlutar2@gmail.com?subject=Data Room Access Request — SZL Holdings",
    secondary: "Schedule an intro call",
    secondaryHref: "mailto:stephenlutar2@gmail.com?subject=Investor Intro Call — SZL Holdings",
    color: "#6366F1",
  },
  "acquisition": {
    icon: Building2,
    title: "Acquisition Discussion",
    description: "A confidential conversation about the platform, its defensibility score, and the terms under which a full acquisition would be considered. No bankers, no intermediaries — direct.",
    cta: "Start the Conversation",
    href: "mailto:stephenlutar2@gmail.com?subject=Acquisition Discussion — SZL Holdings",
    secondary: "View Investor page first",
    secondaryHref: "/investor",
    color: "#D4A054",
  },
  "partnership": {
    icon: Globe,
    title: "Strategic Partnership",
    description: "Commercial partnerships, data integrations, white-label opportunities, and co-development discussions. The portfolio is designed to partner — Alloy's execution fabric is available as a B2B service.",
    cta: "Explore Partnership",
    href: "mailto:stephenlutar2@gmail.com?subject=Strategic Partnership — SZL Holdings",
    secondary: "See tech stack",
    secondaryHref: "/tech-stack",
    color: "#22C55E",
  },
  "platform-acquisition": {
    icon: Lock,
    title: "Platform-Level Acquisition",
    description: "Individual platforms can be carved out and acquired independently. Each has its own domain model, customer base, and defensibility profile. The shared infrastructure is transferable.",
    cta: "Discuss Platform Acquisition",
    href: "mailto:stephenlutar2@gmail.com?subject=Platform Acquisition Discussion — SZL Holdings",
    secondary: "View all platforms",
    secondaryHref: "/work",
    color: "#00D4FF",
  },
};

const proofPoints = [
  { metric: "16", label: "Production Applications", sub: "8 web · 7 mobile · 1 API" },
  { metric: "375+", label: "Database Tables", sub: "Single typed schema" },
  { metric: "1,618+", label: "API Endpoints", sub: "Full TypeScript" },
  { metric: "92", label: "Defensibility Score", sub: "Proprietary IP moat" },
  { metric: "5", label: "Industries", sub: "Maritime, Defense, RE, Ops, Legal" },
  { metric: "1", label: "Founder", sub: "Full IP concentration" },
];

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300"
            style={{
              background: i < current ? "#22C55E" : i === current ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: i < current ? "#080b12" : i === current ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
              border: `1px solid ${i < current ? "#22C55E" : i === current ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {i < current ? <Check size={10} /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-px w-8 transition-all duration-300"
              style={{ background: i < current ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function InvestorCTA() {
  const [step, setStep] = useState<QualStep>("intent");
  const [intent, setIntent] = useState<IntentLevel>(null);
  const [depth, setDepth] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const stepIndex = { intent: 0, depth: 1, timeline: 2, routing: 3 };
  const selectedIntent = intentOptions.find((o) => o.id === intent);
  const routeKey = selectedIntent?.route as keyof typeof routeContent | undefined;
  const routeData = routeKey ? routeContent[routeKey] : null;

  function handleNext() {
    if (step === "intent" && intent) setStep("depth");
    else if (step === "depth" && depth) setStep("timeline");
    else if (step === "timeline" && timeline) setStep("routing");
  }

  function handleReset() {
    setStep("intent");
    setIntent(null);
    setDepth(null);
    setTimeline(null);
    setComplete(false);
  }

  const canNext =
    (step === "intent" && intent !== null) ||
    (step === "depth" && depth !== null) ||
    (step === "timeline" && timeline !== null);

  return (
    <div className="min-h-screen bg-[#080b12] text-white selection:bg-indigo-500/30 selection:text-white relative">
      <NoiseGrain opacity={0.02} />
      <Navbar />

      <main className="relative">
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/[0.06] to-transparent rounded-full blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto px-6 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium tracking-[0.15em] uppercase text-white/50 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              Investor Relations
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              Interested in
              <br />
              <span className="text-white/30">SZL Holdings?</span>
            </h1>
            <p className="text-[16px] text-white/40 max-w-xl leading-[1.75]">
              Let's route you to the right conversation. Three questions to help find the most useful next step — then direct contact, no intermediaries.
            </p>
          </div>
        </section>

        <section className="py-8 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
              {proofPoints.map((p) => (
                <div
                  key={p.label}
                  className="px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="text-xl font-black tabular-nums text-white/90" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.metric}</div>
                  <div className="text-[10px] font-medium text-white/35 mt-0.5">{p.label}</div>
                  <div className="text-[9px] text-white/15 font-mono mt-0.5">{p.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              <div>
                <StepIndicator
                  current={stepIndex[step]}
                  steps={["Intent", "Depth", "Timeline", "Route"]}
                />

                <AnimatePresence mode="wait">
                  {step === "intent" && (
                    <motion.div
                      key="intent"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-[17px] font-bold text-white/80 mb-2">What describes your interest best?</h2>
                      <p className="text-[12px] text-white/30 mb-6">This routes you to the most relevant conversation.</p>
                      <div className="space-y-3">
                        {intentOptions.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setIntent(opt.id)}
                              className="w-full text-left px-5 py-4 rounded-xl transition-all duration-200"
                              style={{
                                background: intent === opt.id ? `${opt.color}10` : "rgba(255,255,255,0.02)",
                                border: `1px solid ${intent === opt.id ? `${opt.color}35` : "rgba(255,255,255,0.06)"}`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Icon size={15} style={{ color: intent === opt.id ? opt.color : "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                                <div>
                                  <div className="text-[13px] font-bold" style={{ color: intent === opt.id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }}>{opt.label}</div>
                                  <div className="text-[11px] text-white/25 mt-0.5">{opt.description}</div>
                                </div>
                                {intent === opt.id && <Check size={12} className="ml-auto" style={{ color: opt.color }} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {step === "depth" && (
                    <motion.div
                      key="depth"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-[17px] font-bold text-white/80 mb-2">Where are you in the process?</h2>
                      <p className="text-[12px] text-white/30 mb-6">Helps calibrate the right level of detail.</p>
                      <div className="space-y-3">
                        {depthQuestions.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => setDepth(q.id)}
                            className="w-full text-left px-5 py-4 rounded-xl transition-all duration-200"
                            style={{
                              background: depth === q.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                              border: `1px solid ${depth === q.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: depth === q.id ? "white" : "rgba(255,255,255,0.15)" }} />
                              <div>
                                <div className="text-[13px] font-bold text-white/70">{q.label}</div>
                                <div className="text-[11px] text-white/25 mt-0.5">{q.description}</div>
                              </div>
                              {depth === q.id && <Check size={12} className="ml-auto text-white/50" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === "timeline" && (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-[17px] font-bold text-white/80 mb-2">What's your decision timeline?</h2>
                      <p className="text-[12px] text-white/30 mb-6">No wrong answer — used to prioritise response.</p>
                      <div className="space-y-3">
                        {timelineOptions.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTimeline(t.id)}
                            className="w-full text-left px-5 py-4 rounded-xl transition-all duration-200"
                            style={{
                              background: timeline === t.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                              border: `1px solid ${timeline === t.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: timeline === t.id ? "white" : "rgba(255,255,255,0.15)" }} />
                              <div>
                                <div className="text-[13px] font-bold text-white/70">{t.label}</div>
                                <div className="text-[11px] text-white/25 mt-0.5">{t.description}</div>
                              </div>
                              {timeline === t.id && <Check size={12} className="ml-auto text-white/50" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === "routing" && routeData && (
                    <motion.div
                      key="routing"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className="p-6 rounded-2xl mb-6"
                        style={{ background: `${routeData.color}08`, border: `1px solid ${routeData.color}25` }}
                      >
                        <div className="h-[1px] rounded-full mb-5" style={{ background: `linear-gradient(90deg, ${routeData.color}, transparent)` }} />
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: routeData.color, boxShadow: `0 0 10px ${routeData.color}` }} />
                          <h3 className="text-[16px] font-bold text-white/85">{routeData.title}</h3>
                        </div>
                        <p className="text-[12px] leading-[1.75] text-white/40 mb-6">{routeData.description}</p>

                        <div className="flex flex-col gap-3">
                          <a
                            href={routeData.href}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200"
                            style={{ background: routeData.color, color: "#080b12" }}
                          >
                            {routeData.cta}
                            <ArrowRight size={14} />
                          </a>
                          {routeData.secondaryHref.startsWith("mailto:") ? (
                            <a
                              href={routeData.secondaryHref}
                              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[12px] font-medium transition-all duration-200 text-white/40 hover:text-white/70"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                            >
                              <Calendar size={12} />
                              {routeData.secondary}
                            </a>
                          ) : (
                            <Link
                              href={routeData.secondaryHref}
                              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[12px] font-medium transition-all duration-200 text-white/40 hover:text-white/70"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                            >
                              {routeData.secondary}
                            </Link>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleReset}
                        className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
                      >
                        ← Start over
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step !== "routing" && (
                  <motion.div
                    layout
                    className="mt-6 flex items-center gap-4"
                  >
                    {step !== "intent" && (
                      <button
                        onClick={() => {
                          if (step === "depth") setStep("intent");
                          else if (step === "timeline") setStep("depth");
                        }}
                        className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        ← Back
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      disabled={!canNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200"
                      style={{
                        background: canNext ? "white" : "rgba(255,255,255,0.06)",
                        color: canNext ? "#080b12" : "rgba(255,255,255,0.25)",
                        cursor: canNext ? "pointer" : "not-allowed",
                      }}
                    >
                      Continue <ChevronRight size={14} />
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="space-y-5">
                <div
                  className="p-6 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-4">Why direct?</div>
                  <div className="space-y-4">
                    {[
                      { icon: "⚡", title: "No bankers, no intermediaries", desc: "Every conversation is direct with the founder. Faster decisions, fuller context." },
                      { icon: "🔒", title: "NDA-protected materials", desc: "The data room is available within 24 hours of a qualified request." },
                      { icon: "📐", title: "Architected for due diligence", desc: "92/100 acquisition readiness score — the data room is complete and audit-ready." },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                        <div>
                          <div className="text-[12px] font-bold text-white/60 mb-0.5">{item.title}</div>
                          <div className="text-[11px] text-white/25 leading-relaxed">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-6 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-4">Prefer to go straight to it?</div>
                  <div className="space-y-2.5">
                    <a
                      href="mailto:stephenlutar2@gmail.com?subject=Investor Inquiry — SZL Holdings"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.04] text-white/40 hover:text-white/70"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <Mail size={13} />
                      <span className="text-[12px] font-medium">stephenlutar2@gmail.com</span>
                    </a>
                    <Link
                      href="/investor"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.04] text-white/40 hover:text-white/70"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <Building2 size={13} />
                      <span className="text-[12px] font-medium">View full investor due diligence →</span>
                    </Link>
                  </div>
                </div>

                <p className="text-[11px] text-white/15 px-1">
                  All information shared is treated as confidential. Contact is direct with Stephen Lutar, founder. No cold outreach list or newsletter subscription implied.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default InvestorCTA;
