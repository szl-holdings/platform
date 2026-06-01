# A11OY_CODE_USER_GUIDE — Talk to a11oy

A baby-simple guide to the new **a11oy.code** chat tab. No jargon.

---

## 1. Where is it?

Open the Space and add `/a11oy.code` to the end of the address:

> **https://szlholdings-a11oy.hf.space/a11oy.code**

(That's a **dot** — `a11oy.code`. The old `a11oy-code` page with a **hyphen** is the
marketing page and is unchanged.)

You'll see a dark page with a gold **a11oy.code** title and a text box at the bottom
that says *"Talk to a11oy…"*.

---

## 2. Just talk to it

1. Type a question in the box at the bottom.
2. Press **Enter** (or click the gold send button).
3. The answer streams in word-by-word, like a person typing.

Ask it anything — explain code, write code, draft an email, summarize a document,
reason through a hard problem. It aims for top-tier ("Opus-4.8") quality.

**Examples to try:**
- "Explain what a Lean 4 proof obligation is, with a small example."
- "Draft a 3-paragraph investor update about our AI orchestration layer."
- "Write a Python function that retries an HTTP call with backoff."

---

## 3. The little badges under each answer

After a11oy replies, small pills appear under the message:

| Badge | Means |
|---|---|
| 🧠 a model name | Which open LLM answered (the router picked the best one) |
| 🔧 T0–T6 | The "tier" — how heavy the question was |
| ⏱ … ms | How long it took |
| 💲 … | The tiny cost of that answer |
| 🛡 Yuyay-13 … | A safety/quality score (higher is better) |
| # khipu … | A tamper-proof receipt ID for that answer |

You don't have to do anything with these — they're just for transparency.

---

## 4. Letting a11oy DO things (tools)

a11oy can act, not just talk. Ask it to read a GitHub file, search the web, call one of
our flagship apps (Amaru, Sentra, Rosie, Killinchu), or command the drone fleet. When it
does, you'll see a small box showing the tool name and a **PURIQ** score.

**Safety rail:** anything that *changes* something (writing a file, opening a GitHub
issue, running a command, commanding a drone) is **blocked unless two people approve it**
(2-person attestation). If you see "PURIQ deny — reversibility", that's the safety gate
doing its job. This is intentional and protects you.

---

## 5. Buttons at the top right

- **Model dropdown** — leave it on **"router picks (auto)"** and a11oy chooses the best
  model for each question. Only change it if you want a specific model.
- **⚙️ gear** — open the **system prompt** (the standing instructions a11oy follows).
  Edit it to change a11oy's behavior; click **reset** to restore the default.
- **⬇️ download** — save the whole conversation as a **Markdown** file.
- **JSON** — save the conversation as a **JSON** file (for engineers).

---

## 6. Voice and pictures

- **🎤 microphone** (bottom left) — click it, speak, click again to stop. Your words are
  transcribed into the box. (Your browser will ask for mic permission the first time.)
- **🔊 speaker** (top-right of an answer) — click to have a11oy read the answer aloud.
- **🖼 image** (bottom left) — attach a picture and ask a11oy about it.

---

## 7. It remembers

a11oy keeps your conversation across sessions. Come back later and your chat history is
still there (stored safely, with receipts).

---

## 8. For engineers: use it like the OpenAI API

a11oy.code speaks the OpenAI API format. An admin issues you a key, then:

```bash
# 1) Admin issues a key (needs the admin key configured on the Space):
curl -X POST https://szlholdings-a11oy.hf.space/api/a11oy/code/v1/keys \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"owner":"you","two_person_attested":true}'
# -> {"api_key":"a11oy-…","base_url":"/api/a11oy/code/v1","rpm":60}

# 2) Use it with any OpenAI client:
curl -X POST https://szlholdings-a11oy.hf.space/api/a11oy/code/v1/chat/completions \
  -H "Authorization: Bearer a11oy-…" \
  -H "Content-Type: application/json" \
  -d '{"model":"router-auto","messages":[{"role":"user","content":"hello"}]}'
```

Point the OpenAI SDK's `base_url` at `…/api/a11oy/code/v1` and it just works.

---

## 9. If something looks wrong

- **"Backend error 503"** in chat → the Space has no LLM credential set. An admin needs
  to set `HF_TOKEN` as a Space secret. (We never fake a key.)
- **Answer didn't stream** → refresh the page; the Space may have been mid-rebuild.
- **A tool was denied** → that's the PURIQ safety gate; state-changing actions need
  2-person approval.
