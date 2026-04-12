import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Activity, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  Shield, Ship, Map, Layers, Eye, Sparkles, ArrowUpRight, RefreshCw, Clock,
} from "lucide-react";

const ACC = "hsl(191,92%,44%)";
const SURFACE = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.06)";
const TEXT_PRIMARY = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const TEXT_MUT = "hsl(214,7%,38%)";

interface PortfolioCompany {
  id: string;
  name: string;
  tagline: string;
  color: string;
  icon: React.ElementType;
  href: string;
  users: number;
  usersTrend: number;
  revenue: number;
  revenueTrend: number;
  health: "green" | "yellow" | "red";
  incidents: number;
  sparkline: number[];
  status: string;
  lastActivity: string;
}

const COMPANIES: PortfolioCompany[] = [
  {
    id: "vessels", name: "Vessels", tagline: "Maritime Intelligence",
    color: "#38bdf8", icon: Ship,
    href: "/vessels/",
    users: 2847, usersTrend: 12,
    revenue: 118, revenueTrend: 18,
    health: "green", incidents: 0,
    sparkline: [82, 88, 91, 95, 100, 105, 112, 118],
    status: "All systems operational",
    lastActivity: "2m ago",
  },
  {
    id: "aegis", name: "Aegis", tagline: "Defense Intelligence",
    color: "#f87171", icon: Shield,
    href: "/firestorm/",
    users: 1204, usersTrend: 8,
    revenue: 74, revenueTrend: 9,
    health: "yellow", incidents: 1,
    sparkline: [60, 62, 65, 67, 69, 71, 72, 74],
    status: "TLS cert renewal in progress",
    lastActivity: "1m ago",
  },
  {
    id: "terra", name: "Terra", tagline: "Real Estate Intelligence",
    color: "#a07848", icon: Map,
    href: "/terra/",
    users: 4182, usersTrend: 22,
    revenue: 143, revenueTrend: 28,
    health: "yellow", incidents: 1,
    sparkline: [95, 102, 108, 115, 122, 131, 138, 143],
    status: "Search latency elevated — patch deploying",
    lastActivity: "5m ago",
  },
  {
    id: "prism", name: "PRISM Counsel", tagline: "Legal Intelligence",
    color: "#d4a054", icon: Layers,
    href: "/prism-counsel/",
    users: 892, usersTrend: 15,
    revenue: 96, revenueTrend: 21,
    health: "green", incidents: 0,
    sparkline: [72, 76, 79, 83, 87, 91, 94, 96],
    status: "All systems healthy",
    lastActivity: "3m ago",
  },
  {
    id: "lyte", name: "Lyte", tagline: "AIOps Command Center",
    color: "#d4a054", icon: Activity,
    href: "/lyte-command-center/",
    users: 318, usersTrend: 42,
    revenue: 52, revenueTrend: 38,
    health: "green", incidents: 0,
    sparkline: [28, 32, 36, 40, 44, 47, 50, 52],
    status: "All systems operational",
    lastActivity: "1m ago",
  },
  {
    id: "carlota", name: "Carlota Jo", tagline: "Advisory Intelligence",
    color: "#c4aa7e", icon: Eye,
    href: "/carlota-jo/",
    users: 43, usersTrend: 7,
    revenue: 28, revenueTrend: 12,
    health: "green", incidents: 0,
    sparkline: [22, 23, 24, 25, 25, 26, 27, 28],
    status: "All systems operational",
    lastActivity: "12m ago",
  },
];

