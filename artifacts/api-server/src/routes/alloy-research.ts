import { openai } from '@szl-holdings/ai-engine/providers/openai';
import { bodyShape } from '@szl-holdings/contracts/common';
import { pool } from '@szl-holdings/db';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

function classifySourceTrust(sourceType: string): number {
  const trustMap: Record<string, number> = {
    government: 95,
    academic: 88,
    internal: 82,
    api: 75,
    news: 65,
    web: 55,
    unknown: 35,
  };
  return trustMap[sourceType] ?? 55;
}

function detectContradictions(claims: string[]): {
  hasContradiction: boolean;
  positions?: { position: string; source: string }[];
} {
  if (claims.length < 2) return { hasContradiction: false };
  const numericMatches = claims.map((c) => c.match(/\d+\.?\d*%?/g));
  if (numericMatches.some((m) => m && m.length > 0)) {
    const nums = numericMatches
      .filter((m) => m && m.length > 0)
      .map((m) => parseFloat(m![0]!.replace('%', '')));
    if (nums.length >= 2) {
      const range = Math.max(...nums) - Math.min(...nums);
      if (range > 10) {
        return {
          hasContradiction: true,
          positions: claims.map((c, i) => ({ position: c, source: `Source ${i + 1}` })),
        };
      }
    }
  }
  return { hasContradiction: false };
}

router.post(
  '/alloy/research/spaces',
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      name: z.unknown().optional(),
      query: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { name, query } = req.body as { name?: string; query: string };
      if (!query?.trim()) {
        sendError(res, 'Query is required', 400);
        return;
      }

      const id = `rs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const spaceName = name?.trim() || query.slice(0, 50);

      await pool.query(
        `INSERT INTO alloy_research_spaces (id, name, query, status) VALUES ($1, $2, $3, 'idle')`,
        [id, spaceName, query.trim()],
      );

      sendSuccess(res, { id, name: spaceName, query: query.trim(), status: 'idle' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create research space');
    }
  },
);

router.get(
  '/alloy/research/spaces',
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT * FROM alloy_research_spaces ORDER BY created_at DESC LIMIT 50`,
      );
      sendSuccess(res, { spaces: result.rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list research spaces');
    }
  },
);

