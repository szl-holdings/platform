# Sentra Integration

Sentra is the policy engine. Today it evaluates rules against agent
actions: allow, deny, transform, log. Horizon turns Sentra into an
information-theoretic firewall.

---

## What changes

Before Horizon:
- Policies are predicate-based: `if action.kind == X then deny`.
- Sentra cannot detect silent failures (loops that completed but left
  state un-reconciled). It only sees explicit actions.
- "The agent claimed it did X" and "the system observed X" collapse to
  one event.

After Horizon:
- Policies can reference Page-curve cleanliness, no-hair tier transitions,
  capacity-horizon margins, and entanglement-graph properties.
- Dirty-close detection becomes a first-class deny rule.
- Agent self-reports are validated against external observation; mismatch
  triggers a hard deny.

---

## New policy primitives

```ts
// Reject loop close when residual entanglement entropy stays above ε.
policy("information.preservation", {
  check: (ctx) => ctx.horizon.pageCurve?.clean === true,
  on_fail: "deny",
  reason: "dirty close: residual entropy {residualEntropy} > ε={epsilon}",
});

// Reject any handoff where the receiver's tier is laxer than the sender's.
policy("tier.monotone", {
  check: (ctx) => ctx.horizon.noHair.tier <= ctx.parent.horizon.noHair.tier,
  on_fail: "deny",
  reason: "tier escalation forbidden ({parent.tier} -> {tier})",
});

// Reject a handoff when the dual-witness audit failed.
policy("witness.complementarity", {
  check: (ctx) => ctx.horizon.dualWitness.consistent === true,
  on_fail: "deny",
  reason: "complementarity violation: {orphans} orphaned internal claims",
});

// Reject a fan-out that creates a forbidden coupling.
policy("topology.decoupling", {
  check: (ctx) => !ctx.horizon.entanglement.violatesDecoupled(ctx.targets),
  on_fail: "deny",
  reason: "decoupling violation between {pair[0]} and {pair[1]}: {bits} bits",
});

// Throttle when above capacity horizon.
policy("capacity.respect", {
  check: (ctx) => ctx.horizon.capacity.recommendation !== "SPLIT" || ctx.split === true,
  on_fail: "transform.split",
  reason: "loop above capacity horizon; auto-splitting",
});
```

---

## Why this matters

The current Sentra catches the loud failures: an agent calls a banned
tool, an agent emits PII. It does not catch the quiet ones: an agent
that calls the right tool but never reconciles the resulting state, an
agent that hands off to a less-trusted tier without realizing it, two
agents that secretly share state through a side channel.

Page-curve cleanliness, tier-monotone handoffs, and decoupling-violation
detection are exactly those quiet-failure detectors. They are mathematical
invariants, not heuristics. A Sentra policy referencing them either
holds or doesn't — there is nothing to argue about.

---

## Drop-in code

```ts
import { sentra } from "@szl-holdings/sentra";
import "@workspace/horizon"; // ensure types loaded

sentra.registerPolicy({
  id: "horizon.page_curve.clean",
  scope: "loop.close",
  evaluate: (ctx) =>
    ctx.horizon.pageCurve.clean
      ? sentra.allow()
      : sentra.deny(`dirty close: residual=${ctx.horizon.pageCurve.residualEntropy}`),
});

sentra.registerPolicy({
  id: "horizon.dual_witness.consistent",
  scope: "loop.close",
  evaluate: (ctx) =>
    ctx.horizon.dualWitness.consistent
      ? sentra.allow()
      : sentra.deny("complementarity violation"),
});
```

---

## What NOT to do

The black-hole physics literature contains an unwanted artifact: the
**firewall** (AMPS 2013). A firewall is a contradiction at the horizon —
unitarity vs equivalence-principle tension. Do not import it. There is
no operational analog we want; the physics tension is a sign the
classical picture is incomplete, not a feature to emulate. If you find
yourself building "Sentra firewalls," step back and ask which primitive
you are actually trying to enforce.
