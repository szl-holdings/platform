/**
 * Antivenom detector — `ts-antivenom/prompt-injection-shield` (#5503).
 *
 * The "antivenom" family recognises the *counter-pattern* of an attack
 * (the shape of the adversarial input itself) instead of waiting for
 * downstream damage. Distilled from AGI-stack synthesis §12.
 *
 * This canonical example flags prompt-injection / jailbreak payloads
 * being delivered to LLM-backed surfaces. It scans the candidate
 * `agent.inputs` stream (operator prompts, tool-call arguments, RAG
 * snippets) for known adversarial cues and emits one finding per input
 * whose composite venom-score exceeds the threshold.
 *
 * The detector is intentionally pattern-based, not ML — pattern-based
 * antivenom is cheap to audit and stable across model updates. ML-based
 * antivenom belongs in a sidecar (`runtime: 'python'`).
 *
 * Receipts: the Detector Council emits the `sentra.antivenom-match.v1`
 * receipt; this detector contributes its finding to the Council via the
 * normal pipeline (no separate chain).
 */
import type { Detector, Finding } from '@szl-holdings/sentra-detector-sdk';

interface AgentInputRow {
  inputId: string;
  agentId?: string;
  surface?: string;
  text: string;
  ts?: string;
}

/**
 * Antivenom signatures — each cue contributes a fixed venom-score. The
 * scores are intentionally small and additive so a single innocent
 * coincidence doesn't trip the detector but a layered jailbreak does.
 */
const CUES: Array<{ id: string; pattern: RegExp; score: number; technique?: string }> = [
  { id: 'ignore-prior', pattern: /\bignore\s+(all\s+)?(prior|previous|above)\s+(instructions|prompts|rules)\b/i, score: 0.45, technique: 'PI.001' },
  { id: 'system-role-claim', pattern: /\b(you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(an?\s+)?(unrestricted|jailbroken|dan|developer|root|admin)\b/i, score: 0.5, technique: 'PI.002' },
  { id: 'system-prompt-exfil', pattern: /\b(reveal|print|leak|show)\s+(your\s+)?(system\s+prompt|initial\s+instructions|hidden\s+instructions)\b/i, score: 0.6, technique: 'PI.003' },
  { id: 'role-injection', pattern: /\b<\|?\s*(system|assistant|user)\s*\|?>/i, score: 0.35, technique: 'PI.004' },
  { id: 'base64-payload', pattern: /\b[A-Za-z0-9+/]{120,}={0,2}\b/, score: 0.25, technique: 'PI.005' },
  { id: 'tool-call-injection', pattern: /\b(function\s*\(|invoke\s+tool|call_tool\s*\()\s*[a-zA-Z_]+/i, score: 0.3, technique: 'PI.006' },
  { id: 'override-policy', pattern: /\b(override|bypass|disable)\s+(safety|policy|guardrails?|filters?)\b/i, score: 0.5, technique: 'PI.007' },
  { id: 'data-exfil-ask', pattern: /\b(send|email|post|upload)\s+(.+)\s+to\s+(https?:\/\/|@|attacker)/i, score: 0.55, technique: 'PI.008' },
];

function severityFor(score: number): Finding['severity'] {
  if (score >= 0.9) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.45) return 'medium';
  if (score >= 0.25) return 'low';
  return 'info';
}

export const antivenomPromptInjectionDetector: Detector = {
  manifest: {
    id: 'ts-antivenom/prompt-injection-shield',
    label: 'Antivenom — Prompt Injection Shield',
    description:
      'Flags adversarial prompts targeting LLM-backed surfaces by matching layered injection / jailbreak / exfiltration cues against agent inputs. Pattern-based for auditability; ML-based antivenom belongs in a sidecar.',
    kind: 'antivenom',
    runtime: 'ts',
    inputs: ['agent.inputs'],
    costClass: 'cheap',
    governanceClass: 'mutating',
    attackTechniques: ['T1059', 'T1199'],
    version: '1.0.0',
  },
  async evaluate(ctx) {
    const threshold = Number(ctx.params.threshold ?? 0.45);
    const rows = ((await ctx.read('agent.inputs')) ?? []) as AgentInputRow[];
    ctx.trace('input.loaded', { rows: rows.length, threshold });

    const findings: Finding[] = [];
    let idx = 0;
    for (const r of rows) {
      if (!r?.text || typeof r.text !== 'string') continue;
      const matched: Array<{ id: string; technique?: string; score: number }> = [];
      let venom = 0;
      for (const cue of CUES) {
        if (cue.pattern.test(r.text)) {
          matched.push({ id: cue.id, technique: cue.technique, score: cue.score });
          venom += cue.score;
        }
      }
      const score = Math.min(1, venom);
      if (score < threshold) continue;
      const techniques = Array.from(
        new Set(matched.map((m) => m.technique).filter((t): t is string => Boolean(t))),
      );
      findings.push({
        id: `${ctx.detectorId}#${ctx.runId}#${idx++}`,
        detectorId: ctx.detectorId,
        runId: ctx.runId,
        severity: severityFor(score),
        score,
        title: `Adversarial input blocked (${matched.length} cues, venom=${score.toFixed(2)})`,
        summary: `Input ${r.inputId} on surface ${r.surface ?? 'unknown'} matched ${matched.map((m) => m.id).join(', ')}.`,
        attackTechniques: techniques.length > 0 ? techniques : ['T1059'],
        affectedAssets: [r.agentId ?? r.surface ?? r.inputId],
        evidence: {
          inputId: r.inputId,
          agentId: r.agentId,
          surface: r.surface,
          matchedCues: matched,
          venom,
          // Truncate stored sample so a malicious payload cannot bloat
          // the receipt body.
          textSample: r.text.slice(0, 240),
        },
        recommendedAction: {
          kind: 'block',
          detail: `Quarantine input ${r.inputId} and rate-limit ${r.agentId ?? 'caller'}; rotate any tool credentials this agent holds.`,
        },
        emittedAt: new Date().toISOString(),
        governanceClass: 'mutating',
      });
    }
    ctx.trace('finished', { findings: findings.length });
    return findings;
  },
};
