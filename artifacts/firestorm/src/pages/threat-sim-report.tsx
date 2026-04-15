import { useState, useRef } from "react";
import { FileText, Download, Shield, AlertTriangle, Target, Eye, Crosshair, Clock, Users, Building2, Cpu, CheckCircle, Lock, Globe, Database } from "lucide-react";

const PHANTOM_ACCENT = "#a855f7";
const SENTINEL_ACCENT = "#8b5cf6";
const ACCENT = "#ef4444";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

type ReportType = "phantom-campaign" | "sentinel-findings" | "purple-team" | "executive-summary";

const REPORT_CONFIGS: Record<ReportType, { label: string; code: string; color: string; icon: typeof FileText; classification: string }> = {
  "phantom-campaign": { label: "PHANTOM Campaign Assessment", code: "PHT", color: PHANTOM_ACCENT, icon: Crosshair, classification: "CONFIDENTIAL // FOUO" },
  "sentinel-findings": { label: "SENTINEL Insider Threat Report", code: "SNT", color: SENTINEL_ACCENT, icon: Eye, classification: "CONFIDENTIAL // PERSONNEL" },
  "purple-team": { label: "Purple Team Exercise Report", code: "PTE", color: "#3b82f6", icon: Shield, classification: "CONFIDENTIAL // SEC CLEARANCE" },
  "executive-summary": { label: "Executive Intelligence Summary", code: "EIS", color: "#f59e0b", icon: Building2, classification: "CONFIDENTIAL // BOARD ONLY" },
};

interface ReportSection {
  id: string;
  title: string;
  classification: string;
  content: string[];
  severity?: "critical" | "high" | "medium";
}

interface LiveReportData {
  title: string;
  subtitle: string;
  summary: string;
  stats: { label: string; value: string; color: string }[];
  sections: ReportSection[];
  findings: { id: string; finding: string; severity: "critical" | "high" | "medium"; recommendation: string }[];
}

function ClassificationBanner({ text, color }: { text: string; color: string }) {
  return (
    <div className="text-center py-1.5 text-[9px] font-bold tracking-widest uppercase font-mono"
      style={{ background: `${color}15`, color, borderBottom: `1px solid ${color}20` }}>
      ██ {text} ██
    </div>
  );
}

const SEV_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b" };

