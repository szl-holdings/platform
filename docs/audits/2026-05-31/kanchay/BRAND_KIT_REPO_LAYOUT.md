# szl-holdings/brand-kit — Repo Layout & Push Plan

**Repo:** `szl-holdings/brand-kit` (new). **License:** brand assets CC BY 4.0; code/tokens
Apache-2.0. **Attribution:** ORCID 0009-0001-0110-4173. **Signed:** Yachay, 2026-06-01.
ADDITIVE only — does not touch the existing `szl-holdings/szl-brand` repo.

## Layout

```
brand-kit/
├── README.md                      # overview, install, token usage, accessibility note
├── LICENSE                        # Apache-2.0 (code) — assets CC BY 4.0 noted in README
├── brand-bible.md                 # = kanchay/BRAND_BIBLE.md
├── TYPOGRAPHY.md                  # type system
├── COMPONENT_TOKENS.md            # spacing/radii/shadows/motion/z-index
├── logos/
│   ├── LOGO_SUITE.svg             # 4-lockup sheet
│   ├── kanchay-glyph.svg          # square primary mark
│   ├── kanchay-favicon.svg        # favicon source
│   ├── favicon.ico                # multi-res ico (16/32/64)
│   ├── ALTERNATES.svg             # 3 alternates
│   ├── LOGO_SUITE.md              # rationale + usage
│   └── png/                       # 16/32/64/128/256/512/1024 + favicons + previews
├── tokens/
│   ├── COLOR_TOKENS.json
│   ├── COLOR_TOKENS.css
│   ├── COLOR_TOKENS.scss
│   ├── COLOR_TOKENS.tailwind.config.js
│   ├── COMPONENT_TOKENS.css
│   └── COLOR_CONTRAST_REPORT.md   # WCAG AA verification (21/21 pass)
├── fonts/
│   └── LICENSES.md                # OFL 1.1 sources + self-host install (binaries added on use)
└── examples/
    ├── html/components.html       # button + card + alert (vanilla)
    ├── react/Components.tsx        # button + card + alert (React)
    └── vue/Components.vue          # button + card + alert (Vue 3)
```

## Provenance map (workspace → repo)

| Repo path | Source in `kanchay/` |
|---|---|
| `brand-bible.md` | `BRAND_BIBLE.md` |
| `TYPOGRAPHY.md` | `TYPOGRAPHY.md` |
| `COMPONENT_TOKENS.md` | `COMPONENT_TOKENS.md` |
| `logos/*` | `logos/*` |
| `logos/png/*` | `renders/*` |
| `tokens/*` | `tokens/*` |
| `fonts/LICENSES.md` | `fonts/LICENSES.md` |
| `examples/*` | `examples/*` |

## Push procedure (gh CLI, api_credentials=["github"])

```bash
# auth comes from the github credential preset
gh repo create szl-holdings/brand-kit --public \
  --description "SZL Holdings / KANCHAY brand kit: tokens, logos, fonts, examples" || true
# assemble staging dir, then:
git init && git add -A
git -c user.name="Yachay" -c user.email="<orcid>@szl" commit \
  -m "feat(brand-kit): KANCHAY tokens, logo suite, typography, examples (additive)"
git push --set-upstream https://<token>@github.com/szl-holdings/brand-kit main
```

A banned-token scan (Doctrine v6 ban-list) runs over all text before push; push aborts on any
hit. No v11 LOCKED number is referenced as changed anywhere in the repo.

## Push status

See `PUSH_LOG.md` (written by the push step) for the resulting commit SHA and `gh` output, or
the auth-error capture if the GitHub credential is unavailable in this environment.
