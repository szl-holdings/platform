# BEFORE / AFTER — SZL Holdings org avatar

## BEFORE — pixel-bee-with-B
The current HF org avatar is a black pixel-art bee carrying a lavender letter **B** on a
white rounded card (founder screenshot, 2026-05-30):

- Source screenshot: `/home/user/workspace/uploaded_attachments/c7480a9da79841f7be4da1beafd176f7/IMG_6284.jpeg`
- Live `avatarUrl` (read-only, from `GET /api/organizations/SZLHOLDINGS/overview`):
  `https://cdn-avatars.huggingface.co/v1/production/uploads/69ec7d565e5561c3b16baba8/jHG0FsF5DnUsv8ye3HkP2.png`

## AFTER — Inca avatar (khipu · amaru · lambda · chakana)
The new mark on navy `#0a0f1e`, Kanchay tokens only:

- Animated (main deliverable): `inca_avatar/avatar_animated.gif` (400×400, 16 fps, 16 s
  loop, 2.31 MB)
- Static preview: `inca_avatar/avatar_400.png`
- Vector: `inca_avatar/avatar_static.svg`
- Static SVG render proof: `inca_avatar/svgcheck.png`
- GIF frame proofs (loop sampled): `inca_avatar/gifcheck_0.png`, `gifcheck_64.png`,
  `gifcheck_128.png`

> A single side-by-side composite PNG was attempted but the sandbox blocked image
> compositing late in the session (process repeatedly killed on JPEG decode / Pillow /
> ImageMagick). The before and after images are provided as the separate files above and
> render correctly; reviewers can view them directly.

## Live verification (PENDING founder action)
HF exposes **no public API to set an organization avatar**, and the connected session token
lacks org-write permission (403 on repo writes). The avatar swap therefore requires the
3-click founder UI action documented in `HF_AVATAR_INSTALL.md`. After the founder uploads
`avatar_animated.gif`:

1. The live page **https://huggingface.co/SZLHOLDINGS** should show the new animated avatar.
2. Capture an "after" screenshot of the live org page and append it here.
3. A Lighthouse check on the org page should show no avatar-driven regression — the GIF is
   2.31 MB (under HF's 3 MB cap) and the SVG fallback is 16 KB; both are well within budget
   for a single above-the-fold image, so no measurable LCP/CLS impact is expected from the
   swap.

## Element check (defensible "this is authentically Inca")
| Element | Present | Primary citation |
|---|---|---|
| Khipu knotted cord (central) | ✓ | British Museum Am1907,0319.286; Smithsonian Quipu |
| Amaru serpent (wrapping, double-headed) | ✓ | Met 316938 (Inca serpent); Met 308485 (double-headed) |
| Lambda Λ (spine glyph, center) | ✓ | Λ-Spine aggregator, SF-07 (our own mark) |
| Chakana step-cross (background, C4) | ✓ | Getty CONA 901001774; chakana geometry ref |

— Yachay, 2026-06-01.
