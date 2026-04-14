import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Trophy, Target, Play, ArrowUpDown, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Clock, DollarSign, CheckCircle, Zap,
  BarChart2, Award, Swords, Upload
} from "lucide-react";

interface BenchmarkResult {
  agentId: string;
  agentName: string;
  domain: string;
  rank: number;
  overallScore: number;
  accuracy: number;
  latencyP95: number;
  costEfficiency: number;
  stability: number;
  throughput: number;
  trend: "up" | "down" | "stable";
  trendDelta: number;
  lastRun: string;
  status: "production" | "staging" | "candidate";
}

interface BenchmarkSuite {
  id: string;
  name: string;
  domain: string;
  description: string;
  testCases: number;
  frequency: string;
  lastRun: string;
}

const SUITES: BenchmarkSuite[] = [
  { id: "maritime-threat", name: "Maritime Threat Detection", domain: "Maritime", description: "AIS dark period detection accuracy, sanctions screening recall, and vessel risk scoring benchmark against validated ground truth.", testCases: 1200, frequency: "Every Monday 08:00", lastRun: "2026-04-07 08:14" },
  { id: "legal-contract", name: "Legal Contract Analysis", domain: "Legal", description: "Deadline extraction precision, obligation classification accuracy, risk flag identification on 500+ annotated contract dataset.", testCases: 847, frequency: "Every Tuesday 09:00", lastRun: "2026-04-08 09:22" },
  { id: "anomaly-detection", name: "KPI Anomaly Detection", domain: "Analytics", description: "False positive rate, true detection rate, and root-cause attribution accuracy on synthetic + real KPI streams.", testCases: 2400, frequency: "Bi-weekly", lastRun: "2026-04-06 10:05" },
  { id: "threat-intel", name: "Security Threat Intelligence", domain: "Security", description: "CVE triage accuracy, threat actor TTP matching, and incident response quality evaluation against SOC analyst benchmarks.", testCases: 650, frequency: "Every Wednesday 07:30", lastRun: "2026-04-09 07:45" },
  { id: "property-valuation", name: "Property Valuation Accuracy", domain: "Real Estate", description: "Comparable sales accuracy vs appraisal reports, distressed property identification recall, and due diligence coverage.", testCases: 320, frequency: "Monthly", lastRun: "2026-04-01 09:00" },
];

const LEADERBOARD: BenchmarkResult[] = [
  { agentId: "sentinel", agentName: "Sentinel v4", domain: "Security", rank: 1, overallScore: 97.2, accuracy: 99.1, latencyP95: 1840, costEfficiency: 94.2, stability: 99.5, throughput: 88, trend: "up", trendDelta: 1.0, lastRun: "2026-04-09 07:45", status: "production" },
  { agentId: "beacon", agentName: "Beacon v3", domain: "Analytics", rank: 2, overallScore: 95.8, accuracy: 98.4, latencyP95: 1120, costEfficiency: 97.8, stability: 97.2, throughput: 94, trend: "up", trendDelta: 2.3, lastRun: "2026-04-06 10:05", status: "production" },
  { agentId: "helmsman", agentName: "Helmsman v3", domain: "Maritime", rank: 3, overallScore: 93.4, accuracy: 97.3, latencyP95: 2640, costEfficiency: 89.1, stability: 95.8, throughput: 76, trend: "stable", trendDelta: 0.1, lastRun: "2026-04-07 08:14", status: "production" },
  { agentId: "docminer", agentName: "DocMiner v2", domain: "Legal", rank: 4, overallScore: 91.2, accuracy: 94.8, latencyP95: 4200, costEfficiency: 96.4, stability: 93.1, throughput: 65, trend: "up", trendDelta: 0.8, lastRun: "2026-04-08 09:22", status: "staging" },
  { agentId: "zeus", agentName: "Zeus v3", domain: "Infra", rank: 5, overallScore: 89.7, accuracy: 96.8, latencyP95: 1920, costEfficiency: 91.3, stability: 88.2, throughput: 82, trend: "down", trendDelta: -3.1, lastRun: "2026-04-13 08:00", status: "staging" },
  { agentId: "prospector", agentName: "Prospector v2", domain: "Real Estate", rank: 6, overallScore: 88.1, accuracy: 96.2, latencyP95: 3100, costEfficiency: 88.7, stability: 90.4, throughput: 58, trend: "up", trendDelta: 1.4, lastRun: "2026-04-01 09:00", status: "candidate" },
  { agentId: "oracle", agentName: "Oracle v1", domain: "Analytics", rank: 7, overallScore: 84.3, accuracy: 89.7, latencyP95: 7800, costEfficiency: 72.4, stability: 87.6, throughput: 42, trend: "down", trendDelta: -1.8, lastRun: "2026-04-06 10:05", status: "candidate" },
  { agentId: "muse", agentName: "Muse v2", domain: "Commerce", rank: 8, overallScore: 78.9, accuracy: 91.4, latencyP95: 5600, costEfficiency: 81.2, stability: 79.3, throughput: 51, trend: "down", trendDelta: -8.9, lastRun: "2026-04-13 08:00", status: "candidate" },
];

