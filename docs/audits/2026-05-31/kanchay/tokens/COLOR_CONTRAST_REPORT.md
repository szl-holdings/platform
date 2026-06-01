# COLOR_TOKENS — WCAG Contrast Verification

SZL Holdings / KANCHAY palette. Ratios computed per WCAG 2.1 relative-luminance formula
([W3C WCAG 2.1 §1.4.3](https://www.w3.org/TR/WCAG21/#contrast-minimum)).
AA threshold: 4.5:1 normal text, 3:1 large text. AAA: 7:1 / 4.5:1.

| Pair | FG | BG | Ratio | AA | AAA | Large |
|---|---|---|---:|:--:|:--:|:--:|
| text on bg | `#f5f7fa` | `#0a0f1e` | 17.79 | PASS | PASS | no |
| text on surface | `#f5f7fa` | `#1b222c` | 14.92 | PASS | PASS | no |
| text-sub on bg | `#c9d2df` | `#0a0f1e` | 12.52 | PASS | PASS | no |
| text-ghost on bg (lg) | `#76859b` | `#0a0f1e` | 5.09 | PASS | PASS | yes |
| yuyay-300 on bg | `#5cc4bf` | `#0a0f1e` | 9.19 | PASS | PASS | no |
| yuyay-200 on bg | `#8fd9d5` | `#0a0f1e` | 11.87 | PASS | PASS | no |
| hatun-300 on bg | `#d7b96b` | `#0a0f1e` | 10.04 | PASS | PASS | no |
| hatun-200 on bg | `#e4cf99` | `#0a0f1e` | 12.44 | PASS | PASS | no |
| yawar-300 on bg | `#e57373` | `#0a0f1e` | 6.39 | PASS | — | no |
| success(light) on bg | `#3fce82` | `#0a0f1e` | 9.42 | PASS | PASS | no |
| warning(light) on bg | `#e4cf99` | `#0a0f1e` | 12.44 | PASS | PASS | no |
| error(light) on bg | `#f0a3a3` | `#0a0f1e` | 9.52 | PASS | PASS | no |
| info(light) on bg | `#7cb8e0` | `#0a0f1e` | 8.9 | PASS | PASS | no |
| gray-900 on gray-50 | `#10151c` | `#f5f7fa` | 17.07 | PASS | PASS | no |
| gray-700 on gray-50 | `#2a3340` | `#f5f7fa` | 11.89 | PASS | PASS | no |
| yuyay-700 on gray-50 | `#0b5957` | `#f5f7fa` | 7.58 | PASS | PASS | no |
| yawar-600 on gray-50 | `#a32a1f` | `#f5f7fa` | 6.73 | PASS | — | no |
| hatun-700 on gray-50 | `#825a18` | `#f5f7fa` | 5.71 | PASS | — | no |
| white on yuyay-600 | `#ffffff` | `#0f726e` | 5.75 | PASS | — | no |
| white on yawar-600 | `#ffffff` | `#a32a1f` | 7.22 | PASS | PASS | no |
| gray-950 on hatun-400 | `#0a0f1e` | `#cda64a` | 8.32 | PASS | PASS | no |

**Result: 21/21 pairs pass WCAG AA (17/21 also pass AAA).**

Apache-2.0 · ORCID 0009-0001-0110-4173 · — Yachay, 2026-06-01