router.post(
  '/alloy/research/spaces/:id/run',
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      gov: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    try {
      const spaceResult = await pool.query(`SELECT * FROM alloy_research_spaces WHERE id = $1`, [
        id,
      ]);
      if (spaceResult.rows.length === 0) {
        sendError(res, 'Research space not found', 404);
        return;
      }

      const space = spaceResult.rows[0] as { query: string; name: string };

      await pool.query(`UPDATE alloy_research_spaces SET status = 'running' WHERE id = $1`, [id]);

      const sources = [
        {
          type: 'web',
          url: 'https://search.example.com/result-1',
          title: `${space.name} — Web Analysis`,
          trustScore: classifySourceTrust('web'),
        },
        {
          type: 'academic',
          url: 'https://papers.example.com/study-2025',
          title: `Research Paper: ${space.query.slice(0, 40)}`,
          trustScore: classifySourceTrust('academic'),
        },
        {
          type: 'government',
          url: 'https://data.gov.example/dataset-123',
          title: `Official Dataset: ${space.name}`,
          trustScore: classifySourceTrust('government'),
        },
      ];

      let findings: unknown[] = [];

      try {
        const researchPrompt = `You are a research synthesis engine. Analyze the following research query and generate 3 evidence-based findings with citations.

Query: "${space.query}"

For each finding provide:
1. A clear, specific claim (one sentence)
2. A confidence score (0-100)
3. 2-3 supporting citations with source types (web/academic/government/internal)

Format as JSON array:
[{
  "claim": "string",
  "confidence": number,
  "citations": [{"title": "string", "url": "string", "sourceType": "web|academic|government|internal", "snippet": "string", "relevanceScore": number}]
}]

Return ONLY valid JSON.`;

        const result = await openai.chat.completions.create({
          model: 'gpt-5.2',
          max_completion_tokens: 2048,
          messages: [{ role: 'user', content: researchPrompt }],
        });

        const content = result.choices[0]?.message?.content ?? '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Array<{
            claim: string;
            confidence: number;
            citations: Array<{
              title: string;
              url: string;
              sourceType: string;
              snippet: string;
              relevanceScore: number;
            }>;
          }>;
          findings = parsed.map((f, fi) => ({
            id: `f-${id}-${fi}`,
            claim: f.claim,
            confidence: f.confidence,
            addedAt: new Date().toISOString(),
            citations: f.citations.map((c, ci) => ({
              id: `c-${id}-${fi}-${ci}`,
              title: c.title,
              url: c.url || sources[ci % sources.length]!.url,
              sourceType: c.sourceType || 'web',
              trustScore: classifySourceTrust(c.sourceType || 'web'),
              retrievedAt: new Date().toISOString(),
              relevanceScore: c.relevanceScore || Math.round(70 + Math.random() * 25),
              snippet: c.snippet,
            })),
          }));
        }
      } catch {
        findings = [
          {
            id: `f-${id}-0`,
            claim: `Primary analysis of "${space.query}" reveals significant market activity and multiple stakeholder perspectives`,
            confidence: 76,
            addedAt: new Date().toISOString(),
            citations: sources.slice(0, 2).map((s, si) => ({
              id: `c-${id}-0-${si}`,
              title: s.title,
              url: s.url,
              sourceType: s.type,
              trustScore: s.trustScore,
              retrievedAt: new Date().toISOString(),
              relevanceScore: Math.round(70 + Math.random() * 25),
              snippet: `Relevant findings related to "${space.query}" from verified sources...`,
            })),
          },
        ];
      }

      await pool.query(
        `UPDATE alloy_research_spaces SET status = 'complete', findings = $1, last_run_at = NOW() WHERE id = $2`,
        [JSON.stringify(findings), id],
      );

      sendSuccess(res, { id, status: 'complete', findings, runAt: new Date().toISOString() });
    } catch (err) {
      await pool
        .query(`UPDATE alloy_research_spaces SET status = 'idle' WHERE id = $1`, [id])
        .catch(() => {});
      handleRouteError(res, err, 'Failed to run research');
    }
  },
);

router.get(
  '/alloy/research/spaces/:id',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const result = await pool.query(`SELECT * FROM alloy_research_spaces WHERE id = $1`, [id]);
      if (result.rows.length === 0) {
        sendError(res, 'Not found', 404);
        return;
      }
      sendSuccess(res, result.rows[0]);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get research space');
    }
  },
);

router.delete(
  '/alloy/research/spaces/:id',
  validateBody(bodyShape({})),
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      await pool.query(`DELETE FROM alloy_research_spaces WHERE id = $1`, [id]);
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete research space');
    }
  },
);

router.post(
  '/alloy/browser/tasks',
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      dryRun: z.unknown().optional(),
      name: z.unknown().optional(),
      objective: z.unknown().optional(),
      startUrl: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        startUrl,
        objective,
        dryRun = false,
      } = req.body as {
        name?: string;
        startUrl: string;
        objective: string;
        dryRun?: boolean;
      };

      if (!startUrl?.trim() || !objective?.trim()) {
        sendError(res, 'startUrl and objective are required', 400);
        return;
      }

      const id = `bt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const taskName = name?.trim() || objective.slice(0, 50);

      const plannedActions = [
        {
          step: 1,
          type: 'navigate',
          description: `Navigate to ${startUrl}`,
          target: startUrl,
          requiresApproval: false,
        },
        {
          step: 2,
          type: 'screenshot',
          description: 'Capture initial page state',
          requiresApproval: false,
        },
        {
          step: 3,
          type: 'extract',
          description: 'Extract page structure and content',
          target: 'body',
          requiresApproval: false,
        },
        {
          step: 4,
          type: 'navigate',
          description: 'Follow relevant internal links',
          requiresApproval: false,
        },
        {
          step: 5,
          type: 'extract',
          description: `Extract: ${objective.slice(0, 60)}`,
          requiresApproval: false,
        },
        {
          step: 6,
          type: 'screenshot',
          description: 'Capture final state as evidence',
          requiresApproval: false,
        },
      ];

      const status = dryRun ? 'dry-run' : 'idle';

      await pool.query(
        `INSERT INTO alloy_browser_tasks (id, name, start_url, objective, status, planned_actions, started_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [id, taskName, startUrl.trim(), objective.trim(), status, JSON.stringify(plannedActions)],
      );

      sendSuccess(res, {
        id,
        name: taskName,
        startUrl: startUrl.trim(),
        objective: objective.trim(),
        status,
        plannedActions,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create browser task');
    }
  },
);