const STATUS_BADGE: Record<string, string> = {
  production: "badge-running",
  staging: "badge-staged",
  candidate: "badge-idle",
};

function trendIcon(trend: string) {
  if (trend === "up") return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <span className="w-3 h-3 inline-block text-muted-foreground">—</span>;
}

function scoreBar(value: number, color = "#7c3aed") {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono text-foreground w-8 text-right">{value.toFixed(0)}</span>
    </div>
  );
}

export function PerformanceArena() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "suites" | "comparison">("leaderboard");
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string>("sentinel");
  const [compareB, setCompareB] = useState<string>("helmsman");
  const [sortBy, setSortBy] = useState<keyof BenchmarkResult>("overallScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  const sorted = [...LEADERBOARD].sort((a, b) => {
    const av = a[sortBy] as number;
    const bv = b[sortBy] as number;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  function toggleSort(col: keyof BenchmarkResult) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function runBenchmark(agentId: string) {
    setRunningIds(prev => new Set([...prev, agentId]));
    setTimeout(() => setRunningIds(prev => { const s = new Set(prev); s.delete(agentId); return s; }), 3000);
  }

  function promote(agentId: string) {
    setPromotedIds(prev => new Set([...prev, agentId]));
    setTimeout(() => setPromotedIds(prev => { const s = new Set(prev); s.delete(agentId); return s; }), 3000);
  }

  const agentA = LEADERBOARD.find(a => a.agentId === compareA);
  const agentB = LEADERBOARD.find(a => a.agentId === compareB);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Agent Performance Arena</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Continuous evaluation with domain-specific benchmarks, leaderboards, and promotion workflows.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-amber-400">{LEADERBOARD[0]?.agentName}</div>
          <div className="text-xs text-muted-foreground">Top Performer</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{SUITES.length}</div>
          <div className="text-xs text-muted-foreground">Benchmark Suites</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{LEADERBOARD.filter(a => a.status === "production").length}</div>
          <div className="text-xs text-muted-foreground">In Production</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">{LEADERBOARD.filter(a => a.trend === "up").length}</div>
          <div className="text-xs text-muted-foreground">Improving This Week</div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        {([
          { id: "leaderboard", label: "Leaderboard", icon: Trophy },
          { id: "suites", label: "Benchmark Suites", icon: Target },
          { id: "comparison", label: "Side-by-Side", icon: Swords },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "leaderboard" && (
        <div className="inca-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">Agent Rankings — All Domains</div>
            <div className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { key: "rank", label: "#" },
                    { key: "agentName", label: "Agent" },
                    { key: "overallScore", label: "Score" },
                    { key: "accuracy", label: "Accuracy" },
                    { key: "latencyP95", label: "P95 Latency" },
                    { key: "costEfficiency", label: "Cost Eff." },
                    { key: "stability", label: "Stability" },
                    { key: "status", label: "Status" },
                  ].map(col => (
                    <th key={col.key} className="py-2.5 px-3 text-left text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort(col.key as keyof BenchmarkResult)}>
                      <div className="flex items-center gap-1">{col.label} <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-left text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((agent) => (
                  <tr key={agent.agentId} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {agent.rank === 1 && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                        {agent.rank === 2 && <Award className="w-3.5 h-3.5 text-slate-400" />}
                        {agent.rank === 3 && <Award className="w-3.5 h-3.5 text-amber-700" />}
                        <span className="text-xs font-mono text-foreground">{agent.rank}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-foreground">{agent.agentName}</div>
                      <div className="text-xs text-muted-foreground">{agent.domain}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary">{agent.overallScore.toFixed(1)}</span>
                        <div className="flex items-center gap-0.5">
                          {trendIcon(agent.trend)}
                          <span className={cn("text-xs font-mono", agent.trend === "up" ? "text-emerald-400" : agent.trend === "down" ? "text-red-400" : "text-muted-foreground")}>
                            {agent.trendDelta > 0 ? "+" : ""}{agent.trendDelta.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">{agent.accuracy}%</td>
                    <td className="py-3 px-3 font-mono text-xs">{agent.latencyP95}ms</td>
                    <td className="py-3 px-3 font-mono text-xs">{agent.costEfficiency.toFixed(1)}</td>
                    <td className="py-3 px-3 font-mono text-xs">{agent.stability.toFixed(1)}%</td>
                    <td className="py-3 px-3">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", STATUS_BADGE[agent.status])}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => runBenchmark(agent.agentId)}
                          className="p-1 rounded bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-primary transition-colors"
                          title="Run benchmark"
                        >
                          {runningIds.has(agent.agentId) ? <Zap className="w-3 h-3 text-primary animate-pulse" /> : <Play className="w-3 h-3" />}
                        </button>
                        {agent.status !== "production" && (
                          <button
                            onClick={() => promote(agent.agentId)}
                            className={cn("p-1 rounded text-xs flex items-center gap-1 transition-colors", promotedIds.has(agent.agentId) ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground hover:text-primary")}
                            title="Promote to production"
                          >
                            {promotedIds.has(agent.agentId) ? <CheckCircle className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "suites" && (
        <div className="space-y-3">
          {SUITES.map(suite => {
            const isExpanded = selectedSuite === suite.id;
            return (
              <div key={suite.id} className="inca-panel overflow-hidden">
                <button
                  onClick={() => setSelectedSuite(isExpanded ? null : suite.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">{suite.name}</div>
                      <div className="text-xs text-muted-foreground">{suite.domain} · {suite.testCases.toLocaleString()} test cases · {suite.frequency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Last: {suite.lastRun}</span>
                    <button
                      onClick={e => { e.stopPropagation(); runBenchmark(suite.id); }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/25 text-primary rounded text-xs hover:bg-primary/15 transition-colors"
                    >
                      <Play className="w-3 h-3" /> Run Now
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/40 animate-fade-in">
                    <p className="text-sm text-muted-foreground mt-3 mb-4 leading-relaxed">{suite.description}</p>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Agent Scores — {suite.name}</div>
                    <div className="space-y-3">
                      {LEADERBOARD.filter(a => a.domain === suite.domain || suite.domain === "All").slice(0, 4).map(agent => (
                        <div key={agent.agentId} className="flex items-center gap-3">
                          <div className="w-24 text-xs font-medium text-foreground">{agent.agentName}</div>
                          <div className="flex-1">{scoreBar(agent.overallScore)}</div>
                          <div className="w-16 text-xs text-muted-foreground font-mono">+{agent.trendDelta > 0 ? "+" : ""}{agent.trendDelta}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "comparison" && (
        <div className="space-y-4">
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Select Agents to Compare</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Agent A</label>
                <select value={compareA} onChange={e => setCompareA(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  {LEADERBOARD.map(a => <option key={a.agentId} value={a.agentId}>{a.agentName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Agent B</label>
                <select value={compareB} onChange={e => setCompareB(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  {LEADERBOARD.filter(a => a.agentId !== compareA).map(a => <option key={a.agentId} value={a.agentId}>{a.agentName}</option>)}
                </select>
              </div>
            </div>
          </div>

          {agentA && agentB && (
            <div className="inca-panel overflow-hidden">
              <div className="grid grid-cols-3 border-b border-border">
                <div className="p-4 text-center border-r border-border">
                  <div className="text-sm font-semibold text-primary">{agentA.agentName}</div>
                  <div className="text-xs text-muted-foreground">{agentA.domain} · Rank #{agentA.rank}</div>
                </div>
                <div className="p-4 text-center border-r border-border">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Metric</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-sm font-semibold text-foreground">{agentB.agentName}</div>
                  <div className="text-xs text-muted-foreground">{agentB.domain} · Rank #{agentB.rank}</div>
                </div>
              </div>

              {[
                { label: "Overall Score", aVal: agentA.overallScore, bVal: agentB.overallScore, unit: "", higherBetter: true },
                { label: "Accuracy", aVal: agentA.accuracy, bVal: agentB.accuracy, unit: "%", higherBetter: true },
                { label: "P95 Latency", aVal: agentA.latencyP95, bVal: agentB.latencyP95, unit: "ms", higherBetter: false },
                { label: "Cost Efficiency", aVal: agentA.costEfficiency, bVal: agentB.costEfficiency, unit: "", higherBetter: true },
                { label: "Stability", aVal: agentA.stability, bVal: agentB.stability, unit: "%", higherBetter: true },
                { label: "Throughput", aVal: agentA.throughput, bVal: agentB.throughput, unit: "", higherBetter: true },
              ].map(({ label, aVal, bVal, unit, higherBetter }) => {
                const aWins = higherBetter ? aVal > bVal : aVal < bVal;
                const bWins = higherBetter ? bVal > aVal : bVal < aVal;
                return (
                  <div key={label} className="grid grid-cols-3 border-b border-border/30 hover:bg-secondary/10">
                    <div className={cn("py-3 px-4 text-sm font-mono font-bold text-right", aWins ? "text-emerald-400" : "text-foreground")}>
                      {aVal.toFixed(aVal % 1 ? 1 : 0)}{unit}
                    </div>
                    <div className="py-3 px-4 text-xs text-muted-foreground text-center flex items-center justify-center">{label}</div>
                    <div className={cn("py-3 px-4 text-sm font-mono font-bold", bWins ? "text-emerald-400" : "text-foreground")}>
                      {bVal.toFixed(bVal % 1 ? 1 : 0)}{unit}
                    </div>
                  </div>
                );
              })}

              <div className="p-4 flex justify-center gap-3">
                <button onClick={() => promote(agentA.agentId)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 text-primary rounded-lg text-sm hover:bg-primary/15 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Promote {agentA.agentName}
                </button>
                <button onClick={() => promote(agentB.agentId)} className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Promote {agentB.agentName}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
