import { domainEventBus } from "./index.js";
import { logger } from "../logger.js";
import { processSignalIntoWorkflow } from "../alloy-orchestration.js";

let initialized = false;

export function initializeAlloyDomainEventSubscriptions(): void {
  if (initialized) return;
  initialized = true;

  domainEventBus.subscribe("alloy.signal-ingested", async (payload) => {
    if (payload.severity === "critical" || payload.severity === "high") {
      logger.info({ signalId: payload.signalId, severity: payload.severity }, "Alloy: auto-promoting high/critical signal to workflow");
      try {
        await processSignalIntoWorkflow(payload.signalId, {
          workflowType: "investigation",
          priority: payload.severity === "critical" ? "critical" : "high",
          requiresApproval: true,
        });
      } catch (err) {
        logger.error({ err, signalId: payload.signalId }, "Alloy: failed to promote signal to workflow via domain event");
      }
    }
  });

  domainEventBus.subscribe("firestorm.incident-escalated", async (payload) => {
    logger.info({ incidentId: payload.incidentId, severity: payload.severity }, "Alloy: firestorm incident escalated — checking for workflow promotion");
  });

  domainEventBus.subscribe("lyte.incident-escalated", async (payload) => {
    logger.info({ incidentId: payload.incidentId, targetRole: payload.targetRole }, "Alloy: lyte incident escalated");
  });

  domainEventBus.subscribe("prism-counsel.deadline-approaching", async (payload) => {
    logger.info({ deadlineId: payload.deadlineId, matterId: payload.matterId, priority: payload.priority }, "Alloy: prism-counsel deadline approaching");
  });

  domainEventBus.subscribe("terra.deal-updated", (payload) => {
    logger.debug({ dealId: payload.dealId, stage: payload.stage }, "Alloy: terra deal stage updated");
  });

  logger.info("Alloy domain event subscriptions initialized");
}
