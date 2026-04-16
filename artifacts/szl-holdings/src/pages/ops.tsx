import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  GitCommit,
  CheckSquare,
  FileText,
  Camera,
  Shield,
  FlaskConical,
  Settings,
  AlertTriangle,
  ClipboardList,
  Layers,
  Lock,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Circle,
  Bell,
  BookOpen,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";

const OPS_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    path: "/ops",
    description: "Platform operational summary",
  },
  {
    id: "releases",
    label: "Releases",
    icon: GitCommit,
    path: "/ops/releases",
    description: "Release history and upcoming deploys",
  },
  {
    id: "qa",
    label: "QA Status",
    icon: CheckSquare,
    path: "/ops/qa",
    description: "Quality gate results and test status",
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
    path: "/ops/content",
    description: "CMS content status across all sites",
  },
  {
    id: "screenshots",
    label: "Screenshots",
    icon: Camera,
    path: "/ops/screenshots",
    description: "Screenshot freshness and capture schedule",
  },
  {
    id: "trust",
    label: "Trust Status",
    icon: Shield,
    path: "/ops/trust",
    description: "Trust documentation and compliance posture",
  },
  {
    id: "demo-state",
    label: "Demo State",
    icon: FlaskConical,
    path: "/ops/demo-state",
    description: "Demo environment status and seed integrity",
  },
  {
    id: "env-check",
    label: "Env Check",
    icon: Settings,
    path: "/ops/env-check",
    description: "Environment variable validation",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Layers,
    path: "/ops/integrations",
    description: "Third-party integration health",
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: AlertTriangle,
    path: "/ops/incidents",
    description: "Active and historical incidents",
    external: true,
  },
  {
    id: "alerts",
    label: "Alert Rules",
    icon: Bell,
    path: "/ops/alerts",
    description: "Threshold alerting rules and events",
    external: true,
  },
  {
    id: "runbooks",
    label: "Runbooks",
    icon: BookOpen,
    path: "/ops/runbooks",
    description: "Step-by-step remediation guides",
    external: true,
  },
  {
    id: "dependency-map",
    label: "Dependency Map",
    icon: GitMerge,
    path: "/ops/dependency-map",
    description: "Service dependency visualization",
    external: true,
  },
  {
    id: "checklists",
    label: "Checklists",
    icon: ClipboardList,
    path: "/ops/checklists",
    description: "Deployment and release checklists",
  },
];

const STATUS_ITEMS = [
  { label: "API Server", status: "operational", latency: "45ms" },
  { label: "Database", status: "operational", latency: "12ms" },
  { label: "Auth Service", status: "operational", latency: "38ms" },
  { label: "SZL Holdings Web", status: "operational", latency: "120ms" },
  { label: "Command", status: "operational", latency: "95ms" },
  { label: "Carlota Jo", status: "operational", latency: "88ms" },
];

const RECENT_RELEASES = [
  { version: "v0.1.0", date: "2026-04-01", status: "stable", note: "Initial public release" },
];

const QA_GATES = [
  { name: "Route Smoke Tests", status: "pass", lastRun: "2026-04-03" },
  { name: "TypeScript Check", status: "pass", lastRun: "2026-04-03" },
  { name: "ESLint", status: "pass", lastRun: "2026-04-03" },
  { name: "Link Check", status: "pending", lastRun: "—" },
  { name: "Metadata Check", status: "pending", lastRun: "—" },
  { name: "Accessibility", status: "pending", lastRun: "—" },
  { name: "Trust Pages", status: "pending", lastRun: "—" },
];

function StatusDot({ status }: { status: "operational" | "degraded" | "outage" | "unknown" }) {
  const colors = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    outage: "bg-red-500",
    unknown: "bg-gray-500",
  };
  return (
    <span className={cn("inline-block w-2 h-2 rounded-full", colors[status])} />
  );
}

function QaBadge({ status }: { status: "pass" | "fail" | "pending" | "skipped" }) {
  const styles = {
    pass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    fail: "bg-red-500/10 text-red-500 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    skipped: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

function OpsOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Ops Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform operational summary — v0.1.0 current
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Circle className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          Service Health
        </h3>
        <div className="space-y-2">
          {STATUS_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
            >
              <div className="flex items-center gap-2">
                <StatusDot status={item.status as "operational"} />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{item.latency}</span>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-primary" />
          Recent Releases
        </h3>
        <div className="space-y-2">
          {RECENT_RELEASES.map((r) => (
            <div
              key={r.version}
              className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
            >
              <div>
                <span className="text-sm font-mono text-foreground">{r.version}</span>
                <span className="text-xs text-muted-foreground ml-2">{r.note}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{r.date}</span>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          QA Gates
        </h3>
        <div className="space-y-2">
          {QA_GATES.map((gate) => (
            <div
              key={gate.name}
              className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
            >
              <span className="text-sm text-foreground">{gate.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{gate.lastRun}</span>
                <QaBadge status={gate.status as "pass" | "fail" | "pending"} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary" />
          Quick Links
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "CHANGELOG", href: "/CHANGELOG.md" },
            { label: "Release Checklist", href: "/RELEASE_CHECKLIST.md" },
            { label: "Incident Response", href: "/INCIDENT_RESPONSE.md" },
            { label: "QA Summary", href: "/QA_SUMMARY.md" },
            { label: "Route Inventory", href: "/ROUTE_INVENTORY.md" },
            { label: "Deployment Guide", href: "/DEPLOYMENT_READINESS.md" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpsPlaceholder({ section }: { section: (typeof OPS_SECTIONS)[0] }) {
  const Icon = section.icon;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {section.label}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">{section.label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Operational data surface for {section.description.toLowerCase()}.
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Internal ops interface — not publicly accessible.
        </p>
      </div>
    </div>
  );
}

export default function OpsPage() {
  const [location] = useLocation();

  const currentSection =
    OPS_SECTIONS.find((s) => s.path === location) || OPS_SECTIONS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/40 bg-card/50 px-6 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span className="font-semibold text-amber-500 uppercase tracking-wider text-[10px]">
            Internal — Not publicly accessible
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-sm font-semibold text-foreground">SZL Holdings Ops</h1>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-52 border-r border-border/40 py-4 shrink-0">
          <nav className="space-y-0.5 px-2">
            {OPS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive =
                section.path === "/ops"
                  ? location === "/ops" || location === "/ops/"
                  : location.startsWith(section.path);
              return (
                <Link key={section.id} href={section.path}>
                  <a
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{section.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3 h-3 ml-auto text-primary" />
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {currentSection.id === "overview" ? (
            <OpsOverview />
          ) : (
            <OpsPlaceholder section={currentSection} />
          )}
        </main>
      </div>
    </div>
  );
}
