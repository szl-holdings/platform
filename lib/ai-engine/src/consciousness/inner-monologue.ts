export type MonologueType =
  | "pre_routing"
  | "post_routing"
  | "reflection"
  | "doubt"
  | "realization"
  | "strategy_shift"
  | "self_correction"
  | "satisfaction"
  | "frustration";

export interface MonologueEntry {
  entryId: string;
  timestamp: string;
  type: MonologueType;
  thought: string;
  triggeringEvent: string;
  emotionalTone: "positive" | "neutral" | "negative" | "mixed";
  confidence: number;
  relatedAgents: string[];
  relatedDomains: string[];
  actionable: boolean;
  suggestedAction?: string;
}

export interface InnerMonologueState {
  recentThoughts: MonologueEntry[];
  dominantTone: "positive" | "neutral" | "negative" | "mixed";
  thoughtFrequency: number;
  reflectionDepth: number;
  totalEntries: number;
}

function determineTone(
  type: MonologueType,
  confidence: number,
  confusionCount: number,
): MonologueEntry["emotionalTone"] {
  if (type === "satisfaction" || (type === "realization" && confidence > 70)) return "positive";
  if (type === "frustration" || type === "doubt") return "negative";
  if (confusionCount > 0 && confidence < 50) return "negative";
  if (type === "self_correction") return "mixed";
  return "neutral";
}

class InnerMonologueEngine {
  private entries: MonologueEntry[] = [];
  private static readonly MAX_ENTRIES = 500;
  private sessionStartTime = Date.now();

  think(input: {
    type: MonologueType;
    thought: string;
    triggeringEvent: string;
    confidence: number;
    relatedAgents?: string[];
    relatedDomains?: string[];
    confusionCount?: number;
    suggestedAction?: string;
  }): MonologueEntry {
    const tone = determineTone(input.type, input.confidence, input.confusionCount ?? 0);
    const actionable = !!input.suggestedAction || input.type === "strategy_shift" || input.type === "self_correction";

    const entry: MonologueEntry = {
      entryId: `thought_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: input.type,
      thought: input.thought,
      triggeringEvent: input.triggeringEvent,
      emotionalTone: tone,
      confidence: input.confidence,
      relatedAgents: input.relatedAgents ?? [],
      relatedDomains: input.relatedDomains ?? [],
      actionable,
      suggestedAction: input.suggestedAction,
    };

    this.entries.push(entry);
    if (this.entries.length > InnerMonologueEngine.MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - InnerMonologueEngine.MAX_ENTRIES);
    }

    return entry;
  }

  preRoutingThought(query: string, agentCount: number, domains: string[]): MonologueEntry {
    const thought = agentCount > 3
      ? `Complex query spanning ${agentCount} agents across ${domains.join(", ")}. Need to coordinate carefully and watch for conflicts.`
      : agentCount === 1
        ? `Focused query — routing to single domain: ${domains[0] ?? "general"}. Should be straightforward.`
        : `Multi-domain query requiring ${domains.join(" + ")} coordination. Will watch for cross-domain insights.`;

    return this.think({
      type: "pre_routing",
      thought,
      triggeringEvent: `Query received: "${query.slice(0, 100)}"`,
      confidence: 70,
      relatedDomains: domains,
    });
  }

  postSynthesisReflection(
    avgConfidence: number,
    conflictCount: number,
    agentCount: number,
    synthesisLength: number,
    validationPassed: boolean,
  ): MonologueEntry {
    let type: MonologueType = "reflection";
    let thought: string;

    if (avgConfidence > 80 && conflictCount === 0 && validationPassed) {
      type = "satisfaction";
      thought = `Strong orchestration — ${agentCount} agents aligned at ${avgConfidence.toFixed(0)}% confidence. Synthesis is coherent and validated.`;
    } else if (avgConfidence < 40 || conflictCount >= 3) {
      type = "frustration";
      thought = `Difficult orchestration — confidence at ${avgConfidence.toFixed(0)}% with ${conflictCount} conflicts. The synthesis may not fully resolve the ambiguity. Consider flagging uncertainty to the user.`;
    } else if (conflictCount > 0) {
      type = "doubt";
      thought = `${conflictCount} conflict(s) between agents. Resolution was applied but dissenting views may have merit. Monitoring for pattern.`;
    } else {
      thought = `Orchestration complete — ${agentCount} agents, avg confidence ${avgConfidence.toFixed(0)}%. ${validationPassed ? "Validation passed." : "No validation required."} Synthesis length: ${synthesisLength} chars.`;
    }

    return this.think({
      type,
      thought,
      triggeringEvent: "Post-synthesis evaluation",
      confidence: avgConfidence,
      suggestedAction: avgConfidence < 40 ? "Consider requesting human review or additional context" : undefined,
    });
  }

  addThought(type: MonologueType, thought: string, tone: "positive" | "neutral" | "negative" | "cautious", confidence: number): MonologueEntry {
    return this.think({
      type,
      thought,
      triggeringEvent: "Per-agent consciousness observation",
      confidence,
      confusionCount: tone === "cautious" || tone === "negative" ? 1 : 0,
    });
  }

  recordRealization(insight: string, domains: string[]): MonologueEntry {
    return this.think({
      type: "realization",
      thought: insight,
      triggeringEvent: "Cross-domain pattern detected",
      confidence: 75,
      relatedDomains: domains,
    });
  }

  recordSelfCorrection(correction: string, reason: string): MonologueEntry {
    return this.think({
      type: "self_correction",
      thought: correction,
      triggeringEvent: reason,
      confidence: 60,
      suggestedAction: "Apply correction to future orchestrations",
    });
  }

  recordStrategyShift(from: string, to: string, reason: string): MonologueEntry {
    return this.think({
      type: "strategy_shift",
      thought: `Shifting strategy from "${from}" to "${to}": ${reason}`,
      triggeringEvent: reason,
      confidence: 65,
      suggestedAction: to,
    });
  }

  getState(): InnerMonologueState {
    const recent = this.entries.slice(-20);
    const tones = recent.map(e => e.emotionalTone);
    const pos = tones.filter(t => t === "positive").length;
    const neg = tones.filter(t => t === "negative").length;

    let dominantTone: MonologueEntry["emotionalTone"] = "neutral";
    if (pos > neg && pos > tones.length * 0.4) dominantTone = "positive";
    else if (neg > pos && neg > tones.length * 0.4) dominantTone = "negative";
    else if (pos > 0 && neg > 0) dominantTone = "mixed";

    const elapsedMinutes = Math.max(1, (Date.now() - this.sessionStartTime) / 60000);

    return {
      recentThoughts: this.entries.slice(-15).reverse(),
      dominantTone,
      thoughtFrequency: this.entries.length / elapsedMinutes,
      reflectionDepth: this.entries.filter(e => e.type === "reflection" || e.type === "realization").length,
      totalEntries: this.entries.length,
    };
  }

  buildMonologueContext(limit = 5): string {
    const recent = this.entries.slice(-limit).reverse();
    if (recent.length === 0) return "";

    const lines = [
      `## Inner Monologue (recent ${recent.length} thoughts)`,
      ...recent.map(e => {
        const icon = e.emotionalTone === "positive" ? "✓" : e.emotionalTone === "negative" ? "⚠" : "○";
        return `${icon} [${e.type}] ${e.thought.slice(0, 200)}`;
      }),
    ];

    return lines.join("\n");
  }
}

export const innerMonologue = new InnerMonologueEngine();