function Sparkline({ data, color, health }: { data: number[]; color: string; health: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

const healthConfig = {
  green: { color: "#4ade80", label: "Healthy" },
  yellow: { color: "#fbbf24", label: "Warning" },
  red: { color: "#f87171", label: "Critical" },
};

function CompanyCard({ company, delay }: { company: PortfolioCompany; delay: number }) {
  const Icon = company.icon;
  const hCfg = healthConfig[company.health];

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 14, padding: 20, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${company.color}, transparent)` }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: `${company.color}15`, border: `1px solid ${company.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={15} style={{ color: company.color }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>{company.name}</p>
            <p style={{ fontSize: 10, color: TEXT_MUT, margin: 0 }}>{company.tagline}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: hCfg.color }} />
          <span style={{ fontSize: 10, color: hCfg.color, fontWeight: 500 }}>{hCfg.label}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 10, color: TEXT_MUT, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Users</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, letterSpacing: "-0.04em" }}>
            {company.users.toLocaleString()}
          </p>
          <p style={{ fontSize: 10, color: company.usersTrend > 0 ? "#4ade80" : "#f87171", margin: 0 }}>
            +{company.usersTrend}% MoM
          </p>
        </div>
        <div>
          <p style={{ fontSize: 10, color: TEXT_MUT, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>ARR ($K)</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: company.color, margin: 0, letterSpacing: "-0.04em" }}>
            ${company.revenue}K
          </p>
          <p style={{ fontSize: 10, color: "#4ade80", margin: 0 }}>+{company.revenueTrend}% MoM</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Sparkline data={company.sparkline} color={company.color} health={company.health} />
        {company.incidents > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle size={11} style={{ color: "#fbbf24" }} />
            <span style={{ fontSize: 10, color: "#fbbf24" }}>{company.incidents} incident</span>
          </div>
        )}
      </div>

      <div style={{
        padding: "8px 10px",
        background: company.health === "yellow" ? "rgba(251,191,36,0.05)" : company.health === "red" ? "rgba(248,113,113,0.05)" : "hsla(0,0%,100%,0.02)",
        borderRadius: 7, border: `1px solid ${company.health === "green" ? BORDER : company.health === "yellow" ? "rgba(251,191,36,0.15)" : "rgba(248,113,113,0.15)"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, color: TEXT_SEC }}>{company.status}</span>
        <span style={{ fontSize: 10, color: TEXT_MUT }}>{company.lastActivity}</span>
      </div>

      <a href={company.href} style={{
        display: "flex", alignItems: "center", gap: 4, marginTop: 12,
        color: company.color, fontSize: 11, fontWeight: 500, textDecoration: "none",
        transition: "opacity 0.15s", opacity: 0.7,
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
      >
        View live product <ArrowUpRight size={11} />
      </a>
    </m.div>
  );
}

export default function PortfolioCommand() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const totalUsers = COMPANIES.reduce((acc, c) => acc + c.users, 0);
  const totalRevenue = COMPANIES.reduce((acc, c) => acc + c.revenue, 0);
  const incidents = COMPANIES.reduce((acc, c) => acc + c.incidents, 0);
  const healthy = COMPANIES.filter(c => c.health === "green").length;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)" }}>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Activity size={16} style={{ color: ACC }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACC, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Live Portfolio Command
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 300, color: TEXT_PRIMARY, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                Portfolio Health Overview
              </h1>
              <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0 }}>
                Real-time health, engagement, and revenue across all SZL portfolio companies.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={12} style={{ color: TEXT_MUT }} />
              <span style={{ fontSize: 11, color: TEXT_MUT }}>Live · {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          {[
            { label: "Total Active Users", value: totalUsers.toLocaleString(), icon: Users, color: ACC },
            { label: "Combined ARR", value: `$${totalRevenue}K`, icon: DollarSign, color: "#4ade80" },
            { label: "Active Incidents", value: incidents, icon: AlertTriangle, color: incidents > 0 ? "#fbbf24" : "#4ade80" },
            { label: "Healthy Services", value: `${healthy}/${COMPANIES.length}`, icon: CheckCircle2, color: "#4ade80" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `${stat.color}12`, border: `1px solid ${stat.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={13} style={{ color: stat.color }} />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: stat.color, margin: "0 0 2px", letterSpacing: "-0.04em" }}>{stat.value}</p>
                <p style={{ fontSize: 10, color: TEXT_MUT, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
              </m.div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {COMPANIES.map((company, i) => (
            <CompanyCard key={company.id} company={company} delay={i * 0.08} />
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
