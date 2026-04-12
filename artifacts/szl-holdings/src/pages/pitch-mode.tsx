import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Play, ChevronRight, ChevronLeft, Shield, Ship, Map, Layers,
  Activity, Eye, ArrowUpRight, ExternalLink, CheckCircle2,
  BarChart3, Globe, Sparkles, X,
} from "lucide-react";

const ACC = "hsl(191,92%,44%)";
const SURFACE = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.06)";
const TEXT_PRIMARY = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const TEXT_MUT = "hsl(214,7%,38%)";

interface PitchSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  content: React.ReactNode;
}

const SLIDES: PitchSlide[] = [
  {
    id: "intro",
    title: "SZL Holdings",
    subtitle: "One infrastructure layer powering six vertical AI platforms",
    icon: Sparkles,
    color: ACC,
    content: (
      <div>
        <p style={{ fontSize: 14, color: "hsl(214,7%,65%)", lineHeight: 1.75, marginBottom: 20 }}>
          SZL is not a holding company in the traditional sense. It is a platform company that has deployed a single AI infrastructure stack across six specialized verticals — each vertical independently differentiated, each deeply embedded in its market, and each contributing proprietary data back to a shared intelligence model.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Portfolio Companies", value: "6" },
            { label: "Shared Infrastructure Layers", value: "7" },
            { label: "Combined Active Users", value: "9,486" },
          ].map(s => (
            <div key={s.label} style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: ACC, margin: "0 0 4px", letterSpacing: "-0.04em" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: TEXT_MUT, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "vessels",
    title: "Vessels",
    subtitle: "Maritime Intelligence — $118K ARR · 2,847 users · +18% MoM",
    icon: Ship,
    color: "#38bdf8",
    href: "/vessels/",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "hsl(214,7%,65%)", lineHeight: 1.75, marginBottom: 16 }}>
          Vessels provides real-time fleet intelligence, route optimization, cargo analytics, and geopolitical risk modeling for maritime operators and cargo owners. The platform processes AIS data from 200,000+ tracked vessels and correlates it with sanctions lists, weather systems, and port congestion data in real time.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Real-time AIS tracking for 200K+ vessels globally",
            "AI-powered route optimization with $380K+ per-voyage savings documented",
            "Geopolitical threat scoring updated every 15 minutes",
            "Integration with Lloyd's, BIMCO, and major P&I clubs",
          ].map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <CheckCircle2 size={13} style={{ color: "#38bdf8", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: TEXT_SEC }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "aegis",
    title: "Aegis",
    subtitle: "Defense Intelligence — $74K ARR · 1,204 users · +9% MoM",
    icon: Shield,
    color: "#f87171",
    href: "/firestorm/",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "hsl(214,7%,65%)", lineHeight: 1.75, marginBottom: 16 }}>
          Aegis is a unified defense and intelligence command platform for security teams operating in high-stakes environments. The platform integrates threat feeds, incident command, and compliance tracking into a single operator console.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Real-time threat intelligence aggregation from 40+ feeds",
            "AI-prioritized incident command with SLA tracking",
            "Compliance posture scoring across 12 frameworks",
            "Fully air-gappable deployment option for classified environments",
          ].map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <CheckCircle2 size={13} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: TEXT_SEC }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "terra",
    title: "Terra",
    subtitle: "Real Estate Intelligence — $143K ARR · 4,182 users · +28% MoM",
    icon: Map,
    color: "#a07848",
    href: "/terra/",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "hsl(214,7%,65%)", lineHeight: 1.75, marginBottom: 16 }}>
          Terra is an AI-powered real estate intelligence platform for institutional investors, family offices, and operators managing distressed asset portfolios, commercial acquisitions, and multi-market strategies.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "AI distress signal detection across 12M+ properties",
            "Automated lease intelligence extraction and risk scoring",
            "Market velocity modeling at the sub-ZIP code level",
            "Direct integration with title, lien, and court data sources",
          ].map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <CheckCircle2 size={13} style={{ color: "#a07848", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: TEXT_SEC }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "prism",
    title: "PRISM Counsel",
    subtitle: "Legal Intelligence — $96K ARR · 892 users · +21% MoM",
    icon: Layers,
    color: "#d4a054",
    href: "/prism-counsel/",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "hsl(214,7%,65%)", lineHeight: 1.75, marginBottom: 16 }}>
          PRISM Counsel is an AI-native legal matter management platform for general counsel teams, law firms, and legal operations leaders who need complete matter visibility, workflow automation, and compliance tracking.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Matter intelligence and automatic status tracking across all active files",
            "AI-powered contract analysis with clause-level risk scoring",
            "Proof Chain — immutable audit log for privileged communications",
            "Deep integration with existing DMS, billing, and e-discovery platforms",
          ].map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <CheckCircle2 size={13} style={{ color: "#d4a054", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: TEXT_SEC }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "lyte",
    title: "Lyte",
    subtitle: "AIOps Command Center — $52K ARR · 318 users · +38% MoM",
    icon: Activity,
    color: "#d4a054",
    href: "/lyte-command-center/?view=app",
    content: (
      <div>
        <p style={{ fontSize: 14, color: "hsl(214,7%,65%)", lineHeight: 1.75, marginBottom: 16 }}>
          Lyte is the AIOps platform powering the SZL ecosystem. It monitors all portfolio products, predicts failures 24–48 hours before they occur, and closes the remediation loop with human-in-the-loop approval gates.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Autonomous Remediation Engine — proposes and executes fixes with approval gates",
            "Chaos Prediction — failure forecasts 24–48 hours out with probability scoring",
            "Cost-Performance Optimizer across all platform services",
            "Operational Narrative Engine — transforms dry metrics into readable stories",
          ].map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <CheckCircle2 size={13} style={{ color: "#d4a054", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: TEXT_SEC }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "metrics",
    title: "Growth & Economics",
    subtitle: "The numbers behind the platform",
    icon: BarChart3,
    color: "#4ade80",
    content: (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Combined ARR", value: "$511K", trend: "+21% MoM avg" },
            { label: "Total Active Users", value: "9,486", trend: "+18% avg MoM" },
            { label: "Platform NRR (est.)", value: "124%", trend: "Expansion from cross-sell" },
            { label: "Fastest Growing", value: "Terra", trend: "+28% MoM" },
            { label: "Payback Period", value: "8 months", trend: "Avg across verticals" },
            { label: "Infrastructure Cost", value: "$12K/mo", trend: "All 6 products" },
          ].map(s => (
            <div key={s.label} style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", margin: "0 0 2px", letterSpacing: "-0.03em" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: TEXT_MUT, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              <p style={{ fontSize: 10, color: TEXT_SEC, margin: 0 }}>{s.trend}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function PitchMode() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)" }}>
      {!fullScreen && <SiteNav />}
      <div style={{ maxWidth: fullScreen ? "100%" : 1100, margin: "0 auto", padding: fullScreen ? 0 : "80px 24px 80px" }}>
        {!fullScreen && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Play size={16} style={{ color: ACC }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: ACC, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Interactive Pitch Mode
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: TEXT_PRIMARY, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
              Platform Walkthrough
            </h1>
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 24px" }}>
              A guided, presentation-quality walkthrough of the entire SZL platform. Share this link with investors for a live product experience.
            </p>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SLIDES.map((s, i) => {
                const SIcon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 10px", borderRadius: 6,
                      border: `1px solid ${i === currentSlide ? s.color : BORDER}`,
                      background: i === currentSlide ? `${s.color}12` : "transparent",
                      color: i === currentSlide ? s.color : TEXT_MUT,
                      fontSize: 11, cursor: "pointer",
                    }}
                  >
                    <SIcon size={10} />
                    {s.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ position: "relative" }}>
          <m.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 14, overflow: "hidden",
              minHeight: fullScreen ? "100vh" : 480,
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ height: 3, background: `linear-gradient(90deg, ${slide.color}, transparent)` }} />
            <div style={{ padding: "36px 40px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: `${slide.color}15`, border: `1px solid ${slide.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} style={{ color: slide.color }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, letterSpacing: "-0.02em" }}>{slide.title}</h2>
                  <p style={{ fontSize: 13, color: TEXT_SEC, margin: 0 }}>{slide.subtitle}</p>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {slide.href && (
                    <a
                      href={slide.href}
                      target="_blank"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: `${slide.color}12`, border: `1px solid ${slide.color}25`,
                        borderRadius: 7, padding: "6px 12px", color: slide.color, fontSize: 11, textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={10} /> View Live Demo
                    </a>
                  )}
                </div>
              </div>
              {slide.content}
            </div>

            <div style={{ padding: "16px 40px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${BORDER}` }}>
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "none", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "7px 14px",
                  color: currentSlide === 0 ? TEXT_MUT : TEXT_PRIMARY, cursor: currentSlide === 0 ? "default" : "pointer",
                  fontSize: 12,
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                {SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: i === currentSlide ? ACC : "hsla(0,0%,100%,0.15)",
                    border: "none", cursor: "pointer", padding: 0,
                  }} />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide(Math.min(SLIDES.length - 1, currentSlide + 1))}
                disabled={currentSlide === SLIDES.length - 1}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: currentSlide < SLIDES.length - 1 ? `${ACC}15` : "none",
                  border: `1px solid ${currentSlide < SLIDES.length - 1 ? ACC : BORDER}`,
                  borderRadius: 7, padding: "7px 14px",
                  color: currentSlide === SLIDES.length - 1 ? TEXT_MUT : ACC,
                  cursor: currentSlide === SLIDES.length - 1 ? "default" : "pointer",
                  fontSize: 12,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </m.div>
        </div>
      </div>
      {!fullScreen && <SiteFooter />}
    </div>
  );
}
