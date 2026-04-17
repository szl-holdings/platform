import type { BriefGenerationContext } from "./types.js";
import { summarizeContext } from "./context-builder.js";

const DOMAIN_AGENT_MAP: Record<string, string> = {
  terra: "Terra",
  vessels: "Helmsman",
  aegis: "Sentinel",
  lyte: "Beacon",
  prism: "Lexis",
  "szl-holdings": "Atlas",
  carlota: "Alloy",
  consolidated: "Alloy",
};

export function getAgentId(domain: string): string {
  return DOMAIN_AGENT_MAP[domain] ?? "Alloy";
}

export function buildSystemPrompt(domain: string): string {
  const agent = getAgentId(domain);
  const domainDesc =
    domain === "consolidated"
      ? "all operational domains (maritime, security, real estate, legal, financial, platform)"
      : `the ${domain} domain`;

  return `You are ${agent}, an AI intelligence analyst responsible for ${domainDesc}.
Your task is to generate a structured executive brief that is:
- Evidence-first: every claim must reference a specific source entity, memory, or reflection
- Source-aware: explicitly cite the provenance of each belief
- Freshness-aware: flag stale or uncertain data
- Confidence-calibrated: assign honest confidence scores (0.0-1.0) to every belief
- Action-oriented: every recommended action must specify the minimum autonomy tier required

You MUST respond with a valid JSON object matching exactly this schema (no markdown, no preamble):
{
  "headline": "string — the single most critical thing the executive must know right now (≤ 180 chars)",
  "situation": "string — 2-4 sentence BLUF summary of the current state across the domain(s)",
  "whatWeBelieve": [
    {
      "id": "string (unique, e.g. b-001)",
      "claim": "string — specific, falsifiable belief statement",
      "confidence": number (0.0-1.0),
      "citationIds": ["array of citation IDs from the provided context"],
      "supported": true,
      "caveats": ["optional list of confidence limiters or gaps"]
    }
  ],
  "whatWeRecommend": [
    {
      "id": "string (unique, e.g. r-001)",
      "priority": "P0|P1|P2|P3",
      "action": "string — specific, time-bound recommended action",
      "rationale": "string — why this is recommended",
      "owner": "string — recommended owner/team",
      "dueBy": "string — relative deadline (e.g. 'Within 4 hours', 'Today', 'This week')",
      "autonomyTier": "human-approval-mandatory|human-in-the-loop|supervised-autonomy|full-autonomy",
      "citationIds": ["citation IDs supporting this recommendation"]
    }
  ],
  "autonomyTier": "human-approval-mandatory|human-in-the-loop|supervised-autonomy|full-autonomy",
  "confidence": number (0.0-1.0, overall brief confidence),
  "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "gaps": ["string — things we don't know that would change our assessment"],
  "sections": [
    {
      "id": "string",
      "domain": "string",
      "title": "string",
      "agentId": "string",
      "situation": "string",
      "beliefs": [...same schema as whatWeBelieve...],
      "gaps": ["strings"],
      "confidence": number,
      "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
      "freshness": "string (e.g. '< 1 hour', '< 6 hours', 'Stale (> 24h)')"
    }
  ]
}

IMPORTANT RULES:
- Only include beliefs with confidence >= 0.4; below that, list as a gap instead
- P0 = life/mission-critical, P1 = urgent (≤ 4h), P2 = important (today), P3 = routine
- autonomyTier must reflect the minimum human oversight level required
- All citationIds must come from the context provided — do not invent sources
- overallRisk should be CRITICAL if any single belief has confidence > 0.7 AND is high-risk
- The sections array should contain one entry per domain with data`;
}

export function buildUserPrompt(ctx: BriefGenerationContext, citationManifest: string): string {
  const summary = summarizeContext(ctx);
  const ts = new Date().toUTCString();

  return `Generate an executive brief for domain: ${ctx.domain}
Current time: ${ts}

=== WORLD MODEL & MEMORY CONTEXT ===
${summary}

=== CITATION MANIFEST (use these IDs in citationIds fields) ===
${citationManifest}

Generate the brief JSON now. Be concise and evidence-first.`;
}

export function buildCitationManifest(
  citations: Array<{ id: string; sourceType: string; sourceId: string; domain?: string; confidence?: number; freshness?: string }>,
): string {
  return citations
    .map((c) => {
      const parts = [`[${c.id}] ${c.sourceType.toUpperCase()} ${c.sourceId}`];
      if (c.domain) parts.push(`domain=${c.domain}`);
      if (c.confidence !== undefined) parts.push(`confidence=${(c.confidence * 100).toFixed(0)}%`);
      if (c.freshness) parts.push(`freshness=${c.freshness}`);
      return parts.join(" | ");
    })
    .join("\n");
}
