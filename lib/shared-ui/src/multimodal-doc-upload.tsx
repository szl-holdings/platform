import React, { useState, useRef, useCallback } from "react";

export type InputModality = "text" | "pdf_text" | "image_base64" | "audio_base64" | "handwritten_image" | "html" | "markdown" | "scanned_document";

export interface MultimodalResult {
  documentId: string;
  domain: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  entities: Array<{ type: string; value: string; confidence: number; context?: string }>;
  crossModalLinks: Array<{ sourceModality: InputModality; targetModality: InputModality; linkType: string; referenceText: string }>;
  citations: Array<{ text: string; sourceModality: InputModality; confidence: number }>;
  riskSignals: string[];
  sentiment?: string;
  latencyMs: number;
}

export interface MultimodalDocUploadProps {
  domain?: "legal" | "maritime" | "real_estate" | "cyber" | "financial" | "general";
  apiBase: string;
  accentColor?: string;
  onResult?: (result: MultimodalResult) => void;
  compact?: boolean;
  enableCrossModal?: boolean;
}

const MODALITY_META: Record<InputModality, { icon: string; label: string; accept: string }> = {
  text: { icon: "📄", label: "Text", accept: ".txt" },
  pdf_text: { icon: "📋", label: "PDF", accept: ".pdf" },
  image_base64: { icon: "🖼️", label: "Image", accept: ".jpg,.jpeg,.png,.webp" },
  audio_base64: { icon: "🎤", label: "Audio", accept: ".mp3,.wav,.m4a,.webm" },
  handwritten_image: { icon: "✍️", label: "Handwritten", accept: ".jpg,.jpeg,.png" },
  html: { icon: "🌐", label: "HTML", accept: ".html" },
  markdown: { icon: "📝", label: "Markdown", accept: ".md" },
  scanned_document: { icon: "📠", label: "Scan", accept: ".jpg,.jpeg,.png,.tiff" },
};

const DOMAIN_COLORS: Record<string, string> = {
  legal: "#a78bfa",
  maritime: "#0ea5e9",
  real_estate: "#22c55e",
  cyber: "#ef4444",
  financial: "#f59e0b",
  general: "#6b7280",
};

