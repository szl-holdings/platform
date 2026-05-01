import { AgentBase, type AgentRunContext } from '@workspace/agents-core';
import { createLogger } from '@workspace/telemetry-standards';
import { aefPolicyGuard } from '@workspace/aef-policy-guard';
import { cognitiveTrace } from '@workspace/cognitive-observability';
import { ${{ values.agentSlug }}Prompt } from './prompts/${{ values.agentSlug }}.js';
{%- if values.emitsProof %}
import { proofChain } from '@szl-holdings/proof-chain';
{%- endif %}

const log = createLogger({ service: '${{ values.agentSlug }}-worker', module: 'agent' });

export interface ${{ values.agentSlug | capitalize }}AgentOptions {
  logContext?: Record<string, unknown>;
}

export class ${{ values.agentSlug | capitalize }}Agent extends AgentBase {
  private readonly options: ${{ values.agentSlug | capitalize }}AgentOptions;

  constructor(options: ${{ values.agentSlug | capitalize }}AgentOptions = {}) {
    super({ agentId: '${{ values.agentSlug }}' });
    this.options = options;
  }

  /**
   * Main run cycle — called once per trigger.
   * Replace with real domain logic.
   */
  async run(): Promise<void> {
    const traceId = crypto.randomUUID();

    await aefPolicyGuard.check({
      agentId: '${{ values.agentSlug }}',
      action: 'run',
      context: { traceId },
    });

    const trace = cognitiveTrace.start({
      agentId: '${{ values.agentSlug }}',
      traceId,
      prompt: ${{ values.agentSlug }}Prompt.system,
    });

    try {
      log.info({ traceId }, '${{ values.agentName }} run started');

      const result = await this.executeAgentLogic({ traceId });

      trace.end({ outcome: result, quality: 1.0 });

{%- if values.emitsProof %}
      await proofChain.emit({
        agentId: '${{ values.agentSlug }}',
        decisionId: traceId,
        inputs: { prompt: ${{ values.agentSlug }}Prompt.system },
        outcome: result,
        policy: 'default',
        timestamp: new Date().toISOString(),
      });
{%- endif %}

      log.info({ traceId, result }, '${{ values.agentName }} run completed');
    } catch (err) {
      trace.error(err as Error);
      log.error({ traceId, err }, '${{ values.agentName }} run failed');
      throw err;
    }
  }

  private async executeAgentLogic(ctx: AgentRunContext): Promise<unknown> {
    return { status: 'completed', agentId: '${{ values.agentSlug }}', ...ctx };
  }
}
