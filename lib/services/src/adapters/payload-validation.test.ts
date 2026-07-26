import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { parseStixBundle, parseTaxiiCollections, parseTaxiiDiscovery } from './misp-taxii.js';
import {
  parseNewRelicAlertConditions,
  parseNewRelicApmResults,
  parseNewRelicErrors,
  parseNewRelicHostCountResults,
  parseNewRelicInfraResults,
} from './new-relic.js';
import { parseNvdHealth, parseNvdResponse } from './nvd.js';
import {
  expectRecord,
  optionalNullableNumber,
  optionalNumber,
  UpstreamPayloadError,
} from './payload-validation.js';

describe('upstream payload boundary validation', () => {
  it('rejects non-object payload roots', () => {
    assert.throws(() => expectRecord(null, 'payload'), UpstreamPayloadError);
    assert.throws(() => expectRecord([], 'payload'), UpstreamPayloadError);
  });

  it('rejects non-finite and non-number fields', () => {
    assert.throws(() => optionalNumber({ value: '1' }, 'value', 'payload'), UpstreamPayloadError);
    assert.throws(
      () => optionalNumber({ value: Number.NaN }, 'value', 'payload'),
      UpstreamPayloadError,
    );
  });
});

describe('MISP and TAXII payloads', () => {
  it('parses a valid discovery document', () => {
    assert.deepEqual(
      parseTaxiiDiscovery({
        title: 'Feed',
        api_roots: ['https://example.test/taxii2'],
      }),
      {
        title: 'Feed',
        api_roots: ['https://example.test/taxii2'],
      },
    );
  });

  it('rejects malformed discovery roots', () => {
    assert.throws(() => parseTaxiiDiscovery({ api_roots: [7] }), UpstreamPayloadError);
  });

  it('rejects malformed collection fields', () => {
    assert.throws(
      () => parseTaxiiCollections({ collections: [{ can_read: 'yes' }] }),
      UpstreamPayloadError,
    );
  });

  it('rejects malformed nested STIX phases', () => {
    assert.throws(
      () =>
        parseStixBundle({
          objects: [{ type: 'indicator', kill_chain_phases: ['delivery'] }],
        }),
      UpstreamPayloadError,
    );
  });
});

