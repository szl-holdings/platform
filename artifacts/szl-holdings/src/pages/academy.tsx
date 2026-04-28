import { m } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, GraduationCap, Play, FileText, Layers, ShieldCheck, Ship, Building2, BarChart3, ArrowRight, Clock, Users, CheckCircle2, Circle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useCallback } from "react";

const STORAGE_KEY = "szl-academy-progress-v1";

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

const LEARNING_PATHS = [
  {
    id: "platform-foundations",
    title: "Platform Foundations",
    description: "Understand the SZL architecture: signal ingestion, domain packs, Counsel execution fabric, and proof chain.",
    icon: Layers,
    duration: "45 min",
    modules: 6,
    level: "Beginner" as const,
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
    href: "/docs/architecture",
  },
  {
    id: "aegis-primer",
    title: "Aegis Security Operations",
    description: "SOC workflows, SOAR automation, threat intelligence feeds, and incident response playbooks.",
    icon: ShieldCheck,
    duration: "60 min",
    modules: 8,
    level: "Intermediate" as const,
    color: "hsl(0,72%,56%)",
    colorMuted: "hsla(0,72%,56%,0.08)",
    colorBorder: "hsla(0,72%,56%,0.22)",
    href: "/solutions/aegis",
  },
  {
    id: "vessels-maritime",
    title: "Vessels Maritime Intelligence",
    description: "Fleet tracking, AIS anomaly detection, route risk scoring, dark vessel identification, and sanctions compliance.",
    icon: Ship,
    duration: "50 min",
    modules: 7,
    level: "Intermediate" as const,
    color: "hsl(200,80%,52%)",
    colorMuted: "hsla(200,80%,52%,0.08)",
    colorBorder: "hsla(200,80%,52%,0.20)",
    href: "/solutions/vessels",
  },
  {
    id: "terra-real-estate",
    title: "Terra Real Estate Intelligence",
    description: "Property twin model, distress detection, ownership analysis, deal pipeline management, and diligence workflows.",
    icon: Building2,
    duration: "55 min",
    modules: 7,
    level: "Intermediate" as const,
    color: "hsl(140,50%,46%)",
    colorMuted: "hsla(140,50%,46%,0.08)",
    colorBorder: "hsla(140,50%,46%,0.20)",
    href: "/solutions/terra",
  },
  {
    id: "lyte-observability",
    title: "Lyte Business Observability",
    description: "Revenue stall detection, approval aging, ownership drift, KPI monitoring, and executive reporting.",
    icon: BarChart3,
    duration: "40 min",
    modules: 5,
    level: "Beginner" as const,
    color: "hsl(191,92%,44%)",
    colorMuted: "hsla(191,92%,44%,0.08)",
    colorBorder: "hsla(191,92%,44%,0.20)",
    href: "/lyte",
  },
  {
    id: "continuum-execution",
    title: "Counsel Execution Fabric",
    description: "Workflow orchestration, connector mesh, governance audit, human-in-the-loop gates, and decision lineage.",
    icon: Play,
    duration: "50 min",
    modules: 6,
    level: "Advanced" as const,
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    href: "/continuum",
  },
];

const QUICK_STARTS = [
  { title: "Your First Signal-to-Action Flow", time: "10 min", href: "/docs" },
  { title: "Setting Up Domain Packs", time: "15 min", href: "/docs/architecture" },
  { title: "Understanding Proof Chain", time: "8 min", href: "/docs/proof-chain" },
  { title: "Connecting External Data Sources", time: "12 min", href: "/platform" },
];

