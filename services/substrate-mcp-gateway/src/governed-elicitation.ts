import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { getCurrentActorId, getCurrentTenantId } from './request-context.js';
import { emitRunEvent, type RunEventType } from './run-events.js';
import { recordProof, type ProofRecord } from './nexus-fabric.js';

export type ElicitationMode = 'form' | 'url';
export type ElicitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface ElicitationFormSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  description?: string;
  enum?: string[];
  oneOf?: Array<{ const: string; title: string }>;
  format?: string;
  minimum?: number;
  maximum?: number;
  default?: unknown;
  items?: {
    type: 'string';
    enum?: string[];
  };
  uniqueItems?: boolean;
}

export interface ElicitationFormSchema {
  type: 'object';
  properties: Record<string, ElicitationFormSchemaProperty>;
  required?: string[];
}

export interface ElicitationCreateRequest {
  message: string;
  requestedSchema?: ElicitationFormSchema;
  url?: string;
  mode?: ElicitationMode;
  metadata?: Record<string, unknown>;
}

export interface ElicitationResult {
  action: 'accept' | 'decline' | 'cancel';
  content?: Record<string, unknown>;
  sessionToken?: string;
}

export interface GovernedElicitationFlow {
  id: string;
  mode: ElicitationMode;
  actor: string;
  actorIdentity: string;
  tenantId: string;
  status: ElicitationStatus;
  message: string;
  schema: ElicitationFormSchema | null;
  url: string | null;
  sessionBound: boolean;
  sessionToken: string | null;
  proofHash: string;
  proofPersistedToWal: boolean;
  response: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
}

const URL_ELICITATION_REQUIRED_ERROR_CODE = -32042;
const ELICITATION_TTL_MS = 15 * 60 * 1000;
const activeFlows = new Map<string, GovernedElicitationFlow>();

const URL_DOMAIN_ALLOWLIST = new Set([
  'szl.holdings',
  'forge.szl.holdings',
  'app.szl.holdings',
  'auth.szl.holdings',
  'console.szl.holdings',
]);

function computeProofHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

function validateUrlSafety(url: string): string[] {
  const errors: string[] = [];
  if (!url.startsWith('https://')) {
    errors.push('URL elicitation requires HTTPS for security.');
  }
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) {
      errors.push('URL must not contain embedded credentials.');
    }
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1') {
      errors.push('URL must not target localhost.');
    }
    if (URL_DOMAIN_ALLOWLIST.size > 0) {
      const host = parsed.hostname.toLowerCase();
      const isAllowed = Array.from(URL_DOMAIN_ALLOWLIST).some(
        (d) => host === d || host.endsWith(`.${d}`),
      );
      if (!isAllowed) {
        errors.push(
          `URL domain '${host}' is not in the approved allowlist. ` +
          `Allowed: ${Array.from(URL_DOMAIN_ALLOWLIST).join(', ')}.`,
        );
      }
    }
  } catch {
    errors.push('URL is malformed and cannot be parsed.');
  }
  return errors;
}

function validateSchemaSubset(schema: ElicitationFormSchema): string[] {
  const errors: string[] = [];
  const allowedTypes = new Set(['string', 'number', 'integer', 'boolean', 'array']);
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!allowedTypes.has(prop.type)) {
      errors.push(`Property "${key}" has unsupported type "${prop.type}". Allowed: string, number, integer, boolean, array.`);
    }
    if (prop.type === 'array') {
      if (!prop.items || prop.items.type !== 'string') {
        errors.push(`Property "${key}" is an array but must have items.type = "string".`);
      }
    }
  }
  return errors;
}

