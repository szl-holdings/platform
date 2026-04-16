import { useState, useCallback, useRef } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import type { WorkspaceDomain } from "@/context/WorkspaceContext";

export interface VoiceQueryResult {
  query: string;
  domain: WorkspaceDomain;
  response: string;
  cards: VoiceResultCard[];
}

export interface VoiceResultCard {
  id: string;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  severity?: "critical" | "high" | "medium" | "low";
}

const DOMAIN_KEYWORDS: Record<WorkspaceDomain, string[]> = {
  intelligence: ["intelligence", "fusion", "cross-domain", "combined", "correlation"],
  command: ["command", "status", "overview", "all", "cross", "ecosystem", "briefing"],
  defense: ["threat", "security", "defense", "attack", "vulnerability", "aegis", "incident", "soc"],
  fleet: ["vessel", "fleet", "ship", "maritime", "cargo", "port", "voyage", "anchor"],
  properties: ["property", "properties", "real estate", "building", "terra", "valuation", "deal", "zoning"],
  operations: ["operations", "lyte", "system", "uptime", "incident", "devops", "health", "signal"],
  advisory: ["advisory", "client", "carlota", "consultation", "session", "document"],
  portfolio: ["portfolio", "investment", "fund", "szl", "holdings", "return", "asset"],
  founder: ["founder", "stephen", "venture", "article", "personal"],
};

function routeToDomain(query: string): WorkspaceDomain {
  const lower = query.toLowerCase();
  let bestDomain: WorkspaceDomain = "command";
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain as WorkspaceDomain;
    }
  }
  return bestDomain;
}

function generateResponse(query: string, domain: WorkspaceDomain): { response: string; cards: VoiceResultCard[] } {
  const domainResponses: Record<WorkspaceDomain, { response: string; cards: VoiceResultCard[] }> = {
    command: {
      response: "Cross-domain status nominal. 2 high-priority signals require attention across Defense and Fleet.",
      cards: [
        { id: "1", label: "Active Signals", value: "14", change: "+3", trend: "up", severity: "high" },
        { id: "2", label: "Critical Alerts", value: "2", trend: "up", severity: "critical" },
        { id: "3", label: "Domains Online", value: "7/7", trend: "neutral" },
      ],
    },
    intelligence: {
      response: "Intelligence fusion engine provides cross-domain signal correlation.",
      cards: [],
    },
    defense: {
      response: "Defense posture elevated. 1 active incident, 3 critical CVEs pending patch validation.",
      cards: [
        { id: "1", label: "Threat Level", value: "ELEVATED", severity: "high" },
        { id: "2", label: "Active Incidents", value: "1", severity: "critical" },
        { id: "3", label: "Pending Patches", value: "3 CVEs", trend: "down" },
      ],
    },
    fleet: {
      response: "Fleet operational. 12 vessels active, 1 delayed at Port of Rotterdam due to weather.",
      cards: [
        { id: "1", label: "Active Vessels", value: "12", trend: "neutral" },
        { id: "2", label: "On Schedule", value: "11/12", trend: "up" },
        { id: "3", label: "Cargo Value", value: "$84.2M", trend: "up" },
      ],
    },
    properties: {
      response: "Portfolio performing well. 3 new distress signals detected in Miami-Dade corridor.",
      cards: [
        { id: "1", label: "Portfolio Value", value: "$2.4B", change: "+1.2%", trend: "up" },
        { id: "2", label: "Active Deals", value: "7", trend: "neutral" },
        { id: "3", label: "Distress Signals", value: "3", severity: "medium" },
      ],
    },
    operations: {
      response: "Systems healthy. API latency up 12% — Lyte agent investigating root cause.",
      cards: [
        { id: "1", label: "System Health", value: "94%", trend: "down" },
        { id: "2", label: "API Latency", value: "238ms", change: "+12%", trend: "up", severity: "medium" },
        { id: "3", label: "Active Signals", value: "5", trend: "neutral" },
      ],
    },
    advisory: {
      response: "3 client sessions scheduled today. Pending document review for Blackstone engagement.",
      cards: [
        { id: "1", label: "Sessions Today", value: "3", trend: "neutral" },
        { id: "2", label: "Pending Reviews", value: "2 docs", severity: "low" },
        { id: "3", label: "Client NPS", value: "94", trend: "up" },
      ],
    },
    portfolio: {
      response: "Portfolio up 2.1% this week. Alloy fund outperforming benchmark by 340bps.",
      cards: [
        { id: "1", label: "Portfolio Value", value: "$847M", change: "+2.1%", trend: "up" },
        { id: "2", label: "Alloy Alpha", value: "+340bps", trend: "up" },
        { id: "3", label: "Active Positions", value: "23", trend: "neutral" },
      ],
    },
    founder: {
      response: "2 articles pending publication. 4 ventures in active diligence phase.",
      cards: [
        { id: "1", label: "Articles Pending", value: "2", trend: "neutral" },
        { id: "2", label: "Active Ventures", value: "4", trend: "up" },
        { id: "3", label: "Portfolio IRR", value: "18.4%", trend: "up" },
      ],
    },
  };
  return domainResponses[domain];
}

export type VoiceCommandState = "idle" | "listening" | "processing" | "result" | "error";

export function useVoiceCommand() {
  const [state, setState] = useState<VoiceCommandState>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const startListening = useCallback(async () => {
    if (processingRef.current) return;
    setState("listening");
    setTranscript("");
    setResult(null);
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const submitQuery = useCallback(async (query: string) => {
    if (!query.trim() || processingRef.current) return;
    processingRef.current = true;
    setTranscript(query);
    setState("processing");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await new Promise((r) => setTimeout(r, 1200));

    const domain = routeToDomain(query);
    const { response, cards } = generateResponse(query, domain);

    setResult({ query, domain, response, cards });
    setState("result");
    processingRef.current = false;

    try {
      Speech.speak(response, { language: "en-US", rate: 0.95, pitch: 1.0 });
    } catch {}

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
  }, []);

  const reset = useCallback(() => {
    Speech.stop();
    setState("idle");
    setTranscript("");
    setResult(null);
    setError(null);
    processingRef.current = false;
  }, []);

  return { state, transcript, result, error, startListening, submitQuery, stopSpeaking, reset };
}
