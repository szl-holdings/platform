import React, { useState, useEffect, useRef, useCallback } from "react";
import { colors, effects, typography } from "./tokens";
import { useNotificationCenter, type LiveNotification } from "./notification-center";
import {
  DOCTRINE_APP_MAP,
  DOCTRINE_LAYER_COLORS,
  DOCTRINE_LAYER_ORDER,
  type DoctrineLayer,
} from "./doctrine-layer";
import { DemoModeSwitcher } from "./demo-mode";
import { SandboxToggle } from "./sandbox-mode";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { useNotificationSound } from "./use-user-prefs";

export interface EcosystemApp {
  id: string;
  name: string;
  subtitle: string;
  path: string;
  accent: string;
  icon: string;
  description?: string;
}

export interface EcosystemNotification {
  id: string;
  appId: string;
  appName: string;
  title: string;
  message: string;
  level: "info" | "warning" | "critical";
  timestamp: Date;
  read?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface RecentItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  appId: string;
  appName: string;
  timestamp: number;
}

export type DeploymentEnvironment = "production" | "pilot" | "sandbox";

export interface EcosystemNavProps {
  currentAppId: string;
  currentAppName: string;
  accentColor?: string;
  notifications?: EcosystemNotification[];
  onNotificationRead?: (id: string) => void;
  onSearch?: (query: string) => void;
  userName?: string;
  userRole?: string;
  breadcrumbs?: BreadcrumbItem[];
  environment?: DeploymentEnvironment;
}

const ENV_CHIP_STYLE: Record<DeploymentEnvironment, { dot: string; label: string; color: string; border: string; bg: string }> = {
  production: { dot: "hsl(152 55% 50%)", label: "Production", color: "hsl(152 35% 78%)", border: "hsla(152 55% 50% / 0.30)", bg: "hsla(152 55% 30% / 0.10)" },
  pilot:      { dot: "hsl(42 80% 55%)",  label: "Pilot",      color: "hsl(42 50% 80%)",  border: "hsla(42 80% 50% / 0.30)",  bg: "hsla(42 80% 30% / 0.10)" },
  sandbox:    { dot: "hsl(210 40% 60%)", label: "Sandbox",    color: "hsl(210 25% 78%)", border: "hsla(210 40% 50% / 0.28)", bg: "hsla(210 40% 30% / 0.10)" },
};

function detectEnvironment(): DeploymentEnvironment {
  if (typeof window === "undefined") return "sandbox";
  const host = window.location.hostname.toLowerCase();
  if (host.includes("pilot") || host.includes("staging")) return "pilot";
  if (host === "szlholdings.com" || host === "www.szlholdings.com") return "production";
  if (host.endsWith(".szlholdings.com")) return "production";
  return "sandbox";
}

function EnvironmentChip({ environment }: { environment: DeploymentEnvironment }) {
  const s = ENV_CHIP_STYLE[environment];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 8px",
        borderRadius: "3px",
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
      title={`Environment: ${s.label}`}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.10em",
          color: s.color,
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          textTransform: "uppercase",
        }}
      >
        {s.label}
      </span>
    </div>
  );
}

const RECENT_ITEMS_KEY = "szl-ecosystem-recent-items";

export function trackRecentItem(item: Omit<RecentItem, "timestamp">): void {
  try {
    const existing: RecentItem[] = JSON.parse(localStorage.getItem(RECENT_ITEMS_KEY) || "[]");
    const filtered = existing.filter((i) => i.id !== item.id);
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 20);
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function getRecentItems(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ITEMS_KEY) || "[]");
  } catch {
    return [];
  }
}

