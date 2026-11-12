export interface RetrievalBenchmarkRow {
  domain: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  throughputQps: number;
  recall: number;
  ndcg: number;
  mrr: number;
}

export interface ApiLatencyStats {
  min: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
}

export interface ApiBenchmarkRow {
  suite: string;
  succeeded: number;
  failed: number;
  invalid: number;
  latency: ApiLatencyStats | null;
  throughputPerSecond: number | null;
}

interface TableColumn<Row> {
  heading: string;
  align: 'left' | 'right';
  value: (row: Row) => string;
}

function renderTable<Row>(columns: TableColumn<Row>[], rows: Row[]): string {
  const header = `| ${columns.map((column) => column.heading).join(' | ')} |`;
  const alignment = `| ${columns
    .map((column) => (column.align === 'right' ? '---:' : '---'))
    .join(' | ')} |`;
  const body = rows.map(
    (row) => `| ${columns.map((column) => column.value(row)).join(' | ')} |`,
  );
  return [header, alignment, ...body].join('\n');
}

function fixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

function optionalFixed(value: number | null, digits: number): string {
  return value === null ? 'n/a' : fixed(value, digits);
}

export function renderRetrievalBenchmarkReport(input: {
  mode: 'fixture' | 'live';
  iterations: number;
  warmup: number;
  rows: RetrievalBenchmarkRow[];
}): string {
  const table = renderTable<RetrievalBenchmarkRow>(
    [
      { heading: 'Domain', align: 'left', value: (row) => row.domain },
      { heading: 'p50 ms', align: 'right', value: (row) => fixed(row.p50Ms, 2) },
      { heading: 'p95 ms', align: 'right', value: (row) => fixed(row.p95Ms, 2) },
      { heading: 'p99 ms', align: 'right', value: (row) => fixed(row.p99Ms, 2) },
      { heading: 'avg ms', align: 'right', value: (row) => fixed(row.avgMs, 2) },
      { heading: 'QPS', align: 'right', value: (row) => fixed(row.throughputQps, 0) },
      { heading: 'recall@k', align: 'right', value: (row) => fixed(row.recall, 3) },
      { heading: 'nDCG@k', align: 'right', value: (row) => fixed(row.ndcg, 3) },
      { heading: 'MRR', align: 'right', value: (row) => fixed(row.mrr, 3) },
    ],
    input.rows,
  );

  return [
    'AEF retrieval benchmark',
    `mode: ${input.mode}`,
    `iterations per domain: ${input.iterations}`,
    `warmup per domain: ${input.warmup}`,
    '',
    table,
    '',
  ].join('\n');
}

export function renderApiBenchmarkReport(input: {
  roundsPerSuite: number;
  rows: ApiBenchmarkRow[];
}): string {
  const table = renderTable<ApiBenchmarkRow>(
    [
      { heading: 'Suite', align: 'left', value: (row) => row.suite },
      { heading: 'Succeeded', align: 'right', value: (row) => String(row.succeeded) },
      { heading: 'Failed', align: 'right', value: (row) => String(row.failed) },
      { heading: 'Invalid', align: 'right', value: (row) => String(row.invalid) },
      {
        heading: 'min ms',
        align: 'right',
        value: (row) => optionalFixed(row.latency?.min ?? null, 2),
      },
      {
        heading: 'p50 ms',
        align: 'right',
        value: (row) => optionalFixed(row.latency?.p50 ?? null, 2),
      },
      {
        heading: 'p95 ms',
        align: 'right',
        value: (row) => optionalFixed(row.latency?.p95 ?? null, 2),
      },
      {
        heading: 'p99 ms',
        align: 'right',
        value: (row) => optionalFixed(row.latency?.p99 ?? null, 2),
      },
      {
        heading: 'max ms',
        align: 'right',
        value: (row) => optionalFixed(row.latency?.max ?? null, 2),
      },
      {
        heading: 'avg ms',
        align: 'right',
        value: (row) => optionalFixed(row.latency?.avg ?? null, 2),
      },
      {
        heading: 'throughput/s',
        align: 'right',
        value: (row) => optionalFixed(row.throughputPerSecond, 0),
      },
    ],
    input.rows,
  );

  return ['AEF API benchmark', `rounds per suite: ${input.roundsPerSuite}`, '', table, ''].join(
    '\n',
  );
}
