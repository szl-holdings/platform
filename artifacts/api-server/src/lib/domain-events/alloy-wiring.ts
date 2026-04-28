import { processSignalIntoWorkflow } from '../alloy-orchestration.js';
import { logger } from '../logger.js';
import { domainEventBus } from './index.js';

let initialized = false;

export function initializeAlloyDomainEventSubscriptions(): void {
  if (initialized) return;
  initialized = true;

  domainEventBus.subscribe('continuum.signal-ingested', async (payload) => {
    if (payload.severity === 'critical' || payload.severity === 'high') {
      logger.info(
        { signalId: payload.signalId, severity: payload.severity },
        'Continuum: auto-promoting high/critical signal to workflow',
      );
      try {
        await processSignalIntoWorkflow(payload.signalId, {
          workflowType: 'investigation',
          priority: payload.severity === 'critical' ? 'critical' : 'high',
          requiresApproval: true,
        });
      } catch (err) {
        logger.error(
          { err, signalId: payload.signalId },
          'Continuum: failed to promote signal to workflow via domain event',
        );
      }
    }
  });

  domainEventBus.subscribe('firestorm.incident-escalated', async (payload) => {
    logger.info(
      { incidentId: payload.incidentId, severity: payload.severity },
      'Continuum: firestorm incident escalated — checking for workflow promotion',
    );
  });

  domainEventBus.subscribe('lyte.incident-escalated', async (payload) => {
    logger.info(
      { incidentId: payload.incidentId, targetRole: payload.targetRole },
      'Continuum: lyte incident escalated',
    );
  });

  domainEventBus.subscribe('prism-counsel.deadline-approaching', async (payload) => {
    logger.info(
      { deadlineId: payload.deadlineId, matterId: payload.matterId, priority: payload.priority },
      'Continuum: prism-counsel deadline approaching',
    );
  });

  domainEventBus.subscribe('terra.deal-updated', (payload) => {
    logger.debug(
      { dealId: payload.dealId, stage: payload.stage },
      'Continuum: terra deal stage updated',
    );
  });

  logger.info('Continuum domain event subscriptions initialized');
}
