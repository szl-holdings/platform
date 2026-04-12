import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Network, ArrowRight, X, Shield, AlertTriangle, Zap, Scale, Activity, TrendingUp,
  ChevronDown, ChevronUp,
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "hsl(0,72%,56%)",
  high: "hsl(22,90%,56%)",
  medium: "hsl(38,72%,58%)",
  low: "hsl(192,72%,48%)",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  threat: Shield,
  distress: AlertTriangle,
  incident: Zap,
  compliance: Scale,
  anomaly: Activity,
  risk: TrendingUp,
};

const VENTURE_COLORS: Record<string, string> = {
  vessels: "hsl(206,72%,52%)",
  aegis: "hsl(222,60%,62%)",
  terra: "hsl(140,50%,48%)",
  prism: "hsl(38,72%,58%)",
  lyte: "hsl(192,72%,48%)",
  "carlota-jo": "hsl(280,50%,65%)",
};

interface MeshEvent {
  id: string;
  sourceVenture: string;
  sourceVentureName: string;
  targetVenture: string;
  targetVentureName: string;
  signalType: string;
  severity: string;
  title: string;
  enrichmentContext: string;
  actionRecommendation: string;
  confidence: number;
  enrichedAt: string;
  compoundInsight: boolean;
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface CrossVentureIntelBadgeProps {
  ventureId: string;
  ventureName: string;
  accentColor?: string;
  compact?: boolean;
}

export function CrossVentureIntelBadge({ ventureId, ventureName, accentColor = "hsl(192,72%,48%)", compact = false }: CrossVentureIntelBadgeProps) {
  const [events, setEvents] = useState<MeshEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch(`/api/intelligence-mesh/venture-inbox/${ventureId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 30000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const visibleEvents = events.filter(e => !dismissed.has(e.id));
  const unread = visibleEvents.length;

  if (loading) {
    return (
      <div style={{
        height: compact ? 48 : 64,
        borderRadius: "0.625rem",
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.06)",
        animation: "pulse 2s ease-in-out infinite",
      }} />
    );
  }

  if (unread === 0) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: compact ? "0.5rem 0.875rem" : "0.75rem 1rem",
        borderRadius: "0.625rem",
        background: "hsla(0,0%,100%,0.02)",
        border: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <Network size={14} color="hsl(214,7%,35%)" />
        <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,40%)" }}>No active mesh signals for {ventureName}</span>
        <Link href="/intelligence-mesh" style={{ marginLeft: "auto", fontSize: "0.75rem", color: "hsl(214,7%,45%)", textDecoration: "none" }}>
          View Mesh →
        </Link>
      </div>
    );
  }

  const criticalCount = visibleEvents.filter(e => e.severity === "critical").length;
  const highCount = visibleEvents.filter(e => e.severity === "high").length;

  const badgeColor = criticalCount > 0 ? "hsl(0,72%,56%)" : highCount > 0 ? "hsl(22,90%,56%)" : accentColor;

  return (
    <div style={{
      borderRadius: "0.75rem",
      border: `1px solid ${badgeColor}44`,
      background: `${badgeColor}08`,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: compact ? "0.625rem 0.875rem" : "0.875rem 1rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: "0.5rem", flexShrink: 0,
          background: `${badgeColor}18`,
          border: `1px solid ${badgeColor}44`,
          position: "relative",
        }}>
          <Network size={14} color={badgeColor} />
          <span style={{
            position: "absolute",
            top: -5, right: -5,
            width: 16, height: 16,
            borderRadius: "50%",
            background: badgeColor,
            border: "2px solid hsl(214,16%,4%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.5625rem",
            fontWeight: 800,
            color: "hsl(214,16%,4%)",
          }}>
            {unread}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.125rem" }}>
            Cross-Venture Intel — {unread} active {unread === 1 ? "signal" : "signals"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)" }}>
            {criticalCount > 0 && <span style={{ color: SEVERITY_COLORS.critical, fontWeight: 600 }}>{criticalCount} critical · </span>}
            {highCount > 0 && <span style={{ color: SEVERITY_COLORS.high }}>{highCount} high · </span>}
            Routed by Compound Intelligence Mesh
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            href="/intelligence-mesh"
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: "0.75rem",
              color: badgeColor,
              textDecoration: "none",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
              background: `${badgeColor}18`,
              border: `1px solid ${badgeColor}33`,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            View all
          </Link>
          {expanded ? <ChevronUp size={14} color="hsl(214,7%,45%)" /> : <ChevronDown size={14} color="hsl(214,7%,45%)" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 0.875rem 0.875rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}>
              {visibleEvents.map((event, idx) => {
                const Icon = TYPE_ICONS[event.signalType] ?? Activity;
                const sevColor = SEVERITY_COLORS[event.severity] ?? "hsl(214,7%,55%)";
                const srcColor = VENTURE_COLORS[event.sourceVenture] ?? "hsl(214,7%,55%)";

                return (
                  <m.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    style={{
                      padding: "0.75rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: "hsla(0,0%,100%,0.03)",
                      border: `1px solid hsla(0,0%,100%,0.06)`,
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() => setDismissed(d => new Set([...d, event.id]))}
                      style={{
                        position: "absolute", top: "0.5rem", right: "0.5rem",
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: "0.25rem", display: "flex",
                      }}
                      aria-label="Dismiss"
                    >
                      <X size={12} color="hsl(214,7%,38%)" />
                    </button>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", paddingRight: "1.25rem" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "0.375rem", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${sevColor}18`,
                        border: `1px solid ${sevColor}33`,
                        marginTop: "0.1rem",
                      }}>
                        <Icon size={13} color={sevColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.25rem", lineHeight: 1.35 }}>
                          {event.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.6875rem", color: srcColor, fontWeight: 600 }}>From {event.sourceVentureName}</span>
                          <ArrowRight size={10} color="hsl(214,7%,38%)" />
                          <span style={{ fontSize: "0.6875rem", color: "hsl(214,7%,55%)" }}>{event.targetVentureName}</span>
                          <span style={{
                            padding: "0.1rem 0.375rem",
                            borderRadius: "99px",
                            fontSize: "0.5625rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: sevColor,
                            background: `${sevColor}22`,
                            border: `1px solid ${sevColor}44`,
                          }}>
                            {event.severity}
                          </span>
                          {event.compoundInsight && (
                            <span style={{
                              padding: "0.1rem 0.375rem",
                              borderRadius: "99px",
                              fontSize: "0.5625rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              color: "hsl(192,72%,48%)",
                              background: "hsla(192,72%,48%,0.12)",
                              border: "1px solid hsla(192,72%,48%,0.3)",
                            }}>
                              COMPOUND
                            </span>
                          )}
                          <span style={{ fontSize: "0.625rem", color: "hsl(214,7%,35%)", marginLeft: "auto" }}>{formatAge(event.enrichedAt)}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "hsl(214,7%,50%)", lineHeight: 1.55, marginBottom: "0.375rem" }}>
                          <span style={{ color: "hsl(214,7%,40%)", fontWeight: 500 }}>Why it matters: </span>
                          {event.enrichmentContext}
                        </div>
                        <div style={{
                          fontSize: "0.75rem",
                          color: "hsl(38,8%,80%)",
                          lineHeight: 1.5,
                          padding: "0.375rem 0.5rem",
                          borderRadius: "0.25rem",
                          background: "hsla(38,72%,58%,0.06)",
                          border: "1px solid hsla(38,72%,58%,0.15)",
                        }}>
                          <span style={{ color: "hsl(38,72%,58%)", fontWeight: 600, fontSize: "0.625rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Action: </span>
                          {event.actionRecommendation}
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
