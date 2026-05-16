# SZL Holdings — Doctrine V6 (immutable)

**Version:** V6
**Author:** Lutar, Stephen P.
**Replay root:** `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`

---

## Identity (canonical)

| Field | Value |
|---|---|
| Byline | `Lutar, Stephen P.` |
| Forbidden in byline | `Jr.`, `Stephen Paul` |
| ORCID | `0009-0001-0110-4173` |
| Affiliation | SZL Holdings |
| Public email | `stephen@szlholdings.com` |
| GitHub username | `stephenlutar2-hash` |
| GitHub public email | `stephenlutar2@gmail.com` |
| GitHub display name target | `Lutar, Stephen P.` |
| LinkedIn | https://www.linkedin.com/in/stephen-l-279315240/ |
| Citizenship / Region | US citizen, NYC Metro |

## CITATION.cff canonical author block

```yaml
authors:
  - family-names: Lutar
    given-names: Stephen
    name-particle: P.
    email: stephen@szlholdings.com
    orcid: https://orcid.org/0009-0001-0110-4173
    affiliation: SZL Holdings
```

---

## 8 Forbidden Patterns (zero tolerance in text)

1. `Jr.`
2. `AlloyScape`
3. `Glass Wing`
4. `Glasswing`
5. `Mythos`
6. `Stephen Paul`
7. `Perplexity Computer`
8. `anonymous`

**Exception:** `Mythos` is allowed ONLY when citing Anthropic's "Claude Mythos Preview" as a third-party model name.

**USER OVERRIDE (preserved):** Git author metadata is intentionally `Stephen Paul Lutar Jr.` on 75 historical commits across 14 repos. DO NOT remediate git author lines, commit hashes, or signed-by trailers. Only flag textual content in files.

---

## Quality Gates

- **Slogan:** "no hallucinations, no bandaids; test test test"
- **9-axis Λ-gate:** conjunctive AND across all axes, threshold Λ ≥ 0.90
- **Critical axes:** `moralGrounding ≥ 0.95`, `measurabilityHonesty ≥ 0.95`
- **Replay:** 5× byte-identical replay required
- **Ingestion:** PUBLIC-ONLY (no private data, no proprietary corpora)
- **License allowlist:** Apache-2.0, MIT, BSD-3-Clause, CC-BY only

---

## Standing Stop-Gates (always require explicit confirm_action)

- Zenodo DOI mint
- arXiv submission
- npm publish if version exists
- Branch protection edits (per repo)
- New schedule_cron
- Force push to default branch
- Any push to live `szl-holdings/*` repository
