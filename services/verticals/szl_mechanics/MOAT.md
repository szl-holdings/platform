# SZL Mechanics — Receipt-Verified Solid-Mechanics Solver (FE-NO)

> Verified-Scientific-Compute vertical. SZL now has a **sovereign,
> geometry-flexible, RECEIPT-VERIFIED solid-mechanics solver**. The moat is not
> "fast compute" — it is **provable compute**: every solve emits a DSSE-style
> in-toto provenance statement carrying a bounded-error *estimate* and a
> runtime verified flag, ready for signing on the szl_lake / khipu DSSE path.

## What this is

A clean-room **Finite-Element / Neural-Operator (FE-NO)** solver wrapped as
both an Alloy Meridian substrate vertical pack *and* a verified-compute service:

```
solve(geometry, bcs, sovereign=False, with_envelope=False)
    -> {"solution": <summary>, "receipt": <in-toto statement>,
        "dsse_envelope": <unsigned envelope, optional>}
```

It couples a classical **finite-element** subdomain to a physics-informed
**Point-DeepONet** operator surrogate across a **non-overlapping** domain
partition, exchanging traction → displacement (Neumann-Dirichlet) at the
interface. This closes a genuine estate gap: finite-element (148 hits) and
neural-operator (31 hits) adjacency existed, but **DeepONet = 0 hits**.

## Why it is a moat (verified-scientific-compute)

Competitors sell FLOPs. SZL sells **attestable** FLOPs. Each solve produces an
in-toto Statement v1 whose predicate records *how* the physics was computed:

| predicate field | meaning |
|---|---|
| `method` | `FE-NO clean-room (non-overlapping Schwarz, Neumann-Dirichlet)` |
| `geometry_hash` | sha256 of the canonical geometry (content-addresses the solve) |
| `inputs_hash` | sha256 of problem + solver settings (from the core) |
| `schwarz_iterations` | inner Schwarz iterations to convergence (`j_cv`) |
| `converged` | whether the Schwarz loop met the termination criterion |
| `interface_residual` | `‖Δu‖_L2` vs tolerance ε (paper Eq. 27 termination test) |
| `bounded_error_estimate` (+`bounded_error_label: ESTIMATE`) | relative-L2 NO-subdomain error **ESTIMATE** |
| `walltime_s` | measured solve wall time |
| `verified` | `(converged) AND (error ESTIMATE ≤ tol)` — a **runtime** check |
| `sovereign` | own-metal execution intent |
| `attribution` | arXiv:2606.08796 + DeepONet (Lu et al. 2021) — cite-never-plagiarize |

The same envelope shape the a11oy verify-api / szl_lake DSSE path already speaks
(`_type: https://in-toto.io/Statement/v1`, `predicateType:
https://szlholdings.com/attestations/scientific-compute/v1`, `subject[].digest.sha256`).

## Where signing happens (honest, unsigned here)

**This module never fabricates a signature.** `receipt.build_statement` emits the
honest **unsigned** in-toto statement; `receipt.build_dsse_envelope` emits the
unsigned DSSE envelope skeleton (`signatures: []`). Signing is on the
szl_lake / khipu path:

```
canonicalise statement
  -> PAE(payloadType, payload)                         (receipt.pae)
  -> Ed25519 sign on the szl_lake signer               (NOT in this module)
  -> append signature to DSSE envelope signatures[]
  -> append receipt to the khipu append-only chain     (packages/formula-os khipu.py)
```

Verify yourself: `POST https://a11oy.net/api/a11oy/v1/verify`. An **unsigned**
statement is **STRUCTURAL-ONLY** there — never a false "verified/green".

## Endpoint

```
POST /mechanics/solve   {"geometry": {...}, "bcs": {...},
                         "sovereign": false, "with_envelope": false}
   -> {"solution_summary": {...}, "receipt": <in-toto>, "dsse_envelope": <unsigned, opt>}
GET  /mechanics/healthz
```
Mount from the verticals service:
`app.include_router(services.verticals.szl_mechanics.api.router)`.

## How it monetizes the sovereign GPU fabric (all $/credit = ESTIMATE)

SZL's stranded/wasted-energy sovereign GPU fabric is sold as a verified-compute
marketplace. This solver lets that fabric sell **provable** scientific compute:

- **+25% verified-compute premium ESTIMATE** over commodity FLOPs, attributable
  to the DSSE receipt + bounded-error certificate (cf.
  `apps/agentic-gpu/compute_marketplace_agent.py`).
- **Settle-to-count:** a dollar is real only once a rental SETTLES;
  `settled_usd_to_date = 0.0` until then. All projections are labelled
  **ESTIMATE**. No fabricated listings, rentals, or settled dollars.
- **Energy-gated:** solves are biased to cheap/negative grid-price windows;
  joules are **MEASURED** (NVML) or labelled **SAMPLE** — never estimated into a
  receipt. **No free-energy / over-unity** framing.
- **Sovereign = own-metal only:** `sovereign=true` solves run on SZL hardware;
  this layer records intent, the `apps/agentic-gpu` scheduler enforces placement.

## Doctrine v11 (LOCKED) posture

- **Λ = Conjecture 1** — the per-solve trust/error signal is **advisory**, never
  "proven trust", never a theorem.
- **locked-proven = 8** — a solve certificate is a *runtime* check, NOT one of
  the locked-proven results.
- **Khipu BFT = Conjecture 2** — multi-witness solve agreement is *proposed*, not
  a proven BFT guarantee.
- **SLSA L1 honest** — receipts attest provenance at L1.
- **Bounded across tested horizons**, never "guaranteed bounded". An a-priori
  FE-NO Schwarz convergence theorem is **OPEN**.
- **Cite-never-plagiarize** — clean-room from the published method, attributed;
  no author code, no verbatim paper text (none was copied).

## Attribution (clean-room)

- **FE-NO method:** Wang, Gupta, Ruan, Goswami, *"A Non-Overlapping Schwarz
  Hybrid Finite Element-Neural Operator Framework for Solid Mechanics on
  Irregular Domains"*, arXiv:2606.08796 (2026), CC BY 4.0,
  doi:10.48550/arXiv.2606.08796 — https://arxiv.org/abs/2606.08796 (method only).
- **DeepONet:** Lu, Jin, Pang, Zhang, Karniadakis, *"Learning nonlinear operators
  via DeepONet…"*, Nature Machine Intelligence 3:218-229 (2021),
  doi:10.1038/s42256-021-00302-5 — https://www.nature.com/articles/s42256-021-00302-5.

## Status

- Service + receipt + endpoint + registration: **wired and tested** (4/4
  `meridian:check`, full `verticals:validate`).
- Core: **stub** until Dev 1's clean-room core is vendored into `_vendor/`
  (`szl_feno_core.py`, `szl_point_deeponet.py`, `szl_feno_validate.py`). The
  stub reports `verified=False, stub=True` — never mistakable for a real solve.
  `core_adapter` already matches Dev 1's real `solve_feno(...)` interface, so
  vendoring is a drop-in.
