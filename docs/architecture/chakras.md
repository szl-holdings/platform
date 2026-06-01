# Chakra Spec — the 7-Kernel Wheel × 5 Flagships

**Owner:** Yachay `<yachay@szlholdings.dev>`
**Status:** LOCKED · Doctrine v11 (749 declarations · 14 unique axioms · 163 tracked sorries)
**Scope:** Architecture — defines the canonical kernel decomposition of every SZL flagship
("chakra") and the **Ouroboros loop** that threads through them.

---

## 0. On the word "chakra" (brand metaphor — NOT a mystical claim)

> **Explicit disclaimer.** "Chakra" here is a **brand/engineering metaphor**, nothing more.
> In SZL it means exactly: *a flagship organ modelled as a **wheel of kernels** (Sanskrit
> "chakra" = wheel) that a request rotates through.* It carries **no spiritual, esoteric,
> energetic, or medical meaning** and makes **no mystical claim** of any kind. Every kernel
> named below is a concrete software component backed by a real package, a real route, and
> (where stated) a Lean-checked invariant. If a number or behaviour is not yet live, it is
> labelled honestly — ZERO BANDAID.

The 5 chakras are the 5 flagships: **a11oy · amaru · sentra · rosie · killinchu**.

---

## 1. The wheel — 7 universal kernels per chakra

Every chakra is the **same wheel of 7 universal kernels**. This is what makes the mesh
uniform: any tool consumer talks to any chakra through the same 7-spoke contract.

| # | Kernel | What it does | Substrate package |
|---|--------|--------------|-------------------|
| 1 | **SIGN** | DSSE signing of any action (cosign / ECDSA; placeholder labelled honestly when no key) | `wire-d` |
| 2 | **GATE** | Yuyay-13 axis check — 13-axis `yuyay_v3` policy gate before any side effect | `puriq-os` |
| 3 | **CHAIN** | Khipu DAG append + Reed–Solomon RS(10,6) erasure coding of the cold set | `khipu-os` |
| 4 | **MEMORY** | Unay receipt-keyed recall (every memory is addressable by its receipt id) | `unay` |
| 5 | **REPLAY** | AYNI event-sourcing — the chain replays to the exact prior state | `ayni-os` |
| 6 | **MCP** | Tool-bus exposure — the chakra's actions surface as MCP tools | `hatun-mcp` |
| 7 | **WIRE** | Cross-organ W3C `traceparent` propagation (Wire D/E/F/G) | `wire-d` |

These 7 are non-negotiable and identical across all 5 chakras.

---

## 2. The 2 vertical kernels per chakra

On top of the shared wheel, each chakra adds **2 vertical-specific kernels** — its reason
to exist as a distinct product:

| Chakra | Vertical kernel A | Vertical kernel B |
|--------|-------------------|-------------------|
| **a11oy** | **ROUTE** — LLM router (model selection / cost-quality) | **ORCHESTRATE** — PURIQ-OS host |
| **killinchu** | **GEOFENCE** — geospatial boundary enforcement | **MISSION-PLAN** — mission/route planning |
| **rosie** | **AIDE** — personal assistant agent | **RECALL-PERSONAL** — personal-memory recall |
| **sentra** | **FILTER** — dual-use / content gate | **THREAT-SCORE** — immune-system threat scoring |
| **amaru** | **CORTEX-LEDGER** — memory-cortex ledger | **AXIS-TRACK** — yuyay axis tracking |

So:

```
9 kernels per chakra  =  7 universal  +  2 vertical
45 kernels total       =  9 × 5 chakras
```

This **45-kernel mesh** is the canonical count surfaced in the Mesh Cathedral.

---

## 3. The Ouroboros loop

The Ouroboros is the **universal path a request takes through any chakra**. It is a closed
loop: the output (a replayable, signed receipt) becomes the input substrate for the next
intent. The serpent eats its own tail — every action is recorded as a receipt, and that
receipt is what the next action reads.

```
intent
  → SIGN          (DSSE envelope over the proposed action)
  → GATE          (Yuyay-13 axis check)
  → (if pass) → ACTION
                  → CHAIN     (append signed receipt to Khipu DAG; RS(10,6) the cold set)
                  → MEMORY    (Unay indexes the receipt by id)
                  → REPLAY-AVAILABLE  (AYNI can now replay to this exact state)
                  → next intent  ⟲  (the loop closes — receipts feed the next request)
                       │
                       ├─ MCP   : the action is visible to any tool consumer on the bus
                       └─ WIRE  : traceparent propagates the span to sibling chakras
```

If **GATE** fails, the request is denied and a **denial receipt** is still chained — the loop
records refusals as faithfully as successes (auditability invariant).

### Loop step colour key (used by the Mesh Cathedral particle ring)

| Step | Marker colour |
|------|---------------|
| SIGN | `#7fe3ff` (cyan) |
| GATE | `#ffd23f` (amber) |
| CHAIN | `#d4a444` (gold) |
| MEMORY | `#9dff7f` (green) |
| REPLAY | `#ff7fd0` (magenta) |

---

## 4. Why uniformity matters

Because all 5 chakras share the same 7-spoke wheel and the same Ouroboros loop:

- **One audit story.** Every action on every chakra is a signed Khipu receipt. The chain
  *is* the audit log, the memory, and the replay state (see `mcp-database.md`).
- **One trust contract.** GATE (Yuyay-13) + SIGN (DSSE) are identical everywhere; a verifier
  written once verifies all five.
- **One tool bus.** MCP exposes every chakra's actions uniformly; `hatun-mcp` is the single
  front door.
- **One trace fabric.** WIRE propagates W3C `traceparent` so a request fanning out to
  siblings stays one distributed trace.

---

## 5. Live-status honesty (current reality, 2026-06-01)

Per ZERO BANDAID, the doctrine/version numbers actually surfaced by each chakra's health
endpoint differ today and are reported truthfully (not all carry the v11 triple yet):

| Chakra | `/healthz` reports | Notes |
|--------|--------------------|-------|
| rosie | v11 · 749/14/163 (in `/healthz` + `/api/rosie/v2/identity`) | full triple ✓ |
| amaru | v10 · 749/163 present | traceparent middleware LIVE |
| killinchu | v11 · 749/163 | full triple ✓ |
| a11oy | v9 · 456 decl / 6 sorries | health payload predates v11 bump |
| sentra | v0.2.0 · 8 gates · no doctrine numbers | gate count only |

The **governed artifact** (the Lean corpus) is Doctrine v11 LOCKED at **749 / 14 / 163**;
the health-payload drift above is a presentation gap tracked separately, not a doctrine
change.

---

*Signed — Yachay `<yachay@szlholdings.dev>` · SZL Holdings · Doctrine v11 LOCKED (749 declarations · 14 unique axioms · 163 tracked sorries) · yuyay_v3 13-axis*
