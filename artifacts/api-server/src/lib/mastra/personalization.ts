import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface UserProfile {
  userId: string;
  communicationStyle: "technical" | "executive" | "detailed" | "concise" | "balanced";
  expertiseDomains: string[];
  preferredResponseLength: "brief" | "standard" | "comprehensive";
  proactiveSuggestionsEnabled: boolean;
  autonomyLevel: "minimal" | "moderate" | "high";
  queryPatterns: string[];
  feedbackHistory: FeedbackSignal[];
  createdAt: string;
  updatedAt: string;
  interactionCount: number;
}

export interface FeedbackSignal {
  runId: string;
  signalType: "positive" | "negative" | "neutral";
  dimension: "length" | "detail" | "tone" | "relevance" | "speed";
  value: number;
  timestamp: string;
}

export interface PersonalizationContext {
  styleInstruction: string;
  lengthInstruction: string;
  domainContext: string;
  autonomyInstruction: string;
  proactiveHints: string[];
}

const DEFAULT_PROFILE: Omit<UserProfile, "userId" | "createdAt" | "updatedAt"> = {
  communicationStyle: "balanced",
  expertiseDomains: [],
  preferredResponseLength: "standard",
  proactiveSuggestionsEnabled: true,
  autonomyLevel: "moderate",
  queryPatterns: [],
  feedbackHistory: [],
  interactionCount: 0,
};

export async function ensurePersonalizationTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interaction_profiles (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        communication_style TEXT NOT NULL DEFAULT 'balanced',
        expertise_domains JSONB DEFAULT '[]',
        preferred_response_length TEXT NOT NULL DEFAULT 'standard',
        proactive_suggestions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        autonomy_level TEXT NOT NULL DEFAULT 'moderate',
        query_patterns JSONB DEFAULT '[]',
        feedback_history JSONB DEFAULT '[]',
        interaction_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    logger.info("Personalization tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure personalization tables");
  }
}

