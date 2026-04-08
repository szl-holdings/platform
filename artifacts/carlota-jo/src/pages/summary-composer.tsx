import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ChevronDown, Copy, Download, RefreshCw, Sliders,
  CheckCircle, Edit3, Sparkles
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CLIENT_GENOME } from "@/data/genome-data";
import { useGenome } from "@/context/GenomeContext";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";

type ToneOption = "formal-brief" | "formal-detailed" | "conversational-brief" | "narrative";
type EngagementContext = "weekly-update" | "monthly-summary" | "recommendation" | "incident" | "project-status" | "custom";

const toneOptions: { id: ToneOption; label: string; desc: string }[] = [
  { id: "formal-brief", label: "Formal · Brief", desc: "3–5 sentences. Direct language. Key points only." },
  { id: "formal-detailed", label: "Formal · Detailed", desc: "Full narrative. All context included. Professional register." },
  { id: "conversational-brief", label: "Conversational · Brief", desc: "Warm but precise. 2–3 paragraphs. Accessible language." },
  { id: "narrative", label: "Narrative", desc: "Tells the story of what happened and why. Suitable for project summaries." },
];

const contextOptions: { id: EngagementContext; label: string }[] = [
  { id: "weekly-update", label: "Weekly Update" },
  { id: "monthly-summary", label: "Monthly Summary" },
  { id: "recommendation", label: "Recommendation" },
  { id: "incident", label: "Incident Report" },
  { id: "project-status", label: "Project Status" },
  { id: "custom", label: "Custom" },
];

