/**
 * Control Tower Mesh Publisher
 *
 * Previously bridged domain simulation engines to the agentEventBus.
 * Simulation engine decommissioned — this module is now a no-op stub.
 * Retained to avoid breaking imports in index.ts.
 */

import { logger } from "./logger";

async function publishDomainSignals(): Promise<void> {
  // Simulation engine decommissioned — no signals to publish
  return;
}

export function startMeshPublisher(intervalMs = 30_000): () => void {
  logger.info({ intervalMs }, "[mesh-publisher] Control Tower mesh publisher disabled (simulation decommissioned)");

  const handle = setInterval(() => {
    publishDomainSignals().catch(err =>
      logger.warn({ err }, "[mesh-publisher] periodic publish failed"),
    );
  }, intervalMs);

  return () => {
    clearInterval(handle);
    logger.info("[mesh-publisher] Control Tower mesh publisher stopped");
  };
}

export function getMeshPublisherStats(): { publishedTotal: number; uniqueSeenIds: number } {
  return { publishedTotal: 0, uniqueSeenIds: 0 };
}
