import { useState, useEffect, useRef } from "react";

export interface ProactiveSuggestion {
  id: string;
  text: string;
  trigger: "context" | "time" | "inactivity" | "follow_up";
  priority: "low" | "medium" | "high";
}

export interface ProactiveSuggestionsConfig {
  agentId: string;
  screenContext?: string;
  lastMessageTimestamp?: Date;
  lastTopic?: string;
  enabled?: boolean;
  inactivityThresholdMs?: number;
}

const DOMAIN_SUGGESTIONS: Record<string, string[][]> = {
  vessels: [
    ["Check current fleet status", "View vessel positions"],
    ["Any active route deviations?", "Port arrival schedule"],
    ["Cargo compliance review", "Weather impact on routing"],
  ],
  aegis: [
    ["Recent threat alerts", "Active incident status"],
    ["Vulnerability scan summary", "SOC queue overview"],
    ["Critical system health", "Latest security briefing"],
  ],
  terra: [
    ["Top deals by cap rate", "Market trend summary"],
    ["Portfolio valuation update", "Pending closings"],
    ["Deal scoring report", "Comparable sales"],
  ],
  prism: [
    ["Open legal matters", "Upcoming deadlines"],
    ["Contract review queue", "Compliance status"],
    ["Billing summary", "Matter risk assessment"],
  ],
  lyte: [
    ["Model performance metrics", "Active deployments"],
    ["Cost optimization opportunities", "Pipeline status"],
    ["Inference error rate", "Usage by domain"],
  ],
  "carlota-jo": [
    ["Today's client schedule", "Relationship health scores"],
    ["Upcoming follow-ups", "Portfolio strategy review"],
    ["Meeting preparation brief", "Client preference updates"],
  ],
  default: [
    ["What can I help you with?", "Summarize recent activity"],
    ["Generate a report", "Search knowledge base"],
    ["Schedule a follow-up", "Draft a message"],
  ],
};

const FOLLOW_UP_PATTERNS: Record<string, string[]> = {
  "vessel|fleet|ship": ["Want me to check route optimization?", "Shall I pull the port risk report?"],
  "threat|incident|security": ["Should I escalate this to the SOC?", "Want a full incident timeline?"],
  "deal|property|valuation": ["Want to run a comparable analysis?", "Should I generate a deal scorecard?"],
  "contract|legal|matter": ["Want me to flag any risk clauses?", "Should I draft a summary for the file?"],
  "model|inference|deployment": ["Should I check the performance benchmarks?", "Want a cost analysis by provider?"],
  "client|meeting|schedule": ["Want me to prepare a briefing note?", "Should I find the next available slot?"],
};

export function useProactiveSuggestions(config: ProactiveSuggestionsConfig): {
  suggestions: ProactiveSuggestion[];
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;
} {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { enabled = true, inactivityThresholdMs = 30000 } = config;

  useEffect(() => {
    if (!enabled) return;
    generateContextualSuggestions();
  }, [config.screenContext, config.agentId]);

  useEffect(() => {
    if (!enabled || !config.lastMessageTimestamp) return;

    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      generateInactivitySuggestions();
    }, inactivityThresholdMs);

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [config.lastMessageTimestamp, enabled]);

  useEffect(() => {
    if (!enabled || !config.lastTopic) return;
    generateFollowUpSuggestions(config.lastTopic);
  }, [config.lastTopic]);

  function generateContextualSuggestions(): void {
    const domainKey = getDomainKey(config.agentId);
    const domainSuggestions = DOMAIN_SUGGESTIONS[domainKey] ?? DOMAIN_SUGGESTIONS.default!;
    const idx = Math.floor(Math.random() * domainSuggestions.length);
    const selected = domainSuggestions[idx] ?? [];

    const newSuggestions: ProactiveSuggestion[] = selected.map((text, i) => ({
      id: `ctx_${Date.now()}_${i}`,
      text,
      trigger: "context",
      priority: i === 0 ? "high" : "medium",
    }));

    setSuggestions(prev => {
      const contextIds = prev.filter(s => s.trigger === "context").map(s => s.id);
      const kept = prev.filter(s => s.trigger !== "context");
      return [...kept, ...newSuggestions].slice(0, 6);
    });
  }

  function generateInactivitySuggestions(): void {
    const domainKey = getDomainKey(config.agentId);
    const prompts = [
      "Need help with anything?",
      "Ready to continue when you are.",
      "Want a quick status update?",
    ];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)]!;

    setSuggestions(prev => {
      const already = prev.some(s => s.trigger === "inactivity");
      if (already) return prev;
      return [...prev, {
        id: `inactive_${Date.now()}`,
        text: prompt,
        trigger: "inactivity",
        priority: "low",
      }].slice(0, 6);
    });
  }

  function generateFollowUpSuggestions(topic: string): void {
    for (const [pattern, followUps] of Object.entries(FOLLOW_UP_PATTERNS)) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(topic)) {
        const suggestion: ProactiveSuggestion = {
          id: `followup_${Date.now()}`,
          text: followUps[Math.floor(Math.random() * followUps.length)]!,
          trigger: "follow_up",
          priority: "high",
        };
        setSuggestions(prev => {
          const kept = prev.filter(s => s.trigger !== "follow_up");
          return [...kept, suggestion].slice(0, 6);
        });
        break;
      }
    }
  }

  function getDomainKey(agentId: string): string {
    if (agentId.includes("vessel") || agentId.includes("maritime")) return "vessels";
    if (agentId.includes("aegis") || agentId.includes("defense") || agentId.includes("security")) return "aegis";
    if (agentId.includes("terra") || agentId.includes("real")) return "terra";
    if (agentId.includes("prism") || agentId.includes("legal")) return "prism";
    if (agentId.includes("lyte") || agentId.includes("aiops")) return "lyte";
    if (agentId.includes("carlota") || agentId.includes("advisory")) return "carlota-jo";
    return "default";
  }

  function dismissSuggestion(id: string): void {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }

  function clearSuggestions(): void {
    setSuggestions([]);
  }

  return { suggestions, dismissSuggestion, clearSuggestions };
}
