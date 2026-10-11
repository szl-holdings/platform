# Current-Tree Secret Scan Evidence

**Generated:** 2026-10-07
**Verdict:** CLEAN
**Command:** `node scripts/qa/scan-secrets.js .`
**Observed output:** `CLEAN — no secrets found.`

## Scope

The repository's dependency-free secondary scanner examined the readable files
in the current working tree. Its candidate extensions include JavaScript,
TypeScript, JSON, YAML, shell, environment templates, Markdown, private-key
extensions, and Python source. Installed dependencies and repository metadata
are excluded; generated-name directories are otherwise scanned. The scanner
fails closed on an unreadable path, an unreadable candidate file, or its file
limit.

The result means that no configured credential or private-key pattern was found
in the current readable tree. It does not establish that credentials are
configured in any deployment or vault.

## Limits and remaining release checks

- This command does not scan git history. The required CI gitleaks job must scan
  the full history before a public release.
- This command is a project-specific secondary detector, not a substitute for
  the required gitleaks workflow or provider-side credential review.
- Example and placeholder values can be admitted only by the scanner's narrow,
  path-qualified exceptions; an admitted example is not evidence that a real
  secret exists or is valid.
- Deployment secret presence, allowed egress domains, least-privilege policy,
  and rotation status require independent environment evidence.

## Regression evidence

`node --test --test-isolation=none scripts/qa/scan-secrets.test.js` covers
private-key formats, missing and unreadable paths, file-limit exhaustion,
repository-sized trees, dependency-directory exclusions, the path-qualified
lockfile exception, the exact AWS documentation example, and project-specific
patterns in Python source.
