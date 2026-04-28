import { AlertCircle, Book, Code2, Database, Globe, Key, Layers, Webhook, Zap } from 'lucide-react';
import type { ElementType } from 'react';

export interface NavSection {
  id: string;
  label: string;
  icon: ElementType;
  subsections?: { id: string; label: string }[];
}

export const NAV: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Book,
  },
  {
    id: 'authentication',
    label: 'Authentication',
    icon: Key,
    subsections: [
      { id: 'auth-overview', label: 'Overview' },
      { id: 'auth-bearer', label: 'Bearer Tokens' },
      { id: 'auth-oauth', label: 'OAuth 2.0 Flow' },
      { id: 'auth-api-keys', label: 'API Keys' },
      { id: 'auth-scim', label: 'SCIM Tokens' },
    ],
  },
  {
    id: 'rest-api',
    label: 'REST API Explorer',
    icon: Globe,
    subsections: [
      { id: 'rest-overview', label: 'Base URL & Formats' },
      { id: 'rest-explorer', label: 'Interactive Explorer' },
    ],
  },
  {
    id: 'graphql',
    label: 'GraphQL',
    icon: Database,
    subsections: [
      { id: 'gql-overview', label: 'Overview' },
      { id: 'gql-playground', label: 'Playground' },
      { id: 'gql-queries', label: 'Example Queries' },
      { id: 'gql-mutations', label: 'Example Mutations' },
    ],
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    subsections: [
      { id: 'webhooks-setup', label: 'Setup & Configuration' },
      { id: 'webhooks-signatures', label: 'Signature Verification' },
      { id: 'webhooks-events', label: 'Event Reference' },
    ],
  },
  {
    id: 'code-samples',
    label: 'Code Samples',
    icon: Code2,
    subsections: [
      { id: 'samples-auth', label: 'Authentication' },
      { id: 'samples-projects', label: 'Projects' },
      { id: 'samples-vessels', label: 'Vessels' },
      { id: 'samples-continuum', label: 'Counsel Signals' },
    ],
  },
  {
    id: 'rate-limits',
    label: 'Rate Limits',
    icon: Zap,
  },
  {
    id: 'errors',
    label: 'Error Codes',
    icon: AlertCircle,
  },
  {
    id: 'versioning',
    label: 'Versioning',
    icon: Layers,
  },
];

// ─── Error Code Table ─────────────────────────────────────────────────────────

export const ERROR_CODES = [
  {
    code: 400,
    name: 'Bad Request',
    description: 'The request body or parameters are invalid or malformed.',
  },
  {
    code: 401,
    name: 'Unauthorized',
    description: 'Missing or invalid authentication credentials. Include a valid Bearer token.',
  },
  {
    code: 403,
    name: 'Forbidden',
    description: 'Valid credentials, but insufficient permissions for the requested resource.',
  },
  { code: 404, name: 'Not Found', description: 'The requested resource does not exist.' },
  {
    code: 409,
    name: 'Conflict',
    description: 'The request conflicts with existing state (e.g. duplicate entity).',
  },
  {
    code: 422,
    name: 'Unprocessable Entity',
    description: 'The request is well-formed but fails business validation rules.',
  },
  {
    code: 429,
    name: 'Too Many Requests',
    description: 'Rate limit exceeded. Check Retry-After header for backoff guidance.',
  },
  {
    code: 500,
    name: 'Internal Server Error',
    description: 'Unexpected server error. Correlation ID is returned for support.',
  },
  {
    code: 503,
    name: 'Service Unavailable',
    description: 'Upstream dependency (DB, queue, external service) is temporarily unavailable.',
  },
];

