import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Demo Persona Switcher
 *
 * An interactive bottom toolbar that lets a presenter swap between the six
 * demo personas during a live investor or prospect demo. Personas come from
 * `packages/demo-seed/src/personas.ts` (kept in sync as static data here so the
 * shared-ui bundle has no server-side dependency).
 *
 * The switcher only renders when demo mode is active. Demo mode is detected
 * (in priority order) from:
 *  - `?demo=1` (or `?demo=true`) in the current URL — sets a localStorage flag
 *  - `localStorage.getItem("szl-demo-mode") === "true"`
 *  - `window.__SZL_DEMO_MODE__ === true` (escape hatch for static demos)
 *
 * Persona changes are persisted to localStorage so they survive navigation
 * across artifacts on the same domain.
 */

export type DemoPersonaRole = "executive" | "operator" | "analyst" | "auditor";

export interface DemoPersonaViewPermissions {
  canApprove: boolean;
  canExecute: boolean;
  canViewFinancials: boolean;
  canViewAuditTrail: boolean;
  canViewRawSignals: boolean;
  canManagePersonnel: boolean;
  canExportData: boolean;
}

export interface DemoPersona {
  id: string;
  role: DemoPersonaRole;
  name: string;
  title: string;
  org: string;
  email: string;
  domain: string[];
  packs: string[];
  viewPermissions: DemoPersonaViewPermissions;
  demoNarrative: string;
  talkingPoints: string[];
}