export default function AcademyPage() {
  const __pageMeta = usePageMeta({
    title: "Academy — SZL Holdings",
    description: "Learn the SZL platform end-to-end. Structured learning paths, quick starts, and domain-specific primers.",
  });

  const [progress, setProgress] = useState<Record<string, boolean>>(() => loadProgress());

  const toggle = useCallback((id: string) => {
    setProgress((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveProgress(next);
      return next;
    });
  }, []);

  const completedCount = LEARNING_PATHS.filter((p) => progress[p.id]).length;
  const totalCount = LEARNING_PATHS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "#080c14", color: "hsl(38,8%,88%)" }}>
        <SiteNav />

        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <GraduationCap size={28} style={{ color: "hsl(38,72%,58%)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(38,72%,58%)" }}>SZL Academy</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
              Learn the platform.<br />Master the system.
            </h1>
            <p style={{ fontSize: "1.125rem", color: "hsl(214,7%,55%)", maxWidth: "640px", lineHeight: 1.6 }}>
              Structured learning paths from platform fundamentals through domain-specific operations.
              Each path is self-paced, with practical exercises and real-world scenarios.
            </p>
          </m.div>

          {/* Progress bar */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              marginTop: "2rem",
              padding: "1rem 1.25rem",
              background: "hsla(38,72%,58%,0.06)",
              border: "1px solid hsla(38,72%,58%,0.16)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>
                  Your Progress
                </span>
                <span style={{ fontSize: "0.8125rem", color: "hsl(38,72%,58%)" }}>
                  {completedCount} / {totalCount} paths
                </span>
              </div>
              <div style={{ height: "4px", background: "hsla(0,0%,100%,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: "hsl(38,72%,58%)",
                    borderRadius: "2px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
            {completedCount > 0 && (
              <button
                onClick={() => {
                  const cleared: Record<string, boolean> = {};
                  saveProgress(cleared);
                  setProgress(cleared);
                }}
                style={{
                  fontSize: "0.75rem",
                  color: "hsl(214,7%,48%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  flexShrink: 0,
                }}
              >
                Reset progress
              </button>
            )}
          </m.div>

          <section style={{ marginTop: "3rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "hsl(38,8%,90%)" }}>Learning Paths</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {LEARNING_PATHS.map((path, i) => {
                const done = !!progress[path.id];
                return (
                  <m.div
                    key={path.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    style={{
                      background: done ? `${path.colorMuted}` : "hsla(0,0%,100%,0.025)",
                      border: `1px solid ${done ? path.colorBorder : "hsla(0,0%,100%,0.07)"}`,
                      borderRadius: "12px",
                      padding: "1.5rem",
                      transition: "border-color 0.2s, background 0.2s",
                      display: "flex",
                      flexDirection: "column" as const,
                      gap: "0.875rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <path.icon size={20} style={{ color: path.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{path.title}</span>
                      </div>
                      <button
                        onClick={() => toggle(path.id)}
                        title={done ? "Mark incomplete" : "Mark complete"}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0", flexShrink: 0, marginLeft: "0.5rem" }}
                        aria-label={done ? "Mark as incomplete" : "Mark as complete"}
                      >
                        {done
                          ? <CheckCircle2 size={18} style={{ color: path.color }} />
                          : <Circle size={18} style={{ color: "hsl(214,7%,38%)" }} />
                        }
                      </button>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55 }}>{path.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem", color: "hsl(214,7%,50%)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Clock size={12} /> {path.duration}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><BookOpen size={12} /> {path.modules} modules</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Users size={12} /> {path.level}</span>
                    </div>
                    <Link href={path.href}>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: path.color,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          cursor: "pointer",
                          marginTop: "auto",
                        }}
                      >
                        Start path <ArrowRight size={13} />
                      </span>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </section>

          <section style={{ marginTop: "4rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "hsl(38,8%,90%)" }}>Quick Starts</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {QUICK_STARTS.map((qs, i) => (
                <Link key={i} href={qs.href}>
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    style={{
                      background: "hsla(0,0%,100%,0.03)",
                      border: "1px solid hsla(0,0%,100%,0.08)",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,90%)" }}>{qs.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(214,7%,50%)", marginTop: "0.25rem" }}>{qs.time}</div>
                    </div>
                    <ArrowRight size={16} style={{ color: "hsl(214,7%,40%)" }} />
                  </m.div>
                </Link>
              ))}
            </div>
          </section>

          <section style={{ marginTop: "4rem", padding: "2rem", background: "hsla(38,72%,58%,0.06)", border: "1px solid hsla(38,72%,58%,0.18)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
              <FileText size={20} style={{ color: "hsl(38,72%,58%)" }} />
              <span style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>Documentation</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,55%)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Full API reference, architecture diagrams, integration guides, and operational runbooks available in the Docs hub.
            </p>
            <Link href="/docs">
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,72%,58%)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                Open Docs Hub <ArrowRight size={14} />
              </span>
            </Link>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
