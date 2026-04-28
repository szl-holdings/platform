import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

export interface UseCaseStep {
  text: string;
  signal?: boolean;
  proof?: boolean;
}

export interface UseCase {
  label: string;
  title: string;
  role: string;
  steps: UseCaseStep[];
}

export interface SignalStyle {
  bg: string;
  border: string;
  numberColor: string;
  labelColor: string;
}

interface UseCaseLaneProps {
  useCase: UseCase;
  color: string;
  delay?: number;
  signalStyle?: SignalStyle;
  variant?: "default" | "counsel";
}

const DEFAULT_SIGNAL_STYLE: SignalStyle = {
  bg: "hsla(222,60%,50%,0.15)",
  border: "1px solid hsla(222,60%,50%,0.35)",
  numberColor: "hsl(222,60%,70%)",
  labelColor: "hsl(222,60%,68%)",
};

export function UseCaseLane({
  useCase,
  color,
  delay = 0,
  signalStyle = DEFAULT_SIGNAL_STYLE,
  variant = "default",
}: UseCaseLaneProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const isCounsel = variant === "counsel";
  const fontMono = isCounsel ? "var(--font-mono, monospace)" : "var(--font-mono)";
  const totalSteps = useCase.steps.length;
  const isPlaying = activeStep !== null;
  const isComplete = activeStep === totalSteps - 1;

  const proofBg = isCounsel ? "rgba(52,211,153,0.10)" : "hsla(152,70%,50%,0.12)";
  const proofBorder = isCounsel ? "1px solid rgba(52,211,153,0.28)" : "1px solid hsla(152,70%,50%,0.30)";
  const proofColor = isCounsel ? "#34d399" : "hsl(152,70%,55%)";
  const proofTextColor = isCounsel ? "#6ee7b7" : "hsl(152,40%,72%)";

  function handleStep() {
    if (activeStep === null) {
      setActiveStep(0);
    } else if (!isComplete) {
      setActiveStep(activeStep + 1);
    }
  }

  function handleReset() {
    setActiveStep(null);
  }

  function getStepState(i: number): "active" | "completed" | "upcoming" | "idle" {
    if (activeStep === null) return "idle";
    if (i === activeStep) return "active";
    if (i < activeStep) return "completed";
    return "upcoming";
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42, delay }}
      className={isCounsel ? "rounded-lg border border-white/[0.06]" : "szl-card"}
      style={{
        borderRadius: isCounsel ? undefined : "0.875rem",
        padding: "clamp(1.5rem,3vw,2rem)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        ...(isCounsel ? { background: "#0c1220" } : {}),
      }}
    >
      <div>
        <span
          style={{
            fontFamily: fontMono,
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color,
            opacity: 0.85,
          }}
        >
          {useCase.label}
        </span>
        <h3
          style={{
            fontSize: isCounsel ? "1.0625rem" : "clamp(1rem,1.8vw,1.125rem)",
            fontWeight: 600,
            letterSpacing: "-0.016em",
            lineHeight: 1.3,
            marginTop: "0.4rem",
            marginBottom: "0.375rem",
            ...(isCounsel ? { color: "var(--gi-text-primary)" } : {}),
          }}
        >
          {useCase.title}
        </h3>
        <p
          style={{
            fontFamily: fontMono,
            fontSize: "0.625rem",
            color: isCounsel ? "rgba(148,163,184,0.6)" : "hsl(214,7%,48%)",
            letterSpacing: "0.06em",
          }}
        >
          {useCase.role}
        </p>
      </div>

      <ol style={{ display: "flex", flexDirection: "column", gap: "0", listStyle: "none", margin: 0, padding: 0 }}>
        {useCase.steps.map((step, i) => {
          const state = getStepState(i);
          const isActive = state === "active";
          const isCompleted = state === "completed";
          const isUpcoming = state === "upcoming";

          const nodeBg = step.signal
            ? signalStyle.bg
            : step.proof
            ? proofBg
            : isCounsel ? "rgba(255,255,255,0.04)" : "hsla(214,12%,14%,1)";
          const nodeBorder = step.signal
            ? signalStyle.border
            : step.proof
            ? proofBorder
            : isCounsel ? "1px solid rgba(255,255,255,0.08)" : "1px solid hsla(0,0%,100%,0.08)";
          const nodeColor = step.signal
            ? signalStyle.numberColor
            : step.proof
            ? proofColor
            : isCounsel ? "var(--gi-text-muted)" : "hsl(214,7%,52%)";
          const textColor = step.signal
            ? isCounsel ? "var(--gi-text-primary)" : "hsl(38,8%,88%)"
            : step.proof
            ? proofTextColor
            : isCounsel ? "#94a3b8" : "hsl(214,7%,62%)";

          const opacity = isUpcoming ? 0.32 : isCompleted ? 0.55 : 1;

          return (
            <m.li
              key={i}
              animate={{ opacity }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <m.div
                  animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isCompleted ? (isCounsel ? "rgba(255,255,255,0.04)" : "hsla(214,12%,14%,1)") : nodeBg,
                    border: isCompleted ? (isCounsel ? "1px solid rgba(255,255,255,0.08)" : "1px solid hsla(0,0%,100%,0.08)") : nodeBorder,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: isCompleted ? (isCounsel ? "#334155" : "hsl(214,7%,36%)") : nodeColor,
                    fontFamily: fontMono,
                    boxShadow: isActive ? `0 0 0 3px ${signalStyle.bg}` : "none",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                  {i + 1}
                </m.div>
                {i < totalSteps - 1 && (
                  <div
                    style={{
                      width: "1px",
                      height: "1.5rem",
                      background: isCompleted
                        ? "hsla(0,0%,100%,0.14)"
                        : isCounsel ? "rgba(255,255,255,0.06)" : "hsla(0,0%,100%,0.07)",
                      margin: "0.25rem 0",
                      transition: "background 0.3s ease",
                    }}
                  />
                )}
              </div>
              <div style={{ paddingTop: "0.2rem" }}>
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: textColor }}>
                  {step.signal && (
                    <span
                      style={{
                        fontFamily: fontMono,
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: signalStyle.labelColor,
                        marginRight: "0.4rem",
                      }}
                    >
                      Signal
                    </span>
                  )}
                  {step.proof && (
                    <span
                      style={{
                        fontFamily: fontMono,
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: proofColor,
                        marginRight: "0.4rem",
                      }}
                    >
                      Proof Chain
                    </span>
                  )}
                  {step.text}
                </p>
              </div>
            </m.li>
          );
        })}
      </ol>

      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", paddingTop: "0.25rem" }}>
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <m.button
              key="step"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={handleStep}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.3125rem 0.75rem",
                borderRadius: "0.375rem",
                background: isCounsel ? "rgba(255,255,255,0.04)" : "hsla(214,12%,12%,1)",
                border: `1px solid ${color}30`,
                fontFamily: fontMono,
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color,
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}60`;
                (e.currentTarget as HTMLButtonElement).style.background = isCounsel
                  ? "rgba(255,255,255,0.08)"
                  : "hsla(214,12%,14%,1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}30`;
                (e.currentTarget as HTMLButtonElement).style.background = isCounsel
                  ? "rgba(255,255,255,0.04)"
                  : "hsla(214,12%,12%,1)";
              }}
            >
              {!isPlaying ? "Play through" : `Step ${(activeStep ?? 0) + 2} of ${totalSteps}`}
              <ChevronRight size={11} />
            </m.button>
          ) : (
            <m.button
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.3125rem 0.75rem",
                borderRadius: "0.375rem",
                background: isCounsel ? "rgba(255,255,255,0.04)" : "hsla(214,12%,12%,1)",
                border: "1px solid hsla(0,0%,100%,0.10)",
                fontFamily: fontMono,
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isCounsel ? "#4a6070" : "hsl(214,7%,52%)",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsla(0,0%,100%,0.20)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsla(0,0%,100%,0.10)";
              }}
            >
              <RotateCcw size={10} />
              Reset
            </m.button>
          )}
        </AnimatePresence>

        {isPlaying && !isComplete && (
          <m.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontFamily: fontMono,
              fontSize: "0.5625rem",
              color: isCounsel ? "#475569" : "hsl(214,7%,38%)",
              letterSpacing: "0.06em",
            }}
          >
            {activeStep + 1} / {totalSteps}
          </m.span>
        )}
      </div>
    </m.div>
  );
}
