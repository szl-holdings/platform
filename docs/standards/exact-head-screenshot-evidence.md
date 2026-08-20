# Exact-head screenshot evidence

## Status

This standard replaces any requirement that screenshots be captured in a named vendor workspace, including Replit. Replit is not part of the current SZL toolchain.

The evidence burden is unchanged: current screenshots must be freshly captured from the exact candidate source in a clean, reproducible execution environment. A GitHub-hosted ephemeral runner is the canonical default.

## Admission contract

A screenshot is admissible only when one evidence record binds all of the following:

- repository and exact 40-character source SHA;
- open same-repository pull request number and its exact authorized candidate branch ref;
- workflow run ID and run attempt;
- runner operating-system image;
- Node.js, package-manager, Playwright, and browser versions;
- application start command or exact-source preview identity;
- route and final resolved URL;
- viewport width, height, and device scale factor;
- capture timestamp in UTC;
- page title, HTTP status, console-error count, and page-error count;
- screenshot path, byte length, and lowercase SHA-256 digest.

Each generated catalog row also carries the screenshot doctrine's route,
human-readable surface, capture date, capturing agent, capture environment,
source revision, attempt-specific workflow URL, viewport, workcell ID, proof
level, status, and notes. Missing catalog metadata fails verification.

The source pull request, source branch, checked-out `HEAD`, packet, and work item
must all identify the same candidate SHA. Revalidate both remote identities
immediately before artifact upload and again before work-item publication.

The capture must fail closed when:

- the checked-out SHA differs from the authorized candidate SHA;
- a tracked candidate file changes before capture or before the post-teardown integrity closure;
- the candidate checkout contains a tracked symbolic link or submodule that could resolve to
  mutable bytes outside the exact Git tree;
- an exact-source preview reports a different build revision;
- the application or route does not become ready within the bounded timeout;
- the page has horizontal overflow at a required viewport;
- the page remains in `CHECKING`, `CONNECTING`, `LOADING`, or another transient state;
- console or page errors exceed the declared acceptance contract;
- an output image predates the workflow or was copied from another directory;
- the evidence record, image bytes, and catalog digest do not agree.

The canonical A11oy route is `/a11oy/`. A successful HTTP response is not
sufficient: the rendered page must expose its readiness and main-content
markers and must not be the SPA's HTTP-200 not-found surface. Transient labels
are checked across visible body text as well as explicit status elements so an
unmarked `CONNECTING` or `Connecting to fabric...` state cannot be admitted.

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

Screenshot names include the normalized surface, ISO capture date, and
viewport. The retained artifact contains only the packet, catalog, and the
five files bound by that packet; unrelated current screenshots are excluded.
Candidate dependencies are installed without lifecycle scripts or a candidate
pnpmfile. Browser tooling and the controller are installed and executed from
the immutable protected workflow SHA on `main`. The candidate server then runs
as a dedicated unprivileged OS identity against read-only source. Its only
writable paths are a private runtime
home and bounded Vite caches. The screenshot, packet, catalog, and upload tree
live under a runner-owned `0700` evidence root outside the candidate checkout,
so the candidate identity cannot traverse or mutate them. After browser capture,
the workflow kills every process owned by the candidate identity, rechecks the
exact `HEAD` and clean tracked tree, verifies every evidence byte, and makes the
evidence tree read-only before upload.

The separate publication job receives issue-write permission only after
capture, verification, remote revalidation, and immutable artifact upload
succeed. A rerun updates the single exact-title promotion work item with its
exact run attempt, artifact name, artifact ID, download URL, and
uploaded-archive digest, and fails if duplicate open work items already exist.

Copied screenshots, hash-only assertions, local workstation provenance, cached previews without exact-source readback, and vendor-workspace labels are not current evidence.

## Claim boundary

This evidence proves source presentation in the recorded environment. It does not prove production deployment, customer traffic, uptime, business outcomes, or authorization to operate.
