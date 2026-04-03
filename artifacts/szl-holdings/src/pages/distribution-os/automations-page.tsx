import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Zap, CheckCircle, Clock, AlertCircle, Play } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface AutomationRun { id: number; jobName: string; jobType: string; status: string; startedAt: string; completedAt: string | null; summary: string | null; itemsCreated: number; itemsFailed: number; }

const STATUS_MAP: Record<string, { icon: typeof Clock; color: string }> = {
  running: { icon: Clock, color: "#d4a054" },
  completed: { icon: CheckCircle, color: "#5a9c5a" },
  failed: { icon: AlertCircle, color: "#c45a4a" },
};

export default function AutomationsPage() {
  const [location] = useLocation();
  const [runs, setRuns] = useState<AutomationRun[]>([]);

  useEffect(() => { fetch(`${API}/api/distribution-os/automation-runs`).then(r => r.json()).then(setRuns).catch(() => {}); }, []);

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Automations</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Content generation and distribution automation runs</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { name: "X Post Queue Processor", type: "x-queue", desc: "Sends queued X posts at scheduled times" },
            { name: "Newsletter Generator", type: "newsletter-gen", desc: "Generates weekly newsletter from recent articles" },
            { name: "Analytics Aggregator", type: "analytics-agg", desc: "Compiles daily analytics summaries" },
            { name: "Lead Scorer", type: "lead-score", desc: "Re-scores leads based on engagement" },
          ].map(job => (
            <div key={job.type} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Zap size={16} style={{ color: "#d4a054" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{job.name}</h3>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b6560", lineHeight: 1.5, marginBottom: "0.75rem" }}>{job.desc}</p>
              <button style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", background: "hsla(0,0%,100%,0.06)", color: "#8b8579", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.6875rem", cursor: "pointer" }}>
                <Play size={10} /> Run Now
              </button>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Recent Runs</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {runs.map(run => {
            const sm = STATUS_MAP[run.status] || STATUS_MAP.running;
            return (
              <div key={run.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                <sm.icon size={16} style={{ color: sm.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{run.jobName}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{run.jobType} · {new Date(run.startedAt).toLocaleString()}</div>
                </div>
                {run.summary && <span style={{ fontSize: "0.6875rem", color: "#8b8579" }}>{run.summary}</span>}
                <span style={{ fontSize: "0.6875rem", color: "#5a9c5a" }}>{run.itemsCreated} created</span>
                {run.itemsFailed > 0 && <span style={{ fontSize: "0.6875rem", color: "#c45a4a" }}>{run.itemsFailed} failed</span>}
              </div>
            );
          })}
          {runs.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540" }}><Zap size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} /><p>No automation runs yet.</p></div>}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
