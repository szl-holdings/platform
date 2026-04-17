import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/api";

const FORGE_NAV = [
  { href: "/forge/overview", label: "Overview" },
  { href: "/forge/registry", label: "Registry" },
  { href: "/forge/drift", label: "Drift" },
  { href: "/forge/promotions", label: "Promotions" },
  { href: "/forge/telemetry", label: "Telemetry" },
];

export function ForgeShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0e14", color: "#e7eaf0" }}>
      <div style={{ borderBottom: "1px solid #1f2937", padding: "20px 32px", display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/forge" style={{ color: "#d4a054", fontWeight: 600, textDecoration: "none" }}>← Forge</Link>
        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
          {FORGE_NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ color: "#9ca3af", textDecoration: "none" }}>{n.label}</Link>
          ))}
        </div>
      </div>
      <div style={{ padding: "32px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: "#f9fafb" }}>{title}</h1>
        {subtitle && <p style={{ color: "#9ca3af", marginTop: 8 }}>{subtitle}</p>}
        <div style={{ marginTop: 32 }}>{children}</div>
      </div>
    </div>
  );
}

export function Card({ title, value, hint, accent = "#d4a054" }: { title: string; value: ReactNode; hint?: string; accent?: string }) {
  return (
    <div style={{ background: "#0f1620", border: "1px solid #1f2937", borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, marginTop: 8 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb", margin: 0 }}>{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function SeverityPill({ value }: { value: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    none: { bg: "#1f2937", fg: "#9ca3af" }, low: { bg: "#1e3a5f", fg: "#93c5fd" },
    medium: { bg: "#5b3a1e", fg: "#fbbf24" }, high: { bg: "#5b1e1e", fg: "#fca5a5" },
    critical: { bg: "#7f1d1d", fg: "#fee2e2" },
    healthy: { bg: "#14532d", fg: "#86efac" }, drifting: { bg: "#5b3a1e", fg: "#fbbf24" },
  };
  const c = map[value] ?? map.none!;
  return <span style={{ padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{value}</span>;
}

export function StatusPill({ value }: { value: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    requested: { bg: "#1f2937", fg: "#9ca3af" }, validated: { bg: "#1e3a5f", fg: "#93c5fd" },
    approved: { bg: "#14532d", fg: "#86efac" }, blocked: { bg: "#5b1e1e", fg: "#fca5a5" },
    promoted: { bg: "#14532d", fg: "#86efac" }, success: { bg: "#14532d", fg: "#86efac" },
    failure: { bg: "#5b1e1e", fg: "#fca5a5" }, escalated: { bg: "#5b3a1e", fg: "#fbbf24" },
    overridden: { bg: "#3b1e5b", fg: "#c4b5fd" },
  };
  const c = map[value] ?? { bg: "#1f2937", fg: "#9ca3af" };
  return <span style={{ padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{value}</span>;
}

export function useForgeQuery<T>(key: string, path: string) {
  return useQuery<T>({
    queryKey: ["forge", key],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: T }>("GET", path);
      return result.data;
    },
    refetchOnWindowFocus: false,
  });
}

export const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
export const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #1f2937", color: "#9ca3af", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 };
export const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #111827", color: "#d1d5db" };
