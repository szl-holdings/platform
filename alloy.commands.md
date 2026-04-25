# Alloy Command Prompts — SZL Holdings Ecosystem

Copy-paste these prompts directly into Alloy to automate common engineering workflows. Each prompt is self-contained and context-aware for the SZL Holdings monorepo.

---

## Status

### Platform Health Check
```
Review the current health of the SZL Holdings platform. Check the status of all 14 artifacts (szl-holdings, api-server, command, pulse, aegis, vessels, terra, counsel, sentra, lyte-command-center, a11oy, carlota-jo, szl-holdings-mobile, szl-demo-video), verify CI workflows are green, confirm no open P0/P1 GitHub Issues, and summarize any active incidents. Output a traffic-light status (green/yellow/red) for each artifact.
```

### Daily Standup Digest
```
Generate a daily standup digest for the SZL Holdings engineering team. Include: yesterday's merged PRs, today's open PRs needing review, any CI failures, and key tasks in progress. Keep it under 300 words, bullet-point format.
```

### Artifact Route Status
```
Verify the route manifest in ops/audit/routes.json is current. Cross-check each app's listed routes against its actual source files in artifacts/. Report any routes that appear in the manifest but don't exist in code, and any routes in code that are missing from the manifest.
```

---

## Release

### Draft Release Notes
```
Draft release notes for the next SZL Holdings release. Read CHANGELOG.md (Unreleased section) and the last 20 merged PRs. Write a two-paragraph executive summary, then a grouped changelog (New Features / Improvements / Bug Fixes / Under the Hood). Tone: clear, confident, non-technical. Do not increment the version number — just draft the copy.
```

### Release Readiness Gate
```
Run the SZL Holdings release readiness gate. Verify: (1) pnpm brand:check passes, (2) pnpm typecheck passes, (3) all unit tests pass, (4) pnpm audit:mocks and pnpm audit:routes pass, (5) no draft or unresolved PRs blocking the release, (6) CHANGELOG.md Unreleased section is populated. Report pass/fail per item with remediation steps for any failures.
```

### Pre-Tag Checklist
```
Execute the SZL Holdings pre-tag release checklist:
□ CI is green on main
□ pnpm build passes for all artifacts  
□ pnpm test passes
□ pnpm qa:site passes
□ CHANGELOG.md has an Unreleased section with content
□ package.json versions are consistent
□ No open P0/P1 bugs
□ Brand strings check passes
□ Release notes are drafted

Report the status of each item. For any failures, provide the exact command to investigate further.
```

### Changelog Update
```
Update CHANGELOG.md with entries for all PRs merged since the last version tag. Read the git log and PR descriptions. Group entries as: Added, Changed, Fixed, Removed — following Keep a Changelog 1.0.0 conventions. Write present-tense entries. Insert under the [Unreleased] section header. Do not create a new version tag.
```

---

## Triage

### CI Failure Investigation
```
Investigate all failing GitHub Actions workflows in the SZL Holdings repository. For each failure: (1) identify the workflow and failing job, (2) extract the error message, (3) determine the likely root cause (flaky test, regression, dep issue, config error), (4) find the commit that introduced the failure, (5) suggest a fix. Prioritize deployment-blocking failures first.
```

### Issue Triage Sweep
```
Triage all GitHub Issues filed in the SZL Holdings repository in the past 7 days that have no labels or assignee. For each: assign severity (P0-P3), suggest the affected artifact, recommend labels, determine type (bug/feature/question), and draft a 2-sentence initial response. Flag any P0/P1 for immediate attention in a summary at the top.
```

### Incident Postmortem Template
```
Generate an incident postmortem for a SZL Holdings production incident. Fill in the template with the information available:
- Summary (1 paragraph)
- Timeline (bullet points with timestamps)
- Root Cause
- Contributing Factors
- Impact (users, duration, data)
- Detection Method
- Resolution Steps
- Action Items (prevent recurrence)
Use the format from industry-standard postmortems (Google SRE style).
```

---

## Quality

