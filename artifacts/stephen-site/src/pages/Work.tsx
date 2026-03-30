import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const projects = [
  { slug: "alloy", year: "2024–present", title: "Alloy Execution Fabric", role: "Founder & Architect", description: "Execution fabric and predictive intelligence engine powering Lyte, Vessels, and the full SZL ecosystem. Scenario modeling, confidence scoring, and agent coordination at the platform layer.", tags: ["Execution Fabric", "Predictive Intelligence", "Enterprise"] },
  { slug: "vessels", year: "2024–present", title: "Vessels Maritime Intelligence", role: "Founder & Architect", description: "Enterprise maritime intelligence platform covering AIS fleet tracking, exception management, voyage economics, sanctions screening, and dark vessel detection. Built for fleet executives, operations teams, and compliance functions.", tags: ["Enterprise SaaS", "Maritime", "AI/ML"] },
  { slug: "szl-holdings", year: "2023–present", title: "SZL Holdings", role: "Founder & CEO", description: "Strategic technology portfolio spanning enterprise software, maritime intelligence, business telemetry, and consulting. Built to develop and scale a portfolio of domain-specific platforms.", tags: ["Portfolio Company", "Strategic Holding", "Enterprise Technology"] },
  { slug: "carlota-jo", year: "2024", title: "Carlota Jo Consulting", role: "Technical Advisor", description: "Boutique strategic advisory platform for founder-led businesses. Designed the technology architecture for the client portal, engagement management, and advisory intelligence layer.", tags: ["Consulting Tech", "Strategic Advisory"] },
  { slug: "lyte-command-center", year: "2024", title: "Lyte Command Center", role: "Founder & Architect", description: "Unified AI operations dashboard aggregating signals from across the SZL portfolio. Multi-model routing, real-time observability, and cross-platform command capabilities.", tags: ["AI Operations", "Enterprise Dashboard", "Platform"] },
];

export function Work() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-14">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Work</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Selected projects</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl">
            Enterprise infrastructure, AI platforms, and strategic products built within the SZL Holdings portfolio — and earlier.
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
