/**
 * @szl-holdings/signal-mesh
 *
 * 9-stage signal pipeline and in-process signal bus.
 *
 * Usage:
 *   import { defaultPipeline, defaultSignalBus } from '@szl-holdings/signal-mesh';
 *
 *   const result = await defaultPipeline.process({
 *     source: 'connector',
 *     type: 'anomaly',
 *     domain: 'maritime',
 *     occurredAt: new Date().toISOString(),
 *     freshness: 1,
 *     confidence: 0.9,
 *     severity: 'high',
 *     entityRefs: [{ entityId: 'vessel-soltana', entityType: 'vessel' }],
 *     rawPayload: { imo: '9812347', event: 'ais_dark' },
 *     tags: ['ais', 'dark-period'],
 *   });
 */

export * from './bus.js';
export * from './pipeline.js';
export * from './postgres-bus.js';

export const SIGNAL_MESH_VERSION = '1.0.0' as const;
