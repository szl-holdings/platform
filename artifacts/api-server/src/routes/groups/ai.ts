import type { IRouter } from 'express';
import { lazyMatch, lazyMount, lazyRegisterMatch } from '../../lib/lazy-router';
import { aiControlPlane } from '../../middlewares/ai-control-plane';
import { idempotencyMiddleware } from '../../middlewares/idempotency';
import {
  aiInferenceSlidingLimiter,
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { aiInferenceLimiter } from '../../middlewares/rate-limiters';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;
// Stricter limiter for endpoints that invoke AI model inference. Applied in
// addition to the general read limiter to prevent runaway token spend.
const _aiInferenceLimiter = aiInferenceLimiter;
const _aiInferenceSlidingLimiter = aiInferenceSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/ai', tenantScope({ required: true }));
  router.use('/copilot', tenantScope({ required: true }));
  router.use('/mcp', tenantScope({ required: true }));
  router.use('/nuro-mesh', tenantScope({ required: true }));
  router.use('/control-tower', tenantScope({ required: true }));
  router.use('/domain-agents', tenantScope({ required: true }));
  router.use('/agent-os', tenantScope({ required: true }));
  router.use('/agent-training', tenantScope({ required: true }));
  router.use('/agent-autonomy', tenantScope({ required: true }));
  router.use('/federation', tenantScope({ required: true }));
  router.use('/fine-tuning', tenantScope({ required: true }));
  router.use('/ml', tenantScope({ required: true }));
  router.use('/ontology', tenantScope({ required: true }));
  router.use('/digital-twins', tenantScope({ required: true }));
  router.use('/fusion', tenantScope({ required: true }));
  router.use('/knowledge', tenantScope({ required: true }));
  router.use('/ai-safety', tenantScope({ required: true }));
  router.use('/forge', tenantScope({ required: true }));
  router.use('/rag', tenantScope({ required: true }));
  router.use('/stream', tenantScope({ required: true }));
  router.use('/connector-hub', tenantScope({ required: true }));
  router.use('/a2a', tenantScope({ required: true }));
  router.use('/jobs', tenantScope({ required: true }));
  router.use('/atlas/spatial', tenantScope({ required: true }));

  router.use('/ai', _readLimiter);
  // Stricter inference-specific limiters on model-invoking endpoints.
  // Applied before aiControlPlane so cost-gating sees the same throttled view.
  router.use('/ai/respond', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/ai/triage', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/ai/extract', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/ai/plan', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/ai/tools/execute', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/ai/evals/run', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/ai/tools/execute', idempotencyMiddleware);
  router.use(
    '/ai/respond',
    aiControlPlane({ policyRouteClass: 'reasoning', costRouteClass: 'respond' }),
  );
  router.use(
    '/ai/triage',
    aiControlPlane({ policyRouteClass: 'triage', costRouteClass: 'triage' }),
  );
  router.use(
    '/ai/extract',
    aiControlPlane({ policyRouteClass: 'extraction', costRouteClass: 'extract' }),
  );
  router.use('/ai/plan', aiControlPlane({ policyRouteClass: 'planning', costRouteClass: 'plan' }));
  router.use('/ai/retrieve', aiControlPlane({ costRouteClass: 'retrieval' }));
  router.use(
    '/ai/retrieval',
    aiControlPlane({ policyRouteClass: 'classification', costRouteClass: 'retrieval_ingest' }),
  );
  router.use('/ai/tools/execute', aiControlPlane({ costRouteClass: 'tool_execution' }));
  router.use(
    '/ai/evals/run',
    aiControlPlane({ policyRouteClass: 'classification', costRouteClass: 'evals' }),
  );
  router.use(lazyMatch('/ai', () => import('../ai-engine'), 'ai-engine'));

  router.use('/ai/ops', _readLimiter);
  router.use(lazyMatch('/ai', () => import('../ai-ops-dashboard'), 'ai-ops-dashboard'));

  router.use('/copilot', _writeLimiter);
  router.use(lazyMatch('/copilot', () => import('../copilot'), 'copilot'));

  router.use('/mcp', _readLimiter);
  router.use(lazyMatch('/mcp', () => import('../mcp'), 'mcp'));

  router.use('/nuro-mesh', _readLimiter);
  router.use(lazyMatch('/nuro-mesh', () => import('../nuro-mesh'), 'nuro-mesh'));
  router.use(lazyMatch('/nuro-mesh', () => import('../nuro-mesh-advanced'), 'nuro-mesh-advanced'));

  router.use('/control-tower', _readLimiter);
  router.use('/control-tower', _writeLimiter);
  router.use(
    lazyRegisterMatch('/control-tower', () => import('../control-tower'), 'control-tower'),
  );

  router.use('/domain-agents', _readLimiter);
  router.use(lazyMatch('/domain-agents', () => import('../domain-agents/index'), 'domain-agents'));

  router.use('/agent-os', _readLimiter);
  router.use(lazyMatch('/agent-os', () => import('../agent-os'), 'agent-os'));

  router.use(lazyMatch('/agent-training', () => import('../agent-training'), 'agent-training'));

  router.use('/agent-autonomy', _readLimiter);
  router.use('/agent-autonomy', _writeLimiter);
  router.use(lazyMatch('/agent-autonomy', () => import('../agent-autonomy'), 'agent-autonomy'));

  router.use('/federation', _readLimiter);
  router.use(lazyMatch('/federation', () => import('../agent-federation'), 'agent-federation'));

  router.use('/fine-tuning', _readLimiter);
  router.use('/fine-tuning', _writeLimiter);
  router.use(lazyMatch('/fine-tuning', () => import('../fine-tuning'), 'fine-tuning'));

  router.use('/ml', _readLimiter);
  router.use('/ml', _writeLimiter);
  router.use(lazyMatch('/ml', () => import('../ml-pipeline'), 'ml-pipeline'));

  router.use(lazyMatch('/nuro-mesh', () => import('../consciousness'), 'consciousness'));

  router.use('/ontology', _readLimiter);
  router.use('/ontology', _writeLimiter);
  router.use(lazyMatch('/ontology', () => import('../ontology'), 'ontology'));

  router.use('/digital-twins', _readLimiter);
  router.use('/digital-twins', _writeLimiter);
  router.use(lazyMatch('/digital-twins', () => import('../digital-twins'), 'digital-twins'));

  router.use('/fusion', _readLimiter);
  router.use('/fusion', _writeLimiter);
  router.use(lazyMatch('/fusion', () => import('../fusion'), 'fusion'));

  router.use('/knowledge', _readLimiter);
  router.use('/knowledge', _writeLimiter);
  router.use(
    '/knowledge',
    lazyMount(() => import('../knowledge-graph'), 'knowledge-graph'),
  );

  router.use('/ai-safety', _readLimiter);
  router.use(lazyMatch('/ai-safety', () => import('../ai-safety'), 'ai-safety'));

  router.use('/forge', _readLimiter);
  router.use('/forge', _writeLimiter);
  router.use('/forge', _aiInferenceLimiter, _aiInferenceSlidingLimiter);
  router.use('/forge', aiControlPlane({ policyRouteClass: 'reasoning', costRouteClass: 'forge' }));
  router.use(lazyMatch('/forge', () => import('../forge'), 'forge'));

  router.use('/rag', _readLimiter);
  router.use(lazyMatch('/rag', () => import('../rag-knowledge'), 'rag-knowledge'));

  router.use('/stream', _readLimiter);
  router.use(lazyMatch('/stream', () => import('../streaming-ingestion'), 'streaming-ingestion'));

  router.use('/connector-hub', _readLimiter);
  router.use('/connector-hub', _writeLimiter);
  router.use(lazyMatch('/connector-hub', () => import('../connector-hub'), 'connector-hub'));

  router.use('/a2a', _readLimiter);
  router.use('/a2a', _writeLimiter);
  router.use(lazyMatch(['/.well-known', '/a2a'], () => import('../a2a'), 'a2a'));

  router.use('/jobs', _readLimiter);
  router.use(lazyMatch('/jobs', () => import('../jobs'), 'jobs'));

  router.use('/atlas/spatial', _readLimiter);
  router.use('/atlas/spatial', _writeLimiter);
  router.use(
    lazyMatch('/atlas/spatial', () => import('../atlas-spatial-runtime'), 'atlas-spatial-runtime'),
  );

  router.use('/ai/prompts', _readLimiter);
  router.use('/ai/prompts', _writeLimiter);
  router.use(lazyMatch('/ai', () => import('../prompt-registry'), 'prompt-registry'));

  router.use('/crew', tenantScope({ required: true }));
  router.use('/crew', _writeLimiter);
  router.use(lazyMatch('/crew', () => import('../multi-agent-crew'), 'multi-agent-crew'));

  router.use('/trust', tenantScope({ required: true }));
  router.use('/trust', _readLimiter);
  router.use('/trust', _writeLimiter);
  router.use(lazyMatch('/trust', () => import('../trust-score'), 'trust-score'));

  router.use('/voice', tenantScope({ required: true }));
  router.use('/voice', _readLimiter);
  router.use('/voice', _writeLimiter);
  router.use(lazyMatch('/voice', () => import('../multilingual-voice'), 'multilingual-voice'));

  router.use('/fine-tuned', tenantScope({ required: true }));
  router.use('/fine-tuned', _readLimiter);
  router.use(
    lazyMatch('/fine-tuned', () => import('../fine-tuned-routing'), 'fine-tuned-routing'),
  );

  router.use('/offline-sync', tenantScope({ required: true }));
  router.use('/offline-sync', _writeLimiter);
  router.use(
    lazyMatch('/offline-sync', () => import('../offline-sync'), 'offline-sync'),
  );
}