function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    setItems(getRecentItems());
  }, []);
  return items;
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: "szl-holdings",
    name: "SZL Holdings",
    subtitle: "Ecosystem · Parent Company",
    path: "/",
    accent: "#94a3b8",
    icon: "◆",
    description: "Premium Command Systems Ecosystem",
  },
  {
    id: "alloy",
    name: "Alloy",
    subtitle: "Execution Fabric · Governed Orchestration",
    path: "/alloy",
    accent: "#60a5fa",
    icon: "⬡",
    description: "Execution Fabric & Governed Orchestration Engine",
  },
  {
    id: "command",
    name: "Command",
    subtitle: "Command Surface · Unified Workspace",
    path: "/command/",
    accent: "#22d3ee",
    icon: "◆",
    description: "Unified Command — Strategy, Operations & Infrastructure",
  },
  {
    id: "aegis",
    name: "Aegis",
    subtitle: "Domain Pack · Unified Defense & Intelligence",
    path: "/aegis/",
    accent: "#8b7ac8",
    icon: "⬡",
    description: "Unified Defense, Managed Operations & AI Intelligence",
  },
  {
    id: "vessels",
    name: "Vessels",
    subtitle: "Domain Pack · Maritime Intelligence",
    path: "/vessels/",
    accent: "#38bdf8",
    icon: "⚓",
    description: "Maritime Command Intelligence Platform",
  },
  {
    id: "terra",
    name: "Terra",
    subtitle: "Domain Pack · Real Estate Intelligence",
    path: "/terra/",
    accent: "#c87941",
    icon: "⬢",
    description: "Real Estate Broker Command Platform",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    subtitle: "Domain Pack · Premium Advisory",
    path: "/carlota-jo/",
    accent: "#d4b896",
    icon: "◈",
    description: "Premium Advisory — High-Trust Client Operations",
  },
  {
    id: "szl-leadership",
    name: "Leadership",
    subtitle: "Founder · SZL Holdings",
    path: "/leadership",
    accent: "#94a3b8",
    icon: "○",
    description: "Stephen Lutar — Founder & Systems Architect",
  },
];

const LEVEL_COLORS: Record<EcosystemNotification["level"], string> = {
  info: "#4a90b8",
  warning: "#d4a054",
  critical: "#c45a4a",
};

const LEVEL_BG: Record<EcosystemNotification["level"], string> = {
  info: "rgba(59,130,246,0.12)",
  warning: "rgba(245,158,11,0.12)",
  critical: "rgba(239,68,68,0.12)",
};

const LEVEL_DOT: Record<EcosystemNotification["level"], string> = {
  info: "#4a90b8",
  warning: "#d4a054",
  critical: "#c45a4a",
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handlerRef.current();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ref]);
}

