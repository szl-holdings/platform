import { and, eq, inArray, or, sql } from 'drizzle-orm';
import {
  db,
  nexusEdgesTable,
  nexusEntitiesTable,
  type NexusEdge,
  type NexusEntity,
} from '@szl-holdings/db';
import { type EntityKind, entityUri, parseUri } from './nexus-uri.js';

export interface RegisterEntityInput {
  kind: EntityKind;
  namespace: string;
  identifier: string | number;
  orgId?: number | null;
  sourceTable: string;
  sourceId: string | number;
  displayName: string;
  attributes?: Record<string, unknown> | null;
}

export interface RegisterEdgeInput {
  fromUri: string;
  toUri: string;
  relation: string;
  orgId?: number | null;
  attributes?: Record<string, unknown> | null;
}

export async function registerEntity(input: RegisterEntityInput): Promise<NexusEntity> {
  const uri = entityUri(input.kind, input.namespace, input.identifier);
  const now = new Date();
  const [row] = await db
    .insert(nexusEntitiesTable)
    .values({
      uri,
      kind: input.kind,
      orgId: input.orgId ?? null,
      sourceTable: input.sourceTable,
      sourceId: String(input.sourceId),
      displayName: input.displayName,
      attributes: input.attributes ?? null,
    })
    .onConflictDoUpdate({
      target: nexusEntitiesTable.uri,
      set: {
        displayName: input.displayName,
        attributes: input.attributes ?? null,
        sourceTable: input.sourceTable,
        sourceId: String(input.sourceId),
        orgId: input.orgId ?? null,
        updatedAt: now,
      },
    })
    .returning();
  return row;
}

export async function registerEdge(input: RegisterEdgeInput): Promise<NexusEdge> {
  // Validate that both URIs parse — fail loudly rather than store garbage.
  parseUri(input.fromUri);
  parseUri(input.toUri);
  const [row] = await db
    .insert(nexusEdgesTable)
    .values({
      fromUri: input.fromUri,
      toUri: input.toUri,
      relation: input.relation,
      orgId: input.orgId ?? null,
      attributes: input.attributes ?? null,
    })
    .onConflictDoUpdate({
      target: [nexusEdgesTable.fromUri, nexusEdgesTable.toUri, nexusEdgesTable.relation],
      set: { attributes: input.attributes ?? null, orgId: input.orgId ?? null },
    })
    .returning();
  return row;
}

export interface ResolveOptions {
  orgScope?: number[] | null;
}

export async function resolveEntity(
  uri: string,
  opts: ResolveOptions = {},
): Promise<NexusEntity | null> {
  parseUri(uri);
  const conds = [eq(nexusEntitiesTable.uri, uri)];
  if (opts.orgScope && opts.orgScope.length > 0) {
    conds.push(
      or(inArray(nexusEntitiesTable.orgId, opts.orgScope), sql`${nexusEntitiesTable.orgId} IS NULL`)!,
    );
  }
  const [row] = await db
    .select()
    .from(nexusEntitiesTable)
    .where(and(...conds))
    .limit(1);
  return row ?? null;
}

export interface NeighborEdge {
  edge: NexusEdge;
  entity: NexusEntity | null;
  direction: 'outbound' | 'inbound';
}

export async function neighbors(
  uri: string,
  opts: ResolveOptions & { limit?: number } = {},
): Promise<NeighborEdge[]> {
  parseUri(uri);
  const lim = Math.min(Math.max(opts.limit ?? 50, 1), 200);

  const orgFilter = (col: typeof nexusEdgesTable.orgId | typeof nexusEntitiesTable.orgId) => {
    if (!opts.orgScope || opts.orgScope.length === 0) return undefined;
    return or(inArray(col, opts.orgScope), sql`${col} IS NULL`);
  };

  const outboundConds = [eq(nexusEdgesTable.fromUri, uri)];
  const oFilter = orgFilter(nexusEdgesTable.orgId);
  if (oFilter) outboundConds.push(oFilter);

  const inboundConds = [eq(nexusEdgesTable.toUri, uri)];
  const iFilter = orgFilter(nexusEdgesTable.orgId);
  if (iFilter) inboundConds.push(iFilter);

  const [outbound, inbound] = await Promise.all([
    db
      .select()
      .from(nexusEdgesTable)
      .where(and(...outboundConds))
      .limit(lim),
    db
      .select()
      .from(nexusEdgesTable)
      .where(and(...inboundConds))
      .limit(lim),
  ]);

  const linkedUris = new Set<string>();
  for (const e of outbound) linkedUris.add(e.toUri);
  for (const e of inbound) linkedUris.add(e.fromUri);

  let entityMap = new Map<string, NexusEntity>();
  if (linkedUris.size > 0) {
    const entConds = [inArray(nexusEntitiesTable.uri, [...linkedUris])];
    const eFilter = orgFilter(nexusEntitiesTable.orgId);
    if (eFilter) entConds.push(eFilter);
    const ents = await db
      .select()
      .from(nexusEntitiesTable)
      .where(and(...entConds));
    entityMap = new Map(ents.map((e) => [e.uri, e]));
  }

  const out: NeighborEdge[] = [];
  for (const edge of outbound) {
    out.push({ edge, entity: entityMap.get(edge.toUri) ?? null, direction: 'outbound' });
  }
  for (const edge of inbound) {
    out.push({ edge, entity: entityMap.get(edge.fromUri) ?? null, direction: 'inbound' });
  }
  return out;
}
