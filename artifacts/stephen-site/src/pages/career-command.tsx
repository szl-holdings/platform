import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

const milestones = [
  {
    year: "2023",
    event: "Founded SZL Holdings",
    detail: "Established SZL Holdings as a strategic holding company to develop and operate a portfolio of domain-specific enterprise platforms under one compounding architecture.",
    highlight: true,
  },
  {
    year: "2024 Q1",
    event: "Alloy — Execution Fabric Engine",
    detail: "Shipped the core workflow orchestration and signal routing engine. Originally a standalone platform, Alloy was later absorbed as the internal execution fabric powering all portfolio decision workflows.",
    highlight: false,
  },
  {
    year: "2024 Q2",
    event: "Launched Vessels Maritime Intelligence",
    detail: "Shipped the maritime fleet intelligence platform covering AIS tracking, exception management, voyage economics, and sanctions screening. First vertical command platform in the portfolio.",
    highlight: false,
  },
  {
    year: "2024 Q2",
    event: "Launched Lyte Command Center",
    detail: "Shipped the unified AI operations dashboard with multi-model routing, cross-portfolio signal aggregation, and infrastructure observability. Now the operational nerve centre for the full ecosystem.",
    highlight: false,
  },
  {
    year: "2024 Q3",
    event: "Launched Aegis — Unified Defense & Intelligence",
    detail: "Shipped the unified cybersecurity command surface converging SOC operations, threat intelligence, and MSP management. First platform to demonstrate the cross-domain correlation thesis.",
    highlight: false,
  },
  {
    year: "2024 Q3",
    event: "Launched Terra — Real Estate Intelligence",
    detail: "Shipped the distress-first real estate intelligence platform covering all five NYC boroughs with multi-factor distress scoring, deal pipeline, and market context.",
    highlight: false,
  },
  {
    year: "2025",
    event: "Portfolio at full operating capacity",
    detail: "Five platforms live. Shared infrastructure compounding across the portfolio. Alloy absorbed as the internal execution engine. Lyte providing unified observability. Three distinct buyer categories engaged.",
    highlight: true,
  },
];

const platforms = [
  { name: "Lyte", desc: "Business Observability — AI ops, multi-model routing, cross-platform telemetry", status: "Live", color: "hsl(190,90%,55%)" },
  { name: "Vessels", desc: "Maritime Intelligence — AIS fleet tracking, voyage economics, sanctions screening", status: "Live", color: "hsl(205,85%,55%)" },
  { name: "Aegis", desc: "Defense & Intelligence Command — SOC, threat intel, MSP operations unified", status: "Live", color: "hsl(232,68%,60%)" },
  { name: "Terra", desc: "Real Estate Intelligence — distress scoring, deal pipeline, NYC market coverage", status: "Live", color: "hsl(140,56%,40%)" },
  { name: "Carlota Jo", desc: "Strategic Advisory Platform — client portal, engagement management, AI advisory", status: "Live", color: "hsl(38,55%,58%)" },
];

const techStack = [
  { layer: "Frontend", items: ["React", "TypeScript", "Vite", "Tailwind CSS", "Framer Motion", "Wouter", "TanStack Query"] },
  { layer: "Backend", items: ["Node.js", "Express", "TypeScript", "REST APIs", "GraphQL", "WebSockets"] },
  { layer: "Data", items: ["PostgreSQL", "PostGIS", "Drizzle ORM", "Redis", "Zod validation"] },
  { layer: "AI & ML", items: ["OpenAI GPT-4", "Anthropic Claude", "Google Gemini", "Multi-model routing", "RAG pipelines"] },
  { layer: "Infrastructure", items: ["Alloy (Execution Fabric)", "Monorepo (pnpm)", "Shared auth", "Row-level security", "Immutable audit logs", "Multi-tenant isolation"] },
  { layer: "Domains", items: ["Maritime (AIS, MMSI, IMO)", "Real estate (PostGIS, NYC Open Data)", "Cybersecurity (MITRE ATT&CK)", "Enterprise workflow orchestration"] },
];

