import { motion } from "framer-motion";
import { Building2, TrendingUp, Shield, BarChart3, ArrowRight, Zap, Globe, Lock } from "lucide-react";
import { Link } from "wouter";

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

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-auto">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
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
            Command-center visibility into your portfolio — property performance, market trends, occupancy analytics, revenue tracking, and deal pipeline in one unified platform.
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

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <span className="text-terra-primary font-semibold text-xs tracking-widest uppercase mb-3 block">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-terra-text mb-4">
              Everything you need to <span className="bg-gradient-to-r from-terra-primary to-terra-accent bg-clip-text text-transparent">manage & grow</span>
            </h2>
            <p className="text-terra-text-secondary max-w-xl mx-auto">
              Terra provides comprehensive tools for real estate professionals and investors to monitor, analyze, and optimize their portfolio.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
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
