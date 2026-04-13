import { useState, useEffect, useCallback } from "react";

export type ColorMode = "dark" | "light" | "system";

const STORAGE_KEY = "szl-color-mode";
const DATA_ATTR = "data-color-mode";

function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(mode: ColorMode): "dark" | "light" {
  if (mode === "system") return getSystemPreference();
  return mode;
}

function applyColorMode(resolved: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(DATA_ATTR, resolved);
}

function readStoredMode(): ColorMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light" || raw === "system") return raw;
  } catch {
  }
  return "system";
}

let _globalListeners: Array<(mode: ColorMode) => void> = [];
let _currentMode: ColorMode = readStoredMode();

if (typeof document !== "undefined") {
  const _resolved = resolveMode(_currentMode);
  applyColorMode(_resolved);
}

function broadcastChange(mode: ColorMode) {
  _currentMode = mode;
  for (const fn of _globalListeners) fn(mode);
}

export interface ColorModeState {
  mode: ColorMode;
  resolved: "dark" | "light";
  isDark: boolean;
  isLight: boolean;
  setMode: (mode: ColorMode) => void;
  toggle: () => void;
}

export function useColorMode(): ColorModeState {
  const [mode, setModeState] = useState<ColorMode>(() => readStoredMode());

  useEffect(() => {
    const listener = (newMode: ColorMode) => setModeState(newMode);
    _globalListeners.push(listener);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (_currentMode === "system") {
        const resolved = getSystemPreference();
        applyColorMode(resolved);
      }
    };
    mq.addEventListener("change", onSystemChange);

    return () => {
      _globalListeners = _globalListeners.filter((fn) => fn !== listener);
      mq.removeEventListener("change", onSystemChange);
    };
  }, []);

  useEffect(() => {
    const resolved = resolveMode(mode);
    applyColorMode(resolved);
  }, [mode]);

  const setMode = useCallback((newMode: ColorMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
    }
    broadcastChange(newMode);
    try {
      fetch("/api/config/user-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ colorMode: newMode }),
      }).catch(() => {});
    } catch {
    }
  }, []);

  const toggle = useCallback(() => {
    const resolved = resolveMode(_currentMode);
    const next: ColorMode = resolved === "dark" ? "light" : "dark";
    setMode(next);
  }, [setMode]);

  const resolved = resolveMode(mode);

  return {
    mode,
    resolved,
    isDark: resolved === "dark",
    isLight: resolved === "light",
    setMode,
    toggle,
  };
}

export function initColorMode() {
  const stored = readStoredMode();
  const resolved = resolveMode(stored);
  applyColorMode(resolved);
}
