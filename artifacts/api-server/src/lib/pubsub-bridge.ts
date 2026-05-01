import { PubSub } from 'graphql-subscriptions';
import { publish, WS_CHANNELS } from './websocket.js';

export const pubsub = new PubSub();

export const ALLOY_EVENTS = {
  WORKFLOW_RUN_UPDATED: 'ALLOY_WORKFLOW_RUN_UPDATED',
  SIGNAL_CREATED: 'ALLOY_SIGNAL_CREATED',
  APPROVAL_REQUIRED: 'ALLOY_APPROVAL_REQUIRED',
  WORKFLOW_STATUS_CHANGED: 'ALLOY_WORKFLOW_STATUS_CHANGED',
} as const;

export const FIRESTORM_EVENTS = {
  INCIDENT_UPDATED: 'FIRESTORM_INCIDENT_UPDATED',
} as const;

export const TERRA_EVENTS = {
  DEAL_UPDATED: 'TERRA_DEAL_UPDATED',
  ACTION_ITEM_UPDATED: 'TERRA_ACTION_ITEM_UPDATED',
} as const;

export const CARLOTA_EVENTS = {
  INQUIRY_CREATED: 'CARLOTA_INQUIRY_CREATED',
} as const;

export const VESSELS_EVENTS = {
  POSITION_UPDATED: 'VESSELS_POSITION_UPDATED',
  SANCTIONS_HIT: 'VESSELS_SANCTIONS_HIT',
} as const;

export const LYTE_EVENTS = {
  INCIDENT_UPDATED: 'LYTE_INCIDENT_UPDATED',
  SIGNAL_UPDATED: 'LYTE_SIGNAL_UPDATED',
  QUEUE_CHANGED: 'LYTE_QUEUE_CHANGED',
} as const;

export type WsDomain = keyof typeof WS_CHANNEL_FOR_DOMAIN;

const WS_CHANNEL_FOR_DOMAIN = {
  'workflow-runs': WS_CHANNELS.WORKFLOW_RUNS,
  'aegis-incidents': WS_CHANNELS.AEGIS_INCIDENTS,
  'terra-signals': WS_CHANNELS.TERRA_SIGNALS,
  bookings: WS_CHANNELS.BOOKINGS,
  'vessel-positions': WS_CHANNELS.VESSEL_POSITIONS,
  'vessel-sanctions': WS_CHANNELS.VESSEL_SANCTIONS,
  'lyte-metrics': WS_CHANNELS.LYTE_METRICS,
} as const;

export function broadcastWs(domain: WsDomain, event: string, data: unknown): void {
  publish(WS_CHANNEL_FOR_DOMAIN[domain], event, data);
}