/**
 * Static mirror of `packages/demo-seed/src/personas.ts` — kept here so the
 * client bundle does not pull in server-side seed-runner code.
 */
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "cfo-exec",
    role: "executive",
    name: "Marcus Holt",
    title: "Chief Financial Officer",
    org: "Meridian Capital Group",
    email: "m.holt@demo.szlholdings.com",
    domain: ["business-observability", "lyte"],
    packs: ["lyte", "terra"],
    viewPermissions: {
      canApprove: true,
      canExecute: false,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: false,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: "business-revops",
    talkingPoints: [
      "Sees cross-portfolio financial exposure on one surface",
      "Approves high-value actions without leaving the command inbox",
      "Receives AI-synthesised executive summaries — not raw dashboards",
      "Proof chain available for board and audit inquiries",
    ],
  },
  {
    id: "ciso-exec",
    role: "executive",
    name: "Diana Reyes",
    title: "Chief Information Security Officer",
    org: "Vantage Infrastructure Partners",
    email: "d.reyes@demo.szlholdings.com",
    domain: ["security", "aegis"],
    packs: ["aegis", "lyte"],
    viewPermissions: {
      canApprove: true,
      canExecute: false,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: false,
      canManagePersonnel: true,
      canExportData: true,
    },
    demoNarrative: "security-soc",
    talkingPoints: [
      "Unified threat exposure view — not individual tool dashboards",
      "Risk-ranked findings with blast-radius impact visible",
      "Compliance posture summary exportable for board reporting",
      "Approves containment actions; analyst executes the playbook",
    ],
  },
  {
    id: "fleet-operator",
    role: "operator",
    name: "Captain James Wren",
    title: "Fleet Operations Director",
    org: "Arcturus Shipping",
    email: "j.wren@demo.szlholdings.com",
    domain: ["maritime", "vessels"],
    packs: ["vessels"],
    viewPermissions: {
      canApprove: true,
      canExecute: true,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: true,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: "maritime",
    talkingPoints: [
      "Fleet position, route risk, and cargo status on one screen",
      "AIS anomaly and sanctions alert surfaced before the port call",
      "Approves rerouting through Alloy — full audit record created",
      "Voyage P&L updated in real time as route changes are confirmed",
    ],
  },
  {
    id: "soc-analyst",
    role: "analyst",
    name: "Priya Nair",
    title: "Senior SOC Analyst",
    org: "Vantage Infrastructure Partners",
    email: "p.nair@demo.szlholdings.com",
    domain: ["security", "aegis"],
    packs: ["aegis"],
    viewPermissions: {
      canApprove: false,
      canExecute: true,
      canViewFinancials: false,
      canViewAuditTrail: true,
      canViewRawSignals: true,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: "security-soc",
    talkingPoints: [
      "Alert triage with full MITRE ATT&CK context — no manual lookups",
      "Playbook recommendations with confidence scoring and evidence",
      "Executes containment steps; CISO approves before remediation",
      "All investigation steps logged with attribution automatically",
    ],
  },
  {
    id: "legal-counsel",
    role: "operator",
    name: "Sophia Marchetti",
    title: "Managing Attorney",
    org: "Marchetti & Osei LLP",
    email: "s.marchetti@demo.szlholdings.com",
    domain: ["legal", "prism-counsel"],
    packs: ["prism-counsel"],
    viewPermissions: {
      canApprove: true,
      canExecute: true,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: true,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: "legal-compliance",
    talkingPoints: [
      "Matter Twin shows every deadline, party, and insurer signal",
      "Demand readiness scored automatically — no manual checklist",
      "Reviews demand packet before partner approval gate",
      "Proof chain created automatically for every action taken",
    ],
  },
  {
    id: "compliance-auditor",
    role: "auditor",
    name: "Robert Tanner",
    title: "Chief Compliance Officer",
    org: "Arcturus Shipping",
    email: "r.tanner@demo.szlholdings.com",
    domain: ["maritime", "vessels", "lyte"],
    packs: ["vessels", "lyte"],
    viewPermissions: {
      canApprove: false,
      canExecute: false,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: false,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: "maritime",
    talkingPoints: [
      "Read-only audit view — sees decisions without operational access",
      "Full voyage decision trail: who approved what, when, and why",
      "Sanctions screening log with confidence scores and source citations",
      "Exports compliance package for port authority or flag state",
    ],
  },
];

const PERSONA_STORAGE_KEY = "szl-demo-persona";
// NOTE: a separate key is used here (and not the legacy `szl-demo-mode` key)
// because `lib/shared-ui/src/demo-mode.tsx` already stores a role string under
// that name. Reusing it would corrupt the demo-mode state and could hide the
// toolbar in apps that depend on `DemoModeProvider`.
const DEMO_FLAG_STORAGE_KEY = "szl-demo-mode-active";
const TOOLBAR_COLLAPSED_KEY = "szl-demo-persona-toolbar-collapsed";

const ROLE_COLORS: Record<DemoPersonaRole, { bg: string; border: string; text: string; dot: string }> = {
  executive: {
    bg: "rgba(168, 85, 247, 0.14)",
    border: "rgba(168, 85, 247, 0.45)",
    text: "hsl(270 85% 78%)",
    dot: "hsl(270 80% 64%)",
  },
  operator: {
    bg: "rgba(59, 130, 246, 0.14)",
    border: "rgba(59, 130, 246, 0.45)",
    text: "hsl(215 90% 78%)",
    dot: "hsl(215 90% 64%)",
  },
  analyst: {
    bg: "rgba(20, 184, 166, 0.14)",
    border: "rgba(20, 184, 166, 0.45)",
    text: "hsl(172 80% 70%)",
    dot: "hsl(172 80% 56%)",
  },
  auditor: {
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.45)",
    text: "hsl(38 92% 72%)",
    dot: "hsl(38 92% 60%)",
  },
};

const ROLE_LABEL: Record<DemoPersonaRole, string> = {
  executive: "Executive",
  operator: "Operator",
  analyst: "Analyst",
  auditor: "Auditor",
};

export interface DemoPersonaContextValue {
  persona: DemoPersona;
  setPersonaId: (id: string) => void;
  personas: DemoPersona[];
  /** Convenience accessor for the current persona's view permissions. */
  permissions: DemoPersonaViewPermissions;
  /** Returns true when the current persona has access to the named pack. */
  hasPack: (packId: string) => boolean;
}

const DEFAULT_PERSONA = DEMO_PERSONAS[0];

const DemoPersonaContext = createContext<DemoPersonaContextValue>({
  persona: DEFAULT_PERSONA,
  setPersonaId: () => {},
  personas: DEMO_PERSONAS,
  permissions: DEFAULT_PERSONA.viewPermissions,
  hasPack: () => true,
});

function readStoredPersona(): DemoPersona {
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(PERSONA_STORAGE_KEY) : null;
    if (stored) {
      const match = DEMO_PERSONAS.find((p) => p.id === stored);
      if (match) return match;
    }
  } catch {
    // ignore — storage may be disabled
  }
  return DEFAULT_PERSONA;
}

export interface DemoPersonaProviderProps {
  children: React.ReactNode;
  /** Override the initial persona (e.g. when seeding a specific narrative). */
  initialPersonaId?: string;
}

export function DemoPersonaProvider({ children, initialPersonaId }: DemoPersonaProviderProps) {
  const [persona, setPersona] = useState<DemoPersona>(() => {
    if (initialPersonaId) {
      const match = DEMO_PERSONAS.find((p) => p.id === initialPersonaId);
      if (match) return match;
    }
    return readStoredPersona();
  });

  const setPersonaId = useCallback((id: string) => {
    const match = DEMO_PERSONAS.find((p) => p.id === id);
    if (!match) return;
    setPersona(match);
    try {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, match.id);
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent("szl-demo-persona-change", { detail: { personaId: match.id } }));
    } catch {
      // ignore
    }
  }, []);

  // Sync across tabs / artifacts on the same domain
  useEffect(() => {
    function handler(e: StorageEvent) {
      if (e.key === PERSONA_STORAGE_KEY && e.newValue) {
        const match = DEMO_PERSONAS.find((p) => p.id === e.newValue);
        if (match) setPersona(match);
      }
    }
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo<DemoPersonaContextValue>(() => ({
    persona,
    setPersonaId,
    personas: DEMO_PERSONAS,
    permissions: persona.viewPermissions,
    hasPack: (packId: string) => persona.packs.includes(packId),
  }), [persona, setPersonaId]);

  return <DemoPersonaContext.Provider value={value}>{children}</DemoPersonaContext.Provider>;
}

export function useDemoPersona(): DemoPersonaContextValue {
  return useContext(DemoPersonaContext);
}

/**
 * Detects whether demo mode is currently active. Reads URL params on first
 * call and persists a localStorage flag so refreshes / cross-artifact
 * navigation keep demo mode on.
 */
export function useDemoModeActive(): boolean {
  const [active, setActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("demo");
      if (fromUrl === "1" || fromUrl === "true") {
        try { window.localStorage.setItem(DEMO_FLAG_STORAGE_KEY, "true"); } catch {}
        return true;
      }
      if (fromUrl === "0" || fromUrl === "false") {
        try { window.localStorage.removeItem(DEMO_FLAG_STORAGE_KEY); } catch {}
        return false;
      }
      const stored = window.localStorage.getItem(DEMO_FLAG_STORAGE_KEY);
      if (stored === "true") return true;
    } catch {
      // ignore
    }
    return Boolean((window as unknown as { __SZL_DEMO_MODE__?: boolean }).__SZL_DEMO_MODE__);
  });

  useEffect(() => {
    function handler(e: StorageEvent) {
      if (e.key === DEMO_FLAG_STORAGE_KEY) {
        setActive(e.newValue === "true");
      }
    }
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return active;
}

export interface DemoPersonaSwitcherProps {
  /** When true, always render the toolbar regardless of demo-mode detection. */
  forceVisible?: boolean;
  /** Pin to top instead of bottom. Defaults to bottom. */
  position?: "top" | "bottom";
  /** Extra style applied to the toolbar root. */
  style?: React.CSSProperties;
}

/**
 * Floating toolbar with all six persona cards. Renders only when demo mode is
 * active (or `forceVisible` is set). Use inside a `DemoPersonaProvider`.
 */
export function DemoPersonaSwitcher({ forceVisible = false, position = "bottom", style }: DemoPersonaSwitcherProps) {
  const demoActive = useDemoModeActive();
  const { persona, setPersonaId, personas } = useDemoPersona();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(TOOLBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(TOOLBAR_COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  if (!forceVisible && !demoActive) return null;

  const positionStyle: React.CSSProperties = position === "top"
    ? { top: 12 }
    : { bottom: 12 };

  return (
    <div
      data-testid="demo-persona-switcher"
      role="region"
      aria-label="Demo persona switcher"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        maxWidth: "min(1100px, calc(100vw - 24px))",
        background: "rgba(8, 10, 16, 0.96)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "14px",
        padding: collapsed ? "8px 12px" : "12px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "rgba(255,255,255,0.92)",
        ...positionStyle,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: collapsed ? 0 : 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "hsl(38, 90%, 70%)",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.32)",
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          Demo Mode
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          Acting as <strong style={{ color: ROLE_COLORS[persona.role].text }}>{persona.name}</strong> · {persona.title}
        </span>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          data-testid="demo-persona-toggle"
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.72)",
            borderRadius: 6,
            padding: "3px 9px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          {collapsed ? "Show personas ▴" : "Hide ▾"}
        </button>
      </div>

      {!collapsed && (
        <>
        <div
          data-testid="demo-persona-permissions"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 10,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)", alignSelf: "center", marginRight: 4 }}>
            Can:
          </span>
          {([
            ["canApprove", "Approve"],
            ["canExecute", "Execute"],
            ["canViewFinancials", "Financials"],
            ["canViewAuditTrail", "Audit"],
            ["canViewRawSignals", "Raw signals"],
            ["canManagePersonnel", "Personnel"],
            ["canExportData", "Export"],
          ] as const).map(([key, label]) => {
            const granted = persona.viewPermissions[key];
            return (
              <span
                key={key}
                data-permission={key}
                data-granted={granted ? "true" : "false"}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 7px",
                  borderRadius: 5,
                  background: granted ? "rgba(34, 197, 94, 0.12)" : "rgba(255,255,255,0.025)",
                  border: granted ? "1px solid rgba(34, 197, 94, 0.32)" : "1px solid rgba(255,255,255,0.08)",
                  color: granted ? "hsl(142 70% 70%)" : "rgba(255,255,255,0.32)",
                  textDecoration: granted ? "none" : "line-through",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))",
            gap: 8,
          }}
        >
          {personas.map((p) => {
            const active = p.id === persona.id;
            const colors = ROLE_COLORS[p.role];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonaId(p.id)}
                data-testid={`demo-persona-card-${p.id}`}
                data-active={active ? "true" : "false"}
                aria-pressed={active}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: active ? colors.bg : "rgba(255,255,255,0.025)",
                  border: active ? `1px solid ${colors.border}` : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 140ms ease",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  outline: "none",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: colors.text,
                    }}
                  >
                    {ROLE_LABEL[p.role]}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      style={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.95)", lineHeight: 1.2 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>
                  {p.title}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {p.packs.map((pack) => (
                    <span
                      key={pack}
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {pack}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

/**
 * Convenience helper for role-restricted UI elements. Returns `fallback`
 * (defaults to `null`) when the current persona lacks the named permission.
 */
export function PersonaPermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: keyof DemoPersonaViewPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { permissions } = useDemoPersona();
  return <>{permissions[permission] ? children : fallback}</>;
}

/**
 * Bridges the current persona's role into a sink callback (typically the
 * legacy `useDemoMode().setMode` from `lib/shared-ui/src/demo-mode.tsx`).
 * The legacy demo-mode context only knows about three roles, so `auditor`
 * is mapped to `analyst` (read-only / traceability framing).
 *
 * Drop this component anywhere inside both providers to make existing
 * role-gated UI react to persona swaps without further changes.
 */
export function DemoPersonaModeBridge({
  setMode,
}: {
  setMode: (mode: "executive" | "operator" | "analyst") => void;
}) {
  const { persona } = useDemoPersona();
  useEffect(() => {
    const role = persona.role === "auditor" ? "analyst" : persona.role;
    setMode(role);
  }, [persona.role, setMode]);
  return null;
}
