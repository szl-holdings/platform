import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const projects = [
  {
    slug: "terra",
    year: "2024–present",
    title: "Terra — Real Estate Intelligence",
    role: "Founder & Architect",
    description: "Distress-first real estate intelligence platform for operators, brokers, and capital allocators working across New York City's five boroughs. Multi-factor distress scoring, live deal pipeline, and borough-level market context.",
    tags: ["Distress Intelligence", "PostGIS", "NYC Data", "Real Estate"],
  },
  {
    slug: "aegis",
    year: "2024–present",
    title: "Aegis — Unified Defense & Intelligence Command",
    role: "Founder & Architect",
    description: "Unified command surface for SOC operations, threat intelligence, and MSP management — three historically separate functions converged into one correlated operational layer. Built around the MITRE ATT&CK framework.",
    tags: ["Cybersecurity", "Threat Intelligence", "SOC", "MSP Command"],
  },
  {
    slug: "vessels",
    year: "2024–present",
    title: "Vessels Maritime Intelligence",
    role: "Founder & Architect",
    description: "Enterprise maritime intelligence platform covering AIS fleet tracking, exception management, voyage economics, sanctions screening, and dark vessel detection. Built for fleet executives, operations teams, and compliance functions.",
    tags: ["Maritime", "AIS Tracking", "Voyage Economics", "Sanctions Compliance"],
  },
  {
    slug: "alloy",
    year: "2024–present",
    title: "Alloy — Execution Fabric",
    role: "Founder & Architect",
    description: "Workflow orchestration and signal routing engine powering cross-platform decision workflows across the SZL portfolio. Built as platform infrastructure, not a product feature — the execution substrate for every other platform.",
    tags: ["Workflow Orchestration", "Signal Routing", "Platform Infrastructure", "AI Coordination"],
  },
  {
    slug: "lyte-command-center",
    year: "2024",
    title: "Lyte Command Center",
    role: "Founder & Architect",
    description: "Unified AI operations dashboard aggregating signals from across the SZL portfolio. Multi-model routing, real-time cross-platform observability, and command mode for operational decisions under time pressure.",
    tags: ["AI Operations", "Multi-Model Routing", "Observability", "Command Interface"],
  },
  {
    slug: "szl-holdings",
    year: "2023–present",
    title: "SZL Holdings",
    role: "Founder & CEO",
    description: "Strategic technology portfolio spanning enterprise software, maritime intelligence, AI infrastructure, and real estate intelligence. Built to develop and scale a portfolio of domain-specific platforms on a shared architectural foundation.",
    tags: ["Portfolio Company", "Enterprise Strategy", "Shared Infrastructure"],
  },
];

export function Work() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-14">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Work</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Selected case studies</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl">
            Domain-specific command platforms built across maritime intelligence, cybersecurity, AI infrastructure, and real estate. Each entry covers the problem, the approach, the architecture decisions, and the outcome.
          </p>
        </div>

        <div className="space-y-px">
          {projects.map((project) => (
            <Link key={project.slug} href={`/work/${project.slug}`}>
              <div className="group border-t border-white/5 py-8 cursor-pointer hover:bg-white/2 transition-colors px-1 -mx-1">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-mono text-white/25">{project.year}</span>
                      <span className="text-[10px] text-muted-foreground/50">{project.role}</span>
                    </div>
                    <h2 className="text-[18px] font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{project.title}</h2>
                    <p className="text-muted-foreground text-[13.5px] leading-relaxed mb-3 max-w-xl">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Work;
