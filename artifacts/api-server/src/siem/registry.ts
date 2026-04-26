import type { SiemAdapter } from './adapter-interface';
import genericWebhookAdapter from './adapters/generic-webhook';
import splunkHttpAdapter from './adapters/splunk-http';

const adapters: Map<string, SiemAdapter> = new Map();

function registerAdapter(adapter: SiemAdapter): void {
  adapters.set(adapter.id, adapter);
}

registerAdapter(genericWebhookAdapter);
registerAdapter(splunkHttpAdapter);

export function getAdapter(id: string): SiemAdapter | undefined {
  return adapters.get(id);
}

export function listAdapters(): SiemAdapter[] {
  return Array.from(adapters.values());
}

export function registerCustomAdapter(adapter: SiemAdapter): void {
  adapters.set(adapter.id, adapter);
}