export default function ThreatSimReport() {
  const [selectedType, setSelectedType] = useState<ReportType>("phantom-campaign");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportData, setReportData] = useState<LiveReportData | null>(null);
  const [reportDate] = useState(() => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  const reportRef = useRef<HTMLDivElement>(null);

  const config = REPORT_CONFIGS[selectedType];
  const ConfigIcon = config.icon;

  function exportPDF() {
    if (!reportData) return;
    const win = window.open("", "_blank", "width=900,height=720");
    if (!win) return;

    const SEV: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b" };
    const accent = config.color;
    const dateStr = new Date().toISOString().slice(0, 10);

    const bannerHtml = `<div style="background:${accent};color:#fff;text-align:center;padding:6px 0;font-size:9px;font-weight:800;letter-spacing:4px;font-family:'Courier New',monospace;">${config.classification}</div>`;

    const statsHtml = reportData.stats.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">${reportData.stats.map(s =>
        `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 10px;">
          <div style="font-size:11px;font-weight:bold;font-family:'Courier New',monospace;color:${s.color};">${s.value}</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.4);margin-top:2px;">${s.label}</div>
        </div>`).join("")}</div>`
      : "";

    const sectionsHtml = reportData.sections.map(section =>
      `<div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:8px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#fff;">${section.title}</span>
          <span style="font-size:7px;font-family:'Courier New',monospace;padding:2px 5px;border-radius:3px;background:${accent}15;color:${accent};">${section.classification}</span>
          ${section.severity ? `<span style="font-size:7px;padding:2px 5px;border-radius:3px;font-weight:bold;background:${SEV[section.severity]}15;color:${SEV[section.severity]};">${section.severity.toUpperCase()}</span>` : ""}
        </div>
        <div style="padding-left:10px;border-left:2px solid ${accent}20;">
          ${section.content.map(para => `<p style="font-size:10px;line-height:1.6;margin:0 0 5px;color:rgba(255,255,255,0.65);">${para}</p>`).join("")}
        </div>
      </div>`).join("");

    const findingsHtml = reportData.findings.length > 0
      ? `<div style="margin-bottom:16px;">
        <div style="font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#fff;margin-bottom:10px;">Findings &amp; Recommendations</div>
        ${reportData.findings.map(f =>
          `<div style="border-radius:7px;padding:10px 12px;margin-bottom:8px;border:1px solid ${SEV[f.severity]}20;background:${SEV[f.severity]}04;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:7px;padding:2px 5px;border-radius:3px;font-weight:bold;background:${SEV[f.severity]}15;color:${SEV[f.severity]};">${f.severity.toUpperCase()}</span>
              <span style="font-size:9px;font-weight:600;color:#fff;">${f.finding}</span>
            </div>
            <p style="font-size:8px;color:rgba(255,255,255,0.55);margin:0;line-height:1.5;padding-left:12px;">&#10003; ${f.recommendation}</p>
          </div>`).join("")}
      </div>`
      : "";

    const footerHtml = `<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:8px;font-family:'Courier New',monospace;">
      <span style="color:rgba(255,255,255,0.3);">GENERATED BY AEGIS ENGINE · ${dateStr}</span>
      <span style="color:${accent};font-weight:bold;">${config.classification}</span>
    </div>`;

    const body = `
      ${bannerHtml}
      <div style="padding:20px 24px;background:#060810;">
        <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid ${accent}20;">
          <div style="font-size:8px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:3px;color:${accent};margin-bottom:3px;">${config.code} · ${dateStr}</div>
          <h2 style="font-size:14px;font-weight:bold;color:#fff;margin:0 0 3px;">${reportData.title}</h2>
          <div style="font-size:11px;color:${accent};">${reportData.subtitle}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid ${accent}15;border-radius:8px;padding:12px;margin-bottom:16px;">
          <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:3px;color:${accent};font-family:'Courier New',monospace;margin-bottom:6px;">EXECUTIVE SUMMARY</div>
          <p style="font-size:11px;line-height:1.6;color:rgba(255,255,255,0.75);margin:0;">${reportData.summary}</p>
        </div>
        ${statsHtml}
        ${sectionsHtml}
        ${findingsHtml}
        ${footerHtml}
      </div>
      ${bannerHtml}`;

    win.document.write(`<!DOCTYPE html><html><head><title>${reportData.title}</title><style>*{box-sizing:border-box;font-family:'Courier New',monospace;}body{background:#060810;color:rgba(255,255,255,0.85);margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{size:A4;margin:10mm 14mm;}</style></head><body>${body}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  async function generate() {
    setGenerating(true);
    setGenerated(false);
    setReportData(null);
    try {
      const res = await fetch(`/api/firestorm/assessments?reportType=${selectedType}&limit=1`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        const assessments: Record<string, unknown>[] = Array.isArray(json.assessments) ? json.assessments : Array.isArray(json.data) ? json.data : [];
        if (assessments.length > 0) {
          const assessment = assessments[0];
          const data = (typeof assessment.data === "object" && assessment.data !== null ? assessment.data : {}) as Record<string, unknown>;
          setReportData({
            title: (data.title as string) ?? (assessment.name as string) ?? config.label,
            subtitle: (data.subtitle as string) ?? `${config.code} · ${reportDate}`,
            summary: (data.summary as string) ?? "No summary available for this assessment.",
            stats: Array.isArray(data.stats) ? (data.stats as LiveReportData["stats"]) : [],
            sections: Array.isArray(data.sections) ? (data.sections as ReportSection[]) : [],
            findings: Array.isArray(data.findings) ? (data.findings as LiveReportData["findings"]) : [],
          });
        }
      }
      setGenerated(true);
    } catch {
      setGenerated(true);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen p-5 space-y-5" style={{ background: "#080B12" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5" style={{ color: PHANTOM_ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: PHANTOM_ACCENT }}>PHANTOM / SENTINEL · Report Generator</span>
          </div>
          <h1 className="text-xl font-bold text-white">Security Intelligence Assessment</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            Generate classified-style intelligence assessments from PHANTOM exercises and SENTINEL behavioral findings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(REPORT_CONFIGS) as [ReportType, typeof REPORT_CONFIGS[ReportType]][]).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={type} onClick={() => { setSelectedType(type); setGenerated(false); setReportData(null); }}
              className="text-left p-3 rounded-xl border transition-all"
              style={{
                borderColor: selectedType === type ? `${cfg.color}40` : DS.border,
                background: selectedType === type ? `${cfg.color}08` : DS.surface,
              }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${cfg.color}15` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="text-[10px] font-bold text-white">{cfg.label}</div>
              <div className="text-[8px] mt-1 font-mono" style={{ color: cfg.color }}>{cfg.code}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 rounded-xl border p-4 space-y-4" style={{ borderColor: DS.border, background: DS.surface }}>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>Report Configuration</div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Report Type</div>
              <div className="text-[11px] font-semibold text-white">{config.label}</div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Report Code</div>
              <div className="text-[11px] font-mono" style={{ color: config.color }}>{config.code}</div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Classification</div>
              <div className="text-[10px] font-bold font-mono" style={{ color: config.color }}>{config.classification}</div>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Report Date</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{reportDate}</div>
            </div>
            {reportData && (
              <>
                <div>
                  <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Sections</div>
                  <div className="text-[11px]">{reportData.sections.length} classified sections</div>
                </div>
                <div>
                  <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Findings</div>
                  <div className="text-[11px]">{reportData.findings.length} findings with remediation</div>
                </div>
              </>
            )}
          </div>

          <button onClick={generate} disabled={generating}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}35` }}>
            {generating ? (
              <><Cpu className="w-4 h-4 animate-spin" /> Generating…</>
            ) : (
              <><FileText className="w-4 h-4" /> Generate Report</>
            )}
          </button>

          {generated && reportData && (
            <button
              onClick={exportPDF}
              className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}30` }}>
              <Download className="w-3.5 h-3.5" /> Export PDF Brief
            </button>
          )}
        </div>

        <div className="col-span-8">
          {!generated && !generating && (
            <div className="h-full flex items-center justify-center rounded-xl border" style={{ borderColor: DS.border, background: DS.surface, minHeight: 400 }}>
              <div className="text-center">
                <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: DS.text.muted }} />
                <p className="text-[11px]" style={{ color: DS.text.muted }}>Configure report parameters and click Generate</p>
                <p className="text-[10px] mt-1" style={{ color: DS.text.muted }}>Reports are compiled from live simulation data in your environment</p>
              </div>
            </div>
          )}

          {generating && (
            <div className="h-full flex items-center justify-center rounded-xl border" style={{ borderColor: `${config.color}20`, background: `${config.color}04`, minHeight: 400 }}>
              <div className="text-center space-y-3">
                <Cpu className="w-8 h-8 mx-auto animate-spin" style={{ color: config.color }} />
                <p className="text-[12px] font-mono" style={{ color: config.color }}>Querying simulation data…</p>
                <div className="space-y-1 text-left max-w-xs mx-auto">
                  {["Connecting to simulation database…", "Fetching campaign results…", "Compiling assessment sections…", "Applying classification markings…"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] font-mono" style={{ color: DS.text.muted }}>
                      <CheckCircle className="w-2.5 h-2.5 shrink-0" style={{ color: config.color }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {generated && !reportData && (
            <div className="h-full flex items-center justify-center rounded-xl border" style={{ borderColor: DS.border, background: DS.surface, minHeight: 400 }}>
              <div className="text-center max-w-sm">
                <Database className="w-8 h-8 mx-auto mb-3" style={{ color: DS.text.muted }} />
                <p className="text-[12px] font-semibold text-white mb-1">No assessment data available</p>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.muted }}>
                  No {config.label} records found in your environment. Complete an exercise and ingest results to generate this report.
                </p>
              </div>
            </div>
          )}

          {generated && reportData && (
            <div ref={reportRef} className="rounded-xl border overflow-hidden" style={{ borderColor: `${config.color}30` }}>
              <ClassificationBanner text={config.classification} color={config.color} />

              <div className="p-5 space-y-5" style={{ background: "#060810" }}>
                <div className="border-b pb-4" style={{ borderColor: `${config.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${config.color}20` }}>
                      <ConfigIcon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="text-[8px] font-mono uppercase tracking-widest" style={{ color: config.color }}>{config.code} · {reportDate}</div>
                    </div>
                  </div>
                  <h2 className="text-base font-bold text-white">{reportData.title}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: config.color }}>{reportData.subtitle}</p>
                </div>

                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${config.color}15` }}>
                  <div className="text-[8px] uppercase tracking-widest mb-2 font-mono font-bold" style={{ color: config.color }}>EXECUTIVE SUMMARY</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{reportData.summary}</p>
                </div>

                {reportData.stats.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {reportData.stats.map(s => (
                      <div key={s.label} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="text-[10px] font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[8px] mt-0.5" style={{ color: DS.text.muted }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {reportData.sections.map(section => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-white">{section.title}</div>
                      <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${config.color}15`, color: config.color }}>{section.classification}</span>
                      {section.severity && (
                        <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${SEV_COLORS[section.severity]}15`, color: SEV_COLORS[section.severity] }}>{section.severity.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="space-y-2 pl-2 border-l-2" style={{ borderColor: `${config.color}20` }}>
                      {section.content.map((para, i) => (
                        <p key={i} className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))}

                {reportData.findings.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mb-3 text-white">Findings & Recommendations</div>
                    <div className="space-y-2.5">
                      {reportData.findings.map(f => (
                        <div key={f.id} className="rounded-xl p-3 border" style={{ borderColor: `${SEV_COLORS[f.severity]}20`, background: `${SEV_COLORS[f.severity]}04` }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${SEV_COLORS[f.severity]}15`, color: SEV_COLORS[f.severity] }}>{f.severity.toUpperCase()}</span>
                            <AlertTriangle className="w-3 h-3" style={{ color: SEV_COLORS[f.severity] }} />
                            <span className="text-[10px] font-semibold text-white">{f.finding}</span>
                          </div>
                          <div className="flex items-start gap-1.5 pl-4">
                            <CheckCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" style={{ color: "#6b8f71" }} />
                            <p className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{f.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: `${config.color}15` }}>
                  <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>GENERATED BY AEGIS ENGINE · {reportDate}</span>
                  <span className="text-[8px] font-mono font-bold" style={{ color: config.color }}>{config.classification}</span>
                </div>
              </div>

              <ClassificationBanner text={config.classification} color={config.color} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
