import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Eye, Shield, Network, Activity, Lock, Play } from "lucide-react";

const PLATFORM_STEPS = [
  { icon: Eye, label: "Signal", desc: "Lyte ingests operational signals — stuck approvals, drift, risk flags", color: "hsl(192,72%,48%)", duration: "0–15s" },
  { icon: Shield, label: "Detection", desc: "Domain AI surfaces anomalies across Vessels, Terra, and Aegis simultaneously", color: "hsl(222,60%,62%)", duration: "15–30s" },
  { icon: Network, label: "Cross-domain mesh", desc: "Intelligence compounds — a maritime anomaly enriches credit risk in Lyte", color: "hsl(38,72%,58%)", duration: "30–50s" },
  { icon: Activity, label: "Governed action", desc: "Signal → action with full audit trail and human-in-the-loop controls", color: "hsl(140,50%,48%)", duration: "50–70s" },
  { icon: Lock, label: "Proof chain", desc: "Immutable record of every decision, inference, and action taken", color: "hsl(280,50%,65%)", duration: "70–90s" },
];

export function PlatformIn90Seconds() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % PLATFORM_STEPS.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const step = PLATFORM_STEPS[activeStep];
  const StepIcon = step.icon;
  const progress = ((activeStep + 1) / PLATFORM_STEPS.length) * 100;

  return (
    <div style={{ display: "grid", gap: "2rem", alignItems: "center" }} className="lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.625rem", borderRadius: "2rem", background: "hsla(192,72%,48%,0.1)", border: "1px solid hsla(192,72%,48%,0.2)" }}>
            <Play size={10} style={{ color: "hsl(192,72%,48%)" }} />
            <span style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)" }}>
              Platform in 90 Seconds
            </span>
          </div>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{ background: "transparent", border: "none", color: "hsla(0,0%,100%,0.35)", fontSize: "0.625rem", fontFamily: "var(--font-mono)", cursor: "pointer", letterSpacing: "0.08em" }}
          >
            {isPlaying ? "PAUSE" : "PLAY"}
          </button>
        </div>
        <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "0.5rem" }}>
          From signal to governed action.
        </h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", marginBottom: "1.5rem" }}>
          Watch the full platform cycle: signal ingestion, cross-domain intelligence, governed action routing, and immutable proof chain — in five steps.
        </p>
        <div style={{ height: "3px", borderRadius: "2px", background: "hsla(0,0%,100%,0.06)", marginBottom: "1.25rem", overflow: "hidden" }}>
          <m.div
            key={activeStep}
            initial={{ width: `${((activeStep) / PLATFORM_STEPS.length) * 100}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 3.8, ease: "linear" }}
            style={{ height: "100%", borderRadius: "2px", background: step.color }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {PLATFORM_STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === activeStep;
            return (
              <button
                key={s.label}
                onClick={() => { setActiveStep(i); setIsPlaying(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "0.5rem",
                  background: isActive ? `${s.color}10` : "transparent",
                  border: `1px solid ${isActive ? s.color + "25" : "transparent"}`,
                  color: isActive ? "hsl(38,8%,92%)" : "hsla(0,0%,100%,0.4)",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={14} style={{ color: isActive ? s.color : "hsla(0,0%,100%,0.25)", flexShrink: 0 }} />
                <span>{s.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.5625rem", color: "hsla(0,0%,100%,0.2)", fontFamily: "var(--font-mono)" }}>{s.duration}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          style={{
            padding: "2.5rem",
            borderRadius: "1rem",
            background: `${step.color}06`,
            border: `1px solid ${step.color}20`,
            textAlign: "center",
            minHeight: "280px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: "0.75rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${step.color}12`, border: `1px solid ${step.color}30`,
          }}>
            <StepIcon size={24} style={{ color: step.color }} />
          </div>
          <div>
            <p style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: step.color, fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
              Step {activeStep + 1} of {PLATFORM_STEPS.length}
            </p>
            <h3 style={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.015em", color: "hsl(38,8%,94%)", marginBottom: "0.625rem" }}>
              {step.label}
            </h3>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsla(0,0%,100%,0.55)", maxWidth: "30ch", margin: "0 auto" }}>
              {step.desc}
            </p>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
