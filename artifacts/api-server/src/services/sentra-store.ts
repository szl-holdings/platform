/**
 * Sentra type definitions.
 *
 * The in-memory incident + alert stores have been migrated to the database.
 * These types are kept here for backwards compatibility with route modules
 * that import them for type annotations.
 */

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'triaging' | 'escalated' | 'contained' | 'resolved';

export interface TimelineEntry {
  id: string;
  type: 'detection' | 'system' | 'user' | 'escalation' | 'resolution';
  message: string;
  actor: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  mitreStage: string;
  detectedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  affectedAssets: string[];
  tags: string[];
  timeline: TimelineEntry[];
}

export interface Alert {
  id: string;
  title: string;
  severity: IncidentSeverity;
  source: string;
  status: 'open' | 'acknowledged' | 'suppressed';
  description: string;
  asset?: string;
  detectedAt: string;
  linkedIncidentId?: string;
}

export const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
export const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
