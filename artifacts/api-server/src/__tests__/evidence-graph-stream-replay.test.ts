/**
 * Evidence-graph SSE — reconnect replay (Task #2086)
 *
 * Verifies that GET /api/evidence-graph/stream:
 *   1. Tags each signal/recommendation event with a monotonically increasing
 *      `id:` field
 *   2. Honours `Last-Event-ID` (header) and the `?lastEventId=` query
 *      fallback by replaying any buffered events with a higher id, so
 *      Evidence Explorer doesn't miss bus activity that occurred while the
 *      socket was disconnected.
 */

import type { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../middlewares/auth', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock('../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const express = (await import('express')).default;
const http = await import('node:http');

const { defaultSignalBus } = await import('@szl-holdings/signal-mesh');
const { defaultRecommendationStore, InMemoryRecommendationStore } = await import(
  '@szl-holdings/evidence-graph'
);
const { createSignal } = await import('@workspace/ontology/signal');

const evidenceGraphModule = await import('../routes/evidence-graph');
const evidenceGraphRouter = evidenceGraphModule.default;
const { __resetEvidenceStreamBufferForTests } = evidenceGraphModule;

interface ParsedEvent {
  id?: string;
  event?: string;
  data: string;
}

/**
 * Open an SSE socket against the given URL, collect parsed events as they
 * arrive, and resolve with helpers to inspect / close the stream.
 */
function openSse(
  port: number,
  path: string,
  headers: Record<string, string> = {},
): Promise<{
  events: ParsedEvent[];
  waitFor: (predicate: (events: ParsedEvent[]) => boolean, timeoutMs?: number) => Promise<void>;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    const events: ParsedEvent[] = [];
    let buffer = '';

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        headers: { Accept: 'text/event-stream', ...headers },
      },
      (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          buffer += chunk;
          let sep = buffer.indexOf('\n\n');
          while (sep !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            sep = buffer.indexOf('\n\n');
            // Skip pure-comment frames (heartbeat ": ping").
            const lines = raw.split('\n').filter((l) => !l.startsWith(':'));
            if (lines.length === 0) continue;
            const parsed: ParsedEvent = { data: '' };
            const dataLines: string[] = [];
            for (const line of lines) {
              if (line.startsWith('id:')) parsed.id = line.slice(3).trim();
              else if (line.startsWith('event:')) parsed.event = line.slice(6).trim();
              else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
            }
            parsed.data = dataLines.join('\n');
            events.push(parsed);
          }
        });

        const waitFor = (
          predicate: (events: ParsedEvent[]) => boolean,
          timeoutMs = 2_000,
        ): Promise<void> =>
          new Promise<void>((res2, rej2) => {
            if (predicate(events)) {
              res2();
              return;
            }
            const start = Date.now();
            const interval = setInterval(() => {
              if (predicate(events)) {
                clearInterval(interval);
                res2();
              } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                rej2(
                  new Error(
                    `waitFor timed out after ${timeoutMs}ms. Events so far: ${JSON.stringify(events)}`,
                  ),
                );
              }
            }, 10);
          });

        const close = () => {
          try {
            req.destroy();
          } catch {
            /* ignore */
          }
        };

        resolve({ events, waitFor, close });
      },
    );

    req.on('error', reject);
    req.end();
  });
}

