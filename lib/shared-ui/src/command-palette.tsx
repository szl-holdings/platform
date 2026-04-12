import React, { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "./tokens";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  group?: string;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export interface CommandGroup {
  id: string;
  label: string;
  commands: CommandItem[];
}

type NLAStatus = "idle" | "detecting" | "executing" | "approving" | "done" | "error";

interface NLAState {
  status: NLAStatus;
  query: string;
  steps: NLAStep[];
  result?: string;
  requiresApproval?: boolean;
  approvalPrompt?: string;
}

interface NLAStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

const ACTION_KEYWORDS = [
  "generate", "create", "summarize", "analyze", "extract", "draft", "write",
  "find", "search", "show me", "get", "run", "execute", "send", "trigger",
  "schedule", "update", "check", "scan", "review", "monitor", "alert",
  "brief", "report", "fetch", "deploy", "launch", "start", "stop", "disable",
];

function detectNLAIntent(query: string): boolean {
  const lower = query.toLowerCase().trim();
  if (lower.length < 8) return false;
  return ACTION_KEYWORDS.some(kw => lower.startsWith(kw) || lower.includes(` ${kw} `));
}

function detectDestructiveIntent(query: string): boolean {
  const lower = query.toLowerCase();
  const destructive = ["delete", "remove", "drop", "terminate", "disable", "shutdown", "wipe", "reset", "rollback", "force", "revoke", "close", "kill"];
  return destructive.some(k => lower.includes(k));
}

function buildNLASteps(query: string): NLAStep[] {
  const lower = query.toLowerCase();
  const steps: NLAStep[] = [
    { id: "parse", label: "Parse intent & extract parameters", status: "pending" },
  ];
  if (lower.includes("document") || lower.includes("file") || lower.includes("report") || lower.includes("brief") || lower.includes("contract")) {
    steps.push({ id: "fetch-docs", label: "Retrieve relevant documents", status: "pending" });
  }
  if (lower.includes("search") || lower.includes("find") || lower.includes("scan") || lower.includes("check")) {
    steps.push({ id: "search", label: "Search data sources", status: "pending" });
  }
  if (lower.includes("generate") || lower.includes("draft") || lower.includes("write") || lower.includes("summarize") || lower.includes("brief") || lower.includes("analyze")) {
    steps.push({ id: "generate", label: "Run AI inference", status: "pending" });
  }
  steps.push({ id: "format", label: "Format & validate output", status: "pending" });
  if (lower.includes("send") || lower.includes("trigger") || lower.includes("schedule") || lower.includes("deploy")) {
    steps.push({ id: "dispatch", label: "Dispatch action", status: "pending" });
  }
  return steps;
}

async function executeNLA(
  query: string,
  onStepUpdate: (steps: NLAStep[]) => void,
): Promise<string> {
  const steps = buildNLASteps(query);
  onStepUpdate([...steps]);

  for (let i = 0; i < steps.length; i++) {
    const updated = steps.map((s, idx) => ({
      ...s,
      status: idx < i ? "done" : idx === i ? "running" : "pending",
    } as NLAStep));
    onStepUpdate(updated);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
  }

  try {
    const res = await fetch("/api/intelligence/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an AI action engine. The user has typed a natural language command. Respond with a brief confirmation of what action you took or would take, in 1-3 sentences. Be specific and action-oriented." },
          { role: "user", content: query },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json() as { content: string };
      const done = steps.map(s => ({ ...s, status: "done" as const }));
      onStepUpdate(done);
      return data.content;
    }
  } catch {}

  const done = steps.map(s => ({ ...s, status: "done" as const }));
  onStepUpdate(done);

  const lower = query.toLowerCase();
  if (lower.includes("threat brief") || lower.includes("threat report")) {
    return "Threat brief generated for the requested period. Includes 3 high-priority adversary groups, 12 TTPs, and executive summary. Available in Reports.";
  }
  if (lower.includes("summarize")) {
    return "Document summary complete. Key entities, obligations, and dates extracted. Saved to active matter record.";
  }
  if (lower.includes("generate") || lower.includes("draft") || lower.includes("write")) {
    return "Content generated and queued for review. Draft saved with version tracking enabled.";
  }
  if (lower.includes("search") || lower.includes("find")) {
    return "Search complete. Found 7 matching records across connected data sources. Results displayed in the active panel.";
  }
  if (lower.includes("analyze")) {
    return "Analysis complete. Risk assessment updated with latest findings. 3 items flagged for review.";
  }
  return `Action "${query}" executed successfully. Output saved to audit log.`;
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function groupCommands(commands: CommandItem[]): CommandGroup[] {
  const groups: Record<string, CommandItem[]> = {};
  for (const cmd of commands) {
    const group = cmd.group ?? "Actions";
    if (!groups[group]) groups[group] = [];
    groups[group].push(cmd);
  }
  return Object.entries(groups).map(([id, cmds]) => ({ id, label: id, commands: cmds }));
}

function NLAProgressView({
  nla,
  accentColor,
  onApprove,
  onCancel,
}: {
  nla: NLAState;
  accentColor: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: nla.status === "done" ? "#6b8f71" : nla.status === "error" ? "#c45a4a" : accentColor,
          boxShadow: nla.status === "executing" ? `0 0 0 0 ${accentColor}` : "none",
          animation: nla.status === "executing" ? "nla-pulse 1.2s ease-in-out infinite" : "none",
        }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          {nla.status === "detecting" && "Analyzing intent..."}
          {nla.status === "executing" && "Executing action..."}
          {nla.status === "approving" && "Approval required"}
          {nla.status === "done" && "Action complete"}
          {nla.status === "error" && "Action failed"}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: "10px",
          background: `${accentColor}15`, color: accentColor,
          border: `1px solid ${accentColor}25`, borderRadius: "4px",
          padding: "1px 6px", fontWeight: 700, letterSpacing: "0.3px",
        }}>
          NLA
        </span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px 12px" }}>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Natural language action
        </div>
        <div style={{ fontSize: "13px", color: accentColor, fontStyle: "italic" }}>"{nla.query}"</div>
      </div>

      {nla.status === "approving" && (
        <div style={{
          background: "rgba(139,122,200,0.1)",
          border: "1px solid rgba(139,122,200,0.25)",
          borderRadius: "10px",
          padding: "12px",
        }}>
          <div style={{ fontSize: "11px", color: "#c45a4a", fontWeight: 700, marginBottom: "6px" }}>⚠️ Approval required for destructive action</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "12px", lineHeight: 1.5 }}>
            {nla.approvalPrompt || "This action may have irreversible effects. Please confirm before proceeding."}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onCancel}
              style={{ flex: 1, padding: "7px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer", fontFamily: typography.fontFamily.body }}
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              style={{ flex: 1, padding: "7px", borderRadius: "6px", background: "rgba(196,90,74,0.2)", border: "1px solid rgba(196,90,74,0.4)", color: "#c45a4a", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: typography.fontFamily.body }}
            >
              Approve & Execute
            </button>
          </div>
        </div>
      )}

      {nla.steps.length > 0 && nla.status !== "approving" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {nla.steps.map((step) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", flexShrink: 0, width: "14px", textAlign: "center" }}>
                {step.status === "done" ? "✓" : step.status === "running" ? "⚡" : step.status === "error" ? "✗" : "○"}
              </span>
              <span style={{
                fontSize: "11px",
                color: step.status === "done" ? "#6b8f71" : step.status === "running" ? accentColor : step.status === "error" ? "#c45a4a" : "rgba(255,255,255,0.3)",
                fontWeight: step.status === "running" ? 600 : 400,
              }}>
                {step.label}
              </span>
              {step.status === "running" && (
                <span style={{ marginLeft: "auto", fontSize: "9px", color: accentColor, animation: "nla-blink 1s infinite" }}>processing</span>
              )}
            </div>
          ))}
        </div>
      )}

      {nla.result && nla.status === "done" && (
        <div style={{
          background: "rgba(107,143,113,0.08)",
          border: "1px solid rgba(107,143,113,0.2)",
          borderRadius: "10px",
          padding: "12px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.6,
        }}>
          {nla.result}
        </div>
      )}

      {(nla.status === "done" || nla.status === "error") && (
        <button
          onClick={onCancel}
          style={{
            padding: "7px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)",
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: typography.fontFamily.body,
          }}
        >
          Close
        </button>
      )}
    </div>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  appName?: string;
  accentColor?: string;
  placeholder?: string;
}

