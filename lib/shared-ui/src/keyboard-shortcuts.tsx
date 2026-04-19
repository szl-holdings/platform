import React, { useState, useEffect, useCallback } from "react";
import { typography } from "./tokens";

export interface KeyboardShortcut {
  key: string;
  description: string;
  category?: string;
  action?: () => void;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSearchFocus?: () => void;
}

export function useKeyboardShortcuts({
  shortcuts,
  searchInputRef,
  onSearchFocus,
}: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isTyping =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      if (e.key === "Escape") {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach((m) => {
          const closeBtn = m.querySelector('[aria-label="Close"]') as HTMLElement;
          closeBtn?.click();
        });
        return;
      }

      if (e.key === "?" && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (e.key === "/" && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onSearchFocus) {
          onSearchFocus();
        } else if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        for (const shortcut of shortcuts) {
          if (shortcut.action && e.key === shortcut.key) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, showHelp, searchInputRef, onSearchFocus]);

  return { showHelp, setShowHelp };
}

const UNIVERSAL_SHORTCUTS: KeyboardShortcut[] = [
  { key: "⌘K / Ctrl+K", description: "Open command palette", category: "Global" },
  { key: "/", description: "Focus search", category: "Global" },
  { key: "?", description: "Show keyboard shortcuts", category: "Global" },
  { key: "Esc", description: "Close dialog / overlay", category: "Global" },
  { key: "↑↓", description: "Navigate lists", category: "Global" },
  { key: "↵", description: "Confirm / open selection", category: "Global" },
];

interface ShortcutHelpOverlayProps {
  open: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
  appName?: string;
  accentColor?: string;
}

export function ShortcutHelpOverlay({
  open,
  onClose,
  shortcuts = [],
  appName,
  accentColor = "#8b7ac8",
}: ShortcutHelpOverlayProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "?") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const allShortcuts = [...UNIVERSAL_SHORTCUTS, ...shortcuts];
  const categories: Record<string, KeyboardShortcut[]> = {};
  for (const s of allShortcuts) {
    const cat = s.category ?? "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(s);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: typography.fontFamily.body,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "560px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "80vh",
          overflowY: "auto",
          background: "rgba(10, 12, 20, 0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                marginBottom: "2px",
              }}
            >
              Keyboard Shortcuts
            </h2>
            {appName && (
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                {appName}
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                color: accentColor,
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                borderRadius: "5px",
                padding: "2px 8px",
                fontWeight: 600,
              }}
            >
              ?
            </span>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: "13px",
                padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 24px 24px", overflowY: "auto", maxHeight: "60vh" }}>
          {Object.entries(categories).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                {cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {items.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                      {s.description}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {s.key.split("+").map((k, ki, arr) => (
                        <React.Fragment key={ki}>
                          <kbd
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "5px",
                              padding: "2px 8px",
                              fontSize: "11px",
                              color: "rgba(255,255,255,0.6)",
                              fontFamily: typography.fontFamily.mono,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}
                          >
                            {k.trim()}
                          </kbd>
                          {ki < arr.length - 1 && (
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", alignSelf: "center" }}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            textAlign: "center",
            fontSize: "11px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Press <kbd style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", padding: "1px 5px", fontSize: "10px", fontFamily: typography.fontFamily.mono }}>?</kbd> or <kbd style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", padding: "1px 5px", fontSize: "10px", fontFamily: typography.fontFamily.mono }}>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

export function PowerUserProvider({
  children,
  shortcuts = [],
  appName,
  accentColor,
  onSearchFocus,
}: {
  children: React.ReactNode;
  shortcuts?: KeyboardShortcut[];
  appName?: string;
  accentColor?: string;
  onSearchFocus?: () => void;
}) {
  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    shortcuts,
    ...(onSearchFocus !== undefined ? { onSearchFocus } : {}),
  });

  return (
    <>
      {children}
      <ShortcutHelpOverlay
        open={showHelp}
        onClose={() => setShowHelp(false)}
        {...(appName !== undefined ? { appName } : {})}
        {...(accentColor !== undefined ? { accentColor } : {})}
        shortcuts={shortcuts}
      />
    </>
  );
}
