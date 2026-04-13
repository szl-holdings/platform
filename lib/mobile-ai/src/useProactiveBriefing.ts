import { useState, useCallback, useEffect } from "react";
import type { TimeOfDay } from "./useContextualAwareness";

export interface BriefingMetric {
  label: string;
  value: string;
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
  accent?: string;
}

export interface BriefingAnomaly {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  domain: string;
  detectedAt: string;
}

export interface BriefingAction {
  id: string;
  label: string;
  description: string;
  priority: "urgent" | "high" | "medium";
  route?: string;
}

export interface DomainBriefing {
  id: string;
  domain: string;
  type: "morning" | "evening";
  headline: string;
  summary: string;
  metrics: BriefingMetric[];
  anomalies: BriefingAnomaly[];
  recommendedActions: BriefingAction[];
  generatedAt: string;
  dataFreshness: "live" | "cached" | "stale";
}

export interface ProactiveBriefingConfig {
  domain: string;
  apiBaseUrl: string;
  authToken?: string;
  accentColor: string;
  enabled?: boolean;
}

function getFallbackBriefing(
  domain: string,
  type: "morning" | "evening",
  accentColor: string,
): DomainBriefing {
  const domainTemplates: Record<string, {
    headline: string;
    summary: string;
    metrics: BriefingMetric[];
  }> = {
    maritime: {
      headline: type === "morning" ? "Fleet Morning Status" : "Fleet Evening Digest",
      summary: type === "morning"
        ? "Fleet overview for the day ahead. Review overnight movements and risk changes."
        : "End-of-day fleet summary. Review completed voyages and pending operations.",
      metrics: [
        { label: "Active Vessels", value: "—", accent: accentColor },
        { label: "In Port", value: "—", accent: accentColor },
        { label: "Risk Alerts", value: "—", changeDirection: "neutral" as const, accent: "#ef4444" },
        { label: "On Schedule", value: "—%", changeDirection: "up" as const, accent: "#22c55e" },
      ],
    },
    defense: {
      headline: type === "morning" ? "Threat Landscape Brief" : "Security Posture Digest",
      summary: type === "morning"
        ? "Current threat landscape and overnight incident summary. Review critical findings."
        : "Day's security events summary. Review resolved and open incidents.",
      metrics: [
        { label: "Open Incidents", value: "—", accent: "#ef4444" },
        { label: "Critical Findings", value: "—", accent: "#f59e0b" },
        { label: "Posture Score", value: "—", accent: accentColor },
        { label: "Threats Mitigated", value: "—", changeDirection: "up" as const, accent: "#22c55e" },
      ],
    },
    property: {
      headline: type === "morning" ? "Market Intelligence Brief" : "Portfolio Evening Digest",
      summary: type === "morning"
        ? "New market opportunities and overnight price signals for your portfolio."
        : "Day's property activity and pipeline status summary.",
      metrics: [
        { label: "Tracked Properties", value: "—", accent: accentColor },
        { label: "New Opportunities", value: "—", changeDirection: "up" as const, accent: "#22c55e" },
        { label: "Price Alerts", value: "—", accent: "#f59e0b" },
        { label: "Pipeline Value", value: "$—", accent: accentColor },
      ],
    },
    energy: {
      headline: type === "morning" ? "Energy Systems Brief" : "System Health Digest",
      summary: type === "morning"
        ? "Overnight system health anomalies and energy signal review."
        : "Day's energy consumption, anomaly count, and system performance.",
      metrics: [
        { label: "Active Sites", value: "—", accent: accentColor },
        { label: "Anomalies", value: "—", accent: "#ef4444" },
        { label: "Uptime", value: "—%", changeDirection: "up" as const, accent: "#22c55e" },
        { label: "Avg Load", value: "—kW", accent: accentColor },
      ],
    },
    advisory: {
      headline: type === "morning" ? "Client Day Prep" : "Client Engagement Digest",
      summary: type === "morning"
        ? "Client meeting prep packs and upcoming engagement priorities."
        : "Day's client interactions and follow-up actions summary.",
      metrics: [
        { label: "Active Clients", value: "—", accent: accentColor },
        { label: "Today's Meetings", value: "—", accent: accentColor },
        { label: "Pending Follow-ups", value: "—", accent: "#f59e0b" },
        { label: "Open Actions", value: "—", accent: "#ef4444" },
      ],
    },
    executive: {
      headline: type === "morning" ? "Executive Morning Brief" : "Portfolio Evening Summary",
      summary: type === "morning"
        ? "Cross-portfolio status and today's strategic priorities."
        : "Day's performance across all holdings and pending decisions.",
      metrics: [
        { label: "Open Decisions", value: "—", accent: "#f59e0b" },
        { label: "Critical Alerts", value: "—", accent: "#ef4444" },
        { label: "Portfolio Health", value: "—%", accent: "#22c55e" },
        { label: "Active Workflows", value: "—", accent: accentColor },
      ],
    },
    portfolio: {
      headline: type === "morning" ? "Holdings Morning Pulse" : "Portfolio Evening Review",
      summary: type === "morning"
        ? "Portfolio health overview and governance priorities for the day."
        : "Day's performance summary across all SZL holdings.",
      metrics: [
        { label: "Platforms Online", value: "—", accent: "#22c55e" },
        { label: "Active Incidents", value: "—", accent: "#ef4444" },
        { label: "Fleet Vessels", value: "—", accent: accentColor },
        { label: "Open Deals", value: "—", accent: accentColor },
      ],
    },
  };

  const template = domainTemplates[domain] ?? domainTemplates.executive!;

  return {
    id: `fallback-${domain}-${Date.now()}`,
    domain,
    type,
    headline: template.headline,
    summary: template.summary,
    metrics: template.metrics,
    anomalies: [],
    recommendedActions: [],
    generatedAt: new Date().toISOString(),
    dataFreshness: "cached",
  };
}

export function useProactiveBriefing(config: ProactiveBriefingConfig) {
  const [briefing, setBriefing] = useState<DomainBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async (type: "morning" | "evening") => {
    if (config.enabled === false) return;
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.authToken) headers["Authorization"] = `Bearer ${config.authToken}`;

      const resp = await fetch(
        `${config.apiBaseUrl}/ai/briefing?domain=${config.domain}&type=${type}`,
        { headers, signal: AbortSignal.timeout(8000) },
      );

      if (!resp.ok) throw new Error(`Briefing API: ${resp.status}`);
      const data = await resp.json() as DomainBriefing;
      setBriefing({ ...data, dataFreshness: "live" });
    } catch {
      setBriefing(getFallbackBriefing(config.domain, type, config.accentColor));
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const refresh = useCallback(() => {
    const hour = new Date().getHours();
    const type = hour >= 17 ? "evening" : "morning";
    fetchBriefing(type);
  }, [fetchBriefing]);

  useEffect(() => {
    refresh();
  }, []);

  return { briefing, isLoading, error, refresh };
}
