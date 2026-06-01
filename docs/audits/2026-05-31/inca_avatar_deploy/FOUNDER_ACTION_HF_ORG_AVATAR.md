# FOUNDER ACTIONS — Hugging Face (require human UI; cannot be done by API)

The animated avatar file to upload in both actions is:
`avatar_animated.gif` — shared in this conversation, also on disk at
`/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/inca_avatar/avatar_animated.gif`
(400×400, 16fps loop, 2,307,397 bytes, signed Yachay).

---

## ACTION 1 — Set the SZLHOLDINGS org avatar (HF has NO API for this)

There is **no public Hugging Face API** to set an organization avatar — it is a UI-only
operation, regardless of token or permissions. This step is **mandatory and human-only**.

1. Open **https://huggingface.co/organizations/SZLHOLDINGS/settings/profile**
2. Click **"Change avatar"**
3. Upload **`avatar_animated.gif`** (the file shared in this conversation) → Save

---

## ACTION 2 — Grant `betterwithage` Write on SZLHOLDINGS (unblocks ALL future programmatic HF pushes)

This is the one-time auth grant that fixes the 403 on every SZLHOLDINGS Space. After this,
the staged patches deploy in one command (see below).

1. Open **https://huggingface.co/organizations/SZLHOLDINGS/settings/members**
2. If **`betterwithage`** is not listed, click **"Add member"** and add username **`betterwithage`**
3. Set role to **Write**
4. **Save**

### After Action 2 — deploy the 7 staged Spaces (one command)

The avatar GIF + README block for each Space are already staged under
`PENDING_PATCHES/SZLHOLDINGS_<space>/`. Once `betterwithage` has Write (or run it yourself
with your own `hf auth login`):

```bash
bash PENDING_PATCHES/PUSH_WHEN_AUTHORIZED.sh
```

This uploads `branding/szl-avatar-animated.gif` (binary-safe via `hf upload`) and appends the
additive README block to each of: a11oy, amaru, sentra, killinchu, rosie, anatomy-3d, rosie-3d.

> Note: the agent did NOT use `.secret/hf_token` to force these pushes — that bypass is
> explicitly prohibited by the task's hard rules. Action 2 is the correct, durable fix.
