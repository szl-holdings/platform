import 'dotenv/config';
import { env } from '@workspace/env';
import { initOtel } from '@workspace/otel';
import { createLogger } from '@workspace/telemetry-standards';
import { ${{ values.agentSlug | capitalize }}Agent } from './agent.js';
import { startHealthServer, setReady } from './health/server.js';

// Bootstrap OTel before agent starts
initOtel({ serviceName: '${{ values.agentSlug }}-worker' });

const log = createLogger({ service: '${{ values.agentSlug }}-worker' });

async function main(): Promise<void> {
  // Start liveness/readiness HTTP server on port 9090 before anything else
  const healthPort = Number(process.env['HEALTH_PORT'] ?? 9090);
  startHealthServer(healthPort);

  log.info({ trigger: '${{ values.triggerType }}' }, '${{ values.agentName }} worker starting');

  const agent = new ${{ values.agentSlug | capitalize }}Agent({
    logContext: { service: '${{ values.agentSlug }}-worker' },
  });

  // ── Trigger binding ─────────────────────────────────────────────────────────
  // Adapt the binding below to match your triggerType: ${{ values.triggerType }}
  //
  // queue:   Poll Azure Service Bus / SQS message queue
  // cron:    Use node-cron or Temporal schedule
  // event:   Subscribe to event bus topic
  // http:    Start Express server and bind POST /run

  setReady(true);
  await agent.run();

  log.info('${{ values.agentName }} worker completed run cycle');
}

main().catch((err: unknown) => {
  log.error({ err }, '${{ values.agentName }} worker fatal error');
  process.exit(1);
});
