export type MonologueType =
  | 'pre_routing'
  | 'post_routing'
  | 'reflection'
  | 'doubt'
  | 'realization'
  | 'strategy_shift'
  | 'self_correction'
  | 'satisfaction'
  | 'frustration'
  | 'dialectical'
  | 'socratic';

export interface MonologueEntry {
  entryId: string;
  timestamp: string;
  type: MonologueType;
  thought: string;
  triggeringEvent: string;
  emotionalTone: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence: number;
  relatedAgents: string[];
  relatedDomains: string[];
  actionable: boolean;
  suggestedAction?: string;
}

export interface DialecticalTriple {
  tripleId: string;
  topic: string;
  thesis: string;
  antithesis: string;
  synthesis: string;
  confidence: number;
  timestamp: string;
}

export interface SocraticChain {
  chainId: string;
  originalClaim: string;
  questions: Array<{ question: string; answer: string; depth: number }>;
  conclusion: string;
  assumptionsExposed: string[];
  timestamp: string;
}

export interface PerspectiveSimulation {
  simulationId: string;
  topic: string;
  perspectives: Array<{
    viewpoint: 'user' | 'operator' | 'adversary' | 'regulator';
    argument: string;
    priority: string;
  }>;
  synthesis: string;
  timestamp: string;
}

export interface InnerMonologueState {
  recentThoughts: MonologueEntry[];
  dominantTone: 'positive' | 'neutral' | 'negative' | 'mixed';
  thoughtFrequency: number;
  reflectionDepth: number;
  totalEntries: number;
  dialecticalTriples: DialecticalTriple[];
  socraticChains: SocraticChain[];
  perspectiveSimulations: PerspectiveSimulation[];
}

function determineTone(
  type: MonologueType,
  confidence: number,
  confusionCount: number,
): MonologueEntry['emotionalTone'] {
  if (type === 'satisfaction' || (type === 'realization' && confidence > 70)) return 'positive';
  if (type === 'frustration' || type === 'doubt') return 'negative';
  if (confusionCount > 0 && confidence < 50) return 'negative';
  if (type === 'self_correction' || type === 'dialectical') return 'mixed';
  return 'neutral';
}

type LlmIntrospector = (prompt: string) => Promise<string>;

let _llmIntrospector: LlmIntrospector | null = null;

export function setLlmIntrospector(fn: LlmIntrospector): void {
  _llmIntrospector = fn;
}