const stats = [
  { value: "5", label: "Platforms live" },
  { value: "1", label: "Monorepo codebase" },
  { value: "150k+", label: "Lines of code" },
  { value: "1,200+", label: "Commits" },
  { value: "8", label: "Domain verticals" },
  { value: "2yr", label: "Portfolio build time" },
];

async function downloadPDF(template: string, data: Record<string, unknown>, filename: string): Promise<void> {
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template, data }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CareerCommand() {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownloadResume = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadPDF("stephen-resume", {}, "stephen-lutar-resume.pdf");
    } catch {
      setDownloadError("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">

        <div className="mb-14">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Career Command</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Builder dashboard</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl">
            Five platforms. One architecture. Built, shipped, and operated by a single founding engineer across maritime, cybersecurity, AI infrastructure, real estate, and enterprise operations.
          </p>
          <button
            onClick={handleDownloadResume}
            disabled={downloading}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", color: "hsl(0,0%,72%)" }}
            onMouseEnter={(e) => { if (!downloading) (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.09)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.06)"; }}
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? "Generating..." : "Download Resume PDF"}
          </button>
          {downloadError && <p className="mt-2 text-[11px] text-destructive/80">{downloadError}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
          {stats.map((stat, i) => {
            const accents = ["hsl(214,80%,65%)", "hsl(190,90%,55%)", "hsl(88,45%,48%)", "hsl(38,72%,58%)", "hsl(232,68%,60%)", "hsl(38,55%,58%)"];
            const accent = accents[i % accents.length];
            return (
              <div key={stat.label} style={{
                borderRadius: "12px", padding: "1rem",
                background: `radial-gradient(ellipse at top left, ${accent}08, rgba(255,255,255,0.02))`,
                border: `1px solid ${accent}18`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${accent}60, transparent)` }} />
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: accent, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.375rem" }}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.12em]">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-7">Platforms built</h2>
          <div className="space-y-0">
            {platforms.map((platform) => (
              <div key={platform.name} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "1.25rem 0", display: "flex", alignItems: "flex-start", gap: "1rem", transition: "background 0.18s" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", marginTop: "5px", flexShrink: 0, background: platform.color, boxShadow: `0 0 8px ${platform.color}50` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span className="text-[15px] font-semibold text-foreground">{platform.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle2 size={9} /> {platform.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{platform.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-7">Technology stack</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {techStack.map((layer) => (
              <div key={layer.layer} style={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "1rem", background: "rgba(255,255,255,0.015)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "2px", background: "linear-gradient(180deg, rgba(255,255,255,0.12), transparent)" }} />
                <h3 className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.12em] mb-3">{layer.layer}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {layer.items.map((item) => (
                    <span key={item} style={{ fontSize: "10.5px", padding: "3px 9px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-8">Key milestones</h2>
          <div className="relative">
            <div style={{ position: "absolute", left: "6px", top: "6px", bottom: "6px", width: "1px", background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)" }} />
            <div className="space-y-0">
              {milestones.map((milestone, i) => (
                <div key={i} style={{ position: "relative", paddingLeft: "2rem", paddingBottom: "2rem" }}>
                  <div style={{
                    position: "absolute", left: 0, top: "4px",
                    width: "13px", height: "13px", borderRadius: "50%",
                    background: milestone.highlight ? "hsl(214,80%,55%)" : "rgba(255,255,255,0.1)",
                    border: `2px solid ${milestone.highlight ? "hsl(214,80%,45%)" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: milestone.highlight ? "0 0 10px hsla(214,80%,55%,0.4)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {milestone.highlight && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "hsl(214,80%,60%)", fontWeight: 600 }}>{milestone.year}</span>
                    <span style={{ fontSize: "14px", fontWeight: milestone.highlight ? 700 : 600, color: milestone.highlight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)" }}>{milestone.event}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", lineHeight: 1.65 }}>{milestone.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/work" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            See case studies →
          </Link>
          <Link href="/contact" className="text-[13px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Get in touch
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
