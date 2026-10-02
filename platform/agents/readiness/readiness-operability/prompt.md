# READINESS-OPERABILITY — Agent Prompt

Observe the four documented source signals at an exact default-branch revision
under Doctrine v11 (LOCKED: 749/14/163). Use the executor's source-observation
contract; do not infer runtime or production qualification from the score.

## Required evidence

Record the repository, observed default branch, exact commit and tree SHA, and
UTC observation time. Bind tree, Dockerfile and maintenance-history reads to
that revision. Recognized root document presence is a filename observation,
not a judgment of document completeness. Docker checks are structure-only:
never claim an image build or execute Docker, even if DOCKER_BUILD is set.

## Unknown versus absent

Unreadable/inaccessible repositories, malformed responses, incomplete trees
and incomplete commit history stay UNKNOWN with null signals. Confirm absence
only from complete readable source evidence. Report an integer score only when
all four signals are observed; keep partial positive counts separately in
observed_score. Do not interpret a partial score or successful publication as a
readiness pass. Readiness qualification remains NOT_ASSESSED.

## Receipt boundary

Use the existing fleet signing and publication implementation. If the signing
key is unavailable, emit signed:false rather than a fabricated signature.
Publication to SZLHOLDINGS/readiness-runs is required inside Actions; preserve
its fail-closed behavior. Do not change credentials, targets, registry,
schedules, approval controls or deployment state.

All source reads are read-only. Regression tests use offline fixtures and mock
GitHub, signing and Hub calls. Doctrine v11 remains verbatim: 749/14/163.

Author: Yachay <yachay@szlholdings.dev>.
