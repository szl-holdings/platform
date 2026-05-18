import { describe, expect, it } from 'vitest';
import { ReceiptChain } from './chain.js';
import { StreamSession, parseSSE, streamWithReceipts } from './stream.js';
import { sha256Hex, sha256HexBytes, merkleRoot } from './index.js';

function bodyFromString(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function bodyFromChunks(parts: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(new TextEncoder().encode(p));
      controller.close();
    },
  });
}

describe('StreamSession', () => {
  it('records one receipt per chunk with paramsHash = sha256(rawBytes)', async () => {
    const chain = new ReceiptChain({ operatorId: 'op@szl' });
    const session = new StreamSession({
      chain,
      streamId: 's1',
      endpoint: '/v1/briefings/stream',
      method: 'GET',
      params: { since: 'now' },
      operatorId: 'op@szl',
    });
    const a = '{"id":"a"}';
    const b = '{"id":"b"}';
    await session.appendChunk(a);
    await session.appendChunk(b);
    const rows = session.receipts();
    expect(rows).toHaveLength(2);
    expect(rows[0]!.paramsHash).toBe(sha256Hex(a));
    expect(rows[1]!.paramsHash).toBe(sha256Hex(b));
    // Each chunk row also carries openParamsHash so verifiers can attribute it to the originating request.
    expect((rows[0]!.metadata as Record<string, unknown>).openParamsHash).toBeDefined();
    expect(rows[1]!.prevHash).toBe(rows[0]!.selfHash);
    // The chain saw them too, so chain.verify() must pass:
    expect((await chain.verify()).valid).toBe(true);
  });

  it('close() folds chunks into a StreamClosureReceipt with merkleRoot over chunk selfHashes', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const session = new StreamSession({
      chain,
      streamId: 's1',
      endpoint: '/v1/briefings/stream',
      method: 'GET',
      params: {},
      operatorId: 'op',
    });
    await session.appendChunk('chunk-0');
    await session.appendChunk('chunk-1');
    await session.appendChunk('chunk-2');
    const closure = session.close('end');
    expect(closure.streamId).toBe('s1');
    expect(closure.chainLength).toBe(3);
    expect(closure.firstSeq).toBe(0);
    expect(closure.lastSeq).toBe(2);
    expect(closure.reason).toBe('end');
    const expectedRoot = merkleRoot(session.receipts().map((r) => r.selfHash));
    expect(closure.merkleRoot).toBe(expectedRoot);
    expect(closure.selfHash).toHaveLength(64);
  });

  it('chunk tamper detection: paramsHash is byte-stable; one altered byte changes the closure', async () => {
    async function run(chunks: string[]) {
      const chain = new ReceiptChain({ operatorId: 'op' });
      const session = new StreamSession({
        chain, streamId: 's', endpoint: '/x', method: 'GET',
        params: {}, operatorId: 'op',
      });
      for (const c of chunks) await session.appendChunk(c);
      return { closure: session.close('end'), rows: session.receipts() };
    }
    const baseline = await run(['{"v":1}', '{"v":2}', '{"v":3}']);
    const same = await run(['{"v":1}', '{"v":2}', '{"v":3}']);
    const tampered = await run(['{"v":1}', '{"v":2}', '{"v":4}']);
    // paramsHash is purely a function of the chunk bytes — byte-stable across runs.
    expect(same.rows.map((r) => r.paramsHash)).toEqual(baseline.rows.map((r) => r.paramsHash));
    // Altering one chunk's bytes changes that row's paramsHash, propagating to the closure.
    expect(tampered.rows[2]!.paramsHash).not.toBe(baseline.rows[2]!.paramsHash);
    expect(tampered.closure.merkleRoot).not.toBe(baseline.closure.merkleRoot);
    expect(tampered.closure.selfHash).not.toBe(baseline.closure.selfHash);
    // Tampering with chunk[2] does NOT change chunk[0] or chunk[1]'s paramsHash —
    // tamper detection localizes the corruption.
    expect(tampered.rows[0]!.paramsHash).toBe(baseline.rows[0]!.paramsHash);
    expect(tampered.rows[1]!.paramsHash).toBe(baseline.rows[1]!.paramsHash);
  });

  it('coexists with ordinary append() — interleaved chains still verify', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    await chain.append({ endpoint: '/open', method: 'POST', params: { x: 1 } });
    const session = new StreamSession({
      chain, streamId: 's', endpoint: '/stream', method: 'GET',
      params: {}, operatorId: 'op',
    });
    await session.appendChunk('a');
    await session.appendChunk('b');
    await chain.append({ endpoint: '/after', method: 'POST', params: { y: 2 } });
    expect((await chain.verify()).valid).toBe(true);
    const all = await chain.readAll();
    expect(all).toHaveLength(4);
    expect(all.map((r) => r.seq)).toEqual([0, 1, 2, 3]);
  });
});

