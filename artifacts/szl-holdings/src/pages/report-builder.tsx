import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API = `${BASE}/api`;

type BlockType =
  | "cover"
  | "executive_summary"
  | "metrics_row"
  | "section_header"
  | "body_text"
  | "bullet_list"
  | "data_table"
  | "chart_bar"
  | "chart_line"
  | "chart_gauge"
  | "distress_indicator"
  | "status_grid"
  | "key_value_pairs"
  | "timeline"
  | "risk_matrix"
  | "signature_block"
  | "page_break";

type BrandTheme = "szl" | "carlota" | "aegis" | "terra" | "vessels" | "lyte" | "prism" | "neutral";

interface Block {
  id: string;
  type: BlockType;
  data?: Record<string, unknown>;
}

interface BlockDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  defaultData?: Record<string, unknown>;
}

const BLOCK_PALETTE: BlockDef[] = [
  { type: "cover", label: "Cover Page", icon: "□", description: "Title page with branding and classification", defaultData: { title: "Report Title", subtitle: "Report Subtitle", classification: "CONFIDENTIAL" } },
  { type: "executive_summary", label: "Executive Summary", icon: "◈", description: "Highlighted summary block with accent bar", defaultData: { text: "Executive summary text goes here..." } },
  { type: "section_header", label: "Section Header", icon: "—", description: "Section divider with label", defaultData: { text: "Section Name" } },
  { type: "body_text", label: "Body Text", icon: "¶", description: "Standard paragraph text", defaultData: { text: "Body text goes here..." } },
  { type: "metrics_row", label: "Metrics Row", icon: "▦", description: "Row of KPI metric cards", defaultData: { metrics: [{ label: "Metric 1", value: "—" }, { label: "Metric 2", value: "—" }, { label: "Metric 3", value: "—" }] } },
  { type: "bullet_list", label: "Bullet List", icon: "•", description: "Bulleted list of items", defaultData: { items: ["Item 1", "Item 2", "Item 3"] } },
  { type: "data_table", label: "Data Table", icon: "⊞", description: "Structured data table with headers", defaultData: { headers: ["Column 1", "Column 2", "Column 3"], rows: [["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"]] } },
  { type: "chart_bar", label: "Bar Chart", icon: "▐", description: "Bar chart visualization", defaultData: { title: "Chart Title", series: [{ label: "Q1", value: 42 }, { label: "Q2", value: 68 }, { label: "Q3", value: 55 }, { label: "Q4", value: 78 }] } },
  { type: "chart_line", label: "Line Chart", icon: "∿", description: "Line chart for trend data", defaultData: { title: "Trend", points: [{ label: "Jan", value: 40 }, { label: "Feb", value: 55 }, { label: "Mar", value: 48 }, { label: "Apr", value: 65 }] } },
  { type: "chart_gauge", label: "Gauge / Score", icon: "◎", description: "Gauge/score indicator", defaultData: { title: "Score", label: "Performance", value: 72, max: 100 } },
  { type: "status_grid", label: "Status Grid", icon: "◉", description: "Grid of status indicators", defaultData: { items: [{ name: "Service A", status: "active", detail: "Operating normally" }, { name: "Service B", status: "warning", detail: "Elevated latency" }] } },
  { type: "key_value_pairs", label: "Key-Value Pairs", icon: "≡", description: "Label/value detail pairs", defaultData: { cols: 2, pairs: [{ label: "Label 1", value: "Value 1" }, { label: "Label 2", value: "Value 2" }, { label: "Label 3", value: "Value 3" }, { label: "Label 4", value: "Value 4" }] } },
  { type: "timeline", label: "Timeline", icon: "○—", description: "Event timeline", defaultData: { events: [{ date: "January 2026", title: "Event 1", status: "completed" }, { date: "February 2026", title: "Event 2", status: "active" }, { date: "March 2026", title: "Event 3", status: "pending" }] } },
  { type: "distress_indicator", label: "Distress Score", icon: "⚠", description: "Distress/risk score indicator", defaultData: { score: 65, description: "Multi-factor risk assessment" } },
  { type: "risk_matrix", label: "Risk Matrix", icon: "⊗", description: "Risk assessment matrix", defaultData: { risks: [{ title: "Risk 1", likelihood: "medium", impact: "high", description: "Risk description" }] } },
  { type: "signature_block", label: "Signature Block", icon: "✍", description: "Signature/authorization block", defaultData: { name: "Name", title: "Title" } },
  { type: "page_break", label: "Page Break", icon: "⊣", description: "Force page break", defaultData: {} },
];

const BRAND_THEMES = [
  { value: "szl", label: "SZL Holdings", color: "#c2a55a" },
  { value: "carlota", label: "Carlota Jo", color: "#a855f7" },
  { value: "aegis", label: "Aegis", color: "#06b6d4" },
  { value: "terra", label: "Terra", color: "#22c55e" },
  { value: "vessels", label: "Vessels", color: "#3b82f6" },
  { value: "lyte", label: "Lyte", color: "#8b5cf6" },
  { value: "prism", label: "PRISM", color: "#e879f9" },
  { value: "neutral", label: "Neutral", color: "#64748b" },
];

