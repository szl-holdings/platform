import type { ToolManifest } from './manifest.js';

export interface ToolRegistry {
  register(manifest: ToolManifest): void;
  get(toolId: string): ToolManifest | undefined;
  list(filter?: { domainTag?: string; policyTier?: string; enabled?: boolean }): ToolManifest[];
  unregister(toolId: string): boolean;
  count(): number;
}

export class InMemoryToolRegistry implements ToolRegistry {
  private readonly manifests = new Map<string, ToolManifest>();

  register(manifest: ToolManifest): void {
    this.manifests.set(manifest.id, manifest);
  }

  get(toolId: string): ToolManifest | undefined {
    return this.manifests.get(toolId);
  }

  list(filter?: { domainTag?: string; policyTier?: string; enabled?: boolean }): ToolManifest[] {
    let results = Array.from(this.manifests.values());
    if (filter?.domainTag)
      results = results.filter((m) =>
        m.domainTags.includes(filter.domainTag as ToolManifest['domainTags'][0]),
      );
    if (filter?.policyTier) results = results.filter((m) => m.policyTier === filter.policyTier);
    if (filter?.enabled !== undefined)
      results = results.filter((m) => m.enabled === filter.enabled);
    return results;
  }

  unregister(toolId: string): boolean {
    return this.manifests.delete(toolId);
  }

  count(): number {
    return this.manifests.size;
  }
}

export const defaultToolRegistry = new InMemoryToolRegistry();
