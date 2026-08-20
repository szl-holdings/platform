# Exact-head screenshot evidence

## Status

This standard replaces any requirement that screenshots be captured in a named vendor workspace, including Replit. Replit is not part of the current SZL toolchain.

The evidence burden is unchanged: current screenshots must be freshly captured from the exact candidate source in a clean, reproducible execution environment. A GitHub-hosted ephemeral runner is the canonical default.

## Admission contract

A screenshot is admissible only when one evidence record binds all of the following:

- repository and exact 40-character source SHA;
- pull request number or protected-branch ref;
- workflow run ID and run attempt;
- runner operating-system image;
- Node.js, package-manager, Playwright, and browser versions;
- application start command or exact-source preview identity;
- route and final resolved URL;
- viewport width, height, and device scale factor;
- capture timestamp in UTC;
- page title, HTTP status, console-error count, and page-error count;
- screenshot path, byte length, and lowercase SHA-256 digest.

The capture must fail closed when:

- the checked-out SHA differs from the authorized candidate SHA;
- an exact-source preview reports a different build revision;
- the application or route does not become ready within the bounded timeout;
- the page has horizontal overflow at a required viewport;
- the page remains in `CHECKING`, `CONNECTING`, `LOADING`, or another transient state;
- console or page errors exceed the declared acceptance contract;
- an output image predates the workflow or was copied from another directory;
- the evidence record, image bytes, and catalog digest do not agree.

## Required viewports

The default Series A matrix is:

```text
phone      390 x 844
portrait   768 x 1024
desktop   1440 x 1100
full-hd   1920 x 1080
ultrawide 2560 x 1440
```

A narrower route-specific matrix may be approved only when the proof packet explains why the omitted viewport cannot alter the claim.

## Storage and review

Fresh current images belong under `docs/assets/screenshots/current/`. The catalog must record the evidence fields above and the exact PNG SHA-256. Workflow artifacts may retain the complete browser trace and machine-readable evidence packet.

Copied screenshots, hash-only assertions, local workstation provenance, cached previews without exact-source readback, and vendor-workspace labels are not current evidence.

## Claim boundary

This evidence proves source presentation in the recorded environment. It does not prove production deployment, customer traffic, uptime, business outcomes, or authorization to operate.
