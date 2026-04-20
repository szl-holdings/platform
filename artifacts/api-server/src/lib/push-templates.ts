import type { PushMessagePayload } from './expo-push';

export type NotificationTemplate =
  | 'aegis_threat_alert'
  | 'aegis_incident_update'
  | 'aegis_system_health'
  | 'vessels_vessel_alert'
  | 'vessels_compliance_warning'
  | 'vessels_port_arrival'
  | 'terra_deal_update'
  | 'terra_listing_change'
  | 'terra_distress_signal'
  | 'carlota_session_reminder'
  | 'carlota_document_upload'
  | 'carlota_message'
  | 'lyte_kpi_alert'
  | 'lyte_escalation'
  | 'lyte_milestone'
  | 'szl_portfolio_alert'
  | 'szl_investor_update'
  | 'stephen_content_published'
  | 'stephen_venture_update';

export type TemplateVars = Record<string, string | number>;

export function buildPushMessage(
  template: NotificationTemplate,
  vars: TemplateVars,
): PushMessagePayload {
  switch (template) {
    case 'aegis_threat_alert':
      return {
        title: `Threat Alert: ${vars.threatLevel ?? 'UNKNOWN'}`,
        body: `${vars.description ?? 'A new threat has been detected'}. Requires immediate attention.`,
        data: { screen: '/threats', templateId: template, ...vars },
        sound: 'default',
        channelId: 'aegis-critical',
      };

    case 'aegis_incident_update':
      return {
        title: `Incident Update — ${vars.incidentId ?? 'INC-???'}`,
        body: `${vars.status ?? 'Status updated'}: ${vars.summary ?? 'Incident details have changed.'}`,
        data: { screen: `/incidents/${vars.incidentId}`, templateId: template, ...vars },
        sound: 'default',
        channelId: 'aegis-incidents',
      };

    case 'aegis_system_health':
      return {
        title: `System Health: ${vars.severity ?? 'Warning'}`,
        body: `${vars.system ?? 'A monitored system'} is reporting issues. ${vars.detail ?? ''}`,
        data: { screen: '/health', templateId: template, ...vars },
        sound: vars.severity === 'critical' ? 'default' : null,
        channelId: 'aegis-health',
      };

    case 'vessels_vessel_alert':
      return {
        title: `Vessel Alert — ${vars.vesselName ?? 'Unknown Vessel'}`,
        body: `${vars.alertType ?? 'Alert'}: ${vars.message ?? 'Vessel requires attention.'}`,
        data: { screen: `/vessels/${vars.vesselId}`, templateId: template, ...vars },
        sound: 'default',
        channelId: 'vessels-alerts',
      };

    case 'vessels_compliance_warning':
      return {
        title: `Compliance Warning`,
        body: `${vars.vesselName ?? 'A vessel'} has a compliance issue: ${vars.issue ?? 'documentation missing'}.`,
        data: { screen: `/vessels/${vars.vesselId}/compliance`, templateId: template, ...vars },
        sound: 'default',
        channelId: 'vessels-compliance',
      };

    case 'vessels_port_arrival':
      return {
        title: `Port Arrival — ${vars.vesselName ?? 'Vessel'}`,
        body: `${vars.vesselName ?? 'A vessel'} has arrived at ${vars.port ?? 'destination'}.`,
        data: { screen: `/vessels/${vars.vesselId}`, templateId: template, ...vars },
        sound: null,
        channelId: 'vessels-updates',
      };

    case 'terra_deal_update':
      return {
        title: `Deal Update — ${vars.propertyAddress ?? 'Property'}`,
        body: `${vars.update ?? 'Your deal has a status update.'}`,
        data: { screen: `/deals/${vars.dealId}`, templateId: template, ...vars },
        sound: 'default',
        channelId: 'terra-deals',
      };

    case 'terra_listing_change':
      return {
        title: `Listing Update`,
        body: `${vars.propertyAddress ?? 'A property'} has been updated: ${vars.change ?? 'price or status changed'}.`,
        data: { screen: `/listings/${vars.listingId}`, templateId: template, ...vars },
        sound: null,
        channelId: 'terra-listings',
      };

    case 'terra_distress_signal':
      return {
        title: `Distress Signal Detected`,
        body: `${vars.propertyAddress ?? 'A property'} shows signs of financial distress. ${vars.detail ?? ''}`,
        data: { screen: `/distress/${vars.propertyId}`, templateId: template, ...vars },
        sound: 'default',
        channelId: 'terra-distress',
      };

    case 'carlota_session_reminder':
      return {
        title: `Session Reminder`,
        body: `Your ${vars.sessionTitle ?? 'session'} with Rosa is in ${vars.timeUntil ?? '30 minutes'}.`,
        data: { screen: '/sessions', templateId: template, ...vars },
        sound: 'default',
        channelId: 'carlota-sessions',
      };

    case 'carlota_document_upload':
      return {
        title: `New Document Available`,
        body: `${vars.documentName ?? 'A new document'} has been shared with you in your Vault.`,
        data: { screen: '/documents', templateId: template, ...vars },
        sound: 'default',
        channelId: 'carlota-documents',
      };

    case 'carlota_message':
      return {
        title: `Message from ${vars.senderName ?? 'Rosa'}`,
        body: `${vars.preview ?? 'You have a new message.'}`,
        data: { screen: '/messages', templateId: template, ...vars },
        sound: 'default',
        channelId: 'carlota-messages',
      };

    case 'lyte_kpi_alert':
      return {
        title: `KPI Alert — ${vars.kpiName ?? 'Metric'}`,
        body: `${vars.kpiName ?? 'A KPI'} has ${vars.direction ?? 'changed'}: ${vars.value ?? 'threshold breached'}.`,
        data: { screen: '/kpis', templateId: template, ...vars },
        sound: 'default',
        channelId: 'lyte-kpis',
      };

    case 'lyte_escalation':
      return {
        title: `Escalation Required`,
        body: `${vars.issueTitle ?? 'An issue'} requires your attention: ${vars.detail ?? 'immediate action needed'}.`,
        data: { screen: '/escalations', templateId: template, ...vars },
        sound: 'default',
        channelId: 'lyte-escalations',
      };

    case 'lyte_milestone':
      return {
        title: `Milestone Reached`,
        body: `${vars.milestoneName ?? 'A milestone'} has been completed for ${vars.project ?? 'your project'}.`,
        data: { screen: '/milestones', templateId: template, ...vars },
        sound: null,
        channelId: 'lyte-milestones',
      };

    case 'szl_portfolio_alert':
      return {
        title: `Portfolio Alert — ${vars.assetName ?? 'Asset'}`,
        body: `${vars.assetName ?? 'An asset'} requires attention: ${vars.detail ?? 'portfolio change detected'}.`,
        data: { screen: '/portfolio', templateId: template, ...vars },
        sound: 'default',
        channelId: 'szl-portfolio',
      };

    case 'szl_investor_update':
      return {
        title: `Investor Update`,
        body: `${vars.updateTitle ?? 'A new investor update'} is available: ${vars.summary ?? 'review your holdings dashboard'}.`,
        data: { screen: '/updates', templateId: template, ...vars },
        sound: null,
        channelId: 'szl-updates',
      };

    case 'stephen_content_published':
      return {
        title: `New Content Published`,
        body: `${vars.contentTitle ?? 'New content'} has been published${vars.category ? ` in ${vars.category}` : ''}.`,
        data: { screen: vars.slug ? `/article/${vars.slug}` : '/', templateId: template, ...vars },
        sound: null,
        channelId: 'stephen-content',
      };

    case 'stephen_venture_update':
      return {
        title: `Venture Update — ${vars.ventureName ?? 'Portfolio'}`,
        body: `${vars.ventureName ?? 'A venture'}: ${vars.update ?? 'new update available'}.`,
        data: {
          screen: vars.ventureSlug ? `/venture/${vars.ventureSlug}` : '/ventures',
          templateId: template,
          ...vars,
        },
        sound: 'default',
        channelId: 'stephen-ventures',
      };

    default:
      return {
        title: 'Notification',
        body: 'You have a new notification.',
        data: { templateId: template },
        sound: 'default',
        channelId: 'default',
      };
  }
}
