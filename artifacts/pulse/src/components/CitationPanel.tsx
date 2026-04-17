import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Database, Brain, Lightbulb, AlertCircle } from "lucide-react";

export interface Citation {
  id: string;
  sourceType: "entity" | "memory" | "reflection" | "signal" | "trace";
  sourceId: string;
  domain?: string;
  quote?: string;
  freshness?: string;
  confidence?: number;
  verified?: boolean;
}

const SOURCE_TYPE_ICONS: Record<Citation["sourceType"], React.ReactNode> = {
  entity: <Database size={11} />,
  memory: <Brain size={11} />,
  reflection: <Lightbulb size={11} />,
  signal: <AlertCircle size={11} />,
  trace: <ExternalLink size={11} />,
};

const SOURCE_TYPE_COLORS: Record<Citation["sourceType"], string> = {
  entity: "#4eca8b",
  memory: "#7eb8f7",
  reflection: "#c8a84b",
  signal: "#e8855b",
  trace: "#a78bfa",
};

function CitationBadge({ id, sourceType, domain, confidence, freshness, verified }: Citation) {
  const color = SOURCE_TYPE_COLORS[sourceType] ?? "#888";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 4,
      background: `${color}12`, border: `1px solid ${color}30`,
      fontSize: "0.63rem", color, fontFamily: "monospace",
      verticalAlign: "middle",
    }}>
      {SOURCE_TYPE_ICONS[sourceType]}
      <span>{id}</span>
      {domain && <span style={{ opacity: 0.7 }}>· {domain}</span>}
      {confidence !== undefined && (
        <span style={{ opacity: 0.7 }}>· {(confidence * 100).toFixed(0)}%</span>
      )}
      {freshness && <span style={{ opacity: 0.6 }}>· {freshness}</span>}
      {verified && <span style={{ color: "#4eca8b", fontWeight: 700 }}>✓</span>}
    </div>
  );
}

interface CitationPanelProps {
  citations: Citation[];
  highlighted?: string[];
}

export function CitationPanel({ citations, highlighted = [] }: CitationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (citations.length === 0) return null;

  const highlightedCitations = highlighted.length > 0
    ? citations.filter((c) => highlighted.includes(c.id))
    : citations;

  const shown = expanded ? citations : highlightedCitations.slice(0, 4);
  const hasMore = citations.length > shown.length;

  return (
    <div style={{
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 7,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 7,
      }}>
        <div style={{
          fontSize: "0.63rem", fontWeight: 700,
          letterSpacing: "0.07em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
        }}>
          Evidence Provenance · {citations.length} sources
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.63rem", color: "rgba(255,255,255,0.35)",
            }}
          >
            {expanded ? <><ChevronUp size={10} /> Collapse</> : <><ChevronDown size={10} /> Show all {citations.length}</>}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {shown.map((c) => (
          <CitationBadge key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}
