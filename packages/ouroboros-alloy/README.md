# @workspace/alloy

Primitives 65-72 — the **one-of-one alloy**. Each primitive lifts one
architectural pattern from a leading 2026 frontier LLM (S-tier or A-tier
on the Onyx leaderboard) into a generic, invariant-preserving discipline
that operates over receipts, claims, and invariants — not GPU tensors.

| # | Primitive | Inspired by |
|---|-----------|-------------|
| 65 | thinking-mode-arbiter | GLM-4.5/4.6 hybrid reasoning, Qwen3 thinking-toggle |
| 66 | preserved-thinking-ledger | GLM-4.7 preserved & turn-level thinking |
| 67 | sparse-attention-mask | DeepSeek V3.2 sparse attention (DSA) |
| 68 | expert-router | Kimi K2 384-expert MoE, top-k selection |
| 69 | latent-projection | DeepSeek MLA, Step3 MFA — multi-matrix factorization |
| 70 | rl-cold-start-pipeline | DeepSeek R1 cold-start → RL, MiMo three-stage |
| 71 | multi-token-prediction | MiMo MTP head, accelerates emission with verification |
| 72 | rule-based-reward | DeepSeek R1 / MiMo rule-based verifiers, no reward hacking |

## Position

Whereas FlashForge (61-64) handles **portability discipline** (capability
matrix, backend arbiter, JIT/AOT), Alloy (65-72) handles **inference
discipline**: when to think, when not to, what to attend to, who to
route to, how to verify what came back.

## License

Inspirations are Apache-2.0 (GLM, Kimi-K2 NOASSERTION, MiniMax, Step3,
MiMo, Mistral) and MIT (DeepSeek). This package is original code and
ships under the same terms as the rest of `@workspace`.

## Sources

See `/sources/ALLOY_INGEST.md` for full provenance, repo URLs, commit
dates, and what we did and did not borrow.