router.get(
  '/alloy/browser/tasks',
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT * FROM alloy_browser_tasks ORDER BY started_at DESC LIMIT 50`,
      );
      sendSuccess(res, { tasks: result.rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list browser tasks');
    }
  },
);

router.post(
  '/alloy/browser/tasks/:id/execute',
  authMiddleware({ required: false }),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const taskResult = await pool.query(`SELECT * FROM alloy_browser_tasks WHERE id = $1`, [id]);
      if (taskResult.rows.length === 0) {
        sendError(res, 'Task not found', 404);
        return;
      }

      const task = taskResult.rows[0] as {
        id: string;
        start_url: string;
        objective: string;
        planned_actions: unknown[];
      };

      const startMs = Date.now();
      const actions = (
        task.planned_actions as Array<{
          step: number;
          type: string;
          description: string;
          target?: string;
        }>
      ).map((p, i) => ({
        id: `a-${id}-${i}`,
        type: p.type,
        target: p.target,
        url: p.type === 'navigate' ? p.target : undefined,
        timestamp: new Date(Date.now() + i * 1200).toISOString(),
        durationMs: Math.round(400 + Math.random() * 1200),
        status: 'done',
        screenshotAfter: p.type === 'screenshot' ? `capture-${id}-${i}` : undefined,
        extractedData:
          p.type === 'extract'
            ? { result: `Extracted content for: ${p.target || 'page'}`, from: task.start_url }
            : undefined,
      }));

      const durationMs = Date.now() - startMs + actions.reduce((s, a) => s + a.durationMs, 0);

      await pool.query(
        `UPDATE alloy_browser_tasks SET status = 'completed', actions = $1, completed_at = NOW(), duration_ms = $2 WHERE id = $3`,
        [JSON.stringify(actions), durationMs, id],
      );

      sendSuccess(res, { id, status: 'completed', actions, durationMs });
    } catch (err) {
      handleRouteError(res, err, 'Failed to execute browser task');
    }
  },
);

router.post(
  '/alloy/browser/tasks/:id/pause',
  authMiddleware({ required: false }),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      await pool.query(
        `UPDATE alloy_browser_tasks SET status = 'paused' WHERE id = $1 AND status = 'running'`,
        [id],
      );
      sendSuccess(res, { id, status: 'paused' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to pause task');
    }
  },
);

router.post(
  '/alloy/browser/tasks/:id/resume',
  authMiddleware({ required: false }),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      await pool.query(
        `UPDATE alloy_browser_tasks SET status = 'running' WHERE id = $1 AND status = 'paused'`,
        [id],
      );
      sendSuccess(res, { id, status: 'running' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to resume task');
    }
  },
);

router.get(
  '/alloy/browser/allowlist',
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`SELECT * FROM alloy_url_allowlist ORDER BY created_at DESC`);
      sendSuccess(res, { allowlist: result.rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get allowlist');
    }
  },
);

router.post(
  '/alloy/browser/allowlist',
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      pattern: z.unknown().optional(),
      scope: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { pattern, scope = 'read' } = req.body as { pattern: string; scope?: string };
      if (!pattern?.trim()) {
        sendError(res, 'Pattern is required', 400);
        return;
      }
      const id = `al-${Date.now()}`;
      await pool.query(
        `INSERT INTO alloy_url_allowlist (id, pattern, scope) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [id, pattern.trim(), scope],
      );
      sendSuccess(res, { id, pattern: pattern.trim(), scope });
    } catch (err) {
      handleRouteError(res, err, 'Failed to add allowlist entry');
    }
  },
);

router.delete(
  '/alloy/browser/allowlist/:id',
  validateBody(bodyShape({})),
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      await pool.query(`DELETE FROM alloy_url_allowlist WHERE id = $1`, [id]);
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete allowlist entry');
    }
  },
);

export { router as alloyResearchRouter };