const DOMAIN_TEMPLATES = [
  { key: "szl_quarterly_investor", label: "SZL — Quarterly Investor Letter" },
  { key: "szl_portfolio", label: "SZL — Portfolio Overview" },
  { key: "carlota_engagement_summary", label: "Carlota Jo — Engagement Summary" },
  { key: "aegis_security_assessment", label: "Aegis — Security Assessment" },
  { key: "terra_property_analysis", label: "Terra — Property Analysis" },
  { key: "vessels_voyage", label: "Vessels — Voyage Report" },
  { key: "lyte_weekly_briefing", label: "Lyte — Weekly Briefing" },
  { key: "prism_legal_memo", label: "PRISM — Legal Memo" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function BlockCard({ block, index, selected, onSelect, onDelete, onMoveUp, onMoveDown }: {
  block: Block;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const def = BLOCK_PALETTE.find(b => b.type === block.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group border rounded-lg p-3 cursor-pointer transition-all ${
        selected
          ? "border-[#c2a55a] bg-[#c2a55a0a]"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <span className="text-zinc-500 text-sm font-mono w-5 text-center select-none">{def?.icon || "□"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200">{def?.label || block.type}</p>
          <p className="text-xs text-zinc-600 truncate">{def?.description}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onMoveUp(); }}
            className="text-zinc-600 hover:text-zinc-300 px-1 text-xs"
            title="Move up"
          >▴</button>
          <button
            onClick={e => { e.stopPropagation(); onMoveDown(); }}
            className="text-zinc-600 hover:text-zinc-300 px-1 text-xs"
            title="Move down"
          >▾</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="text-red-700 hover:text-red-400 px-1 text-xs"
            title="Delete block"
          >✕</button>
        </div>
      </div>
    </motion.div>
  );
}

function DataEditor({ block, onChange }: { block: Block; onChange: (data: Record<string, unknown>) => void }) {
  const data = block.data || {};

  const setValue = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  const renderField = (key: string, val: unknown): React.ReactNode => {
    if (typeof val === "string") {
      return (
        <div key={key}>
          <label className="text-xs text-zinc-500 block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
          <textarea
            value={val}
            onChange={e => setValue(key, e.target.value)}
            rows={val.length > 100 ? 4 : 2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
          />
        </div>
      );
    }
    if (typeof val === "number") {
      return (
        <div key={key}>
          <label className="text-xs text-zinc-500 block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
          <input
            type="number"
            value={val}
            onChange={e => setValue(key, parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>
      );
    }
    if (Array.isArray(val)) {
      return (
        <div key={key}>
          <label className="text-xs text-zinc-500 block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
          <textarea
            value={JSON.stringify(val, null, 2)}
            onChange={e => {
              try { setValue(key, JSON.parse(e.target.value)); } catch {}
            }}
            rows={6}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 resize-y"
          />
          <p className="text-xs text-zinc-600 mt-0.5">JSON array format</p>
        </div>
      );
    }
    if (typeof val === "object" && val !== null) {
      return (
        <div key={key}>
          <label className="text-xs text-zinc-500 block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
          <textarea
            value={JSON.stringify(val, null, 2)}
            onChange={e => {
              try { setValue(key, JSON.parse(e.target.value)); } catch {}
            }}
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 resize-y"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 uppercase tracking-widest">Block Data</p>
      {Object.entries(data).map(([key, val]) => renderField(key, val))}
      {Object.keys(data).length === 0 && (
        <p className="text-xs text-zinc-600">No configurable data for this block type.</p>
      )}
    </div>
  );
}

export default function ReportBuilder() {
  const [reportName, setReportName] = useState("Untitled Report");
  const [domain, setDomain] = useState("szl_holdings");
  const [reportType, setReportType] = useState("custom");
  const [brandTheme, setBrandTheme] = useState<BrandTheme>("szl");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [loadedTemplate, setLoadedTemplate] = useState("");

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  const addBlock = (def: BlockDef) => {
    const block: Block = {
      id: generateId(),
      type: def.type,
      data: def.defaultData ? { ...def.defaultData } : undefined,
    };
    setBlocks(prev => [...prev, block]);
    setSelectedBlockId(block.id);
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, dir: "up" | "down") => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateBlockData = (id: string, data: Record<string, unknown>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data } : b));
  };

  const loadDomainTemplate = async (key: string) => {
    if (!key) return;
    try {
      const res = await fetch(`${API}/reports/templates/built-in/${key}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load template");
      const json = await res.json();
      const tpl = json.data;
      setReportName(tpl.name);
      setDomain(tpl.domain);
      setReportType(tpl.reportType);
      setBrandTheme(tpl.brandTheme || "szl");
      setBlocks(tpl.blocks.map((b: Record<string, unknown>) => ({ ...b, id: generateId() })));
      setSelectedBlockId(null);
      setLoadedTemplate(key);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load template" });
    }
  };

  const handleGenerate = async () => {
    if (!reportName) { setMessage({ type: "error", text: "Report name is required" }); return; }
    if (blocks.length === 0) { setMessage({ type: "error", text: "Add at least one block" }); return; }
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/reports/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportName,
          domain,
          reportType,
          brandTheme,
          generateNarrative: true,
          data: { generatedFrom: "report-builder" },
          templateKey: undefined,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const json = await res.json();
      const reportId = json.data.reportId;
      setMessage({ type: "success", text: `Report generated! ID: ${reportId}` });
      setTimeout(() => { window.location.href = `${BASE}/reports`; }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate report" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (blocks.length === 0) { setMessage({ type: "error", text: "Add blocks to save a template" }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/reports/templates`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          domain,
          reportType,
          brandTheme,
          blocks,
          isSchedulable: true,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setMessage({ type: "success", text: `Template saved! ID: ${json.data.templateId}` });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save template" });
    } finally {
      setSaving(false);
    }
  };

  const themeColor = BRAND_THEMES.find(t => t.value === brandTheme)?.color || "#c2a55a";

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200 flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
        <a href={`${BASE}/reports`} className="text-zinc-500 hover:text-zinc-300 text-sm">← Reports Hub</a>
        <div className="flex-1 flex items-center gap-3">
          <input
            value={reportName}
            onChange={e => setReportName(e.target.value)}
            className="bg-transparent text-zinc-100 font-semibold text-lg focus:outline-none border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 transition-colors px-1 py-0.5 w-64"
          />
        </div>

        {/* Domain Template Loader */}
        <select
          value={loadedTemplate}
          onChange={e => loadDomainTemplate(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">Load domain template...</option>
          {DOMAIN_TEMPLATES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        {/* Brand theme */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Brand:</span>
          <div className="flex gap-1">
            {BRAND_THEMES.map(t => (
              <button
                key={t.value}
                onClick={() => setBrandTheme(t.value as BrandTheme)}
                title={t.label}
                className={`w-5 h-5 rounded-full border-2 transition-all ${brandTheme === t.value ? "border-white scale-110" : "border-transparent hover:border-zinc-500"}`}
                style={{ backgroundColor: t.color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="px-3 py-1.5 text-xs border border-zinc-700 text-zinc-400 rounded-lg hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-1.5 text-xs font-medium text-zinc-900 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {generating ? "Generating..." : "Generate PDF"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-2 text-xs ${message.type === "success" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Block Palette */}
        <div className={`border-r border-zinc-800 bg-zinc-950 transition-all ${showPalette ? "w-56" : "w-10"} shrink-0 overflow-y-auto`}>
          <div className="flex items-center justify-between p-2 border-b border-zinc-800">
            {showPalette && <p className="text-xs text-zinc-500 uppercase tracking-widest px-1">Blocks</p>}
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="text-zinc-600 hover:text-zinc-300 ml-auto text-xs px-1"
            >
              {showPalette ? "◀" : "▶"}
            </button>
          </div>
          {showPalette && (
            <div className="p-2 space-y-0.5">
              {BLOCK_PALETTE.map(def => (
                <button
                  key={def.type}
                  onClick={() => addBlock(def)}
                  className="w-full text-left px-2 py-2 rounded hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-mono w-4">{def.icon}</span>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200 truncate">{def.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Report metadata */}
          <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Domain</label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
              >
                {["szl_holdings", "carlota_jo", "aegis", "terra", "vessels", "lyte", "prism", "general"].map(d => (
                  <option key={d} value={d}>{d.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Report Type</label>
              <input
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none w-36"
                placeholder="report_type_slug"
              />
            </div>
            <div className="ml-auto">
              <span className="text-xs text-zinc-600">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Block list */}
          {blocks.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-800 rounded-xl py-20 text-center">
              <p className="text-zinc-600 text-sm mb-2">Add blocks from the palette on the left</p>
              <p className="text-zinc-700 text-xs">Or load a domain template from the toolbar above</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {blocks.map((block, idx) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    index={idx}
                    selected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlockId(block.id === selectedBlockId ? null : block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, "up")}
                    onMoveDown={() => moveBlock(block.id, "down")}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Block Editor Panel */}
        {selectedBlock && (
          <div className="w-72 border-l border-zinc-800 bg-zinc-950 overflow-y-auto p-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-zinc-300">
                {BLOCK_PALETTE.find(b => b.type === selectedBlock.type)?.label || selectedBlock.type}
              </p>
              <button
                onClick={() => setSelectedBlockId(null)}
                className="text-zinc-600 hover:text-zinc-300 text-xs"
              >✕</button>
            </div>
            <DataEditor
              block={selectedBlock}
              onChange={data => updateBlockData(selectedBlock.id, data)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
