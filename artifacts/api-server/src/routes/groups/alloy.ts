import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { optionalIdempotencyMiddleware } from "../../middlewares/idempotency";
import { tenantScope } from "../../middlewares/tenant-scope";
import alloyRouter from "../alloy";
import alloyChatRouter from "../alloy-chat";
import alloyEmailRouter from "../alloy-email";
import alloyMeetingsRouter from "../alloy-meetings";
import alloyDigestRouter from "../alloy-digest";
import alloyIntegrationsRouter from "../alloy-integrations";
import alloyVoiceRouter from "../alloy-voice";
import alloyCognitiveLearningRouter from "../alloy-cognitive-learning";
import alloyGovernanceRouter from "../alloy-governance";
import alloySkillsRouter from "../alloy-skills";
import { alloyResearchRouter } from "../alloy-research";
import alloyChannelsRouter from "../alloy-channels";
import governanceRouter from "../governance";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/alloy", tenantScope({ required: true }));
  router.use("/governance", tenantScope({ required: true }));

  router.use("/alloy", _readLimiter);
  router.use("/alloy/ingest", optionalIdempotencyMiddleware);
  router.use("/alloy/workflows", _writeLimiter);
  router.use("/alloy/workflows", optionalIdempotencyMiddleware);
  router.use(alloyRouter);

  router.use(alloyChatRouter);

  router.use("/alloy/channels", _writeLimiter);
  router.use(alloyChannelsRouter);

  router.use("/alloy/email", _writeLimiter);
  router.use(alloyEmailRouter);

  router.use("/alloy/meetings", _writeLimiter);
  router.use(alloyMeetingsRouter);

  router.use("/alloy/digest", _readLimiter);
  router.use(alloyDigestRouter);

  router.use("/alloy/integrations", _writeLimiter);
  router.use(alloyIntegrationsRouter);

  router.use("/alloy/voice", _writeLimiter);
  router.use(alloyVoiceRouter);

  router.use("/alloy/cognitive", _readLimiter);
  router.use("/alloy/cognitive", _writeLimiter);
  router.use(alloyCognitiveLearningRouter);

  router.use("/governance", _writeLimiter);
  router.use("/governance", governanceRouter);

  router.use("/alloy/policies", _writeLimiter);
  router.use("/alloy/governance", _writeLimiter);
  router.use("/alloy/usage", _writeLimiter);
  router.use("/alloy/admin", _readLimiter);
  router.use(alloyGovernanceRouter);

  router.use("/alloy/skills", _readLimiter);
  router.use("/alloy/agents", _readLimiter);
  router.use("/alloy/performance", _readLimiter);
  router.use("/alloy/self-improvement", _readLimiter);
  router.use("/alloy/self-improvement", _writeLimiter);
  router.use("/alloy/decisions", _writeLimiter);
  router.use(alloySkillsRouter);

  router.use("/alloy/research", _writeLimiter);
  router.use("/alloy/browser", _writeLimiter);
  router.use(alloyResearchRouter);
}
