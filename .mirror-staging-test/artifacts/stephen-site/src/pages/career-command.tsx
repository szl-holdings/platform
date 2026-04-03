import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Download, Loader2 } from "lucide-react";

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
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? "Generating..." : "Download Resume PDF"}
          </button>
          {downloadError && <p className="mt-2 text-[11px] text-destructive/80">{downloadError}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-white/6 rounded-lg p-5">
              <div className="text-2xl font-serif font-normal text-primary mb-1">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.12em]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-7">Platforms built</h2>
          <div className="space-y-px">
            {platforms.map((platform) => (
              <div key={platform.name} className="border-t border-white/5 py-5 flex items-start gap-4">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: platform.color, boxShadow: `0 0 6px ${platform.color}60` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[15px] font-semibold text-foreground">{platform.name}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">{platform.status}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{platform.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-7">Technology stack</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {techStack.map((layer) => (
              <div key={layer.layer} className="border border-white/6 rounded-lg p-4">
                <h3 className="text-[11px] font-semibold text-primary/50 uppercase tracking-[0.12em] mb-3">{layer.layer}</h3>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span key={item} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-white/50 border border-white/8">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-7">Key milestones</h2>
          <div className="relative">
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-white/5" />
            <div className="space-y-0">
              {milestones.map((milestone, i) => (
                <div key={i} className="relative pl-8 pb-8 last:pb-0">
                  <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center ${milestone.highlight ? "bg-primary" : "bg-white/15"}`}>
                    {milestone.highlight && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                  </div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[10px] font-mono text-primary/60">{milestone.year}</span>
                    <span className={`text-[14px] font-semibold ${milestone.highlight ? "text-foreground" : "text-foreground/80"}`}>{milestone.event}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{milestone.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex items-center justify-between">
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
