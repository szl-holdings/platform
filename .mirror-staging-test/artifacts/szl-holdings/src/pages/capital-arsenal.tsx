import { useState, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  FileText, ChevronRight, ChevronDown, ChevronUp, Download, Printer,
  Building2, TrendingUp, Globe, Shield, Ship, MapPin, DollarSign,
  Briefcase, Users, CheckSquare, Search, Filter, ArrowLeft, X,
  BookOpen, ExternalLink, Star, Circle, CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  CAPITAL_DOCUMENTS,
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  getDocumentsByChannel,
  type CapitalDocument,
} from "@/data/capital-arsenal";

const CHANNELS: CapitalDocument["channel"][] = ["investor", "bank", "angel", "ny_state", "federal"];

const CHANNEL_ICONS: Record<CapitalDocument["channel"], React.ElementType> = {
  investor: TrendingUp,
  bank: Building2,
  angel: Star,
  ny_state: MapPin,
  federal: Shield,
};

const TYPE_LABELS: Record<string, string> = {
  one_pager: "One-Pager",
  memo: "Memo",
  deck: "Deck",
  plan: "Business Plan",
  model: "Financial Model",
  guide: "Program Guide",
  checklist: "Checklist",
  brief: "Brief",
  narrative: "Narrative",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  ready: "#3b82f6",
  final: "#10b981",
};

const LANE_ICONS: Record<string, React.ElementType> = {
  "SZL Holdings": Globe,
  "Lyte": TrendingUp,
  "Vessels": Ship,
  "Aegis": Shield,
  "Terra": MapPin,
  "Carlota Jo": Users,
};

function DocumentCard({
  doc,
  onOpen,
  color,
}: {
  doc: CapitalDocument;
  onOpen: (doc: CapitalDocument) => void;
  color: string;
}) {
  const Icon = doc.lane ? (LANE_ICONS[doc.lane] ?? FileText) : FileText;
  const statusColor = STATUS_COLORS[doc.status] ?? "#6b7280";

  return (
    <m.button
      onClick={() => onOpen(doc)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1.125rem 1.25rem",
        borderRadius: "10px",
        background: "hsla(0,0%,100%,0.025)",
        border: `1px solid ${color}22`,
        cursor: "pointer",
        display: "flex",
        gap: "0.875rem",
        alignItems: "flex-start",
      }}
    >
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: `${color}14`,
        border: `1px solid ${color}28`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "1px",
      }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,90%)", letterSpacing: "-0.008em", lineHeight: 1.3 }}>
            {doc.title}
          </p>
          <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
            <span style={{
              fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", padding: "2px 6px", borderRadius: "4px",
              background: `${statusColor}18`, color: statusColor,
            }}>
              {doc.status}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
          {doc.lane && (
            <span style={{ fontSize: "10.5px", color: color, fontWeight: 600 }}>{doc.lane}</span>
          )}
          {doc.lane && <span style={{ fontSize: "10px", color: "hsl(210,5%,38%)" }}>·</span>}
          <span style={{ fontSize: "10.5px", color: "hsl(210,5%,46%)" }}>
            {TYPE_LABELS[doc.type] ?? doc.type}
          </span>
          {doc.printable && (
            <>
              <span style={{ fontSize: "10px", color: "hsl(210,5%,38%)" }}>·</span>
              <span style={{ fontSize: "10.5px", color: "hsl(210,5%,40%)", display: "flex", alignItems: "center", gap: "3px" }}>
                <Printer size={10} /> Printable
              </span>
            </>
          )}
        </div>
        <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)", lineHeight: 1.55 }}>
          {doc.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "0.625rem", color }}>
          <span style={{ fontSize: "11px", fontWeight: 600 }}>View Document</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </m.button>
  );
}

