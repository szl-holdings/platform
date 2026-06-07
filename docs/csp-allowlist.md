# CSP Allowlist Runbook

This runbook explains how to add a third-party domain to the
Content-Security-Policy (CSP) allowlist, either platform-wide or for a single
artifact.

---

## Background

All web artifacts and the API server share a common CSP baseline defined in
`packages/security-headers/src/index.ts` (`BASELINE_CSP_DIRECTIVES`).  The
Vite plugin (`securityHeadersVitePlugin`) injects these headers on every dev
and preview server response.  The API server uses `buildHelmetOptions` which
derives its CSP from the same constants.

The CI smoke check (`scripts/check-security-headers.mjs`) verifies that every
artifact returns the required headers.  Run it with:

```sh
node scripts/check-security-headers.mjs
```

---

## When to extend the CSP

You need to extend the CSP when an artifact loads resources from a domain that
is not already covered by the baseline (e.g. an analytics script, a CDN font,
an embedded map widget, a payment iframe).

---

## Option A — Platform-wide change (affects every artifact)

Edit `BASELINE_CSP_DIRECTIVES` in
`packages/security-headers/src/index.ts`:

```ts
export const BASELINE_CSP_DIRECTIVES: Readonly<CspDirectives> = {
  // ...existing directives...
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://new-font-cdn.example.com'],
};
```

Commit with a note explaining _which artifact needs it_ and _why_ — if only
one artifact needs the domain, prefer Option B instead.

---

## Option B — Single-artifact override (preferred for narrow use cases)

Pass `additionalDirectives` when registering the plugin in the artifact's
`vite.config.ts`:

```ts
// artifacts/my-artifact/vite.config.ts
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

export default defineConfig({
  plugins: [
    securityHeadersVitePlugin({
      additionalDirectives: {
        // Values here are APPENDED to the baseline — list only the extra origins.
        styleSrc: ['https://fonts.googleapis.com'],
        fontSrc:  ['https://fonts.gstatic.com'],
        scriptSrc: ['https://cdn.example.com'],
      },
    }),
    // ...other plugins
  ],
});
```

To **replace** a directive entirely instead of appending, add `override: true`:

```ts
securityHeadersVitePlugin({
  override: true,
  additionalDirectives: {
    frameSrc: ["'self'", 'https://trusted-embed.example.com'],
  },
})
```

---

## Directive quick-reference

| Directive       | Controls                                    | Baseline value                       |
|-----------------|---------------------------------------------|--------------------------------------|
| `defaultSrc`    | Fallback for all unspecified resource types | `'self'`                             |
| `scriptSrc`     | `<script>` sources                          | `'self'` `'unsafe-inline'`           |
| `styleSrc`      | CSS sources                                 | `'self'` `'unsafe-inline'`           |
| `imgSrc`        | Images                                      | `'self'` `data:` `blob:` `https:`   |
| `connectSrc`    | Fetch / XHR / WebSocket destinations        | `'self'` `wss:` `https:`            |
| `fontSrc`       | Web fonts                                   | `'self'` `data:` `fonts.gstatic.com`|
| `frameSrc`      | `<iframe>` sources                          | `'self'`                             |
| `frameAncestors`| Who can embed this page in a frame          | `'self'`                             |
| `workerSrc`     | Web Worker / Service Worker scripts         | `'self'` `blob:`                     |
| `objectSrc`     | `<object>` / `<embed>` / `<applet>`        | `'none'` (blocked)                   |

---

## Rules of thumb

1. **Prefer `https:` over `*`** — wildcard schemes are acceptable for `imgSrc`
   where images come from arbitrary user-supplied URLs, but avoid them for
   `scriptSrc` and `styleSrc`.
2. **Never use `'unsafe-eval'` in production** — it defeats CSP's XSS
   protection.  It is automatically injected in dev mode only.
3. **Avoid `'unsafe-inline'` for scripts** — if you need inline handlers,
   move them to a `.js` file instead.
4. **Use `frameAncestors` instead of `X-Frame-Options`** when you need
   fine-grained embedding control; both are currently set to `'self'`.
5. **Document the reason** in a comment next to your CSP addition — future
   maintainers will need to know why each domain is trusted.

---

## Verifying your change

After editing, run:

```sh
node scripts/check-security-headers.mjs
```

The script fetches every artifact's root path through the shared proxy and
asserts the required headers are present.  All reachable artifacts must pass
before the change is merged.
