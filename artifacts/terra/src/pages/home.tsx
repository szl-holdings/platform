import { motion } from "framer-motion";
import { Building2, TrendingUp, Shield, BarChart3, ArrowRight, Zap, Globe, Lock, Users, Cloud, AlertTriangle, DollarSign, Calculator, Flame, Gavel, FileText, Bell, CheckCircle, Star } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const features = [
  { icon: BarChart3, title: "Portfolio Analytics", description: "Track occupancy, revenue, NOI, and cap rates across your entire portfolio in real time.", gradient: "from-terra-primary to-terra-accent" },
  { icon: TrendingUp, title: "Market Intelligence", description: "Regional trend data, comparable sales, and price-per-sqft visualizations to stay ahead.", gradient: "from-terra-emerald to-green-400" },
  { icon: Shield, title: "Risk Monitoring", description: "Proactive alerts for vacancies, lease expirations, maintenance issues, and payment risks.", gradient: "from-terra-amber to-yellow-400" },
  { icon: Zap, title: "Deal Pipeline", description: "Track acquisitions and dispositions through every stage from sourcing to closing.", gradient: "from-terra-violet to-purple-400" },
  { icon: Globe, title: "Regional Insights", description: "Deep-dive into market dynamics across all your active regions with comparative analysis.", gradient: "from-terra-rose to-pink-400" },
  { icon: Lock, title: "Tenant Intelligence", description: "Complete tenant profiles, lease schedules, payment history, and renewal forecasting.", gradient: "from-cyan-500 to-blue-400" },
];

const heroReveal = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const ownershipData = [
  { address: "800 Fifth Ave, NYC", llc: "805 HoldCo LLC", realOwner: "Blackstone RE Partners", confidence: 97, duration: "8.3 yrs", debt: "Maturing Q2 2026", offMarket: 91 },
  { address: "1200 Market St, SF", llc: "Pacific Ventures LLC", realOwner: "KKR Real Estate", confidence: 89, duration: "12.1 yrs", debt: "Maturing Q4 2025", offMarket: 85 },
  { address: "500 N Michigan, CHI", llc: "Lakefront Holdings LLC", realOwner: "Brookfield AM", confidence: 94, duration: "5.7 yrs", debt: "Current", offMarket: 62 },
];

const climateRisk = [
  { address: "800 Fifth Ave, NYC", flood: 42, fire: 8, heat: 71, overall: "Medium", fema: "Zone AE" },
  { address: "1200 Market St, SF", flood: 18, fire: 67, heat: 54, overall: "High", fema: "Zone X" },
  { address: "500 N Michigan, CHI", flood: 55, fire: 12, heat: 38, overall: "Medium", fema: "Zone AH" },
];

const investmentScenarios = [
  { name: "Conservative", capRate: 5.2, irr: 8.4, equity: "$12.4M", hold: "7yr", cashOnCash: 6.1 },
  { name: "Base Case", capRate: 6.1, irr: 12.8, equity: "$18.2M", hold: "5yr", cashOnCash: 8.4 },
  { name: "Aggressive", capRate: 7.4, irr: 18.3, equity: "$27.6M", hold: "3yr", cashOnCash: 11.2 },
];

const offMarketDeals = [
  { address: "2450 Mission St, SF", type: "Mixed-Use", score: 94, reason: "14yr hold + Q3 2026 debt maturity", avm: "$28.4M", owner: "Family Trust" },
  { address: "444 Park Ave S, NYC", type: "Office", score: 87, reason: "Distressed debt — 6mo delinquent", avm: "$71.2M", owner: "LLC (unmasked: Cerberus)" },
  { address: "833 W Jackson, CHI", type: "Industrial", score: 79, reason: "11yr hold + owner age 78+", avm: "$14.1M", owner: "Private investor" },
];