function DocumentViewer({
  doc,
  onClose,
  color,
}: {
  doc: CapitalDocument;
  onClose: () => void;
  color: string;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(doc.sections.map(s => s.title))
  );
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpandedSections(new Set(doc.sections.map(s => s.title)));
  }, [doc.id]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const sectionsHtml = doc.sections.map(s => {
      const contentHtml = s.content
        .split("\n")
        .map(line => {
          if (line.startsWith("•") || line.startsWith("→") || line.startsWith("□") || line.startsWith("✓"))
            return `<div style="padding-left:1.25em;text-indent:-1em;margin:2px 0;">${line}</div>`;
          if (line.match(/^[A-Z0-9][A-Z0-9 \/\(\)\-\.]+:$/) && line.length < 80)
            return `<p style="font-size:10pt;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#333;margin-top:14px;margin-bottom:4px;">${line.replace(/:$/, "")}</p>`;
          if (line.trim() === "") return `<div style="height:6px;"></div>`;
          return `<p style="margin:2px 0;">${line}</p>`;
        }).join("\n");
      return `<div style="margin-bottom:20px;"><h2 style="font-size:13pt;font-weight:700;color:#111;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:10px;">${s.title}</h2><div style="font-size:10.5pt;line-height:1.6;color:#333;">${contentHtml}</div></div>`;
    }).join("\n");
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${doc.title} — SZL Holdings</title>
<style>@page{margin:0.75in 1in;size:letter}body{font-family:'Georgia',serif;color:#111;max-width:7in;margin:0 auto;padding:0.75in 0;}
.header{border-bottom:2pt solid #111;padding-bottom:10pt;margin-bottom:20pt;}
.logo{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}
.subtitle{font-size:9pt;color:#666;margin-top:2pt;font-family:'Helvetica Neue',sans-serif;}
.doc-title{font-size:18pt;font-weight:700;margin-top:14pt;font-family:'Helvetica Neue',sans-serif;}
.meta{font-size:9pt;color:#666;margin-top:4pt;font-family:'Helvetica Neue',sans-serif;}
.footer{border-top:1pt solid #ccc;padding-top:8pt;margin-top:30pt;font-size:8pt;color:#999;font-family:'Helvetica Neue',sans-serif;}
</style></head><body>
<div class="header"><div class="logo">SZL Holdings</div><div class="subtitle">Capital Arsenal — Confidential</div>
<div class="doc-title">${doc.title}</div>
<div class="meta">${doc.lane ? `${doc.lane} · ` : ""}${TYPE_LABELS[doc.type] ?? doc.type} · Status: ${doc.status} · ${dateStr}</div></div>
${sectionsHtml}
<div class="footer">SZL Holdings, Inc. — Confidential &amp; Proprietary — Not for distribution without written consent<br>
Generated ${dateStr} — All financial projections are assumptions; review with qualified counsel before external use.<br>
This document does not constitute an offer to sell securities or financial, legal, or investment advice.</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const Icon = doc.lane ? (LANE_ICONS[doc.lane] ?? FileText) : FileText;
  const statusColor = STATUS_COLORS[doc.status] ?? "#6b7280";

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid hsla(0,0%,100%,0.06)",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
      }}>
        <button
          onClick={onClose}
          style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, marginTop: "2px",
          }}
        >
          <ArrowLeft size={13} style={{ color: "hsl(210,5%,55%)" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={12} style={{ color }} />
            </div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {doc.title}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {doc.lane && <span style={{ fontSize: "11px", color, fontWeight: 600 }}>{doc.lane}</span>}
            {doc.lane && <span style={{ fontSize: "10px", color: "hsl(210,5%,38%)" }}>·</span>}
            <span style={{ fontSize: "11px", color: "hsl(210,5%,46%)" }}>{TYPE_LABELS[doc.type]}</span>
            <span style={{ fontSize: "10px", color: "hsl(210,5%,38%)" }}>·</span>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px", background: `${statusColor}18`, color: statusColor }}>
              {doc.status}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button
            onClick={handleDownload}
            style={{
              display: "flex", alignItems: "center", gap: "5px", padding: "0.5rem 0.875rem",
              borderRadius: "7px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.10)",
              color: "hsl(210,5%,55%)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}
          >
            <Download size={12} /> Download
          </button>
          {doc.printable && (
            <button
              onClick={handlePrint}
              style={{
                display: "flex", alignItems: "center", gap: "5px", padding: "0.5rem 0.875rem",
                borderRadius: "7px", background: `${color}14`, border: `1px solid ${color}28`,
                color, fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}
            >
              <Printer size={12} /> Print
            </button>
          )}
        </div>
      </div>

      <div
        ref={printRef}
        className="document-print-content"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div className="print-branded-header">
          <div className="print-logo-line">SZL Holdings</div>
          <div className="print-subtitle">Capital Arsenal — Confidential</div>
          <div className="print-doc-title">{doc.title}</div>
          <div className="print-doc-meta">
            {doc.lane ? `${doc.lane} · ` : ""}{TYPE_LABELS[doc.type] ?? doc.type} · Status: {doc.status} · Generated {new Date().toLocaleDateString()}
          </div>
        </div>
        {doc.sections.map((section) => {
          const isExpanded = expandedSections.has(section.title);
          return (
            <div
              key={section.title}
              style={{
                borderRadius: "10px",
                border: "1px solid hsla(0,0%,100%,0.07)",
                overflow: "hidden",
                background: "hsla(0,0%,100%,0.02)",
              }}
            >
              <button
                onClick={() => toggleSection(section.title)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ width: "3px", height: "14px", borderRadius: "2px", background: color, flexShrink: 0, opacity: 0.7 }} />
                <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", letterSpacing: "-0.008em" }}>
                  {section.title}
                </span>
                {isExpanded
                  ? <ChevronUp size={13} style={{ color: "hsl(210,5%,45%)", flexShrink: 0 }} />
                  : <ChevronDown size={13} style={{ color: "hsl(210,5%,45%)", flexShrink: 0 }} />
                }
              </button>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 1rem 1rem 1rem", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
                      <div style={{ paddingTop: "0.875rem" }}>
                        {section.content.split("\n\n").map((para, i) => (
                          <div key={i} style={{ marginBottom: i < section.content.split("\n\n").length - 1 ? "0.875rem" : 0 }}>
                            {para.split("\n").map((line, j) => {
                              if (line.startsWith("• ") || line.startsWith("☐ ") || line.startsWith("✓ ") || line.startsWith("→ ") || line.startsWith("□ ")) {
                                const bullet = line.slice(0, 2);
                                const text = line.slice(2);
                                const isChecked = bullet === "✓ ";
                                const isTodo = bullet === "□ ";
                                const isAction = bullet === "→ ";
                                return (
                                  <div key={j} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                                    <span style={{
                                      fontSize: "12px", color: isChecked ? "#10b981" : isAction ? color : isTodo ? "#f59e0b" : "hsl(210,5%,50%)",
                                      flexShrink: 0, lineHeight: 1.6,
                                    }}>
                                      {isChecked ? "✓" : isTodo ? "□" : isAction ? "→" : "•"}
                                    </span>
                                    <span style={{ fontSize: "13px", lineHeight: 1.65, color: isChecked ? "hsl(210,5%,60%)" : "hsl(210,5%,68%)" }}>
                                      {text}
                                    </span>
                                  </div>
                                );
                              }
                              if (line.match(/^[A-Z0-9][A-Z0-9 \/\(\)\-\.]+:$/) && line.length < 80) {
                                return (
                                  <p key={j} style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: color, marginTop: j > 0 ? "0.875rem" : 0, marginBottom: "0.35rem", opacity: 0.85 }}>
                                    {line.replace(/:$/, "")}
                                  </p>
                                );
                              }
                              if (line.trim() === "") return <div key={j} style={{ height: "0.5rem" }} />;
                              return (
                                <p key={j} style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,68%)", marginBottom: "0.25rem" }}>
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div style={{ marginTop: "0.5rem", padding: "0.875rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
          <CheckSquare size={13} style={{ color: "hsl(210,5%,38%)", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "11.5px", color: "hsl(210,5%,42%)", lineHeight: 1.6 }}>
            Internal use only. All financial figures are projections and assumptions clearly labeled as such. Legal, financial, and investment advice requires qualified professional review before external use. This document does not constitute an offer to sell securities or legal or financial advice.
          </p>
        </div>
        <div className="print-branded-footer">
          SZL Holdings, Inc. — Confidential &amp; Proprietary — Not for distribution without written consent — Generated {new Date().toLocaleDateString()} — All projections are assumptions; review with qualified counsel before external use.
        </div>
      </div>
    </m.div>
  );
}

function ChannelSection({
  channel,
  isActive,
  onToggle,
  color,
  icon: Icon,
  onOpenDoc,
}: {
  channel: CapitalDocument["channel"];
  isActive: boolean;
  onToggle: () => void;
  color: string;
  icon: React.ElementType;
  onOpenDoc: (doc: CapitalDocument) => void;
}) {
  const docs = getDocumentsByChannel(channel);
  const label = CHANNEL_LABELS[channel];
  const readyCount = docs.filter(d => d.status === "ready" || d.status === "final").length;

  return (
    <div style={{ borderRadius: "12px", border: `1px solid ${color}20`, overflow: "hidden", background: "hsla(0,0%,100%,0.015)" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          padding: "1.125rem 1.25rem",
          background: isActive ? `${color}08` : "transparent",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.2s",
        }}
      >
        <div style={{
          width: "34px", height: "34px", borderRadius: "9px",
          background: `${color}14`, border: `1px solid ${color}28`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.01em" }}>{label}</p>
          <p style={{ fontSize: "11.5px", color: "hsl(210,5%,48%)", marginTop: "1px" }}>
            {docs.length} documents · {readyCount} ready
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "3px" }}>
            {docs.slice(0, 5).map(d => (
              <div
                key={d.id}
                style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: STATUS_COLORS[d.status] ?? "#6b7280",
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
          {isActive
            ? <ChevronUp size={15} style={{ color: "hsl(210,5%,45%)" }} />
            : <ChevronDown size={15} style={{ color: "hsl(210,5%,45%)" }} />
          }
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isActive && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0.25rem 0.875rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: `1px solid ${color}12` }}>
              {docs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onOpen={onOpenDoc} color={color} />
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CapitalArsenalPage() {
  const [activeChannels, setActiveChannels] = useState<Set<string>>(new Set(["investor"]));
  const [selectedDoc, setSelectedDoc] = useState<CapitalDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  usePageMeta({
    title: "Capital Arsenal — SZL Holdings",
    description: "Complete capital readiness document set: investor materials, bank/SBA package, angel package, NY state programs, and federal programs.",
    canonical: "https://szlholdings.com/admin/capital-arsenal",
  });

  const toggleChannel = (channel: string) => {
    setActiveChannels(prev => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  };

  const filteredDocs = searchQuery.trim()
    ? CAPITAL_DOCUMENTS.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.lane ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const totalDocs = CAPITAL_DOCUMENTS.length;
  const readyDocs = CAPITAL_DOCUMENTS.filter(d => d.status === "ready" || d.status === "final").length;
  const printableDocs = CAPITAL_DOCUMENTS.filter(d => d.printable).length;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main style={{ paddingTop: "5rem" }}>

        <style>{`
          .print-branded-header,
          .print-branded-footer { display: none; }
          @media print {
            body * { visibility: hidden !important; }
            .document-print-content,
            .document-print-content * { visibility: visible !important; }
            .document-print-content {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              background: white !important;
              color: #111 !important;
              padding: 0.75in 1in !important;
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
            }
            .document-print-content p,
            .document-print-content span,
            .document-print-content div {
              color: #111 !important;
              background: transparent !important;
              border-color: #ccc !important;
            }
            .document-print-content h3 {
              color: #111 !important;
              font-size: 13pt !important;
              margin-top: 1.5em !important;
              padding-bottom: 0.25em !important;
              border-bottom: 1pt solid #ccc !important;
            }
            .document-print-content button { display: none !important; }
            nav, header, footer, [class*="SiteNav"] { display: none !important; }
            .print-branded-header {
              display: block !important;
              visibility: visible !important;
              border-bottom: 2pt solid #111;
              padding-bottom: 10pt;
              margin-bottom: 18pt;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .print-branded-header .print-logo-line {
              font-size: 14pt;
              font-weight: 700;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              color: #111;
            }
            .print-branded-header .print-subtitle {
              font-size: 9pt;
              color: #666;
              margin-top: 2pt;
            }
            .print-branded-header .print-doc-title {
              font-size: 18pt;
              font-weight: 700;
              color: #111;
              margin-top: 12pt;
            }
            .print-branded-header .print-doc-meta {
              font-size: 9pt;
              color: #666;
              margin-top: 4pt;
            }
            .print-branded-footer {
              display: block !important;
              visibility: visible !important;
              border-top: 1pt solid #ccc;
              padding-top: 8pt;
              margin-top: 24pt;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 8pt;
              color: #999;
            }
            @page {
              margin: 0.5in;
              size: letter;
            }
          }
        `}</style>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem 4rem" }}>

          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2rem", paddingTop: "1rem" }}
          >
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.5rem" }}>
              Capital Readiness OS
            </p>
            <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.875rem" }}>
              Capital Arsenal
            </h1>
            <p style={{ fontSize: "14px", lineHeight: 1.65, color: "hsl(210,5%,55%)", maxWidth: "36rem" }}>
              Professional, investor-grade documents for every capital channel — bank, angel, grants, and certifications. Internal use only.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {[
                { label: "Total Documents", value: totalDocs, color: "#3b82f6" },
                { label: "Ready / Final", value: readyDocs, color: "#10b981" },
                { label: "Printable", value: printableDocs, color: "#f59e0b" },
                { label: "Capital Channels", value: CHANNELS.length, color: "#8b5cf6" },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: stat.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,45%)", marginTop: "2px" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </m.div>

          {/* Disclaimer */}
          <div style={{ marginBottom: "1.5rem", padding: "0.875rem 1rem", borderRadius: "8px", background: "hsla(38,95%,58%,0.05)", border: "1px solid hsla(38,95%,58%,0.18)", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
            <CheckSquare size={13} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "12px", color: "hsl(38,10%,60%)", lineHeight: 1.6 }}>
              <strong style={{ color: "#f59e0b" }}>Internal Use Only.</strong> All financial figures are projections and assumptions. These documents do not constitute financial, legal, or investment advice. Materials must be reviewed by qualified counsel (attorney, CPA) before external distribution or use.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: selectedDoc ? "1fr 1fr" : "1fr", gap: "1.25rem" }}>

            {/* Left: Document List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "hsl(210,5%,42%)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  style={{
                    width: "100%", padding: "0.625rem 0.875rem 0.625rem 2.25rem",
                    background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
                    borderRadius: "8px", color: "hsl(38,12%,88%)", fontSize: "13px",
                    outline: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <X size={13} style={{ color: "hsl(210,5%,42%)" }} />
                  </button>
                )}
              </div>

              {/* Search Results */}
              {filteredDocs !== null ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,42%)", paddingLeft: "0.25rem" }}>
                    {filteredDocs.length} result{filteredDocs.length !== 1 ? "s" : ""} for "{searchQuery}"
                  </p>
                  {filteredDocs.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "hsl(210,5%,50%)", textAlign: "center", padding: "2rem" }}>
                      No documents found.
                    </p>
                  ) : (
                    filteredDocs.map(doc => {
                      const color = CHANNEL_COLORS[doc.channel];
                      return <DocumentCard key={doc.id} doc={doc} onOpen={setSelectedDoc} color={color} />;
                    })
                  )}
                </div>
              ) : (
                /* Channel Sections */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {CHANNELS.map(channel => {
                    const color = CHANNEL_COLORS[channel];
                    const Icon = CHANNEL_ICONS[channel];
                    return (
                      <ChannelSection
                        key={channel}
                        channel={channel}
                        isActive={activeChannels.has(channel)}
                        onToggle={() => toggleChannel(channel)}
                        color={color}
                        icon={Icon}
                        onOpenDoc={(doc) => {
                          setSelectedDoc(doc);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Document Viewer */}
            {selectedDoc && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  borderRadius: "12px",
                  border: `1px solid ${CHANNEL_COLORS[selectedDoc.channel]}22`,
                  background: "hsl(210,12%,6%)",
                  height: "calc(100vh - 8rem)",
                  position: "sticky",
                  top: "5.5rem",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <DocumentViewer
                  doc={selectedDoc}
                  onClose={() => setSelectedDoc(null)}
                  color={CHANNEL_COLORS[selectedDoc.channel]}
                />
              </m.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
