import React, { useState, useEffect, useRef, useCallback } from "react";
import { colors, effects, typography } from "./tokens";
import { useNotificationCenter, type LiveNotification } from "./notification-center";

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

export interface EcosystemNavProps {
  currentAppId: string;
  currentAppName: string;
  accentColor?: string;
  notifications?: EcosystemNotification[];
  onNotificationRead?: (id: string) => void;
  onSearch?: (query: string) => void;
  userName?: string;
  userRole?: string;
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: "vessels",
    name: "Vessels",
    subtitle: "OBSERVE · Maritime",
    path: "/vessels/",
    accent: "#3b82f6",
    icon: "🚢",
    description: "Maritime Intelligence Platform",
  },
  {
    id: "rosie",
    name: "Rosie",
    subtitle: "OBSERVE · Incident Command",
    path: "/msp/",
    accent: "#ef4444",
    icon: "🛡️",
    description: "Threat & Anomaly Visibility",
  },
  {
    id: "beacon",
    name: "Beacon",
    subtitle: "OBSERVE · Business Telemetry",
    path: "/terra/",
    accent: "#0ea5e9",
    icon: "📡",
    description: "KPI Movement & Value Leakage",
  },
  {
    id: "inca",
    name: "INCA",
    subtitle: "UNDERSTAND · AI Research",
    path: "/inca/",
    accent: "#8b5cf6",
    icon: "🧠",
    description: "AI Research Command Center",
  },
  {
    id: "nimbus",
    name: "Nimbus",
    subtitle: "UNDERSTAND · Prediction",
    path: "/dreamscape/",
    accent: "#ec4899",
    icon: "☁️",
    description: "Scenario Modeling & Confidence Scoring",
  },
  {
    id: "aegis",
    name: "Aegis",
    subtitle: "DECIDE · Risk Register",
    path: "/aegis/",
    accent: "#10b981",
    icon: "⚖️",
    description: "Control Plane, Governance & Remediation",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    subtitle: "DECIDE · Brand Strategy",
    path: "/carlota-jo/",
    accent: "#f472b6",
    icon: "✨",
    description: "Brand Intelligence Platform",
  },
  {
    id: "alloyscpe",
    name: "AlloyScape",
    subtitle: "EXECUTE · Automations",
    path: "/alloy/",
    accent: "#00d4ff",
    icon: "⚙️",
    description: "Execution Fabric — Connectors & DAGs",
  },
  {
    id: "firestorm",
    name: "Firestorm",
    subtitle: "EXECUTE · Cyber Ops",
    path: "/firestorm/",
    accent: "#f97316",
    icon: "🔥",
    description: "Cyber Range & Threat Simulation",
  },
  {
    id: "lyte",
    name: "Lyte",
    subtitle: "EXECUTE · AIOps",
    path: "/lyte-command-center/",
    accent: "#f59e0b",
    icon: "⚡",
    description: "AIOps Command Center",
  },
  {
    id: "career",
    name: "Career",
    subtitle: "EXECUTE · Founder Identity",
    path: "/stephen/",
    accent: "#64748b",
    icon: "👤",
    description: "Founder Identity & Thought Leadership",
  },
  {
    id: "szl-holdings",
    name: "SZL Holdings",
    subtitle: "Portfolio",
    path: "/",
    accent: "#a855f7",
    icon: "🏛️",
    description: "Holdings Dashboard",
  },
];