export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  try {
    const existing = await pool.query(
      "SELECT * FROM user_interaction_profiles WHERE user_id = $1",
      [userId]
    );

    if (existing.rows.length > 0) {
      const r = existing.rows[0];
      return {
        userId: r.user_id,
        communicationStyle: r.communication_style,
        expertiseDomains: r.expertise_domains || [],
        preferredResponseLength: r.preferred_response_length,
        proactiveSuggestionsEnabled: r.proactive_suggestions_enabled,
        autonomyLevel: r.autonomy_level,
        queryPatterns: r.query_patterns || [],
        feedbackHistory: r.feedback_history || [],
        interactionCount: r.interaction_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }

    await pool.query(
      `INSERT INTO user_interaction_profiles
       (user_id, communication_style, expertise_domains, preferred_response_length, proactive_suggestions_enabled, autonomy_level, query_patterns, feedback_history, interaction_count, created_at, updated_at)
       VALUES ($1, 'balanced', '[]', 'standard', TRUE, 'moderate', '[]', '[]', 0, NOW(), NOW())`,
      [userId]
    );

    return {
      userId,
      ...DEFAULT_PROFILE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      userId,
      ...DEFAULT_PROFILE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export function buildPersonalizationContext(profile: UserProfile): PersonalizationContext {
  const styleInstruction = {
    technical: "Use precise technical terminology. Include implementation details, code examples when relevant, and deep technical depth.",
    executive: "Provide executive-level summaries. Lead with key insights, avoid technical jargon, focus on business impact and decisions.",
    detailed: "Be thorough and comprehensive. Include background context, nuance, supporting data, and actionable next steps.",
    concise: "Be brief and direct. Use bullet points. Lead with the answer. Skip preamble.",
    balanced: "Balance clarity with depth. Use clear language accessible to an informed professional.",
  }[profile.communicationStyle];

  const lengthInstruction = {
    brief: "Keep responses under 150 words unless more detail is essential.",
    standard: "Aim for 200-500 words as appropriate to the question.",
    comprehensive: "Provide full-length, detailed responses with complete coverage.",
  }[profile.preferredResponseLength];

  const domainContext = profile.expertiseDomains.length > 0
    ? `The user has expertise in: ${profile.expertiseDomains.join(", ")}. Calibrate explanations accordingly.`
    : "";

  const autonomyInstruction = {
    minimal: "Always ask for confirmation before suggesting actions. Prefer to present options rather than recommendations.",
    moderate: "Proactively recommend best practices. Flag concerns but also suggest specific next steps.",
    high: "Act decisively. Provide strong recommendations. The user trusts your judgment.",
  }[profile.autonomyLevel];

  const proactiveHints: string[] = [];
  if (profile.proactiveSuggestionsEnabled && profile.interactionCount > 3) {
    proactiveHints.push("Look for opportunities to surface relevant insights the user may not have asked for.");
    if (profile.expertiseDomains.length > 0) {
      proactiveHints.push(`Proactively connect this to ${profile.expertiseDomains[0]} insights when relevant.`);
    }
  }

  return { styleInstruction, lengthInstruction, domainContext, autonomyInstruction, proactiveHints };
}

export function buildPersonalizedSystemPrompt(
  basePrompt: string,
  personalization: PersonalizationContext
): string {
  const parts = [
    basePrompt,
    "\n\n[PERSONALIZATION]",
    personalization.styleInstruction,
    personalization.lengthInstruction,
    personalization.domainContext,
    personalization.autonomyInstruction,
    ...(personalization.proactiveHints.length > 0 ? personalization.proactiveHints : []),
  ].filter(Boolean);

  return parts.join("\n");
}

export async function recordInteraction(
  userId: string,
  query: string,
  domain: string
): Promise<void> {
  try {
    const pattern = query.slice(0, 80).replace(/['"]/g, "");
    await pool.query(
      `UPDATE user_interaction_profiles
       SET interaction_count = interaction_count + 1,
           query_patterns = (
             SELECT jsonb_agg(p) FROM (
               SELECT p FROM jsonb_array_elements_text(query_patterns || $2::jsonb) AS p
               LIMIT 50
             ) t
           ),
           expertise_domains = CASE
             WHEN NOT (expertise_domains @> $3::jsonb) AND $4 != 'general'
             THEN (expertise_domains || $3::jsonb)::jsonb
             ELSE expertise_domains
           END,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, JSON.stringify([pattern]), JSON.stringify([domain]), domain]
    );
  } catch {}
}

export async function recordFeedback(
  userId: string,
  feedback: Omit<FeedbackSignal, "timestamp">
): Promise<void> {
  try {
    const signal: FeedbackSignal = { ...feedback, timestamp: new Date().toISOString() };

    await pool.query(
      `UPDATE user_interaction_profiles
       SET feedback_history = (
         SELECT jsonb_agg(f) FROM (
           SELECT f FROM jsonb_array_elements(feedback_history || $2::jsonb) AS f
           LIMIT 100
         ) t
       ),
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, JSON.stringify([signal])]
    );

    await adaptProfileFromFeedback(userId, signal);
  } catch (err) {
    logger.error({ err }, "Failed to record feedback");
  }
}

async function adaptProfileFromFeedback(userId: string, signal: FeedbackSignal): Promise<void> {
  try {
    const profileResult = await pool.query(
      "SELECT feedback_history, communication_style, preferred_response_length FROM user_interaction_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileResult.rows.length === 0) return;
    const r = profileResult.rows[0];
    const history: FeedbackSignal[] = r.feedback_history || [];

    if (history.length < 5) return;

    const recentFeedback = history.slice(-10);
    const lengthSignals = recentFeedback.filter(f => f.dimension === "length");
    const avgLengthSentiment = lengthSignals.length > 0
      ? lengthSignals.reduce((s, f) => s + f.value * (f.signalType === "positive" ? 1 : f.signalType === "negative" ? -1 : 0), 0) / lengthSignals.length
      : 0;

    let newLength = r.preferred_response_length;
    if (avgLengthSentiment < -0.3 && r.preferred_response_length !== "brief") {
      newLength = r.preferred_response_length === "comprehensive" ? "standard" : "brief";
    } else if (avgLengthSentiment > 0.3 && r.preferred_response_length !== "comprehensive") {
      newLength = r.preferred_response_length === "brief" ? "standard" : "comprehensive";
    }

    if (newLength !== r.preferred_response_length) {
      await pool.query(
        "UPDATE user_interaction_profiles SET preferred_response_length = $2, updated_at = NOW() WHERE user_id = $1",
        [userId, newLength]
      );
    }
  } catch {}
}

export async function inferProfileFromHistory(
  userId: string,
  recentQueries: string[]
): Promise<Partial<UserProfile>> {
  if (recentQueries.length < 3) return {};

  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `Analyze these user queries and infer their communication preferences and expertise.
Respond with JSON:
{
  "communicationStyle": "technical"|"executive"|"detailed"|"concise"|"balanced",
  "expertiseDomains": ["domain1"],
  "preferredResponseLength": "brief"|"standard"|"comprehensive",
  "autonomyLevel": "minimal"|"moderate"|"high"
}`,
        },
        {
          role: "user",
          content: `User ID: ${userId}\nRecent queries:\n${recentQueries.slice(-10).map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
        },
      ],
      maxTokens: 200,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}

  return {};
}

export async function updateProfileFromInference(
  userId: string,
  inferred: Partial<UserProfile>
): Promise<void> {
  if (Object.keys(inferred).length === 0) return;

  const updates: string[] = [];
  const params: any[] = [userId];
  let idx = 2;

  if (inferred.communicationStyle) {
    updates.push(`communication_style = $${idx}`);
    params.push(inferred.communicationStyle);
    idx++;
  }
  if (inferred.preferredResponseLength) {
    updates.push(`preferred_response_length = $${idx}`);
    params.push(inferred.preferredResponseLength);
    idx++;
  }
  if (inferred.autonomyLevel) {
    updates.push(`autonomy_level = $${idx}`);
    params.push(inferred.autonomyLevel);
    idx++;
  }

  if (updates.length > 0) {
    updates.push("updated_at = NOW()");
    try {
      await pool.query(
        `UPDATE user_interaction_profiles SET ${updates.join(", ")} WHERE user_id = $1`,
        params
      );
    } catch {}
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const result = await pool.query(
      "SELECT * FROM user_interaction_profiles WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      userId: r.user_id, communicationStyle: r.communication_style,
      expertiseDomains: r.expertise_domains || [],
      preferredResponseLength: r.preferred_response_length,
      proactiveSuggestionsEnabled: r.proactive_suggestions_enabled,
      autonomyLevel: r.autonomy_level, queryPatterns: r.query_patterns || [],
      feedbackHistory: r.feedback_history || [],
      interactionCount: r.interaction_count,
      createdAt: r.created_at, updatedAt: r.updated_at,
    };
  } catch {
    return null;
  }
}
