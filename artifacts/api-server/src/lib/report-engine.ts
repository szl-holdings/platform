/**
 * Industrial Report Engine
 * Composable template engine with brand system integration, chart data rendering,
 * and multi-domain template library. Produces executive-quality deliverables.
 */
import PDFDocument from 'pdfkit';

// ─── Brand System ─────────────────────────────────────────────────────────────

export type BrandTheme =
  | 'szl'
  | 'carlota'
  | 'aegis'
  | 'terra'
  | 'vessels'
  | 'lyte'
  | 'prism'
  | 'neutral';

export interface BrandColors {
  bg: string;
  surface: string;
  border: string;
  primary: string;
  primaryLight: string;
  text: string;
  muted: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  headerTag: string;
}

export const BRAND_THEMES: Record<BrandTheme, BrandColors> = {
  szl: {
    bg: '#0a0c10',
    surface: '#111318',
    border: '#1e2230',
    primary: '#c2a55a',
    primaryLight: '#d4bc82',
    text: '#e8e0d0',
    muted: '#7a8099',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#f43f5e',
    headerTag: 'SZL HOLDINGS',
  },
  carlota: {
    bg: '#0d0a12',
    surface: '#13101a',
    border: '#2a1f3d',
    primary: '#a855f7',
    primaryLight: '#c084fc',
    text: '#f0e8ff',
    muted: '#8b7aaa',
    accent: '#ec4899',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerTag: 'CARLOTA JO CONSULTING',
  },
  aegis: {
    bg: '#080d0f',
    surface: '#0d1518',
    border: '#1a2e35',
    primary: '#06b6d4',
    primaryLight: '#22d3ee',
    text: '#e0f2f4',
    muted: '#5f8a92',
    accent: '#f43f5e',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerTag: 'AEGIS — UNIFIED DEFENSE & INTELLIGENCE',
  },
  terra: {
    bg: '#0a0c08',
    surface: '#111410',
    border: '#1e2a18',
    primary: '#22c55e',
    primaryLight: '#4ade80',
    text: '#e8f0e0',
    muted: '#6b8060',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f97316',
    danger: '#f43f5e',
    headerTag: 'TERRA REAL ESTATE INTELLIGENCE',
  },
  vessels: {
    bg: '#080c10',
    surface: '#0d1318',
    border: '#1a2535',
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    text: '#e0ecf8',
    muted: '#5a7a99',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerTag: 'VESSELS MARITIME INTELLIGENCE',
  },
  lyte: {
    bg: '#090a0f',
    surface: '#10111a',
    border: '#1c1e30',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    text: '#e8e0f8',
    muted: '#6a6a99',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerTag: 'LYTE COMMAND CENTER',
  },
  prism: {
    bg: '#0a080c',
    surface: '#130f18',
    border: '#281e35',
    primary: '#e879f9',
    primaryLight: '#f0abfc',
    text: '#f0e8ff',
    muted: '#8a6899',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerTag: 'PRISM COUNSEL',
  },
  neutral: {
    bg: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    primary: '#1e3a5f',
    primaryLight: '#2563eb',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerTag: 'SZL HOLDINGS',
  },
};

// ─── Block Types ──────────────────────────────────────────────────────────────

export type BlockType =
  | 'cover'
  | 'executive_summary'
  | 'metrics_row'
  | 'section_header'
  | 'body_text'
  | 'bullet_list'
  | 'data_table'
  | 'chart_bar'
  | 'chart_line'
  | 'chart_gauge'
  | 'distress_indicator'
  | 'status_grid'
  | 'key_value_pairs'
  | 'timeline'
  | 'risk_matrix'
  | 'signature_block'
  | 'page_break'
  | 'appendix_header'
  | 'conditional';

export interface ReportBlock {
  id: string;
  type: BlockType;
  data?: Record<string, unknown>;
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'exists' | 'not_exists';
    value?: unknown;
  };
  children?: ReportBlock[];
}

export interface ReportTemplate {
  id?: string;
  name: string;
  domain: string;
  reportType: string;
  brandTheme: BrandTheme;
  blocks: ReportBlock[];
  dataRequirements?: string[];
}

// ─── Utility: hex to RGB ──────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [200, 200, 200];
}

function rgb(hex: string): [number, number, number] {
  return hexToRgb(hex);
}

// ─── PDF Rendering Context ────────────────────────────────────────────────────

interface RenderCtx {
  doc: PDFKit.PDFDocument;
  brand: BrandColors;
  y: number;
  pageW: number;
  contentW: number;
  margin: number;
  data: Record<string, unknown>;
}

function ensureSpace(ctx: RenderCtx, needed: number): void {
  if (ctx.y + needed > ctx.doc.page.height - 80) {
    ctx.doc.addPage();
    drawPageBackground(ctx);
    ctx.y = ctx.margin;
  }
}

function drawPageBackground(ctx: RenderCtx): void {
  ctx.doc.rect(0, 0, ctx.doc.page.width, ctx.doc.page.height).fill(rgb(ctx.brand.bg));
}

