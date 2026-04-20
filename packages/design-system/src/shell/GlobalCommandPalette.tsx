import React, { useState, useEffect, type ReactNode } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  section?: string;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface GlobalCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

export function GlobalCommandPalette({
  open,
  onClose,
  items,
  placeholder = "Search or run a command…",
}: GlobalCommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const sections = Array.from(new Set(filtered.map((i) => i.section ?? "Commands")));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "120px", background: "rgba(6,11,18,0.80)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: color.bg.surface,
          border: `1px solid ${color.border.default}`,
          maxHeight: "480px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 px-4 border-b"
          style={{ borderColor: color.border.subtle, height: "52px" }}
        >
          <span style={{ color: color.text.muted, fontSize: "16px" }}>⌘</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: color.text.primary }}
          />
          <kbd
            className="rounded px-1.5 text-xs"
            style={{ background: color.bg.overlay, color: color.text.muted }}
          >
            ESC
          </kbd>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
          {filtered.length === 0 ? (
            <div
              className="flex items-center justify-center py-10"
              style={{ color: color.text.muted, fontSize: "13px" }}
            >
              No commands match "{query}"
            </div>
          ) : (
            sections.map((section) => (
              <div key={section} className="py-2">
                <div
                  className="px-4 py-1 uppercase tracking-wider"
                  style={{ fontSize: "10px", color: color.text.muted, fontWeight: 500 }}
                >
                  {section}
                </div>
                {filtered
                  .filter((i) => (i.section ?? "Commands") === section)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.onSelect();
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-4 text-left transition-colors"
                      style={{ height: "40px", color: color.text.primary }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = color.bg.hover;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {item.icon && (
                        <span style={{ color: color.text.secondary, width: "16px" }}>{item.icon}</span>
                      )}
                      <span className="flex-1 text-sm">{item.label}</span>
                      {item.description && (
                        <span style={{ color: color.text.muted, fontSize: "11px" }}>{item.description}</span>
                      )}
                      {item.shortcut && (
                        <kbd
                          className="rounded px-1.5"
                          style={{
                            background: color.bg.overlay,
                            color: color.text.muted,
                            fontSize: "10px",
                          }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
