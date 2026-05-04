import type { DestinationConnector, ConnectionCheckResult, ObjectDescriptor, FieldDescriptor, WriteBatchResult } from '../connector-protocol';

export const slackDestination: DestinationConnector = {
  type: 'slack',
  maxRequestsPerSecond: 1,

  async checkConnection(credentials: Record<string, unknown>): Promise<ConnectionCheckResult> {
    const webhookUrl = (credentials.webhookUrl as string) || (credentials.apiKey as string) || '';
    if (!webhookUrl) return { success: false, message: 'Slack webhook URL or bot token is required', latencyMs: 0 };
    const start = Date.now();

    if (webhookUrl.startsWith('https://hooks.slack.com/')) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '[Conduit] Connection test — this message confirms your Slack integration is working.' }),
        });
        const latencyMs = Date.now() - start;
        if (res.ok || res.status === 200) {
          return { success: true, message: 'Slack webhook verified — test message sent', latencyMs };
        }
        const body = await res.text().catch(() => '');
        return { success: false, message: `Slack returned ${res.status}: ${body}`, latencyMs };
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed', latencyMs: Date.now() - start };
      }
    }

    if (webhookUrl.startsWith('xoxb-')) {
      try {
        const res = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${webhookUrl}`, 'Content-Type': 'application/json' },
        });
        const body = await res.json() as { ok: boolean; error?: string };
        const latencyMs = Date.now() - start;
        return body.ok
          ? { success: true, message: 'Slack bot token verified', latencyMs }
          : { success: false, message: `Slack auth failed: ${body.error}`, latencyMs };
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed', latencyMs: Date.now() - start };
      }
    }

    return { success: false, message: 'Provide a Slack webhook URL (https://hooks.slack.com/...) or bot token (xoxb-...)', latencyMs: 0 };
  },

  async discover(_credentials: Record<string, unknown>): Promise<{ objects: ObjectDescriptor[]; fields: Record<string, FieldDescriptor[]> }> {
    return {
      objects: [
        { name: 'message', label: 'Message', description: 'Send a message to a Slack channel' },
      ],
      fields: {
        message: [
          { name: 'text', label: 'Message Text', type: 'string', required: true, updateable: true },
          { name: 'channel', label: 'Channel', type: 'string', required: false, updateable: true },
          { name: 'username', label: 'Username', type: 'string', required: false, updateable: true },
          { name: 'icon_emoji', label: 'Icon Emoji', type: 'string', required: false, updateable: true },
        ],
      },
    };
  },

  async writeBatch(credentials: Record<string, unknown>, _objectType: string, records: Array<Record<string, unknown>>): Promise<WriteBatchResult> {
    const webhookUrl = (credentials.webhookUrl as string) || (credentials.apiKey as string) || '';
    const isWebhook = webhookUrl.startsWith('https://hooks.slack.com/');
    const isBot = webhookUrl.startsWith('xoxb-');

    const rowResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        if (isWebhook) {
          const payload: Record<string, unknown> = { text: record.text || JSON.stringify(record) };
          if (record.channel) payload.channel = record.channel;
          if (record.username) payload.username = record.username;
          if (record.icon_emoji) payload.icon_emoji = record.icon_emoji;

          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const ok = res.ok || res.status === 200;
          rowResults.push({ rowIndex: i, success: ok, errorMessage: ok ? undefined : `Slack HTTP ${res.status}` });
          if (ok) successCount++; else failureCount++;
        } else if (isBot) {
          const channel = (record.channel as string) || (credentials.defaultChannel as string) || '';
          if (!channel) {
            rowResults.push({ rowIndex: i, success: false, errorMessage: 'No channel specified' });
            failureCount++;
            continue;
          }
          const res = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${webhookUrl}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel, text: record.text || JSON.stringify(record), username: record.username, icon_emoji: record.icon_emoji }),
          });
          const body = await res.json() as { ok: boolean; error?: string };
          rowResults.push({ rowIndex: i, success: body.ok, errorMessage: body.ok ? undefined : body.error });
          if (body.ok) successCount++; else failureCount++;
        } else {
          rowResults.push({ rowIndex: i, success: false, errorMessage: 'Invalid Slack credentials' });
          failureCount++;
        }

        if (i < records.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        rowResults.push({ rowIndex: i, success: false, errorMessage: err instanceof Error ? err.message : 'Send failed' });
        failureCount++;
      }
    }

    return { rowResults, successCount, failureCount };
  },
};
