// ROSIE.UDS — pure-ESM governed-decision-fabric kernel.
// No runtime dependencies. All formulas implemented from primary doctrine.
// This file IS the operational core that ships inside the signed Zarf payload.
//
// ROSIE invariants enforced here:
//   1. Policy admission gate (deny-by-default, explicit ALLOW reasons)
//   2. Contradiction detector (deontic conflict over policy set)
//   3. Governed action emit (every decision carries a witness)
//   4. Hash-chained decision receipts (sha256 chain over decisions)
//   5. Coverage witness (every (subject, action) pair must hit a policy)

import { createHash } from "node:crypto";

// ───────────────────────────────────────────────────────────────────────────
// 1.  Policy admission gate — deny-by-default.
//     A policy is { id, subject, action, effect: 'allow' | 'deny', reason }.
//     admit() returns the matching policy (or a synthetic DENY) for an event.
// ───────────────────────────────────────────────────────────────────────────
export function admit(event, policies) {
  if (!event || typeof event !== "object") {
    throw new TypeError("admit: event must be an object");
  }
  for (const p of policies) {
    if (p.subject === event.subject && p.action === event.action) {
      return { ...p, matched: true };
    }
  }
  return {
    id: "synthetic:deny-by-default",
    subject: event.subject,
    action: event.action,
    effect: "deny",
    reason: "ROSIE_NO_POLICY_MATCH: deny-by-default",
    matched: false,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 2.  Contradiction detector.
//     For any (subject, action) covered by both an ALLOW and a DENY policy,
//     emit a contradiction record. The fabric MUST refuse to ship a policy
//     set that contains contradictions.
// ───────────────────────────────────────────────────────────────────────────
export function detectContradictions(policies) {
  const buckets = new Map();
  for (const p of policies) {
    const k = `${p.subject}\u0000${p.action}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(p);
  }
  const out = [];
  for (const [k, ps] of buckets) {
    const hasAllow = ps.some((p) => p.effect === "allow");
    const hasDeny = ps.some((p) => p.effect === "deny");
    if (hasAllow && hasDeny) {
      const [subject, action] = k.split("\u0000");
      out.push({ subject, action, policies: ps.map((p) => p.id) });
    }
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────────
// 3.  Governed action emit — wraps the decision with its witness so an
//     operator can audit not just WHAT was decided but WHY.
// ───────────────────────────────────────────────────────────────────────────
export function emit(event, policies) {
  const decision = admit(event, policies);
  return {
    ts: new Date().toISOString(),
    event,
    decision: decision.effect,
    witness: {
      policy_id: decision.id,
      reason: decision.reason,
      matched: decision.matched,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 4.  Hash-chained decision receipts.
//     Each receipt commits to the previous receipt's sha256 so any in-flight
//     tampering breaks the chain. Returns { head, links } where head is the
//     sha256 of the last link.
// ───────────────────────────────────────────────────────────────────────────
export function chainReceipts(decisions) {
  let prev = "0".repeat(64);
  const links = [];
  for (const d of decisions) {
    const payload = JSON.stringify({ prev, d });
    const sha = createHash("sha256").update(payload).digest("hex");
    links.push({ prev, sha, decision: d });
    prev = sha;
  }
  return { head: prev, links };
}

export function verifyChain({ head, links }) {
  let prev = "0".repeat(64);
  for (const l of links) {
    if (l.prev !== prev) return false;
    const sha = createHash("sha256")
      .update(JSON.stringify({ prev, d: l.decision }))
      .digest("hex");
    if (sha !== l.sha) return false;
    prev = sha;
  }
  return prev === head;
}

// ───────────────────────────────────────────────────────────────────────────
// 5.  Coverage witness — proves every (subject, action) seen in `events` is
//     either covered by an explicit policy or knowingly falls through to the
//     deny-by-default branch. An operator who wants strict coverage rejects
//     any non-empty `uncovered` list.
// ───────────────────────────────────────────────────────────────────────────
export function coverage(events, policies) {
  const covered = new Set(
    policies.map((p) => `${p.subject}\u0000${p.action}`),
  );
  const uncovered = [];
  for (const e of events) {
    const k = `${e.subject}\u0000${e.action}`;
    if (!covered.has(k)) uncovered.push(e);
  }
  return { total: events.length, uncovered };
}
