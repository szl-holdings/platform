# MVP Stack of One — Honest Deploy Discipline (v4.6)

A founder-grade companion to STACK_OF_ONE.md. Where STACK_OF_ONE.md
is the 40-row best 2026 AI stack, this is the build-vs-buy gradient
for shipping an MVP in 7 days without lying to yourself about
production readiness.

Source ingest: [GPTsters — Best Stack for AI MVP (Auth, Payments, Deploy)](https://gptsters.com/guides/best-stack-for-ai-mvp-auth-payments-deploy).
Lifted, evolved, and made our own.

## The Build-vs-Buy Gradient

| Layer            | Build       | Buy (recommended)         | Why                                     |
| ---------------- | ----------- | ------------------------- | --------------------------------------- |
| Frontend gen     | from scratch| Lovable / Cursor / v0     | First UI in minutes, not days           |
| Auth             | yourself    | Supabase Auth             | OAuth + magic links + JWT for free      |
| Database         | Postgres    | Supabase Postgres         | Same Postgres, with row-level security  |
| Payments         | yourself    | Stripe                    | PCI compliance is not a Day-1 problem   |
| Frontend host    | nginx       | Vercel                    | Edge cache + preview deploys            |
| Backend host     | bare metal  | Railway                   | Frontend-on-Vercel-backend-on-Railway   |
| Background jobs  | cron        | Railway worker / Upstash  | Tier 0: out-of-band from request cycle  |
| Monitoring       | nothing     | UptimeRobot + Sentry      | Day-1 — never launch blind              |
| Receipt store    | Postgres    | Supabase Postgres + bucket| Receipts are the moat — give them home  |

## The Five Discipline Receipts

Every MVP must produce these five receipts before launch — without
them you have a demo, not a product.

1. **Auth receipt** — every authenticated request carries a verifiable
   identity claim (Supabase JWT or equivalent). Refuse anonymous
   writes by default.
2. **Payment receipt** — Stripe webhook **must** be wired AND tested
   in production with a $0.50 live transaction before launch. Test
   mode does not count. The webhook is your source of truth, not the
   redirect URL.
3. **Deploy receipt** — automated CI/CD with a green check on `main`
   before the deploy goes out. No "ssh in and pull" allowed.
4. **Monitoring receipt** — UptimeRobot ping every 5 min on the
   public URL, and a Sentry DSN in production catching errors. If
   you launch without these you do not know you went down.
5. **Backup receipt** — at least one automated database snapshot per
   day, retained for 7 days. Supabase ships this. Verify it once.

## The Five Lies Founders Tell Themselves

From the GPTsters article, sharpened:

1. "I'll add Stripe webhook discipline later." — You won't. Customers
   pay, your DB doesn't update, you refund-storm. Wire the webhook
   on day 0.
2. "I don't need monitoring yet." — Your customers will tell you it
   was down when they cancel. Five minutes to set UptimeRobot.
3. "Vercel handles my backend too." — Vercel is great for frontend
   and edge functions. For long-running jobs, websockets, or queues,
   put the backend on Railway or Fly.
4. "I'll separate concerns when I refactor." — The refactor never
   comes. Keep auth in Supabase, payments in Stripe, business logic
   in your backend. Don't fold them.
5. "I'll figure out deploy when I need to." — You need to before
   day 1. A CI/CD pipeline takes 30 minutes. Do it before the demo.

## The Day-1 Stack (copy-paste)

```
frontend     : v0 + Vercel
auth         : Supabase Auth
db           : Supabase Postgres (with RLS on every table)
payments     : Stripe + webhook on Railway
backend      : Railway (Node or Python)
ai inference : OpenAI / Anthropic / Together (via STACK_OF_ONE.md)
monitoring   : UptimeRobot + Sentry
analytics    : Plausible (privacy-respecting) or PostHog
ci/cd        : GitHub Actions → Vercel + Railway
backups      : Supabase automatic + weekly manual export
```

## What This Adds to Ouroboros

The MVP stack maps directly to Ouroboros primitives:

- Auth receipt → primitive 11 (anchor identity)
- Payment receipt → primitive 17 (settle-by-witness, financial leg)
- Deploy receipt → primitives 47-50 (CI gates, change-receipt)
- Monitoring receipt → primitive 78 (rack resiliency / drain on
  critical fault)
- Backup receipt → primitive 19 (durable witness store)

Conclusion: shipping fast and shipping receipted are the same
discipline. The MVP stack is what receipted founders ship in 7
days.

— SZL Holdings, May 2026
