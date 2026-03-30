import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, BarChart3, Globe, Activity, Zap, Shield } from "lucide-react";

const sectors = [
  { name: "Defense Tech", signal: "Bullish", confidence: 91, drivers: ["NDAA 2026 spending", "Ukraine rebuild contracts", "AI integration mandates"], risk: "Low", ytd: "+38%", color: "#3b82f6" },
  { name: "Maritime / Shipping", signal: "Neutral", confidence: 72, drivers: ["Red Sea rerouting normalizing", "Port automation wave"], risk: "Medium", ytd: "+12%", color: "#06b6d4" },
  { name: "AIOps / Observability", signal: "Bullish", confidence: 88, drivers: ["Enterprise AI ops adoption", "Datadog / New Relic M&A wave"], risk: "Low", ytd: "+54%", color: "#f59e0b" },
  { name: "PropTech", signal: "Cautious", confidence: 61, drivers: ["Rate cut cycle emerging", "Distressed office market opportunities"], risk: "Medium", ytd: "+7%", color: "#10b981" },
  { name: "Cybersecurity", signal: "Bullish", confidence: 94, drivers: ["CMMC mandates", "Critical infra regulation"], risk: "Low", ytd: "+47%", color: "#ef4444" },
];

const signals: Record<string, string> = {
  Bullish: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Neutral: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Cautious: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const theses = [
  {
    title: "Vertical AI > Horizontal AI",
    thesis: "Sector-specific AI platforms with deep domain data moats outperform general-purpose tools by 3–5x on NRR in defense and maritime verticals.",
    conviction: 9.2,
    timeframe: "18–36 months",
  },
  {
    title: "Government as First Customer",
    thesis: "Defense and federal contract wins function as revenue predictability anchors — enabling faster Series A raises and de-risking go-to-market for B2B expansion.",
    conviction: 8.7,
    timeframe: "12–24 months",
  },
  {
    title: "Intelligence Compounding Effect",
    thesis: "Shared data infrastructure across portfolio companies creates cross-vertical ML feedback loops that are effectively impossible for single-product competitors to replicate.",
    conviction: 9.5,
    timeframe: "24–48 months",
  },
];

export function MarketIntelligenceSection() {
  const [selectedSector, setSelectedSector] = useState(sectors[0]);

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Market Intelligence</h2>
          <div className="flex items-end justify-between gap-6">
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Sector Signals &<br /> Investment Theses
            </h3>
            <p className="hidden md:block text-muted-foreground max-w-sm text-sm leading-relaxed">
              Real-time sector conviction signals and proprietary investment theses built from pattern recognition across the SZL portfolio.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sector Navigator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 space-y-3"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Sector Coverage
            </p>
            {sectors.map(s => (
              <button
                key={s.name}
                onClick={() => setSelectedSector(s)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSector.name === s.name ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/50 hover:border-border"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${signals[s.signal]}`}>{s.signal}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>Confidence: <span className="text-foreground font-medium">{s.confidence}%</span></span>
                  <span>YTD: <span className={`font-medium ${s.ytd.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{s.ytd}</span></span>
                </div>
                <div className="mt-2 h-1 bg-border/30 rounded-full">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.confidence}%`, backgroundColor: s.color }} />
                </div>
              </button>
            ))}
          </motion.div>

          {/* Sector Detail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8 space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-serif font-bold text-foreground">{selectedSector.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Risk Profile: <span className={selectedSector.risk === "Low" ? "text-emerald-400" : "text-amber-400"}>{selectedSector.risk}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono" style={{ color: selectedSector.color }}>{selectedSector.ytd}</p>
                  <p className="text-[10px] text-muted-foreground">YTD Return</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Key Drivers
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSector.drivers.map(d => (
                    <span key={d} className="text-xs px-3 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground">{d}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Conviction Score</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${selectedSector.confidence}%`, backgroundColor: selectedSector.color }} />
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: selectedSector.color }}>{selectedSector.confidence}%</span>
              </div>
            </div>

            {/* Investment Theses */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Active Investment Theses
              </p>
              <div className="space-y-3">
                {theses.map((t, i) => (
                  <motion.div
                    key={t.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border bg-card/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h5 className="text-sm font-semibold text-foreground">{t.title}</h5>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary font-mono">{t.conviction}/10</p>
                        <p className="text-[9px] text-muted-foreground">{t.timeframe}</p>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{t.thesis}</p>
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-4 font-mono">Mock Data · For illustrative purposes only</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