class InnerMonologueEngine {
  private entries: MonologueEntry[] = [];
  private triples: DialecticalTriple[] = [];
  private chains: SocraticChain[] = [];
  private perspectives: PerspectiveSimulation[] = [];
  private static readonly MAX_ENTRIES = 500;
  private static readonly MAX_TRIPLES = 30;
  private static readonly MAX_CHAINS = 20;
  private static readonly MAX_PERSPECTIVES = 15;
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
    const actionable =
      !!input.suggestedAction ||
      input.type === 'strategy_shift' ||
      input.type === 'self_correction';

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
      ...(input.suggestedAction !== undefined ? { suggestedAction: input.suggestedAction } : {}),
    };

    this.entries.push(entry);
    if (this.entries.length > InnerMonologueEngine.MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - InnerMonologueEngine.MAX_ENTRIES);
    }

    return entry;
  }

  preRoutingThought(query: string, agentCount: number, domains: string[]): MonologueEntry {
    const thought =
      agentCount > 3
        ? `Complex query spanning ${agentCount} agents across ${domains.join(', ')}. Need to coordinate carefully and watch for conflicts.`
        : agentCount === 1
          ? `Focused query — routing to single domain: ${domains[0] ?? 'general'}. Should be straightforward.`
          : `Multi-domain query requiring ${domains.join(' + ')} coordination. Will watch for cross-domain insights.`;

    return this.think({
      type: 'pre_routing',
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
    let type: MonologueType = 'reflection';
    let thought: string;

    if (avgConfidence > 80 && conflictCount === 0 && validationPassed) {
      type = 'satisfaction';
      thought = `Strong orchestration — ${agentCount} agents aligned at ${avgConfidence.toFixed(0)}% confidence. Synthesis is coherent and validated.`;
    } else if (avgConfidence < 40 || conflictCount >= 3) {
      type = 'frustration';
      thought = `Difficult orchestration — confidence at ${avgConfidence.toFixed(0)}% with ${conflictCount} conflicts. The synthesis may not fully resolve the ambiguity. Consider flagging uncertainty to the user.`;
    } else if (conflictCount > 0) {
      type = 'doubt';
      thought = `${conflictCount} conflict(s) between agents. Resolution was applied but dissenting views may have merit. Monitoring for pattern.`;
    } else {
      thought = `Orchestration complete — ${agentCount} agents, avg confidence ${avgConfidence.toFixed(0)}%. ${validationPassed ? 'Validation passed.' : 'No validation required.'} Synthesis length: ${synthesisLength} chars.`;
    }

    return this.think({
      type,
      thought,
      triggeringEvent: 'Post-synthesis evaluation',
      confidence: avgConfidence,
      ...(avgConfidence < 40 ? { suggestedAction: 'Consider requesting human review or additional context' } : {}),
    });
  }

  addThought(
    type: MonologueType,
    thought: string,
    tone: 'positive' | 'neutral' | 'negative' | 'cautious',
    confidence: number,
  ): MonologueEntry {
    return this.think({
      type,
      thought,
      triggeringEvent: 'Per-agent consciousness observation',
      confidence,
      confusionCount: tone === 'cautious' || tone === 'negative' ? 1 : 0,
    });
  }

  recordRealization(insight: string, domains: string[]): MonologueEntry {
    return this.think({
      type: 'realization',
      thought: insight,
      triggeringEvent: 'Cross-domain pattern detected',
      confidence: 75,
      relatedDomains: domains,
    });
  }

  recordSelfCorrection(correction: string, reason: string): MonologueEntry {
    return this.think({
      type: 'self_correction',
      thought: correction,
      triggeringEvent: reason,
      confidence: 60,
      suggestedAction: 'Apply correction to future orchestrations',
    });
  }

  dialecticalReason(input: {
    topic: string;
    agentResponses: Array<{
      agentId: string;
      response: string;
      confidence: number;
      domain: string;
    }>;
    context: string;
  }): DialecticalTriple {
    const sorted = [...input.agentResponses].sort((a, b) => b.confidence - a.confidence);
    const strongestView = sorted[0];
    const weakestView = sorted[sorted.length - 1];

    const thesis = strongestView
      ? `${strongestView.domain} perspective (${strongestView.confidence}%): ${strongestView.response.slice(0, 200)}`
      : 'No clear thesis — insufficient agent responses.';

    let antithesis: string;
    if (weakestView && weakestView.agentId !== strongestView?.agentId) {
      antithesis = `Counter from ${weakestView.domain} (${weakestView.confidence}%): ${weakestView.response.slice(0, 200)}`;
    } else {
      antithesis = 'No significant counter-argument found — agents largely agree.';
    }

    const confidenceSpread =
      sorted.length > 1 ? sorted[0]!.confidence - sorted[sorted.length - 1]!.confidence : 0;

    let synthesis: string;
    if (confidenceSpread < 15) {
      synthesis = `Agents converge (spread ${confidenceSpread}%): The consensus view is well-supported. Proceed with high confidence.`;
    } else if (confidenceSpread > 40) {
      synthesis = `Significant disagreement (spread ${confidenceSpread}%): The ${strongestView?.domain ?? 'leading'} view is stronger but the ${weakestView?.domain ?? 'dissenting'} perspective raises valid concerns. Recommend acknowledging both in synthesis.`;
    } else {
      synthesis = `Moderate tension (spread ${confidenceSpread}%): The primary analysis holds but should be tempered by the alternative perspective.`;
    }

    const triple: DialecticalTriple = {
      tripleId: `dial_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      topic: input.topic.slice(0, 200),
      thesis,
      antithesis,
      synthesis,
      confidence:
        sorted.length > 0
          ? Math.round(sorted.reduce((s, r) => s + r.confidence, 0) / sorted.length)
          : 50,
      timestamp: new Date().toISOString(),
    };

    this.triples.push(triple);
    if (this.triples.length > InnerMonologueEngine.MAX_TRIPLES) {
      this.triples.splice(0, this.triples.length - InnerMonologueEngine.MAX_TRIPLES);
    }

    this.think({
      type: 'dialectical',
      thought: `Dialectical analysis: ${synthesis}`,
      triggeringEvent: `Dialectical reasoning on: ${input.topic.slice(0, 80)}`,
      confidence: triple.confidence,
      relatedDomains: input.agentResponses.map((r) => r.domain),
    });

    return triple;
  }

  socraticSelfQuestion(claim: string, evidence: string): SocraticChain {
    const questions: SocraticChain['questions'] = [];
    const assumptions: string[] = [];

    questions.push({
      question: 'Why do I believe this?',
      answer:
        evidence.length > 50
          ? `Based on: ${evidence.slice(0, 200)}`
          : 'Limited evidence available — belief may be weakly grounded.',
      depth: 1,
    });

    questions.push({
      question: 'What evidence would contradict this?',
      answer: `If agent confidence were inverted, or if a domain expert challenged the premise of "${claim.slice(0, 60)}", this conclusion could be undermined.`,
      depth: 2,
    });

    questions.push({
      question: 'What am I assuming?',
      answer:
        'Assuming that agent confidence accurately reflects answer quality, that the training data is representative, and that no adversarial inputs are present.',
      depth: 3,
    });
    assumptions.push(
      'Agent confidence = answer quality',
      'Training data is representative',
      'No adversarial inputs',
    );

    questions.push({
      question: 'What would change my mind?',
      answer:
        "New evidence from a high-authority source contradicting the primary agent's analysis, or a pattern of recent failures in this domain.",
      depth: 4,
    });

    const conclusion =
      evidence.length > 100
        ? `Claim "${claim.slice(0, 60)}" appears reasonably grounded but rests on ${assumptions.length} key assumptions.`
        : `Claim "${claim.slice(0, 60)}" has weak evidentiary support — treat with caution.`;

    const chain: SocraticChain = {
      chainId: `socratic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      originalClaim: claim.slice(0, 300),
      questions,
      conclusion,
      assumptionsExposed: assumptions,
      timestamp: new Date().toISOString(),
    };

    this.chains.push(chain);
    if (this.chains.length > InnerMonologueEngine.MAX_CHAINS) {
      this.chains.splice(0, this.chains.length - InnerMonologueEngine.MAX_CHAINS);
    }

    this.think({
      type: 'socratic',
      thought: conclusion,
      triggeringEvent: `Socratic self-questioning on: "${claim.slice(0, 80)}"`,
      confidence: evidence.length > 100 ? 65 : 40,
    });

    return chain;
  }

  simulatePerspectives(topic: string, context: string): PerspectiveSimulation {
    const perspectives: PerspectiveSimulation['perspectives'] = [
      {
        viewpoint: 'user',
        argument: `The user needs a clear, actionable answer to "${topic.slice(0, 80)}". Speed and relevance matter most.`,
        priority: 'clarity and actionability',
      },
      {
        viewpoint: 'operator',
        argument: `System reliability and cost efficiency are paramount. Ensure the response doesn't overpromise or trigger unnecessary escalations.`,
        priority: 'reliability and cost control',
      },
      {
        viewpoint: 'adversary',
        argument: `An adversary would test: Can this response be manipulated? Does it leak sensitive information? Are there injection vectors?`,
        priority: 'security and resilience',
      },
      {
        viewpoint: 'regulator',
        argument: `From a compliance perspective: Is the response auditable? Does it respect data boundaries? Are disclaimers appropriate?`,
        priority: 'compliance and auditability',
      },
    ];

    const synthesis = `Multi-perspective analysis of "${topic.slice(0, 60)}": Balancing user need for clarity with operator cost constraints, adversarial resilience, and regulatory compliance. The response should be direct but auditable, with appropriate uncertainty flagging.`;

    const sim: PerspectiveSimulation = {
      simulationId: `persp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      topic: topic.slice(0, 200),
      perspectives,
      synthesis,
      timestamp: new Date().toISOString(),
    };

    this.perspectives.push(sim);
    if (this.perspectives.length > InnerMonologueEngine.MAX_PERSPECTIVES) {
      this.perspectives.splice(0, this.perspectives.length - InnerMonologueEngine.MAX_PERSPECTIVES);
    }

    return sim;
  }

  async llmIntrospect(context: {
    query: string;
    selectedDomains: string[];
    metacogState: { certainty: string; quality: string; confusionStreak: number };
    selfModelHealth: string;
    emotionalArousal: number;
  }): Promise<MonologueEntry> {
    if (!_llmIntrospector) {
      return this.preRoutingThought(
        context.query,
        context.selectedDomains.length,
        context.selectedDomains,
      );
    }

    try {
      const prompt = [
        'You are the inner monologue of an AI orchestration system. Generate a brief introspective thought (2-3 sentences) before routing this query.',
        `Query: "${context.query.slice(0, 200)}"`,
        `Domains selected: ${context.selectedDomains.join(', ')}`,
        `Metacognitive state: certainty=${context.metacogState.certainty}, quality=${context.metacogState.quality}, confusion_streak=${context.metacogState.confusionStreak}`,
        `Self-model health: ${context.selfModelHealth}`,
        `Emotional arousal: ${(context.emotionalArousal * 100).toFixed(0)}%`,
        'Reflect on: Am I routing correctly? What could go wrong? What should I pay attention to? Be honest about uncertainty.',
      ].join('\n');

      const thought = await _llmIntrospector(prompt);
      return this.think({
        type: 'pre_routing',
        thought: thought.slice(0, 500),
        triggeringEvent: `LLM introspection before routing: "${context.query.slice(0, 80)}"`,
        confidence: 70,
        relatedDomains: context.selectedDomains,
        ...(context.metacogState.confusionStreak > 1 ? { suggestedAction: 'Review routing decision carefully' } : {}),
      });
    } catch {
      return this.preRoutingThought(
        context.query,
        context.selectedDomains.length,
        context.selectedDomains,
      );
    }
  }

  recordStrategyShift(from: string, to: string, reason: string): MonologueEntry {
    return this.think({
      type: 'strategy_shift',
      thought: `Shifting strategy from "${from}" to "${to}": ${reason}`,
      triggeringEvent: reason,
      confidence: 65,
      suggestedAction: to,
    });
  }

  getState(): InnerMonologueState {
    const recent = this.entries.slice(-20);
    const tones = recent.map((e) => e.emotionalTone);
    const pos = tones.filter((t) => t === 'positive').length;
    const neg = tones.filter((t) => t === 'negative').length;

    let dominantTone: MonologueEntry['emotionalTone'] = 'neutral';
    if (pos > neg && pos > tones.length * 0.4) dominantTone = 'positive';
    else if (neg > pos && neg > tones.length * 0.4) dominantTone = 'negative';
    else if (pos > 0 && neg > 0) dominantTone = 'mixed';

    const elapsedMinutes = Math.max(1, (Date.now() - this.sessionStartTime) / 60000);

    return {
      recentThoughts: this.entries.slice(-15).reverse(),
      dominantTone,
      thoughtFrequency: this.entries.length / elapsedMinutes,
      reflectionDepth: this.entries.filter(
        (e) => e.type === 'reflection' || e.type === 'realization',
      ).length,
      totalEntries: this.entries.length,
      dialecticalTriples: this.triples.slice(-5).reverse(),
      socraticChains: this.chains.slice(-3).reverse(),
      perspectiveSimulations: this.perspectives.slice(-3).reverse(),
    };
  }

  buildMonologueContext(limit = 5): string {
    const recent = this.entries.slice(-limit).reverse();
    if (recent.length === 0) return '';

    const lines = [
      `## Inner Monologue (recent ${recent.length} thoughts)`,
      ...recent.map((e) => {
        const icon =
          e.emotionalTone === 'positive' ? '✓' : e.emotionalTone === 'negative' ? '⚠' : '○';
        return `${icon} [${e.type}] ${e.thought.slice(0, 200)}`;
      }),
    ];

    if (this.triples.length > 0) {
      const latest = this.triples[this.triples.length - 1]!;
      lines.push(`Dialectical: ${latest.synthesis.slice(0, 150)}`);
    }

    return lines.join('\n');
  }
}

export const innerMonologue = new InnerMonologueEngine();
