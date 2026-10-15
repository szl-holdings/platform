# Reviewed public workflow digest

The security readiness collector compares a SHA-256 digest of the complete named
Gitleaks workflow step before accepting its source. The constant is public source
admission metadata; it is never passed to an authentication or provider client.

The assignment was introduced in protected Platform PR #882, commit
`4d37b956685f6e52fa1ff13ee858416e095ad9e1`. Its source file has Git blob
`cf240ca2afed72b5346456790846ded4e31f686e` and remained unchanged at
`32f50018e3444ba78d774155cc427161f1017ce0` (PR #932). The earlier file at
`7cd2c5dede2b7dd28703c562c7d432fa04bc656d` lacks the assignment.

Security Audit run `38661334244`, job `116183046983`, reported one
`generic-api-key` finding at
`platform/agents/readiness/readiness-security/executor.py:36`. Its retained safe
artifact `11937884888` contains only rule, file and line metadata. The historical
fingerprint is bound to the source introduction above; the safe artifact does not
independently expose its commit or fingerprint. Native historical scanning must
pass before this finding is closed.

The current identifier is renamed from `PLATFORM_SECRET_STEP_SHA256` to
`PLATFORM_SCANNER_STEP_SHA256`. The digest bytes, named-step selection,
normalization and fail-closed comparison remain unchanged. The corresponding
`.gitleaksignore` admission binds only that original commit, path, rule and line.
A new commit, different path, different detector rule or moved line is outside
the admission. No scanner threshold, generic rule or path exclusion changes.

The existing root `.gitleaksignore` policy permits exact reviewed historical
false-positive fingerprints. This record supplements the generated config
justifications without editing their generated output. The existing hosted
policy-test command also checks the exact fingerprint and uses pinned Gitleaks
to prove future matches remain blocking.
