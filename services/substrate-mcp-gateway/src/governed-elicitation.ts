import { randomUUID, createHash } from 'node:crypto';
import { getCurrentActorId, getCurrentTenantId } from './request-context.js';
import { emitRunEvent, type RunEventType } from './run-events.js';

export type ElicitationMode = 'form' | 'url';
export type ElicitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface ElicitationFormSchema {
  type: 'object';
  properties: Record<string, {
    type: 'string' | 'number' | 'integer' | 'boolean';
    description?: string;
    enum?: string[];
    oneOf?: Array<{ const: string; title: string }>;
    format?: string;
    minimum?: number;
    maximum?: number;
    default?: unknown;
  }>;
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
}

export interface GovernedElicitationFlow {
  id: string;
  mode: ElicitationMode;
  actor: string;
  tenantId: string;
  status: ElicitationStatus;
  message: string;
  schema: ElicitationFormSchema | null;
  url: string | null;
  sessionBound: boolean;
  proofHash: string;
  response: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
}

const URL_ELICITATION_REQUIRED_ERROR_CODE = -32042;
const activeFlows = new Map<string, GovernedElicitationFlow>();

function computeProofHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

function validateSchemaSubset(schema: ElicitationFormSchema): string[] {
  const errors: string[] = [];
  const allowedTypes = new Set(['string', 'number', 'integer', 'boolean']);
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!allowedTypes.has(prop.type)) {
      errors.push(`Property "${key}" has unsupported type "${prop.type}". Allowed: string, number, integer, boolean.`);
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
    if (!request.url.startsWith('https://')) {
      throw Object.assign(
        new Error('URL elicitation requires HTTPS for security.'),
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

  const proofHash = computeProofHash({
    flowId,
    mode,
    actor,
    tenantId,
    message: request.message,
    timestamp: Date.now(),
  });

  const flow: GovernedElicitationFlow = {
    id: flowId,
    mode,
    actor,
    tenantId,
    status: 'pending',
    message: request.message,
    schema: request.requestedSchema ?? null,
    url: request.url ?? null,
    sessionBound: mode === 'url',
    proofHash,
    response: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  activeFlows.set(flowId, flow);

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
