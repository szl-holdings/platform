import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Shield, Ship, Activity, Zap, TrendingUp, Radio, Brain, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskPill } from "@workspace/shared-ui/ai-components";

const API_BASE = "/api";
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let c = false;
    const s = performance.now();
    const step = (n: number) => { if (c) return; const p = Math.min((n - s) / 1500, 1); setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    return () => { c = true; };
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

const PROJECT_RISK_SCORES = [
  { name: "Vessels", score: 22, tooltip: "Low risk - stable maritime ops, monitored AIS feeds" },
  { name: "Firestorm", score: 68, tooltip: "Elevated - 3 critical CVEs detected, patch cycle pending" },
  { name: "Lyte", score: 35, tooltip: "Moderate - normal signal processing, SLA at 98.4%" },
  { name: "Dreamscape", score: 15, tooltip: "Minimal - creative pipeline healthy, no anomalies" },
  { name: "Readiness", score: 42, tooltip: "Moderate - 2 benchmark dimensions below industry avg" },
  { name: "Admin", score: 28, tooltip: "Low - all integrations healthy, no audit flags" },
  { name: "Stephen Site", score: 12, tooltip: "Minimal - portfolio site stable, uptime 99.99%" },
  { name: "SZL Holdings", score: 18, tooltip: "Low - corporate portal nominal, no incidents" },
];

export function IntelligenceBar() {
  const [stats, setStats] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [ecosystemHealth, setEcosystemHealth] = useState<any[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    apiFetch<any>("/intelligence/platform-stats").then(setStats).catch(() => {});
    apiFetch<any[]>("/intelligence/news").then(setNews).catch(() => {});
    apiFetch<any[]>("/intelligence/ecosystem-health").then(setEcosystemHealth).catch(() => {});
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex(i => (i + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news]);

  const operationalCount = ecosystemHealth.filter(a => a.status === "operational").length;
  const sentimentColor = (s: string) => s === "negative" ? "text-red-400" : s === "positive" ? "text-emerald-400" : "text-slate-400";

  if (!stats) return null;

  return (
    <div className="relative">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-violet-500/10 to-cyan-500/10 text-violet-300 px-4 py-2 rounded-full border border-violet-500/20">
            <Radio className="w-4 h-4 animate-pulse" /> Live Platform Intelligence
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Real-Time Platform Pulse
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800/50 text-center group hover:border-violet-500/30 transition-all">
            <Shield className="w-7 h-7 text-red-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white"><AnimatedCounter value={stats.threatsAnalyzed} /></div>
            <p className="text-xs text-zinc-500 mt-1">Threats Analyzed</p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800/50 text-center group hover:border-violet-500/30 transition-all">
            <Ship className="w-7 h-7 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white"><AnimatedCounter value={stats.vesselsTracked} /></div>
            <p className="text-xs text-zinc-500 mt-1">Vessels Tracked</p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800/50 text-center group hover:border-violet-500/30 transition-all">
            <Activity className="w-7 h-7 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white"><AnimatedCounter value={stats.signalsProcessed} /></div>
            <p className="text-xs text-zinc-500 mt-1">Signals Processed</p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800/50 text-center group hover:border-violet-500/30 transition-all">
            <Zap className="w-7 h-7 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white"><AnimatedCounter value={stats.apiCallsToday} /></div>
            <p className="text-xs text-zinc-500 mt-1">API Calls Today</p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800/50 text-center group hover:border-violet-500/30 transition-all">
            <Globe className="w-7 h-7 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white">{operationalCount}/{ecosystemHealth.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Apps Healthy</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800/50 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">AI Project Health Scores</h3>
            <span className="text-[10px] text-zinc-500 ml-auto">Powered by HuggingFace AI</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {PROJECT_RISK_SCORES.map((project) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: PROJECT_RISK_SCORES.indexOf(project) * 0.05 }}
              >
                <RiskPill
                  score={project.score}
                  label={project.name}
                  tooltip={project.tooltip}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {news.length > 0 && (
          <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 shrink-0">
                <Brain className="w-3 h-3" /> AI News
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={currentNewsIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", sentimentColor(news[currentNewsIndex]?.sentiment))}>{news[currentNewsIndex]?.sentiment}</span>
                  <span className="text-sm text-zinc-300 truncate">{news[currentNewsIndex]?.title}</span>
                  <span className="text-xs text-zinc-600 shrink-0">{news[currentNewsIndex]?.source}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
