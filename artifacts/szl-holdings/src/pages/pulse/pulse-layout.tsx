import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText, Library, BarChart3, Wrench, MessageSquareWarning,
  ChevronRight, Zap, Clock, Radio, Settings,
} from "lucide-react";

const NAV = [
  { href: "/pulse", label: "Today's Brief", icon: FileText, exact: true },
  { href: "/pulse/library", label: "Library", icon: Library },
  { href: "/pulse/confidence", label: "Confidence", icon: BarChart3 },
  { href: "/pulse/builder", label: "Custom Brief", icon: Wrench },
  { href: "/pulse/dissent", label: "Dissent Channel", icon: MessageSquareWarning },
  { href: "/pulse/settings", label: "Settings", icon: Settings },
];

const PULSE_ACCENT = "hsl(191 92% 44%)";
const PULSE_DIM = "hsla(191 92% 44% / 0.10)";
const PULSE_BORDER = "hsla(191 92% 44% / 0.20)";

interface PulseLayoutProps {
  children: ReactNode;
}

export function PulseLayout({ children }: PulseLayoutProps) {
  const [location] = useLocation();

  function isActive(href: string, exact?: boolean) {
    if (exact) return location === href || location === href + "/";
    return location.startsWith(href);
  }

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214 18% 3%)", color: "hsl(38 8% 95%)", fontFamily: "var(--font-body, Inter, sans-serif)" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "hsla(214 18% 3% / 0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid hsla(255 255% 255% / 0.055)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `linear-gradient(135deg, ${PULSE_ACCENT}, hsl(218 70% 52%))`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Radio size={14} color="#fff" />
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 15, color: "hsl(38 8% 95%)", letterSpacing: "-0.01em" }}>PULSE</span>
              <span style={{ fontSize: 11, color: "hsl(191 92% 44%)", fontWeight: 500, marginLeft: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Briefing Engine</span>
            </div>
          </div>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "hsl(214 6% 42%)", fontSize: 13 }}>
            <ChevronRight size={13} />
            <Link href="/" style={{ color: "hsl(214 6% 42%)", textDecoration: "none" }}>SZL Holdings</Link>
            <ChevronRight size={13} />
            <span style={{ color: "hsl(38 8% 95%)" }}>Pulse</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 12, color: "hsl(214 7% 64%)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: PULSE_ACCENT, boxShadow: `0 0 6px ${PULSE_ACCENT}` }} />
            <span>Nuro Mesh Active</span>
            <span style={{ color: "hsl(214 5% 30%)" }}>·</span>
            <Clock size={12} style={{ color: "hsl(214 5% 30%)" }} />
            <span style={{ color: "hsl(214 5% 30%)" }}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} UTC</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ borderTop: "1px solid hsla(255 255% 255% / 0.04)", maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", display: "flex", gap: "0.25rem" }}>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 0.875rem",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? PULSE_ACCENT : "hsl(214 7% 64%)",
                  borderBottom: active ? `2px solid ${PULSE_ACCENT}` : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.15s ease",
                  marginBottom: -1,
                }}>
                  <Icon size={14} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Page content */}
      <motion.main
        key={location}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{ maxWidth: 1280, margin: "0 auto", padding: "1.5rem" }}
      >
        {children}
      </motion.main>
    </div>
  );
}

export { PULSE_ACCENT, PULSE_DIM, PULSE_BORDER };
