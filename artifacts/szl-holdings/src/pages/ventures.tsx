import { Link } from "wouter";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const ventures = [
  {
    slug: "vessels",
    name: "Vessels",
    category: "Maritime Intelligence",
    badge: "Active",
    stage: "Growth",
    description: "Real-time maritime operations platform for fleet executives, operations teams, and commercial managers. AIS tracking, exception management, voyage economics, and maintenance readiness across global shipping lanes.",
    accent: "#3b82f6",
    url: "/vessels/",
  },
  {
    slug: "inca",
    name: "INCA",
    category: "AI Research Intelligence",
    badge: "Active",
    stage: "Growth",
    description: "Agentic intelligence cortex for enterprise AI research. Signal visibility, ML experiment tracking, model registry, and production monitoring with explainable AI outputs and full audit trails.",
    accent: "#f59e0b",
    url: "/inca/",
  },
  {
    slug: "carlota-jo",
    name: "Carlota Jo",
    category: "Strategic Consulting",
    badge: "Active",
    stage: "Established",
    description: "Boutique strategic consulting for founder-led businesses. Brand positioning, growth strategy, and advisory engagements — conducted with discretion, depth, and long-term alignment.",
    accent: "#c8a96a",
    url: "/carlota-jo/",
  },
  {
    slug: "stephen",
    name: "Stephen Lutar",
    category: "Personal Brand",
    badge: "Active",
    stage: "Established",
    description: "The personal site of Stephen Lutar — founder, builder, and strategic operator. Selected work, thesis, writing, and public presence.",
    accent: "#64748b",
    url: "/stephen/",
  },
];

export default function VenturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-[hsl(215,45%,45%)] tracking-[0.15em] uppercase mb-3">Portfolio</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
            The SZL Ventures
          </h1>
          <p className="text-neutral-500 text-[15px] leading-relaxed max-w-xl">
            A focused ecosystem of technology companies built to operate at the frontier of their respective domains.
          </p>
        </div>

        <div className="space-y-6">
          {ventures.map((v) => (
            <div
              key={v.slug}
              className="border border-neutral-100 rounded-xl p-7 hover:border-neutral-200 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: v.accent }}
                    />
                    <span className="text-[10px] font-semibold text-neutral-400 tracking-[0.12em] uppercase">
                      {v.category}
                    </span>
                    <span className="text-[10px] text-neutral-300">·</span>
                    <span className="text-[10px] text-neutral-400">{v.stage}</span>
                  </div>
                  <h2 className="text-[19px] font-bold text-neutral-900 mb-2">{v.name}</h2>
                  <p className="text-neutral-500 text-[13.5px] leading-relaxed max-w-xl">{v.description}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {v.badge}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/ventures/${v.slug}`}
                      className="flex items-center gap-1 text-[12px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      Details <ChevronRight size={12} />
                    </Link>
                    <a
                      href={v.url}
                      className="flex items-center gap-1 text-[12px] font-medium text-[hsl(215,45%,40%)] hover:text-[hsl(215,45%,30%)] transition-colors"
                    >
                      Visit <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
