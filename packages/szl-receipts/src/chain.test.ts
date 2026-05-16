import { describe, expect, it } from 'vitest';
import { ReceiptChain, hashJson, merkleRoot, canonicalJson, sha256Hex } from './index.js';

describe('canonicalJson', () => {
  it('produces the same string for objects with reordered keys', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });
  it('canonicalizes nested objects', () => {
    expect(canonicalJson({ a: { y: 2, x: 1 } })).toBe('{"a":{"x":1,"y":2}}');
  });
});

describe('hashJson', () => {
  it('is stable under key reordering', () => {
    expect(hashJson({ b: 1, a: 2, c: { z: 1, y: 2 } })).toBe(
      hashJson({ a: 2, c: { y: 2, z: 1 }, b: 1 }),
    );
  });
});

describe('merkleRoot', () => {
  it('returns zero-hash for empty input', () => {
    expect(merkleRoot([])).toBe('0'.repeat(64));
  });
  it('returns the single leaf for one input', () => {
    const h = sha256Hex('x');
    expect(merkleRoot([h])).toBe(h);
  });
  it('changes when a leaf changes', () => {
    const a = merkleRoot([sha256Hex('1'), sha256Hex('2'), sha256Hex('3')]);
    const b = merkleRoot([sha256Hex('1'), sha256Hex('2'), sha256Hex('4')]);
    expect(a).not.toBe(b);
  });
});

describe('ReceiptChain', () => {
  it('links receipts via prevHash and verifies', async () => {
    const chain = new ReceiptChain({ operatorId: 'op@szl' });
    const r0 = await chain.append({ endpoint: '/v1/x', method: 'POST', params: { a: 1 } });
    const r1 = await chain.append({ endpoint: '/v1/y', method: 'POST', params: { b: 2 } });
    expect(r0.seq).toBe(0);
    expect(r0.prevHash).toBe('0'.repeat(64));
    expect(r1.seq).toBe(1);
    expect(r1.prevHash).toBe(r0.selfHash);
    const v = await chain.verify();
    expect(v.valid).toBe(true);
  });

  it('paramsHash equals hashJson(params)', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    const params = { z: 9, a: 1 };
    const r = await chain.append({ endpoint: '/v1/p', method: 'POST', params });
    expect(r.paramsHash).toBe(hashJson(params));
  });

  it('close() returns a sealed AuditClosureReceipt and blocks future appends', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    await chain.append({ endpoint: '/a', method: 'POST', params: { a: 1 } });
    await chain.append({ endpoint: '/b', method: 'POST', params: { b: 2 } });
    const closure = await chain.close();
    expect(closure.chainLength).toBe(2);
    expect(closure.merkleRoot).toBe(await chain.merkleRoot());
    expect(closure.selfHash).toHaveLength(64);
    await expect(
      chain.append({ endpoint: '/c', method: 'POST', params: {} }),
    ).rejects.toThrow(/closed/);
  });

  it('detects tampering via verify()', async () => {
    const chain = new ReceiptChain({ operatorId: 'op' });
    await chain.append({ endpoint: '/a', method: 'POST', params: { a: 1 } });
    await chain.append({ endpoint: '/b', method: 'POST', params: { b: 2 } });
    const all = await chain.readAll();
    all[1]!.paramsHash = 'tampered';
    const v = await chain.verify();
    expect(v.valid).toBe(false);
  });
});
