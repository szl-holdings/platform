import { AgentInsightsWidget } from "@workspace/shared-ui/agent-insights-widget";
import { Brain, Zap, Radio, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const ACCENT = "#ec4899";

function GlobalFeedStats() {
  const { data } = useQuery<{
    stats: {
      knowledge: { totalEntries?: number; byDomain?: Record<string, number> };
      eventBus: { totalPublished?: number };
    };
    globalFeed: { recentFindings: unknown[]; correlations: unknown[] };
  }>({
    queryKey: ["agent-os-global-feed-dreamscape"],
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
        { label: "Creative Findings", value: knowledge?.byDomain?.["dreamscape"] ?? 0, icon: Sparkles, color: "text-pink-400", bg: "bg-pink-500/10" },
        { label: "Cross-Domain Signals", value: globalFeed?.correlations?.length ?? 0, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Events Published", value: eventBus?.totalPublished ?? 0, icon: Radio, color: "text-amber-400", bg: "bg-amber-500/10" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-card/80 border border-border rounded-xl p-4 flex items-center gap-3">
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
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Autonomous Intelligence</h1>
          <p className="text-xs text-muted-foreground">Creative insights gathered by agents running in the background</p>
        </div>
      </div>

      <GlobalFeedStats />

      <AgentInsightsWidget
        domain="dreamscape"
        apiBase="/api"
        accentColor={ACCENT}
        compact={false}
      />

      <AgentInsightsWidget
        domain="inca"
        apiBase="/api"
        accentColor="#8b5cf6"
        compact={false}
      />

      <div className="text-[10px] text-muted-foreground/40 text-center pt-2">
        Powered by SZL Agent OS — autonomous intelligence running 24/7
      </div>
    </div>
  );
}
