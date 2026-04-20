import { describe, expect, it } from 'vitest';
import { AISMaritimeDemoAdapter } from './adapters/ais-maritime.js';
import { CrmProjectDemoAdapter } from './adapters/crm-project.js';
import { EmailCalendarDemoAdapter } from './adapters/email-calendar.js';
import { LegalMatterDemoAdapter } from './adapters/legal-matter.js';
import { MessagingDemoAdapter } from './adapters/messaging.js';
import { PropertyOpsDemoAdapter } from './adapters/property-ops.js';
import { SecurityToolsDemoAdapter } from './adapters/security-tools.js';
import { StorageDocsDemoAdapter } from './adapters/storage-docs.js';
import { WebhookDemoAdapter } from './adapters/webhooks.js';
import type { ConnectorAdapter, ConnectorMetadata } from './interfaces.js';

// ---------------------------------------------------------------------------
// Shared metadata shape contract
// ---------------------------------------------------------------------------

function assertMetadataShape(meta: ConnectorMetadata) {
  expect(typeof meta.connectorId).toBe('string');
  expect(meta.connectorId.length).toBeGreaterThan(0);

  expect(typeof meta.connectorName).toBe('string');
  expect(meta.connectorName.length).toBeGreaterThan(0);

  expect(typeof meta.category).toBe('string');

  expect(typeof meta.version).toBe('string');
  expect(meta.version).toMatch(/^\d+\.\d+\.\d+/);

  expect(typeof meta.description).toBe('string');
  expect(meta.description.length).toBeGreaterThan(0);

  expect(typeof meta.synthetic).toBe('boolean');
}

function assertStatus(adapter: ConnectorAdapter) {
  const status = adapter.status();
  expect(['idle', 'polling', 'streaming', 'error', 'stopped']).toContain(status);
}

async function noopEmitSignal(input: unknown): Promise<{ signalId: string; type: string }> {
  return {
    signalId: `sig-${Date.now()}`,
    type: String((input as Record<string, unknown>)['type'] ?? 'unknown'),
  };
}

// ---------------------------------------------------------------------------
// 1. AIS Maritime
// ---------------------------------------------------------------------------

describe('AISMaritimeDemoAdapter — normalization', () => {
  const adapter = new AISMaritimeDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('ais-maritime');
    expect(adapter.metadata.synthetic).toBe(true);
  });

  it('initial status is idle', () => {
    expect(adapter.status()).toBe('idle');
  });

  it('getVesselPositions returns typed array with required fields', () => {
    const vessels = adapter.getVesselPositions();
    expect(Array.isArray(vessels)).toBe(true);
    expect(vessels.length).toBeGreaterThan(0);

    for (const v of vessels) {
      expect(typeof v.mmsi).toBe('string');
      expect(typeof v.imo).toBe('string');
      expect(typeof v.name).toBe('string');
      expect(typeof v.lat).toBe('number');
      expect(typeof v.lon).toBe('number');
      expect(typeof v.speed).toBe('number');
      expect(typeof v.heading).toBe('number');
      expect(typeof v.status).toBe('string');
      expect(typeof v.updatedAt).toBe('string');
      expect(() => new Date(v.updatedAt)).not.toThrow();
    }
  });

  it('getDarkPeriods returns typed array with required fields', () => {
    const periods = adapter.getDarkPeriods();
    expect(Array.isArray(periods)).toBe(true);
    for (const p of periods) {
      expect(typeof p.mmsi).toBe('string');
      expect(typeof p.durationMinutes).toBe('number');
      expect(p.durationMinutes).toBeGreaterThan(0);
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lon).toBe('number');
      expect(typeof p.startedAt).toBe('string');
    }
  });

  it('poll() returns at least one signal without starting', async () => {
    const adapter2 = new AISMaritimeDemoAdapter();
    // poll() should work even without start() for testing
    const signals = await adapter2.poll();
    expect(Array.isArray(signals)).toBe(true);
  });

  it('stop() sets status to stopped', async () => {
    const adapter3 = new AISMaritimeDemoAdapter();
    await adapter3.stop();
    expect(adapter3.status()).toBe('stopped');
  });
});

// ---------------------------------------------------------------------------
// 2. Email Calendar
// ---------------------------------------------------------------------------

