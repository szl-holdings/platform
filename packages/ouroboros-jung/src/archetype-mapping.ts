/**
 * Primitive 47 — Archetype mapping
 *
 * Jung's archetypes are universal role-templates (hero, sage,
 * trickster, caregiver, etc.). Operationalised as legible role
 * routing: any agent acting in a context must declare which
 * archetype it is invoking, and the mapping must be defined,
 * unique per role-name, and reversible (lookup by id and by
 * archetype both work).
 */

export type Archetype =
  | "hero"
  | "sage"
  | "caregiver"
  | "trickster"
  | "ruler"
  | "explorer"
  | "creator"
  | "innocent"
  | "lover"
  | "magician"
  | "everyman"
  | "outlaw";

export interface ArchetypeBinding {
  agentId: string;
  archetype: Archetype;
  rationale: string;
}

export class ArchetypeMap {
  private byAgent = new Map<string, ArchetypeBinding>();

  bind(b: ArchetypeBinding): void {
    if (this.byAgent.has(b.agentId)) {
      throw new Error(`agent ${b.agentId} already bound`);
    }
    this.byAgent.set(b.agentId, b);
  }

  lookup(agentId: string): ArchetypeBinding | undefined {
    return this.byAgent.get(agentId);
  }

  agentsFor(arch: Archetype): string[] {
    return [...this.byAgent.values()]
      .filter((b) => b.archetype === arch)
      .map((b) => b.agentId);
  }

  isLegible(): boolean {
    // every agent has a non-empty rationale
    return [...this.byAgent.values()].every(
      (b) => b.rationale && b.rationale.trim().length > 0,
    );
  }

  size(): number {
    return this.byAgent.size;
  }
}
