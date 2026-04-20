import { services } from '../../registry.js';
import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class PagerDutyConnector extends ToolConnector {
  readonly id = 'pagerduty';
  readonly name = 'PagerDuty';
  readonly description =
    'PagerDuty — incident alerting, on-call scheduling, escalation policy management, and real-time incident lifecycle';
  readonly category: ConnectorCategory = 'alerting';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['PAGERDUTY_API_KEY'],
    optionalEnvVars: ['PAGERDUTY_INTEGRATION_KEY', 'PAGERDUTY_WEBHOOK_SECRET'],
    description:
      'REST API key from PagerDuty API Access Keys. Webhook secret for inbound event validation.',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'list_incidents',
      name: 'List Incidents',
      description: 'Retrieve active and recent PagerDuty incidents',
      parameters: [
        {
          name: 'status',
          type: 'string',
          description: 'Filter by status: triggered, acknowledged, resolved',
          required: false,
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of incidents (default 25)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'incidents'],
      rateLimit: { requestsPerMinute: 60 },
    },
    {
      id: 'get_incident_summary',
      name: 'Get Active Incident Summary',
      description: 'Get a summary of all active incidents across all PagerDuty services',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'incidents'],
    },
    {
      id: 'list_escalation_policies',
      name: 'List Escalation Policies',
      description: 'Get all escalation policies with their team assignments',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'escalation'],
    },
    {
      id: 'get_on_call',
      name: 'Get On-Call Schedule',
      description: 'Get current on-call engineers across all or a specific escalation policy',
      parameters: [
        {
          name: 'escalationPolicyId',
          type: 'string',
          description: 'Filter by escalation policy ID',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'oncall'],
    },
    {
      id: 'create_incident',
      name: 'Create Incident',
      description: 'Create a new PagerDuty incident',
      parameters: [
        { name: 'title', type: 'string', description: 'Incident title', required: true },
        {
          name: 'serviceId',
          type: 'string',
          description: 'PagerDuty service ID to associate the incident with',
          required: true,
        },
        {
          name: 'urgency',
          type: 'string',
          description: 'Urgency: high or low (default: high)',
          required: false,
          enum: ['high', 'low'],
        },
        { name: 'body', type: 'string', description: 'Incident body details', required: false },
      ],
      requiresAuth: true,
      tags: ['write', 'incidents'],
    },
    {
      id: 'resolve_incident',
      name: 'Resolve Incident',
      description: 'Resolve an active PagerDuty incident',
      parameters: [
        {
          name: 'incidentId',
          type: 'string',
          description: 'PagerDuty incident ID',
          required: true,
        },
        {
          name: 'resolvedByEmail',
          type: 'string',
          description: 'Email of the user resolving the incident',
          required: true,
        },
      ],
      requiresAuth: true,
      tags: ['write', 'incidents'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const adapter = services.pagerduty;
    switch (capabilityId) {
      case 'list_incidents': {
        const rawStatus = params['status'];
        const statusArr = rawStatus
          ? ((Array.isArray(rawStatus) ? rawStatus.map(String) : [String(rawStatus)]) as Array<
              'triggered' | 'acknowledged' | 'resolved'
            >)
          : undefined;
        return adapter.listIncidents({
          status: statusArr,
          limit: params['limit'] as number | undefined,
        });
      }
      case 'get_incident_summary':
        return adapter.getActiveIncidentSummary();
      case 'list_escalation_policies':
        return adapter.listEscalationPolicies();
      case 'get_on_call':
        return adapter.getOnCallSchedule(
          params['escalationPolicyId'] ? String(params['escalationPolicyId']) : undefined,
        );
      case 'create_incident':
        return adapter.createIncident({
          title: String(params['title']),
          serviceId: String(params['serviceId']),
          fromEmail: params['fromEmail']
            ? String(params['fromEmail'])
            : 'alloy-agent@szlholdings.com',
          urgency: (params['urgency'] as 'high' | 'low') ?? 'high',
          body: params['body'] ? String(params['body']) : undefined,
        });
      case 'resolve_incident':
        return adapter.resolveIncident(
          String(params['incidentId']),
          String(params['resolvedByEmail']),
        );
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected async performHealthCheck(): Promise<void> {
    await services.pagerduty.testConnection();
  }
}