function capitalise(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ensurePeriod(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : trimmed + ".";
}

function parseNoteItems(raw: string): string[] {
  return raw
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function composeFromNotes(raw: string, context: EngagementContext, tone: ToneOption): string {
  const items = parseNoteItems(raw);
  if (items.length === 0) return "";

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const monthStr = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const contextHeaders: Record<EngagementContext, string> = {
    "weekly-update": `Weekly Update — ${dateStr}`,
    "monthly-summary": `Monthly Summary — ${monthStr}`,
    "recommendation": "Recommendation",
    "incident": `Incident Report — ${dateStr}`,
    "project-status": "Project Update",
    "custom": "Engagement Note",
  };

  const header = contextHeaders[context];

  if (tone === "formal-brief") {
    const intro = items.length === 1
      ? `One matter was attended to.`
      : `${items.length} matters were attended to.`;
    const body = items.map(item => ensurePeriod(capitalise(item))).join("\n\n");
    return `${header}\n\n${intro}\n\n${body}\n\nNo escalations required.`;
  }

  if (tone === "formal-detailed") {
    const preamble = `${header}\nPrepared by Rosa · Carlota Jo for Lady Ashworth`;
    const intro = `This note covers ${items.length === 1 ? "the following matter" : `the following ${items.length} matters`}.`;
    const numbered = items.map((item, i) => {
      const n = String(i + 1).padStart(2, " ");
      return `${n}. ${ensurePeriod(capitalise(item))}`;
    }).join("\n\n");
    return `${preamble}\n\n${intro}\n\n${numbered}\n\nPlease advise if further detail is required on any of the above.`;
  }

  if (tone === "conversational-brief") {
    const intro = `Here is a brief summary for your reference.`;
    const body = items.map(item => ensurePeriod(capitalise(item))).join("\n\n");
    const close = `Please let Rosa know if you have any questions.`;
    return `${header}\n\n${intro}\n\n${body}\n\n${close}`;
  }

  // narrative
  const intro = `The following summarises recent engagement activity for your review.`;
  const body = items.map((item, i) => {
    const connector = i === 0 ? "" : i === items.length - 1 ? "Finally, " : "Additionally, ";
    return ensurePeriod(capitalise(connector + item.charAt(0).toLowerCase() + item.slice(1)));
  }).join("\n\n");
  const close = `No action is required unless you wish to discuss any of these matters further.`;
  return `${header}\n\n${intro}\n\n${body}\n\n${close}`;
}

export default function SummaryComposer() {
  usePageMeta({
    title: "Summary Composer | Carlota Jo",
    description: "One-click polished client summaries — tone and detail adapting to client communication preferences.",
    canonical: "https://szlholdings.com/carlota-jo/summary-composer",
  });

  const { getPref, lastUpdated: genomLastUpdated } = useGenome();

  const [context, setContext] = useState<EngagementContext>("weekly-update");
  const [tone, setTone] = useState<ToneOption>(CLIENT_GENOME.defaultTone);
  const [rawNotes, setRawNotes] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isHighDiscretion = context === "incident" || restricted;

  const liveTonePref = getPref("tone");
  const genomeTone: ToneOption | null = liveTonePref
    ? liveTonePref.toLowerCase().includes("brief") || liveTonePref.toLowerCase().includes("direct")
      ? "formal-brief"
      : liveTonePref.toLowerCase().includes("detailed")
      ? "formal-detailed"
      : liveTonePref.toLowerCase().includes("conversational")
      ? "conversational-brief"
      : null
    : null;

  const generate = () => {
    if (!rawNotes.trim()) return;
    setGenerating(true);
    setGenerated(null);
    const activeTone = genomeTone ?? tone;
    setTimeout(() => {
      let output = composeFromNotes(rawNotes, context, activeTone);
      if (isHighDiscretion) {
        output = `[RESTRICTED — Rosa brief only. Do not forward to client.]\n\n${output}\n\n---\nDiscretion level: ${CLIENT_GENOME.discretionLevel}/5. This document should not be shared with ${CLIENT_GENOME.name} or any third party without explicit authorisation.`;
      }
      setGenerated(output);
      setGenerating(false);
    }, 900);
  };

  const copy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportFile = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carlota-jo-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0e0c09", color: CREAM }}>
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <FileText size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Intelligence Layer
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Client Summary Composer
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl" style={{ color: CREAM_DIM }}>
            Enter the key facts. The Composer formats them into a polished, client-ready summary — tone, structure, and level of detail derived from the client's Preference Genome communication signals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
                <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>Context</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {contextOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setContext(opt.id)}
                    className="px-3 py-2 text-left text-[11px] font-light transition-colors"
                    style={{
                      border: context === opt.id ? `1px solid ${GOLD_BORDER}` : `1px solid ${CREAM_FAINT}`,
                      background: context === opt.id ? GOLD_DIM : "transparent",
                      color: context === opt.id ? GOLD : MUTED,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="px-3 pb-3">
                <button
                  onClick={() => setRestricted(!restricted)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-light transition-all"
                  style={{
                    border: restricted ? `1px solid rgba(239,68,68,0.3)` : `1px solid ${CREAM_FAINT}`,
                    background: restricted ? "rgba(239,68,68,0.06)" : "transparent",
                    color: restricted ? "rgba(239,68,68,0.75)" : MUTED,
                  }}
                >
                  <span>Mark as restricted — Rosa brief only</span>
                  <span style={{ fontSize: 8, letterSpacing: 1 }}>
                    {restricted ? "RESTRICTED" : "STANDARD"}
                  </span>
                </button>
              </div>
            </div>

            <div style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4"
                style={{ borderBottom: showOptions ? `1px solid ${CREAM_FAINT}` : "none" }}
                onClick={() => setShowOptions(!showOptions)}
              >
                <div className="flex items-center gap-2">
                  <Sliders size={12} style={{ color: MUTED }} />
                  <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>Tone — from Preference Genome</p>
                </div>
                <ChevronDown size={12} style={{ color: MUTED, transform: showOptions ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-3 space-y-2"
                  >
                    {toneOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTone(opt.id)}
                        className="w-full text-left p-3 transition-colors"
                        style={{
                          border: tone === opt.id ? `1px solid ${GOLD_BORDER}` : `1px solid ${CREAM_FAINT}`,
                          background: tone === opt.id ? GOLD_DIM : "transparent",
                        }}
                      >
                        <p className="text-[12px] font-light mb-0.5" style={{ color: tone === opt.id ? GOLD : CREAM }}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] font-light" style={{ color: MUTED }}>{opt.desc}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {!showOptions && (
                <div className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>
                      {toneOptions.find(t => t.id === (genomeTone ?? tone))?.label} · {toneOptions.find(t => t.id === (genomeTone ?? tone))?.desc}
                    </p>
                    {genomeTone && (
                      <span className="text-[8px] tracking-wider uppercase px-1.5 py-0.5" style={{ color: "rgba(16,185,129,0.7)", border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)" }}>
                        Live from Genome{genomLastUpdated ? ` · ${genomLastUpdated}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] tracking-wider uppercase" style={{ color: "rgba(196,170,126,0.35)" }}>
                    Genome default: {CLIENT_GENOME.commsStyle}
                  </p>
                </div>
              )}
            </div>

            <div style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
                <div className="flex items-center gap-2">
                  <Edit3 size={12} style={{ color: MUTED }} />
                  <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>Raw notes</p>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={rawNotes}
                  onChange={e => {
                    setRawNotes(e.target.value);
                    if (generated) setGenerated(null);
                  }}
                  rows={7}
                  className="w-full text-[12px] font-light leading-relaxed resize-none"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: CREAM_DIM,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  placeholder="Enter the key facts, outcomes, and items to communicate — one sentence or point per line, or separated by periods. The Composer will structure and polish these using the selected tone."
                />
                {rawNotes.trim() && (
                  <p className="text-[10px] mt-1" style={{ color: MUTED }}>
                    {parseNoteItems(rawNotes).length} item{parseNoteItems(rawNotes).length !== 1 ? "s" : ""} detected
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !rawNotes.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-[11px] tracking-[0.12em] uppercase font-medium transition-all"
              style={{
                background: generating || !rawNotes.trim() ? "rgba(196,170,126,0.1)" : GOLD_DIM,
                border: `1px solid ${GOLD_BORDER}`,
                color: generating || !rawNotes.trim() ? MUTED : GOLD,
              }}
            >
              {generating ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Composing…
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Generate Summary
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7">
            <div
              className="h-full"
              style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)", minHeight: 520 }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
                <div className="flex items-center gap-2">
                  <FileText size={12} style={{ color: MUTED }} />
                  <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: MUTED }}>
                    Composed summary
                  </p>
                </div>
                {generated && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-all"
                      style={{ border: `1px solid ${CREAM_FAINT}`, color: copied ? "rgba(16,185,129,0.75)" : MUTED }}
                    >
                      {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={exportFile}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-all"
                      style={{ border: `1px solid ${CREAM_FAINT}`, color: MUTED }}
                    >
                      <Download size={10} />
                      Export
                    </button>
                  </div>
                )}
              </div>

              {isHighDiscretion && (
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid rgba(239,68,68,0.15)`, background: "rgba(239,68,68,0.05)" }}>
                  <span style={{ fontSize: 10, color: "rgba(239,68,68,0.7)" }}>&#9888;</span>
                  <p className="text-[10px] tracking-[0.15em] uppercase font-medium" style={{ color: "rgba(239,68,68,0.65)" }}>
                    Restricted · Level {CLIENT_GENOME.discretionLevel}/5 — Rosa brief only
                  </p>
                </div>
              )}

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {generating && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} style={{ color: GOLD }} className="animate-pulse" />
                        <p className="text-[12px] font-light" style={{ color: CREAM_DIM }}>Composing…</p>
                      </div>
                      <p className="text-[10px] tracking-wider" style={{ color: MUTED }}>
                        Formatting {parseNoteItems(rawNotes).length} note{parseNoteItems(rawNotes).length !== 1 ? "s" : ""} — {toneOptions.find(t => t.id === tone)?.label} tone
                      </p>
                    </motion.div>
                  )}
                  {generated && !generating && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-[9px] tracking-[0.2em] uppercase px-2 py-1" style={{ background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
                          {contextOptions.find(c => c.id === context)?.label}
                        </span>
                        <span className="text-[9px] tracking-[0.2em] uppercase px-2 py-1" style={{ background: CREAM_FAINT, color: MUTED }}>
                          {toneOptions.find(t => t.id === tone)?.label}
                        </span>
                        <span className="text-[9px] tracking-[0.2em] uppercase px-2 py-1" style={{ background: CREAM_FAINT, color: MUTED }}>
                          {parseNoteItems(rawNotes).length} source item{parseNoteItems(rawNotes).length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <pre
                        className="whitespace-pre-wrap font-light leading-relaxed"
                        style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", fontSize: "13px", color: CREAM_DIM }}
                      >
                        {generated}
                      </pre>
                    </motion.div>
                  )}
                  {!generated && !generating && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20"
                    >
                      <FileText size={24} style={{ color: MUTED, marginBottom: 12 }} />
                      <p className="text-[12px] font-light text-center max-w-xs" style={{ color: MUTED }}>
                        Enter your raw notes and press Generate. Each sentence or newline-separated item becomes a formatted point in the output.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Tone source", value: `Genome: ${CLIENT_GENOME.commsStyle}` },
            { label: "Summary length", value: CLIENT_GENOME.summaryLength },
            { label: "Preferred medium", value: CLIENT_GENOME.preferredMedium },
          ].map(item => (
            <div key={item.label} className="p-4" style={{ border: `1px solid ${CREAM_FAINT}`, background: GOLD_DIM }}>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: MUTED }}>{item.label}</p>
              <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
