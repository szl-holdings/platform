# PYTHON ↔ NODE RATIONALIZATION

**Directive answered:** *"maybe we use Python for certain parts to make things more efficient. What is your recommendation?"*
**Auditor:** Yachay · Perplexity Computer Agent · 2026-06-01
**Method:** language-by-workload census of all hand-written code across a11oy/amaru/sentra/killinchu/rosie; ROI gate = convert only where expected speed/maintainability gain > 2×.

## TL;DR recommendation
**Keep the current language split. There is no high-ROI conversion to make in either direction.** The founder's instinct ("use Python where it's more efficient") is already implemented across the empire. The genuine efficiency wins are **structural** (de-duplicate shared modules) and **operational** (kill silent error-swallowing, add tests) — not language swaps.

---

## Workload census vs. founder's hypotheses
| Workload | Founder's expectation | Reality (verified in source) | Verdict |
|---|---|---|---|
| Khipu hashing (sha256/sha3/Merkle) | "probably already Python (good)" | **Python** — `szl_receipt_substrate.py` uses `hashlib`/`hmac`, canonical-JSON, full chain verify. | ✅ already Python. No change. |
| Lambda (Λ) aggregation | "probably Python (good)" | **Python** — `lambda_aggregate` / `_raw_scalar` in `szl_live_wires.py` & `szl_formulas.py`. | ✅ already Python. No change. |
| Web UI | "stay TS+React (good)" | **TS+React** — amaru `web/` (94 tsx, Vite), a11oy `src/` (App.tsx + pages). | ✅ already TS. No change. |
| Wire pulse animation | "stay TS+R3F (good)" | **JS + Three.js/R3F** — `live_wires_3d.js` (CatmullRomCurve3, WebGPU+WebGL2 fallback). Pure GPU geometry; numpy would be *slower* (data lives on GPU, not in a CPU array). | ✅ already JS. No change. |
| OpenSSL / sha256 / Merkle **in JS** | "convert to Python crypto" | **None found.** Grep for `createHash`/`crypto.`/`merkle`/`sha256` in non-vendor JS = **0 hits.** All crypto already Python. | ✅ nothing to convert. |
| Node-side LLM **tokenization** | "convert to Python" | **None found.** No `tiktoken`/`gpt-tokenizer`/`encode_chat` in any JS. Tokenization is provider-side. | ✅ nothing to convert. |
| In-process LLM call **from Node** | "should be Python httpx async" | **Already Python httpx async** — `a11oy_code_orchestrator.py` uses `httpx.AsyncClient` for `_call_model`, `_call_model_stream`, fan-out router, tool dispatch. No in-process LLM call from JS exists. | ✅ already Python async. No change. |

**Every one of the founder's six candidates is already on the correct side of the line.** That is a strong, honest signal: the architecture's language boundaries were chosen well.

---

## Did I find ANY conversion candidate? (brutal honesty)
I looked hard for the opposite mistakes too — Python doing work TS/React would do better, and JS doing heavy CPU math.

- **JS heavy CPU math → Python+numpy?** The only math-heavy JS is `live_wires_3d.js`, and it is **GPU geometry** (Three.js curves, shader-bound). Moving it to numpy would force a GPU→CPU→GPU round-trip — a **net loss**, not a 2× gain. **Reject.**
- **Python doing frontend work → TS+React?** Rosie's `cs_*` handlers and `rosie_*_tab.py` build HTML strings server-side (Gradio pattern). This is mildly un-idiomatic but it is **server-rendered fragments**, not client interactivity; converting to React would mean standing up a second build pipeline for marginal benefit. **ROI < 2×. Reject** (revisit only if rosie gets a real SPA).
- **killinchu protocol decoders** (`adsb_decode`, `mavlink_parse`, `remote_id_decode`) are CPU bit-twiddling — **correctly Python**; numpy gives no benefit at single-packet scale. **Keep.**

**Net new conversions recommended: 0.** Suppressing the urge to convert for its own sake *is* the disciplined call.

---

## The real efficiency wins (what to do instead of converting)
These beat any language swap on ROI:

1. **De-duplicate the 6 copy-pasted shared modules** (`szl_formulas.py`, `szl_brain.py`, `szl_jack.py`, `szl_rag.py`, `szl_wire.py`, `szl_live_wires.py`) — currently pasted into up to 5 Spaces each. **ROI: ~5× on every future fix** (one edit instead of five) and eliminates drift. Package as `szl_core` wheel; Spaces `pip install` it in the Dockerfile. *Largest single maintainability win in the empire.*
2. **Replace `try/except: pass` with logged degradation** (84 sites empire-wide) — turns invisible failures into observable ones. **ROI: reliability**, not raw speed, but it is the difference between a GREEN dashboard that's true and one that lies.
3. **Cache `OUROBOROS_RUN_ALL.py` (1.45 MB) as a data asset, not source** — it ships in both a11oy and rosie images, bloating build context and skewing every analysis tool. Move to a JSON/parquet artifact loaded at runtime. **ROI: build speed + clean repo.**
4. **Hot-path micro-opts** documented in `PERFORMANCE_PROFILING_REPORT.md` (sha256 recompute in `_collect_real_pulses`, repeated `canonical_json` in verify loop).

---

## One-line recommendation for the deck
> *"We audited every workload against the Python/Node boundary. The split is already correct — crypto and aggregation are Python, the UI and 3D are TypeScript, the LLM router is Python async. The efficiency upside is in consolidating duplicated code and observability, not in rewriting languages."*

*— Yachay · Perplexity Computer Agent · 2026-06-01*
