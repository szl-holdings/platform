/**
 * Antivenom Catalogue — attack/antidote pairs sourced from the
 * standardgalactic/antivenom synthesis (see docs/research/agi-stack-synthesis-2026.md §12).
 *
 * Every entry is `{ attack, antidote, severity, layer, mutationFamily }`.
 * Layers: `input`, `mid-decode`, `output`. Severity tiers map to the AMI v2
 * Adversarial Resistance penalty:
 *   low    → A *= 0.95
 *   medium → A *= 0.75
 *   high   → A *= 0.45
 *   critical → A  = 0.10 (hard floor; gate flips to BLOCK)
 *
 * Patterns are deliberately conservative and case-insensitive — false positives
 * are preferred over silent passes, because a match is *advisory* (it lowers the
 * AMI score) rather than a hard block. The Approvals Inbox is the human gate.
 */

export type AntivenomSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AntivenomLayer = 'input' | 'mid-decode' | 'output';

export interface AttackEntry {
  id: string;
  family: string;
  attackPattern: RegExp;
  antidote: string;
  severity: AntivenomSeverity;
  layer: AntivenomLayer;
  description: string;
}

export const ANTIVENOM_CATALOGUE: readonly AttackEntry[] = [
  {
    id: 'av-001',
    family: 'prompt-injection',
    attackPattern: /\bignore (all |any |previous )?(prior |above |earlier )?(instructions?|prompts?|rules?)\b/i,
    antidote: 'input.sanitize:strip-override',
    severity: 'high',
    layer: 'input',
    description: 'Classic override directive: "ignore all previous instructions".',
  },
  {
    id: 'av-002',
    family: 'prompt-injection',
    attackPattern: /\b(system|developer|root) (prompt|message|instructions?)\b/i,
    antidote: 'input.sanitize:strip-system-ref',
    severity: 'medium',
    layer: 'input',
    description: 'Reference to internal system/developer prompt — common reconnaissance.',
  },
  {
    id: 'av-003',
    family: 'jailbreak',
    attackPattern: /\b(DAN|do anything now|jailbreak|developer mode|godmode)\b/i,
    antidote: 'input.refuse:jailbreak-frame',
    severity: 'high',
    layer: 'input',
    description: 'Known jailbreak personas (DAN / developer-mode / godmode).',
  },
  {
    id: 'av-004',
    family: 'exfiltration',
    attackPattern: /\b(reveal|leak|print|dump|exfiltrate|show me) (your |the )?(system|hidden|secret|api[- ]?key|token|credentials?|env(ironment)?)\b/i,
    antidote: 'output.gate:redact-secrets',
    severity: 'critical',
    layer: 'output',
    description: 'Direct credential / secret exfiltration request.',
  },
  {
    id: 'av-005',
    family: 'role-confusion',
    attackPattern: /\b(pretend|act|roleplay) (as|to be) (an? )?(admin|root|sudo|operator|developer)\b/i,
    antidote: 'input.refuse:role-elevation',
    severity: 'medium',
    layer: 'input',
    description: 'Role elevation via roleplay framing.',
  },
  {
    id: 'av-006',
    family: 'poisoning',
    attackPattern: /\b(training data|fine[- ]?tune|reinforce) (this|that|the following|with)\b/i,
    antidote: 'input.flag:training-mutation',
    severity: 'low',
    layer: 'input',
    description: 'Attempt to mutate training / fine-tune state via runtime input.',
  },
  {
    id: 'av-007',
    family: 'prompt-injection',
    attackPattern: /<\|(im_start|im_end|system|user|assistant)\|>/i,
    antidote: 'input.sanitize:strip-chatml',
    severity: 'high',
    layer: 'input',
    description: 'Smuggled ChatML / Anthropic / OpenAI control tokens.',
  },
] as const;

export const SEVERITY_PENALTY: Record<AntivenomSeverity, number> = {
  low: 0.95,
  medium: 0.75,
  high: 0.45,
  critical: 0.10,
};
