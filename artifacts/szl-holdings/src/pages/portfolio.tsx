import { useState, useMemo, useEffect } from "react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { VentureCard } from "@/components/VentureCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ventures, type VentureCategory, type VentureStatus } from "@/data/ventures";
import { analytics, initScrollDepthTracking } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CATEGORIES: (VentureCategory | "All")[] = [
  "All",
  "Command Systems",
  "Maritime Intelligence",
  "AI / ML",
  "Cybersecurity",
  "Real Estate Tech",
  "Creative Tech",
  "Managed Services",
  "Consulting",
];

const STATUS_FILTERS: (VentureStatus | "All")[] = [
  "All",
  "Live",
  "Pilot Ready",
  "In Build",
  "Private Demo",
];

export default function PortfolioPage() {
  const [category, setCategory] = useState<VentureCategory | "All">("All");
  const [status, setStatus] = useState<VentureStatus | "All">("All");

  useEffect(() => {
    document.title = "Portfolio — SZL Holdings";
    const cleanup = initScrollDepthTracking("portfolio");
    return cleanup;
  }, []);

  const filtered = useMemo(() => {
    return ventures.filter((v) => {
      const categoryMatch = category === "All" || v.category === category;
      const statusMatch = status === "All" || v.status === status;
      return categoryMatch && statusMatch;
    });
  }, [category, status]);

  const handleCategoryFilter = (c: VentureCategory | "All") => {
    setCategory(c);
    analytics.portfolioFilter("category", c);
  };

  const handleStatusFilter = (s: VentureStatus | "All") => {
    setStatus(s);
    analytics.portfolioFilter("status", s);
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="pt-24">
        <section className="bg-white border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-3">
                Portfolio
              </p>
              <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-extrabold text-szl-text leading-tight tracking-tight mb-4">
                Eight ventures.
                <br />
                <span className="text-szl-accent">One ecosystem.</span>
              </h1>
              <p className="text-szl-text-secondary text-base max-w-xl leading-relaxed">
                Each venture commands its vertical — sharing intelligence, infrastructure, and a common operating philosophy that makes the whole more valuable than the sum of its parts.
              </p>
            </m.div>
          </div>
        </section>

        <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-xl border-b border-szl-border">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCategoryFilter(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                      category === c
                        ? "bg-szl-primary text-white"
                        : "text-szl-text-secondary hover:text-szl-text hover:bg-szl-bg-secondary border border-transparent hover:border-szl-border"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="hidden sm:block w-px h-4 bg-szl-border" />

              <div className="flex gap-1.5 flex-wrap">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusFilter(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                      status === s
                        ? "bg-szl-primary/10 text-szl-primary border border-szl-primary/20"
                        : "text-szl-text-secondary hover:text-szl-text hover:bg-szl-bg-secondary border border-transparent hover:border-szl-border"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="text-xs text-szl-text-muted sm:ml-auto">
                {filtered.length} {filtered.length === 1 ? "venture" : "ventures"}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6">
            {filtered.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((venture, i) => (
                  <VentureCard key={venture.id} venture={venture} index={i} size="featured" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-szl-text-muted">
                <p className="text-base font-medium mb-1">No ventures match these filters.</p>
                <p className="text-sm">
                  <button
                    onClick={() => { setCategory("All"); setStatus("All"); }}
                    className="text-szl-accent hover:underline"
                  >
                    Reset filters
                  </button>
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-szl-bg-secondary border-t border-szl-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { value: "$2.4B+", label: "Combined TAM", body: "Across all eight venture categories" },
                { value: "142%", label: "YoY Revenue Growth", body: "Aggregate across the active portfolio" },
                { value: "40%", label: "Infrastructure Savings", body: "vs. standalone companies at equivalent stage" },
              ].map((stat) => (
                <m.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-szl-border bg-white p-7 text-center"
                >
                  <p className="font-[var(--font-display)] font-bold text-3xl text-szl-text mb-1">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-szl-accent mb-2">{stat.label}</p>
                  <p className="text-xs text-szl-text-muted">{stat.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
