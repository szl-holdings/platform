# HF PUSH — blocker + two ready paths (Yachay, 2026-06-01)

## The blocker (verified, honest)
The connected Hugging Face token authenticates as user **`betterwithage`** (confirmed via
`hf_whoami`). That user has **NO write access** to the **`SZLHOLDINGS`** org. During this
session the following were attempted on `SZLHOLDINGS/a11oy` and BOTH failed:
- direct `upload_file` / `write_file` → **403 Forbidden**
- `create_pr=true` → **403 Authorization error**

Per HR ("HfApi direct push, NEVER GitHub Actions") and the zero-bandaid rule, the push is
NOT brute-forced. Everything is built, locally verified, and staged. The actual push must be
run by the **founder token** (write access to SZLHOLDINGS).

## Path A — HfApi script (recommended, matches "HfApi direct push")
```
export HF_TOKEN=<founder token with WRITE on SZLHOLDINGS>
cd new_organs/push_scripts
python push_three_organs.py            # dry-run, prints plan (verified working)
python push_three_organs.py --apply    # real upload
```
Then apply the serve.py + Dockerfile EDITS from
`new_organs/a11oy_organs/serve_py_dockerfile.patch.md` and let the Spaces rebuild.

## Path B — connector `write_file` (one file per call, founder must re-auth as SZLHOLDINGS member)
Once the HF connector is authenticated as a user WITH write access to SZLHOLDINGS, call
`write_file` once per file (repo_type="space"):

| repo_id | path_in_repo | local source |
|---|---|---|
| SZLHOLDINGS/a11oy | szl_khipu.py | a11oy_organs/szl_khipu.py |
| SZLHOLDINGS/a11oy | szl_chaski.py | a11oy_organs/szl_chaski.py |
| SZLHOLDINGS/a11oy | szl_wallpa.py | a11oy_organs/szl_wallpa.py |
| SZLHOLDINGS/a11oy | szl_wasi_rikuq.py | a11oy_organs/szl_wasi_rikuq.py |
| SZLHOLDINGS/a11oy | pages/chaski.html | a11oy_organs/chaski.html |
| SZLHOLDINGS/a11oy | pages/wallpa.html | a11oy_organs/wallpa.html |
| SZLHOLDINGS/a11oy | pages/wasi-rikuq.html | a11oy_organs/wasi-rikuq.html |
| SZLHOLDINGS/a11oy | serve.py | (EDIT existing — apply serve_py_dockerfile.patch.md §1+§2) |
| SZLHOLDINGS/a11oy | Dockerfile | (EDIT existing — apply serve_py_dockerfile.patch.md §3) |
| SZLHOLDINGS/szl-anatomy | live_wires_3d.js | anatomy_patch/live_wires_3d.PATCHED.js |

commit_message (verbatim, signed):
> feat(organs): instill CHASKI + WALLPA + WASI-RIKUQ (Doctrine v13, ADDITIVE) — Sign: Yachay

Docs are EDITS (additive blocks) to existing READMEs / HATUN — apply from
`new_organs/README_PATCHES.md` and the already-extended
`puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md`.
