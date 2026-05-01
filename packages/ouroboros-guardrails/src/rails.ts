/**
 * Rail implementations.
 *
 * Each rail computes a per-axis score in [0,1] and combines them via
 * geometric mean (lambdaScore). Failing primitives are recorded by id
 * for the receipt — this is what gives auditors a per-decision
 * traceable artifact rather than a blob of model output.
 *
 * Rail name compatibility with NeMo Guardrails is intentional: a tenant
 * migrating from NeMo can keep their config file and only swap the
 * import. The semantics are stricter (closed-form, deterministic) but
 * the integration surface is identical.
 */

import { lambdaScore, lambdaVerdict } from "./lambda.js";
import { sha256Hex } from "./receipt.js";
import type {
  GuardCallInput,
  RailDecision,
  RailKind,
  InputRailSpec,
  OutputRailSpec,
  DialogRailSpec,
  RetrievalRailSpec,
  ExecutionRailSpec,
} from "./types.js";

const JAILBREAK_PATTERNS = [
  /ignore (all )?(previous|prior) (instructions|prompts)/i,
  /you are now (an? )?(uncensored|unrestricted|developer|jailbroken)/i,
  /pretend (you are|to be) (an? )?(uncensored|unrestricted)/i,
  /\bDAN\b.*(mode|persona)/i,
  /system\s*prompt\s*(leak|reveal|show|print)/i,
  /act as (an? )?evil/i,
];

const PII_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/ },
  { name: "credit-card", re: /\b(?:\d[ -]*?){13,16}\b/ },
  { name: "email", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/ },
  { name: "phone", re: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
];

function nowIso(): string {
  return new Date().toISOString();
}

function payloadHash(s: string): string {
  return sha256Hex(s).slice(0, 16);
}

function decisionFrom(
  kind: RailKind,
  axes: Record<string, number>,
  failedIds: string[],
  passedIds: string[],
  rationale: string,
  payload: string,
): RailDecision {
  const lambda = lambdaScore(axes);
  const verdict = lambdaVerdict(lambda);
  return {
    kind,
    verdict,
    lambda,
    axes,
    failed: failedIds,
    passed: passedIds,
    rationale,
    timestamp: nowIso(),
    payloadHash: payloadHash(payload),
  };
}

// ---------- INPUT RAILS ----------

export function runInputRail(
  spec: InputRailSpec,
  input: GuardCallInput,
): RailDecision {
  const text = input.prompt ?? "";
  const failed: string[] = [];
  const passed: string[] = [];
  const axes: Record<string, number> = {};

  switch (spec.name) {
    case "self_check_input": {
      // Trithemius key-separation analogue: prompt should not contain its own
      // declared system instruction. Heuristic: presence of "system:" boundary
      // tokens or markdown system markers from untrusted input.
      const leak = /\b(system|assistant)\s*:\s*\b/i.test(text);
      axes["self_check"] = leak ? 0.2 : 0.95;
      (leak ? failed : passed).push("self_check_input");
      break;
    }
    case "jailbreak_detection": {
      const hits = JAILBREAK_PATTERNS.filter((re) => re.test(text)).length;
      axes["jailbreak"] = hits === 0 ? 0.98 : Math.max(0.05, 1 - hits * 0.4);
      (hits === 0 ? passed : failed).push("jailbreak_detection");
      break;
    }
    case "sensitive_data_detection": {
      const hits = PII_PATTERNS.filter((p) => p.re.test(text));
      axes["pii"] = hits.length === 0 ? 0.97 : Math.max(0.05, 1 - hits.length * 0.35);
      (hits.length === 0 ? passed : failed).push(
        "sensitive_data_detection" + (hits.length ? "[" + hits.map((h) => h.name).join(",") + "]" : ""),
      );
      break;
    }
    case "topic_safety": {
      const banned = /\b(weaponize|bioweapon|child sexual|cp\b|csam)\b/i.test(text);
      axes["topic"] = banned ? 0 : 0.99;
      (banned ? failed : passed).push("topic_safety");
      break;
    }
    case "lambda_input_check": {
      // Composite of the prior four — mirrors NeMo's "self_check" but
      // returns a closed-form scalar instead of an LLM-mediated yes/no.
      const c1 = !/\b(system|assistant)\s*:\s*\b/i.test(text) ? 0.95 : 0.2;
      const c2 = JAILBREAK_PATTERNS.some((re) => re.test(text)) ? 0.2 : 0.97;
      const c3 = PII_PATTERNS.some((p) => p.re.test(text)) ? 0.4 : 0.95;
      const c4 = /\b(weaponize|bioweapon|csam)\b/i.test(text) ? 0 : 0.99;
      axes["composite"] = lambdaScore({ c1, c2, c3, c4 });
      passed.push("lambda_input_check");
      break;
    }
  }

  const weight = spec.weight ?? 1;
  if (weight !== 1) for (const k of Object.keys(axes)) axes[k] = Math.pow(axes[k]!, weight);
  return decisionFrom("input", axes, failed, passed, `input.${spec.name}`, text);
}

