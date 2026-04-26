import type { VoyageRow } from '@/hooks/use-vessels-data';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type VoyageExportContext = {
  voyages: VoyageRow[];
  filter: string;
  sort: string;
  totals: {
    revenue: number;
    margin: number;
    fuelCost: number;
    delayCost: number;
    avgTce: number;
    voyageCount: number;
  };
  topRoutes?:
    | Array<{
        route: string;
        voyages: number;
        totalRevenue: number;
        avgTce: number;
        avgMargin: number;
      }>
    | undefined;
};

export function exportVoyagesToCsv(ctx: VoyageExportContext): void {
  const headers = [
    'Voyage Ref',
    'Voyage ID',
    'Vessel',
    'Vessel ID',
    'Vessel Class',
    'Route',
    'Origin',
    'Destination',
    'Cargo Type',
    'Charter Type',
    'Status',
    'Distance (nm)',
    'Duration (days)',
    'Delay (h)',
    'Revenue (USD)',
    'Total Cost (USD)',
    'Fuel Cost (USD)',
    'Port Cost (USD)',
    'Delay Cost (USD)',
    'Net Margin (USD)',
    'Margin %',
    'TCE/day (USD)',
  ];
  const lines = [headers.map(csvEscape).join(',')];
  for (const v of ctx.voyages) {
    lines.push(
      [
        v.voyageRef,
        v.voyageId,
        v.vesselName,
        v.vesselId,
        v.vesselClass,
        v.route,
        v.origin,
        v.destination,
        v.cargoType,
        v.charterType,
        v.status,
        Math.round(v.distanceNm),
        Number(v.durationDays).toFixed(2),
        Math.round(v.delayHours),
        Math.round(v.estimatedRevenue),
        Math.round(v.operatingCost),
        Math.round(v.fuelCost),
        Math.round(v.portCost),
        Math.round(v.delayCost),
        Math.round(v.marginEstimate),
        (v.marginPct * 100).toFixed(2),
        Math.round(v.tce),
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  const filterTag = ctx.filter && ctx.filter !== 'all' ? `-${ctx.filter}` : '';
  const filename = `voyage-economics${filterTag}-${todayISO()}.csv`;
  downloadBlob(lines.join('\n'), 'text/csv;charset=utf-8;', filename);
}

const fmtUsd = (n: number): string => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function exportVoyagesToPdf(ctx: VoyageExportContext): void {
  const { voyages, totals, topRoutes, filter, sort } = ctx;
  const date = todayISO();
  const top10 = [...voyages]
    .sort((a, b) => (b.estimatedRevenue || 0) - (a.estimatedRevenue || 0))
    .slice(0, 10);
  const maxTopRouteRev = Math.max(1, ...(topRoutes ?? []).map((r) => r.totalRevenue));

  const filterLabel = filter === 'all' ? 'All voyages' : `Filter: ${filter}`;
  const sortLabel = `Sort: ${sort}`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Voyage Economics — ${date}</title>
<style>
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         color: #0f172a; margin: 0; padding: 24px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .meta { color: #64748b; font-size: 11px; margin-bottom: 18px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .kpi .l { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
  .kpi .v { font-size: 18px; font-weight: 700; margin-top: 4px; color: #0f172a; }
  .kpi .s { font-size: 10px; color: #64748b; margin-top: 2px; }
  h2 { font-size: 13px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #f1f5f9; }
  th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 9px;
       text-transform: uppercase; letter-spacing: 0.04em; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .bar { display: inline-block; height: 8px; background: #0ea5e9;
         border-radius: 2px; vertical-align: middle; }
  .bar-cell { width: 30%; }
  .bar-cell .bar-wrap { display: block; background: #f1f5f9; border-radius: 2px; height: 8px;
         overflow: hidden; }
  .footer { margin-top: 24px; font-size: 9px; color: #94a3b8;
            border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .pos { color: #059669; }
  .neg { color: #dc2626; }
  @media print { .noprint { display: none; } body { padding: 0; } }
  .noprint { position: fixed; top: 12px; right: 12px;
             background: #0ea5e9; color: white; padding: 8px 14px;
             border: 0; border-radius: 6px; font-size: 12px; cursor: pointer; }
</style>
</head>
<body>
  <button class="noprint" onclick="window.print()">Print / Save as PDF</button>
  <h1>Voyage Economics Report</h1>
  <div class="meta">Generated ${date} · ${filterLabel} · ${sortLabel} · ${totals.voyageCount} voyages</div>

  <div class="kpis">
    <div class="kpi"><div class="l">Fleet Revenue</div><div class="v">${fmtUsd(totals.revenue)}</div><div class="s">${totals.voyageCount} voyages</div></div>
    <div class="kpi"><div class="l">Fleet Margin</div><div class="v ${totals.margin >= 0 ? 'pos' : 'neg'}">${fmtUsd(totals.margin)}</div><div class="s">${totals.revenue > 0 ? `${((totals.margin / totals.revenue) * 100).toFixed(1)}% avg` : '—'}</div></div>
    <div class="kpi"><div class="l">Avg TCE/day</div><div class="v">${totals.avgTce > 0 ? fmtUsd(totals.avgTce) : '—'}</div><div class="s">per vessel/day</div></div>
    <div class="kpi"><div class="l">Delay Exposure</div><div class="v neg">${fmtUsd(totals.delayCost)}</div><div class="s">fleet-wide cost</div></div>
  </div>

  ${
    topRoutes && topRoutes.length > 0
      ? `<h2>Top Routes by Revenue</h2>
  <table>
    <thead><tr><th>#</th><th>Route</th><th class="num">Voyages</th><th class="num">Revenue</th><th class="bar-cell">Share</th><th class="num">Avg Margin</th></tr></thead>
    <tbody>
      ${topRoutes
        .slice(0, 10)
        .map((r, i) => {
          const pct = (r.totalRevenue / maxTopRouteRev) * 100;
          return `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(r.route)}</td>
            <td class="num">${r.voyages}</td>
            <td class="num">${fmtUsd(r.totalRevenue)}</td>
            <td class="bar-cell"><span class="bar-wrap"><span class="bar" style="width:${pct.toFixed(1)}%"></span></span></td>
            <td class="num ${r.avgMargin >= 0 ? 'pos' : 'neg'}">${fmtUsd(r.avgMargin)}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>`
      : ''
  }

  <h2>Top 10 Voyages by Revenue</h2>
  <table>
    <thead><tr>
      <th>Voyage</th><th>Vessel</th><th>Route</th><th>Status</th>
      <th class="num">Revenue</th><th class="num">Cost</th>
      <th class="num">TCE/day</th><th class="num">Margin</th>
    </tr></thead>
    <tbody>
      ${top10
        .map(
          (v) => `<tr>
        <td>${escapeHtml(v.voyageRef ?? `#${v.voyageId}`)}</td>
        <td>${escapeHtml(v.vesselName)}</td>
        <td>${escapeHtml(v.route)}</td>
        <td>${escapeHtml(v.status.replace('_', ' '))}</td>
        <td class="num">${fmtUsd(v.estimatedRevenue)}</td>
        <td class="num">${fmtUsd(v.operatingCost)}</td>
        <td class="num">${v.tce > 0 ? fmtUsd(v.tce) : '—'}</td>
        <td class="num ${v.marginEstimate >= 0 ? 'pos' : 'neg'}">${fmtUsd(v.marginEstimate)} (${(v.marginPct * 100).toFixed(1)}%)</td>
      </tr>`,
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    SZL Holdings · Vessels Maritime Intelligence · Voyage Economics Export · ${date}
  </div>
  <script>
    setTimeout(function() { window.print(); }, 250);
  </script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    // Pop-up blocked — fall back to a download of the HTML so the operator
    // can still open + print it.
    downloadBlob(html, 'text/html;charset=utf-8;', `voyage-economics-${date}.html`);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = `Voyage Economics — ${date}`;
}
