# szl-mesh — Architecture

`szl-mesh` is the top-level UDS bundle that composes the three SZL
Zarf packages — `a11oy`, `sentra`, and `amaru` — into a single
deployable unit aligned with Plane 1 of the mesh plan
(`docs/proposals/defense-unicorns/04_mesh_plan.md`).

## Components

```
┌─────────────────────────────────────────────────────────────┐
│                        szl-mesh (UDSBundle)                 │
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │   a11oy      │    │   sentra     │    │   amaru      │  │
│   │              │    │              │    │              │  │
│   │ Governed     │    │ Cyber        │    │ Replay-bound │  │
│   │ execution    │    │ resilience   │    │ sync engine  │  │
│   │ fabric +     │    │ command +    │    │ + hash-chain │  │
│   │ Λ-9 runtime  │    │ posture API  │    │ delta-log    │  │
│   └──────┬───────┘    └──────────────┘    └──────────────┘  │
│          │                                                  │
│          │ optionalComponent: a11oy-attestations            │
│          ▼                                                  │
│   /uds-bundle/attestations.jsonl  (offline-verifiable       │
│   hash-chained ledger — §05 Fix A)                          │
└─────────────────────────────────────────────────────────────┘
```

## Architectural decisions

- **Single bundle, three Zarf packages.** Each component is independently
  buildable and deployable; the bundle is the composition unit that
  Defense Unicorns operators consume.
- **Local-build variant ships first.** `uds-bundle.local.yaml` references
  the sibling `deploy/` directories so the bundle can be produced and
  verified with no GHCR round-trip. This is the demo-day path.
- **Registry variant is the steady state.** `uds-bundle.yaml` pulls the
  three packages from `ghcr.io/szl-holdings/packages/*` once those
  packages are published by `uds-bundle-publish.yml`.
- **In-bundle attestations.** The proof-ledger rides inside the bundle
  as a sidecar file rather than as a separate registry artifact, so
  offline verification works without external dependencies (§05 Fix A).
- **Λ-9 invariant gate** is enforced at admission by the Pepr capability
  shipped via upstream PR #5027 (`05_two_fixes.md` §Fix B).

## References

- `04_mesh_plan.md` — five planes, this bundle is Plane 1.
- `05_two_fixes.md` — Fix A (attestations) and Fix B (Λ-floor).
- `UDS-BUNDLE.md` — bundle composition and build commands.
- `OPERATOR-QUICKSTART.md` — operator-facing verify/deploy/rollback.
- `SECURITY.md` — signature chain and provenance.

## Authoring

Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings.
