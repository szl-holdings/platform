import { Fragment, type ReactNode } from 'react';
import { type DensityMode, color, densityConfig, semanticColors } from '../tokens/index.js';
import { cn } from '../utils.js';

export type ComparisonCellValue = string | number | boolean | null | undefined | ReactNode;

export type RecommendationBadge =
  | 'recommended'
  | 'best-value'
  | 'highest-risk'
  | 'lowest-risk'
  | 'optimal';

export interface ComparisonEntity {
  id: string;
  label: string;
  sublabel?: string;
  accentColor?: string;
  score?: number;
  recommendation?: RecommendationBadge;
  icon?: ReactNode;
}

export interface ComparisonField {
  key: string;
  label: string;
  description?: string;
  format?: (value: ComparisonCellValue) => ReactNode;
  highlight?: boolean;
  group?: string;
}

export interface ComparisonRow {
  fieldKey: string;
  values: Record<string, ComparisonCellValue>;
  highlighted?: boolean;
}

export interface ComparisonTableProps {
  entities: ComparisonEntity[];
  fields: ComparisonField[];
  rows: ComparisonRow[];
  density?: DensityMode;
  className?: string;
  showDiffs?: boolean;
  stickyHeader?: boolean;
}

const BADGE_CONFIG: Record<RecommendationBadge, { label: string; bg: string; text: string }> = {
  recommended:    { label: 'Recommended', bg: semanticColors.success.bg,  text: semanticColors.success.text },
  'best-value':   { label: 'Best Value',  bg: semanticColors.info.bg,     text: semanticColors.info.text },
  'highest-risk': { label: 'Highest Risk',bg: semanticColors.error.bg,    text: semanticColors.error.text },
  'lowest-risk':  { label: 'Lowest Risk', bg: semanticColors.success.bg,  text: semanticColors.success.text },
  optimal:        { label: 'Optimal',     bg: semanticColors.neutral.bg,  text: color.accent.violet },
};

