import { AlertCircle, BarChart3, ExternalLink, Loader2, Lock, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from './utils';

export interface PowerBiEmbedConfig {
  reportId: string;
  groupId: string;
  embedUrl: string;
  embedToken: string;
  expiration?: string;
}

interface PowerBiEmbedProps {
  config?: PowerBiEmbedConfig | null;
  title?: string;
  description?: string;
  height?: string | number;
  className?: string;
  onConfigureClick?: () => void;
  reportType?: string;
  accentColor?: string;
}

declare global {
  interface Window {
    powerbi?: {
      embed: (container: HTMLElement, config: unknown) => { off: (event: string) => void };
      models: { TokenType: { Embed: number }; Permissions: { Read: number } };
    };
  }
}

function loadPowerBiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.powerbi) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-pbi]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Power BI script')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.js';
    script.dataset.pbi = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Power BI client SDK'));
    document.head.appendChild(script);
  });
}

function PowerBiFrame({ config, title }: { config: PowerBiEmbedConfig; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadPowerBiScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.powerbi) return;
        const pbi = window.powerbi;
        const instance = pbi.embed(containerRef.current, {
          type: 'report',
          id: config.reportId,
          embedUrl: config.embedUrl,
          accessToken: config.embedToken,
          tokenType: pbi.models.TokenType.Embed,
          permissions: pbi.models.Permissions.Read,
          settings: {
            panes: {
              filters: { visible: false },
              pageNavigation: { visible: true },
            },
          },
        });
        instance.off('loaded');
        if (mounted) setLoading(false);
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Embed SDK load failed');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [config.reportId, config.embedToken, config.embedUrl]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#c45a4a] mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">Failed to load report</div>
          <div className="text-xs text-muted-foreground max-w-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading {title}…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" aria-label={title} />
    </>
  );
}

export function PowerBiEmbed({
  config,
  title = 'Power BI Report',
  description = 'Embedded analytics report',
  height = 520,
  className,
  onConfigureClick,
  accentColor = '#4a90b8',
}: PowerBiEmbedProps) {
  const isConfigured = !!(config?.embedUrl && config?.embedToken && config?.reportId);
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card overflow-hidden flex flex-col',
        className,
      )}
      style={{ height: heightValue }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}22` }}
          >
            <BarChart3 className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>
            <div className="text-[10px] text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured && (
            <button
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Open in Power BI"
              onClick={() =>
                window.open(
                  `https://app.powerbi.com/groups/${config?.groupId}/reports/${config?.reportId}`,
                  '_blank',
                )
              }
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {onConfigureClick && (
            <button
              onClick={onConfigureClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Settings className="w-3 h-3" />
              {isConfigured ? 'Reconfigure' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {!isConfigured ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-xs mx-auto px-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `${accentColor}22` }}
              >
                <BarChart3 className="w-7 h-7" style={{ color: accentColor }} />
              </div>
              <div className="text-base font-semibold text-foreground mb-1">Connect Power BI</div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Configure your Power BI workspace credentials to embed live reports and analytics
                directly in this view.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center mb-4">
                <Lock className="w-3 h-3" />
                <span>Embed tokens generated server-side · tokens never exposed in URLs</span>
              </div>
              {onConfigureClick && (
                <button
                  onClick={onConfigureClick}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                  style={{ background: accentColor }}
                >
                  Configure Connection
                </button>
              )}
            </div>
          </div>
        ) : (
          <PowerBiFrame config={config!} title={title} />
        )}
      </div>

      {isConfigured && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-pulse" />
            <span className="text-[10px] text-muted-foreground">
              Live · Power BI Embedded · Token server-minted
            </span>
          </div>
          {config?.expiration && (
            <span className="text-[10px] text-muted-foreground">
              Expires: {new Date(config?.expiration).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
