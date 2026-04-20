/**
 * Training Data Export Pipeline
 *
 * Pulls from agentTrainingPairs, agentFeedback, advisoryAudit, and alloyAgentCorrections tables.
 * Formats into OpenAI JSONL (chat format) or HuggingFace dataset JSON.
 * Includes domain tagging so data can be sliced per agent.
 */

import {
  advisoryAudit,
  agentFeedback,
  agentTrainingPairs,
  alloyAgentCorrections,
  db,
} from '@szl-holdings/db';
import { and, desc, eq, gte } from 'drizzle-orm';

export type ExportFormat = 'openai-jsonl' | 'huggingface-json';

export interface OpenAITrainingSample {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

export interface HuggingFaceSample {
  instruction: string;
  input: string;
  output: string;
  domain: string;
  agentId: string;
  source: string;
  quality: number;
}

export interface DatasetExportResult {
  format: ExportFormat;
  agentId: string;
  version: string;
  samples: OpenAITrainingSample[] | HuggingFaceSample[];
  sampleCount: number;
  sourceBreakdown: {
    trainingPairs: number;
    positiveFeedback: number;
    advisoryAudit: number;
    agentCorrections: number;
  };
  exportedAt: string;
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  helmsman:
    'You are Helmsman, the maritime intelligence agent. You specialize in fleet operations, AIS tracking, maritime security, route risk assessment, and sanctions compliance.',
  sentinel:
    'You are Sentinel, the cybersecurity intelligence agent. You specialize in threat analysis, CVE assessment, incident response, and security posture evaluation.',
  inca: 'You are INCA, the AI research intelligence agent. You specialize in AI/ML research, model evaluation, academic literature analysis, and technology trend assessment.',
  muse: 'You are Muse, the creative intelligence agent. You specialize in content strategy, campaign ideation, creative briefs, and brand voice.',
  beacon:
    'You are Terra Analytics, the analytics and operations intelligence agent. You specialize in signal analysis, anomaly detection, platform performance, and operational intelligence.',
  zeus: 'You are Zeus, the infrastructure intelligence agent. You specialize in cloud infrastructure, DevOps, system reliability, and platform architecture.',
  compass:
    'You are Compass, the readiness assessment agent. You specialize in organizational maturity evaluation, gap analysis, capability scoring, and improvement roadmaps.',
  alloy:
    'You are Alloy, the central orchestration intelligence. You coordinate specialized domain agents, aggregate their insights, and provide unified intelligence.',
};

function getSystemPrompt(agentId: string): string {
  return AGENT_SYSTEM_PROMPTS[agentId] ?? `You are an AI assistant for the ${agentId} domain.`;
}

function generateVersion(agentId: string): string {
  const date = new Date().toISOString().split('T')[0]!.replace(/-/g, '');
  return `${agentId}-${date}-v1`;
}

function deduplicateSamples<T extends { instruction?: string; messages?: unknown[] }>(
  samples: T[],
): T[] {
  const seen = new Set<string>();
  return samples.filter((s) => {
    const key = 'instruction' in s ? (s.instruction ?? '') : JSON.stringify(s.messages);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function exportTrainingData(
  agentId: string,
  format: ExportFormat = 'openai-jsonl',
  options?: {
    minRating?: number;
    since?: Date;
    maxSamples?: number;
  },
): Promise<DatasetExportResult> {
  const minRating = options?.minRating ?? 4;
  const maxSamples = options?.maxSamples ?? 5000;
  const systemPrompt = getSystemPrompt(agentId);
  const version = generateVersion(agentId);

  const sourceBreakdown = {
    trainingPairs: 0,
    positiveFeedback: 0,
    advisoryAudit: 0,
    agentCorrections: 0,
  };

  const openaiSamples: OpenAITrainingSample[] = [];
  const hfSamples: HuggingFaceSample[] = [];

  const pairsQuery = db
    .select()
    .from(agentTrainingPairs)
    .where(and(eq(agentTrainingPairs.agentId, agentId), eq(agentTrainingPairs.isActive, true)))
    .orderBy(desc(agentTrainingPairs.createdAt))
    .limit(Math.floor(maxSamples * 0.5));

  const pairs = await pairsQuery;
  sourceBreakdown.trainingPairs = pairs.length;

  for (const pair of pairs) {
    if (format === 'openai-jsonl') {
      openaiSamples.push({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: pair.question },
          { role: 'assistant', content: pair.answer },
        ],
      });
    } else {
      hfSamples.push({
        instruction: systemPrompt,
        input: pair.question,
        output: pair.answer,
        domain: pair.category ?? 'general',
        agentId,
        source: 'training_pairs',
        quality: 1.0,
      });
    }
  }

  const feedbackConditions = [
    eq(agentFeedback.agentId, agentId),
    ...(options?.since ? [gte(agentFeedback.createdAt, options.since)] : []),
  ];

  const feedback = await db
    .select()
    .from(agentFeedback)
    .where(and(...feedbackConditions))
    .orderBy(desc(agentFeedback.createdAt))
    .limit(Math.floor(maxSamples * 0.3));

  const positiveFeedback = feedback.filter(
    (f) =>
      f.rating >= minRating &&
      f.messageContent &&
      f.responseContent &&
      f.messageContent.length > 10 &&
      f.responseContent.length > 20,
  );
  sourceBreakdown.positiveFeedback = positiveFeedback.length;

  for (const fb of positiveFeedback) {
    if (!fb.messageContent || !fb.responseContent) continue;
    if (format === 'openai-jsonl') {
      openaiSamples.push({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fb.messageContent },
          { role: 'assistant', content: fb.responseContent },
        ],
      });
    } else {
      hfSamples.push({
        instruction: systemPrompt,
        input: fb.messageContent,
        output: fb.responseContent,
        domain: agentId,
        agentId,
        source: 'feedback',
        quality: fb.rating / 5,
      });
    }
  }

