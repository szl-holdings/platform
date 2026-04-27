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

interface UseCaseLaneProps {
  useCase: UseCase;
  delay?: number;
  accentColor: string;
  signalColor: string;
  signalBg: string;
  signalBorder: string;
  proofColor?: string;
  proofBg?: string;
  proofBorder?: string;
  cardClassName?: string;
  cardStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  roleStyle?: React.CSSProperties;
}

const DEFAULT_PROOF_COLOR = "hsl(152,70%,55%)";
const DEFAULT_PROOF_BG = "hsla(152,70%,50%,0.12)";
const DEFAULT_PROOF_BORDER = "1px solid hsla(152,70%,50%,0.30)";

export function UseCaseLane({
  useCase,
  delay = 0,
  accentColor,
  signalColor,
  signalBg,
  signalBorder,
  proofColor = DEFAULT_PROOF_COLOR,
  proofBg = DEFAULT_PROOF_BG,
  proofBorder = DEFAULT_PROOF_BORDER,
  cardClassName = "szl-card",
  cardStyle,
  labelStyle,
  titleStyle,
  roleStyle,
}: UseCaseLaneProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const totalSteps = useCase.steps.length;
  const isPlaying = activeStep !== null;
  const isComplete = activeStep === totalSteps - 1;

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
      className={cardClassName}
      style={{
        borderRadius: "0.875rem",
        padding: "clamp(1.5rem,3vw,2rem)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        ...cardStyle,
      }}
    >
      <div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accentColor,
            opacity: 0.85,
            ...labelStyle,
          }}
        >
          {useCase.label}
        </span>
        <h3
          style={{
            fontSize: "clamp(1rem,1.8vw,1.125rem)",
            fontWeight: 600,
            letterSpacing: "-0.016em",
            lineHeight: 1.3,
            marginTop: "0.4rem",
            marginBottom: "0.375rem",
            ...titleStyle,
          }}
        >
          {useCase.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "hsl(214,7%,48%)",
            letterSpacing: "0.06em",
            ...roleStyle,
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
            ? signalBg
            : step.proof
            ? proofBg
            : "hsla(214,12%,14%,1)";
          const nodeBorder = step.signal
            ? signalBorder
            : step.proof
            ? proofBorder
            : "1px solid hsla(0,0%,100%,0.08)";
          const nodeColor = step.signal
            ? signalColor
            : step.proof
            ? proofColor
            : "hsl(214,7%,52%)";
          const textColor = step.signal
            ? "hsl(38,8%,88%)"
            : step.proof
            ? "hsl(152,40%,72%)"
            : "hsl(214,7%,62%)";

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
                    background: isActive ? nodeBg : isCompleted ? "hsla(214,12%,14%,1)" : nodeBg,
                    border: isActive ? nodeBorder : isCompleted ? "1px solid hsla(0,0%,100%,0.08)" : nodeBorder,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: isActive ? nodeColor : isCompleted ? "hsl(214,7%,36%)" : nodeColor,
                    fontFamily: "var(--font-mono)",
                    boxShadow: isActive ? `0 0 0 3px ${signalBg}` : "none",
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
                        : "hsla(0,0%,100%,0.07)",
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
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: signalColor,
                        marginRight: "0.4rem",
                      }}
                    >
                      Signal
                    </span>
                  )}
                  {step.proof && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
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
                background: "hsla(214,12%,12%,1)",
                border: `1px solid ${accentColor}30`,
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accentColor,
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}60`;
                (e.currentTarget as HTMLButtonElement).style.background = `hsla(214,12%,14%,1)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}30`;
                (e.currentTarget as HTMLButtonElement).style.background = `hsla(214,12%,12%,1)`;
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
                background: "hsla(214,12%,12%,1)",
                border: "1px solid hsla(0,0%,100%,0.10)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "hsl(214,7%,52%)",
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
              fontFamily: "var(--font-mono)",
              fontSize: "0.5625rem",
              color: "hsl(214,7%,38%)",
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
