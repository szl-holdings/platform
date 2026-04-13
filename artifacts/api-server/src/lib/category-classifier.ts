import type { ChatMessage } from "@szl-holdings/services";
import type { TaskCategory } from "./champion-registry";
import { logger } from "./logger";

interface CategorySignal {
  category: TaskCategory;
  score: number;
  signals: string[];
}

interface ClassificationResult {
  category: TaskCategory;
  confidence: number;
  scores: Record<TaskCategory, number>;
  signals: string[];
  isHighStakes: boolean;
  isSpeedCritical: boolean;
  requestsDeepAnalysis: boolean;
}

const CATEGORY_PATTERNS: Record<TaskCategory, { keywords: string[]; patterns: RegExp[]; weight: number }> = {
  writing: {
    weight: 1.0,
    keywords: [
      "write", "draft", "compose", "author", "essay", "article", "blog", "story",
      "narrative", "prose", "copy", "content", "email", "letter", "memo", "report",
      "document", "newsletter", "press release", "announcement", "tone", "voice",
      "rewrite", "edit", "proofread", "creative", "description", "summary",
    ],
    patterns: [
      /\b(write|draft|compose|author)\s+(a|an|the|some|my)\b/i,
      /\b(creative|long.form|short.form)\s+writing\b/i,
      /\b(blog\s*post|email\s*copy|marketing\s*copy)\b/i,
      /\b(tone|voice|style)\s+(of|for|that)\b/i,
    ],
  },
  research: {
    weight: 1.0,
    keywords: [
      "research", "investigate", "find out", "what is", "search", "look up",
      "gather", "compile", "survey", "literature", "sources", "citations",
      "multilingual", "real-time", "latest", "current", "news", "recent",
      "market research", "due diligence", "competitive analysis", "landscape",
    ],
    patterns: [
      /\b(research|investigate|find\s+out)\b/i,
      /\b(latest|current|recent|up.to.date)\s+(news|data|info|research)\b/i,
      /\b(market|competitive)\s+(research|landscape|analysis)\b/i,
      /\b(gather|compile|survey)\s+(data|info|sources)\b/i,
    ],
  },
  analysis: {
    weight: 1.2,
    keywords: [
      "analyze", "analysis", "assess", "evaluate", "reason", "reasoning",
      "compare", "contrast", "synthesize", "explain", "why", "how does",
      "diagnose", "debug", "review", "benchmark", "critique", "validate",
      "interpret", "infer", "deduce", "conclude", "insight", "implication",
      "risk", "trade-off", "pros and cons", "decision", "recommend",
    ],
    patterns: [
      /\b(analyze|assess|evaluate|review)\s+(this|the|my)\b/i,
      /\b(why|how|what)\s+(does|is|are|would|could)\b.*\?/i,
      /\b(pros\s+and\s+cons|trade.off|cost.benefit)\b/i,
      /\b(recommend|advise|suggest)\s+(a|an|the)\s+(strategy|approach|plan)\b/i,
    ],
  },
  coding: {
    weight: 1.1,
    keywords: [
      "code", "program", "function", "class", "method", "algorithm", "script",
      "implement", "build", "develop", "debug", "fix", "bug", "error",
      "typescript", "javascript", "python", "rust", "go", "java", "sql",
      "api", "endpoint", "database", "query", "refactor", "test", "deploy",
      "dockerfile", "ci/cd", "pipeline", "repo", "git", "pr", "pull request",
    ],
    patterns: [
      /\b(write|create|build|implement)\s+(a|an)?\s*(function|class|script|api|endpoint)\b/i,
      /\b(fix|debug|resolve)\s+(this|the|my)?\s*(bug|error|issue|problem)\b/i,
      /```[\w]*\n/,
      /\b(refactor|optimize|test)\s+(this|the|my)?\s*(code|function|component)\b/i,
    ],
  },
  speed: {
    weight: 0.9,
    keywords: [
      "quick", "fast", "brief", "short", "simple", "classify", "tag",
      "label", "summarize", "extract", "categorize", "identify", "flag",
      "batch", "bulk", "pipeline", "process", "filter", "sort", "rank",
    ],
    patterns: [
      /\b(quick|fast|briefly|concisely)\b/i,
      /\b(summarize|classify|categorize|tag)\s+(this|the|my)\b/i,
      /\b(one.line|one.sentence|tldr|tl;dr)\b/i,
    ],
  },
  image_gen: {
    weight: 1.0,
    keywords: [
      "image", "picture", "photo", "illustration", "artwork", "visual",
      "generate image", "create image", "draw", "render", "paint",
      "logo", "banner", "thumbnail", "poster", "design", "graphic",
      "photorealistic", "artistic", "cinematic", "style of",
    ],
    patterns: [
      /\b(generate|create|make|draw|render)\s+(a|an|the)?\s*(image|photo|picture|illustration)\b/i,
      /\b(photorealistic|cinematic|artistic)\s+(style|render|image)\b/i,
      /\bstyle\s+of\s+[a-z]+/i,
    ],
  },
  multimodal: {
    weight: 1.0,
    keywords: [
      "image", "screenshot", "diagram", "chart", "table", "video", "audio",
      "describe this", "what do you see", "analyze this image", "read this",
      "extract from image", "ocr", "vision", "look at", "attached",
    ],
    patterns: [
      /\b(describe|analyze|read|extract)\s+(this|the)?\s*(image|photo|screenshot|diagram)\b/i,
      /\b(what|how)\s+(do|does|is|are)\s+(you|this|it)\s+(see|show|depict)\b/i,
    ],
  },
};

const HIGH_STAKES_PATTERNS = [
  /\b(legal|compliance|regulatory|audit|contract|liability)\b/i,
  /\b(financial|investment|risk|critical|production|security)\b/i,
  /\b(delete|remove|terminate|modify|deploy|release)\b/i,
];

const DEEP_ANALYSIS_PATTERNS = [
  /\b(deep\s+analysis|thorough\s+analysis|comprehensive\s+analysis)\b/i,
  /\b(detailed\s+breakdown|in.depth\s+review)\b/i,
  /\b(fusion|synthesize\s+multiple|cross.validate)\b/i,
];

const SPEED_CRITICAL_PATTERNS = [
  /\b(asap|urgent|immediately|right\s+away|quickly)\b/i,
  /\b(real.time|live|streaming|sub.second)\b/i,
];

function extractText(messages: ChatMessage[]): string {
  return messages
    .filter(m => m.role === "user" || m.role === "system")
    .map(m => m.content)
    .join(" ")
    .toLowerCase();
}

function scoreCategory(text: string, category: TaskCategory): { score: number; signals: string[] } {
  const config = CATEGORY_PATTERNS[category];
  let score = 0;
  const signals: string[] = [];

  for (const kw of config.keywords) {
    if (text.includes(kw)) {
      score += 1 * config.weight;
      signals.push(`keyword:${kw}`);
    }
  }

  for (const pattern of config.patterns) {
    if (pattern.test(text)) {
      score += 2.5 * config.weight;
      signals.push(`pattern:${pattern.source.slice(0, 40)}`);
    }
  }

  return { score, signals };
}

export function classifyTaskCategory(
  messages: ChatMessage[],
  hint?: TaskCategory
): ClassificationResult {
  if (hint) {
    return {
      category: hint,
      confidence: 1.0,
      scores: {} as Record<TaskCategory, number>,
      signals: [`explicit-hint:${hint}`],
      isHighStakes: false,
      isSpeedCritical: false,
      requestsDeepAnalysis: false,
    };
  }

  const text = extractText(messages);
  const allCategories: TaskCategory[] = ["writing", "research", "analysis", "coding", "speed", "image_gen", "multimodal"];

  const categoryScores: CategorySignal[] = allCategories.map(cat => {
    const { score, signals } = scoreCategory(text, cat);
    return { category: cat, score, signals };
  });

  const isHighStakes = HIGH_STAKES_PATTERNS.some(p => p.test(text));
  const requestsDeepAnalysis = DEEP_ANALYSIS_PATTERNS.some(p => p.test(text));
  const isSpeedCritical = SPEED_CRITICAL_PATTERNS.some(p => p.test(text));

  categoryScores.sort((a, b) => b.score - a.score);
  const best = categoryScores[0]!;
  const second = categoryScores[1];

  const totalScore = categoryScores.reduce((s, c) => s + c.score, 0);
  const confidence = totalScore > 0
    ? parseFloat(Math.min(0.98, best.score / totalScore + 0.1).toFixed(3))
    : 0.5;

  const winningCategory: TaskCategory = best.score > 0 ? best.category : "analysis";

  const allSignals = best.signals.slice(0, 5);
  if (isHighStakes) allSignals.push("high-stakes-domain");
  if (requestsDeepAnalysis) allSignals.push("deep-analysis-requested");
  if (isSpeedCritical) allSignals.push("speed-critical");

  const scores = {} as Record<TaskCategory, number>;
  for (const s of categoryScores) {
    scores[s.category] = parseFloat(s.score.toFixed(2));
  }

  logger.debug({ category: winningCategory, confidence, signals: allSignals }, "Task category classified");

  return {
    category: winningCategory,
    confidence,
    scores,
    signals: allSignals,
    isHighStakes,
    isSpeedCritical,
    requestsDeepAnalysis,
  };
}

export function shouldUseFusion(classification: ClassificationResult, riskLevel?: string): boolean {
  if (classification.requestsDeepAnalysis) return true;
  if (riskLevel === "critical" || riskLevel === "high") return true;
  if (classification.isHighStakes && classification.confidence < 0.7) return true;
  return false;
}

export function selectCostMode(
  classification: ClassificationResult,
  strategy?: string
): "quality" | "balanced" | "budget" {
  if (strategy === "cheapest" || classification.isSpeedCritical) return "budget";
  if (classification.isHighStakes || classification.requestsDeepAnalysis) return "quality";
  return "balanced";
}
