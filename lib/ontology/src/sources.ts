/**
 * Source-app adapters that translate domain rows into ontology entities.
 *
 * Each source app (DOMAINE, SEXTANT, Counsel, …) calls the appropriate
 * `register*` helper from its write path so the unified entity graph stays
 * in sync with the per-domain tables.
 */
import { registerEntity } from './registry.js';
import { entityUri, type EntityKind } from './uri.js';

export interface TerraPropertyLike {
  id: number;
  externalId?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  orgId?: number | null;
}

export async function registerTerraProperty(prop: TerraPropertyLike) {
  const ns = prop.externalId ? 'external' : 'internal';
  const id = prop.externalId ?? String(prop.id);
  return registerEntity({
    kind: 'property',
    namespace: ns,
    identifier: id,
    orgId: prop.orgId ?? null,
    sourceTable: 'terra_properties',
    sourceId: String(prop.id),
    displayName: prop.address,
    attributes: { city: prop.city ?? null, state: prop.state ?? null },
  });
}

export interface VesselLike {
  id: number;
  imo?: string | null;
  name: string;
  orgId?: number | null;
  flag?: string | null;
  vesselType?: string | null;
}

export async function registerVessel(vessel: VesselLike) {
  const ns = vessel.imo ? 'imo' : 'internal';
  const id = vessel.imo ?? String(vessel.id);
  return registerEntity({
    kind: 'vessel',
    namespace: ns,
    identifier: id,
    orgId: vessel.orgId ?? null,
    sourceTable: 'vessels',
    sourceId: String(vessel.id),
    displayName: vessel.name,
    attributes: { flag: vessel.flag ?? null, type: vessel.vesselType ?? null },
  });
}

export interface CounselMatterLike {
  id: number;
  title: string;
  orgId: number;
  status?: string | null;
  courtName?: string | null;
}

export async function registerCounselMatter(matter: CounselMatterLike) {
  return registerEntity({
    kind: 'matter',
    namespace: 'pc',
    identifier: matter.id,
    orgId: matter.orgId,
    sourceTable: 'pc_matters',
    sourceId: String(matter.id),
    displayName: matter.title,
    attributes: { status: matter.status ?? null, courtName: matter.courtName ?? null },
  });
}

/** Generic helper for kinds without a specialised adapter (e.g. briefings). */
export async function registerGeneric(input: {
  kind: EntityKind;
  namespace: string;
  identifier: string | number;
  orgId?: number | null;
  sourceTable: string;
  sourceId: string | number;
  displayName: string;
  attributes?: Record<string, unknown> | null;
}) {
  return registerEntity(input);
}

export function uriFromTerraProperty(prop: TerraPropertyLike): string {
  return entityUri('property', prop.externalId ? 'external' : 'internal', prop.externalId ?? prop.id);
}

export function uriFromVessel(vessel: VesselLike): string {
  return entityUri('vessel', vessel.imo ? 'imo' : 'internal', vessel.imo ?? vessel.id);
}

export function uriFromCounselMatter(matter: CounselMatterLike): string {
  return entityUri('matter', 'pc', matter.id);
}
