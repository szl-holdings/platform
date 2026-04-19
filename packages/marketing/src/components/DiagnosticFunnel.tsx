import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, ArrowLeft, AlertTriangle, TrendingUp, Zap } from "lucide-react";

const BG = "hsl(214,16%,4%)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const BORDER = "hsla(0,0%,100%,0.07)";
const TEXT = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";

export interface FunnelQuestion {
  id: string;
  label: string;
  description?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    score: number;
  }>;
}

export interface DiagnosticResult {
  minScore: number;
  maxScore: number;
  label: string;
  description: string;
  severity: "critical" | "moderate" | "ready";
  ctaLabel: string;
  ctaHref?: string;
}

export interface DiagnosticFunnelProps {
  headline?: string;
  subheadline?: string;
  questions: FunnelQuestion[];
  results: DiagnosticResult[];
  accentColor?: string;
  site?: string;
  onStepComplete?: (step: number, stepLabel: string, answer: string, score: number) => void;
  onComplete?: (score: number, resultLabel: string, answers: Record<string, string>) => void;
  onDemoRequest?: (score: number, resultLabel: string) => void;
}

const SEVERITY_STYLES = {
  critical: { color: "hsl(0,84%,60%)", icon: AlertTriangle, bg: "hsla(0,84%,60%,0.08)" },
  moderate: { color: "hsl(45,90%,55%)", icon: TrendingUp, bg: "hsla(45,90%,55%,0.08)" },
  ready: { color: "hsl(152,70%,50%)", icon: Zap, bg: "hsla(152,70%,50%,0.08)" },
};

export function DiagnosticFunnel({
  headline = "Is your organization ready for governed AI decision-making?",
  subheadline = "Answer four questions to get an instant readiness score.",
  questions,
  results,
  accentColor = "hsl(191,92%,44%)",
  onStepComplete,
  onComplete,
  onDemoRequest,
}: DiagnosticFunnelProps) {
  const [step, setStep] = useState<"intro" | number | "result">("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const ref = useRef<HTMLDivElement>(null);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxPossible = questions.reduce((a, q) => a + Math.max(...q.options.map((o) => o.score)), 0);
  const pct = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  const result = results.find((r) => {
    const scaledMin = Math.round((r.minScore / 100) * maxPossible);
    const scaledMax = Math.round((r.maxScore / 100) * maxPossible);
    return totalScore >= scaledMin && totalScore <= scaledMax;
  }) ?? results[results.length - 1];

  const handleStart = () => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStep(0);
  };

  const handleAnswer = (q: FunnelQuestion, optionValue: string, optionScore: number) => {
    const newAnswers = { ...answers, [q.id]: optionValue };
    const newScores = { ...scores, [q.id]: optionScore };
    setAnswers(newAnswers);
    setScores(newScores);
    onStepComplete?.((step as number) + 1, q.label, optionValue, optionScore);

    const nextStep = (step as number) + 1;
    if (nextStep >= questions.length) {
      const finalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
      const finalResult = results.find((r) => {
        const scaledMin = Math.round((r.minScore / 100) * maxPossible);
        const scaledMax = Math.round((r.maxScore / 100) * maxPossible);
        return finalScore >= scaledMin && finalScore <= scaledMax;
      }) ?? results[results.length - 1];
      onComplete?.(finalScore, finalResult?.label ?? "", newAnswers);
      setStep("result");
    } else {
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    if (step === "result") {
      setStep(questions.length - 1);
    } else if (typeof step === "number" && step > 0) {
      setStep(step - 1);
    } else {
      setStep("intro");
    }
  };

  const currentQ = typeof step === "number" ? questions[step] : null;

  return (
    <section ref={ref} style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: accentColor }}>
            Readiness Assessment
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT }}>
            {headline}
          </h2>
          <p className="text-base" style={{ color: TEXT_SEC }}>
            {subheadline}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex justify-center gap-2 mb-6">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full flex-1"
                    style={{ background: BORDER, maxWidth: 48 }}
                  />
                ))}
              </div>
              <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>
                {questions.length} questions · ~2 minutes · Instant result
              </p>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: accentColor, color: BG }}
              >
                Start Assessment
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {typeof step === "number" && currentQ && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="rounded-2xl p-8"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-3 mb-6">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: TEXT_SEC }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex gap-1.5 flex-1">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full flex-1 transition-all duration-300"
                      style={{
                        background: i <= step ? accentColor : BORDER,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: TEXT_SEC }}>
                  {step + 1}/{questions.length}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ color: TEXT }}>
                {currentQ.label}
              </h3>
              {currentQ.description && (
                <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>
                  {currentQ.description}
                </p>
              )}

              <div className="flex flex-col gap-3 mt-6">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(currentQ, opt.value, opt.score)}
                    className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-150 hover:bg-white/5 border group"
                    style={{
                      border: `1px solid ${answers[currentQ.id] === opt.value ? `${accentColor}50` : BORDER}`,
                      background:
                        answers[currentQ.id] === opt.value ? `${accentColor}08` : "transparent",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-all"
                      style={{
                        borderColor:
                          answers[currentQ.id] === opt.value ? accentColor : `${TEXT_SEC}60`,
                        background:
                          answers[currentQ.id] === opt.value ? accentColor : "transparent",
                      }}
                    >
                      {answers[currentQ.id] === opt.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: TEXT }}>
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "result" && result && (
            <ResultCard
              result={result}
              score={pct}
              accentColor={accentColor}
              onBack={handleBack}
              onRetake={() => {
                setAnswers({});
                setScores({});
                setStep("intro");
              }}
              onDemoRequest={() => onDemoRequest?.(totalScore, result.label)}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ResultCard({
  result,
  score,
  accentColor,
  onBack,
  onRetake,
  onDemoRequest,
}: {
  result: DiagnosticResult;
  score: number;
  accentColor: string;
  onBack: () => void;
  onRetake: () => void;
  onDemoRequest: () => void;
}) {
  const styles = SEVERITY_STYLES[result.severity];
  const SevIcon = styles.icon;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.32 }}
      className="rounded-2xl p-8"
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: TEXT_SEC }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
          Your Result
        </span>
      </div>

      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-6"
        style={{ background: styles.bg, border: `1px solid ${styles.color}30` }}
      >
        <SevIcon className="w-6 h-6 shrink-0" style={{ color: styles.color }} />
        <div>
          <p className="text-base font-bold" style={{ color: styles.color }}>
            {result.label}
          </p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-2xl font-bold font-mono" style={{ color: styles.color }}>
            {score}
          </span>
          <span className="text-xs ml-0.5" style={{ color: styles.color }}>
            /100
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
        {result.description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {result.ctaHref ? (
          <a
            href={result.ctaHref}
            onClick={onDemoRequest}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: accentColor, color: BG }}
          >
            {result.ctaLabel}
            <ChevronRight className="w-4 h-4" />
          </a>
        ) : (
          <button
            onClick={onDemoRequest}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: accentColor, color: BG }}
          >
            {result.ctaLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onRetake}
          className="px-5 py-3 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
          style={{ borderColor: BORDER, color: TEXT_SEC }}
        >
          Retake Assessment
        </button>
      </div>
    </motion.div>
  );
}