function resolveValue(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ─── Block Renderers ──────────────────────────────────────────────────────────

function renderCover(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;

  drawPageBackground(ctx);

  const pageH = ctx.doc.page.height;
  const pageW = ctx.doc.page.width;

  ctx.doc.rect(0, 0, pageW, 6).fill(rgb(brand.primary));

  ctx.doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(rgb(brand.muted))
    .text(brand.headerTag, ctx.margin, 30, { characterSpacing: 2.5 });

  const title = resolveValue((d.title as string) || 'Report', ctx.data);
  const subtitle = resolveValue((d.subtitle as string) || '', ctx.data);
  const date = resolveValue(
    (d.date as string) ||
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    ctx.data,
  );
  const classification = (d.classification as string) || 'CONFIDENTIAL';

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(32)
    .fillColor(rgb(brand.text))
    .text(title, ctx.margin, pageH * 0.32, { width: ctx.contentW });

  ctx.doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor(rgb(brand.muted))
    .text(subtitle, ctx.margin, ctx.doc.y + 12, { width: ctx.contentW });

  ctx.doc.rect(ctx.margin, ctx.doc.y + 18, ctx.contentW, 1).fill(rgb(brand.border));

  ctx.doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(rgb(brand.muted))
    .text(`${date}  ·  ${classification}`, ctx.margin, ctx.doc.y + 26, { width: ctx.contentW });

  const preparedFor = resolveValue((d.preparedFor as string) || '', ctx.data);
  const preparedBy = resolveValue((d.preparedBy as string) || brand.headerTag, ctx.data);

  if (preparedFor || preparedBy) {
    ctx.doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(rgb(brand.muted))
      .text(
        `Prepared for: ${preparedFor || '—'}  ·  Prepared by: ${preparedBy}`,
        ctx.margin,
        pageH - 80,
        { width: ctx.contentW },
      );
  }

  ctx.doc.addPage();
  drawPageBackground(ctx);
  ctx.y = ctx.margin;
}

function renderSectionHeader(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const text = resolveValue((d.text as string) || 'Section', ctx.data);

  ensureSpace(ctx, 35);

  ctx.doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(rgb(brand.muted))
    .text(text.toUpperCase(), ctx.margin, ctx.y, { characterSpacing: 1.5, width: ctx.contentW });

  ctx.doc
    .rect(ctx.margin, ctx.y + 14, ctx.contentW, 0.5)
    .fillColor(rgb(brand.primary))
    .fillOpacity(0.5)
    .fill();
  ctx.doc.fillOpacity(1);

  ctx.y += 26;
}

function renderBodyText(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const text = resolveValue((d.text as string) || '', ctx.data);
  if (!text) return;

  ensureSpace(ctx, 30);

  ctx.doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(rgb(brand.text))
    .text(text, ctx.margin, ctx.y, { width: ctx.contentW, lineGap: 3 });

  ctx.y = ctx.doc.y + 10;
}

function renderExecutiveSummary(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const text = resolveValue((d.text as string) || '', ctx.data);
  if (!text) return;

  ensureSpace(ctx, 60);

  ctx.doc.rect(ctx.margin, ctx.y, ctx.contentW, 3).fill(rgb(brand.primary));

  ctx.doc
    .rect(ctx.margin, ctx.y + 3, ctx.contentW, 60)
    .fillColor(rgb(brand.surface))
    .fillOpacity(0.7)
    .fill();
  ctx.doc.fillOpacity(1);

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(rgb(brand.primary))
    .text('EXECUTIVE SUMMARY', ctx.margin + 14, ctx.y + 12, { characterSpacing: 1.5 });

  ctx.doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(rgb(brand.text))
    .text(text, ctx.margin + 14, ctx.y + 26, { width: ctx.contentW - 28, lineGap: 3 });

  ctx.y = ctx.doc.y + 18;
}

function renderMetricsRow(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const metricsRaw =
    (d.metrics as Array<{
      label: string;
      value: string;
      trend?: string;
      trendDir?: 'up' | 'down' | 'flat';
    }>) || [];
  const metrics = metricsRaw.map((m) => ({
    label: resolveValue(m.label, ctx.data),
    value: resolveValue(m.value, ctx.data),
    trend: m.trend ? resolveValue(m.trend, ctx.data) : undefined,
    trendDir: m.trendDir,
  }));

  if (metrics.length === 0) return;

  ensureSpace(ctx, 70);

  const cols = Math.min(metrics.length, 6);
  const colW = ctx.contentW / cols;

  metrics.slice(0, cols).forEach((m, i) => {
    const x = ctx.margin + i * colW;
    ctx.doc.rect(x + 3, ctx.y, colW - 6, 56).fill(rgb(brand.surface));

    ctx.doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(rgb(brand.muted))
      .text(m.label, x + 10, ctx.y + 8, { width: colW - 20, characterSpacing: 0.5 });

    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(rgb(brand.primary))
      .text(m.value, x + 10, ctx.y + 22, { width: colW - 20 });

    if (m.trend) {
      const trendColor =
        m.trendDir === 'up' ? brand.success : m.trendDir === 'down' ? brand.danger : brand.muted;
      ctx.doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(rgb(trendColor))
        .text(
          `${m.trendDir === 'up' ? '▲' : m.trendDir === 'down' ? '▼' : '→'} ${m.trend}`,
          x + 10,
          ctx.y + 42,
          { width: colW - 20 },
        );
    }
  });

  ctx.y += 68;
}

function renderBulletList(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const items =
    (d.items as Array<{ text: string; color?: string }>) ||
    (d.items as string[])?.map?.((t: string) => ({ text: t })) ||
    [];
  const color = (d.color as string) || brand.primary;

  for (const item of items) {
    const text = resolveValue(typeof item === 'string' ? item : item.text, ctx.data);
    const itemColor = typeof item === 'object' ? item.color || color : color;

    ensureSpace(ctx, 25);

    ctx.doc.circle(ctx.margin + 8, ctx.y + 5, 2.5).fill(rgb(itemColor));
    ctx.doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(rgb(brand.text))
      .text(text, ctx.margin + 20, ctx.y, { width: ctx.contentW - 20, lineGap: 2 });

    ctx.y = ctx.doc.y + 6;
  }
}

function renderDataTable(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const headers = (d.headers as string[]) || [];
  const rows = (d.rows as Array<string[]>) || [];

  if (headers.length === 0 && rows.length === 0) return;

  const allHeaders = headers.length > 0 ? headers : rows[0] ? Object.keys(rows[0]) : [];
  const allRows = rows;

  ensureSpace(ctx, 36);

  const colW = ctx.contentW / allHeaders.length;

  ctx.doc.rect(ctx.margin, ctx.y, ctx.contentW, 22).fill(rgb(brand.surface));
  allHeaders.forEach((h, i) => {
    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(rgb(brand.muted))
      .text(String(h).toUpperCase(), ctx.margin + i * colW + 8, ctx.y + 7, {
        width: colW - 12,
        characterSpacing: 0.5,
      });
  });
  ctx.y += 22;

  for (let ri = 0; ri < allRows.length; ri++) {
    ensureSpace(ctx, 26);
    const row = allRows[ri];
    const rowHeight = 22;

    if (ri % 2 === 1) {
      ctx.doc
        .rect(ctx.margin, ctx.y, ctx.contentW, rowHeight)
        .fillOpacity(0.3)
        .fill(rgb(brand.surface));
      ctx.doc.fillOpacity(1);
    }

    ctx.doc.rect(ctx.margin, ctx.y + rowHeight - 1, ctx.contentW, 0.5).fill(rgb(brand.border));

    const rowArr = Array.isArray(row) ? row : Object.values(row);
    rowArr.forEach((cell, ci) => {
      ctx.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(rgb(brand.text))
        .text(String(cell ?? ''), ctx.margin + ci * colW + 8, ctx.y + 7, { width: colW - 12 });
    });
    ctx.y += rowHeight;
  }
  ctx.y += 10;
}

function renderStatusGrid(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const items =
    (d.items as Array<{
      name: string;
      status: 'active' | 'warning' | 'critical' | 'inactive';
      detail?: string;
    }>) || [];
  if (items.length === 0) return;

  const STATUS_COLORS = {
    active: brand.success,
    warning: brand.warning,
    critical: brand.danger,
    inactive: brand.muted,
  };

  for (const item of items) {
    ensureSpace(ctx, 52);
    const statusColor = STATUS_COLORS[item.status] || brand.muted;

    ctx.doc
      .rect(ctx.margin, ctx.y, ctx.contentW, 44)
      .fillColor(rgb(brand.surface))
      .fillOpacity(0.4)
      .fill();
    ctx.doc.fillOpacity(1);

    ctx.doc.circle(ctx.margin + 18, ctx.y + 16, 5).fill(rgb(statusColor));

    const name = resolveValue(item.name, ctx.data);
    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(rgb(brand.text))
      .text(name, ctx.margin + 34, ctx.y + 8, { width: ctx.contentW - 120 });

    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(rgb(statusColor))
      .text(item.status.toUpperCase(), ctx.contentW + ctx.margin - 80, ctx.y + 10, {
        width: 80,
        align: 'right',
      });

    if (item.detail) {
      const detail = resolveValue(item.detail, ctx.data);
      ctx.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(rgb(brand.muted))
        .text(detail, ctx.margin + 34, ctx.y + 26, { width: ctx.contentW - 44 });
    }

    ctx.y += 52;
  }
}

function renderKeyValuePairs(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const pairs = (d.pairs as Array<{ label: string; value: string }>) || [];
  if (pairs.length === 0) return;

  const cols = (d.cols as number) || 2;
  const colW = ctx.contentW / cols;
  let col = 0;
  let rowY = ctx.y;
  let maxH = rowY;

  for (const pair of pairs) {
    ensureSpace(ctx, 42);
    const x = ctx.margin + col * colW;
    const label = resolveValue(pair.label, ctx.data);
    const value = resolveValue(pair.value, ctx.data);

    ctx.doc
      .rect(x + 3, rowY, colW - 6, 38)
      .fillColor(rgb(brand.surface))
      .fillOpacity(0.4)
      .fill();
    ctx.doc.fillOpacity(1);

    ctx.doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(rgb(brand.muted))
      .text(label, x + 10, rowY + 6, { width: colW - 18, characterSpacing: 0.5 });

    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(rgb(brand.text))
      .text(value, x + 10, rowY + 18, { width: colW - 18 });

    const after = ctx.doc.y + 4;
    if (after > maxH) maxH = after;

    col++;
    if (col >= cols) {
      col = 0;
      rowY = maxH + 6;
      maxH = rowY;
    }
  }
  ctx.y = maxH + 14;
}

function renderChartBar(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const series = (d.series as Array<{ label: string; value: number; color?: string }>) || [];
  const title = (d.title as string) || '';

  if (series.length === 0) return;

  const chartH = (d.height as number) || 120;
  const chartW = ctx.contentW;

  ensureSpace(ctx, chartH + 40);

  if (title) {
    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(rgb(brand.muted))
      .text(title.toUpperCase(), ctx.margin, ctx.y, { characterSpacing: 1 });
    ctx.y += 16;
  }

  const maxVal = Math.max(...series.map((s) => s.value), 1);
  const barW = Math.max(8, chartW / series.length - 4);
  const barArea = chartH - 20;

  ctx.doc.rect(ctx.margin, ctx.y, chartW, chartH).fillOpacity(0.15).fill(rgb(brand.surface));
  ctx.doc.fillOpacity(1);

  series.forEach((s, i) => {
    const bh = Math.max(2, (s.value / maxVal) * barArea);
    const x = ctx.margin + i * (chartW / series.length) + 2;
    const by = ctx.y + chartH - 20 - bh;
    const color = s.color || brand.primary;

    ctx.doc.rect(x, by, barW, bh).fill(rgb(color));

    const label = resolveValue(s.label, ctx.data);
    ctx.doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(rgb(brand.muted))
      .text(label.slice(0, 8), x, ctx.y + chartH - 16, { width: barW, align: 'center' });
  });

  ctx.y += chartH + 14;
}

function renderChartLine(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const points = (d.points as Array<{ label: string; value: number }>) || [];
  const title = (d.title as string) || '';

  if (points.length < 2) return;

  const chartH = (d.height as number) || 100;
  const chartW = ctx.contentW;

  ensureSpace(ctx, chartH + 40);

  if (title) {
    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(rgb(brand.muted))
      .text(title.toUpperCase(), ctx.margin, ctx.y, { characterSpacing: 1 });
    ctx.y += 16;
  }

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const minVal = Math.min(...points.map((p) => p.value), 0);
  const range = maxVal - minVal || 1;
  const barArea = chartH - 20;
  const stepX = chartW / (points.length - 1);

  ctx.doc.rect(ctx.margin, ctx.y, chartW, chartH).fillOpacity(0.1).fill(rgb(brand.surface));
  ctx.doc.fillOpacity(1);

  ctx.doc.save();

  const coords = points.map((p, i) => ({
    x: ctx.margin + i * stepX,
    y: ctx.y + barArea - ((p.value - minVal) / range) * barArea,
  }));

  ctx.doc.moveTo(coords[0].x, coords[0].y);
  for (let i = 1; i < coords.length; i++) {
    ctx.doc.lineTo(coords[i].x, coords[i].y);
  }
  ctx.doc.strokeColor(rgb(brand.primary)).lineWidth(2).stroke();

  coords.forEach((c) => {
    ctx.doc.circle(c.x, c.y, 3).fill(rgb(brand.primary));
  });

  points.forEach((p, i) => {
    if (i % Math.ceil(points.length / 6) === 0) {
      ctx.doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(rgb(brand.muted))
        .text(p.label.slice(0, 8), ctx.margin + i * stepX - 16, ctx.y + chartH - 16, {
          width: 32,
          align: 'center',
        });
    }
  });

  ctx.doc.restore();
  ctx.y += chartH + 14;
}

function renderChartGauge(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const value = (d.value as number) ?? 0;
  const max = (d.max as number) ?? 100;
  const label = (d.label as string) || '';
  const title = (d.title as string) || '';

  ensureSpace(ctx, 80);

  const cx = ctx.margin + 60;
  const cy = ctx.y + 50;
  const r = 40;
  const ratio = Math.min(1, Math.max(0, value / max));
  const pct = Math.round(ratio * 100);
  const color = pct >= 70 ? brand.danger : pct >= 40 ? brand.warning : brand.success;

  ctx.doc.circle(cx, cy, r).fillOpacity(0.15).fill(rgb(brand.surface));
  ctx.doc.fillOpacity(1);

  ctx.doc
    .rect(cx - r, cy, r * 2, 2)
    .fillColor(rgb(brand.border))
    .fill();

  const fillW = r * 2 * ratio;
  ctx.doc.rect(cx - r, cy, fillW, 2).fill(rgb(color));

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(rgb(color))
    .text(`${pct}%`, cx - r, cy + 8, { width: r * 2, align: 'center' });

  if (label) {
    ctx.doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(rgb(brand.muted))
      .text(label, cx - r, cy + 28, { width: r * 2, align: 'center' });
  }

  if (title) {
    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(rgb(brand.text))
      .text(title, cx + 55, cy - 20, { width: ctx.contentW - 140 });
  }

  ctx.y += 90;
}

function renderDistressIndicator(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const score = (d.score as number) ?? 0;
  const label = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
  const color = score >= 70 ? brand.danger : score >= 40 ? brand.warning : brand.success;
  const description = (d.description as string) || '';

  ensureSpace(ctx, 70);

  ctx.doc
    .rect(ctx.margin, ctx.y + 6, ctx.contentW, 56)
    .fillColor(rgb(brand.surface))
    .fillOpacity(0.4)
    .fill();
  ctx.doc.fillOpacity(1);

  ctx.doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(rgb(brand.muted))
    .text('DISTRESS SCORE', ctx.margin + 14, ctx.y + 14, { characterSpacing: 1 });

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(30)
    .fillColor(rgb(color))
    .text(`${score}`, ctx.margin + 14, ctx.y + 26);

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(rgb(color))
    .text(`/ 100  —  ${label}`, ctx.margin + 14, ctx.y + 58);

  if (description) {
    ctx.doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(rgb(brand.muted))
      .text(resolveValue(description, ctx.data), ctx.margin + 130, ctx.y + 18, {
        width: ctx.contentW - 150,
        lineGap: 2,
      });
  }

  ctx.y += 76;
}

function renderTimeline(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const events =
    (d.events as Array<{ date: string; title: string; description?: string; status?: string }>) ||
    [];
  if (events.length === 0) return;

  const STATUS_COLORS: Record<string, string> = {
    completed: brand.success,
    active: brand.primary,
    pending: brand.muted,
    overdue: brand.danger,
  };

  ctx.doc
    .rect(ctx.margin + 14, ctx.y, 1, events.length * 46)
    .fillOpacity(0.4)
    .fill(rgb(brand.border));
  ctx.doc.fillOpacity(1);

  for (const event of events) {
    ensureSpace(ctx, 52);
    const color = STATUS_COLORS[event.status || 'active'] || brand.primary;

    ctx.doc.circle(ctx.margin + 14, ctx.y + 8, 5).fill(rgb(color));

    ctx.doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(rgb(brand.muted))
      .text(resolveValue(event.date, ctx.data), ctx.margin + 28, ctx.y);

    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(rgb(brand.text))
      .text(resolveValue(event.title, ctx.data), ctx.margin + 28, ctx.y + 12, {
        width: ctx.contentW - 44,
      });

    if (event.description) {
      ctx.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(rgb(brand.muted))
        .text(resolveValue(event.description, ctx.data), ctx.margin + 28, ctx.y + 26, {
          width: ctx.contentW - 44,
        });
    }

    ctx.y += 48;
  }
}

function renderSignatureBlock(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const name = resolveValue((d.name as string) || '', ctx.data);
  const title = resolveValue((d.title as string) || '', ctx.data);
  const date = resolveValue(
    (d.date as string) ||
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    ctx.data,
  );

  ensureSpace(ctx, 60);

  ctx.doc.rect(ctx.margin, ctx.y + 30, 160, 0.5).fill(rgb(brand.muted));

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(rgb(brand.text))
    .text(name, ctx.margin, ctx.y + 36);

  ctx.doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(rgb(brand.muted))
    .text(`${title}  ·  ${date}`, ctx.margin, ctx.y + 50);

  ctx.y += 70;
}

function renderAppendixHeader(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const text = resolveValue((d.text as string) || 'Appendix', ctx.data);
  const letter = (d.letter as string) || '';

  ctx.doc.addPage();
  drawPageBackground(ctx);
  ctx.y = ctx.margin;

  ctx.doc.rect(ctx.margin, ctx.y, 3, 40).fill(rgb(brand.primary));

  ctx.doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(rgb(brand.text))
    .text(`${letter ? `Appendix ${letter}: ` : ''}${text}`, ctx.margin + 14, ctx.y + 8, {
      width: ctx.contentW - 14,
    });

  ctx.y += 56;
}

function renderRiskMatrix(ctx: RenderCtx, block: ReportBlock): void {
  const d = block.data || {};
  const brand = ctx.brand;
  const items =
    (d.risks as Array<{
      title: string;
      likelihood: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      description?: string;
    }>) || [];
  if (items.length === 0) return;

  const LEVEL_COLORS: Record<string, string> = {
    low: brand.success,
    medium: brand.warning,
    high: brand.danger,
  };

  for (const item of items) {
    ensureSpace(ctx, 56);

    const lColor = LEVEL_COLORS[item.likelihood] || brand.muted;
    const iColor = LEVEL_COLORS[item.impact] || brand.muted;

    ctx.doc
      .rect(ctx.margin, ctx.y, ctx.contentW, 48)
      .fillColor(rgb(brand.surface))
      .fillOpacity(0.4)
      .fill();
    ctx.doc.fillOpacity(1);

    ctx.doc.rect(ctx.margin, ctx.y, 3, 48).fill(rgb(LEVEL_COLORS[item.impact] || brand.muted));

    ctx.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(rgb(brand.text))
      .text(resolveValue(item.title, ctx.data), ctx.margin + 12, ctx.y + 8, {
        width: ctx.contentW - 180,
      });

    ctx.doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(rgb(lColor))
      .text(
        `Likelihood: ${item.likelihood.toUpperCase()}`,
        ctx.contentW - 100 + ctx.margin,
        ctx.y + 8,
        { width: 100 },
      );

    ctx.doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(rgb(iColor))
      .text(`Impact: ${item.impact.toUpperCase()}`, ctx.contentW - 100 + ctx.margin, ctx.y + 22, {
        width: 100,
      });

    if (item.description) {
      ctx.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(rgb(brand.muted))
        .text(resolveValue(item.description, ctx.data), ctx.margin + 12, ctx.y + 24, {
          width: ctx.contentW - 180,
          lineGap: 1,
        });
    }

    ctx.y += 56;
  }
}

function evaluateCondition(
  condition: ReportBlock['condition'],
  data: Record<string, unknown>,
): boolean {
  if (!condition) return true;
  const val = data[condition.field];
  switch (condition.operator) {
    case 'eq':
      return val === condition.value;
    case 'neq':
      return val !== condition.value;
    case 'gt':
      return (val as number) > (condition.value as number);
    case 'lt':
      return (val as number) < (condition.value as number);
    case 'exists':
      return val !== undefined && val !== null;
    case 'not_exists':
      return val === undefined || val === null;
    default:
      return true;
  }
}

function renderBlock(ctx: RenderCtx, block: ReportBlock): void {
  if (block.condition && !evaluateCondition(block.condition, ctx.data)) return;

  switch (block.type) {
    case 'cover':
      return renderCover(ctx, block);
    case 'section_header':
      return renderSectionHeader(ctx, block);
    case 'body_text':
      return renderBodyText(ctx, block);
    case 'executive_summary':
      return renderExecutiveSummary(ctx, block);
    case 'metrics_row':
      return renderMetricsRow(ctx, block);
    case 'bullet_list':
      return renderBulletList(ctx, block);
    case 'data_table':
      return renderDataTable(ctx, block);
    case 'status_grid':
      return renderStatusGrid(ctx, block);
    case 'key_value_pairs':
      return renderKeyValuePairs(ctx, block);
    case 'chart_bar':
      return renderChartBar(ctx, block);
    case 'chart_line':
      return renderChartLine(ctx, block);
    case 'chart_gauge':
      return renderChartGauge(ctx, block);
    case 'distress_indicator':
      return renderDistressIndicator(ctx, block);
    case 'timeline':
      return renderTimeline(ctx, block);
    case 'signature_block':
      return renderSignatureBlock(ctx, block);
    case 'appendix_header':
      return renderAppendixHeader(ctx, block);
    case 'risk_matrix':
      return renderRiskMatrix(ctx, block);
    case 'page_break':
      ctx.doc.addPage();
      drawPageBackground(ctx);
      ctx.y = ctx.margin;
      break;
    case 'conditional':
      if (block.children) {
        for (const child of block.children) {
          renderBlock(ctx, child);
        }
      }
      break;
  }
}

function drawFooter(
  ctx: RenderCtx,
  entityName: string,
  classification: string = 'CONFIDENTIAL',
): void {
  const pages = ctx.doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    ctx.doc.switchToPage(pages.start + i);
    const y = ctx.doc.page.height - 48;
    ctx.doc.rect(ctx.margin, y, ctx.contentW, 0.5).fill(rgb(ctx.brand.border));
    ctx.doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(rgb(ctx.brand.muted))
      .text(
        `${entityName}  ·  ${classification}  ·  Page ${i + 1} of ${pages.count}  ·  Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        ctx.margin,
        y + 12,
        { align: 'center', width: ctx.contentW },
      );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ReportRenderOptions {
  template: ReportTemplate;
  data: Record<string, unknown>;
  narrativeSections?: Partial<{
    executiveSummary: string;
    trendAnalysis: string;
    recommendations: string;
    riskFactors: string;
    outlook: string;
  }>;
  entityName?: string;
  classification?: string;
}

export async function renderReportToPdf(options: ReportRenderOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const { template, data, narrativeSections, entityName, classification } = options;
      const brand = BRAND_THEMES[template.brandTheme] || BRAND_THEMES.szl;
      const margin = 72;

      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: margin, bottom: margin, left: margin, right: margin },
        info: { Creator: brand.headerTag, Producer: 'SZL Report Engine v2' },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const enrichedData = {
        ...data,
        _generated: new Date().toISOString(),
        _domain: template.domain,
        _reportType: template.reportType,
        ...(narrativeSections
          ? {
              _executiveSummary: narrativeSections.executiveSummary,
              _trendAnalysis: narrativeSections.trendAnalysis,
              _recommendations: narrativeSections.recommendations,
              _riskFactors: narrativeSections.riskFactors,
              _outlook: narrativeSections.outlook,
            }
          : {}),
      };

      const ctx: RenderCtx = {
        doc,
        brand,
        y: margin,
        pageW: doc.page.width,
        contentW: doc.page.width - 2 * margin,
        margin,
        data: enrichedData,
      };

      drawPageBackground(ctx);

      for (const block of template.blocks) {
        renderBlock(ctx, block);
      }

      drawFooter(ctx, entityName || brand.headerTag, classification || 'CONFIDENTIAL');
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Domain Template Library ──────────────────────────────────────────────────

export const DOMAIN_TEMPLATES: Record<string, ReportTemplate> = {
  szl_quarterly_investor: {
    name: 'SZL Holdings — Quarterly Investor Letter',
    domain: 'szl_holdings',
    reportType: 'quarterly_investor_letter',
    brandTheme: 'szl',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Quarterly Investor Letter — {{quarter}}',
          subtitle: 'SZL Holdings — Strategic Update & Portfolio Review',
          classification: 'CONFIDENTIAL — INVESTOR USE ONLY',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      {
        id: 'kpis',
        type: 'metrics_row',
        data: {
          metrics: [
            {
              label: 'Active Platforms',
              value: '{{activePlatforms}}',
              trend: 'stable',
              trendDir: 'flat',
            },
            {
              label: 'Revenue Tracks',
              value: '{{revenueTracks}}',
              trend: 'growing',
              trendDir: 'up',
            },
            { label: 'Build Velocity', value: '{{buildVelocity}}', trendDir: 'up' },
            { label: 'Architecture', value: 'Monorepo' },
            { label: 'Codebase Age', value: '{{codebaseAge}}' },
          ],
        },
      },
      { id: 's1', type: 'section_header', data: { text: 'Platform Status' } },
      {
        id: 'platforms',
        type: 'status_grid',
        data: {
          items: [
            {
              name: 'Carlota Jo Consulting',
              status: 'active',
              detail: 'High-margin advisory retainers. Cash flow positive.',
            },
            {
              name: 'Terra Real Estate Intelligence',
              status: 'active',
              detail: 'NYC distress market coverage. Subscription SaaS.',
            },
            {
              name: 'Aegis — Unified Defense & Intelligence',
              status: 'active',
              detail: 'SOC + MSP + AI intelligence. Enterprise contracts.',
            },
            {
              name: 'Vessels Maritime Intelligence',
              status: 'active',
              detail: 'Fleet command. AIS tracking. Voyage economics.',
            },
            {
              name: 'Lyte Command Center',
              status: 'active',
              detail: 'Business observability. Multi-model AI routing.',
            },
            {
              name: 'Counsel',
              status: 'active',
              detail: 'Legal matter command. Compliance tracking.',
            },
          ],
        },
      },
      { id: 's2', type: 'section_header', data: { text: 'Revenue Architecture' } },
      { id: 'rev_text', type: 'body_text', data: { text: '{{_recommendations}}' } },
      {
        id: 'rev_list',
        type: 'bullet_list',
        data: {
          items: [
            {
              text: 'Immediate: Carlota Jo advisory retainers — high margin, low capital intensity, cash flow positive.',
            },
            { text: 'Wedge: Terra subscription SaaS — data moat via NYC distress intelligence.' },
            { text: 'Enterprise: Aegis contract model — high ACV, multi-module expansion.' },
          ],
        },
      },
      { id: 's3', type: 'section_header', data: { text: 'Strategic Thesis' } },
      { id: 'thesis_text', type: 'body_text', data: { text: '{{_trendAnalysis}}' } },
      { id: 's4', type: 'section_header', data: { text: 'Outlook' } },
      { id: 'outlook_text', type: 'body_text', data: { text: '{{_outlook}}' } },
      {
        id: 'sig',
        type: 'signature_block',
        data: { name: 'Stephen Lutar', title: 'Founder & CEO, SZL Holdings' },
      },
    ],
  },

  szl_portfolio: {
    name: 'SZL Holdings — Portfolio Overview',
    domain: 'szl_holdings',
    reportType: 'portfolio_overview',
    brandTheme: 'szl',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Portfolio Overview — {{quarter}}',
          subtitle: 'SZL Holdings Platform Intelligence',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      { id: 's1', type: 'section_header', data: { text: 'Portfolio at a Glance' } },
      {
        id: 'metrics',
        type: 'metrics_row',
        data: {
          metrics: [
            { label: 'Active Platforms', value: '{{activePlatforms}}' },
            { label: 'Architecture', value: 'Monorepo' },
            { label: 'Revenue Tracks', value: '3' },
            { label: 'Lines of Code', value: '150k+' },
            { label: 'Commits', value: '1,200+' },
          ],
        },
      },
      { id: 's2', type: 'section_header', data: { text: 'Platform Portfolio' } },
      { id: 'platforms', type: 'status_grid', data: { items: [] } },
      { id: 's3', type: 'section_header', data: { text: 'Compounding Architecture Thesis' } },
      {
        id: 'thesis',
        type: 'body_text',
        data: {
          text: 'Six platforms on one backbone means every platform gets smarter as the others grow. Shared components and infrastructure reduce marginal build cost per platform and create structural cross-domain intelligence advantages.',
        },
      },
    ],
  },

  carlota_engagement_summary: {
    name: 'Carlota Jo — Engagement Summary',
    domain: 'carlota_jo',
    reportType: 'engagement_summary',
    brandTheme: 'carlota',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Engagement Summary — {{client}}',
          subtitle: 'Carlota Jo Consulting — Strategic Advisory  |  {{period}}',
          classification: 'CLIENT CONFIDENTIAL',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      { id: 's1', type: 'section_header', data: { text: 'Engagement Overview' } },
      { id: 'overview', type: 'body_text', data: { text: '{{overview}}' } },
      { id: 's2', type: 'section_header', data: { text: 'Key Insights' } },
      {
        id: 'insights_table',
        type: 'data_table',
        data: { headers: ['Insight', 'Type', 'Confidence'], rows: [] },
      },
      { id: 's3', type: 'section_header', data: { text: 'Recommendations' } },
      { id: 'recs', type: 'body_text', data: { text: '{{_recommendations}}' } },
      { id: 's4', type: 'section_header', data: { text: 'Next Steps' } },
      {
        id: 'next_steps_table',
        type: 'data_table',
        data: { headers: ['Action', 'Owner', 'Timeline'], rows: [] },
      },
      { id: 's5', type: 'section_header', data: { text: 'Outlook' } },
      { id: 'outlook', type: 'body_text', data: { text: '{{_outlook}}' } },
      {
        id: 'sig',
        type: 'signature_block',
        data: { name: 'Carlota Jo', title: 'Managing Principal, Carlota Jo Consulting' },
      },
    ],
  },

  aegis_security_assessment: {
    name: 'Aegis — Security Assessment Report',
    domain: 'aegis',
    reportType: 'security_assessment',
    brandTheme: 'aegis',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Security Assessment Report',
          subtitle: 'Aegis — Unified Defense & Intelligence Command  |  {{assessmentType}}',
          classification: 'CONFIDENTIAL — RESTRICTED DISTRIBUTION',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      { id: 's1', type: 'section_header', data: { text: 'Assessment Details' } },
      {
        id: 'details',
        type: 'key_value_pairs',
        data: {
          cols: 2,
          pairs: [
            { label: 'Assessment Type', value: '{{assessmentType}}' },
            { label: 'Target Environment', value: '{{targetEnvironment}}' },
            { label: 'Scope', value: '{{scope}}' },
            { label: 'Status', value: '{{status}}' },
            { label: 'Platform', value: 'Aegis — Unified Defense & Intelligence' },
            { label: 'Date', value: '{{date}}' },
          ],
        },
      },
      { id: 's2', type: 'section_header', data: { text: 'Finding Summary' } },
      {
        id: 'finding_metrics',
        type: 'metrics_row',
        data: {
          metrics: [
            { label: 'Total Findings', value: '{{totalFindings}}' },
            { label: 'Critical', value: '{{criticalFindings}}', trendDir: 'down' },
            { label: 'High', value: '{{highFindings}}', trendDir: 'down' },
            { label: 'Medium', value: '{{mediumFindings}}' },
            { label: 'Low / Info', value: '{{lowFindings}}' },
          ],
        },
      },
      { id: 's3', type: 'section_header', data: { text: 'Findings' } },
      {
        id: 'findings_table',
        type: 'data_table',
        data: { headers: ['Finding', 'Severity', 'System', 'Status'], rows: [] },
      },
      { id: 's4', type: 'section_header', data: { text: 'Risk Assessment' } },
      { id: 'risk_matrix', type: 'risk_matrix', data: { risks: [] } },
      { id: 's5', type: 'section_header', data: { text: 'Recommendations' } },
      { id: 'recs', type: 'body_text', data: { text: '{{_recommendations}}' } },
      { id: 'recs_list', type: 'bullet_list', data: { items: [], color: '#06b6d4' } },
      { id: 's6', type: 'section_header', data: { text: 'Classification' } },
      {
        id: 'class_text',
        type: 'body_text',
        data: {
          text: 'This report is CONFIDENTIAL and intended solely for the named client organization. Distribution is restricted to authorized personnel. Contents describe actual or potential security vulnerabilities and must be handled accordingly.',
        },
      },
    ],
  },

  terra_property_analysis: {
    name: 'Terra — Property Analysis Report',
    domain: 'terra',
    reportType: 'property_analysis',
    brandTheme: 'terra',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: '{{propertyName}}',
          subtitle: 'Terra Real Estate Intelligence — Property Analysis  |  {{address}}',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      { id: 's1', type: 'section_header', data: { text: 'Property Overview' } },
      {
        id: 'metrics',
        type: 'metrics_row',
        data: {
          metrics: [
            { label: 'Property Value', value: '{{propertyValue}}' },
            { label: 'Monthly Revenue', value: '{{monthlyRevenue}}' },
            { label: 'Annual NOI', value: '{{annualNoi}}' },
            { label: 'Cap Rate', value: '{{capRate}}' },
            { label: 'Occupancy', value: '{{occupancy}}' },
            { label: 'Units', value: '{{units}}' },
          ],
        },
      },
      { id: 's2', type: 'section_header', data: { text: 'Distress Analysis' } },
      {
        id: 'distress',
        type: 'distress_indicator',
        data: {
          score: 0,
          description:
            'Multi-factor distress scoring combining ownership stress, tax delinquency, permit violations, and market context.',
        },
      },
      { id: 's3', type: 'section_header', data: { text: 'Contributing Factors' } },
      {
        id: 'factors',
        type: 'bullet_list',
        data: {
          items: [
            'Ownership concentration and transfer recency',
            'Tax delinquency status and payment history',
            'Building permit violations and ECB summons',
            'Mortgage encumbrance relative to assessed value',
            'Vacancy rate vs. submarket average',
          ],
        },
      },
      { id: 's4', type: 'section_header', data: { text: 'Market Context' } },
      { id: 'market', type: 'body_text', data: { text: '{{_trendAnalysis}}' } },
      {
        id: 'comps',
        type: 'data_table',
        data: { headers: ['Address', 'Price', 'Cap Rate', 'Date'], rows: [] },
      },
      { id: 's5', type: 'section_header', data: { text: 'Investment Thesis' } },
      { id: 'thesis', type: 'body_text', data: { text: '{{investmentThesis}}' } },
      { id: 's6', type: 'section_header', data: { text: 'Risk Factors' } },
      { id: 'risks', type: 'risk_matrix', data: { risks: [] } },
    ],
  },

  vessels_voyage: {
    name: 'Vessels — Voyage Report',
    domain: 'vessels',
    reportType: 'voyage_report',
    brandTheme: 'vessels',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Voyage Report — {{vesselName}}',
          subtitle: 'Vessels Maritime Intelligence  |  {{voyageId}}',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      { id: 's1', type: 'section_header', data: { text: 'Voyage Overview' } },
      {
        id: 'metrics',
        type: 'metrics_row',
        data: {
          metrics: [
            { label: 'Vessel', value: '{{vesselName}}' },
            { label: 'Route', value: '{{origin}} → {{destination}}' },
            { label: 'Distance', value: '{{distance}}' },
            { label: 'Duration', value: '{{duration}}' },
            { label: 'Cargo Value', value: '{{cargoValue}}' },
            { label: 'Status', value: '{{voyageStatus}}' },
          ],
        },
      },
      { id: 's2', type: 'section_header', data: { text: 'Voyage Economics' } },
      {
        id: 'econ',
        type: 'key_value_pairs',
        data: {
          cols: 3,
          pairs: [
            { label: 'Fuel Cost', value: '{{fuelCost}}' },
            { label: 'Port Costs', value: '{{portCosts}}' },
            { label: 'Charter Rate', value: '{{charterRate}}' },
            { label: 'Revenue', value: '{{voyageRevenue}}' },
            { label: 'Gross Profit', value: '{{grossProfit}}' },
            { label: 'Margin', value: '{{profitMargin}}' },
          ],
        },
      },
      { id: 's3', type: 'section_header', data: { text: 'Route Timeline' } },
      { id: 'timeline', type: 'timeline', data: { events: [] } },
      { id: 's4', type: 'section_header', data: { text: 'Compliance & Screening' } },
      {
        id: 'compliance',
        type: 'key_value_pairs',
        data: {
          cols: 2,
          pairs: [
            { label: 'Sanctions Screening', value: '{{sanctionsStatus}}' },
            { label: 'Flag State', value: '{{flagState}}' },
            { label: 'Classification Society', value: '{{classificationSociety}}' },
            { label: 'Last Port State Control', value: '{{lastPSC}}' },
          ],
        },
      },
      { id: 's5', type: 'section_header', data: { text: 'Operational Notes' } },
      { id: 'notes', type: 'body_text', data: { text: '{{_recommendations}}' } },
    ],
  },

  lyte_weekly_briefing: {
    name: 'Lyte — Weekly Operations Briefing',
    domain: 'lyte',
    reportType: 'weekly_briefing',
    brandTheme: 'lyte',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Weekly Operations Briefing',
          subtitle: 'Lyte Command Center — Week of {{weekOf}}',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      { id: 's1', type: 'section_header', data: { text: 'Signal Summary' } },
      {
        id: 'signal_metrics',
        type: 'metrics_row',
        data: {
          metrics: [
            {
              label: 'Total Signals',
              value: '{{totalSignals}}',
              trend: 'vs last week',
              trendDir: 'up',
            },
            { label: 'Critical', value: '{{criticalSignals}}', trendDir: 'down' },
            { label: 'High', value: '{{highSignals}}' },
            { label: 'Resolved', value: '{{resolvedSignals}}', trendDir: 'up' },
            { label: 'MTTR', value: '{{mttr}}', trendDir: 'down' },
          ],
        },
      },
      { id: 's2', type: 'section_header', data: { text: 'Platform Health' } },
      { id: 'platform_status', type: 'status_grid', data: { items: [] } },
      { id: 's3', type: 'section_header', data: { text: 'AI Model Performance' } },
      {
        id: 'model_metrics',
        type: 'key_value_pairs',
        data: {
          cols: 3,
          pairs: [
            { label: 'Total AI Calls', value: '{{totalAiCalls}}' },
            { label: 'Avg Latency', value: '{{avgLatency}}' },
            { label: 'Error Rate', value: '{{errorRate}}' },
            { label: 'Primary Model', value: '{{primaryModel}}' },
            { label: 'Token Cost', value: '{{tokenCost}}' },
            { label: 'Cache Hit Rate', value: '{{cacheHitRate}}' },
          ],
        },
      },
      { id: 's4', type: 'section_header', data: { text: 'Trend Analysis' } },
      { id: 'trend', type: 'body_text', data: { text: '{{_trendAnalysis}}' } },
      { id: 's5', type: 'section_header', data: { text: 'Recommendations' } },
      { id: 'recs', type: 'body_text', data: { text: '{{_recommendations}}' } },
    ],
  },

  prism_legal_memo: {
    name: 'PRISM — Legal Memo',
    domain: 'prism',
    reportType: 'legal_memo',
    brandTheme: 'prism',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Legal Memorandum — {{matterNumber}}',
          subtitle: 'PRISM Counsel  |  {{matterTitle}}',
          classification: 'ATTORNEY-CLIENT PRIVILEGED',
        },
      },
      { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
      {
        id: 'header_info',
        type: 'key_value_pairs',
        data: {
          cols: 2,
          pairs: [
            { label: 'Matter Number', value: '{{matterNumber}}' },
            { label: 'Client', value: '{{clientName}}' },
            { label: 'Practice Area', value: '{{practiceArea}}' },
            { label: 'Responsible Attorney', value: '{{responsibleAttorney}}' },
            { label: 'Date', value: '{{date}}' },
            { label: 'Status', value: '{{matterStatus}}' },
          ],
        },
      },
      { id: 's1', type: 'section_header', data: { text: 'Issue' } },
      { id: 'issue', type: 'body_text', data: { text: '{{issue}}' } },
      { id: 's2', type: 'section_header', data: { text: 'Short Answer' } },
      { id: 'short_answer', type: 'body_text', data: { text: '{{shortAnswer}}' } },
      { id: 's3', type: 'section_header', data: { text: 'Analysis' } },
      { id: 'analysis', type: 'body_text', data: { text: '{{analysis}}' } },
      { id: 's4', type: 'section_header', data: { text: 'Recommendations' } },
      { id: 'recs_text', type: 'body_text', data: { text: '{{_recommendations}}' } },
      { id: 's5', type: 'section_header', data: { text: 'Next Steps' } },
      { id: 'timeline', type: 'timeline', data: { events: [] } },
      { id: 's6', type: 'section_header', data: { text: 'Privilege Notice' } },
      {
        id: 'privilege',
        type: 'body_text',
        data: {
          text: 'This memorandum is protected by attorney-client privilege and work product doctrine. It is intended solely for the named client and authorized legal personnel. Disclosure to any third party without explicit written consent of PRISM Counsel may constitute a waiver of privilege.',
        },
      },
      {
        id: 'sig',
        type: 'signature_block',
        data: { name: 'Counsel', title: 'Legal Matter Command' },
      },
    ],
  },
};

export function getTemplateForDomain(domain: string, reportType?: string): ReportTemplate | null {
  const key = reportType
    ? `${domain}_${reportType}`
    : Object.keys(DOMAIN_TEMPLATES).find((k) => k.startsWith(domain));
  return key ? DOMAIN_TEMPLATES[key] || null : null;
}

export function listAvailableTemplates(): Array<{
  key: string;
  name: string;
  domain: string;
  reportType: string;
  brandTheme: string;
}> {
  return Object.entries(DOMAIN_TEMPLATES).map(([key, t]) => ({
    key,
    name: t.name,
    domain: t.domain,
    reportType: t.reportType,
    brandTheme: t.brandTheme,
  }));
}
