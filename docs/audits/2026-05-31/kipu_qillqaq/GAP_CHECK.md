# GAP_CHECK.md — honest scope vs. delivered

## Task deliverables
| Deliverable | Status | Evidence |
|---|---|---|
| KIPU pool: content-addressed cells | DONE | `cell.py` (`content_address` SHA-256), `pool.py` |
| KIPU: LMDB persistence | DONE (+ JSON fallback) | `pool._Store` (lmdb if installed, else JSON file) |
| KIPU: pub/sub via in-process events | DONE | `events.py` `EventBus`; verified delivery |
| KIPU: Reed-Solomon erasure coding (honest, NOT holographic QEC) | DONE | `coding.py` RS(10,6); recover-after-4-loss verified |
| QILLQAQ: reads genome.toml, boots OrganAgents | DONE | `genome.py` (`tomllib`+schema), `transcribe.py` |
| 16 genome.toml files (12 + Chaski/Wallpa/Wasi-Rikuq/Wayra) | DONE | `GENOMES/` (16 files), all boot with 0 errors |
| Deploy to a11oy /v1/kipu + /v1/qillqaq via founder token | DONE | commit `f2eb3719`, live curl 200, substrate_version 0.1.0 |
| DOCTRINE.md | DONE | this folder |
| KIPU_SOURCE_INDEX.md + QILLQAQ_SOURCE_INDEX.md | DONE | this folder |
| HF_PUSH_LOG.md (real SHAs) | DONE | before `a44b38bd`, after `f2eb3719` |
| VERIFY_REPORT.md / GAP_CHECK.md | DONE | this folder |

## Founder's REAL-substrate demands (no fucking around)
| Demand | Delivered |
|---|---|
| (1) real importable package; show `import kipu_qillqaq; __version__` | **`0.1.0`** printed (VERIFY_REPORT §1) |
| package path | `kipu_qillqaq/pkg/` (src/kipu_qillqaq/) |
| install proof | `pip install -e .` → "Successfully installed kipu_qillqaq-0.1.0" |
| (2) real TOML via `tomllib`, real schema | `genome.py`; parse demo + GenomeError shown (§2) |
| TOML parse demo | amaru.toml → tomllib.load → validate_genome (§2) |
| (3) every Space pulling from substrate shows working import; curl /healthz w/ version | a11oy `/v1/kipu/healthz` → `substrate_version: 0.1.0` (§8) |
| Spaces importing it | `SZLHOLDINGS/a11oy` (live, vendored package imported at boot) |
| NO mystical "DNA" claims | DOCTRINE §1/§2 state plainly: config + module loading; Reed-Solomon not QEC |

## Honest gaps / non-claims (NO BANDAID)
1. **One Space, not all.** The substrate is deployed and import-proven on **a11oy** only.
   Other flagships (amaru/sentra/rosie/killinchu) are NOT yet wired — vendoring the same
   `kipu_qillqaq/` dir + `COPY` lines + `include_router` into each is the same 27-file
   pattern, but it was not done here (scope was a11oy). This is the next step, not done.
2. **In-memory pool on the Space.** The live a11oy pool uses the JSON-file store at
   `/tmp/kipu_a11oy` (ephemeral on Space restart). LMDB is available as a drop-in for
   durability but the Space image does not pip-install `lmdb`; cells do not survive a
   rebuild. This is honest: it is a working substrate, not a durable database yet.
3. **Reed-Solomon backend.** `coding.py` always uses the bundled pure-python RS for
   encode/decode (correct, MDS, verified). The `reedsolo` library is detected and reported
   but the current `ReedSolomonCoder._impl` is the pure implementation in both cases; if
   maximum throughput is needed, route encode/decode through `reedsolo` — not done (the pure
   impl is correct and dependency-free, which was the priority).
4. **No Lean added.** KIPU/QILLQAQ are pure code; they add 0 Lean declarations/axioms/
   sorries. The v11 locked corpus (749/14/163) is untouched — preserved verbatim, not extended.
5. **Coherence/T23 tripwire from the old draft is NOT implemented as code** here. The earlier
   mystical doctrine described a `KIPU_coherence` master-formula factor and a HUKLLA T23
   tripwire; this build ships the substrate + genome engine honestly and does not claim those
   gates exist in code. They remain a spec item, not a shipped feature.

## Hard-rule compliance
- Founder-token `HfApi` pattern: **used** (whoami SZLHOLDINGS verified before push).
- Doctrine v11 LOCKED numbers preserved verbatim: **yes** (DOCTRINE §0; nothing edited).
- ADDITIVE only; IP-HOLD a11oy#57 untouched: **yes** (existing routes 200 after push).
- Signed Yachay + Perplexity Computer Agent trailer: **yes** (commit message).
- Open-source deps only: **yes** (stdlib + optional MIT/OpenLDAP).
- Honest naming (Reed-Solomon, not holographic QEC): **yes** (throughout).

Signed: **Yachay** · agent: Perplexity Computer Agent.
