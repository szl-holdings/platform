# Packet 6 vertical-cell factory

> **Evidence status: MODELED.**

See [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) for provenance, precedence, and
the boundary between local source evidence and external operational proof.

This app turns the Packet 6 estate profile into deterministic, fail-closed
vertical-cell contracts. It uses only the Python standard library and performs
no network calls, provider mutations, deployments, or external actions.

## What is present

- Seven canonical cell manifests under `manifests/`.
- Ten normalized formula contracts plus a SHA-256 sidecar under `registries/`.
- Explicit short-scope-to-vertical aliases; scope is never inferred by prefix.
- Strict portable JSON Schemas under `schemas/`.
- A semantic validator that checks the whole seven-cell graph.
- A deterministic compiler that emits source manifests and ten peer contracts
  plus a non-recursive build manifest for every cell.
- Versioned ontology, receipt, and route contracts aligned to the local runtime,
  including authenticated evaluation, receipt retrieval, and human disposition.
- A compatibility auditor that binds the supplied profile to every checked-in
  manifest and registry before proving two-build byte determinism offline.
- Standard-library unit tests covering positive, negative, and reproducibility
  paths.

## Evidence boundary

A valid manifest and passing local test demonstrate local source behavior only.
They do not demonstrate a pushed branch, hosted CI, review, merge, deployment,
Hugging Face publication, provider/runtime convergence, durable production
operation, customer use, or an independent runtime witness.

Every generated release plan therefore starts at `SOURCE_ONLY`, disallows
provider mutation, and lists the evidence gates that would have to be satisfied
by a separate authorized release process.

The v2 release schema describes declarations; it is not a proof format. The
local runtime gate may pass `SOURCE_ONLY` structure but cannot admit any
operational state. That requires a separate verifier with receipt bytes,
authorized signer keys, and independent witness provenance.

Local decision receipts are append-only events in the same unverified SQLite
trust domain as the decisions they reference. They provide deterministic replay
and conflict detection, not deployment evidence, human-identity verification,
external durability, or permission to execute an action.

## Python API

```python
from szl_factory import ValidationError, compile_profile, load_profile, validate_profile

profile = load_profile("szl_estate_vertical_factory_profile_v6.json")
issues = validate_profile(profile)
if issues:
    raise ValidationError(issues)

result = compile_profile(
    "szl_estate_vertical_factory_profile_v6.json",
    "vertical_cells_v6",
    "compiled_vertical_cells_v6",
    clean=True,
)
print(result["tree_sha256"])
```

`compile_profile` captures no wall-clock time. Every artifact uses the profile's
stable `captured_at` value. JSON is UTF-8 with sorted keys, two-space indentation,
and a single LF terminator.

The package-local Biome configuration inherits the repository rules and keeps
JSON arrays expanded. Normal pre-commit formatting and lint remain enabled;
the canonical-byte test checks the checked-in manifests, registries, schemas,
and SAMPLE request after formatting. Root formatter configuration is unchanged.

The captured Packet 6 CLI forms are also supported:

```powershell
python -m szl_factory --profile C:\path\profile.json --validate-only
python -m szl_factory --profile C:\path\profile.json --vertical-dir manifests --out C:\path\compiled --clean
python tools\szl_estate_vertical_auditor_v6.py --profile C:\path\profile.json --compiler tools\szl_vertical_cell_compiler_v6.py --validate-only
```

The auditor is deliberately offline. Full mode compiles twice in temporary
directories and reports connected-estate verification as `NOT_RUN` and
`UNAVAILABLE`; it does not inspect or mutate GitHub, Hugging Face, DNS, or any
other provider.

## Tree digest

Tree Digest v1 is SHA-256 over the domain separator
`szl-tree-sha256-v1\n`, followed by one record per regular file in POSIX-path
sort order:

```text
relative/path NUL lowercase-file-sha256 LF
```

The compiled digest includes `compiled_index.json` and every
`build_manifest.json`. It is returned externally instead of embedded in the
index, avoiding self-reference. Output paths traversing symlinks, junctions, or
reparse points fail closed. Each cell build manifest
digests all ten peer files and explicitly excludes only itself.

## Tests

From this directory:

```powershell
$env:PYTHONPATH = ".;tests;..\..\packages\vertical-runtime"
python -B -m unittest discover -s tests -v
```

The tests use temporary output directories and no external network. Generated
contract integration tests exercise the runtime through local loopback HTTP.
