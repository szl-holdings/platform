import { getConfidenceClass, getConfidenceLabel, type ConfidenceLevel } from "../lib/data";

interface Props {
  score: number;
  label?: ConfidenceLevel;
  showScore?: boolean;
  size?: "sm" | "md";
}

export default function ConfidenceChip({ score, label, showScore = true, size = "md" }: Props) {
  const lbl = label ?? getConfidenceLabel(score);
  const cls = getConfidenceClass(lbl);
  const fontSize = size === "sm" ? "0.62rem" : "0.68rem";

  return (
    <span className={`agent-badge ${cls}`} style={{ fontSize }}>
      <span style={{ fontWeight: 700 }}>
        {lbl === "HIGH" ? "HC" : lbl === "MODERATE" ? "MC" : lbl === "LOW" ? "LC" : "IE"}
      </span>
      {showScore && (
        <span style={{ opacity: 0.8 }}>·{Math.round(score * 100)}%</span>
      )}
    </span>
  );
}