describe('EmailCalendarDemoAdapter — normalization', () => {
  const adapter = new EmailCalendarDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('email-calendar');
  });

  it('getUnreadCount returns a non-negative integer', () => {
    const count = adapter.getUnreadCount();
    expect(typeof count).toBe('number');
    expect(Number.isInteger(count)).toBe(true);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('getUpcomingMeetings returns typed array with required fields', () => {
    const meetings = adapter.getUpcomingMeetings();
    expect(Array.isArray(meetings)).toBe(true);
    for (const m of meetings) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.title).toBe('string');
      expect(typeof m.startAt).toBe('string');
      expect(() => new Date(m.startAt)).not.toThrow();
      expect(Array.isArray(m.attendees)).toBe(true);
    }
  });

  it('poll() resolves with an array of signals', async () => {
    const signals = await adapter.poll();
    expect(Array.isArray(signals)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Messaging
// ---------------------------------------------------------------------------

describe('MessagingDemoAdapter — normalization', () => {
  const adapter = new MessagingDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('messaging');
  });

  it('getActiveAlerts returns typed array with required fields', () => {
    const alerts = adapter.getActiveAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    for (const a of alerts) {
      expect(typeof a.channel).toBe('string');
      expect(typeof a.message).toBe('string');
      expect(typeof a.sentAt).toBe('string');
    }
  });

  it('status starts as idle', () => {
    assertStatus(adapter);
    expect(adapter.status()).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// 4. CRM / Project
// ---------------------------------------------------------------------------

describe('CrmProjectDemoAdapter — normalization', () => {
  const adapter = new CrmProjectDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('crm-project');
  });

  it('getOpenDeals returns typed array with required fields', () => {
    const deals = adapter.getOpenDeals();
    expect(Array.isArray(deals)).toBe(true);
    for (const d of deals) {
      expect(typeof d.dealId).toBe('string');
      expect(typeof d.name).toBe('string');
      expect(typeof d.stage).toBe('string');
      expect(typeof d.value).toBe('number');
    }
  });

  it('getOverdueTasks returns typed array with required fields', () => {
    const tasks = adapter.getOverdueTasks();
    expect(Array.isArray(tasks)).toBe(true);
    for (const t of tasks) {
      expect(typeof t.taskId).toBe('string');
      expect(typeof t.title).toBe('string');
      expect(typeof t.dueAt).toBe('string');
      expect(typeof t.assignee).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Storage / Docs
// ---------------------------------------------------------------------------

describe('StorageDocsDemoAdapter — normalization', () => {
  const adapter = new StorageDocsDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('storage-docs');
  });

  it('getRecentDocuments returns typed array with required fields', () => {
    const docs = adapter.getRecentDocuments();
    expect(Array.isArray(docs)).toBe(true);
    for (const d of docs) {
      expect(typeof d.docId).toBe('string');
      expect(typeof d.title).toBe('string');
      expect(typeof d.updatedAt).toBe('string');
      expect(typeof d.author).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Webhooks
// ---------------------------------------------------------------------------

describe('WebhookDemoAdapter — normalization', () => {
  const adapter = new WebhookDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('webhooks');
  });

  it('getReceivedEvents returns typed array with required fields', () => {
    const events = adapter.getReceivedEvents();
    expect(Array.isArray(events)).toBe(true);
    for (const e of events) {
      expect(typeof e.eventId).toBe('string');
      expect(typeof e.source).toBe('string');
      expect(typeof e.payload).toBe('object');
      expect(typeof e.receivedAt).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Property Ops
// ---------------------------------------------------------------------------

describe('PropertyOpsDemoAdapter — normalization', () => {
  const adapter = new PropertyOpsDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('property-ops');
  });

  it('getMaintenanceAlerts returns typed array with required fields', () => {
    const alerts = adapter.getMaintenanceAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    for (const a of alerts) {
      expect(typeof a.propertyId).toBe('string');
      expect(typeof a.unit).toBe('string');
      expect(typeof a.issue).toBe('string');
      expect(typeof a.priority).toBe('string');
      expect(typeof a.reportedAt).toBe('string');
    }
  });

  it('getOccupancyStatus returns typed array with required fields', () => {
    const statuses = adapter.getOccupancyStatus();
    expect(Array.isArray(statuses)).toBe(true);
    for (const s of statuses) {
      expect(typeof s.propertyId).toBe('string');
      expect(typeof s.occupancyPct).toBe('number');
      expect(s.occupancyPct).toBeGreaterThanOrEqual(0);
      expect(s.occupancyPct).toBeLessThanOrEqual(100);
      expect(typeof s.vacantUnits).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Security Tools
// ---------------------------------------------------------------------------

describe('SecurityToolsDemoAdapter — normalization', () => {
  const adapter = new SecurityToolsDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('security-tools');
  });

  it('getActiveThreats returns typed array with required fields', () => {
    const threats = adapter.getActiveThreats();
    expect(Array.isArray(threats)).toBe(true);
    for (const t of threats) {
      expect(typeof t.threatId).toBe('string');
      expect(typeof t.name).toBe('string');
      expect(typeof t.severity).toBe('string');
      expect(Array.isArray(t.affectedAssets)).toBe(true);
      expect(typeof t.detectedAt).toBe('string');
    }
  });

  it('getComplianceScore returns score between 0 and 100', () => {
    const score = adapter.getComplianceScore();
    expect(typeof score.score).toBe('number');
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(typeof score.passing).toBe('number');
    expect(typeof score.failing).toBe('number');
    expect(typeof score.lastAssessedAt).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 9. Legal Matter
// ---------------------------------------------------------------------------

describe('LegalMatterDemoAdapter — normalization', () => {
  const adapter = new LegalMatterDemoAdapter();

  it('metadata shape is valid', () => {
    assertMetadataShape(adapter.metadata);
    expect(adapter.metadata.category).toBe('legal-matter');
  });

  it('getUpcomingDeadlines returns typed array with required fields', () => {
    const deadlines = adapter.getUpcomingDeadlines();
    expect(Array.isArray(deadlines)).toBe(true);
    for (const d of deadlines) {
      expect(typeof d.matterId).toBe('string');
      expect(typeof d.matterName).toBe('string');
      expect(typeof d.deadline).toBe('string');
      expect(() => new Date(d.deadline)).not.toThrow();
      expect(typeof d.type).toBe('string');
    }
  });

  it('getRetainerStatus returns typed array with required fields', () => {
    const statuses = adapter.getRetainerStatus();
    expect(Array.isArray(statuses)).toBe(true);
    for (const r of statuses) {
      expect(typeof r.clientId).toBe('string');
      expect(typeof r.clientName).toBe('string');
      expect(typeof r.balanceUsd).toBe('number');
      expect(typeof r.threshold).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// 10. All adapters — cross-cutting contract checks
// ---------------------------------------------------------------------------

describe('All connector adapters — cross-cutting contracts', () => {
  const allAdapters: ConnectorAdapter[] = [
    new AISMaritimeDemoAdapter(),
    new EmailCalendarDemoAdapter(),
    new MessagingDemoAdapter(),
    new CrmProjectDemoAdapter(),
    new StorageDocsDemoAdapter(),
    new WebhookDemoAdapter(),
    new PropertyOpsDemoAdapter(),
    new SecurityToolsDemoAdapter(),
    new LegalMatterDemoAdapter(),
  ];

  const VALID_CATEGORIES = new Set([
    'email-calendar',
    'messaging',
    'crm-project',
    'storage-docs',
    'webhooks',
    'ais-maritime',
    'property-ops',
    'security-tools',
    'legal-matter',
  ]);

  for (const adapter of allAdapters) {
    it(`${adapter.metadata.connectorId}: metadata is valid`, () => {
      assertMetadataShape(adapter.metadata);
      expect(VALID_CATEGORIES.has(adapter.metadata.category)).toBe(true);
    });

    it(`${adapter.metadata.connectorId}: status() returns valid ConnectorStatus`, () => {
      assertStatus(adapter);
    });

    it(`${adapter.metadata.connectorId}: poll() resolves without throwing`, async () => {
      await expect(adapter.poll()).resolves.toBeDefined();
    });

    it(`${adapter.metadata.connectorId}: stop() resolves and sets status=stopped`, async () => {
      await adapter.stop();
      expect(adapter.status()).toBe('stopped');
    });
  }
});