export function MultimodalDocUpload({ domain = "general", apiBase, accentColor, onResult, compact = false, enableCrossModal = true }: MultimodalDocUploadProps) {
  const [files, setFiles] = useState<Array<{ file: File; modality: InputModality }>>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<MultimodalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "entities" | "links" | "risks">("summary");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const color = accentColor ?? DOMAIN_COLORS[domain] ?? "#6b7280";

  const detectModality = (file: File): InputModality => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = file.type;
    if (mime.startsWith("audio/")) return "audio_base64";
    if (mime === "application/pdf" || ext === "pdf") return "pdf_text";
    if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext)) {
      if (file.name.toLowerCase().includes("handwritten") || file.name.toLowerCase().includes("scan")) return "handwritten_image";
      return "image_base64";
    }
    if (ext === "html") return "html";
    if (ext === "md") return "markdown";
    return "text";
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const additions = Array.from(newFiles).map(file => ({
      file,
      modality: detectModality(file),
    }));
    setFiles(prev => [...prev, ...additions]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const processDocuments = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      const form = new FormData();
      files.forEach(({ file }) => form.append("files", file));
      form.append("domain", domain);
      form.append("crossModalLinking", String(enableCrossModal));

      const res = await fetch(`${apiBase}/multimodal-documents/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) throw new Error(`Processing failed: ${res.status}`);
      const data = await res.json() as { data: MultimodalResult };
      setResult(data.data);
      onResult?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const styles = {
    container: {
      fontFamily: "system-ui, sans-serif",
      color: "#e5e7eb",
      background: "#0f1520",
      borderRadius: compact ? 12 : 16,
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
    } as React.CSSProperties,
    dropzone: {
      border: `2px dashed ${dragging ? color : "rgba(255,255,255,0.1)"}`,
      borderRadius: 10,
      padding: compact ? "16px" : "24px",
      textAlign: "center" as const,
      cursor: "pointer",
      transition: "all 0.2s",
      background: dragging ? `${color}10` : "transparent",
      margin: compact ? 10 : 16,
    },
    fileTag: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 8px",
      background: "rgba(255,255,255,0.05)",
      borderRadius: 20,
      fontSize: 11,
      border: "1px solid rgba(255,255,255,0.08)",
      margin: 3,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={{ padding: compact ? "10px 12px" : "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}20`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
          🧠
        </div>
        <div>
          <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600 }}>Multimodal Document Intelligence</div>
          {!compact && <div style={{ fontSize: 11, color: "#6b7280" }}>PDFs · Images · Audio · Handwritten · Mixed documents</div>}
        </div>
      </div>

      {!result ? (
        <div>
          <div
            style={styles.dropzone}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: compact ? 24 : 32, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: compact ? 11 : 13, fontWeight: 500, color: "#9ca3af" }}>
              Drop any document type here
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>
              PDF · Images · Audio (transcribed) · Handwritten notes · HTML · Markdown
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.html,.md,.tiff"
              style={{ display: "none" }}
              onChange={e => addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div style={{ padding: "0 16px 12px" }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                {files.length} file{files.length !== 1 ? "s" : ""} queued:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {files.map((f, i) => {
                  const meta = MODALITY_META[f.modality];
                  return (
                    <span key={i} style={styles.fileTag}>
                      <span>{meta.icon}</span>
                      <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file.name}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, j) => j !== i)); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, marginLeft: 2, fontSize: 10 }}
                      >✕</button>
                    </span>
                  );
                })}
              </div>

              {files.length > 1 && enableCrossModal && (
                <div style={{ fontSize: 10, color: "#3b82f6", marginTop: 6, padding: "4px 8px", background: "rgba(59,130,246,0.08)", borderRadius: 6 }}>
                  🔗 Cross-modal linking enabled — references between documents will be detected
                </div>
              )}

              {error && (
                <div style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 6, padding: "6px 10px", marginTop: 8 }}>
                  {error}
                </div>
              )}

              <button
                onClick={processDocuments}
                disabled={processing}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: processing ? "rgba(255,255,255,0.1)" : color,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: processing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: processing ? 0.7 : 1,
                }}
              >
                {processing ? "🔄 Processing..." : "🧠 Analyze Documents"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {(["summary", "entities", "links", "risks"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveResultTab(tab)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  color: activeResultTab === tab ? "#fff" : "#6b7280",
                  borderBottom: `2px solid ${activeResultTab === tab ? color : "transparent"}`,
                  textTransform: "capitalize",
                }}
              >
                {tab === "links" ? "Cross-Modal" : tab}
              </button>
            ))}
          </div>

          <div style={{ padding: 14, maxHeight: compact ? 200 : 320, overflowY: "auto" }}>
            {activeResultTab === "summary" && (
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                  <span style={{ color }}>Domain:</span> {result.domain} ·
                  <span style={{ color }}> Sentiment:</span> {result.sentiment ?? "—"} ·
                  <span style={{ color }}> {result.latencyMs}ms</span>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: "#e5e7eb", marginBottom: 10 }}>{result.summary}</p>
                {result.keyPoints.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>KEY POINTS</div>
                    {result.keyPoints.map((p, i) => <div key={i} style={{ fontSize: 11, color: "#d1d5db", padding: "2px 0", paddingLeft: 10, borderLeft: `2px solid ${color}50` }}>• {p}</div>)}
                  </>
                )}
                {result.actionItems.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", margin: "8px 0 4px" }}>ACTION ITEMS</div>
                    {result.actionItems.map((a, i) => <div key={i} style={{ fontSize: 11, color: "#fbbf24", padding: "2px 0" }}>→ {a}</div>)}
                  </>
                )}
                {result.citations.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", margin: "8px 0 4px" }}>CITATIONS</div>
                    {result.citations.slice(0, 5).map((c, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#9ca3af", padding: "2px 0" }}>
                        [{MODALITY_META[c.sourceModality]?.icon ?? "📄"} {c.sourceModality}] {c.text.slice(0, 80)}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeResultTab === "entities" && (
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>{result.entities.length} entities extracted</div>
                {result.entities.slice(0, 30).map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: `${color}20`, color, border: `1px solid ${color}30` }}>{e.type}</span>
                    <span style={{ fontSize: 11, flex: 1 }}>{e.value}</span>
                    <span style={{ fontSize: 10, color: "#4b5563" }}>{((e.confidence ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}

            {activeResultTab === "links" && (
              <div>
                {result.crossModalLinks.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", padding: 20 }}>
                    No cross-modal references detected
                    {result.citations.length === 0 && " — upload multiple document types to enable cross-modal linking"}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>{result.crossModalLinks.length} cross-modal links detected</div>
                    {result.crossModalLinks.map((link, i) => (
                      <div key={i} style={{ padding: "8px", marginBottom: 6, background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                        <div style={{ fontSize: 11, color: "#e5e7eb", marginBottom: 3 }}>
                          {MODALITY_META[link.sourceModality]?.icon} {link.sourceModality}
                          <span style={{ color, margin: "0 6px" }}>→</span>
                          {MODALITY_META[link.targetModality]?.icon} {link.targetModality}
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{link.linkType}: "{link.referenceText.slice(0, 80)}"</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeResultTab === "risks" && (
              <div>
                {result.riskSignals.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#22c55e", textAlign: "center", padding: 20 }}>✓ No risk signals detected</div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8 }}>{result.riskSignals.length} risk signals</div>
                    {result.riskSignals.map((r, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#fca5a5", padding: "4px 0", display: "flex", gap: 6 }}>
                        <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span> {r}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#374151" }}>ID: {result.documentId}</span>
            <button
              onClick={() => { setResult(null); setFiles([]); setError(null); }}
              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid rgba(255,255,255,0.1)`, background: "none", color: "#9ca3af", cursor: "pointer" }}
            >
              Analyze New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
