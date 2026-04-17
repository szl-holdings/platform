import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Cpu, FileText, Network, Radar, Activity, Heart, TrendingUp,
  GraduationCap, Users, FolderOpen, Clock, BookOpen, BarChart3,
  CheckCircle, ChevronDown, Sparkles, Lightbulb,
} from "lucide-react";

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

const GROUPS: NavGroup[] = [
  { id: "advisory", label: "Advisory", items: ADVISORY },
  { id: "operations", label: "Operations", items: OPERATIONS },
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
];

export function isPlatformRoute(pathname: string): boolean {
  return PLATFORM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export const PLATFORM_SIDEBAR_WIDTH = 248;

export default function PlatformSidebar() {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    advisory: true,
    operations: true,
  });

  return (
    <aside
      aria-label="Platform navigation"
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
      <Link
        href="/consulting-os"
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
    </aside>
  );
}