const LEVEL_COLORS: Record<EcosystemNotification["level"], string> = {
  info: "#3b82f6",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const LEVEL_BG: Record<EcosystemNotification["level"], string> = {
  info: "rgba(59,130,246,0.12)",
  warning: "rgba(245,158,11,0.12)",
  critical: "rgba(239,68,68,0.12)",
};

const LEVEL_DOT: Record<EcosystemNotification["level"], string> = {
  info: "#3b82f6",
  warning: "#f59e0b",
  critical: "#ef4444",
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

function AppSwitcherPanel({
  currentAppId,
  onClose,
}: {
  currentAppId: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: "0",
        width: "320px",
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
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "linear-gradient(135deg, #a855f7, #3b82f6)",
              borderRadius: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
            }}
          >
            🏛️
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
            SZL Ecosystem
          </span>
        </div>
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
      <div
        style={{
          marginTop: "14px",
          paddingTop: "12px",
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
          📋 All Projects
        </a>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
          {ECOSYSTEM_APPS.length} apps
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
                background: "#ef4444",
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
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
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
          <span style={{ fontSize: "18px", opacity: 0.5 }}>🔍</span>
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
    { keywords: ["fleet", "vessel", "ship", "port", "maritime", "route", "anchor"], app: "Vessels", icon: "🚢", accent: "#3b82f6", href: "/vessels/", items: ["Fleet Dashboard", "Port Analytics", "Route Planning", "Risk Scoring", "Dark Vessel Detection"] },
    { keywords: ["threat", "security", "soc", "incident", "mitre", "cve", "vulnerability", "firewall"], app: "Firestorm", icon: "🔥", accent: "#ef4444", href: "/firestorm/", items: ["SOC Dashboard", "Threat Intelligence", "Incident Response", "MITRE ATT&CK", "Risk Scoring"] },
    { keywords: ["model", "experiment", "ml", "ai", "neural", "prediction", "benchmark", "gpu"], app: "INCA", icon: "🧠", accent: "#8b5cf6", href: "/inca/", items: ["Experiments", "Model Registry", "Predictions", "Neural Explorer", "GPU Monitoring"] },
    { keywords: ["property", "real estate", "market", "valuation", "portfolio", "listing"], app: "Terra", icon: "🏢", accent: "#10b981", href: "/terra/", items: ["Property Intelligence", "Market Trends", "Portfolio", "Valuations"] },
    { keywords: ["signal", "incident", "playbook", "ops", "topology", "slo", "oncall", "anomaly"], app: "Lyte", icon: "⚡", accent: "#f59e0b", href: "/lyte-command-center/", items: ["Signals", "Incidents", "Playbooks", "AI Ops", "SLO Tracking"] },
    { keywords: ["campaign", "creative", "content", "brand", "calendar", "studio", "voice", "social"], app: "Dreamscape", icon: "🎨", accent: "#ec4899", href: "/dreamscape/", items: ["Campaigns", "AI Studio", "Content Calendar", "Brand Voice", "Social Assets"] },
    { keywords: ["client", "ticket", "device", "contract", "noc", "billing", "technician", "rmm"], app: "Evolve MSP", icon: "💻", accent: "#06b6d4", href: "/msp/", items: ["Client Management", "Service Desk", "Device Inventory", "NOC Operations"] },
    { keywords: ["brand", "consulting", "strategy", "sentiment", "competitive", "positioning"], app: "Carlota Jo", icon: "✨", accent: "#f472b6", href: "/carlota-jo/", items: ["Brand Strategy", "Sentiment Analysis", "Competitive Intel"] },
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

export function EcosystemNav({
  currentAppId,
  currentAppName,
  accentColor = "#a855f7",
  notifications: notificationsProp,
  onNotificationRead,
  onSearch,
  userName = "Admin",
  userRole = "Operator",
}: EcosystemNavProps) {
  const appData = ECOSYSTEM_APPS.find((a) => a.id === currentAppId);
  const notificationCenter = useNotificationCenter(appData?.name ?? currentAppName);

  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const appSwitcherRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useClickOutside(appSwitcherRef, () => setShowAppSwitcher(false));
  useClickOutside(notificationsRef, () => setShowNotifications(false));

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
              width: "26px",
              height: "26px",
              background: "linear-gradient(135deg, #a855f7, #3b82f6)",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              boxShadow: "0 0 12px rgba(168,85,247,0.4)",
            }}
          >
            🏛️
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
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "8px",
              padding: "5px 10px 5px 8px",
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: typography.fontFamily.body,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
            }}
          >
            <span style={{ fontSize: "13px" }}>🔍</span>
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
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#ef4444",
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
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px 4px 6px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "8px",
              cursor: "default",
            }}
          >
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
                flexShrink: 0,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "none" }} className="eco-nav-user-info">
              <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                {userName}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{userRole}</div>
            </div>
          </div>
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
