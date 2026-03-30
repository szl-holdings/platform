import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";

const projectData: Record<string, { title: string; year: string; role: string; description: string; details: string[]; link?: string }> = {
  vessels: {
    title: "Vessels Maritime Intelligence",
    year: "2024–present",
    role: "Founder & Architect",
    description: "Enterprise maritime intelligence platform for fleet executives, operations teams, and commercial managers.",
    details: [
      "Designed end-to-end product architecture for a maritime intelligence platform serving fleet operators globally.",
      "Built real-time AIS tracking, exception management, voyage economics, and sanctions screening capabilities.",
      "Developed dark vessel detection using AIS signal gap analysis and behavioral scoring.",
      "Architected multi-tenant data isolation, role-based access, and full audit trail for compliance use.",
      "Designed the voyage P&L model integrating revenue, cost, delay exposure, and charter performance.",
    ],
    link: "/vessels/",
  },
  inca: {
    title: "INCA Agentic Intelligence Platform",
    year: "2024–present",
    role: "Founder & Architect",
    description: "AI research and intelligence platform with explainable AI outputs and traceable decision workflows.",
    details: [
      "Designed the intelligence platform architecture for enterprise signal management and AI-assisted triage.",
      "Built explainability layer providing evidence chains for every model output — not just confidence scores.",
      "Developed multi-agent orchestration with Quipu Command, Chasqui Relay, and Willaq Umu Oracle.",
      "Architected multi-tenant data isolation with immutable audit trails for regulatory compliance.",
      "Built model registry, experiment tracking, and GPU monitoring infrastructure for research teams.",
    ],
    link: "/inca/",
  },
  "szl-holdings": {
    title: "SZL Holdings",
    year: "2023–present",
    role: "Founder & CEO",
    description: "Strategic technology portfolio spanning enterprise software, maritime intelligence, and AI research.",
    details: [
      "Founded and built SZL Holdings as a strategic holding company for domain-specific enterprise platforms.",
      "Developed portfolio strategy covering maritime intelligence, AI research, consulting tech, and creative infrastructure.",
      "Built shared infrastructure layer enabling cross-portfolio observability, auth, and component reuse.",
      "Established brand and communication architecture across portfolio companies.",
    ],
    link: "/szl-holdings/",
  },
  "carlota-jo": {
    title: "Carlota Jo Consulting Platform",
    year: "2024",
    role: "Technical Advisor",
    description: "Technology architecture for a boutique strategic advisory firm — client portal, engagement management, and AI advisory layer.",
    details: [
      "Designed client portal with document management, progress updates, and secure messaging.",
      "Built AI advisory intelligence layer for client readiness signals and session preparation.",
      "Developed engagement workflow management for multi-phase consulting engagements.",
      "Architected content strategy and brand audit tooling for client deliverables.",
    ],
    link: "/carlota-jo/",
  },
  "lyte-command-center": {
    title: "Lyte Command Center",
    year: "2024",
    role: "Founder & Architect",
    description: "Unified AI operations dashboard aggregating signals from across the SZL portfolio.",
    details: [
      "Designed multi-model AI routing layer connecting OpenAI, Anthropic, and Gemini models via unified API.",
      "Built real-time portfolio observability dashboard with cross-app signal aggregation.",
      "Developed command mode for focused operational decisions across multiple AI workstreams.",
    ],
    link: "/lyte-command-center/",
  },
};

export function WorkDetail() {
  const [match, params] = useRoute("/work/:slug");
  const slug = params?.slug || "";
  const project = projectData[slug];

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Link href="/work" className="text-primary hover:underline">Back to work</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-10">
          <Link href="/work" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to work
          </Link>
          <p className="text-[10px] font-mono text-white/25 mb-1">{project.year} · {project.role}</p>
          <h1 className="text-3xl font-bold text-foreground mb-4">{project.title}</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">{project.description}</p>
        </div>

        <div className="border-t border-white/5 pt-8 mb-10">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-5">What I built</h2>
          <ul className="space-y-3">
            {project.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1 h-1 rounded-full bg-primary/40 mt-2.5 shrink-0" />
                <span className="text-muted-foreground text-[14px] leading-relaxed">{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {project.link && (
          <div className="border-t border-white/5 pt-8">
            <a
              href={project.link}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View live product →
            </a>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default WorkDetail;
