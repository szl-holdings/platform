/**
 * Unified-philosophy adapter — wires the 40 new primitives
 * (Blanca, Oppenheimer, Socrates, Lara, Newton, Emerald, Jung,
 * Theosophy, Trithemius, Da Vinci) into a single per-action gate
 * usable by A11oy fleets, Sentra governance, and Amaru coordination.
 *
 * The gate runs the cheapest checks first and short-circuits on the
 * first hard veto. Output is a single PhilosophyVerdict that
 * downstream products can map to PROCEED / QUARANTINE / ABORT.
 */

import { sealEnvelope, verifySeal } from "@workspace/ouroboros-emerald";
import { ShadowRegistry } from "@workspace/ouroboros-jung";
import { triangulate } from "@workspace/ouroboros-theosophy";
import { auditKeySeparation, checkPolygraphic } from "@workspace/ouroboros-trithemius";
import { verifyPhi } from "@workspace/ouroboros-davinci";
import {
  evaluateTask,
  checkAuthority,
  type Task,
  type TaskContext,
  type AgentState,
  type ActionRequest,
} from "@workspace/ouroboros-anduril";
import {
  metabasisProhibition,
  hotiDiotiClassifier,
  pncBedrockAxiomGuard,
  type ProofPrinciple,
  type Syllogism,
  type PncAttempt,
} from "@workspace/ouroboros-aristotle";

export type PhilosophyAction = "PROCEED" | "QUARANTINE" | "ABORT";

export interface PhilosophyInput {
  payload: string;
  provenance: { author: string; timestamp: string; sourceUri: string };
  shadowAcknowledgements: { id: string; description: string; declaredAt: string }[];
  citations: { corpusId: string; reference: string }[];
  channelBindings: { asset: "key" | "carrier"; channelId: string }[];
  decodings: { systemId: string; decoded: string }[];
  goldenRatioClaim?: number; // optional φ verification
  // Optional Anduril axis — when provided, the gate also checks tasking
  // refusal conditions and autonomy authority. Either failure adds a soft
  // failure (QUARANTINE) — never a hard ABORT.
  andurilTask?: { task: Task; ctx: TaskContext };
  andurilAuthority?: { agent: AgentState; action: ActionRequest };
  // Optional Aristotle axes — proof-discipline gates. Each soft-failure
  // adds a QUARANTINE — never a hard ABORT — preserving the design
  // principle that philosophical layering is advisory, not punitive.
  aristotleMetabasis?: {
    targetGenus: string;
    principles: ProofPrinciple[];
    subalternateAncestors?: string[];
  };
  aristotleHotiDioti?: Syllogism;
  aristotlePnc?: PncAttempt;
}

export interface PhilosophyVerdict {
  action: PhilosophyAction;
  failed: string[];
  passed: string[];
  rationale: string;
}

export function runPhilosophyGate(input: PhilosophyInput): PhilosophyVerdict {
  const failed: string[] = [];
  const passed: string[] = [];

  // Hermetic seal — ABORT on tamper
  const env = sealEnvelope(input.payload, input.provenance);
  if (!verifySeal(env).valid) failed.push("emerald.hermetic-seal");
  else passed.push("emerald.hermetic-seal");

  // Shadow registry — QUARANTINE if any unacknowledged shadows
  const reg = new ShadowRegistry();
  for (const s of input.shadowAcknowledgements) {
    reg.declare({ id: s.id, description: s.description, declaredAt: s.declaredAt });
    reg.acknowledge(s.id);
  }
  if (input.shadowAcknowledgements.length > 0 && !reg.isIntegrated()) {
    failed.push("jung.shadow-registry");
  } else {
    passed.push("jung.shadow-registry");
  }

  // Triangulation — QUARANTINE if under 3 distinct corpora
  if (!triangulate(input.citations).passes) failed.push("theosophy.triangulation");
  else passed.push("theosophy.triangulation");

  // Key/carrier separation — ABORT if overlap
  if (!auditKeySeparation(input.channelBindings).passes)
    failed.push("trithemius.key-separation");
  else passed.push("trithemius.key-separation");

  // Polygraphic redundancy — QUARANTINE if no quorum
  if (!checkPolygraphic(input.decodings).passes)
    failed.push("trithemius.polygraphic");
  else passed.push("trithemius.polygraphic");

  // Optional φ check — non-fatal tag
  if (typeof input.goldenRatioClaim === "number") {
    const v = verifyPhi(input.goldenRatioClaim);
    if (v.verdict === "none") failed.push("davinci.divine-proportion");
    else passed.push("davinci.divine-proportion");
  }

  // Optional Anduril axis — tasking refusal
  if (input.andurilTask) {
    const acc = evaluateTask(input.andurilTask.task, input.andurilTask.ctx);
    if (!acc.accepted) failed.push("anduril.tasking-refusal");
    else passed.push("anduril.tasking-refusal");
  }

  // Optional Anduril axis — autonomy authority
  if (input.andurilAuthority) {
    const verdict = checkAuthority(
      input.andurilAuthority.action,
      input.andurilAuthority.agent
    );
    if (!verdict.permitted) failed.push("anduril.authority");
    else passed.push("anduril.authority");
  }

  // Optional Aristotle axis — metabasis prohibition (84)
  if (input.aristotleMetabasis) {
    const r = metabasisProhibition({
      claimId: "unified-gate",
      targetGenus: input.aristotleMetabasis.targetGenus,
      principles: input.aristotleMetabasis.principles,
      subalternateAncestors: input.aristotleMetabasis.subalternateAncestors,
    });
    if (!r.ok) failed.push("aristotle.metabasis");
    else passed.push("aristotle.metabasis");
  }

  // Optional Aristotle axis — hoti/dioti causal ordering (86)
  if (input.aristotleHotiDioti) {
    const r = hotiDiotiClassifier(input.aristotleHotiDioti);
    if (r.grade !== "dioti") failed.push("aristotle.hoti-dioti");
    else passed.push("aristotle.hoti-dioti");
  }

  // Optional Aristotle axis — PNC bedrock guard (91) — HARD VETO
  if (input.aristotlePnc) {
    const r = pncBedrockAxiomGuard(input.aristotlePnc);
    if (!r.ok) failed.push("aristotle.pnc");
    else passed.push("aristotle.pnc");
  }

  const hardVetoes = new Set([
    "emerald.hermetic-seal",
    "trithemius.key-separation",
    "aristotle.pnc",
  ]);
  const hasHardVeto = failed.some((f) => hardVetoes.has(f));

  const action: PhilosophyAction =
    hasHardVeto ? "ABORT" : failed.length > 0 ? "QUARANTINE" : "PROCEED";

  return {
    action,
    failed,
    passed,
    rationale:
      action === "PROCEED"
        ? "all philosophy gates passed"
        : action === "ABORT"
        ? `hard veto: ${failed.filter((f) => hardVetoes.has(f)).join(", ")}`
        : `soft failures: ${failed.join(", ")}`,
  };
}
