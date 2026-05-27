---
name: Ising synthesis 2026
description: Two architectural lessons from absorbing NVIDIA Ising — forgery-resistant escalation gates (and their honest boundary) and zero-safe divergence metrics.
---

# Lesson 1 — "Mandatory escalation" needs a sha256-backed body, not a string check

A cheap-fast→expensive-slow cascade can claim to escalate by checking
the supplied downstream ref has the right `<class>:` prefix. That check
is trivial to forge. To make escalation **forgery-resistant** the gate
must (a) require BOTH a ref and the body it claims to address, (b)
re-derive the digest from the body and verify it matches the ref, (c)
require the body to cite the parent cascade's residual digest so an
unrelated cascade's real receipt cannot be replayed.

**Honest boundary:** forgery-resistant ≠ authenticity-attested. A
caller with no real downstream stage can still mint a self-consistent
body+ref locally. Closing that gap needs a cosign / trusted-issuer
attestation on downstream-receipt bodies, which belongs in the audit
signing layer, not in the cascade kit itself. Doc this in the synthesis
document — do not overclaim "unbypassable."

**Why:** the earlier `startsWith` check was the primary blocker flagged
in architect review; it looks safe and isn't. **How to apply:** any
new SZL cascade or admission gate that takes a "downstream ref" should
require body + digest re-verification + parent-binding, never trust a
prefix string. And when the route forwards to the kit, the route MUST
also accept and forward the body — a route that takes the ref alone
makes the green path unreachable.

# Lesson 2 — Symmetric KL is the wrong divergence metric

Symmetric KL with an EPS floor on missing-mass keys is brittle: it
silently inflates divergence when supports are disjoint, and
adversarial inputs (explicit zero weights) can produce NaN that later
crashes a hashing call. Jensen-Shannon divergence is symmetric AND
zero-safe AND bounded in [0, ln 2] — so a tolerance of `0.05` has
stable semantics regardless of support disjointness.

**Why:** unbounded metrics make a fixed tolerance mean different
things at different support sizes; the caller cannot reason about it.
**How to apply:** for any drift / divergence / similarity gate in SZL,
default to JSD (or cosine over the simplex), never raw or EPS-floored
KL. Preserve the old name as an alias if anything imported it, so the
swap is a pure-additive change.
