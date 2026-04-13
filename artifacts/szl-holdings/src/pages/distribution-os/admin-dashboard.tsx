import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  LayoutDashboard, FileText, Mail, Image, Twitter, Users, Megaphone,
  Calendar, BarChart3, Settings, Zap, TrendingUp, Eye, UserPlus, Send,
  AlertCircle, ChevronRight, Globe, Link2, Target, Clock, CheckCircle2,
  Activity, RefreshCw, LineChart, GitBranch, Shield,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

const API = import.meta.env.VITE_API_URL || "";

export interface DashboardStats {
  visitsThisWeek: number;
  leadsThisWeek: number;
  publishedArticles: number;
  xQueued: number;
  xSentTotal: number;
  xFailed: number;
  newslettersReady: number;
  automationsCompletedThisWeek: number;
  conversionRate?: number;
  topCampaign?: string;
  topPage?: string;
  contentGenerated?: number;
  leadsNeedingFollowup?: number;
  automationsHealth?: string;
}

const NAV_ITEMS = [
  { href: "/admin/distribution", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/distribution/leads", icon: Users, label: "Leads" },
  { href: "/admin/distribution/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/admin/distribution/articles", icon: FileText, label: "Articles" },
  { href: "/admin/distribution/newsletters", icon: Mail, label: "Newsletters" },
  { href: "/admin/distribution/email-campaigns", icon: Send, label: "Email Campaigns" },
  { href: "/admin/distribution/drip-sequences", icon: GitBranch, label: "Drip Sequences" },
  { href: "/admin/distribution/carousel-lab", icon: Image, label: "Carousel Lab" },
  { href: "/admin/distribution/x-studio", icon: Twitter, label: "X Studio" },
  { href: "/admin/distribution/calendar", icon: Calendar, label: "Calendar" },
  { href: "/admin/distribution/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/distribution/reports", icon: LineChart, label: "Reports" },
  { href: "/admin/distribution/automations", icon: Zap, label: "Automations" },
  { href: "/admin/distribution/privacy", icon: Shield, label: "Privacy" },
  { href: "/admin/distribution/settings", icon: Settings, label: "Settings" },
];

export function DistributionOsLayout({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#070a10" }}>
      <SiteNav />
      <div style={{ display: "flex", paddingTop: "4rem" }}>
        <aside style={{ width: 220, borderRight: "1px solid hsla(0,0%,100%,0.06)", padding: "1.5rem 0", position: "sticky", top: "4rem", height: "calc(100vh - 4rem)", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "0 1rem 1rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#d4a054", letterSpacing: "0.1em", textTransform: "uppercase" }}>Marketing OS</h2>
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
                <item.icon size={15} />
                {item.label}
              </a>
            );
          })}
        </aside>
        <main style={{ flex: 1, padding: "2rem", maxWidth: "calc(100% - 220px)", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: typeof Eye; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#8b8579", marginTop: "0.375rem" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{sub}</div>}
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
        padding: "0.625rem 0.875rem", width: "100%",
        background: "hsla(0,0%,100%,0.02)",
        border: "1px solid hsla(0,0%,100%,0.05)",
        borderRadius: "8px",
        color: "#e8e4de",
        fontSize: "0.8125rem",
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsla(0,0%,100%,0.05)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsla(0,0%,100%,0.02)"; }}
    >
      <Icon size={14} style={{ color: "#d4a054" }} />
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={12} style={{ color: "#4a4540" }} />
    </button>
  );
}

export default function DistributionOsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/distribution-os/analytics/dashboard`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const s = stats || {
    visitsThisWeek: 0, leadsThisWeek: 0, publishedArticles: 0,
    xQueued: 0, xSentTotal: 0, xFailed: 0, newslettersReady: 0,
    automationsCompletedThisWeek: 0, conversionRate: 0, topCampaign: "—",
    topPage: "—", contentGenerated: 0, leadsNeedingFollowup: 0, automationsHealth: "OK"
  };

  const conversionRate = s.visitsThisWeek > 0
    ? ((s.leadsThisWeek / s.visitsThisWeek) * 100).toFixed(1) + "%"
    : "0.0%";

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em" }}>Marketing OS</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Command center — leads, campaigns, content, and distribution</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetch(`${API}/api/distribution-os/analytics/dashboard`).then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false)); }}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "0.875rem", marginBottom: "2rem" }}>
          <KpiCard icon={Eye} label="Visits This Week" value={s.visitsThisWeek} color="#4a90b8" />
          <KpiCard icon={UserPlus} label="Leads This Week" value={s.leadsThisWeek} color="#5a9c5a" />
          <KpiCard icon={Target} label="Conversion Rate" value={conversionRate} color="#d4a054" sub="visits → leads" />
          <KpiCard icon={Megaphone} label="Top Campaign" value={s.topCampaign || "—"} color="#8b7ac8" />
          <KpiCard icon={Globe} label="Top Landing Page" value={s.topPage || "—"} color="#4a90b8" />
          <KpiCard icon={FileText} label="Content Generated" value={s.publishedArticles} color="#c8953c" sub="published articles" />
          <KpiCard icon={Activity} label="Automations Health" value={s.automationsHealth || "OK"} color={s.xFailed > 0 ? "#c45a4a" : "#5a9c5a"} />
          <KpiCard icon={Clock} label="Needs Follow-up" value={s.leadsNeedingFollowup ?? 0} color="#c45a4a" sub="leads awaiting action" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4a4540", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <QuickAction icon={Users} label="Lead Inbox" href="/admin/distribution/leads" />
              <QuickAction icon={Megaphone} label="Campaigns & UTM Builder" href="/admin/distribution/campaigns" />
              <QuickAction icon={FileText} label="New Article" href="/admin/distribution/articles" />
              <QuickAction icon={Mail} label="New Newsletter" href="/admin/distribution/newsletters" />
              <QuickAction icon={Image} label="Carousel Lab" href="/admin/distribution/carousel-lab" />
              <QuickAction icon={Twitter} label="X Studio" href="/admin/distribution/x-studio" />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4a4540", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>Reports & Configuration</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <QuickAction icon={LineChart} label="Reports (Weekly / Monthly)" href="/admin/distribution/reports" />
              <QuickAction icon={BarChart3} label="Analytics Dashboard" href="/admin/distribution/analytics" />
              <QuickAction icon={Zap} label="Automations" href="/admin/distribution/automations" />
              <QuickAction icon={Settings} label="Settings & Integrations" href="/admin/distribution/settings" />
              <QuickAction icon={Globe} label="Link-in-Bio Preview" href="/link-in-bio" />
              <QuickAction icon={Link2} label="Newsletter Landing" href="/newsletter" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8b8579", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.875rem" }}>Distribution Pipeline Status</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {[
              { label: "X Posts Queued", value: s.xQueued, icon: Send, color: "#8b7ac8" },
              { label: "X Posts Sent", value: s.xSentTotal, icon: CheckCircle2, color: "#5a9c5a" },
              { label: "X Posts Failed", value: s.xFailed, icon: AlertCircle, color: s.xFailed > 0 ? "#c45a4a" : "#4a4540" },
              { label: "Newsletters Ready", value: s.newslettersReady, icon: Mail, color: "#c8953c" },
              { label: "Automations (7d)", value: s.automationsCompletedThisWeek, icon: Zap, color: "#4a90b8" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <item.icon size={14} style={{ color: item.color }} />
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>{item.value}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#6b6560" }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
