/**
 * Primitive 66 — Preserved-thinking ledger
 *
 * Inspired by GLM-4.7's "Preserved Thinking" and "Turn-level Thinking":
 * across multi-turn conversations, retain prior reasoning blocks so
 * later turns reuse them instead of re-deriving from scratch. Lifted:
 * reasoning blocks become receipted artifacts, indexed by claim and
 * turn, with explicit reuse-counts so we can audit which prior
 * reasoning a later claim actually depended on.
 */

export interface ThinkingBlock {
  blockId: string;
  turnIndex: number;
  claimId: string;
  reasoning: string;
  createdAtMs: number;
}

export interface PreservedLedger {
  blocks: ThinkingBlock[];
  reuseEdges: { fromBlock: string; intoTurn: number; intoClaim: string }[];
}

export function makeLedger(): PreservedLedger {
  return { blocks: [], reuseEdges: [] };
}

export function record(
  ledger: PreservedLedger,
  block: Omit<ThinkingBlock, "createdAtMs">
): PreservedLedger {
  if (ledger.blocks.some((b) => b.blockId === block.blockId)) {
    throw new Error(`duplicate blockId: ${block.blockId}`);
  }
  ledger.blocks.push({ ...block, createdAtMs: Date.now() });
  return ledger;
}

export function reuse(
  ledger: PreservedLedger,
  fromBlock: string,
  intoTurn: number,
  intoClaim: string
): PreservedLedger {
  if (!ledger.blocks.some((b) => b.blockId === fromBlock)) {
    throw new Error(`cannot reuse: block ${fromBlock} not in ledger`);
  }
  const src = ledger.blocks.find((b) => b.blockId === fromBlock)!;
  if (intoTurn < src.turnIndex) {
    throw new Error(`cannot reuse from future: block turn ${src.turnIndex} > intoTurn ${intoTurn}`);
  }
  ledger.reuseEdges.push({ fromBlock, intoTurn, intoClaim });
  return ledger;
}

export interface AncestryReceipt {
  claimId: string;
  ancestors: ThinkingBlock[];
  rationale: string;
}

export function ancestry(
  ledger: PreservedLedger,
  claimId: string
): AncestryReceipt {
  const edges = ledger.reuseEdges.filter((e) => e.intoClaim === claimId);
  const ids = new Set(edges.map((e) => e.fromBlock));
  const ancestors = ledger.blocks.filter((b) => ids.has(b.blockId));
  return {
    claimId,
    ancestors,
    rationale: ancestors.length === 0
      ? "claim has no preserved-thinking ancestors"
      : `claim depends on ${ancestors.length} preserved block(s)`,
  };
}