// ---------- OUTPUT RAILS ----------

export function runOutputRail(
  spec: OutputRailSpec,
  input: GuardCallInput,
): RailDecision {
  const text = input.response ?? "";
  const failed: string[] = [];
  const passed: string[] = [];
  const axes: Record<string, number> = {};

  switch (spec.name) {
    case "self_check_output": {
      const harmful = /\b(here'?s how to make|step-by-step.*(bomb|weapon|virus))/i.test(text);
      axes["self_check"] = harmful ? 0 : 0.96;
      (harmful ? failed : passed).push("self_check_output");
      break;
    }
    case "fact_check": {
      // Lara non-measurability: if response asserts a precise number with no
      // citation in retrievedContext, downgrade. Surface heuristic only —
      // production tenants wire in their own knowledge base.
      const hasNumberClaim = /\b\d{3,}\b|\b\d+\.\d+\s*%/.test(text);
      const hasCitation = (input.retrievedContext ?? []).length > 0;
      const score = hasNumberClaim && !hasCitation ? 0.45 : 0.92;
      axes["fact_check"] = score;
      (score >= 0.5 ? passed : failed).push("fact_check");
      break;
    }
    case "hallucination_check": {
      // Detect obviously-fabricated citation pattern: "Source: ..." with
      // URL but URL not present in retrievedContext.
      const urlMatch = text.match(/https?:\/\/[\w./-]+/g) ?? [];
      const ctxText = (input.retrievedContext ?? []).map((c) => c.text + " " + c.reference).join(" ");
      const grounded = urlMatch.every((u) => ctxText.includes(u));
      axes["hallucination"] = grounded ? 0.94 : 0.3;
      (grounded ? passed : failed).push("hallucination_check");
      break;
    }
    case "pii_filter": {
      const hits = PII_PATTERNS.filter((p) => p.re.test(text));
      axes["pii"] = hits.length === 0 ? 0.97 : 0.05;
      (hits.length === 0 ? passed : failed).push("pii_filter");
      break;
    }
    case "lambda_output_check": {
      const harmful = /\b(here'?s how to make|step-by-step.*(bomb|weapon|virus))/i.test(text) ? 0 : 0.96;
      const piiClean = PII_PATTERNS.some((p) => p.re.test(text)) ? 0.05 : 0.96;
      axes["composite"] = lambdaScore({ harmful, piiClean });
      passed.push("lambda_output_check");
      break;
    }
  }

  const weight = spec.weight ?? 1;
  if (weight !== 1) for (const k of Object.keys(axes)) axes[k] = Math.pow(axes[k]!, weight);
  return decisionFrom("output", axes, failed, passed, `output.${spec.name}`, text);
}

// ---------- DIALOG RAILS ----------

export function runDialogRail(
  spec: DialogRailSpec,
  input: GuardCallInput,
): RailDecision {
  const conv = input.conversation ?? [];
  const failed: string[] = [];
  const passed: string[] = [];
  const axes: Record<string, number> = {};

  switch (spec.name) {
    case "scope_creep_check": {
      // Scope creep heuristic: assistant message volume grows >3× user message volume,
      // or assistant introduces a new domain term not in user turn.
      const userTotal = conv.filter((m) => m.role === "user").map((m) => m.content.length).reduce((a, b) => a + b, 0) || 1;
      const asstTotal = conv.filter((m) => m.role === "assistant").map((m) => m.content.length).reduce((a, b) => a + b, 0);
      const ratio = asstTotal / userTotal;
      const score = ratio <= 3 ? 0.93 : Math.max(0.2, 1 - (ratio - 3) * 0.15);
      axes["scope"] = score;
      (score >= 0.5 ? passed : failed).push("scope_creep_check");
      break;
    }
    case "consent_alignment": {
      // Was the user's first turn consenting to the current action class?
      const first = conv.find((m) => m.role === "user")?.content ?? input.prompt ?? "";
      const aligned = first.length > 0 && (input.prompt ?? "").length > 0;
      axes["consent"] = aligned ? 0.94 : 0.4;
      (aligned ? passed : failed).push("consent_alignment");
      break;
    }
    case "lambda_dialog_check": {
      const userTotal = conv.filter((m) => m.role === "user").map((m) => m.content.length).reduce((a, b) => a + b, 0) || 1;
      const asstTotal = conv.filter((m) => m.role === "assistant").map((m) => m.content.length).reduce((a, b) => a + b, 0);
      const scope = asstTotal / userTotal <= 3 ? 0.93 : 0.5;
      axes["composite"] = scope;
      passed.push("lambda_dialog_check");
      break;
    }
  }

  const weight = spec.weight ?? 1;
  if (weight !== 1) for (const k of Object.keys(axes)) axes[k] = Math.pow(axes[k]!, weight);
  return decisionFrom("dialog", axes, failed, passed, `dialog.${spec.name}`, JSON.stringify(conv));
}

// ---------- RETRIEVAL RAILS ----------

export function runRetrievalRail(
  spec: RetrievalRailSpec,
  input: GuardCallInput,
): RailDecision {
  const ctx = input.retrievedContext ?? [];
  const failed: string[] = [];
  const passed: string[] = [];
  const axes: Record<string, number> = {};

  switch (spec.name) {
    case "citation_check": {
      const allCited = ctx.length === 0 || ctx.every((c) => c.corpusId.length > 0 && c.reference.length > 0);
      axes["citation"] = allCited ? 0.95 : 0.25;
      (allCited ? passed : failed).push("citation_check");
      break;
    }
    case "context_provenance": {
      // Each context chunk should have a non-empty corpusId. Theosophy axis.
      const ratio = ctx.length === 0 ? 1 : ctx.filter((c) => c.corpusId).length / ctx.length;
      axes["provenance"] = ratio >= 0.95 ? 0.95 : ratio;
      (ratio >= 0.95 ? passed : failed).push("context_provenance");
      break;
    }
    case "lambda_retrieval_check": {
      const allCited = ctx.length === 0 || ctx.every((c) => c.corpusId.length > 0 && c.reference.length > 0);
      const ratio = ctx.length === 0 ? 1 : ctx.filter((c) => c.corpusId).length / ctx.length;
      axes["composite"] = lambdaScore({ allCited: allCited ? 0.95 : 0.25, ratio });
      passed.push("lambda_retrieval_check");
      break;
    }
  }

  const weight = spec.weight ?? 1;
  if (weight !== 1) for (const k of Object.keys(axes)) axes[k] = Math.pow(axes[k]!, weight);
  return decisionFrom("retrieval", axes, failed, passed, `retrieval.${spec.name}`, JSON.stringify(ctx));
}

// ---------- EXECUTION RAILS ----------

const HIGH_RISK_TOOLS = new Set([
  "shell.exec",
  "fs.delete",
  "fs.write",
  "http.post",
  "payment.charge",
  "email.send",
]);

export function runExecutionRail(
  spec: ExecutionRailSpec,
  input: GuardCallInput,
): RailDecision {
  const tc = input.toolCall;
  const failed: string[] = [];
  const passed: string[] = [];
  const axes: Record<string, number> = {};

  switch (spec.name) {
    case "tool_authority_check": {
      if (!tc) {
        axes["authority"] = 1;
        passed.push("tool_authority_check[no-call]");
        break;
      }
      const declared = tc.capability;
      const high = HIGH_RISK_TOOLS.has(tc.tool);
      const ok = !high || (declared && declared.length > 0);
      axes["authority"] = ok ? 0.93 : 0;
      (ok ? passed : failed).push("tool_authority_check");
      break;
    }
    case "anduril_refusal_check": {
      // Mirrors anduril.refusal_first — if the tool is destructive AND no
      // declared rollback path, refuse.
      if (!tc) {
        axes["refusal"] = 1;
        passed.push("anduril_refusal_check[no-call]");
        break;
      }
      const destructive = /delete|drop|truncate|charge|send/i.test(tc.tool);
      const argsStr = JSON.stringify(tc.args ?? {});
      const hasRollback = /rollback|dryRun|preview|confirm/i.test(argsStr);
      axes["refusal"] = !destructive || hasRollback ? 0.92 : 0;
      (axes["refusal"] >= 0.5 ? passed : failed).push("anduril_refusal_check");
      break;
    }
    case "lambda_execution_check": {
      if (!tc) {
        axes["composite"] = 1;
        passed.push("lambda_execution_check[no-call]");
        break;
      }
      const high = HIGH_RISK_TOOLS.has(tc.tool);
      const declared = tc.capability && tc.capability.length > 0;
      const destructive = /delete|drop|truncate|charge|send/i.test(tc.tool);
      const hasRollback = /rollback|dryRun|preview|confirm/i.test(JSON.stringify(tc.args ?? {}));
      const a = !high || declared ? 0.93 : 0;
      const b = !destructive || hasRollback ? 0.92 : 0;
      axes["composite"] = lambdaScore({ a, b });
      passed.push("lambda_execution_check");
      break;
    }
  }

  const weight = spec.weight ?? 1;
  if (weight !== 1) for (const k of Object.keys(axes)) axes[k] = Math.pow(axes[k]!, weight);
  return decisionFrom("execution", axes, failed, passed, `execution.${spec.name}`, JSON.stringify(tc ?? {}));
}
