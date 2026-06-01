# SZL Holdings — Mobile-First Standard (v1.0)

**Owner:** Yachay `<yachay@szlholdings.dev>`
**Status:** LOCKED · Adopted org-wide 2026-06-01
**Primary target:** iOS Safari (iPhone) · Secondary: Android Chrome, desktop unchanged
**Governing principle:** **ADDITIVE ONLY.** Mobile support is layered *on top of* existing
desktop behavior. Desktop WASD / pointer-lock / OrbitControls / routes are never removed
or weakened. Mobile is an `OR` branch, gated by runtime touch detection.

---

## 0. Doctrine integrity (non-negotiable)

This standard touches **presentation and input only**. It must never alter governed artifacts.
Doctrine v11 remains **LOCKED, verbatim**: **749 declarations / 14 unique axioms / 163 sorries**.
No retrofit commit may change Lean proofs, kernels, receipts, or doctrine counts.

---

## 1. The Mobile Contract (apply to every scene & page)

### A. Viewport + meta (every HTML `<head>`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0a0e14">
```
- `viewport-fit=cover` is required for edge-to-edge under the iPhone notch / home indicator.
- `user-scalable=yes` is kept for accessibility (never disable zoom).
- `theme-color` = `#0a0e14` for app Spaces; org card uses its brand `#1a0d2e`.

### B. Touch controls for WASD / pointer-lock scenes
Use the canonical `szl-mobile-controls.js` (see §4). It provides:
- **Left thumb virtual joystick** (40px radius) → normalized move vector.
- **Right-half drag-anywhere** → camera yaw + pitch (look delta, consumed per frame).
- **Two-finger pinch** → FOV zoom delta.
- **Tap "Enter"** activates the scene **without pointer lock** (iOS has no Pointer Lock API);
  **"Exit"** leaves.
- Mobile detection: `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`.
- Vanilla JS, **zero dependencies**.
- Saved as a sibling/static asset in each Space (`/static/szl-mobile-controls.js` for
  standalone scenes; `./szl-mobile-controls.js` sibling for embedded viz scenes).

**OrbitControls scenes** are already touch-native; they get the perf/a11y tuning of §B-tune
instead of the joystick:
```js
if (SZL_MOBILE) { controls.rotateSpeed = 0.6; controls.zoomSpeed = 0.8; controls.enablePan = true; }
```

### C. Responsive landing pages
- `flex-wrap` on rows; multi-column grids collapse (5→2→1) across `900px` / `560px` breakpoints.
- Minimum **44×44px** tap targets on every link/button.
- Hero canvas **60vh mobile / 80vh desktop**.
- Body text ≥ **16px**, `h1` ≥ **24px** on mobile.
- **No horizontal scroll**: `max-width:100vw; overflow-x:hidden` on `body`; media `max-width:100%`.

### D. 3D performance on mobile
```js
const r = new THREE.WebGLRenderer({ antialias: !SZL_MOBILE, powerPreference: SZL_MOBILE ? "low-power" : "high-performance" });
r.setPixelRatio(Math.min(devicePixelRatio, SZL_MOBILE ? 1.5 : 2));
```
- Reduce particle / star / nebula counts by **50%** on mobile (`particleScale()` → 0.5 mobile / 1 desktop).
- Lighter bloom on mobile (e.g. anatomy 0.9→0.55, rosie 1.05→0.6).
- **Pause render when `document.hidden`** (battery saver): `if (!document.hidden) renderer.render(...)`.

### E. iOS Safari quirks
- `-webkit-tap-highlight-color: transparent`.
- **No Pointer Lock** — use tap-Enter activation instead.
- Dynamic viewport: set `--vh` from `window.innerHeight * 0.01` on load / resize / orientationchange;
  use `calc(var(--vh) * 100)` instead of `100vh` for full-height scenes.
- **Audio only on user gesture** (resume `AudioContext` on first tap).

### F. Accessibility
- `aria-label` on every control (joystick, Enter/Exit, look pad).
- Semantic HTML; skip-to-content link preserved.
- `prefers-reduced-motion: reduce` disables auto-rotate, scene drift, and ambient animations:
  ```js
  const SZL_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!SZL_REDUCED) { /* auto-rotate / drift */ }
  ```

