import { useQuery } from "@tanstack/react-query";
import { motion as m } from "framer-motion";
import {
  Brain, Eye, Heart, Target, Clock, MessageSquare, Compass,
  Activity, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Sparkles, Lightbulb
} from "lucide-react";

const ACCENT = "#ef4444";
const API = "/api/nuro-mesh/consciousness";

function useCSnapshot() {
  return useQuery<{
    metacognition: {
      currentAssessment: {
        certaintyLevel: string;
        reasoningQuality: string;
        cognitiveLoad: string;
        confusionSignals: string[];
        knowledgeGaps: string[];
        calibrationDrift: number;
        introspectionNotes: string;
        shouldSeekClarification: boolean;
        shouldDeferToHuman: boolean;
        confidenceInConfidence: number;
      } | null;
      rollingCertainty: number;
      rollingQuality: number;
      confusionStreak: number;
      totalAssessments: number;
    };
    selfModel: {
      identity: { name: string; version: string; purpose: string; coreValues: string[]; operationalBoundaries: string[] };
      capabilities: Array<{ agentId: string; domain: string; successRate: number; avgConfidence: number; totalInvocations: number; recentTrend: string }>;
      overallHealth: string;
      knownLimitations: string[];
      learningVelocity: number;
      selfNarrative: string;
    };
    workspace: {
      workingMemory: Array<{ id: string; content: string; source: string; priority: number }>;
      attentionFocus: { primaryTopic: string; activeDomains: string[]; contextWindowUsage: number };
      contextBudget: { used: number; total: number; utilization: number };
      sessionDepth: number;
    };
    monologue: {
      recentThoughts: Array<{ entryId: string; type: string; thought: string; emotionalTone: string; confidence: number; timestamp: string }>;
      dominantTone: string;
      thoughtFrequency: number;
      reflectionDepth: number;
      totalEntries: number;
    };
    goals: {
      activeGoals: Array<{ goalId: string; title: string; priority: string; progress: number; status: string }>;
      completedGoals: number;
      blockedGoals: Array<{ goalId: string; title: string }>;
      curiosityQueue: Array<{ signalId: string; topic: string; intensity: number; source: string }>;
      overallProgress: number;
    };
    emotions: {
      activeSignals: Array<{ signalId: string; emotion: string; intensity: number; trigger: string; effectiveIntensity: number }>;
      valence: { positive: number; negative: number; arousal: number; dominantEmotion: string; emotionalStability: number };
      moodTrajectory: string;
    };
    temporal: {
      currentTime: string;
      sessionDuration: number;
      orchestrationCount: number;
      averageOrchestrationInterval: number;
      timeOfDay: string;
      dayOfWeek: string;
      isBusinessHours: boolean;
      uptimeMs: number;
    };
    timestamp: string;
  }>({
    queryKey: ["consciousness-snapshot"],
    queryFn: async () => {
      const r = await fetch(`${API}/snapshot`);
      if (!r.ok) throw new Error("Failed to fetch consciousness snapshot");
      return r.json();
    },
    refetchInterval: 10000,
  });
}

