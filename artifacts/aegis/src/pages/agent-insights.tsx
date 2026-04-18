import { AgentInsightsWidget } from "@szl-holdings/shared-ui/agent-insights-widget";
import { MicroFeedbackWidget } from "@szl-holdings/shared-ui/micro-feedback-widget";
import { useQuery } from "@tanstack/react-query";
import { Brain, Zap, Radio, ShieldAlert } from "lucide-react";

const ACCENT = "#ef4444";

function GlobalFeedStats() {
  const { data } = useQuery<{ stats: { knowledge: { byDomain?: Record<string, number> }; eventBus: { totalPublished?: number } }; globalFeed: { correlations: unknown[] } }>({
    queryKey: ["agent-os-global-feed-aegis"],
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
        { label: "Security Findings", value: knowledge?.byDomain?.["aegis"] ?? 0, icon: ShieldAlert, color: "text-orange-400", bg: "bg-orange-500/10" },
        { label: "Cross-Domain Signals", value: globalFeed?.correlations?.length ?? 0, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Events Published", value: eventBus?.totalPublished ?? 0, icon: Radio, color: "text-amber-400", bg: "bg-amber-500/10" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-[#09080f]/80 border border-orange-500/10 rounded-xl p-4 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <div className="text-lg font-bold text-orange-50">{typeof value === "number" ? value.toLocaleString() : value}</div>
            <div className="text-[10px] text-orange-400/50">{label}</div>
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
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-orange-50">Autonomous Threat Intelligence</h1>
          <p className="text-xs text-orange-400/50">Security insights gathered autonomously while you were away</p>
        </div>
      </div>

      <GlobalFeedStats />

      <AgentInsightsWidget
        domain="aegis"
        apiBase="/api"
        accentColor={ACCENT}
        compact={false}
        className="border-orange-500/20 bg-[#09080f]/60"
      />

      <AgentInsightsWidget
        domain="vessels"
        apiBase="/api"
        accentColor="#3b82f6"
        compact={false}
        className="border-orange-500/10 bg-[#09080f]/60"
      />

      <div className="flex justify-end pt-1">
        <MicroFeedbackWidget
          featureId="aegis-agent-insights"
          featureName="Aegis Autonomous Threat Intelligence"
          app="aegis"
          compact
          prompt="Were these threat insights useful?"
        />
      </div>

      <div className="text-[10px] text-orange-400/30 text-center pt-2">
        Powered by SZL Agent OS — autonomous security intelligence running 24/7
      </div>
    </div>
  );
}
