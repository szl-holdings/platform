# A11OY_CODE_TOOL_SPEC — Tool-calling surface

10 tools in OpenAI function-calling JSONSchema, exposed to the model as `tools`. Every
call goes through the same pipeline:

```
model emits tool_call
  → PURIQ gate (puriq_decide(action, context))
      → if state-changing AND not two_person_attested → DENY
      → Yuyay-13 axis floors + HUKLLA tripwires + threshold 0.62
  → execute (real side effect, or honest error if credential/network missing)
  → Khipu receipt (append-only sha256 chain)
  → tool_result event back to the model → loop (max 4 rounds)
```

---

## 1. Tool catalog

| Tool | Reach | State-changing | Needs credential |
|---|---|---|---|
| `web_search` | Web | no | network egress |
| `web_fetch` | Web | no | network egress |
| `github_read_file` | GitHub | no | `GH_TOKEN` (gh CLI) |
| `github_open_issue` | GitHub | **yes** | `GH_TOKEN` |
| `hf_read_space` | Hugging Face | no | `HF_TOKEN` |
| `flagship_call` | Amaru/Sentra/Rosie/Killinchu | **yes** | flagship endpoints |
| `shell_exec` | Sandboxed shell | **yes** | none (sandboxed) |
| `fs_read` | Sandboxed filesystem | no | none |
| `fs_write` | Sandboxed filesystem | **yes** | none |
| `drone_command` | Killinchu drone fleet | **yes** | Killinchu `/drones/*` |

State-changing tools: `github_open_issue`, `github_open_pr`, `hf_push_file`, `fs_write`,
`shell_exec`, `flagship_call`, `drone_command` — all require `two_person_attested=true`.

---

## 2. Sandbox guarantees

- **`shell_exec`** — runs in `A11OY_CODE_SANDBOX` dir, **no network**, 30s timeout,
  command allow-list. Network and out-of-sandbox paths are refused.
- **`fs_read` / `fs_write`** — path is resolved and `relative_to(SANDBOX_DIR)` is
  enforced; any `..` traversal raises and is denied before any I/O.

---

## 3. PURIQ gate behavior (verified live 2026-06-01)

| Scenario | Result |
|---|---|
| `github_read_file` (benign read) | **allow**, score 0.9425 |
| `fs_write` without `two_person_attested` | **deny** — `Yuyay axis below floor: reversibility<0.9`, score 0.0 |
| `fs_write` with `two_person_attested=true` | **allow**, score 0.8844, file actually written (16 bytes) |
| any tool referencing `a11oy#57` / "GitHub Actions" / "secrets.HF_TOKEN" | **HUKLLA T08 hard halt** |
| Khipu chain broken | **HUKLLA T01 hard halt** |

The gate is **deny-biased on state-changing operations** — the safe direction. Read-only
tools clear the gate easily; mutations need attestation.

---

## 4. Robustness: tool_call normalization

Before echoing the assistant's `tool_calls` back to the provider, every call's
`arguments` is normalized to a valid JSON-object string (null/empty → `{}`). This
prevents the provider-side `"expected object, but got null"` 400 that some models trigger,
without faking any tool output. Tool round limit is 4 to bound runaway loops.

---

## 5. Honest-failure contract

A tool that needs a missing credential or network returns a **real error object** (e.g.
the `gh auth login` hint, or "All connection attempts failed") — never a mocked success.
The model sees the error and can adapt or report it to the user.

---

## 6. SSE events emitted to the browser

| Event | Payload |
|---|---|
| `tool_call` | `{name, arguments}` |
| `tool_result` | `{name, ok, result, error, gate:{allow, score, reason}}` |

The `/a11oy.code` tab renders each as a tool strip with the PURIQ score and allow/deny
color so the operator can see exactly what a11oy did and whether the gate passed.