describe('New Relic payloads', () => {
  it('parses numeric NRQL application metrics', () => {
    assert.deepEqual(
      parseNewRelicApmResults({
        data: {
          actor: {
            account: {
              nrql: {
                results: [
                  {
                    responseTimeMs: 12,
                    throughputRpm: 34,
                    errorRatePct: 0.4,
                    apdexScore: 0.97,
                  },
                ],
              },
            },
          },
        },
      }),
      [
        {
          responseTimeMs: 12,
          throughputRpm: 34,
          errorRatePct: 0.4,
          apdexScore: 0.97,
        },
      ],
    );
  });

  it('treats null NRQL aggregates as absent and preserves numeric fallbacks', () => {
    assert.equal(optionalNullableNumber({ value: null }, 'value', 'payload'), undefined);
    assert.throws(
      () => optionalNullableNumber({ value: '1' }, 'value', 'payload'),
      UpstreamPayloadError,
    );
    assert.throws(
      () => optionalNullableNumber({ value: Number.NaN }, 'value', 'payload'),
      UpstreamPayloadError,
    );

    const apmPayload = {
      data: {
        actor: {
          account: {
            nrql: {
              results: [
                {
                  responseTimeMs: null,
                  throughputRpm: null,
                  errorRatePct: null,
                  apdexScore: null,
                },
              ],
            },
          },
        },
      },
    };
    assert.deepEqual(parseNewRelicApmResults(apmPayload), [
      {
        responseTimeMs: undefined,
        throughputRpm: undefined,
        errorRatePct: undefined,
        apdexScore: undefined,
      },
    ]);

    const hostPayload = {
      data: {
        actor: {
          account: {
            nrql: { results: [{ hostCount: null, instanceCount: null }] },
          },
        },
      },
    };
    assert.deepEqual(parseNewRelicHostCountResults(hostPayload), [
      { hostCount: undefined, instanceCount: undefined },
    ]);

    const infraPayload = {
      data: {
        actor: {
          account: {
            nrql: {
              results: [
                {
                  facet: 'host-1',
                  cpuPct: null,
                  memoryUsedPct: null,
                  diskUsedPct: null,
                  networkReceiveBytesPerSec: null,
                  networkTransmitBytesPerSec: null,
                  fullestDiskPct: null,
                },
              ],
            },
          },
        },
      },
    };
    assert.deepEqual(parseNewRelicInfraResults(infraPayload), [
      {
        facet: 'host-1',
        cpuPct: undefined,
        memoryUsedPct: undefined,
        diskUsedPct: undefined,
        networkReceiveBytesPerSec: undefined,
        networkTransmitBytesPerSec: undefined,
        fullestDiskPct: undefined,
      },
    ]);
  });

  it('rejects malformed nullable NRQL aggregate values', () => {
    assert.throws(
      () =>
        parseNewRelicApmResults({
          data: {
            actor: {
              account: {
                nrql: { results: [{ responseTimeMs: '12' }] },
              },
            },
          },
        }),
      UpstreamPayloadError,
    );
  });

  it('rejects malformed NRQL result collections', () => {
    assert.throws(
      () =>
        parseNewRelicApmResults({
          data: {
            actor: { account: { nrql: { results: 'not-an-array' } } },
          },
        }),
      UpstreamPayloadError,
    );
  });

  it('rejects malformed GraphQL errors', () => {
    assert.throws(() => parseNewRelicErrors({ errors: [{ message: 7 }] }), UpstreamPayloadError);
  });

  it('rejects malformed nested alert thresholds', () => {
    assert.throws(
      () =>
        parseNewRelicAlertConditions({
          data: {
            actor: {
              account: {
                alerts: {
                  nrqlConditionsSearch: {
                    nrqlConditions: [
                      {
                        id: 'condition-1',
                        terms: [{ priority: 'CRITICAL', threshold: 'high' }],
                      },
                    ],
                  },
                },
              },
            },
          },
        }),
      UpstreamPayloadError,
    );
  });
});

describe('NVD payloads', () => {
  it('accepts a valid zero-result health response', () => {
    assert.equal(parseNvdHealth({ totalResults: 0 }), 0);
  });

  it('parses a minimal valid CVE response', () => {
    assert.deepEqual(
      parseNvdResponse({
        totalResults: 1,
        resultsPerPage: 1,
        startIndex: 0,
        vulnerabilities: [
          {
            cve: {
              id: 'CVE-2026-0001',
              descriptions: [{ lang: 'en', value: 'Example' }],
            },
          },
        ],
      }),
      {
        totalResults: 1,
        resultsPerPage: 1,
        startIndex: 0,
        vulnerabilities: [
          {
            cve: {
              id: 'CVE-2026-0001',
              sourceIdentifier: undefined,
              published: undefined,
              lastModified: undefined,
              vulnStatus: undefined,
              descriptions: [{ lang: 'en', value: 'Example' }],
              metrics: undefined,
              weaknesses: undefined,
              references: undefined,
            },
          },
        ],
      },
    );
  });

  it('rejects malformed NVD summary fields', () => {
    assert.throws(() => parseNvdHealth({ totalResults: '0' }), UpstreamPayloadError);
  });

  it('rejects malformed nested CVE descriptions', () => {
    assert.throws(
      () =>
        parseNvdResponse({
          vulnerabilities: [{ cve: { descriptions: [{ lang: 'en', value: 42 }] } }],
        }),
      UpstreamPayloadError,
    );
  });

  it('rejects non-array CVE descriptions', () => {
    assert.throws(
      () =>
        parseNvdResponse({
          vulnerabilities: [{ cve: { descriptions: 'not-an-array' } }],
        }),
      UpstreamPayloadError,
    );
  });
});
