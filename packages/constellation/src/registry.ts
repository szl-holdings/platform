import type { ConstellationAdapter } from './adapter.ts';
import type { CstDomain } from './types.ts';

const _adapters = new Map<CstDomain, ConstellationAdapter>();

export function registerAdapter(adapter: ConstellationAdapter): void {
  _adapters.set(adapter.domain, adapter);
}

export function getAdapter(domain: CstDomain): ConstellationAdapter | undefined {
  return _adapters.get(domain);
}

export function listAdapters(): ConstellationAdapter[] {
  return Array.from(_adapters.values());
}

export function getRegisteredDomains(): CstDomain[] {
  return Array.from(_adapters.keys());
}
