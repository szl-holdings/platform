import React, { useState, useCallback, useEffect, useRef } from "react";

export interface AppTransitionConfig {
  toAppId: string;
  toAppName: string;
  toPath: string;
  accentColor?: string;
  icon?: string;
}

export interface AppTransitionOverlayProps {
  accentColor?: string;
}

let _triggerTransition: ((cfg: AppTransitionConfig) => void) | null = null;

export function useAppTransition() {
  const navigate = useCallback((cfg: AppTransitionConfig) => {
    if (_triggerTransition) {
      _triggerTransition(cfg);
    } else {
      window.location.href = cfg.toPath;
    }
  }, []);

  return { navigate };
}

export function AppTransitionOverlay({ accentColor: defaultAccent = "#8b7ac8" }: AppTransitionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"idle" | "enter" | "hold" | "exit">("idle");
  const [config, setConfig] = useState<AppTransitionConfig | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    _triggerTransition = (cfg: AppTransitionConfig) => {
      setConfig(cfg);
      setPhase("enter");
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setPhase("hold");
        timerRef.current = setTimeout(() => {
          window.location.href = cfg.toPath;
        }, 600);
      }, 350);
    };

    return () => {
      _triggerTransition = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible || !config) return null;

  const accent = config.accentColor ?? defaultAccent;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label={`Navigating to ${config.toAppName}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: phase === "enter"
          ? "rgba(6, 8, 16, 0.0)"
          : "rgba(6, 8, 16, 0.96)",
        backdropFilter: "blur(20px)",
        transition: "background 0.35s ease, backdrop-filter 0.35s ease",
        pointerEvents: "all",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          opacity: phase === "hold" ? 1 : 0,
          transform: phase === "hold" ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s",
        }}
      >
        {config.icon && (
          <div
            style={{
              fontSize: "32px",
              lineHeight: 1,
              filter: `drop-shadow(0 0 16px ${accent}60)`,
            }}
            aria-hidden="true"
          >
            {config.icon}
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.01em",
              marginBottom: "4px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {config.toAppName}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Opening platform…
          </p>
        </div>

        <div
          style={{
            width: "120px",
            height: "2px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: accent,
              borderRadius: "2px",
              width: "0%",
              animation: "szl-transition-bar 0.9s ease forwards",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes szl-transition-bar {
          0%   { width: 0%; opacity: 1; }
          70%  { width: 80%; opacity: 1; }
          90%  { width: 95%; opacity: 1; }
          100% { width: 100%; opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
