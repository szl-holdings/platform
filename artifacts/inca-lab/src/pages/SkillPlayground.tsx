import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FlaskConical, Play, RefreshCw, ChevronDown, ChevronUp, Check, AlertCircle, Clock, BarChart3, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface Skill {
  skill_id: string;
  label: string;
  description: string;
  category: string;
  domains: string[];
  status: string;
  required_autonomy_level: string;
  invocations: number;
  successful_invocations: number;
  avg_latency_ms: number;
  tags: string[];
}

interface TestResult {
  skillId: string;
  status: "success" | "error" | "approval_required";
  output?: unknown;
  error?: string;
  latencyMs?: number;
  requiresApproval?: boolean;
  approvalToken?: string;
  executedAt: string;
}

function SkillCard({
  skill,
  selected,
  onSelect,
}: {
  skill: Skill;
  selected: boolean;
  onSelect: () => void;
}) {
  const statusColor = skill.status === "active" ? "#22c55e" : skill.status === "degraded" ? "#f59e0b" : "#64748b";
  const autonomyColors: Record<string, string> = {
    observer: "#64748b",
    advisor: "#f59e0b",
    operator: "#ef4444",
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all duration-150",
        selected
          ? "border-violet-500/60 bg-violet-500/10"
          : "border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white/80 truncate">{skill.label}</span>
            <span style={{ color: statusColor }} className="text-[9px] font-semibold uppercase tracking-wider shrink-0">
              ● {skill.status}
            </span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{skill.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/35 font-medium">{skill.category}</span>
            {skill.domains.slice(0, 2).map(d => (
              <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400/70 font-medium">{d}</span>
            ))}
            <span
              style={{ color: autonomyColors[skill.required_autonomy_level] ?? "#64748b", borderColor: `${autonomyColors[skill.required_autonomy_level] ?? "#64748b"}30` }}
              className="text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider"
            >
              {skill.required_autonomy_level}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-white/30">{skill.invocations} runs</div>
          {skill.avg_latency_ms > 0 && (
            <div className="text-[10px] text-white/20">{Math.round(skill.avg_latency_ms)}ms avg</div>
          )}
        </div>
      </div>
    </button>
  );
}

function ResultPanel({ result, accentColor }: { result: TestResult; accentColor: string }) {
  const [expanded, setExpanded] = useState(true);

  const statusIcon =
    result.status === "success" ? <Check size={14} className="text-green-400" /> :
    result.status === "approval_required" ? <Clock size={14} className="text-amber-400" /> :
    <AlertCircle size={14} className="text-red-400" />;

  const statusColor =
    result.status === "success" ? "border-green-500/25 bg-green-500/5" :
    result.status === "approval_required" ? "border-amber-500/25 bg-amber-500/5" :
    "border-red-500/25 bg-red-500/5";

  return (
    <div className={cn("rounded-lg border p-3", statusColor)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-xs font-semibold text-white/70">
            {result.status === "success" ? "Execution Successful" :
             result.status === "approval_required" ? "Awaiting Approval" :
             "Execution Failed"}
          </span>
          {result.latencyMs !== undefined && (
            <span className="text-[10px] text-white/30">{result.latencyMs}ms</span>
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2">
          {result.error && (
            <div className="text-xs text-red-400/80 bg-red-500/5 rounded p-2 font-mono">
              {result.error}
            </div>
          )}
          {result.status === "approval_required" && (
            <div className="text-xs text-amber-400/80 bg-amber-500/5 rounded p-2">
              This skill requires human approval before execution. Approval token: <code className="font-mono">{result.approvalToken}</code>
            </div>
          )}
          {result.output !== undefined && (
            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Output</div>
              <pre className="text-[11px] text-white/60 bg-black/20 rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono max-h-60">
                {typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}
          <div className="text-[10px] text-white/20">
            Executed {new Date(result.executedAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

function GovernancePanel({ skills }: { skills: Skill[] }) {
  const statsQuery = useQuery({
    queryKey: ["skills-stats"],
    queryFn: () => api.getSkillsStats(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const stats = statsQuery.data?.data;

  const autonomyDist = skills.reduce((acc, s) => {
    acc[s.required_autonomy_level] = (acc[s.required_autonomy_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const autonomyColors: Record<string, string> = {
    observer: "#64748b",
    advisor: "#f59e0b",
    operator: "#ef4444",
  };

  const maxCategory = stats ? Math.max(...Object.values(stats.byCategory)) : 0;
  const maxUsage = stats?.topByUsage[0]?.invocations ?? 0;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      {statsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading governance data…
        </div>
      ) : statsQuery.isError ? (
        <div className="text-red-400 text-sm">Failed to load governance stats.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Skills", value: stats?.total ?? 0, sub: "registered" },
              { label: "Active Skills", value: stats?.active ?? 0, sub: `${stats && stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total` },
              { label: "Skill Catalog", value: Object.keys(stats?.byCategory ?? {}).length, sub: "categories" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-white/8 bg-white/2 p-4">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{kpi.label}</div>
                <div className="text-2xl font-bold text-white/90 font-mono">{kpi.value}</div>
                <div className="text-[11px] text-white/30 mt-1">{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/8 bg-white/2 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-violet-400" />
                <span className="text-xs font-semibold text-white/70">Autonomy Distribution</span>
              </div>
              {Object.keys(autonomyDist).length === 0 ? (
                <div className="text-xs text-white/25">No data</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(autonomyDist).map(([level, count]) => (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] capitalize font-medium" style={{ color: autonomyColors[level] || "#888" }}>{level}</span>
                        <span className="text-[11px] text-white/40 font-mono">{count} skill{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${skills.length > 0 ? (count / skills.length) * 100 : 0}%`,
                            backgroundColor: autonomyColors[level] || "#888",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/8 bg-white/2 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-violet-400" />
                <span className="text-xs font-semibold text-white/70">Skills by Category</span>
              </div>
              {maxCategory === 0 ? (
                <div className="text-xs text-white/25">No data</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats?.byCategory ?? {}).sort((a, b) => b[1] - a[1]).map(([cat, cnt]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40 w-24 truncate capitalize">{cat}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500/70 transition-all"
                          style={{ width: `${(cnt / maxCategory) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 font-mono w-5 text-right">{cnt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/8 bg-white/2 p-4">
            <div className="text-xs font-semibold text-white/70 mb-4">Top Skills by Usage</div>
            {(stats?.topByUsage?.length ?? 0) === 0 ? (
              <div className="text-xs text-white/25">No usage data yet.</div>
            ) : (
              <div className="space-y-3">
                {stats!.topByUsage.map((s, i) => (
                  <div key={s.skillId} className="flex items-center gap-3">
                    <span className="text-[10px] text-white/25 w-4 text-right">{i + 1}</span>
                    <span className="text-xs text-white/70 flex-1 truncate">{s.label}</span>
                    <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-400/60 transition-all"
                        style={{ width: `${maxUsage > 0 ? (s.invocations / maxUsage) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40 font-mono w-10 text-right">{s.invocations}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SkillPlayground() {
  const [activeTab, setActiveTab] = useState<"playground" | "governance">("playground");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [testInput, setTestInput] = useState("{}");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    setLoading(true);
    try {
      const data = await api.getSkills();
      setSkills(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runTest() {
    if (!selectedSkill || running) return;
    setRunning(true);
    setError(null);

    let parsedInput: Record<string, unknown> = {};
    try {
      parsedInput = JSON.parse(testInput);
    } catch {
      setError("Invalid JSON in test input");
      setRunning(false);
      return;
    }

    try {
      const res = await fetch(`/api/skills/${selectedSkill.skill_id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: parsedInput, userId: "playground-user" }),
      });
      const data = await res.json() as any;
      const result: TestResult = {
        skillId: selectedSkill.skill_id,
        status: data.status === "approval_required" ? "approval_required" : data.error ? "error" : "success",
        output: data.output ?? data.result,
        error: data.error,
        latencyMs: data.latencyMs,
        requiresApproval: data.requiresApproval,
        approvalToken: data.approvalToken,
        executedAt: new Date().toISOString(),
      };
      setResults(prev => [result, ...prev].slice(0, 10));
    } catch (err: any) {
      const result: TestResult = {
        skillId: selectedSkill.skill_id,
        status: "error",
        error: err.message,
        executedAt: new Date().toISOString(),
      };
      setResults(prev => [result, ...prev].slice(0, 10));
    } finally {
      setRunning(false);
    }
  }

  const allDomains = [...new Set(skills.flatMap(s => s.domains))].sort();

  const filteredSkills = skills.filter(s => {
    const matchesText = filter === "" ||
      s.label.toLowerCase().includes(filter.toLowerCase()) ||
      s.description.toLowerCase().includes(filter.toLowerCase()) ||
      s.category.toLowerCase().includes(filter.toLowerCase());
    const matchesDomain = domainFilter === "all" || s.domains.includes(domainFilter);
    return matchesText && matchesDomain;
  });

  const defaultInputForSkill = (skill: Skill): string => {
    return JSON.stringify({ input: `Test input for ${skill.label}`, context: { source: "playground" } }, null, 2);
  };

  return (
    <div className="flex flex-col h-full bg-[#080b14] text-white">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8 shrink-0">
        <FlaskConical size={20} className="text-violet-400" />
        <div>
          <h1 className="text-sm font-bold text-white/90">Skill Playground</h1>
          <p className="text-xs text-white/40">Test individual skills with live execution and real audit trails</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/3 p-0.5">
            <button
              onClick={() => setActiveTab("playground")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-all",
                activeTab === "playground"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <FlaskConical size={12} />
              Playground
            </button>
            <button
              onClick={() => setActiveTab("governance")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-all",
                activeTab === "governance"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <BarChart3 size={12} />
              Governance
            </button>
          </div>
          <span className="text-[11px] text-white/30">{skills.length} skills</span>
          <button
            onClick={loadSkills}
            disabled={loading}
            className="p-1.5 rounded hover:bg-white/5 text-white/40 hover:text-white/60 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {activeTab === "governance" ? (
        <GovernancePanel skills={skills} />
      ) : null}

      <div className={cn("flex flex-1 min-h-0", activeTab !== "playground" && "hidden")}>
        <div className="w-72 shrink-0 border-r border-white/8 flex flex-col">
          <div className="p-3 border-b border-white/6 space-y-2">
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search skills..."
              className="w-full bg-white/5 border border-white/8 rounded px-3 py-1.5 text-xs text-white/80 placeholder-white/25 outline-none focus:border-violet-500/50"
            />
            <select
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded px-3 py-1.5 text-xs text-white/60 outline-none focus:border-violet-500/50"
            >
              <option value="all">All domains</option>
              {allDomains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading && (
              <div className="text-center py-8 text-white/25 text-xs">Loading skills…</div>
            )}
            {!loading && filteredSkills.length === 0 && (
              <div className="text-center py-8 text-white/25 text-xs">No skills found</div>
            )}
            {filteredSkills.map(skill => (
              <SkillCard
                key={skill.skill_id}
                skill={skill}
                selected={selectedSkill?.skill_id === skill.skill_id}
                onSelect={() => {
                  setSelectedSkill(skill);
                  setTestInput(defaultInputForSkill(skill));
                  setResults([]);
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!selectedSkill ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FlaskConical size={32} className="text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/30 font-medium">Select a skill to test</p>
                <p className="text-xs text-white/20 mt-1">Choose from the catalog on the left</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-5 py-4 border-b border-white/8 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-white/90">{selectedSkill.label}</h2>
                    <p className="text-xs text-white/40 mt-0.5">{selectedSkill.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/35 font-medium">{selectedSkill.category}</span>
                      <span className="text-[9px] text-white/25">{selectedSkill.invocations} total runs</span>
                      {selectedSkill.avg_latency_ms > 0 && (
                        <span className="text-[9px] text-white/25">{Math.round(selectedSkill.avg_latency_ms)}ms avg</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={runTest}
                    disabled={running}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0",
                      running
                        ? "bg-violet-500/20 text-violet-400/50 cursor-not-allowed"
                        : "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/25",
                    )}
                  >
                    <Play size={13} className={running ? "animate-pulse" : ""} />
                    {running ? "Running…" : "Run Test"}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex min-h-0 divide-x divide-white/6">
                <div className="flex-1 flex flex-col p-5">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Test Input (JSON)</div>
                  <textarea
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/8 rounded-lg p-3 text-xs font-mono text-white/70 outline-none focus:border-violet-500/40 resize-none"
                    spellCheck={false}
                  />
                  {error && (
                    <div className="mt-2 text-xs text-red-400/80 flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">
                    Execution Results
                    {results.length > 0 && (
                      <span className="ml-2 text-white/20 font-normal">{results.length} run{results.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {results.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xs text-white/20">Run the skill to see results</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {results.map((r, i) => (
                        <ResultPanel key={i} result={r} accentColor="#818cf8" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
