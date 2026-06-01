import React, { useState } from 'react';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

export interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  appName?: string;
  accentColor?: string;
  columns?: ExportColumn[];
}

function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Permit only safe CSS color values (hex, rgb()/rgba(), hsl()/hsla(),
// or a small allowlist of named colors). Falls back to a neutral default
// if the input contains anything else.
function sanitizeCssColor(value: unknown, fallback = '#8b7ac8'): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (trimmed.length > 64) return fallback;
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^rgba?\(\s*[-0-9.,%\s]+\s*\)$/.test(trimmed)) return trimmed;
  if (/^hsla?\(\s*[-0-9.,%\s]+\s*\)$/.test(trimmed)) return trimmed;
  if (/^[a-zA-Z]{3,32}$/.test(trimmed)) return trimmed;
  return fallback;
}

function escapeCSVCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(data: Record<string, unknown>[], options: ExportOptions = {}): void {
  const { filename = 'export', columns, title, appName } = options;

  if (data.length === 0) {
    return;
  }

  const cols: ExportColumn[] = columns ?? Object.keys(data[0]!).map((k) => ({ key: k, label: k }));

  const lines: string[] = [];

  if (title) {
    lines.push(escapeCSVCell(title));
    if (appName) lines.push(escapeCSVCell(`Exported from ${appName}`));
    lines.push(escapeCSVCell(`Generated: ${new Date().toLocaleString()}`));
    lines.push('');
  }

  lines.push(cols.map((c) => escapeCSVCell(c.label)).join(','));

  for (const row of data) {
    lines.push(
      cols
        .map((c) => {
          const raw = row[c.key];
          const formatted = c.format ? c.format(raw) : raw;
          return escapeCSVCell(formatted);
        })
        .join(','),
    );
  }

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(options: ExportOptions = {}): void {
  const {
    title = 'Report',
    subtitle,
    appName = 'SZL Platform',
    accentColor = '#8b7ac8',
    filename = 'report',
  } = options;

  const timestamp = new Date().toLocaleString();

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    return;
  }

  const contentEl =
    document.querySelector('[data-export-content]') ?? document.querySelector('main');
  // contentHTML is sourced from the live DOM that the user is currently viewing.
  // Caller-provided strings (title/subtitle/appName) are escaped below; accentColor
  // is sanitized through sanitizeCssColor.
  const contentHTML = contentEl?.innerHTML ?? '<p>No content available</p>';
  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : '';
  const safeAppName = escapeHtml(appName);
  const safeAccent = sanitizeCssColor(accentColor);
  const safeTimestamp = escapeHtml(timestamp);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${safeTitle}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          color: #1a1a2e;
          background: #fff;
          padding: 0;
        }
        .header {
          background: linear-gradient(135deg, #0a0c14 0%, #1a1a2e 100%);
          color: white;
          padding: 28px 36px 24px;
          border-bottom: 4px solid ${safeAccent};
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .header-brand-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #8b7ac8, #4a90b8);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .header-brand-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.7;
        }
        .header-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .header-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 11px;
          opacity: 0.5;
        }
        .header-accent {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${safeAccent};
          margin-right: 6px;
        }
        .content {
          padding: 28px 36px;
          max-width: 100%;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 11px;
        }
        th {
          background: #f4f4f8;
          padding: 8px 12px;
          text-align: left;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 2px solid #e0e0e8;
        }
        td {
          padding: 8px 12px;
          border-bottom: 1px solid #f0f0f6;
          color: #333;
        }
        tr:hover td { background: #fafafa; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        [class*="bg-"] { color: #333 !important; }
        .text-muted-foreground { color: #888 !important; }
        .text-primary { color: ${safeAccent} !important; }
        svg { max-width: 100%; }
        .animate-spin { animation: none !important; }
        nav, .eco-nav, header.sticky, [class*="EcosystemNav"], [data-no-print] { display: none !important; }
        .footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e8;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #aaa;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-brand">
          <div class="header-brand-logo">🏛️</div>
          <span class="header-brand-name">${safeAppName}</span>
        </div>
        <div class="header-title">${safeTitle}</div>
        ${safeSubtitle ? `<div style="font-size:14px;opacity:0.6;margin-bottom:10px">${safeSubtitle}</div>` : ''}
        <div class="header-meta">
          <span><span class="header-accent"></span>${safeTimestamp}</span>
          <span>SZL Holdings Platform</span>
        </div>
      </div>
      <div class="content">${contentHTML}</div>
      <div class="content">
        <div class="footer">
          <span>${safeAppName} · ${safeTitle}</span>
          <span>Generated ${safeTimestamp} · SZL Holdings</span>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

interface ExportButtonProps {
  data?: Record<string, unknown>[];
  options?: ExportOptions;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  label?: string;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
  style?: React.CSSProperties;
}

export function ExportButton({
  data,
  options = {},
  onExportCSV,
  onExportPDF,
  label = 'Export',
  variant = 'default',
  className,
  style,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  const handleCSV = () => {
    setOpen(false);
    if (onExportCSV) {
      onExportCSV();
    } else if (data) {
      exportToCSV(data, options);
    }
  };

  const handlePDF = () => {
    setOpen(false);
    if (onExportPDF) {
      onExportPDF();
    } else {
      exportToPDF(options);
    }
  };

  const baseButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: variant === 'compact' ? '4px 8px' : '6px 12px',
    fontSize: variant === 'compact' ? '11px' : '12px',
    fontWeight: 500,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
    position: 'relative' as const,
    ...style,
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        style={baseButtonStyle}
        className={className}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
        }}
        title="Export data"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path
            d="M6.5 1v7M3.5 5l3 3 3-3M2 10h9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {variant !== 'icon' && label}
        {variant !== 'icon' && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 4l2 2 2-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              zIndex: 1000,
              background: 'rgba(10, 12, 20, 0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '4px',
              minWidth: '160px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={handleCSV}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '14px' }}>📊</span>
              Export as CSV
            </button>
            <button
              onClick={handlePDF}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '14px' }}>📄</span>
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface ExportableTableProps {
  title?: string;
  options?: ExportOptions;
  data?: Record<string, unknown>[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  headerExtra?: React.ReactNode;
}

export function ExportableSection({
  title,
  options,
  data,
  children,
  className,
  style,
  headerExtra,
}: ExportableTableProps) {
  return (
    <div data-export-content className={className} style={style}>
      {(title || data) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {title && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                {title}
              </span>
            )}
            {headerExtra}
          </div>
          {data && data.length > 0 && (
            <ExportButton
              data={data}
              options={{
                ...options,
                ...(title !== undefined
                  ? { title }
                  : options?.title !== undefined
                    ? { title: options.title }
                    : {}),
              }}
              variant="compact"
            />
          )}
        </div>
      )}
      {children}
    </div>
  );
}
