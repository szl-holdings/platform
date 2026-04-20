/**
 * Typed connector interfaces — one per connector category.
 *
 * Each connector implementation must:
 *   1. Implement the ConnectorAdapter interface
 *   2. Call emitSignal() to push typed Signals into the mesh
 *   3. Work without real credentials (demo adapters use synthetic data)
 */

import type { Signal, SignalInput } from '@workspace/ontology';

export interface ConnectorMetadata {
  connectorId: string;
  connectorName: string;
  category: ConnectorCategory;
  version: string;
  description: string;
  synthetic: boolean;
}

export type ConnectorCategory =
  | 'email-calendar'
  | 'messaging'
  | 'crm-project'
  | 'storage-docs'
  | 'webhooks'
  | 'ais-maritime'
  | 'property-ops'
  | 'security-tools'
  | 'legal-matter';

export type ConnectorStatus = 'idle' | 'polling' | 'streaming' | 'error' | 'stopped';

export interface ConnectorAdapter {
  readonly metadata: ConnectorMetadata;
  status(): ConnectorStatus;
  start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void>;
  stop(): Promise<void>;
  poll(): Promise<Signal[]>;
}

export interface EmailCalendarConnector extends ConnectorAdapter {
  category: 'email-calendar';
  getUnreadCount(): number;
  getUpcomingMeetings(): Array<{ id: string; title: string; startAt: string; attendees: string[] }>;
}

export interface MessagingConnector extends ConnectorAdapter {
  category: 'messaging';
  getActiveAlerts(): Array<{ channel: string; message: string; sentAt: string }>;
}

export interface CrmProjectConnector extends ConnectorAdapter {
  category: 'crm-project';
  getOpenDeals(): Array<{ dealId: string; name: string; stage: string; value: number }>;
  getOverdueTasks(): Array<{ taskId: string; title: string; dueAt: string; assignee: string }>;
}

export interface StorageDocsConnector extends ConnectorAdapter {
  category: 'storage-docs';
  getRecentDocuments(): Array<{ docId: string; title: string; updatedAt: string; author: string }>;
}

export interface WebhookConnector extends ConnectorAdapter {
  category: 'webhooks';
  getReceivedEvents(): Array<{
    eventId: string;
    source: string;
    payload: Record<string, unknown>;
    receivedAt: string;
  }>;
}

export interface AISMaritimeConnector extends ConnectorAdapter {
  category: 'ais-maritime';
  getVesselPositions(): Array<{
    mmsi: string;
    imo: string;
    name: string;
    lat: number;
    lon: number;
    speed: number;
    heading: number;
    status: string;
    updatedAt: string;
  }>;
  getDarkPeriods(): Array<{
    mmsi: string;
    startedAt: string;
    durationMinutes: number;
    lat: number;
    lon: number;
  }>;
}

export interface PropertyOpsConnector extends ConnectorAdapter {
  category: 'property-ops';
  getMaintenanceAlerts(): Array<{
    propertyId: string;
    unit: string;
    issue: string;
    priority: string;
    reportedAt: string;
  }>;
  getOccupancyStatus(): Array<{ propertyId: string; occupancyPct: number; vacantUnits: number }>;
}

export interface SecurityToolsConnector extends ConnectorAdapter {
  category: 'security-tools';
  getActiveThreats(): Array<{
    threatId: string;
    name: string;
    severity: string;
    affectedAssets: string[];
    detectedAt: string;
  }>;
  getComplianceScore(): { score: number; passing: number; failing: number; lastAssessedAt: string };
}

export interface LegalMatterConnector extends ConnectorAdapter {
  category: 'legal-matter';
  getUpcomingDeadlines(): Array<{
    matterId: string;
    matterName: string;
    deadline: string;
    type: string;
  }>;
  getRetainerStatus(): Array<{
    clientId: string;
    clientName: string;
    balanceUsd: number;
    threshold: number;
  }>;
}