function validateResponseAgainstSchema(
  response: Record<string, unknown>,
  schema: ElicitationFormSchema,
): string[] {
  const errors: string[] = [];
  for (const reqKey of schema.required ?? []) {
    if (!(reqKey in response) || response[reqKey] === undefined || response[reqKey] === null) {
      errors.push(`Missing required field: "${reqKey}".`);
    }
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    const val = response[key];
    if (val === undefined || val === null) continue;
    if (prop.type === 'string' && typeof val !== 'string') {
      errors.push(`Field "${key}" must be a string.`);
    }
    if ((prop.type === 'number' || prop.type === 'integer') && typeof val !== 'number') {
      errors.push(`Field "${key}" must be a number.`);
    }
    if (prop.type === 'boolean' && typeof val !== 'boolean') {
      errors.push(`Field "${key}" must be a boolean.`);
    }
    if (prop.type === 'array') {
      if (!Array.isArray(val)) {
        errors.push(`Field "${key}" must be an array.`);
      } else if (prop.items?.enum) {
        const allowed = new Set(prop.items.enum);
        for (const item of val) {
          if (typeof item !== 'string' || !allowed.has(item)) {
            errors.push(`Field "${key}" contains invalid value "${item}". Allowed: ${prop.items.enum.join(', ')}.`);
          }
        }
      }
    }
    if (prop.enum && typeof val === 'string' && !prop.enum.includes(val)) {
      errors.push(`Field "${key}" must be one of: ${prop.enum.join(', ')}.`);
    }
    if (prop.minimum !== undefined && typeof val === 'number' && val < prop.minimum) {
      errors.push(`Field "${key}" must be >= ${prop.minimum}.`);
    }
    if (prop.maximum !== undefined && typeof val === 'number' && val > prop.maximum) {
      errors.push(`Field "${key}" must be <= ${prop.maximum}.`);
    }
  }
  return errors;
}

function persistElicitationProof(
  flowId: string,
  actor: string,
  mode: ElicitationMode,
  proofHash: string,
  status: ElicitationStatus,
): void {
  const record: ProofRecord = {
    proofHash,
    toolName: `elicitation:${mode}`,
    actor,
    issuedAt: new Date().toISOString(),
    confidence: status === 'accepted' ? 0.95 : status === 'declined' ? 0.5 : 0.1,
    covenantAllowed: status !== 'expired',
    covenantReason: `Elicitation flow ${flowId} resolved with status: ${status}`,
    responseDigest: createHash('sha256')
      .update(`${flowId}:${mode}:${status}`)
      .digest('hex')
      .slice(0, 32),
  };
  recordProof(record);
}

