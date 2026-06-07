# Pin Recommendations — SZL Holdings GitHub

**Produced:** Phase D, April 2026  
**Note:** Pinning is a RECOMMENDATION only. Auto-pinning is not executed by this phase — GitHub's pinning API requires `admin:org` scope and is intentionally manual per org settings. Pin via the org's "Customize your organization" page.

---

## Org Profile Pin Recommendations

GitHub allows pinning up to 6 repositories on an organization profile page. With only 2 repos in the org, both should be pinned.

| Priority | Repo | Reason to Pin |
|----------|------|--------------|
| 1 | `szl-holdings/szl-holdings-platform` | Primary product; main trust signal; has CI/CodeQL badges, full documentation, architecture diagram |
| 2 | `szl-holdings/.github` | Org profile repo; surfaces the curated org README; investors who click the org see it immediately |

**How to pin:**
1. Navigate to `github.com/szl-holdings`
2. Click **Customize your organization** (top-right, requires org admin)
3. Under "Pinned repositories," select `szl-holdings-platform` and `.github`
4. Save

---

## Founder Profile Pin Recommendations

If the founder (`stephen-lutar` or equivalent GitHub user) has a public profile, the following pins are recommended on the personal profile:

| Priority | Repo | Reason |
|----------|------|--------|
| 1 | `szl-holdings/szl-holdings-platform` | Platform is the primary professional signal |
| 2 | *(no second public repo to pin)* | Remaining pins should be left empty or filled with a future open-source contribution if applicable |

**Avoid pinning:**
- Forks of other projects
- Tutorial or learning repos
- Empty or stub repos
- Any repo that hasn't been touched in 6+ months

---

## When to Revisit

- When additional public repos are created (open-source tooling, SDK releases, etc.)
- After a public launch to ensure the pinned set reflects current product priorities
- If the founder GitHub profile starts attracting investor traffic via the org link
