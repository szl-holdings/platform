import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Globe,
} from 'lucide-react';

const API_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/api';

const DS = {
  bg: '#070b12',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type RiskClass = 'low' | 'medium' | 'high' | 'mutating';
type ConnectionStatus =
  | 'not_connected'
  | 'connected_read_only'
  | 'connected_mutating'
  | 'verification_required';

interface McpServerEntry {
  activationOrder: number;
  slug: string;
  displayName: string;
  category: string;
  declaredScopes: string[];
  riskClass: RiskClass;
  readOnlyReady: boolean;
  connectionStatus: ConnectionStatus;
  governanceNote: string;
  docLink: string;
}

const RISK_CONFIG: Record<
  RiskClass,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: 'Low',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.2)',
  },
  medium: {
    label: 'Medium',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)',
  },
  high: {
    label: 'High',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
  },
  mutating: {
    label: 'Mutating',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
};

const CONNECTION_STATUS_CONFIG: Record<
  ConnectionStatus,
  { icon: React.ReactNode; label: string; color: string }
> = {
  not_connected: {
    icon: <XCircle className="w-3 h-3" />,
    label: 'Not Connected',
    color: 'rgba(255,255,255,0.25)',
  },
  connected_read_only: {
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: 'Connected — Read Only',
    color: '#4ade80',
  },
  connected_mutating: {
    icon: <AlertTriangle className="w-3 h-3" />,
    label: 'Connected — Mutations Allowed',
    color: '#f97316',
  },
  verification_required: {
    icon: <Clock className="w-3 h-3" />,
    label: 'Verification Required',
    color: '#fbbf24',
  },
};

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const cfg = CONNECTION_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
      style={{
        color: cfg.color,
        background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}35`,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function RiskBadge({ riskClass }: { riskClass: RiskClass }) {
  const c = RISK_CONFIG[riskClass];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}

function ServerRow({ server }: { server: McpServerEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        background: DS.surface,
        border: `1px solid ${DS.border}`,
      }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer"
        style={{ gap: '12px' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] font-bold"
          style={{
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.2)',
            color: '#38bdf8',
          }}
        >
          {server.activationOrder}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: DS.text.primary }}>
              {server.displayName}
            </span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                color: DS.text.muted,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${DS.border}`,
              }}
            >
              {server.category}
            </span>
            <RiskBadge riskClass={server.riskClass} />
          </div>
          <div className="mt-1">
            <ConnectionStatusBadge status={server.connectionStatus} />
          </div>
        </div>

        <ChevronRight
          className="w-4 h-4 shrink-0 mt-1 transition-transform"
          style={{
            color: DS.text.muted,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {expanded && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: `1px solid ${DS.border}` }}
        >
          <div className="pt-3 space-y-3">
            {server.readOnlyReady && (
              <div
                className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.2)',
                }}
              >
                <CheckCircle2 className="w-3 h-3" />
                Read-only governance review passed
              </div>
            )}
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-wider mb-1"
                style={{ color: DS.text.muted }}
              >
                Governance Note
              </p>
              <p className="text-xs" style={{ color: DS.text.secondary }}>
                {server.governanceNote}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-wider mb-1"
                style={{ color: DS.text.muted }}
              >
                Declared Scopes
              </p>
              <div className="flex flex-wrap gap-1">
                {server.declaredScopes.map((scope) => (
                  <span
                    key={scope}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      color: '#38bdf8',
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.15)',
                    }}
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <a
                href={server.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: '#38bdf8', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Vendor API Documentation
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeridianMcpActivationPage() {
  const [servers, setServers] = useState<McpServerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/meridian-mcp/registry`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const list: McpServerEntry[] = data.data?.servers ?? data.servers ?? [];
        setServers(list);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const readOnlyActiveCount = servers.filter(
    (s) => s.connectionStatus === 'connected_read_only',
  ).length;
  const notConnectedCount = servers.filter(
    (s) => s.connectionStatus === 'not_connected',
  ).length;

  return (
    <div className="min-h-screen" style={{ background: DS.bg, color: DS.text.primary }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/meridian"
            className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition-colors"
            style={{ color: DS.text.muted, textDecoration: 'none' }}
          >
            <ChevronRight className="w-3 h-3" style={{ transform: 'rotate(180deg)' }} />
            Meridian
          </Link>
          <ChevronRight className="w-3 h-3" style={{ color: DS.text.muted }} />
          <span
            className="text-[11px] font-mono uppercase tracking-wider"
            style={{ color: DS.text.secondary }}
          >
            MCP Activation
          </span>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.2)',
            }}
          >
            <Shield className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight mb-1"
              style={{ color: DS.text.primary }}
            >
              MCP Activation Status
            </h1>
            <p className="text-sm" style={{ color: DS.text.secondary }}>
              15 governed external MCP servers in canonical activation order. All connections default
              to read-only. Mutations require explicit human approval.
            </p>
          </div>
        </div>

        <div
          className="rounded-lg px-4 py-3 mb-6 text-sm"
          style={{
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.15)',
            color: DS.text.secondary,
          }}
        >
          <strong style={{ color: '#38bdf8' }}>Read-First Governance Rule:</strong> Verify
          read-only capabilities for each MCP server before enabling any write scope. Any action
          that creates, updates, deletes, sends, publishes, makes a payment, or changes permissions
          requires explicit human confirmation. See{' '}
          <code
            className="text-[11px] px-1 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#38bdf8' }}
          >
            docs/mcp-read-first-governance.md
          </code>
          .
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div
              className="rounded-lg px-4 py-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="text-2xl font-bold" style={{ color: DS.text.primary }}>
                {servers.length}
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                Total Servers
              </div>
            </div>
            <div
              className="rounded-lg px-4 py-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>
                {readOnlyActiveCount}
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                Read-Only Active
              </div>
            </div>
            <div
              className="rounded-lg px-4 py-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="text-2xl font-bold" style={{ color: DS.text.secondary }}>
                {notConnectedCount}
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                Pending Activation
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-16" style={{ color: DS.text.muted }}>
            <Globe className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: '#38bdf8' }} />
            <p className="text-sm font-mono">Loading registry…</p>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-sm"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            Failed to load registry: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {servers.map((server) => (
              <ServerRow key={server.slug} server={server} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