function ScoreBar({ score, barColor }: { score: number; barColor: string }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full overflow-hidden"
        style={{ width: '48px', height: '4px', background: color.border.default }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score: ${Math.round(pct)}`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span style={{ fontSize: '11px', color: barColor, fontWeight: 600, minWidth: '22px' }}>
        {Math.round(pct)}
      </span>
    </div>
  );
}

function cellsAreDifferent(values: ComparisonCellValue[]): boolean {
  const primitives = values.filter(
    (v) => v !== null && v !== undefined && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'),
  ) as (string | number | boolean)[];
  if (primitives.length < 2) return false;
  return new Set(primitives.map(String)).size > 1;
}

function renderCell(value: ComparisonCellValue, format?: ComparisonField['format']): ReactNode {
  if (format) return format(value);
  if (typeof value === 'boolean') {
    return (
      <span
        aria-label={value ? 'Yes' : 'No'}
        style={{ fontSize: '14px', color: value ? color.accent.green : color.accent.red }}
      >
        {value ? '✓' : '✕'}
      </span>
    );
  }
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: color.text.muted, fontSize: '11px' }}>—</span>;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return value as ReactNode;
}

export function ComparisonTable({
  entities,
  fields,
  rows,
  density = 'comfortable',
  className,
  showDiffs = true,
  stickyHeader = false,
}: ComparisonTableProps) {
  const dc = densityConfig[density];
  const rowH = dc.rowHeight;
  const colMinW = density === 'dense' ? '100px' : density === 'compact' ? '120px' : '140px';
  const fs = dc.fontSize;

  const groups = Array.from(new Set(fields.map((f) => f.group ?? ''))).filter(Boolean);
  const hasGroups = groups.length > 0;

  const rowsByGroup = new Map<string, ComparisonRow[]>();
  for (const row of rows) {
    const field = fields.find((f) => f.key === row.fieldKey);
    const group = field?.group ?? '';
    const existing = rowsByGroup.get(group) ?? [];
    rowsByGroup.set(group, [...existing, row]);
  }

  const ungroupedRows = rowsByGroup.get('') ?? [];
  const groupedEntries = Array.from(rowsByGroup.entries()).filter(([g]) => g !== '');

  const renderRows = (rowList: ComparisonRow[]) =>
    rowList.map((row, ri) => {
      const field = fields.find((f) => f.key === row.fieldKey);
      if (!field) return null;
      const values = entities.map((e) => row.values[e.id]);
      const isDiff = showDiffs && cellsAreDifferent(values);
      const isHighlighted = row.highlighted ?? field.highlight;

      return (
        <tr
          key={row.fieldKey}
          style={{
            background: isHighlighted
              ? color.bg.active
              : ri % 2 === 0
                ? 'transparent'
                : `${color.bg.raised}88`,
          }}
        >
          <td
            className="sticky left-0"
            style={{
              padding: `0 ${dc.cardPadding}`,
              height: rowH,
              background: isHighlighted ? color.bg.active : color.bg.surface,
              borderRight: `1px solid ${color.border.subtle}`,
              minWidth: '140px',
              maxWidth: '200px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span
                  style={{
                    fontSize: fs,
                    color: isHighlighted ? color.text.primary : color.text.secondary,
                    fontWeight: isHighlighted ? 600 : 400,
                  }}
                >
                  {field.label}
                </span>
                {field.description && density !== 'dense' && (
                  <span style={{ fontSize: '10px', color: color.text.muted }}>{field.description}</span>
                )}
              </div>
              {isDiff && (
                <span
                  className="rounded px-1 shrink-0"
                  style={{
                    background: semanticColors.warning.bg,
                    color: semanticColors.warning.text,
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                  aria-label="Values differ"
                >
                  DIFF
                </span>
              )}
            </div>
          </td>

          {entities.map((entity) => {
            const value = row.values[entity.id];
            const entityAccent = entity.accentColor ?? color.accent.blue;
            return (
              <td
                key={entity.id}
                style={{
                  padding: `0 ${dc.cardPadding}`,
                  height: rowH,
                  borderRight: `1px solid ${color.border.subtle}`,
                  minWidth: colMinW,
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: fs,
                    color: isDiff ? entityAccent : color.text.primary,
                    fontWeight: isDiff ? 600 : 400,
                  }}
                >
                  {renderCell(value, field.format)}
                </span>
              </td>
            );
          })}
        </tr>
      );
    });

  return (
    <div
      className={cn('rounded-lg overflow-hidden', className)}
      style={{
        background: color.bg.surface,
        border: `1px solid ${color.border.subtle}`,
      }}
    >
      <div className="overflow-auto">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: 'fixed' }}
          role="table"
          aria-label="Comparison table"
        >
          <thead
            style={{
              position: stickyHeader ? 'sticky' : undefined,
              top: stickyHeader ? 0 : undefined,
              zIndex: stickyHeader ? 10 : undefined,
              background: color.bg.raised,
              borderBottom: `1px solid ${color.border.default}`,
            }}
          >
            <tr>
              <th
                className="sticky left-0 text-left"
                scope="col"
                style={{
                  padding: `${dc.sectionGap} ${dc.cardPadding}`,
                  background: color.bg.raised,
                  borderRight: `1px solid ${color.border.subtle}`,
                  minWidth: '140px',
                  maxWidth: '200px',
                  fontSize: '10px',
                  color: color.text.muted,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Attribute
              </th>

              {entities.map((entity) => {
                const badge = entity.recommendation ? BADGE_CONFIG[entity.recommendation] : null;
                const accent = entity.accentColor ?? color.accent.blue;

                return (
                  <th
                    key={entity.id}
                    scope="col"
                    style={{
                      padding: `${dc.sectionGap} ${dc.cardPadding}`,
                      minWidth: colMinW,
                      borderRight: `1px solid ${color.border.subtle}`,
                      borderTop: `2px solid ${accent}`,
                      textAlign: 'center',
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {entity.icon && (
                        <span style={{ color: accent }} aria-hidden="true">
                          {entity.icon}
                        </span>
                      )}
                      <span style={{ fontSize: fs, color: color.text.primary, fontWeight: 600 }}>
                        {entity.label}
                      </span>
                      {entity.sublabel && (
                        <span style={{ fontSize: '10px', color: color.text.muted }}>
                          {entity.sublabel}
                        </span>
                      )}
                      {entity.score !== undefined && (
                        <ScoreBar score={entity.score} barColor={accent} />
                      )}
                      {badge && (
                        <span
                          className="rounded px-2"
                          style={{
                            background: badge.bg,
                            color: badge.text,
                            fontSize: '9px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            height: '16px',
                            lineHeight: '16px',
                            display: 'inline-block',
                          }}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {ungroupedRows.length > 0 && renderRows(ungroupedRows)}

            {groupedEntries.map(([group, groupRows]) => (
              <Fragment key={`__group__${group}`}>
                <tr>
                  <td
                    colSpan={entities.length + 1}
                    style={{
                      padding: `${density === 'dense' ? '3px' : '5px'} ${dc.cardPadding}`,
                      background: color.bg.overlay,
                      borderTop: `1px solid ${color.border.subtle}`,
                      borderBottom: `1px solid ${color.border.subtle}`,
                      fontSize: '10px',
                      color: color.text.muted,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {group}
                  </td>
                </tr>
                {renderRows(groupRows)}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