describe('evidence-graph SSE — reconnect replay (Task #2086)', () => {
  it('tags events with monotonic ids and replays missed events on reconnect', async () => {
    // Reset module state + singletons so this test is independent.
    __resetEvidenceStreamBufferForTests();
    defaultSignalBus.clear();
    defaultRecommendationStore.setBackend(new InMemoryRecommendationStore());

    const app = express();
    app.use(evidenceGraphRouter);
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;

    try {
      // ---- Connect first client and publish two signals -----------------
      const client1 = await openSse(port, '/evidence-graph/stream');

      // Wait for the initial `status` snapshot so we know the route is wired.
      await client1.waitFor((evs) => evs.some((e) => e.event === 'status'));

      const signalA = createSignal({
        source: 'system',
        type: 'anomaly',
        domain: 'security',
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: 1,
        severity: 'high',
        entityRefs: [],
        rawPayload: { marker: 'A' },
        tags: ['replay-test'],
        provenance: { sourceService: 'test', correlationId: 'A' },
      });
      defaultSignalBus.publish(signalA);

      const signalB = createSignal({
        source: 'system',
        type: 'anomaly',
        domain: 'security',
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: 1,
        severity: 'medium',
        entityRefs: [],
        rawPayload: { marker: 'B' },
        tags: ['replay-test'],
        provenance: { sourceService: 'test', correlationId: 'B' },
      });
      defaultSignalBus.publish(signalB);

      await client1.waitFor(
        (evs) => evs.filter((e) => e.event === 'signal').length >= 2,
      );

      const liveSignals = client1.events.filter((e) => e.event === 'signal');
      expect(liveSignals).toHaveLength(2);

      // Each live signal must carry a monotonically increasing id.
      const ids = liveSignals.map((e) => Number.parseInt(e.id ?? '', 10));
      expect(ids.every(Number.isFinite)).toBe(true);
      expect(ids[1]).toBeGreaterThan(ids[0]!);

      const lastSeenId = ids[1]!;
      const dataA = JSON.parse(liveSignals[0]?.data) as {
        signalId: string;
        rawPayload: { marker: string };
      };
      expect(dataA.rawPayload.marker).toBe('A');

      // ---- Simulate the socket dropping mid-flight ---------------------
      client1.close();

      // ---- Publish a signal "during" the disconnect --------------------
      const signalC = createSignal({
        source: 'system',
        type: 'anomaly',
        domain: 'security',
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: 1,
        severity: 'critical',
        entityRefs: [],
        rawPayload: { marker: 'C' },
        tags: ['replay-test'],
        provenance: { sourceService: 'test', correlationId: 'C' },
      });
      defaultSignalBus.publish(signalC);

      // ---- Reconnect with Last-Event-ID header -------------------------
      const client2 = await openSse(port, '/evidence-graph/stream', {
        'Last-Event-ID': String(lastSeenId),
      });
      await client2.waitFor((evs) => evs.some((e) => e.event === 'signal'));

      const replayed = client2.events.filter((e) => e.event === 'signal');
      expect(replayed).toHaveLength(1);
      const replayedId = Number.parseInt(replayed[0]?.id ?? '', 10);
      expect(replayedId).toBeGreaterThan(lastSeenId);
      const replayedPayload = JSON.parse(replayed[0]?.data) as {
        rawPayload: { marker: string };
      };
      expect(replayedPayload.rawPayload.marker).toBe('C');

      client2.close();

      // ---- Same behaviour via the ?lastEventId= query fallback ---------
      // (used by the Evidence Explorer client, which closes + recreates the
      // EventSource on transient errors and therefore can't rely on the
      // browser-managed Last-Event-ID header.)
      const signalD = createSignal({
        source: 'system',
        type: 'anomaly',
        domain: 'security',
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: 1,
        severity: 'low',
        entityRefs: [],
        rawPayload: { marker: 'D' },
        tags: ['replay-test'],
        provenance: { sourceService: 'test', correlationId: 'D' },
      });
      defaultSignalBus.publish(signalD);

      const client3 = await openSse(
        port,
        `/evidence-graph/stream?lastEventId=${replayedId}`,
      );
      await client3.waitFor((evs) => evs.some((e) => e.event === 'signal'));
      const replayed3 = client3.events.filter((e) => e.event === 'signal');
      expect(replayed3).toHaveLength(1);
      const replayed3Payload = JSON.parse(replayed3[0]?.data) as {
        rawPayload: { marker: string };
      };
      expect(replayed3Payload.rawPayload.marker).toBe('D');

      client3.close();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      __resetEvidenceStreamBufferForTests();
      defaultSignalBus.clear();
    }
  }, 15_000);
});
