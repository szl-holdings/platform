export interface KernelCodex {
  role: string;
  contract: string;
  examples: Array<{ description: string; output: string }>;
}

export interface Kernel {
  name: string;
  version: string;
  pattern: string;
  codex: KernelCodex;
  inspirations?: string[];
}

const KERNELS: Record<string, Kernel> = {
  'deck-from-brief': {
    name: 'deck-from-brief',
    version: '1.2',
    pattern: 'brief → slide-pack',
    codex: {
      role:
        'Transform a concise strategic brief into a polished, investor-ready slide deck. Each slide must carry a single decisive claim, supported by evidence, with a clear visual hierarchy.',
      contract:
        'Input: brief object with title, thesis, sections[], audience. ' +
        'Output: SlidePacket with slides[], speaker_notes[], metadata. ' +
        'Invariants: ≤ 12 slides; every claim links to a source; no fabricated statistics.',
      examples: [
        {
          description: 'Series A investor deck from 3-sentence brief',
          output: `Brief: "We automate governed AI execution for enterprise ops teams."
→ Slide 1: The Problem — Manual oversight can't scale at AI speed
→ Slide 2: The Solution — NEXUS: Governed Agentic AI
→ Slide 3: How it Works — 4-step covenant cycle
→ Slide 4: Traction — [insert verified metrics here]
→ Slide 5: Ask — [insert funding ask and use of proceeds]`,
        },
      ],
    },
  },
};

export function getKernel(id: string): Kernel {
  const kernel = KERNELS[id];
  if (!kernel) {
    throw new Error(`[alloy-prompts] Unknown kernel id: "${id}"`);
  }
  return kernel;
}
