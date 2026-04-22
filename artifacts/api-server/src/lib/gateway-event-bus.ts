import { EventEmitter } from 'node:events';

export interface GatewayEventPayload {
  id: string;
  ruleId: string;
  agentClass: string;
  mcpServerId: string;
  tool: string;
  egressDomain?: string | undefined;
  decision: 'allowed' | 'logged' | 'blocked' | 'quarantined';
  reason: string;
  enforcementMode: 'log-only' | 'block' | 'quarantine';
  linkedExposureId?: string | undefined;
  occurredAt: string;
}

class GatewayEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  emitEvent(event: GatewayEventPayload): void {
    this.emit('event', event);
  }

  onEvent(listener: (event: GatewayEventPayload) => void): () => void {
    this.on('event', listener);
    return () => this.off('event', listener);
  }
}

export const gatewayEventBus = new GatewayEventBus();