function OwnershipIntelligence() {
  return (
    <div className="bg-terra-surface border border-terra-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-terra-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-terra-primary" />
          <span className="font-display font-semibold text-sm text-terra-text">Ownership Intelligence — LLC Unmask</span>
        </div>
        <span className="text-[10px] font-mono text-terra-primary bg-terra-primary/10 px-2 py-0.5 rounded">Reonomy Model</span>
      </div>
      <div className="divide-y divide-terra-border">
        {ownershipData.map((d) => (
          <div key={d.address} className="px-5 py-4 hover:bg-terra-surface-hover transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-terra-text">{d.address}</p>
                <p className="text-xs text-terra-text-secondary mt-0.5">{d.llc} → <span className="text-terra-primary font-medium">{d.realOwner}</span></p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-mono text-terra-text-muted">Confidence</p>
                <p className={`text-lg font-bold ${d.confidence >= 90 ? "text-terra-emerald" : "text-terra-amber"}`}>{d.confidence}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-terra-text-muted flex-wrap">
              <span>Hold: <span className="text-terra-text">{d.duration}</span></span>
              <span>Debt: <span className={d.debt.includes("Q") ? "text-terra-amber" : "text-terra-emerald"}>{d.debt}</span></span>
              <span className="ml-auto flex items-center gap-1">
                Off-Market Score: <span className={`font-bold ml-1 ${d.offMarket >= 85 ? "text-terra-primary" : "text-terra-text-secondary"}`}>{d.offMarket}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OffMarketDeals() {
  return (
    <div className="bg-terra-surface border border-terra-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-terra-border flex items-center gap-2">
        <Zap className="w-4 h-4 text-terra-amber" />
        <span className="font-display font-semibold text-sm text-terra-text">Off-Market Deal Discovery</span>
      </div>
      <div className="divide-y divide-terra-border">
        {offMarketDeals.map((d) => (
          <div key={d.address} className="px-5 py-4 hover:bg-terra-surface-hover transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-terra-text truncate">{d.address}</p>
                <p className="text-xs text-terra-text-secondary">{d.type} · {d.owner}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-[10px] text-terra-text-muted">AVM</p>
                <p className="text-sm font-bold text-terra-text">{d.avm}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-terra-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${d.score >= 90 ? "bg-terra-primary" : d.score >= 80 ? "bg-terra-emerald" : "bg-terra-amber"}`} style={{ width: `${d.score}%` }} />
              </div>
              <span className={`text-[11px] font-bold ${d.score >= 90 ? "text-terra-primary" : d.score >= 80 ? "text-terra-emerald" : "text-terra-amber"}`}>{d.score} score</span>
            </div>
            <p className="text-[10px] text-terra-text-muted mt-1">{d.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClimateRiskOverlay() {
  return (
    <div className="bg-terra-surface border border-terra-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-terra-border flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-terra-rose" />
        <span className="font-display font-semibold text-sm text-terra-text">Climate Risk Overlay</span>
      </div>
      <div className="divide-y divide-terra-border">
        {climateRisk.map((p) => (
          <div key={p.address} className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-terra-text">{p.address}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${p.overall === "High" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>{p.overall} Risk</span>
                <span className="text-[10px] text-terra-text-muted font-mono">FEMA {p.fema}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Flood", value: p.flood, color: "bg-blue-400" },
                { label: "Fire", value: p.fire, color: "bg-orange-400" },
                { label: "Heat", value: p.heat, color: "bg-red-400" },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1 text-[10px]">
                    <span className="text-terra-text-muted">{r.label}</span>
                    <span className={`font-bold ${r.value >= 60 ? "text-red-400" : r.value >= 40 ? "text-amber-400" : "text-emerald-400"}`}>{r.value}</span>
                  </div>
                  <div className="h-1.5 bg-terra-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvestmentScenarioBuilder() {
  const [selected, setSelected] = useState(1);
  const s = investmentScenarios[selected];
  return (
    <div className="bg-terra-surface border border-terra-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-terra-border flex items-center gap-2">
        <Calculator className="w-4 h-4 text-terra-emerald" />
        <span className="font-display font-semibold text-sm text-terra-text">Investment Scenario Builder</span>
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-5">
          {investmentScenarios.map((sc, i) => (
            <button
              key={sc.name}
              onClick={() => setSelected(i)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${selected === i ? "bg-terra-primary text-white" : "bg-terra-border text-terra-text-secondary hover:bg-terra-border-hover"}`}
            >
              {sc.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Exit Equity", value: s.equity, color: "text-terra-emerald" },
            { label: "Projected IRR", value: `${s.irr}%`, color: "text-terra-primary" },
            { label: "Cap Rate", value: `${s.capRate}%`, color: "text-terra-text" },
            { label: "Cash-on-Cash", value: `${s.cashOnCash}%`, color: "text-terra-text" },
            { label: "Hold Period", value: s.hold, color: "text-terra-text" },
          ].map(m => (
            <div key={m.label} className="bg-terra-surface-hover rounded-lg p-3 border border-terra-border">
              <p className="text-[10px] text-terra-text-muted">{m.label}</p>
              <p className={`text-xl font-display font-bold mt-0.5 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-terra-text-muted mt-3 text-center">Based on comparable transactions · Q1 2026</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-auto">
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-terra-primary/15 rounded-full blur-[120px] animate-[pulse-glow_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-terra-accent/10 rounded-full blur-[120px] animate-[pulse-glow_4s_ease-in-out_infinite_2s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-terra-violet/5 rounded-full blur-[150px] animate-[float_6s_ease-in-out_infinite]" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div custom={0} initial="hidden" animate="visible" variants={heroReveal} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-terra-primary/30 bg-terra-primary/10 text-terra-primary text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-terra-primary animate-pulse" />
              SZL Holdings Platform
            </span>
          </motion.div>

          <motion.h1 custom={1} initial="hidden" animate="visible" variants={heroReveal} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] mb-6">
            <span className="text-terra-text">Real Estate</span>
            <br />
            <span className="bg-gradient-to-r from-terra-primary via-terra-accent to-terra-emerald bg-clip-text text-transparent">Intelligence</span>
            <br />
            <span className="text-terra-text">Platform</span>
          </motion.h1>

          <motion.p custom={2} initial="hidden" animate="visible" variants={heroReveal} className="text-base sm:text-lg md:text-xl text-terra-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Command-center visibility into your portfolio — ownership intelligence, off-market deals, climate risk, and investment scenario modeling in one unified platform.
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={heroReveal} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <span className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-terra-primary to-terra-accent text-white font-semibold text-base shadow-xl shadow-terra-primary/30 hover:shadow-2xl hover:shadow-terra-primary/40 hover:scale-105 active:scale-[0.98] transition-all duration-300 cursor-pointer">
                Open Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/market">
              <span className="group inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-terra-primary/40 hover:border-terra-primary text-terra-text font-semibold text-base hover:bg-terra-primary/10 hover:scale-105 active:scale-[0.98] transition-all duration-300 cursor-pointer">
                Market Intel <TrendingUp className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </motion.div>

          <motion.div custom={4} initial="hidden" animate="visible" variants={heroReveal} className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { label: "Portfolio Value", value: "$454M+" },
              { label: "Avg Occupancy", value: "92.8%" },
              { label: "Properties", value: "8" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-display font-extrabold bg-gradient-to-r from-terra-primary to-terra-accent bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs text-terra-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Competitive Intelligence Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <span className="text-terra-primary font-semibold text-xs tracking-widest uppercase mb-3 block">Intelligence Suite</span>
            <h2 className="text-3xl font-display font-bold text-terra-text">
              Beyond the <span className="bg-gradient-to-r from-terra-primary to-terra-accent bg-clip-text text-transparent">Public Market</span>
            </h2>
            <p className="text-terra-text-secondary text-sm mt-3 max-w-xl mx-auto">Reonomy-style ownership unmask, off-market discovery, climate risk scoring, and IRR modeling — all in one platform.</p>
          </motion.div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <OwnershipIntelligence />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <OffMarketDeals />
              </motion.div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <ClimateRiskOverlay />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <InvestmentScenarioBuilder />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-terra-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-14">
            <span className="text-terra-primary font-semibold text-xs tracking-widest uppercase mb-3 block">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-terra-text mb-4">
              Everything you need to <span className="bg-gradient-to-r from-terra-primary to-terra-accent bg-clip-text text-transparent">manage & grow</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm hover:border-terra-border-hover hover:shadow-lg hover:shadow-terra-primary/5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-terra-text mb-2 group-hover:text-terra-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-terra-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-500/5 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-wide uppercase mb-5">
              <Flame className="w-3.5 h-3.5" /> Distress Intelligence Engine · NYC + NY State
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-terra-text mb-5">
              Find Deals Before the <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Market Does</span>
            </h2>
            <p className="text-terra-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Real-time NYC foreclosure tracking, distress alerts, and AI-powered investor opportunity scoring — across all 5 boroughs and NY State counties.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Flame, label: "Pre-Foreclosure Tracking", description: "Monitor lis pendens filings from Kings, Queens, NY, Bronx, and Richmond county court systems in real time.", color: "from-amber-500 to-orange-500" },
              { icon: Gavel, label: "Auction Intelligence", description: "NYC auction calendar with 30-day advance notice, property details, debt-to-value analysis, and action windows.", color: "from-purple-500 to-violet-500" },
              { icon: Bell, label: "Distress Alert System", description: "Configurable alerts for new liens, approaching auctions, price drops, and expired listings in any zip code.", color: "from-red-500 to-rose-500" },
              { icon: FileText, label: "Tax Lien Discovery", description: "NYC Dept of Finance tax lien database cross-referenced with property ownership and estimated equity.", color: "from-orange-500 to-amber-500" },
              { icon: Star, label: "Opportunity Scoring", description: "0-100 opportunity score for every distressed property based on distress type, equity, location demand, and time in distress.", color: "from-terra-emerald to-green-400" },
              { icon: Zap, label: "Deal Conversion", description: "One-click convert distressed properties to CRM leads, active deals, or outreach workflows via Alloy.", color: "from-terra-primary to-terra-accent" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group p-5 rounded-xl border border-terra-border bg-terra-surface/50 hover:border-terra-border-hover hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.color} mb-3 shadow-lg`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-terra-text text-sm mb-1.5 group-hover:text-orange-400 transition-colors">{item.label}</h3>
                <p className="text-xs text-terra-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-terra-surface border border-terra-border rounded-2xl p-6 mb-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
              {[
                { label: "Active Distress Properties", value: "50+", sub: "NYC & NY State" },
                { label: "Auction Imminent (30 days)", value: "8", sub: "Across all 5 boroughs" },
                { label: "Avg Opportunity Score", value: "74", sub: "Out of 100" },
                { label: "Total Distress Value", value: "$240M+", sub: "Combined estimated value" },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-display font-extrabold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-xs font-semibold text-terra-text mt-1">{stat.label}</p>
                  <p className="text-[10px] text-terra-text-muted mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4">
              <Link href="/distress-engine">
                <span className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-base shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 hover:scale-105 active:scale-[0.98] transition-all duration-300 cursor-pointer">
                  <Flame className="w-5 h-5" />
                  Explore Opportunities <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-terra-surface/50 border border-terra-border/50 rounded-xl p-4">
            <p className="text-[10px] text-terra-text-muted text-center uppercase tracking-wider font-semibold mb-3">Command Loop — Updated</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {["DETECT", "INTERPRET", "DECIDE", "EXECUTE", "VERIFY", "DISCOVER"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${step === "DISCOVER" ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-orange-400/30 text-orange-400" : "bg-terra-primary/10 border-terra-primary/20 text-terra-primary"}`}>
                    {step}
                  </span>
                  {i < 5 && <ArrowRight className="w-3 h-3 text-terra-text-muted flex-shrink-0" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-terra-text-muted text-center mt-3">DISCOVER = new deals, distressed assets, opportunities · Powered by Distress Intelligence Engine</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-terra-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-terra-primary font-semibold text-xs tracking-widest uppercase mb-3 block">Business Model</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-terra-text mb-4">
              Choose Your <span className="bg-gradient-to-r from-terra-primary to-terra-accent bg-clip-text text-transparent">Operating Mode</span>
            </h2>
            <p className="text-terra-text-secondary text-sm max-w-xl mx-auto">From basic CRM to elite distress intelligence — every tier is purpose-built for how you work deals.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                tier: "Free",
                price: "$0",
                sub: "Forever",
                gradient: "from-slate-500 to-slate-600",
                color: "border-slate-500/20",
                badge: null,
                features: [
                  "Basic CRM (up to 50 contacts)",
                  "Limited listings view",
                  "Portfolio overview (3 properties)",
                  "Public market data",
                  "Basic alerts",
                ],
                cta: "Get Started",
              },
              {
                tier: "Pro",
                subtitle: "Agents",
                price: "$149",
                sub: "/mo",
                gradient: "from-terra-primary to-terra-accent",
                color: "border-terra-primary/30",
                badge: null,
                features: [
                  "Full deal pipeline",
                  "Transaction management",
                  "Workflow automations",
                  "Unlimited CRM contacts",
                  "Market intelligence",
                  "Analytics dashboard",
                ],
                cta: "Start Free Trial",
              },
              {
                tier: "Broker",
                price: "$399",
                sub: "/mo",
                gradient: "from-terra-violet to-purple-500",
                color: "border-terra-violet/30",
                badge: "Popular",
                features: [
                  "Everything in Pro",
                  "Team analytics & routing",
                  "Agent oversight & reporting",
                  "Multi-user workspace",
                  "Portfolio performance tools",
                  "Climate risk overlay",
                  "Investor relations module",
                ],
                cta: "Start Free Trial",
              },
              {
                tier: "Investor",
                subtitle: "Elite",
                price: "$799",
                sub: "/mo",
                gradient: "from-red-500 to-orange-500",
                color: "border-red-500/30",
                badge: "Distress Engine",
                features: [
                  "Everything in Broker",
                  "Distress Intelligence Engine",
                  "NYC foreclosure tracking",
                  "Opportunity alerts (real-time)",
                  "AI opportunity scoring",
                  "Early signals & indicators",
                  "Advanced analytics suite",
                  "Cross-ecosystem integrations",
                ],
                cta: "Start Free Trial",
              },
            ].map((plan, i) => (
              <motion.div key={plan.tier} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border ${plan.color} bg-terra-bg-secondary flex flex-col overflow-hidden ${plan.badge === "Distress Engine" ? "ring-1 ring-red-500/30" : ""}`}>
                {plan.badge && (
                  <div className={`text-center py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${plan.gradient}`}>
                    {plan.badge}
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                      {plan.tier === "Free" && <Building2 className="w-5 h-5 text-white" />}
                      {plan.tier === "Pro" && <TrendingUp className="w-5 h-5 text-white" />}
                      {plan.tier === "Broker" && <Users className="w-5 h-5 text-white" />}
                      {plan.tier === "Investor" && <Flame className="w-5 h-5 text-white" />}
                    </div>
                    <h3 className="font-display font-bold text-terra-text text-lg">{plan.tier}</h3>
                    {plan.subtitle && <p className="text-xs text-terra-text-muted">{plan.subtitle}</p>}
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-display font-extrabold text-terra-text">{plan.price}</span>
                      <span className="text-xs text-terra-text-muted">{plan.sub}</span>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 mb-5">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.tier === "Investor" ? "text-orange-400" : "text-terra-primary"}`} />
                        <span className="text-xs text-terra-text-secondary">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 transition-opacity`}>
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-terra-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-terra-text-muted">
            <Building2 className="w-4 h-4" />
            <span>Terra — SZL Holdings Platform</span>
          </div>
          <p className="text-xs text-terra-text-muted">&copy; 2026 SZL Holdings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
