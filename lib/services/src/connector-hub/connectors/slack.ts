import { services } from '../../registry.js';
import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class SlackConnector extends ToolConnector {
  readonly id = 'slack';
  readonly name = 'Slack';
  readonly description =
    'Slack — team messaging, channel management, webhook delivery, interactive alert routing, and slash command handling';
  readonly category: ConnectorCategory = 'communication';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['SLACK_BOT_TOKEN'],
    optionalEnvVars: ['SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN', 'SLACK_WEBHOOK_URL'],
    description:
      'Bot token (xoxb-*) from Slack App > OAuth & Permissions. Signing secret for webhook verification.',
    webhookSignatureHeader: 'x-slack-signature',
    webhookSignatureAlgorithm: 'hmac-sha256',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'post_message',
      name: 'Post Message',
      description: 'Post a message to a Slack channel or direct message',
      parameters: [
        {
          name: 'channel',
          type: 'string',
          description: 'Channel ID or name (e.g. #general or C1234)',
          required: true,
        },
        {
          name: 'text',
          type: 'string',
          description: 'Message text (supports Slack mrkdwn)',
          required: true,
        },
      ],
      requiresAuth: true,
      tags: ['write', 'messaging'],
      rateLimit: { requestsPerMinute: 60, requestsPerHour: 600 },
    },
    {
      id: 'post_interactive_alert',
      name: 'Post Interactive Alert',
      description: 'Post a structured alert with severity color coding to a specific channel',
      parameters: [
        {
          name: 'channel',
          type: 'string',
          description: 'Target channel ID or name',
          required: true,
        },
        { name: 'title', type: 'string', description: 'Alert title', required: true },
        { name: 'message', type: 'string', description: 'Alert message body', required: true },
        {
          name: 'severity',
          type: 'string',
          description: 'Alert severity: info, warning, critical',
          required: false,
          enum: ['info', 'warning', 'critical'],
        },
        {
          name: 'source',
          type: 'string',
          description: 'System that triggered the alert',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['write', 'alerts'],
    },
    {
      id: 'get_bot_info',
      name: 'Get Bot Info',
      description: 'Retrieve the bot identity and workspace information',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'identity'],
    },
    {
      id: 'list_channels',
      name: 'List Channels',
      description: 'List all accessible Slack channels in the workspace',
      parameters: [
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum channels to return (default 200)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'channels'],
    },
    {
      id: 'route_alert_by_severity',
      name: 'Route Alert by Severity',
      description: 'Route an alert to the pre-configured channel for the given severity level',
      parameters: [
        {
          name: 'severity',
          type: 'string',
          description: 'Alert severity: info, warning, critical',
          required: true,
          enum: ['info', 'warning', 'critical'],
        },
        { name: 'title', type: 'string', description: 'Alert title', required: true },
        { name: 'message', type: 'string', description: 'Alert message', required: true },
        { name: 'source', type: 'string', description: 'Source system name', required: false },
      ],
      requiresAuth: true,
      tags: ['write', 'routing', 'alerts'],
    },
    {
      id: 'send_webhook',
      name: 'Send Webhook Message',
      description: 'Send a message via the configured Slack Incoming Webhook',
      parameters: [
        { name: 'text', type: 'string', description: 'Message text', required: true },
        {
          name: 'channel',
          type: 'string',
          description: 'Channel override (if webhook supports it)',
          required: false,
        },
      ],
      requiresAuth: false,
      tags: ['write', 'webhook'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const adapter = services.slack;
    switch (capabilityId) {
      case 'post_message':
        return adapter.postMessage(String(params.channel), String(params.text));
      case 'post_interactive_alert':
        return adapter.postInteractiveAlert(String(params.channel), {
          title: String(params.title),
          message: String(params.message),
          severity: (params.severity as 'info' | 'warning' | 'critical') ?? 'info',
          ...(params.source ? { source: String(params.source) } : {}),
        });
      case 'get_bot_info':
        return adapter.getBotInfo();
      case 'list_channels':
        return adapter.listChannels(params.limit ? Number(params.limit) : 200);
      case 'route_alert_by_severity':
        return adapter.routeAlertBySeverity({
          severity: String(params.severity) as 'info' | 'warning' | 'critical',
          title: String(params.title),
          message: String(params.message),
          ...(params.source ? { source: String(params.source) } : {}),
        });
      case 'send_webhook':
        return adapter.sendWebhookMessage(
          String(params.text),
          params.channel ? { channel: String(params.channel) } : undefined,
        );
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected override async performHealthCheck(): Promise<void> {
    await services.slack.getBotInfo();
  }
}
