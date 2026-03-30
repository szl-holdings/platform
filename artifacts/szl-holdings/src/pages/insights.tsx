import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { ArrowRight, Clock, Calendar, Tag, Rss, ChevronRight } from "lucide-react";
import { insights, CATEGORIES, getInsightsByCategory } from "@/data/insights";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

const CATEGORY_COLORS: Record<string, string> = {
  "Annual Letter": "text-amber-600 bg-amber-50 border-amber-200",
  "Maritime Intelligence": "text-sky-700 bg-sky-50 border-sky-200",
  "Cybersecurity": "text-red-700 bg-red-50 border-red-200",
  "AI/ML": "text-violet-700 bg-violet-50 border-violet-200",
  "Real Estate": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Creative Tech": "text-pink-700 bg-pink-50 border-pink-200",
  "Operations": "text-indigo-700 bg-indigo-50 border-indigo-200",
};

export default function InsightsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [, navigate] = useLocation();

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const filteredInsights = useMemo(() => {
    return getInsightsByCategory(activeCategory);
  }, [activeCategory]);

  const flagship = insights.find((i) => i.flagship);
  const grid = filteredInsights.filter((i) => !i.flagship);

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
              className="flex items-end justify-between gap-6 flex-wrap"
            >
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-szl-primary uppercase tracking-widest mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-szl-primary inline-block" />
                  Insights
                </span>
                <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-extrabold text-szl-text leading-tight tracking-tight">
                  Ideas That Move<br />
                  <span className="text-szl-accent">Markets</span>
                </h1>
                <p className="mt-4 text-szl-text-secondary text-base max-w-xl leading-relaxed">
                  Perspectives on AI, maritime intelligence, cybersecurity, real estate tech, creative production, and the thesis driving the SZL ecosystem.
                </p>
              </div>
              <a
                href={`${base}/insights/rss.xml`}
                className="flex items-center gap-2 text-xs font-medium text-szl-text-secondary border border-szl-border rounded-lg px-4 py-2.5 hover:border-szl-primary hover:text-szl-primary transition-colors"
              >
                <Rss size={14} />
                RSS Feed
              </a>
            </m.div>
          </div>
        </section>

        {flagship && activeCategory === "All" && (
          <section className="bg-szl-bg-secondary border-b border-szl-border">
            <div className="max-w-6xl mx-auto px-6 py-12">
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-szl-primary">
                  Flagship · Annual Letter
                </span>
              </div>
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <button
                  onClick={() => navigate(`/insights/${flagship.slug}`)}
                  className="group block w-full text-left cursor-pointer bg-transparent border-0 p-0"
                >
                  <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[flagship.category]}`}>
                          <Tag size={9} />
                          {flagship.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-szl-text-muted">
                          <Clock size={11} />
                          {flagship.readTime} min read
                        </span>
                        <span className="flex items-center gap-1 text-xs text-szl-text-muted">
                          <Calendar size={11} />
                          {flagship.date}
                        </span>
                      </div>

                      <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-szl-text leading-tight tracking-tight group-hover:text-szl-accent transition-colors mb-4">
                        {flagship.title}
                      </h2>

                      <p className="text-szl-text-secondary text-sm leading-relaxed mb-6 max-w-lg">
                        {flagship.excerpt}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-semibold text-szl-primary group-hover:gap-3 transition-all">
                        Read the Annual Letter
                        <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <div className="rounded-2xl border border-szl-border bg-white p-8 shadow-sm">
                        <div className="grid grid-cols-2 gap-0">
                          {[
                            { value: "$180M+", label: "Deployed Capital" },
                            { value: "142%", label: "YoY Revenue Growth" },
                            { value: "6", label: "Operating Companies" },
                            { value: "$2.4B+", label: "Addressable Market" },
                          ].map((stat, idx) => (
                            <div
                              key={stat.label}
                              className={`text-center py-6 px-4 ${idx < 2 ? "border-b border-szl-border" : ""} ${idx % 2 === 0 ? "border-r border-szl-border" : ""}`}
                            >
                              <p className="font-[var(--font-display)] font-extrabold text-2xl text-szl-text mb-1">
                                {stat.value}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-szl-text-muted font-medium">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-szl-text-muted text-center mt-5 font-medium">
                          SZL Holdings · 2026 Ecosystem Metrics
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </m.div>
            </div>
          </section>
        )}

        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex gap-2 flex-wrap mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  activeCategory === cat
                    ? "bg-szl-primary text-white border-szl-primary shadow-sm"
                    : "bg-white text-szl-text-secondary border-szl-border hover:border-szl-primary hover:text-szl-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {grid.map((article, i) => (
              <m.article
                key={article.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <button
                  onClick={() => navigate(`/insights/${article.slug}`)}
                  className="group flex flex-col w-full h-full bg-white border border-szl-border rounded-2xl p-6 hover:border-szl-primary/40 hover:shadow-sm transition-all duration-200 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[article.category] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                      {article.category}
                    </span>
                  </div>

                  <h3 className="font-[var(--font-display)] font-bold text-base text-szl-text leading-snug mb-3 group-hover:text-szl-accent transition-colors text-left">
                    {article.title}
                  </h3>

                  <p className="text-szl-text-secondary text-xs leading-relaxed flex-1 mb-5 line-clamp-3 text-left">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-szl-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {article.readTime} min
                      </span>
                      <span>{article.date}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-szl-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Read <ArrowRight size={11} />
                    </span>
                  </div>
                </button>
              </m.article>
            ))}
          </div>

          {grid.length === 0 && (
            <div className="py-20 text-center text-szl-text-secondary text-sm">
              No articles in this category yet.
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
