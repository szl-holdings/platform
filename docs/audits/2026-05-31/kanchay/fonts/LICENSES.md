# Font Licenses — KANCHAY brand kit

All families are **SIL Open Font License 1.1** — free to use, embed, redistribute, no royalties.
Place the WOFF2 binaries alongside this file (self-hosted; no third-party CDN — sovereignty).

| Family | Source repo | License |
|---|---|---|
| Inter | https://github.com/rsms/inter | [OFL 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt) |
| IBM Plex Sans | https://github.com/IBM/plex | [OFL 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt) |
| IBM Plex Mono | https://github.com/IBM/plex | [OFL 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt) |
| JetBrains Mono | https://github.com/JetBrains/JetBrainsMono | [OFL 1.1](https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt) |

## Self-host install (npm)

```
npm i @fontsource-variable/inter @fontsource/ibm-plex-sans \
      @fontsource/ibm-plex-mono @fontsource-variable/jetbrains-mono
```

Then copy the WOFF2 files into this `fonts/` directory and reference them via the
`@font-face` blocks in `TYPOGRAPHY.md` (paths `../fonts/*.woff2`).

— Yachay, 2026-06-01. Open-source fonts only; no proprietary licensing.
