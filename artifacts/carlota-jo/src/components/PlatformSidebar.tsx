import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Cpu, FileText, Network, Radar, Activity, Heart, TrendingUp,
  GraduationCap, Users, FolderOpen, Clock, BookOpen, BarChart3,
  CheckCircle, ChevronDown, Sparkles, Lightbulb, Zap, Shield,
  Crown, Star, MessageSquare, BookMarked, Menu, X,
} from "lucide-react";
import { PolicyModeBadge } from "@/components/policy-mode-badge";

function pathToCarlotaActionType(path: string): string | undefined {
  const seg = path.replace(/^\/+/, "").split("/")[0];
  if (!seg || seg === "consulting-os") return undefined;
  return seg;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const ADVISORY: NavItem[] = [
  { href: "/strategic-diagnostic", label: "Strategic Diagnostic", icon: Sparkles },
  { href: "/competitive-radar", label: "Competitive Radar", icon: Radar },
  { href: "/scenario-simulator", label: "Scenario Simulator", icon: Activity },
  { href: "/client-health", label: "Client Health", icon: Heart },
  { href: "/readiness-checklist", label: "Readiness Checklist", icon: CheckCircle },
  { href: "/proposal-generator", label: "Proposal Generator", icon: FileText },
  { href: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { href: "/revenue-intelligence", label: "Revenue Intelligence", icon: TrendingUp },
  { href: "/engagements", label: "Engagement Delivery", icon: Activity },
  { href: "/workshop-platform", label: "Workshops & Training", icon: GraduationCap },
  { href: "/expert-network", label: "Expert Network", icon: Users },
  { href: "/content-strategy", label: "Thought Leadership", icon: Lightbulb },
  { href: "/client-portal", label: "Client Portal", icon: FolderOpen },
];

const OPERATIONS: NavItem[] = [
  { href: "/time-tracking", label: "Time Tracking & Billing", icon: Clock },
  { href: "/capacity-planner", label: "Capacity Planner", icon: Users },
  { href: "/knowledge-vault", label: "Knowledge Vault", icon: BookOpen },
  { href: "/benchmark-database", label: "Benchmark Database", icon: BarChart3 },
  { href: "/deliverable-workflow", label: "Deliverable Workflow", icon: CheckCircle },
  { href: "/profitability-analytics", label: "Profitability Analytics", icon: TrendingUp },
];

const ATLAS_ITEMS: NavItem[] = [
  { href: "/atlas-execute", label: "Run Workflow", icon: Zap },
  { href: "/governed-cockpit", label: "Governed Intelligence", icon: Shield },
];

const CONCIERGE_ITEMS: NavItem[] = [
  { href: "/concierge", label: "Concierge Atelier", icon: Crown },
  { href: "/concierge/clients", label: "Household Dossiers", icon: BookMarked },
  { href: "/concierge/playbooks", label: "Service Choreographies", icon: Star },
  { href: "/concierge/requests", label: "Active Requests", icon: Activity },
  { href: "/concierge/communications", label: "Correspondence", icon: MessageSquare },
];

const GROUPS: NavGroup[] = [
  { id: "concierge", label: "White-Glove Command", items: CONCIERGE_ITEMS },
  { id: "advisory", label: "Advisory", items: ADVISORY },
  { id: "operations", label: "Operations", items: OPERATIONS },
  { id: "atlas", label: "ATLAS Execution", items: ATLAS_ITEMS },
];

const GOLD = "var(--color-gold)";
const INK = "var(--color-ink-900)";
const MUTED = "var(--color-ink-500)";
const BORDER = "var(--color-gold-border)";
const CREAM = "var(--color-cream-warm)";

export const PLATFORM_PATHS: string[] = [
  "/consulting-os",
  ...ADVISORY.map((i) => i.href),
  ...OPERATIONS.map((i) => i.href),
  ...CONCIERGE_ITEMS.map((i) => i.href),
  ...ATLAS_ITEMS.map((i) => i.href),
];

export function isPlatformRoute(pathname: string): boolean {
  return PLATFORM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export const PLATFORM_SIDEBAR_WIDTH = 248;
const MOBILE_DRAWER_WIDTH = 288;

function NavContent({
  location,
  openGroups,
  setOpenGroups,
  carlotaActionType,
  onNavigate,
}: {
  location: string;
  openGroups: Record<string, boolean>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  carlotaActionType: string | undefined;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href="/consulting-os"
        onClick={onNavigate}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          textDecoration: "none",
          background: location === "/consulting-os" ? "var(--color-gold-dim)" : "transparent",
          border: location === "/consulting-os" ? `1px solid ${BORDER}` : "1px solid transparent",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "var(--color-gold-dim)",
            border: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Cpu size={14} color={GOLD} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 17,
              color: INK,
              fontWeight: 500,
            }}
          >
            Consulting OS
          </span>
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: GOLD,
              marginTop: 2,
            }}
          >
            Platform Home
          </span>
        </div>
      </Link>

      <div style={{ marginBottom: 18, padding: "0 4px" }}>
        <PolicyModeBadge product="carlota-jo" actionType={carlotaActionType} />
      </div>

      {GROUPS.map((group) => {
        const open = openGroups[group.id];
        return (
          <div key={group.id} style={{ marginBottom: 18 }}>
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "6px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: MUTED,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
              aria-expanded={open}
            >
              <span>{group.label}</span>
              <ChevronDown
                size={12}
                style={{
                  transition: "transform 0.2s",
                  transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                }}
              />
            </button>
            {open && (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 6, gap: 1 }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = location === item.href || location.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 13,
                        color: active ? INK : MUTED,
                        background: active ? "var(--color-gold-dim)" : "transparent",
                        borderLeft: active ? `2px solid ${GOLD}` : "2px solid transparent",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(154,125,82,0.06)";
                          (e.currentTarget as HTMLElement).style.color = INK;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = MUTED;
                        }
                      }}
                    >
                      <Icon size={14} color={active ? GOLD : "currentColor"} />
                      <span style={{ fontWeight: active ? 500 : 400 }}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 24,
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(154,125,82,0.06)",
          border: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Tip
        </div>
        <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          Press <kbd style={{ fontFamily: "inherit", fontSize: 11, padding: "1px 5px", border: `1px solid ${BORDER}`, borderRadius: 4, background: "#fff" }}>⌘K</kbd> to open the command palette.
        </div>
      </div>
    </>
  );
}

export default function PlatformSidebar() {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    concierge: true,
    advisory: true,
    operations: false,
    atlas: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const carlotaActionType = pathToCarlotaActionType(location);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const navProps = { location, openGroups, setOpenGroups, carlotaActionType };

  return (
    <>
      <button
        type="button"
        className="platform-sidebar-trigger"
        aria-label="Open platform navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        style={{
          position: "fixed",
          top: 70,
          left: 12,
          zIndex: 35,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: CREAM,
          border: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Menu size={18} color={INK} />
      </button>

      <aside
        aria-label="Platform navigation"
        className="platform-sidebar-desktop"
        style={{
          position: "fixed",
          top: 60,
          bottom: 0,
          left: 0,
          width: PLATFORM_SIDEBAR_WIDTH,
          background: CREAM,
          borderRight: `1px solid ${BORDER}`,
          overflowY: "auto",
          padding: "24px 14px 32px",
          zIndex: 30,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <NavContent {...navProps} />
      </aside>

      {mobileOpen && (
        <div
          className="platform-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 16, 10, 0.45)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        aria-label="Platform navigation"
        aria-hidden={!mobileOpen}
        className="platform-sidebar-drawer"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: MOBILE_DRAWER_WIDTH,
          maxWidth: "85vw",
          background: CREAM,
          borderRight: `1px solid ${BORDER}`,
          overflowY: "auto",
          padding: "20px 14px 32px",
          zIndex: 50,
          fontFamily: "Inter, system-ui, sans-serif",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          boxShadow: mobileOpen ? "2px 0 18px rgba(0,0,0,0.18)" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            padding: "0 4px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: GOLD,
              fontWeight: 600,
            }}
          >
            Platform
          </span>
          <button
            type="button"
            aria-label="Close platform navigation"
            onClick={() => setMobileOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: INK,
            }}
          >
            <X size={16} />
          </button>
        </div>
        <NavContent {...navProps} onNavigate={() => setMobileOpen(false)} />
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          .platform-sidebar-trigger,
          .platform-sidebar-backdrop,
          .platform-sidebar-drawer { display: none !important; }
        }
        @media (max-width: 1023px) {
          .platform-sidebar-desktop { display: none !important; }
        }
      `}</style>
    </>
  );
}