  const auditConditions = [
    eq(advisoryAudit.agentId, agentId),
    eq(advisoryAudit.status, 'actioned'),
  ];

  const audits = await db
    .select()
    .from(advisoryAudit)
    .where(and(...auditConditions))
    .orderBy(desc(advisoryAudit.createdAt))
    .limit(Math.floor(maxSamples * 0.1));

  sourceBreakdown.advisoryAudit = audits.length;

  for (const audit of audits) {
    const userMsg = `Advisory request: ${audit.title}\n${audit.description}`;
    const assistantMsg = audit.runbook
      ? `${audit.title}\n\nRisk Level: ${audit.riskLevel}\nRecommendation Type: ${audit.recommendationType}\n\nRunbook:\n${audit.runbook}`
      : `${audit.title}\n\nRisk Level: ${audit.riskLevel}\nRecommendation Type: ${audit.recommendationType}\n\n${audit.description}`;

    if (format === 'openai-jsonl') {
      openaiSamples.push({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
          { role: 'assistant', content: assistantMsg },
        ],
      });
    } else {
      hfSamples.push({
        instruction: systemPrompt,
        input: userMsg,
        output: assistantMsg,
        domain: audit.recommendationType,
        agentId,
        source: 'advisory_audit',
        quality: 0.9,
      });
    }
  }

  try {
    const corrections = await db
      .select()
      .from(alloyAgentCorrections)
      .where(eq(alloyAgentCorrections.sourceAgentId, agentId))
      .orderBy(desc(alloyAgentCorrections.createdAt))
      .limit(Math.floor(maxSamples * 0.1));

    const validCorrections = corrections.filter(
      (c) =>
        c.validationStatus !== 'REJECTED' &&
        c.correctedOutput &&
        c.originalOutput &&
        c.correctedOutput.length > 20,
    );
    sourceBreakdown.agentCorrections = validCorrections.length;

    for (const corr of validCorrections) {
      if (!corr.originalOutput || !corr.correctedOutput) continue;
      const inputMsg = corr.originalOutput.slice(0, 500);
      if (format === 'openai-jsonl') {
        openaiSamples.push({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: inputMsg },
            { role: 'assistant', content: corr.correctedOutput },
          ],
        });
      } else {
        hfSamples.push({
          instruction: systemPrompt,
          input: inputMsg,
          output: corr.correctedOutput,
          domain: agentId,
          agentId,
          source: 'agent_corrections',
          quality: 0.85,
        });
      }
    }
  } catch {
    // alloyAgentCorrections may not be populated — skip
  }

  const rawSamples = format === 'openai-jsonl' ? openaiSamples : hfSamples;
  const deduplicated = deduplicateSamples(
    rawSamples as Array<{ instruction?: string; messages?: unknown[] }>,
  );
  const finalSamples = deduplicated.slice(0, maxSamples);

  return {
    format,
    agentId,
    version,
    samples: finalSamples as OpenAITrainingSample[] | HuggingFaceSample[],
    sampleCount: finalSamples.length,
    sourceBreakdown,
    exportedAt: new Date().toISOString(),
  };
}

export function serializeToJSONL(samples: OpenAITrainingSample[]): string {
  return samples.map((s) => JSON.stringify(s)).join('\n');
}

export function serializeToHuggingFaceJSON(samples: HuggingFaceSample[]): string {
  return JSON.stringify(samples, null, 2);
}
