import { describe, expect, it } from 'vitest';
import {
  ingestAisi,
  ingestApollo,
  ingestArc,
  ingestEpoch,
  ingestFsf,
  ingestGpqa,
  ingestHumanEval,
  ingestMath,
  ingestMetr,
  ingestMmlu,
  ingestRsp,
  ingestSweBench,
  parseMaxPercentFraction,
} from '../ingestors';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), { status: ok ? status : status });
}
function textResponse(body: string, ok = true, status = 200): Response {
  return new Response(body, { status: ok ? status : status });
}

describe('ingestors — never throw, always return typed result', () => {
  it('METR success returns typed value', async () => {
    const res = await ingestMetr(async () => jsonResponse({ stargazers_count: 42 }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe(42);
      expect(res.sourceUrl).toMatch(/METR/);
      expect(res.fetchedAt).toMatch(/^\d{4}-/);
    }
  });

  it('METR captures HTTP errors without throwing', async () => {
    const res = await ingestMetr(async () => new Response('nope', { status: 503 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/HTTP 503/);
  });

  it('METR captures malformed payloads without throwing', async () => {
    const res = await ingestMetr(async () => jsonResponse({ stargazers_count: 'not-a-number' }));
    expect(res.ok).toBe(false);
  });

  it('METR captures network failures without throwing', async () => {
    const res = await ingestMetr(async () => {
      throw new Error('boom');
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('boom');
  });

  it('EPOCH success counts CSV data rows', async () => {
    const csv = 'name,year\nGPT-1,2018\nGPT-2,2019\nGPT-3,2020\n';
    const res = await ingestEpoch(async () => textResponse(csv));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(3);
  });

  it('EPOCH fails gracefully on empty CSV', async () => {
    const res = await ingestEpoch(async () => textResponse(''));
    expect(res.ok).toBe(false);
  });

  it('EPOCH captures fetch exceptions', async () => {
    const res = await ingestEpoch(async () => {
      throw new TypeError('network down');
    });
    expect(res.ok).toBe(false);
  });

  it('ARC success returns stargazer count', async () => {
    const res = await ingestArc(async () => jsonResponse({ stargazers_count: 1234 }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(1234);
  });

  it('ARC fails gracefully on missing field', async () => {
    const res = await ingestArc(async () => jsonResponse({ unrelated: true }));
    expect(res.ok).toBe(false);
  });
});

describe('APOLLO ingestor — scheming-eval activity index (open issues)', () => {
  it('success returns open_issues_count as a number', async () => {
    const res = await ingestApollo(async () => jsonResponse({ open_issues_count: 7 }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe(7);
      expect(res.sourceUrl).toMatch(/ApolloResearch/);
    }
  });

  it('fails on HTTP error', async () => {
    const res = await ingestApollo(async () => new Response('x', { status: 500 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/HTTP 500/);
  });

  it('fails on missing field', async () => {
    const res = await ingestApollo(async () => jsonResponse({ stargazers_count: 5 }));
    expect(res.ok).toBe(false);
  });

  it('fails on non-numeric field', async () => {
    const res = await ingestApollo(async () => jsonResponse({ open_issues_count: 'lots' }));
    expect(res.ok).toBe(false);
  });

  it('fails on negative count', async () => {
    const res = await ingestApollo(async () => jsonResponse({ open_issues_count: -1 }));
    expect(res.ok).toBe(false);
  });

  it('captures network failures', async () => {
    const res = await ingestApollo(async () => {
      throw new Error('apollo-boom');
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('apollo-boom');
  });
});

describe('AISI ingestor — Inspect framework release count (reports)', () => {
  it('success returns array length as report count', async () => {
    const releases = [{ tag_name: 'v1' }, { tag_name: 'v2' }, { tag_name: 'v3' }];
    const res = await ingestAisi(async () => jsonResponse(releases));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe(3);
      expect(res.sourceUrl).toMatch(/inspect_ai\/releases/);
    }
  });

  it('returns 0 when no releases exist', async () => {
    const res = await ingestAisi(async () => jsonResponse([]));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(0);
  });

  it('fails on HTTP error', async () => {
    const res = await ingestAisi(async () => new Response('x', { status: 502 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/HTTP 502/);
  });

  it('fails when response is not an array', async () => {
    const res = await ingestAisi(async () => jsonResponse({ message: 'rate-limit' }));
    expect(res.ok).toBe(false);
  });

  it('captures network failures', async () => {
    const res = await ingestAisi(async () => {
      throw new Error('aisi-boom');
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('aisi-boom');
  });
});

const TAG_INGESTORS = [
  { name: 'RSP', fn: ingestRsp, urlMatch: /anthropic-cookbook\/tags/ },
  { name: 'FSF', fn: ingestFsf, urlMatch: /deepmind-research\/tags/ },
] as const;

describe.each(TAG_INGESTORS)('$name ingestor — latest git tag (semver string)', ({ name, fn, urlMatch }) => {
  it(`${name} success returns the first tag name as a string`, async () => {
    const res = await fn(async () => jsonResponse([{ name: 'v1.4.2' }]));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe('v1.4.2');
      expect(typeof res.value).toBe('string');
      expect(res.sourceUrl).toMatch(urlMatch);
    }
  });

  it(`${name} fails on HTTP error`, async () => {
    const res = await fn(async () => new Response('x', { status: 503 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/HTTP 503/);
  });

  it(`${name} fails on empty tags array`, async () => {
    const res = await fn(async () => jsonResponse([]));
    expect(res.ok).toBe(false);
  });

  it(`${name} fails when tag entry lacks a name`, async () => {
    const res = await fn(async () => jsonResponse([{ commit: 'abc' }]));
    expect(res.ok).toBe(false);
  });

  it(`${name} captures network failures`, async () => {
    const res = await fn(async () => {
      throw new Error(`${name}-boom`);
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe(`${name}-boom`);
  });
});

describe('parseMaxPercentFraction — README leaderboard parser', () => {
  it('returns max percentage divided by 100', () => {
    const md = 'Baseline: 45%, GPT-3.5: 62.4%, GPT-4: 86.7%.';
    expect(parseMaxPercentFraction(md)).toBeCloseTo(0.867, 6);
  });

  it('ignores out-of-range numbers like "200%"', () => {
    expect(parseMaxPercentFraction('only 45% and 200% noise')).toBeCloseTo(0.45, 6);
  });

  it('throws when no percentages are present', () => {
    expect(() => parseMaxPercentFraction('no scores documented')).toThrow(/percentage/);
  });

  it('accepts 100% as the upper bound', () => {
    expect(parseMaxPercentFraction('saturated at 100% pass rate')).toBe(1);
  });
});

const BENCHMARK_INGESTORS = [
  { name: 'GPQA', fn: ingestGpqa, urlMatch: /idavidrein\/gpqa\/readme/ },
  { name: 'MMLU', fn: ingestMmlu, urlMatch: /hendrycks\/test\/readme/ },
  { name: 'SWE_BENCH', fn: ingestSweBench, urlMatch: /SWE-bench\/readme/ },
  { name: 'HUMANEVAL', fn: ingestHumanEval, urlMatch: /human-eval\/readme/ },
  { name: 'MATH', fn: ingestMath, urlMatch: /hendrycks\/math\/readme/ },
] as const;

describe.each(BENCHMARK_INGESTORS)('$name ingestor — README max-score fraction', ({ name, fn, urlMatch }) => {
  it(`${name} success returns a [0,1] fraction parsed from the README`, async () => {
    const readme = `# ${name}\nBaseline 25%, leading model 88.5% on the test split.`;
    const res = await fn(async () => textResponse(readme));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBeCloseTo(0.885, 6);
      expect(res.sourceUrl).toMatch(urlMatch);
    }
  });

  it(`${name} fails on HTTP error`, async () => {
    const res = await fn(async () => new Response('nope', { status: 404 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/HTTP 404/);
  });

  it(`${name} fails when README has no percentages`, async () => {
    const res = await fn(async () => textResponse('# Title\nno scores here'));
    expect(res.ok).toBe(false);
  });

  it(`${name} fails on empty README`, async () => {
    const res = await fn(async () => textResponse(''));
    expect(res.ok).toBe(false);
  });

  it(`${name} captures network failures`, async () => {
    const res = await fn(async () => {
      throw new Error(`${name}-boom`);
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe(`${name}-boom`);
  });
});
