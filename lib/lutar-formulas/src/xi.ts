/**
 * Ξ (Xi) — Chat Unification Invariant, from
 * `papers/paper-10-ultra-routing-xi-unification.tex` and the A11oy Chat
 * Ultra payload.
 *
 *     Ξ = L_Ω · P_Λ · σ(Ā_lang) · 1 / (1 + H_dialog)
 *
 *   L_Ω        — operational omega score from `omega.ts`
 *   P_Λ        — propeller drive from `propeller.ts`
 *   σ(Ā_lang)  — sigmoid of the mean language-arbitrage score (a global
 *                "infrastructure tailwind" multiplier)
 *   H_dialog   — Shannon entropy of the recent dialogue (penalises
 *                runaway novelty)
 *
 * Ξ is the single number a router maximises across model choices. It
 * couples model fitness, drive efficiency, infra arbitrage, and
 * conversational coherence into one routing knob.
 */

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
}

export function dialogEntropy(history: readonly ChatTurn[]): number {
  if (!history.length) return 0;
  const tokens: string[] = [];
  for (const m of history.slice(-8)) {
    const words = (m.content ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    tokens.push(...words.slice(0, 30));
  }
  if (!tokens.length) return 0;
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const n = tokens.length;
  let h = 0;
  for (const c of freq.values()) {
    const p = c / n;
    h -= p * Math.log(p + 1e-9);
  }
  return h;
}

export function sigmoid(x: number): number {
  const clipped = Math.max(-50, Math.min(50, x));
  return 1 / (1 + Math.exp(-clipped));
}

export interface XiInputs {
  lOmega: number;
  pLambda: number;
  meanALang: number;
  history?: readonly ChatTurn[];
}

export interface XiReport {
  xi: number;
  lOmega: number;
  pLambda: number;
  arbitrageMultiplier: number;
  dialogEntropy: number;
  turnWeight: number;
  formula: string;
}

export function xi(inputs: XiInputs): XiReport {
  const h = dialogEntropy(inputs.history ?? []);
  const turnWeight = 1 / (1 + h);
  const arbMult = sigmoid(inputs.meanALang);
  const value =
    inputs.lOmega * Math.max(inputs.pLambda, 1e-3) * arbMult * turnWeight;
  return {
    xi: Math.round(value * 1e4) / 1e4,
    lOmega: inputs.lOmega,
    pLambda: inputs.pLambda,
    arbitrageMultiplier: arbMult,
    dialogEntropy: h,
    turnWeight,
    formula: 'Ξ = L_Ω · P_Λ · σ(Ā_lang) · 1/(1 + H_dialog)',
  };
}
