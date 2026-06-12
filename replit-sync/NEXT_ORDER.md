# NEXT_ORDER — Perplexity -> Forge inbox (auto-loop)

STATUS: idle — no pending order.

This file is the single inbox the Forge auto-loop polls every hour. To send Forge
the next order, OVERWRITE this file's body with the order (markdown bullets or a
numbered list). Founder-gated items (keys/secrets/major dep bumps/cosign-enforce)
are auto-skipped and reported, never executed. Forge writes its result to
`AUTO_STATE.json` (poll it: state=="done" && order_sha==<your commit sha> => send next).