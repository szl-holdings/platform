/**
 * Agent-to-Agent Correction Learning
 *
 * When Sentinel's maker-checker adjusts or rejects another agent's output,
 * the correction is stored as a training signal. Future queries from the
 * corrected agent will have relevant past corrections injected into the
 * system prompt.
 *
 * Also performs cross-agent knowledge distillation: when a correction is
 * stored, keyword overlap with other agents' domain configs is checked and
 * derived training pairs are generated for related agents.
 */
import { agentTrainingPairs, alloyAgentCorrections, auditLogsTable, db } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';

const logger = {
  warn: (_obj: Record<string, unknown>, _msg: string) => {},
};

export interface CorrectionRecord {
  sourceAgentId: string;
  validatorAgentId: string;
  originalOutput: string;
  correctedOutput: string;
  validationNotes?: string;
  validationStatus: 'APPROVED_WITH_NOTES' | 'REJECTED';
  query: string;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'is',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'and',
    'or',
    'but',
    'with',
  ]);
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 12);
}

async function performCrossAgentDistillation(
  sourceAgentId: string,
  correctedOutput: string,
  originalOutput: string,
  topicKeywords: string[],
): Promise<void> {
  try {
    const { DOMAIN_CURATOR_CONFIGS } = await import('../fine-tuning/domain-curators.js');

    const KEYWORD_OVERLAP_THRESHOLD = 2;

    for (const config of DOMAIN_CURATOR_CONFIGS) {
      if (config.agentId === sourceAgentId) continue;

      const overlapCount = topicKeywords.filter((kw) =>
        config.keywords.some(
          (domainKw) => kw.includes(domainKw.toLowerCase()) || domainKw.toLowerCase().includes(kw),
        ),
      ).length;

      if (overlapCount < KEYWORD_OVERLAP_THRESHOLD) continue;

      const syntheticQuestion = `Based on a correction from ${sourceAgentId} domain: ${originalOutput.slice(0, 400)}`;
      const syntheticAnswer = `Cross-domain insight (${config.domain}): ${correctedOutput.slice(0, 800)}`;

      await db
        .insert(agentTrainingPairs)
        .values({
          agentId: config.agentId,
          question: syntheticQuestion,
          answer: syntheticAnswer,
          category: 'cross_agent_distillation',
          isActive: true,
        })
        .onConflictDoNothing();

      // Persist source traceability to the audit log since agentTrainingPairs has no source column
      void db
        .insert(auditLogsTable)
        .values({
          actionType: 'fine_tuning.distillation.pair_created',
          entityType: 'agent_training_pair',
          entityId: config.agentId,
          payloadJson: {
            source: 'cross_agent_distillation',
            sourceAgentId,
            targetAgentId: config.agentId,
            domain: config.domain,
            overlapCount,
          } as Record<string, unknown>,
        })
        .catch(() => {});
    }
  } catch (err) {
    logger.warn({ err }, 'Cross-agent distillation failed — skipping');
  }
}

export async function storeCorrection(
  record: CorrectionRecord & { orgId?: number | null },
): Promise<void> {
  try {
    const keywords = extractKeywords(`${record.query} ${record.validationNotes ?? ''}`);
    await db.insert(alloyAgentCorrections).values({
      sourceAgentId: record.sourceAgentId,
      validatorAgentId: record.validatorAgentId,
      orgId: record.orgId ?? null,
      originalOutput: record.originalOutput.slice(0, 2000),
      correctedOutput: record.correctedOutput.slice(0, 2000),
      validationNotes: record.validationNotes?.slice(0, 1000) ?? null,
      validationStatus: record.validationStatus,
      topicKeywords: keywords,
    });

    if (
      record.validationStatus !== 'REJECTED' &&
      record.correctedOutput !== record.originalOutput
    ) {
      void performCrossAgentDistillation(
        record.sourceAgentId,
        record.correctedOutput,
        record.originalOutput,
        keywords,
      ).catch(() => {});
    }
  } catch (err) {
    logger.warn({ err }, 'storeCorrection DB write failed — correction not persisted');
  }
}

export async function getRelevantCorrections(
  agentId: string,
  query: string,
  limit = 3,
): Promise<string> {
  try {
    const keywords = extractKeywords(query);
    const recent = await db
      .select()
      .from(alloyAgentCorrections)
      .where(eq(alloyAgentCorrections.sourceAgentId, agentId))
      .orderBy(desc(alloyAgentCorrections.createdAt))
      .limit(30);

    const scored = recent
      .map((r) => {
        const overlap = keywords.filter((kw) => r.topicKeywords.includes(kw)).length;
        return { record: r, score: overlap };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (scored.length === 0) return '';

    const lines = scored.map(({ record: r }) => {
      const status = r.validationStatus === 'REJECTED' ? 'REJECTED' : 'REVISED';
      return `[Sentinel ${status}] ${r.validationNotes?.slice(0, 200) ?? 'Output required revision'}`;
    });

    return `## Past Sentinel Corrections for Similar Queries\nNote: These corrections were applied to your previous outputs on similar topics. Incorporate these lessons:\n${lines.join('\n')}`;
  } catch (err) {
    logger.warn(
      { err },
      'getRelevantCorrections DB read failed — returning empty correction context',
    );
    return '';
  }
}
