import { ClientTelemetryCollector, ServerTelemetryCollector } from '@workspace/observability';
import { beforeEach, describe, expect, it } from 'vitest';

describe('ServerTelemetryCollector', () => {
  let collector: ServerTelemetryCollector;

  beforeEach(() => {
    collector = new ServerTelemetryCollector();
  });

  function makeRequest(path: string, method: string, statusCode: number, responseTime: number) {
    return { path, method, statusCode, responseTime, timestamp: Date.now() };
  }

  it('starts with zeroed snapshot', () => {
    const snap = collector.getSnapshot();
    expect(snap.requestCount).toBe(0);
    expect(snap.errorRate).toBe(0);
    expect(snap.p95Latency).toBe(0);
  });

  it('records a request and updates counts', () => {
    collector.recordRequest(makeRequest('/api/health', 'GET', 200, 15));
    const snap = collector.getSnapshot();
    expect(snap.requestCount).toBe(1);
    expect(snap.errorRate).toBe(0);
  });

  it('tracks error rate for 5xx responses', () => {
    collector.recordRequest(makeRequest('/api/data', 'GET', 200, 10));
    collector.recordRequest(makeRequest('/api/data', 'GET', 500, 50));
    const snap = collector.getSnapshot();
    expect(snap.requestCount).toBe(2);
    expect(snap.errorRate).toBe(50);
  });

  it('getSnapshot returns consistent structure', () => {
    const snap = collector.getSnapshot();
    expect(snap).toHaveProperty('requestCount');
    expect(snap).toHaveProperty('errorRate');
    expect(snap).toHaveProperty('p95Latency');
    expect(snap).toHaveProperty('activeAlerts');
    expect(snap).toHaveProperty('avgResponseTime');
    expect(snap).toHaveProperty('p50Latency');
    expect(snap).toHaveProperty('p99Latency');
    expect(snap).toHaveProperty('throughputPerHour');
    expect(snap).toHaveProperty('uptimeSeconds');
    expect(snap).toHaveProperty('dbLatency');
    expect(typeof snap.requestCount).toBe('number');
    expect(typeof snap.errorRate).toBe('number');
  });

  it('tracks database latency structure', () => {
    const snap = collector.getSnapshot();
    expect(snap.dbLatency).toHaveProperty('p50');
    expect(snap.dbLatency).toHaveProperty('p95');
    expect(snap.dbLatency).toHaveProperty('slowQueryCount');
    expect(snap.dbLatency).toHaveProperty('sampleCount');
  });
});

describe('ClientTelemetryCollector', () => {
  let collector: ClientTelemetryCollector;

  beforeEach(() => {
    collector = new ClientTelemetryCollector();
  });

  it('can be instantiated', () => {
    expect(collector).toBeDefined();
    expect(collector).toBeInstanceOf(ClientTelemetryCollector);
  });

  it('records vitals without throwing', () => {
    expect(() => {
      collector.recordVitals({
        appSlug: 'test',
        lcp: 100,
        fid: 10,
        cls: 0.05,
        timestamp: Date.now(),
      });
    }).not.toThrow();
  });
});