export const API_ERROR_CODES = [
  {
    code: 'INVALID_CREDENTIALS',
    http: 401,
    description: 'Supplied credential could not be verified.',
  },
  {
    code: 'ACCOUNT_DISABLED',
    http: 403,
    description: 'The account has been administratively disabled.',
  },
  { code: 'SESSION_EXPIRED', http: 401, description: 'Session token has passed its expiry time.' },
  {
    code: 'INSUFFICIENT_ROLE',
    http: 403,
    description: 'Action requires a role not held by the caller.',
  },
  {
    code: 'RESOURCE_NOT_FOUND',
    http: 404,
    description: 'Entity matching supplied ID does not exist.',
  },
  {
    code: 'VALIDATION_ERROR',
    http: 400,
    description: 'One or more request fields failed schema validation.',
  },
  {
    code: 'RATE_LIMITED',
    http: 429,
    description: 'Caller has exceeded the allowed request rate for this endpoint tier.',
  },
  {
    code: 'WEBHOOK_SIGNATURE_INVALID',
    http: 400,
    description: 'HMAC-SHA256 signature on webhook payload does not match.',
  },
  {
    code: 'SCIM_TOKEN_INVALID',
    http: 401,
    description: 'SCIM provisioning token is missing, malformed, or revoked.',
  },
];

// ─── Rate Limit Tiers ─────────────────────────────────────────────────────────

export const RATE_LIMIT_TIERS = [
  {
    tier: 'Global',
    rph: '600',
    burst: '60 / min',
    applies: 'All endpoints',
    color: 'hsl(214,8%,55%)',
  },
  {
    tier: 'Auth',
    rph: '60',
    burst: '10 / min',
    applies: '/auth/login, /auth/refresh',
    color: 'hsl(0,72%,62%)',
  },
  {
    tier: 'Read',
    rph: '1,200',
    burst: '120 / min',
    applies: 'GET endpoints (authenticated)',
    color: 'hsl(218,72%,65%)',
  },
  {
    tier: 'Write',
    rph: '300',
    burst: '30 / min',
    applies: 'POST, PATCH, DELETE (authenticated)',
    color: 'hsl(38,88%,60%)',
  },
  {
    tier: 'Webhook Ingest',
    rph: '1,800',
    burst: '200 / min',
    applies: 'POST /continuum/ingest/*',
    color: 'hsl(142,62%,48%)',
  },
];

// ─── Webhook Events ───────────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
  { event: 'project.created', description: 'A new project was created in the platform.' },
  { event: 'project.updated', description: 'A project was updated (metadata or status).' },
  {
    event: 'workflow.run.completed',
    description: 'An Counsel workflow run reached a terminal state.',
  },
  {
    event: 'workflow.run.failed',
    description: 'An Counsel workflow run encountered an unrecoverable error.',
  },
  {
    event: 'signal.ingested',
    description: 'An external signal was accepted by the Counsel ingest pipeline.',
  },
  { event: 'vessel.alert.triggered', description: 'A vessel tracking alert condition was met.' },
  {
    event: 'security.incident.created',
    description: 'A new security incident was opened in Aegis SOC.',
  },
  { event: 'billing.invoice.paid', description: 'A billing invoice was successfully settled.' },
  { event: 'user.role.changed', description: "A user's role assignment was modified." },
  { event: 'tenant.provisioned', description: 'A new Azure tenant was fully provisioned.' },
];

// ─── GraphQL Examples ─────────────────────────────────────────────────────────

export const GQL_QUERY_VESSELS = `query GetFleet($status: String) {
  vessels(filter: { status: $status }) {
    id
    name
    mmsi
    flag
    status
    currentPosition {
      lat
      lon
      heading
      speed
      updatedAt
    }
    cargo {
      type
      quantity
      unit
    }
  }
}`;

export const GQL_QUERY_PROJECTS = `query GetProjects {
  projects {
    id
    name
    status
    createdAt
    owner {
      id
      displayName
    }
    metrics {
      openTasks
      completionRate
    }
  }
}`;

export const GQL_MUTATION_SIGNAL = `mutation IngestSignal($input: SignalInput!) {
  ingestSignal(input: $input) {
    id
    status
    correlationId
    workflowsTriggered
    processedAt
  }
}

# Variables:
# {
#   "input": {
#     "domain": "vessels",
#     "type": "route_deviation",
#     "severity": "high",
#     "entityId": "vessel_123",
#     "payload": {
#       "deviation_km": 42,
#       "expected_route": "USGUL-NLRTM"
#     }
#   }
# }`;
