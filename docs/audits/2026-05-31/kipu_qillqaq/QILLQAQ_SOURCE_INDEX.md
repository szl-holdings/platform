# QILLQAQ_SOURCE_INDEX.md — the declarative genome engine

Boots `OrganAgent`s from `genome.toml` config. "DNA"/"genome" = TOML config + module
loading. No biology. Parsed with the standard-library `tomllib`.

| File | Lines | Responsibility |
|---|---|---|
| `src/kipu_qillqaq/genome.py` | 109 | `Genome` dataclass + `validate_genome(dict)` (real schema validation, raises `GenomeError` on malformed config) + `load_genome(path)` (`tomllib.load` + validate). `may_read`/`may_write` authorization helpers. |
| `src/kipu_qillqaq/transcribe.py` | 123 | `OrganAgent` (gated `write`/`read`, resolves `[boot].handler` "module:callable", `step()`) + `QillqaqEngine` (`boot_file`, `boot_dir`, `boot_packaged`, `manifest`). |
| `src/kipu_qillqaq/handlers.py` | 31 | Reference handlers `echo`/`reconcile` so a genome binds to a working callable out of the box. Handlers cannot exceed the genome's authorized write-kinds. |
| `src/kipu_qillqaq/genomes/*.toml` | 16 files | The 16 canonical organ genomes (see GENOMES/). |

## Genome schema (validated)

```
[organ]  name (str, req) · quechua (str) · function (str, req)
[role]   loop (str, req)
[reads]  kinds (list[str], req)
[writes] kinds (list[str], req)
[boot]   handler ("module:callable", req) · enabled (bool, default true)
[meta]   free-form table
```

`validate_genome` enforces: presence of `[organ]`/`[role]`/`[reads]`/`[writes]`/`[boot]`,
required keys, correct types, list-of-strings for kinds, and `handler` containing a `:`.

## Boot flow

```
QillqaqEngine.boot_packaged()
  └→ boot_dir(<package>/genomes)
       └→ for each *.toml: load_genome (tomllib + validate)
            └→ OrganAgent(genome, pool)
                 └→ import_module(handler_module); getattr(callable)  [module loading]
```

## Verified behaviors
- 16 genomes parse + validate + boot with **zero errors**.
- `validate_genome({"organ":{"name":"X"}})` raises `GenomeError: [organ] missing required key 'function'`.
- `AMARU.write("voice", ...)` raises `PermissionError` (voice not in AMARU `[writes]`).
- `/v1/qillqaq/manifest` returns all 16 organs with handler_status `bound`.

Author: Yachay · Perplexity Computer Agent.
