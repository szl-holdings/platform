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

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  appName?: string;
  accentColor?: string;
  placeholder?: string;
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

export function CommandPalette({
  open,
  onClose,
  commands,
  appName,
  accentColor = "#8b7ac8",
  placeholder = "Type a command or search...",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? commands.filter((cmd) => {
        const searchText = [cmd.label, cmd.description ?? "", ...(cmd.keywords ?? [])].join(" ");
        return fuzzyMatch(query, searchText);
      })
    : commands;

  const groups = groupCommands(filtered);
  const flatFiltered = groups.flatMap((g) => g.commands);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
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

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
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
        runSelected();
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, runSelected, flatFiltered.length, onClose]);

  if (!open) return null;

  let flatIndex = 0;

  return (
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
          maxHeight: "520px",
          display: "flex",
          flexDirection: "column",
          background: "rgba(10, 12, 20, 0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
            <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.9)",
              fontSize: "15px",
              fontFamily: typography.fontFamily.body,
            }}
          />
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
            onClick={onClose}
          >
            ESC
          </span>
        </div>

        <div
          ref={listRef}
          style={{ overflowY: "auto", flex: 1 }}
        >
          {flatFiltered.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: "13px",
              }}
            >
              No commands match "{query}"
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
            ["↵", "run"],
            ["?", "shortcuts"],
            ["esc", "close"],
          ].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  padding: "1px 6px",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: typography.fontFamily.mono,
                }}
              >
                {key}
              </span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>
            {flatFiltered.length} {flatFiltered.length === 1 ? "command" : "commands"}
          </span>
        </div>
      </div>
    </div>
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
