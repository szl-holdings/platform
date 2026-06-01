# A11OY_CODE_MEMORY_SPEC — Cross-session memory (Unay organ)

Durable, Khipu-receipted conversation + profile store. SQLite by default
(`A11OY_CODE_DB`, default `/app/data/a11oy_code.db`).

---

## 1. Schema

| Table | Columns (key ones) | Purpose |
|---|---|---|
| `conversations` | `id`, `user_id`, `title`, `system_prompt`, `created_at`, `updated_at` | One row per conversation |
| `messages` | `id`, `conversation_id`, `role`, `content`, `model`, `tier`, `latency_ms`, `cost_usd`, `yuyay13`, `khipu_hash`, `created_at` | Every turn, with routing + receipt metadata |
| `profiles` | `user_id`, `data` (JSON), `updated_at` | Per-user profile (Unay) |
| `api_keys` | `key`, `owner`, `active`, `rpm`, `created_at` | Public API keys for `/v1/chat/completions` |
| `receipts` | `receipt_id`, `action`, `ts`, `prev`, `hash`, `payload` | Persisted Khipu chain (best-effort mirror of the in-memory chain) |

---

## 2. Lifecycle per chat turn

1. `mem_upsert_conversation(conv_id, user_id, title, system_prompt)` — creates/updates the
   conversation row (title derived from the first user message).
2. `mem_add_message(conv_id, "user", …)` — stores the incoming turn.
3. After the model responds: `mem_add_message(conv_id, "assistant", text, model, tier,
   latency_ms, cost_usd, yuyay13, khipu_hash)` — the assistant turn is stored **with** its
   routing decision and the Khipu receipt hash, so every answer is auditable later.

---

## 3. Retrieval

- `GET /conversations?user_id=…` → list a user's conversations (most-recent first).
- `GET /conversations/{conv_id}` → full conversation with ordered messages + metadata.
- `GET /conversations/{conv_id}/export?format=md|json` → portable export.
- `GET /profile/{user_id}` / `POST /profile/{user_id}` → read/write the Unay profile JSON.

On a new turn for an existing `conversation_id`, prior turns are loaded so the model has
context across sessions. (When the browser sends a full `messages` array, that array is
authoritative for the live turn; the store remains the durable record.)

---

## 4. Khipu receipts (append-only sha256 chain)

Every state-affecting action — `chat.completion`, each `tool.*`, `router.fallback`,
`apikey.issued` — calls `khipu_emit(action, payload)`:

```
body = {receipt_id, action, ts, prev: <chain tip>, payload}
hash = sha256(json(body))          # links to prev → tamper-evident chain
chain_tip = hash
persist(body)  # best-effort into receipts table; in-memory chain still verifies
```

A broken chain trips **HUKLLA T01** (hard halt) inside the PURIQ gate, so no action can
proceed on a corrupted ledger. The `done` SSE event returns the turn's `khipu_hash` and
`chain_verified: true`, surfaced as the `# khipu …` badge in the UI.

**Noether note:** the receipt-state is conserved across the append-only chain — the tip
is the single source of truth and every receipt is reachable from it.

---

## 5. Privacy / portability

- Storage is local SQLite on the Space's persistent volume.
- The user can export any conversation to Markdown or JSON from the tab at any time.
- API keys are stored hashed-by-value lookups; deactivation flips `active=0` (no hard
  delete, preserving the audit trail).

---

## 6. Known limits (see GAP CHECK)

- Single-node SQLite — a multi-replica Space would not share state; move to a shared DB
  to scale horizontally.
- Per-key RPM is enforced in-process, not distributed.