### Bug Scan
```
Scan the SZL Holdings monorepo for potential bugs. Look for: unhandled promise rejections, React components without error boundaries, unsafe TypeScript casts, API routes missing input validation, database queries without error handling, hardcoded credentials or URLs. Output findings sorted by severity (critical/high/medium/low) with file path, line number, and suggested fix for each.
```

### Test Gap Analysis
```
Identify the top 10 test gaps in the SZL Holdings monorepo. Compare source files to test files. Prioritize: API routes without integration tests, utility functions used by multiple packages without unit tests, React components handling data mutations without tests, and any new files added in the last 2 weeks without test coverage. Output a prioritized list with suggested test descriptions.
```

### Code Review Sweep
```
Perform a code quality sweep on all files changed in the last 5 merged PRs in the SZL Holdings monorepo. Check for: consistent error handling patterns, proper TypeScript types (no implicit any), adherence to the shared design system (no raw hex values), accessibility (aria labels on interactive elements), and copy/paste duplication that should be extracted to a shared utility. Output findings by file.
```

### Dead Code Detection
```
Find dead code in the SZL Holdings monorepo. Look for: exported functions with no imports, React components defined but never rendered, TypeScript interfaces with no implementations, feature flags that are always true/false, and commented-out code blocks larger than 5 lines. Report by file with line numbers. Mark each as: safe to delete, needs investigation, or keep (explain why).
```

---

## Repo

### Dependency Drift Audit
```
Audit dependency drift across the SZL Holdings pnpm monorepo. Run pnpm outdated in all workspaces. Identify: packages with major upgrades available, packages with known CVEs, packages that appear at different versions across workspaces (catalog violations), and packages that are deprecated. Output a risk-ranked upgrade plan with the command to upgrade each package.
```

### Package Boundary Check
```
Verify package boundaries in the SZL Holdings monorepo are respected. Check that: artifacts only import from lib/ and packages/ (not from other artifacts), the api-server does not import from frontend artifacts, shared types only come from packages/shared-types, and there are no circular dependencies between packages. Report any violations with the full import path.
```

### AGENTS.md Accuracy Check
```
Verify AGENTS.md is accurate for the current state of the SZL Holdings monorepo. Cross-check: (1) artifact list against registered artifacts in artifact.toml files, (2) command reference against package.json scripts, (3) route list against ops/audit/routes.json, (4) CI workflow names against .github/workflows/, (5) environment variables against .env.example. Report any outdated information with suggested text corrections.
```

### Stale Branch Cleanup
```
Identify stale branches in the SZL Holdings repository that are safe to delete. Find branches: merged to main more than 2 weeks ago, with no commits in the last 30 days and no open PR, or prefixed with test- or wip- with no recent activity. List the branch names, last commit date, and whether the PR was merged or closed. Do not delete anything — just report.
```

---

## Growth

### Skill Investment Recommendations
```
Analyze the SZL Holdings monorepo and recommend the top 5 engineering skill investments for the team. Consider: test coverage gaps suggesting QA skill needs, repeated manual processes ripe for automation, new technologies appearing in dependencies, architectural inconsistencies suggesting need for shared patterns, and operational gaps (observability, on-call runbooks). For each recommendation: explain the gap, the skill needed, and the concrete benefit.
```

### Automation Opportunity Scan
```
Scan the SZL Holdings platform for automation opportunities. Look for: manual scripts that run via npm that could be scheduled GitHub Actions, QA steps in release checklist that could be CI gates, repeated boilerplate in artifact setups that could be a generator, and developer workflows that require multiple manual steps. Output a ranked list of automation opportunities with estimated implementation effort (S/M/L).
```

### Architecture Review
```
Conduct a high-level architecture review of the SZL Holdings monorepo. Assess: (1) separation of concerns between artifacts, lib/, and packages/, (2) API contract consistency between frontend and api-server, (3) data fetching patterns (are they consistent?), (4) authentication and authorization patterns, (5) observability (logging, error reporting, metrics). Highlight strengths, risks, and the top 3 architectural improvements to prioritize.
```