---

## 2. Hard rules (enforcement)

1. **ADDITIVE only** — never remove or gate-off desktop WASD / pointer-lock / OrbitControls.
2. **Preserve every route** — no URL or page is renamed or removed.
3. **Do not touch IP-HOLD PRs.**
4. **Do not break 3D scenes** — verify desktop render after each push (screenshot or live check).
5. **Doctrine v11 numbers** (749 / 14 / 163) stay untouched.
6. **Sign every commit** Yachay `<yachay@szlholdings.dev>`.
7. **Race-aware** — for concurrently-edited Spaces (e.g. a11oy), re-fetch the latest tree/file
   md5 immediately before each push and layer additively; never overwrite another agent's work.
8. **Built SPA bundles are off-limits** — for Vite/Rolldown built `index.html`, only add/upgrade
   `<head>` meta tags. Never hand-edit hashed `assets/*` bundles.

---

## 3. Patch patterns

### PointerLock scenes (e.g. Doctrine Cathedral)
- Import `SZLMobileControls`.
- Branch the Enter button: mobile → `mc.enter()`; desktop → `controls.lock()`.
- Mobile loop path: joystick move + drag look + pinch FOV applied via a `YXZ` Euler on the
  camera quaternion.
- Mobile tap-to-pick raycast (replaces click-while-locked).
- `renderer.setPixelRatio` from `rendererHints()`; `if (!document.hidden) render`.

### OrbitControls scenes (khipu, llm-router, anatomy-3d, rosie-3d, throne-room)
- Apply renderer hints + pixelRatio.
- `if (SZL_MOBILE) { rotateSpeed=0.6; zoomSpeed=0.8; enablePan=true; }`
- `if (!SZL_REDUCED) { /* auto-rotate / scene.rotation */ }`
- `particleScale()` halves star/nebula counts on mobile.
- Lighter bloom on mobile; battery-saver render pause.

### Root-served scripts (throne-room.js, live_wires_3d.js)
Served at a root path where ES `import` of a sibling is awkward → use **inline helpers**
(no import):
```js
const SZL_MOBILE  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const SZL_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SZL_PR      = Math.min(window.devicePixelRatio || 1, SZL_MOBILE ? 1.5 : 2);
(function(){ function vh(){document.documentElement.style.setProperty('--vh',(innerHeight*0.01)+'px');}
  vh(); addEventListener('resize',vh); addEventListener('orientationchange',vh); })();
```

### Landing / org-card pages
- Upgrade the viewport meta + inject PWA/iOS meta (idempotent).
- Hand-authored pages: append a scoped, additive `<style id="szl-mobile-safety">` block plus the
  `--vh` script. Built SPA pages: meta only.

---

## 4. Canonical asset

`szl-mobile-controls.js` (vanilla, zero-dep) is the single source of truth for touch input.
It exposes:
- **Statics:** `isMobileDevice()`, `prefersReducedMotion()`, `applyViewportVar()`,
  `rendererHints()` → `{antialias, powerPreference, pixelRatio}`, `particleScale()` → 0.5 / 1.
- **Instance:** `getMove()`, `consumeLook()`, `consumeFov()`, `enter()`, `exit()`,
  `.isMobile`, `.active`.
- Loadable as ES module (`import { SZLMobileControls }`) or `<script>` (sets
  `window.SZLMobileControls`).

The full canonical file lives at `/home/user/workspace/szl-shared-mobile/szl-mobile-controls.js`
and is deployed to each scene Space.

---

## 5. Verification checklist (per Space)

```bash
H="https://szlholdings-<name>.static.hf.space"      # static
# H="https://szlholdings-<name>.hf.space"           # docker
curl -s "$H/index.html?v=$(date +%s)" | grep -o 'theme-color\|viewport-fit=cover\|apple-mobile-web-app-capable'
curl -s -o /dev/null -w "%{http_code}" "$H/static/szl-mobile-controls.js"   # expect 200
curl -s "$H/app.js" | grep -c 'SZLMobileControls'                            # expect >0
```
Then a desktop screenshot to confirm the 3D scene still renders (additive proof).

---

*Signed — Yachay `<yachay@szlholdings.dev>` · SZL Holdings · Doctrine v11 LOCKED (749/14/163)*