describe('StreamSession wire-byte fidelity', () => {
  it('hashes raw bytes — non-ASCII payloads roundtrip without normalization', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const session = new StreamSession({
      chain, streamId: 's', endpoint: '/x', method: 'GET',
      params: {}, operatorId: 'op',
    });
    const utf8 = new TextEncoder().encode('{"msg":"héllo 世界 🚀"}');
    await session.appendChunk(utf8);
    // Raw bytes containing non-UTF-8 noise hash to a different value than
    // their lossy UTF-8 string view — proves we are hashing bytes, not strings.
    const noisy = new Uint8Array([0xff, 0xfe, 0x00, 0x80]);
    await session.appendChunk(noisy);
    const rows = session.receipts();
    expect(rows[0]!.paramsHash).toBe(sha256HexBytes(utf8));
    expect(rows[1]!.paramsHash).toBe(sha256HexBytes(noisy));
    // The lossy-decode hash would be different — confirms we did not round-trip.
    const lossy = sha256Hex(new TextDecoder('utf-8', { fatal: false }).decode(noisy));
    expect(rows[1]!.paramsHash).not.toBe(lossy);
  });
});

describe('parseSSE', () => {
  it('handles CRLF line endings between fields and between frames', async () => {
    const wire = 'event: chunk\r\ndata: {"i":1}\r\n\r\nevent: chunk\r\ndata: {"i":2}\r\n\r\n';
    const body = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(new TextEncoder().encode(wire)); c.close(); },
    });
    const frames: string[] = [];
    for await (const f of parseSSE(body)) frames.push(f.data);
    expect(frames).toEqual(['{"i":1}', '{"i":2}']);
  });

  it('splits chunk frames on the blank-line separator', async () => {
    const wire = [
      'event: chunk',
      'data: {"id":"a"}',
      '',
      'event: chunk',
      'data: {"id":"b"}',
      '',
      'event: end',
      'data: {"streamId":"s1"}',
      '',
      '',
    ].join('\n');
    const frames: { event: string; data: string }[] = [];
    for await (const f of parseSSE(bodyFromString(wire))) {
      frames.push({ event: f.event, data: f.data });
    }
    expect(frames).toEqual([
      { event: 'chunk', data: '{"id":"a"}' },
      { event: 'chunk', data: '{"id":"b"}' },
      { event: 'end', data: '{"streamId":"s1"}' },
    ]);
  });

  it('handles a frame split across multiple network reads', async () => {
    const body = bodyFromChunks([
      'event: chunk\nda', 'ta: {"id":"a"}\n', '\nevent: chunk\ndata: {"id":"b"}\n\n',
    ]);
    const frames: string[] = [];
    for await (const f of parseSSE(body)) frames.push(f.data);
    expect(frames).toEqual(['{"id":"a"}', '{"id":"b"}']);
  });
});

describe('streamWithReceipts', () => {
  it('happy path: yields parsed chunks and resolves a closure with reason="end"', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const wire = [
      'event: chunk', 'data: {"i":1}', '',
      'event: chunk', 'data: {"i":2}', '',
      'event: end', 'data: {"done":true}', '', '',
    ].join('\n');
    const stream = streamWithReceipts<{ i: number }>({
      chain,
      operatorId: 'op',
      streamId: 'sx',
      endpoint: '/v1/briefings/stream',
      method: 'GET',
      params: {},
      source: parseSSE(bodyFromString(wire)),
      parseChunk: (d) => JSON.parse(d) as { i: number },
    });
    const got: { i: number }[] = [];
    for await (const c of stream) got.push(c);
    expect(got).toEqual([{ i: 1 }, { i: 2 }]);
    const closure = await stream.closure;
    expect(closure.reason).toBe('end');
    expect(closure.chainLength).toBe(2);
  });

  it('mid-stream abort: consumer break yields closure with reason="abort" and only consumed chunks', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const wire = [
      'event: chunk', 'data: {"i":1}', '',
      'event: chunk', 'data: {"i":2}', '',
      'event: chunk', 'data: {"i":3}', '',
      'event: end', 'data: {}', '', '',
    ].join('\n');
    const stream = streamWithReceipts<{ i: number }>({
      chain,
      operatorId: 'op',
      streamId: 'sx',
      endpoint: '/v1/alerts/subscribe',
      method: 'GET',
      params: {},
      source: parseSSE(bodyFromString(wire)),
      parseChunk: (d) => JSON.parse(d) as { i: number },
    });
    const got: { i: number }[] = [];
    for await (const c of stream) {
      got.push(c);
      if (got.length === 2) break;
    }
    const closure = await stream.closure;
    expect(closure.reason).toBe('abort');
    expect(closure.chainLength).toBe(2);
    expect(closure.lastSeq).toBe(1);
  });
});
