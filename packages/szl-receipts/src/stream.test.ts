import { describe, expect, it } from 'vitest';
import { ReceiptChain } from './chain.js';
import { StreamSession, parseSSE, streamWithReceipts, sha256Hex } from './index.js';

describe('StreamSession', () => {
  it('records one receipt per chunk with paramsHash = sha256(chunk bytes)', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const session = new StreamSession({
      chain,
      streamId: 's1',
      endpoint: '/v1/briefings/stream',
      method: 'GET',
      params: {},
      operatorId: 'op',
    });
    const chunks = ['hello', 'world', '{"x":1}'];
    for (const c of chunks) await session.appendChunk(c);
    const all = await chain.readAll();
    expect(all).toHaveLength(3);
    for (let i = 0; i < chunks.length; i++) {
      expect(all[i]!.paramsHash).toBe(sha256Hex(chunks[i]!));
      expect(all[i]!.metadata).toMatchObject({ streamId: 's1', chunkIndex: i, kind: 'stream-chunk' });
    }
    const closure = session.close('end');
    expect(closure.chainLength).toBe(3);
    expect(closure.streamId).toBe('s1');
    expect(closure.reason).toBe('end');
    expect(closure.firstSeq).toBe(0);
    expect(closure.lastSeq).toBe(2);
  });

  it('any byte-level tamper of a chunk changes the closure merkle root', async () => {
    async function runStream(chunks: string[]) {
      const chain = new ReceiptChain({ operatorId: 'op' });
      const session = new StreamSession({
        chain, streamId: 's', endpoint: '/e', method: 'GET', params: {}, operatorId: 'op',
      });
      for (const c of chunks) await session.appendChunk(c);
      return session.close('end');
    }
    const original = await runStream(['{"id":"a"}', '{"id":"b"}', '{"id":"c"}']);
    const tampered = await runStream(['{"id":"a"}', '{"id":"B"}', '{"id":"c"}']);
    expect(original.merkleRoot).not.toBe(tampered.merkleRoot);
    expect(original.selfHash).not.toBe(tampered.selfHash);
  });

  it('closure with zero chunks is valid and uses zero hashes', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const session = new StreamSession({
      chain, streamId: 's', endpoint: '/e', method: 'GET', params: {}, operatorId: 'op',
    });
    const c = session.close('end');
    expect(c.chainLength).toBe(0);
    expect(c.firstReceiptHash).toBe('0'.repeat(64));
    expect(c.lastReceiptHash).toBe('0'.repeat(64));
  });

  it('rejects appending after close', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const s = new StreamSession({
      chain, streamId: 's', endpoint: '/e', method: 'GET', params: {}, operatorId: 'op',
    });
    s.close('end');
    await expect(s.appendChunk('x')).rejects.toThrow(/closed/);
  });

  it('chain.verify() passes when stream-chunks are interleaved with regular appends', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    await chain.append({ endpoint: '/v1/open', method: 'POST', params: { q: 'k' } });
    const s = new StreamSession({
      chain, streamId: 's', endpoint: '/v1/stream', method: 'GET', params: {}, operatorId: 'op',
    });
    await s.appendChunk('chunk-1');
    await s.appendChunk('chunk-2');
    await chain.append({ endpoint: '/v1/other', method: 'POST', params: {} });
    const v = await chain.verify();
    expect(v.valid).toBe(true);
  });
});

describe('parseSSE', () => {
  function streamOf(s: string): ReadableStream<Uint8Array> {
    const bytes = new TextEncoder().encode(s);
    return new ReadableStream({
      start(controller) {
        // Push in two slices to exercise the buffering path
        const mid = Math.floor(bytes.length / 2);
        controller.enqueue(bytes.slice(0, mid));
        controller.enqueue(bytes.slice(mid));
        controller.close();
      },
    });
  }

  it('yields one frame per event/data block', async () => {
    const body = streamOf(
      'event: chunk\ndata: {"id":"1"}\n\nevent: chunk\ndata: {"id":"2"}\n\nevent: end\ndata: {}\n\n',
    );
    const frames: { event: string; data: string }[] = [];
    for await (const f of parseSSE(body)) frames.push({ event: f.event, data: f.data });
    expect(frames).toEqual([
      { event: 'chunk', data: '{"id":"1"}' },
      { event: 'chunk', data: '{"id":"2"}' },
      { event: 'end', data: '{}' },
    ]);
  });

  it('rawBytes round-trips the data exactly', async () => {
    const body = streamOf('event: chunk\ndata: hello-world\n\n');
    const frames = [];
    for await (const f of parseSSE(body)) frames.push(f);
    expect(new TextDecoder().decode(frames[0]!.rawBytes)).toBe('hello-world');
  });
});

describe('streamWithReceipts', () => {
  async function* sseSource(items: { event: string; data: string }[]) {
    for (const i of items) {
      yield { event: i.event, data: i.data, rawBytes: new TextEncoder().encode(i.data) };
    }
  }

  it('happy path: yields parsed chunks and resolves a closure over them', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const items = [
      { event: 'chunk', data: '{"v":1}' },
      { event: 'chunk', data: '{"v":2}' },
      { event: 'end', data: '{}' },
    ];
    const stream = streamWithReceipts<{ v: number }>({
      chain, operatorId: 'op', streamId: 'sid', endpoint: '/e', method: 'GET',
      params: {}, source: sseSource(items), parseChunk: (d) => JSON.parse(d),
    });
    const out: { v: number }[] = [];
    for await (const c of stream) out.push(c);
    expect(out).toEqual([{ v: 1 }, { v: 2 }]);
    const closure = await stream.closure;
    expect(closure.chainLength).toBe(2);
    expect(closure.reason).toBe('end');
  });

  it('mid-stream abort: breaking the loop produces a closure with reason="abort"', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const items = [
      { event: 'chunk', data: 'a' },
      { event: 'chunk', data: 'b' },
      { event: 'chunk', data: 'c' },
      { event: 'end', data: '{}' },
    ];
    const stream = streamWithReceipts<string>({
      chain, operatorId: 'op', streamId: 'sid', endpoint: '/e', method: 'GET',
      params: {}, source: sseSource(items), parseChunk: (d) => d,
    });
    const out: string[] = [];
    for await (const c of stream) {
      out.push(c);
      if (out.length === 2) break;
    }
    const closure = await stream.closure;
    expect(out).toEqual(['a', 'b']);
    expect(closure.reason).toBe('abort');
    expect(closure.chainLength).toBe(2);
  });
});