function AppGridIcon({ app, isCurrent }: { app: EcosystemApp; isCurrent: boolean }) {
  return (
    <a
      href={app.path}
      aria-label={`${app.name}${isCurrent ? " (current)" : ""}`}
      aria-current={isCurrent ? "page" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        padding: "10px 8px",
        borderRadius: "10px",
        textDecoration: "none",
        background: isCurrent ? `${app.accent}20` : "transparent",
        border: isCurrent ? `1px solid ${app.accent}40` : "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        minWidth: "80px",
      }}
      onMouseEnter={(e) => {
        if (!isCurrent) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrent) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
        }
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: `${app.accent}25`,
          border: `1px solid ${app.accent}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          boxShadow: isCurrent ? `0 0 12px ${app.accent}40` : "none",
        }}
      >
        {app.icon}
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: isCurrent ? 600 : 500,
          color: isCurrent ? app.accent : "rgba(255,255,255,0.75)",
          textAlign: "center",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "76px",
        }}
      >
        {app.name}
      </span>
    </a>
  );
}

function DoctrineLayerSection({
  layer,
  currentAppId,
}: {
  layer: DoctrineLayer;
  currentAppId: string;
}) {
  const layerApps = DOCTRINE_APP_MAP.filter((c) => c.layers.includes(layer));
  if (layerApps.length === 0) return null;

  const c = DOCTRINE_LAYER_COLORS[layer];

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "5px",
          paddingBottom: "4px",
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <span
          style={{
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: c.color,
            fontFamily: "'Geist Mono', monospace",
          }}
        >
          {layer}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {layerApps.map((docApp) => {
          const app = ECOSYSTEM_APPS.find((a) => a.id === docApp.appId);
          if (!app) return null;
          const isCurrent = app.id === currentAppId;
          return (
            <a
              key={app.id}
              href={app.path}
              title={docApp.primaryRole}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 7px",
                borderRadius: "6px",
                textDecoration: "none",
                background: isCurrent ? `${c.color}18` : "rgba(255,255,255,0.04)",
                border: isCurrent ? `1px solid ${c.border}` : "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                minWidth: "0",
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.12)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.07)";
                }
              }}
            >
              <span style={{ fontSize: "13px" }}>{app.icon}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? c.color : "rgba(255,255,255,0.7)",
                  whiteSpace: "nowrap",
                }}
              >
                {app.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function RecentItemsList({ items }: { items: RecentItem[] }) {
  if (items.length === 0) return null;
  const recent = items.slice(0, 5);
  return (
    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
          marginBottom: "6px",
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        Recent
      </div>
      {recent.map((item) => {
        const app = ECOSYSTEM_APPS.find((a) => a.id === item.appId);
        return (
          <a
            key={item.id}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 6px",
              borderRadius: "6px",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: "12px", flexShrink: 0, opacity: 0.7 }}>{app?.icon ?? "○"}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontWeight: 500,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>
                {item.appName}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function AppSwitcherPanel({
  currentAppId,
  onClose,
  recentItems,
}: {
  currentAppId: string;
  onClose: () => void;
  recentItems: RecentItem[];
}) {
  const [viewMode, setViewMode] = useState<"layer" | "grid">("layer");

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: "0",
        width: "340px",
        background: "rgba(10, 12, 20, 0.97)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            SZL
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            SZL Holdings Platform
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setViewMode(viewMode === "layer" ? "grid" : "layer")}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: "9px",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: "4px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {viewMode === "layer" ? "Grid" : "Layers"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              padding: "2px",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {viewMode === "layer" ? (
        <div>
          {DOCTRINE_LAYER_ORDER.map((layer) => (
            <DoctrineLayerSection key={layer} layer={layer} currentAppId={currentAppId} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4px",
          }}
        >
          {ECOSYSTEM_APPS.map((app) => (
            <AppGridIcon key={app.id} app={app} isCurrent={app.id === currentAppId} />
          ))}
        </div>
      )}

      <RecentItemsList items={recentItems} />

      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href="/"
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")}
        >
          All Projects
        </a>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "'Geist Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          SZL Holdings · Governed Decision Operating System
        </span>
      </div>
    </div>
  );
}

function NotificationsPanel({
  notifications,
  onRead,
  onMarkAllRead,
  onClose,
}: {
  notifications: LiveNotification[];
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  const [soundOn, setSoundOn] = useNotificationSound();
  const unread = notifications.filter((n) => !n.read);
  const recent = [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

  const handleItemClick = (n: LiveNotification) => {
    onRead(n.id);
    if (n.actionUrl) {
      window.location.href = n.actionUrl;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: "0",
        width: "360px",
        background: "rgba(10, 12, 20, 0.97)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        padding: "0",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Notifications
          </span>
          {unread.length > 0 && (
            <span
              style={{
                background: "#c45a4a",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "99px",
              }}
            >
              {unread.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setSoundOn(!soundOn)}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute notification sound" : "Unmute notification sound"}
            title={soundOn ? "Notification sound on" : "Notification sound muted"}
            style={{
              background: "none",
              border: "none",
              color: soundOn ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              padding: "2px",
              lineHeight: 0,
              borderRadius: "4px",
              transition: "color 0.15s",
            }}
          >
            {soundOn ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2L4 5H2v6h2l4 3V2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                <path d="M11 5.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                <path d="M13 3.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2L4 5H2v6h2l4 3V2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {unread.length > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "4px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              padding: "2px",
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {recent.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: "13px",
            }}
          >
            No notifications
          </div>
        ) : (
          recent.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                cursor: n.actionUrl ? "pointer" : "default",
                background: n.read ? "transparent" : LEVEL_BG[n.level],
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = n.read ? "transparent" : LEVEL_BG[n.level];
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: LEVEL_DOT[n.level],
                    flexShrink: 0,
                    marginTop: "5px",
                    opacity: n.read ? 0.4 : 1,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: LEVEL_COLORS[n.level],
                        opacity: n.read ? 0.6 : 1,
                      }}
                    >
                      {n.appName}
                    </span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: n.read ? 400 : 600,
                      color: n.read ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)",
                      marginBottom: "2px",
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {n.message}
                  </div>
                  {n.actionUrl && !n.read && (
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                      Click to view →
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <a
          href="/notifications"
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
          onClick={onClose}
        >
          View all notifications →
        </a>
      </div>
    </div>
  );
}

function GlobalSearchPanel({
  onClose,
  onSearch,
}: {
  onClose: () => void;
  onSearch?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchResults = getSearchResults(query);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "80px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "560px",
          maxWidth: "calc(100vw - 32px)",
          background: "rgba(10, 12, 20, 0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && onSearch) {
                onSearch(query);
                onClose();
              }
            }}
            placeholder="Search across all apps — vessels, threats, projects, clients..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.9)",
              fontSize: "15px",
              fontFamily: typography.fontFamily.body,
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: "11px",
              padding: "3px 8px",
              fontFamily: typography.fontFamily.mono,
            }}
          >
            ESC
          </button>
        </div>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {query.length < 2 ? (
            <div>
              <div
                style={{
                  padding: "12px 20px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Quick Access
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "4px",
                  padding: "0 12px 12px",
                }}
              >
                {ECOSYSTEM_APPS.slice(0, 8).map((app) => (
                  <a
                    key={app.id}
                    href={app.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "13px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <span style={{ fontSize: "16px" }}>{app.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "12px" }}>{app.name}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                        {app.subtitle}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: "13px",
              }}
            >
              No results for "{query}"
            </div>
          ) : (
            <div>
              {searchResults.map((result, i) => (
                <a
                  key={i}
                  href={result.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 20px",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>{result.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.85)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {result.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                      {result.app} · {result.section}
                    </div>
                  </div>
                  <span style={{ fontSize: "10px", color: result.accentColor, flexShrink: 0 }}>
                    {result.tag}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {[
            ["↑↓", "navigate"],
            ["↵", "open"],
            ["esc", "close"],
          ].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "1px 6px",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: typography.fontFamily.mono,
                }}
              >
                {key}
              </span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

interface SearchResult {
  icon: string;
  title: string;
  app: string;
  section: string;
  tag: string;
  accentColor: string;
  href: string;
}

function getSearchResults(query: string): SearchResult[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  for (const app of ECOSYSTEM_APPS) {
    if (
      app.name.toLowerCase().includes(q) ||
      app.subtitle.toLowerCase().includes(q)
    ) {
      results.push({
        icon: app.icon,
        title: app.name,
        app: app.name,
        section: app.subtitle,
        tag: "App",
        accentColor: app.accent,
        href: app.path,
      });
    }
  }
  const domainResults = getDomainSearchResults(q);
  results.push(...domainResults);
  return results.slice(0, 12);
}

function getDomainSearchResults(q: string): SearchResult[] {
  const results: SearchResult[] = [];
  const searchableContent = [
    { keywords: ["fleet", "vessel", "ship", "port", "maritime", "route", "anchor"], app: "Vessels", icon: "🚢", accent: "#4a90b8", href: "/vessels/", items: ["Fleet Dashboard", "Port Analytics", "Route Planning", "Risk Scoring", "Dark Vessel Detection"] },
    { keywords: ["signal", "workflow", "observability", "playbook", "ops", "anomaly", "business", "escalation", "strategy", "operations", "infrastructure", "command"], app: "Command", icon: "◆", accent: "#22d3ee", href: "/command/", items: ["Strategy Workspace", "Operations Workspace", "Infrastructure Workspace", "Command Inbox", "Approvals Center", "Ownership Map", "Escalation Center"] },
    { keywords: ["alloy", "automation", "connector", "workflow", "orchestration", "execution", "run"], app: "Alloy", icon: "⬡", accent: "#60a5fa", href: "/alloy/", items: ["Execution Runs", "Workflow Orchestration", "Connector Mesh", "Governance", "Automation Analytics"] },
    { keywords: ["brand", "consulting", "advisory", "discreet", "residence", "estate", "private"], app: "Carlota Jo", icon: "◈", accent: "#d4b896", href: "/carlota-jo/", items: ["Services", "Approach", "Private Inquiry"] },
  ];

  for (const domain of searchableContent) {
    if (domain.keywords.some((k) => k.includes(q) || q.includes(k))) {
      for (const item of domain.items) {
        if (results.length >= 10) break;
        results.push({
          icon: domain.icon,
          title: item,
          app: domain.app,
          section: "Feature",
          tag: "Page",
          accentColor: domain.accent,
          href: domain.href,
        });
      }
    }
  }
  return results;
}

function DoctrineNavBadge({ appId }: { appId: string }) {
  const config = DOCTRINE_APP_MAP.find((c) => c.appId === appId);
  if (!config || config.layers.length === 0) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 7px",
        borderRadius: "3px",
        background: "hsla(0 0% 100% / 0.03)",
        border: "1px solid hsla(0 0% 100% / 0.09)",
      }}
      title={`${config.primaryRole} · ${config.layers.join(" · ")}`}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "hsla(0 0% 100% / 0.45)",
        }}
      />
      <span
        style={{
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.55)",
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          textTransform: "uppercase",
        }}
      >
        {config.primaryRole}
      </span>
    </div>
  );
}

export function EcosystemNav({
  currentAppId,
  currentAppName,
  accentColor = "#8b7ac8",
  notifications: notificationsProp,
  onNotificationRead,
  onSearch,
  userName: userNameProp,
  userRole: userRoleProp,
  breadcrumbs,
  environment,
}: EcosystemNavProps) {
  const envValue: DeploymentEnvironment = environment ?? detectEnvironment();
  const { user, isAuthenticated, login, logout } = useAuth();
  const appData = ECOSYSTEM_APPS.find((a) => a.id === currentAppId);
  const notificationCenter = useNotificationCenter(appData?.name ?? currentAppName);
  const recentItems = useRecentItems();

  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const appSwitcherRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(appSwitcherRef, () => setShowAppSwitcher(false));
  useClickOutside(notificationsRef, () => setShowNotifications(false));
  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        // Defer to app-level command palette if registered
        if ((window as any).__hasCommandPalette) return;
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { notifications: liveNotifications, unreadCount, markRead, markAllRead } = notificationCenter;

  const [notifSoundOn] = useNotificationSound();
  const prevUnreadRef = useRef(unreadCount);
  const chimeBaselineSetRef = useRef(false);
  useEffect(() => {
    const prev = prevUnreadRef.current;
    prevUnreadRef.current = unreadCount;
    // Skip the first transition after mount so existing unread items present
    // at initial hydration do not trigger a chime — only real new arrivals do.
    if (!chimeBaselineSetRef.current) {
      chimeBaselineSetRef.current = true;
      return;
    }
    if (!notifSoundOn) return;
    if (unreadCount <= prev) return;
    if (typeof window === "undefined") return;
    try {
      const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
      osc.onended = () => { void ctx.close(); };
    } catch {
      /* sound is best-effort */
    }
  }, [unreadCount, notifSoundOn]);

  const handleNotificationRead = useCallback(
    (id: string) => {
      markRead(id);
      onNotificationRead?.(id);
    },
    [markRead, onNotificationRead]
  );

  const currentApp = ECOSYSTEM_APPS.find((a) => a.id === currentAppId);

  return (
    <>
      <nav
        role="banner"
        aria-label="Global navigation"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9000,
          height: "48px",
          display: "flex",
          alignItems: "center",
          gap: "0",
          background: "rgba(8, 10, 18, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 16px",
          boxShadow: `0 1px 0 0 ${accentColor}20, 0 4px 24px rgba(0,0,0,0.4)`,
          fontFamily: typography.fontFamily.body,
        }}
      >
        <a
          href="/"
          aria-label="SZL Holdings — home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            marginRight: "16px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            SZL
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.5px",
              display: "none",
            }}
            className="eco-nav-brand-label"
          >
            SZL
          </span>
        </a>

        <div
          style={{
            width: "1px",
            height: "20px",
            background: "rgba(255,255,255,0.1)",
            marginRight: "16px",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: "0 0 auto",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              whiteSpace: "nowrap",
            }}
          >
            {currentAppName}
          </span>
          <DoctrineNavBadge appId={currentAppId} />
          <EnvironmentChip environment={envValue} />
        </div>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginLeft: "8px",
              flexShrink: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>›</span>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    style={{
                      fontSize: "12px",
                      color: i === breadcrumbs.length - 1 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "120px",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = i === breadcrumbs.length - 1 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)"; }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      color: i === breadcrumbs.length - 1 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "120px",
                    }}
                  >
                    {crumb.label}
                  </span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>›</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div style={{ display: "none" }} className="eco-nav-demomode">
            <SandboxToggle compact />
          </div>
          <div style={{ display: "none" }} className="eco-nav-persona">
            <DemoModeSwitcher compact />
          </div>
          <button
            onClick={() => setShowSearch(true)}
            aria-label="Search (Ctrl+K)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "8px",
              padding: "5px 10px 5px 8px",
              color: "rgba(255,255,255,0.72)",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: typography.fontFamily.body,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.72)";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ display: "none" }} className="eco-nav-search-label">
              Search...
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                padding: "1px 5px",
                fontSize: "10px",
                fontFamily: typography.fontFamily.mono,
                marginLeft: "2px",
              }}
            >
              ⌘K
            </span>
          </button>

          <div ref={notificationsRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowAppSwitcher(false);
              }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              aria-expanded={showNotifications}
              aria-haspopup="dialog"
              style={{
                position: "relative",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: showNotifications ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!showNotifications)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!showNotifications)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: "rgba(255,255,255,0.7)" }}>
                <path d="M8 1.5a4 4 0 0 0-4 4v2.382a1 1 0 0 1-.106.447l-1.106 2.213A.5.5 0 0 0 3.236 11h9.528a.5.5 0 0 0 .448-.724l-1.106-2.213a1 1 0 0 1-.106-.447V5.5a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#c45a4a",
                    border: "2px solid rgba(8,10,18,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationsPanel
                notifications={liveNotifications}
                onRead={handleNotificationRead}
                onMarkAllRead={markAllRead}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          <div ref={appSwitcherRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowAppSwitcher(!showAppSwitcher);
                setShowNotifications(false);
              }}
              aria-label="Switch application"
              aria-expanded={showAppSwitcher}
              aria-haspopup="dialog"
              title="Switch app"
              style={{
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: showAppSwitcher ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!showAppSwitcher)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!showAppSwitcher)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
            >
              <GridIcon />
            </button>
            {showAppSwitcher && (
              <AppSwitcherPanel
                currentAppId={currentAppId}
                onClose={() => setShowAppSwitcher(false)}
                recentItems={recentItems}
              />
            )}
          </div>

          {isAuthenticated && user ? (
            <div ref={userMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                  setShowAppSwitcher(false);
                }}
                title={`Signed in as ${user.displayName || user.name || user.username || "User"}`}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 10px 4px 6px",
                  background: showUserMenu ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    style={{ width: "24px", height: "24px", borderRadius: "6px", objectFit: "cover", flexShrink: 0, border: `1px solid ${accentColor}50` }}
                  />
                ) : (
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: `${accentColor}30`,
                      border: `1px solid ${accentColor}50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: accentColor,
                      flexShrink: 0,
                    }}
                  >
                    {(user.displayName || user.name || user.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: "none" }} className="eco-nav-user-info">
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.2 }}>
                    {user.displayName || user.name || user.username || "User"}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                    {user.roles && user.roles.length > 0 ? user.roles[0] : userRoleProp || "Member"}
                  </div>
                </div>
              </button>
              {showUserMenu && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "200px",
                    background: "rgba(10, 12, 20, 0.97)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "6px",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    zIndex: 9999,
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px 10px",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                      {user.displayName || user.name || user.username || "User"}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                      {user.roles && user.roles.length > 0 ? user.roles[0] : userRoleProp || "Member"}
                    </div>
                  </div>
                  {([
                    {
                      label: "Account Settings",
                      href: "/admin/platform-settings",
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.27 1.27M4.67 11.33L3.4 12.6M12.6 12.6l-1.27-1.27M4.67 4.67L3.4 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      ),
                    },
                    {
                      label: "Notifications",
                      href: "/notifications",
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M8 1.5a4 4 0 0 0-4 4v2.382a1 1 0 0 1-.106.447l-1.106 2.213A.5.5 0 0 0 3.236 11h9.528a.5.5 0 0 0 .448-.724l-1.106-2.213a1 1 0 0 1-.106-.447V5.5a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                          <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                        </svg>
                      ),
                    },
                  ] as const).map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        textDecoration: "none",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "12px",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <span style={{ width: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.55)" }}>{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    role="menuitem"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "7px",
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "rgba(255,80,80,0.7)",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,80,80,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: "14px", width: "18px", textAlign: "center" }}>→</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={login}
              title="Sign in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                color: accentColor,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${accentColor}35`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${accentColor}20`; }}
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {showSearch && (
        <GlobalSearchPanel
          onClose={() => setShowSearch(false)}
          onSearch={onSearch}
        />
      )}

      <style>{`
        @media (min-width: 640px) {
          .eco-nav-brand-label { display: inline !important; }
          .eco-nav-search-label { display: inline !important; }
          .eco-nav-user-info { display: block !important; }
        }
      `}</style>
    </>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.6)" />
      <rect x="10" y="1" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.6)" />
      <rect x="1" y="10" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.6)" />
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

export function useEcosystemNotifications(appId: string) {
  const [notifications, setNotifications] = useState<EcosystemNotification[]>([]);

  const publish = useCallback(
    (notification: Omit<EcosystemNotification, "id" | "appId" | "appName" | "timestamp">) => {
      const appData = ECOSYSTEM_APPS.find((a) => a.id === appId);
      const n: EcosystemNotification = {
        id: `${appId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        appId,
        appName: appData?.name ?? appId,
        timestamp: new Date(),
        read: false,
        ...notification,
      };
      setNotifications((prev) => [n, ...prev].slice(0, 50));
    },
    [appId]
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  return { notifications, publish, markRead };
}

export default EcosystemNav;
