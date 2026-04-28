import { z } from 'zod';

export const ENTITY_KINDS = [
  'organization',
  'person',
  'vessel',
  'property',
  'matter',
  'threat',
  'scenario',
  'deal',
  'briefing',
  'holding',
  'counterparty',
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export const URI_PREFIX = 'szl://';

const URI_RE = /^szl:\/\/([a-z]+)\/([a-z0-9_-]+)\/([A-Za-z0-9_.:-]+)$/;

export interface ParsedUri {
  kind: EntityKind;
  namespace: string;
  identifier: string;
}

export function entityUri(kind: EntityKind, namespace: string, identifier: string | number): string {
  if (!ENTITY_KINDS.includes(kind)) {
    throw new Error(`Unknown entity kind: ${kind}`);
  }
  if (!/^[a-z0-9_-]+$/.test(namespace)) {
    throw new Error(`Invalid namespace: ${namespace}`);
  }
  const id = String(identifier);
  if (!/^[A-Za-z0-9_.:-]+$/.test(id)) {
    throw new Error(`Invalid identifier: ${id}`);
  }
  return `${URI_PREFIX}${kind}/${namespace}/${id}`;
}

export function parseUri(uri: string): ParsedUri {
  const match = URI_RE.exec(uri);
  if (!match) {
    throw new Error(`Invalid SZL entity URI: ${uri}`);
  }
  const [, kind, namespace, identifier] = match;
  if (!ENTITY_KINDS.includes(kind as EntityKind)) {
    throw new Error(`Unknown entity kind in URI: ${kind}`);
  }
  return {
    kind: kind as EntityKind,
    namespace,
    identifier,
  };
}

export function isUri(value: unknown): value is string {
  return typeof value === 'string' && URI_RE.test(value);
}

export const uriSchema = z.string().regex(URI_RE, 'must be a valid szl:// entity URI');
export const entityKindSchema = z.enum(ENTITY_KINDS);
