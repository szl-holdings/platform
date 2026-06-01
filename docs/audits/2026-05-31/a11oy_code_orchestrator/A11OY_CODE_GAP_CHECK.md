# A11OY_CODE_GAP_CHECK — Honest gaps to true Opus-4.8 parity

This is a deliberately blunt list of what is **missing or partial** for the a11oy.code
orchestrator to truly match a frontier closed model (the "Opus 4.8" target). No
sugar-coating, no bandaids. Each gap names the cause and what closing it requires.

---

## A. Model-quality gaps (the big ones)

1. **No single 200B+ frontier-grade open model is available on our HF Router.**
   The strongest verified chat models on the router (2026-06-01 probe) are
   Llama-3.3-70B, DeepSeek-V3-0324, Qwen2.5-72B, and DeepSeek-R1. These are excellent,
   but a single 70B–671B open model does not reliably match a frontier closed model on
   the hardest reasoning, long-horizon agentic, and nuanced-writing tasks.
   - **Close it by:** adding provider keys (Together / Fireworks / DeepInfra / Cerebras /
     Groq) for larger/faster variants, or an Anthropic/OpenAI key behind a RED-license
     gate. Code already reads provider keys from env if present; none are set today.

2. **No reasoning-time scaling / self-consistency.**
   We do one pass (plus a bounded tool loop). Opus-class quality often comes from
   best-of-N, self-critique, or extended chain-of-thought with verification.
   - **Close it by:** adding a configurable self-consistency / verifier pass on T4
     (DeepSeek-R1) for hard prompts. Costs latency + tokens.

3. **No retrieval-augmented grounding by default.**
   The model answers from parametric knowledge unless it chooses to call `web_search`.
   - **Close it by:** wiring a default RAG step (the existing `/deep-research` and
     `/agentic-rag` surfaces could feed context).

---

## B. Provider / credential gaps (documented, not faked)

4. **Only `HF_TOKEN` is present.** Provider keys (Together, Groq, Fireworks, DeepInfra,
   Cerebras) and closed-model keys (Anthropic, OpenAI) are **absent**. The code reads
   them from env when present and otherwise falls back to the HF Router; if no credential
   exists it returns an **honest 503** — it never uses a placeholder key.
   - **Close it by:** setting the keys as Space secrets.

5. **GitHub tools need a credential in the Space.** `github_read_file` /
   `github_open_issue` shell out to `gh`, which requires `GH_TOKEN` in the Space env. The
   tool returns the real `gh auth login` hint when missing (verified live). Not faked.

6. **Web tools need network egress.** `web_search` / `web_fetch` returned
   "All connection attempts failed" in the offline test sandbox. They work where the Space
   has outbound network. Documented, not mocked.

---

## C. Feature-completeness gaps vs. the 13 deliverables

7. **TTS is browser `speechSynthesis`, not Riva/Coqui.** No Riva/Coqui credential is
   available, so server-side neural TTS is not wired. Browser TTS works everywhere and
   needs no key; quality is lower than Riva.
   - **Close it by:** adding a Riva/Coqui endpoint + key, then a `/voice/tts` route.

8. **Three.js previews are not wired.** Mermaid (diagrams) and KaTeX (math) render;
   interactive 3D preview was descoped to keep the build dependency-clean. The need it
   served (visual diagrams) is covered by mermaid.
   - **Close it by:** lazy-loading three.js from CDN and rendering fenced ```three blocks.

9. **OpenTelemetry spans are not emitted.** Prometheus `/metrics` is live and structured
   stderr logs exist, but there is no OTel exporter / collector configured.
   - **Close it by:** adding `opentelemetry-sdk` + an OTLP endpoint env var.

10. **Rate limiting is per-key RPM metadata, enforced in-process only.** There is no
    distributed limiter; a multi-replica Space would not share counters.
    - **Close it by:** backing the limiter with Redis or the Space's KV.

11. **Streaming of the *final* answer is word-chunked, not true provider token SSE.**
    Because tool-calling rarely streams cleanly, the chat endpoint does a non-stream call
    to resolve tool rounds, then re-streams the final text word-by-word for UX. For pure
    no-tool turns this is indistinguishable to the user, but it is not native token SSE.
    - **Close it by:** detecting "no tools needed" and switching to `_call_model_stream`.

---

## D. Safety / governance honesty notes

12. **PURIQ scoring uses heuristic axis estimators**, not a learned model of each axis.
    The gate is real and enforced (sacred/structural/introspection floors, HUKLLA
    tripwires, threshold 0.62), but the per-axis scores are rule-based approximations.
    - **Close it by:** training/wiring axis scorers; until then the heuristics are
      conservative (deny-biased on state-changing ops), which is the safe direction.

13. **2-person attestation is a boolean flag (`two_person_attested`), not two real
    cryptographic signatures.** The mechanism enforces the policy but trusts the caller's
    flag. For true 2-person control, the flag must be replaced with two verifiable
    approvals.
    - **Close it by:** integrating the existing Yuyay/approval-queue surface to collect
      two signed approvals before setting the flag server-side.

---

## E. Summary

The orchestrator is **fully functional and honest**: streaming chat, unified routing
over verified models, OpenAI-compatible API, real tool-calling with a working PURIQ gate
and Khipu receipts, and cross-session memory. The gaps to *true* Opus-4.8 parity are
overwhelmingly about **model access (bigger/closed models behind keys)** and a few
**polish features (Riva TTS, three.js, OTel, distributed rate-limit)** — none of which
were faked. Closing gap **A.1 / B.4** (add provider/closed-model keys) would move the
quality needle the most.
