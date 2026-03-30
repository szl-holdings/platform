import { AgentInsightsWidget } from "@workspace/shared-ui/agent-insights-widget";
import { useQuery } from "@tanstack/react-query";
import { Brain, Zap, Radio, FlaskConical } from "lucide-react";

const ACCENT = "#8b5cf6";

function GlobalFeedStats() {
  const { data } = useQuery<{ stats: { knowledge: { byDomain?: Record<string, number> }; eventBus: { totalPublished?: number } }; globalFeed: { correlations: unknown[] } }>({
    queryKey: ["agent-os-global-feed-inca"],
    queryFn: async () => {
      const r = await fetch("/api/agent-os/feed?limit=20");
      return r.json();
    },
    refetchInterval: 60000,
  });

  const knowledge = data?.stats?.knowledge;
  const eventBus = data?.stats?.eventBus;
  const globalFeed = data?.globalFeed;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: "Research Findings", value: knowledge?.byDomain?.["inca"] ?? 0, icon: FlaskConical, color: "text-violet-400", bg: "bg-violet-500/10" },
        { label: "Cross-Domain Signals", value: globalFeed?.correlations?.length ?? 0, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Events Published", value: eventBus?.totalPublished ?? 0, icon: Radio, color: "text-amber-400", bg: "bg-amber-500/10" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <div className="text-lg font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgentInsightsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Autonomous Research Intelligence</h1>
          <p className="text-xs text-muted-foreground">Research insights gathered autonomously while you were away</p>
        </div>
      </div>

      <GlobalFeedStats />

      <AgentInsightsWidget
        domain="inca"
        apiBase="/api"
        accentColor={ACCENT}
        compact={false}
      />

      <AgentInsightsWidget
        domain="global"
        apiBase="/api"
        accentColor="#6366f1"
        compact={false}
      />

      <div className="text-[10px] text-muted-foreground/40 text-center pt-2">
        Powered by SZL Agent OS — autonomous research intelligence running 24/7
      </div>
    </div>
  );
}