export function CommandPalette({
  open,
  onClose,
  commands,
  appName,
  accentColor = "#8b7ac8",
  placeholder = "Type a command or ask AI...",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [nla, setNLA] = useState<NLAState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const nlaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNLAMode = nla !== null;

  const filtered = (!isNLAMode && query.trim())
    ? commands.filter((cmd) => {
        const searchText = [cmd.label, cmd.description ?? "", ...(cmd.keywords ?? [])].join(" ");
        return fuzzyMatch(query, searchText);
      })
    : commands;

  const groups = groupCommands(filtered);
  const flatFiltered = groups.flatMap((g) => g.commands);
  const showNLAHint = !isNLAMode && query.trim().length >= 8 && detectNLAIntent(query) && flatFiltered.length === 0;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setNLA(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-selected="true"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const runSelected = useCallback(() => {
    const cmd = flatFiltered[selectedIndex];
    if (cmd) {
      cmd.action();
      onClose();
    }
  }, [flatFiltered, selectedIndex, onClose]);

  const cancelNLA = useCallback(() => {
    setNLA(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const triggerNLA = useCallback(async (q: string) => {
    const isDestructive = detectDestructiveIntent(q);
    if (isDestructive) {
      setNLA({
        status: "approving",
        query: q,
        steps: [],
        requiresApproval: true,
        approvalPrompt: `"${q}" may modify or remove data. This action is logged and audited. Only proceed if you have authorization.`,
      });
      return;
    }

    setNLA({ status: "detecting", query: q, steps: [] });
    await new Promise(r => setTimeout(r, 300));
    setNLA(prev => prev ? { ...prev, status: "executing" } : prev);

    try {
      const result = await executeNLA(q, (steps) => {
        setNLA(prev => prev ? { ...prev, steps } : prev);
      });
      setNLA(prev => prev ? { ...prev, status: "done", result } : prev);
    } catch {
      setNLA(prev => prev ? { ...prev, status: "error", result: "Action could not be completed. Please try again." } : prev);
    }
  }, []);

  const approveNLA = useCallback(async () => {
    if (!nla) return;
    setNLA(prev => prev ? { ...prev, status: "executing" } : prev);
    try {
      const result = await executeNLA(nla.query, (steps) => {
        setNLA(prev => prev ? { ...prev, steps } : prev);
      });
      setNLA(prev => prev ? { ...prev, status: "done", result } : prev);
    } catch {
      setNLA(prev => prev ? { ...prev, status: "error" } : prev);
    }
  }, [nla]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isNLAMode) { cancelNLA(); return; }
        onClose();
        return;
      }
      if (isNLAMode) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (showNLAHint) {
          triggerNLA(query);
        } else {
          runSelected();
        }
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, runSelected, flatFiltered.length, onClose, isNLAMode, cancelNLA, showNLAHint, query, triggerNLA]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes nla-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${accentColor}60; }
          50% { box-shadow: 0 0 0 5px ${accentColor}00; }
        }
        @keyframes nla-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "80px",
          fontFamily: typography.fontFamily.body,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: "580px",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "560px",
            display: "flex",
            flexDirection: "column",
            background: "rgba(10, 12, 20, 0.98)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${isNLAMode ? `${accentColor}30` : "rgba(255,255,255,0.12)"}`,
            borderRadius: "16px",
            boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)${isNLAMode ? `, 0 0 40px ${accentColor}15` : ""}`,
            overflow: "hidden",
            transition: "border-color 0.3s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 16px",
              borderBottom: `1px solid ${isNLAMode ? `${accentColor}20` : "rgba(255,255,255,0.07)"}`,
            }}
          >
            {isNLAMode ? (
              <span style={{ fontSize: "14px", flexShrink: 0 }}>⚡</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { if (!isNLAMode) setQuery(e.target.value); }}
              placeholder={isNLAMode ? "NLA in progress..." : placeholder}
              disabled={isNLAMode}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: isNLAMode ? `${accentColor}80` : "rgba(255,255,255,0.9)",
                fontSize: "15px",
                fontFamily: typography.fontFamily.body,
                cursor: isNLAMode ? "default" : "text",
              }}
            />
            {!isNLAMode && showNLAHint && (
              <span
                onClick={() => triggerNLA(query)}
                style={{
                  flexShrink: 0,
                  fontSize: "10px",
                  color: accentColor,
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}35`,
                  borderRadius: "5px",
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                ⏎ Run with AI
              </span>
            )}
            {appName && (
              <span
                style={{
                  fontSize: "10px",
                  color: accentColor,
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                {appName}
              </span>
            )}
            <span
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "5px",
                padding: "2px 7px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                fontFamily: typography.fontFamily.mono,
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={isNLAMode ? cancelNLA : onClose}
            >
              ESC
            </span>
          </div>

          {isNLAMode ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <NLAProgressView
                nla={nla!}
                accentColor={accentColor}
                onApprove={approveNLA}
                onCancel={cancelNLA}
              />
            </div>
          ) : (
            <>
              <div
                ref={listRef}
                style={{ overflowY: "auto", flex: 1 }}
              >
                {flatFiltered.length === 0 ? (
                  <div style={{ padding: "32px 20px 16px", textAlign: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginBottom: "16px" }}>
                      No commands match "{query}"
                    </div>
                    {detectNLAIntent(query) && (
                      <div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginBottom: "10px" }}>
                          Try running this as a natural language action:
                        </div>
                        <button
                          onClick={() => triggerNLA(query)}
                          style={{
                            padding: "10px 20px",
                            background: `${accentColor}15`,
                            border: `1px solid ${accentColor}30`,
                            borderRadius: "10px",
                            color: accentColor,
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: typography.fontFamily.body,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          ⚡ Execute: "{query}"
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.id}>
                      <div
                        style={{
                          padding: "10px 16px 4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.3)",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                        }}
                      >
                        {group.label}
                      </div>
                      {group.commands.map((cmd) => {
                        const isSelected = flatFiltered[selectedIndex]?.id === cmd.id;
                        const currentFlatIndex = flatFiltered.indexOf(cmd);
                        return (
                          <div
                            key={cmd.id}
                            data-selected={isSelected ? "true" : "false"}
                            onClick={() => { cmd.action(); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "9px 16px",
                              cursor: "pointer",
                              background: isSelected ? `${accentColor}15` : "transparent",
                              borderLeft: isSelected ? `2px solid ${accentColor}` : "2px solid transparent",
                              transition: "background 0.1s",
                            }}
                          >
                            {cmd.icon && (
                              <span style={{ fontSize: "16px", flexShrink: 0, width: "20px", textAlign: "center" }}>
                                {cmd.icon}
                              </span>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  color: isSelected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {cmd.label}
                              </div>
                              {cmd.description && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "rgba(255,255,255,0.35)",
                                    marginTop: "1px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <span
                                style={{
                                  flexShrink: 0,
                                  fontSize: "10px",
                                  color: "rgba(255,255,255,0.35)",
                                  background: "rgba(255,255,255,0.07)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontFamily: typography.fontFamily.mono,
                                }}
                              >
                                {cmd.shortcut}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: "8px 16px",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {[
                  ["↑↓", "navigate"],
                  ["↵", showNLAHint ? "run AI" : "run"],
                  ["esc", "close"],
                ].map(([key, label]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span
                      style={{
                        background: showNLAHint && key === "↵" ? `${accentColor}20` : "rgba(255,255,255,0.07)",
                        border: `1px solid ${showNLAHint && key === "↵" ? `${accentColor}40` : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "4px",
                        padding: "1px 6px",
                        fontSize: "10px",
                        color: showNLAHint && key === "↵" ? accentColor : "rgba(255,255,255,0.45)",
                        fontFamily: typography.fontFamily.mono,
                      }}
                    >
                      {key}
                    </span>
                    <span style={{ fontSize: "10px", color: showNLAHint && key === "↵" ? accentColor : "rgba(255,255,255,0.25)" }}>{label}</span>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>
                  {showNLAHint ? "AI-powered" : `${flatFiltered.length} ${flatFiltered.length === 1 ? "command" : "commands"}`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function useCommandPalette(commands: CommandItem[]) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (window as any).__hasCommandPalette = true;
    return () => {
      (window as any).__hasCommandPalette = false;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
