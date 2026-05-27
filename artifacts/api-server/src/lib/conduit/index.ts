import { registerSource, registerDestination } from './connector-registry';
import { postgresSource } from './sources/postgres-source';
import { internalApiSource } from './sources/internal-api-source';
import { unstructuredSource } from './sources/unstructured-source';
import { visualSource } from './sources/visual-source';
import { webhookDestination } from './destinations/webhook-destination';
import { slackDestination } from './destinations/slack-destination';
import { createStubDestination, STUB_DESTINATIONS } from './destinations/stub-destination';
import { startScheduler } from './cron-scheduler';
import { logger } from '../logger';

let initialized = false;

export function initConduitEngine(): void {
  if (initialized) return;
  initialized = true;

  registerSource(postgresSource);
  registerSource(internalApiSource);
  registerSource(unstructuredSource);
  registerSource(visualSource);

  registerDestination(webhookDestination);
  registerDestination(slackDestination);

  for (const dest of STUB_DESTINATIONS) {
    registerDestination(createStubDestination(dest));
  }

  startScheduler();

  logger.info('Conduit sync engine initialized — 4 sources (postgres, api_resource, unstructured, visual), 13 destinations registered');
}

export { getSource, getDestination, listSources, listDestinations } from './connector-registry';
export { executeSyncRun, retryFailedRow, isSyncRunning } from './sync-engine';
export { applyMappings } from './transform-engine';
export { startScheduler, stopScheduler } from './cron-scheduler';
export type { SourceConnector, DestinationConnector, ConnectionCheckResult } from './connector-protocol';
