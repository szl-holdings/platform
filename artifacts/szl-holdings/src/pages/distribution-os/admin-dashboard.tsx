import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  LayoutDashboard, FileText, Mail, Image, Twitter, Users, Megaphone,
  Calendar, BarChart3, Settings, Zap, ArrowRight, TrendingUp,
  Eye, UserPlus, Send, AlertCircle, ChevronRight, Globe, Link2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

const API = import.meta.env.VITE_API_URL || "";

interface DashboardStats {
  visitsThisWeek: number;
  leadsThisWeek: number;
  publishedArticles: number;
  xQueued: number;
  xSentTotal: number;
  xFailed: number;
  newslettersReady: number;
  automationsCompletedThisWeek: number;
}

const NAV_ITEMS = [
  { href: "/admin/distribution", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/distribution/articles", icon: FileText, label: "Articles" },
  { href: "/admin/distribution/newsletters", icon: Mail, label: "Newsletters" },
  { href: "/admin/distribution/carousel-lab", icon: Image, label: "Carousel Lab" },
  { href: "/admin/distribution/x-studio", icon: Twitter, label: "X Studio" },
  { href: "/admin/distribution/leads", icon: Users, label: "Leads" },
  { href: "/admin/distribution/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/admin/distribution/calendar", icon: Calendar, label: "Calendar" },
  { href: "/admin/distribution/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/distribution/automations", icon: Zap, label: "Automations" },
  { href: "/admin/distribution/settings", icon: Settings, label: "Settings" },
];

export function DistributionOsLayout({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#070a10" }}>
      <SiteNav />
      <div style={{ display: "flex", paddingTop: "4rem" }}>
        <aside style={{ width: 240, borderRight: "1px solid hsla(0,0%,100%,0.06)", padding: "1.5rem 0", position: "sticky", top: "4rem", height: "calc(100vh - 4rem)", overflowY: "auto" }}>
          <div style={{ padding: "0 1rem 1rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#d4a054", letterSpacing: "0.1em", textTransform: "uppercase" }}>Distribution OS</h2>
          </div>
          {NAV_ITEMS.map(item => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.5rem 1rem", margin: "0.125rem 0.5rem",
                  borderRadius: "6px",
                  color: active ? "#e8e4de" : "#6b6560",
                  background: active ? "hsla(0,0%,100%,0.06)" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.8125rem",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <item.icon size={16} />
                {item.label}
              </a>
            );
          })}
        </aside>
        <main style={{ flex: 1, padding: "2rem", maxWidth: "calc(100% - 240px)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend }: { icon: typeof Eye; label: string; value: number | string; color: string; trend?: string }) {
  return (
    <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <Icon size={18} style={{ color }} />
        {trend && <span style={{ fontSize: "0.6875rem", color: "#5a9c5a" }}>{trend}</span>}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: typeof FileText; label: string; href: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      style={{
        display: "flex", alignItems: "center", gap: "0.625rem",
        padding: "0.75rem 1rem", width: "100%",
        background: "hsla(0,0%,100%,0.03)",
        border: "1px solid hsla(0,0%,100%,0.06)",
        borderRadius: "8px",
        color: "#e8e4de",
        fontSize: "0.8125rem",
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <Icon size={16} style={{ color: "#d4a054" }} />
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={14} style={{ color: "#4a4540" }} />
    </button>
  );
}

export default function DistributionOsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    fetch(`${API}/api/distribution-os/analytics/dashboard`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const s = stats || { visitsThisWeek: 0, leadsThisWeek: 0, publishedArticles: 0, xQueued: 0, xSentTotal: 0, xFailed: 0, newslettersReady: 0, automationsCompletedThisWeek: 0 };

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em" }}>Distribution OS</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Content publishing and distribution command center</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard icon={Eye} label="Visits This Week" value={s.visitsThisWeek} color="#4a90b8" />
          <StatCard icon={UserPlus} label="Leads This Week" value={s.leadsThisWeek} color="#5a9c5a" />
          <StatCard icon={FileText} label="Published Articles" value={s.publishedArticles} color="#d4a054" />
          <StatCard icon={Send} label="X Posts Queued" value={s.xQueued} color="#8b7ac8" />
          <StatCard icon={TrendingUp} label="X Posts Sent" value={s.xSentTotal} color="#4a90b8" />
          {s.xFailed > 0 && <StatCard icon={AlertCircle} label="X Posts Failed" value={s.xFailed} color="#c45a4a" />}
          <StatCard icon={Mail} label="Newsletters Ready" value={s.newslettersReady} color="#c8953c" />
          <StatCard icon={Zap} label="Automations (7d)" value={s.automationsCompletedThisWeek} color="#8b7ac8" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <QuickAction icon={FileText} label="New Article" href="/admin/distribution/articles" />
              <QuickAction icon={Mail} label="New Newsletter" href="/admin/distribution/newsletters" />
              <QuickAction icon={Image} label="New Carousel" href="/admin/distribution/carousel-lab" />
              <QuickAction icon={Twitter} label="New X Post" href="/admin/distribution/x-studio" />
              <QuickAction icon={Megaphone} label="New Campaign" href="/admin/distribution/campaigns" />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Public Pages</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <QuickAction icon={Globe} label="Insights Hub" href="/insights" />
              <QuickAction icon={Mail} label="Newsletter Landing" href="/newsletter" />
              <QuickAction icon={Link2} label="Link-in-Bio Page" href="/link-in-bio" />
              <QuickAction icon={BarChart3} label="Analytics Dashboard" href="/admin/distribution/analytics" />
            </div>
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