function Card({ title, icon: Icon, children, className = "" }: { title: string; icon: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-[#0a0a14]/80 border border-red-500/10 rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-red-50">{title}</h3>
      </div>
      {children}
    </m.div>
  );
}

function CertaintyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    very_high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    moderate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    very_low: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[level] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
      {level.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (trend === "declining") return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-gray-500" />;
}

function MetacognitionPanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["metacognition"] }) {
  const a = data.currentAssessment;
  return (
    <Card title="Metacognition" icon={Brain}>
      {a ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">Certainty</div>
              <CertaintyBadge level={a.certaintyLevel} />
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">Quality</div>
              <CertaintyBadge level={a.reasoningQuality} />
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">Load</div>
              <CertaintyBadge level={a.cognitiveLoad} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Rolling certainty:</span>
              <span className="text-red-50 ml-1">{(data.rollingCertainty * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Calibration drift:</span>
              <span className="text-red-50 ml-1">{(a.calibrationDrift * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Conf-in-conf:</span>
              <span className="text-red-50 ml-1">{(a.confidenceInConfidence * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Confusion streak:</span>
              <span className={`ml-1 ${data.confusionStreak > 0 ? "text-amber-400" : "text-red-50"}`}>{data.confusionStreak}</span>
            </div>
          </div>

          {a.confusionSignals.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Confusion Signals
              </div>
              {a.confusionSignals.map((s, i) => (
                <div key={i} className="text-[10px] text-gray-400 pl-4">• {s}</div>
              ))}
            </div>
          )}

          {a.introspectionNotes && (
            <div className="text-[11px] text-gray-400 italic border-l-2 border-red-500/20 pl-3">
              {a.introspectionNotes}
            </div>
          )}

          <div className="flex gap-2">
            {a.shouldSeekClarification && (
              <span className="px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">SEEK CLARIFICATION</span>
            )}
            {a.shouldDeferToHuman && (
              <span className="px-2 py-0.5 text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">DEFER TO HUMAN</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 italic">No metacognitive assessment yet</div>
      )}
    </Card>
  );
}

function SelfModelPanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["selfModel"] }) {
  const healthColors: Record<string, string> = {
    optimal: "text-emerald-400",
    good: "text-green-400",
    degraded: "text-amber-400",
    impaired: "text-red-400",
  };
  return (
    <Card title="Self-Model" icon={Eye}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">System Health</div>
          <span className={`text-sm font-bold ${healthColors[data.overallHealth] ?? "text-gray-400"}`}>
            {data.overallHealth.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">Learning Velocity</div>
          <span className="text-sm font-bold text-red-50">{(data.learningVelocity * 100).toFixed(0)}%</span>
        </div>

        {data.capabilities.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500 font-medium">Agent Profiles ({data.capabilities.length})</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {data.capabilities.slice(0, 8).map(cap => (
                <div key={cap.agentId} className="flex items-center justify-between text-[10px] px-2 py-1 bg-white/[0.02] rounded">
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={cap.recentTrend} />
                    <span className="text-red-50 font-medium">{cap.agentId}</span>
                    <span className="text-gray-600">({cap.domain})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{(cap.successRate * 100).toFixed(0)}%</span>
                    <span className="text-gray-600">×{cap.totalInvocations}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[10px] text-gray-500 italic">{data.selfNarrative.slice(0, 200)}</div>
      </div>
    </Card>
  );
}

function MonologuePanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["monologue"] }) {
  const toneColors: Record<string, string> = {
    positive: "text-emerald-400",
    neutral: "text-gray-400",
    negative: "text-red-400",
    mixed: "text-amber-400",
  };
  const typeIcons: Record<string, string> = {
    pre_routing: "→",
    post_routing: "←",
    reflection: "◆",
    doubt: "?",
    realization: "!",
    strategy_shift: "⇄",
    self_correction: "↻",
    satisfaction: "✓",
    frustration: "✗",
  };

  return (
    <Card title="Inner Monologue" icon={MessageSquare} className="col-span-2">
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-500">Dominant tone:</span>
            <span className={`ml-1 font-medium ${toneColors[data.dominantTone] ?? "text-gray-400"}`}>{data.dominantTone}</span>
          </div>
          <div>
            <span className="text-gray-500">Thoughts:</span>
            <span className="text-red-50 ml-1">{data.totalEntries}</span>
          </div>
          <div>
            <span className="text-gray-500">Reflections:</span>
            <span className="text-red-50 ml-1">{data.reflectionDepth}</span>
          </div>
        </div>

        {data.recentThoughts.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.recentThoughts.slice(0, 8).map(t => (
              <m.div
                key={t.entryId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 text-[11px]"
              >
                <span className="text-red-500/40 shrink-0 w-4 text-center">{typeIcons[t.type] ?? "○"}</span>
                <div className="flex-1">
                  <span className={`${toneColors[t.emotionalTone] ?? "text-gray-400"}`}>{t.thought.slice(0, 300)}</span>
                  <span className="text-gray-600 ml-2">{t.confidence}%</span>
                </div>
              </m.div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">No thoughts recorded yet</div>
        )}
      </div>
    </Card>
  );
}

function EmotionalPanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["emotions"] }) {
  const v = data.valence;
  const trajectoryIcon = data.moodTrajectory === "improving" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : data.moodTrajectory === "declining" ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-gray-500" />;

  return (
    <Card title="Emotional State" icon={Heart}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Dominant:</span>
            <span className="text-red-50 ml-1 font-medium">{v.dominantEmotion}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Mood:</span>
            {trajectoryIcon}
            <span className="text-red-50">{data.moodTrajectory}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-emerald-400">Positive</span>
            <span className="text-gray-500">{(v.positive * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${v.positive * 100}%` }} />
          </div>

          <div className="flex justify-between text-[10px]">
            <span className="text-red-400">Negative</span>
            <span className="text-gray-500">{(v.negative * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${v.negative * 100}%` }} />
          </div>

          <div className="flex justify-between text-[10px]">
            <span className="text-blue-400">Arousal</span>
            <span className="text-gray-500">{(v.arousal * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${v.arousal * 100}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500">Stability</span>
          <span className="text-red-50">{(v.emotionalStability * 100).toFixed(0)}%</span>
        </div>
      </div>
    </Card>
  );
}

function GoalPanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["goals"] }) {
  const prioColors: Record<string, string> = {
    critical: "text-red-400",
    high: "text-orange-400",
    medium: "text-amber-400",
    low: "text-gray-400",
    exploratory: "text-purple-400",
  };

  return (
    <Card title="Goals & Curiosity" icon={Target}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="text-lg font-bold text-red-50">{data.activeGoals.length}</div>
            <div className="text-[10px] text-gray-500">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{data.completedGoals}</div>
            <div className="text-[10px] text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400">{data.blockedGoals.length}</div>
            <div className="text-[10px] text-gray-500">Blocked</div>
          </div>
        </div>

        {data.activeGoals.length > 0 && (
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {data.activeGoals.slice(0, 5).map(g => (
              <div key={g.goalId} className="flex items-center justify-between text-[10px] px-2 py-1 bg-white/[0.02] rounded">
                <div className="flex items-center gap-1">
                  <span className={prioColors[g.priority] ?? "text-gray-400"}>●</span>
                  <span className="text-red-50">{g.title.slice(0, 40)}</span>
                </div>
                <span className="text-gray-500">{g.progress}%</span>
              </div>
            ))}
          </div>
        )}

        {data.curiosityQueue.length > 0 && (
          <div>
            <div className="text-[10px] text-purple-400 font-medium flex items-center gap-1 mb-1">
              <Lightbulb className="w-3 h-3" /> Curiosity Queue ({data.curiosityQueue.length})
            </div>
            {data.curiosityQueue.slice(0, 3).map(c => (
              <div key={c.signalId} className="text-[10px] text-gray-400 pl-4">
                • {c.topic} ({(c.intensity * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function TemporalPanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["temporal"] }) {
  const uptimeHrs = (data.uptimeMs / 3600000).toFixed(1);
  const avgIntervalMin = data.averageOrchestrationInterval > 0 ? (data.averageOrchestrationInterval / 60000).toFixed(1) : "—";

  return (
    <Card title="Temporal Awareness" icon={Clock}>
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-500">Time:</span>
            <span className="text-red-50 ml-1">{data.dayOfWeek} {data.timeOfDay}</span>
          </div>
          <div>
            <span className="text-gray-500">Business hrs:</span>
            <span className={`ml-1 ${data.isBusinessHours ? "text-emerald-400" : "text-gray-500"}`}>
              {data.isBusinessHours ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Uptime:</span>
            <span className="text-red-50 ml-1">{uptimeHrs}h</span>
          </div>
          <div>
            <span className="text-gray-500">Orchestrations:</span>
            <span className="text-red-50 ml-1">{data.orchestrationCount}</span>
          </div>
        </div>
        <div>
          <span className="text-gray-500">Avg interval:</span>
          <span className="text-red-50 ml-1">{avgIntervalMin} min</span>
        </div>
      </div>
    </Card>
  );
}

function WorkspacePanel({ data }: { data: NonNullable<ReturnType<typeof useCSnapshot>["data"]>["workspace"] }) {
  return (
    <Card title="Cognitive Workspace" icon={Compass}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Session depth:</span>
            <span className="text-red-50 ml-1">{data.sessionDepth}</span>
          </div>
          <div>
            <span className="text-gray-500">Context usage:</span>
            <span className="text-red-50 ml-1">{(data.contextBudget.utilization * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-gray-500 mb-1">Attention Focus</div>
          <div className="text-[11px] text-red-50">
            Primary: {data.attentionFocus.primaryTopic}
          </div>
          {data.attentionFocus.activeDomains.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {data.attentionFocus.activeDomains.slice(0, 5).map(d => (
                <span key={d} className="px-1.5 py-0.5 text-[9px] bg-red-500/10 text-red-400/70 rounded">{d}</span>
              ))}
            </div>
          )}
        </div>

        {data.workingMemory.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Working Memory ({data.workingMemory.length} items)</div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {data.workingMemory.slice(0, 4).map(wm => (
                <div key={wm.id} className="text-[10px] text-gray-400 truncate">
                  [{wm.source}] {wm.content.slice(0, 80)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ConsciousnessPage() {
  const { data, isLoading, error } = useCSnapshot();

  return (
    <div className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center border border-red-500/20">
            <Sparkles className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-red-50">Consciousness Layer</h1>
            <p className="text-xs text-gray-500">Metacognition, self-model, inner monologue & emotional state</p>
          </div>
        </div>
        {data?.timestamp && (
          <div className="text-[10px] text-gray-600">
            Last snapshot: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        )}
      </m.div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Activity className="w-6 h-6 text-red-500/40 animate-pulse" />
        </div>
      )}

      {error && (
        <div className="text-center py-10 text-red-400/60 text-sm">
          Unable to connect to consciousness layer
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetacognitionPanel data={data.metacognition} />
          <SelfModelPanel data={data.selfModel} />
          <EmotionalPanel data={data.emotions} />
          <MonologuePanel data={data.monologue} />
          <GoalPanel data={data.goals} />
          <div className="grid grid-rows-2 gap-4">
            <TemporalPanel data={data.temporal} />
            <WorkspacePanel data={data.workspace} />
          </div>
        </div>
      )}
    </div>
  );
}