export function handleElicitationCreate(
  request: ElicitationCreateRequest,
): GovernedElicitationFlow {
  const flowId = randomUUID();
  const actor = getCurrentActorId();
  const tenantId = getCurrentTenantId() ?? 'substrate-gateway';
  const mode: ElicitationMode = request.url ? 'url' : (request.mode ?? 'form');

  if (mode === 'url') {
    if (!request.url) {
      throw Object.assign(
        new Error('URL elicitation requires a url parameter.'),
        { code: URL_ELICITATION_REQUIRED_ERROR_CODE },
      );
    }
    const urlErrors = validateUrlSafety(request.url);
    if (urlErrors.length > 0) {
      throw Object.assign(
        new Error(`URL elicitation security check failed: ${urlErrors.join('; ')}`),
        { code: URL_ELICITATION_REQUIRED_ERROR_CODE },
      );
    }
  }

  if (mode === 'form' && request.requestedSchema) {
    const schemaErrors = validateSchemaSubset(request.requestedSchema);
    if (schemaErrors.length > 0) {
      throw new Error(`Schema validation failed: ${schemaErrors.join('; ')}`);
    }
  }

  const sessionToken = mode === 'url' ? generateSessionToken() : null;

  const proofHash = computeProofHash({
    flowId,
    mode,
    actor,
    tenantId,
    message: request.message,
    sessionToken: sessionToken ? createHash('sha256').update(sessionToken).digest('hex').slice(0, 8) : null,
    timestamp: Date.now(),
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ELICITATION_TTL_MS);

  const actorIdentity = `${tenantId}:${actor}`;

  const flow: GovernedElicitationFlow = {
    id: flowId,
    mode,
    actor,
    actorIdentity,
    tenantId,
    status: 'pending',
    message: request.message,
    schema: request.requestedSchema ?? null,
    url: request.url ?? null,
    sessionBound: mode === 'url',
    sessionToken,
    proofHash,
    proofPersistedToWal: false,
    response: null,
    createdAt: now.toISOString(),
    completedAt: null,
    expiresAt: expiresAt.toISOString(),
  };

  activeFlows.set(flowId, flow);

  persistElicitationProof(flowId, actor, mode, proofHash, 'pending');
  flow.proofPersistedToWal = true;

  emitRunEvent({
    type: 'elicitation_created' as RunEventType,
    runId: flowId,
    actor,
    timestamp: Date.now(),
  });

  return flow;
}

export function resolveElicitation(
  flowId: string,
  result: ElicitationResult,
): GovernedElicitationFlow {
  const flow = activeFlows.get(flowId);
  if (!flow) {
    throw Object.assign(new Error(`Elicitation flow ${flowId} not found.`), { code: 'NOT_FOUND' });
  }
  const callerTenant = getCurrentTenantId();
  if (callerTenant && callerTenant !== 'substrate-gateway' && flow.tenantId !== callerTenant) {
    throw Object.assign(new Error(`Elicitation flow ${flowId} not found.`), { code: 'NOT_FOUND' });
  }
  if (flow.status !== 'pending') {
    throw new Error(`Elicitation flow ${flowId} is already ${flow.status}.`);
  }

  if (flow.expiresAt && new Date(flow.expiresAt) < new Date()) {
    flow.status = 'expired';
    flow.completedAt = new Date().toISOString();
    persistElicitationProof(flowId, flow.actor, flow.mode, flow.proofHash, 'expired');
    throw new Error(`Elicitation flow ${flowId} has expired.`);
  }

  if (flow.sessionBound && flow.sessionToken) {
    if (!result.sessionToken) {
      throw new Error('URL-mode elicitation requires a valid sessionToken for resolution.');
    }
    if (result.sessionToken !== flow.sessionToken) {
      throw new Error('Session token mismatch. URL-mode elicitation binding verification failed.');
    }
    const resolverActor = getCurrentActorId();
    const resolverIdentity = `${callerTenant ?? 'substrate-gateway'}:${resolverActor}`;
    if (resolverIdentity !== flow.actorIdentity) {
      throw new Error(
        'Identity mismatch. The user resolving this URL-mode elicitation must match the initiating actor.',
      );
    }
  }

  if (result.action === 'accept') {
    if (flow.mode === 'form' && flow.schema) {
      if (!result.content) {
        throw new Error('Form-mode accept requires content matching the requested schema.');
      }
      const errors = validateResponseAgainstSchema(result.content, flow.schema);
      if (errors.length > 0) {
        throw new Error(`Response validation failed: ${errors.join('; ')}`);
      }
    }
    flow.status = 'accepted';
    flow.response = result.content ?? null;
  } else if (result.action === 'decline') {
    flow.status = 'declined';
  } else {
    flow.status = 'cancelled';
  }

  flow.completedAt = new Date().toISOString();

  persistElicitationProof(flowId, flow.actor, flow.mode, flow.proofHash, flow.status);

  const eventType = result.action === 'accept'
    ? 'elicitation_accepted'
    : result.action === 'decline'
      ? 'elicitation_declined'
      : 'elicitation_cancelled';

  emitRunEvent({
    type: eventType as RunEventType,
    runId: flowId,
    actor: flow.actor,
    timestamp: Date.now(),
  });

  emitRunEvent({
    type: 'elicitation_complete' as RunEventType,
    runId: flowId,
    actor: flow.actor,
    status: flow.status,
    timestamp: Date.now(),
  });

  return flow;
}

export function getActiveElicitationFlows(): GovernedElicitationFlow[] {
  return Array.from(activeFlows.values())
    .filter((f) => f.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAllElicitationFlows(limit = 50, tenantId?: string): GovernedElicitationFlow[] {
  const effectiveTenant = tenantId ?? getCurrentTenantId();
  return Array.from(activeFlows.values())
    .filter((f) => !effectiveTenant || effectiveTenant === 'substrate-gateway' || f.tenantId === effectiveTenant)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getElicitationFlow(flowId: string, tenantId?: string): GovernedElicitationFlow | undefined {
  const flow = activeFlows.get(flowId);
  if (!flow) return undefined;
  const effectiveTenant = tenantId ?? getCurrentTenantId();
  if (effectiveTenant && effectiveTenant !== 'substrate-gateway' && flow.tenantId !== effectiveTenant) {
    return undefined;
  }
  return flow;
}

export { URL_ELICITATION_REQUIRED_ERROR_CODE };
