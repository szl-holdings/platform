# Overlay 0004 — `src/cmd/bundle.go`: map `VerifyError.Code` to process exit codes

**Apply mode:** Manual edit (insertion + new helper + new test file).
**Files:** `src/cmd/bundle.go`, `src/cmd/bundle_verify_offline_test.go` (new)
**SPDX-License-Identifier:** Apache-2.0 OR AGPL-3.0-or-later

## Why

CI gates and operator scripts need to branch on the failure mode without
parsing log output. The mapping below is locked by the unit test in
this overlay; the same table is documented in
`docs/reference/attestations.mdx`.

| Code               | Exit |
| ------------------ | ---- |
| (success)          | 0    |
| (generic / I/O)    | 1    |
| `BROKEN_CHAIN`     | 2    |
| `BAD_SIGNATURE`    | 3    |
| `MISSING_ARTIFACT` | 4    |
| `UNKNOWN_SIGNER`   | 5    |
| `MALFORMED`        | 6    |
| `BAD_INDEX`        | 7    |

## Insertion 1 — inside `verifyCmd.Run`

Replace the existing fatal-on-error block:

```go
if err := b.Verify(); err != nil {
    message.Fatalf(err, "bundle verify failed")
}
```

with:

```go
if err := b.Verify(); err != nil {
    os.Exit(verifyExitCode(err))
}
```

## Insertion 2 — new helper at the bottom of `bundle.go`

```go
// verifyExitCode maps an attest.VerifyError to a stable, scriptable
// process exit code. Non-attest errors get exit 1 (generic).
func verifyExitCode(err error) int {
    var ve *attest.VerifyError
    if !errors.As(err, &ve) {
        message.WarnErr(err, "bundle verify failed")
        return 1
    }
    message.Warnf("offline verify failed: %s — %v", ve.Code, ve.Err)
    switch ve.Code {
    case attest.CodeBrokenChain:
        return 2
    case attest.CodeBadSignature:
        return 3
    case attest.CodeMissingArtifact:
        return 4
    case attest.CodeUnknownSigner:
        return 5
    case attest.CodeMalformed:
        return 6
    case attest.CodeBadIndex:
        return 7
    }
    return 1
}
```

## Insertion 3 — new file `src/cmd/bundle_verify_offline_test.go`

```go
// Lock the exit-code contract documented in
// docs/reference/attestations.mdx. If anyone reshuffles the codes,
// downstream CI gates and operator scripts silently break — these
// tests trip first so the regression is caught at PR time.
//
// Copyright 2026 SZL Holdings
// SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
package cmd

import (
    "errors"
    "io"
    "testing"

    "github.com/defenseunicorns/uds-cli/src/pkg/attest"
)

func TestVerifyExitCode_Mapping(t *testing.T) {
    cases := []struct {
        name string
        err  error
        want int
    }{
        {"generic_io", io.ErrUnexpectedEOF, 1},
        {"nil_attest_error", errors.New("boom"), 1},
        {"broken_chain", &attest.VerifyError{Code: attest.CodeBrokenChain, Err: errors.New("x")}, 2},
        {"bad_signature", &attest.VerifyError{Code: attest.CodeBadSignature, Err: errors.New("x")}, 3},
        {"missing_artifact", &attest.VerifyError{Code: attest.CodeMissingArtifact, Err: errors.New("x")}, 4},
        {"unknown_signer", &attest.VerifyError{Code: attest.CodeUnknownSigner, Err: errors.New("x")}, 5},
        {"malformed", &attest.VerifyError{Code: attest.CodeMalformed, Err: errors.New("x")}, 6},
        {"bad_index", &attest.VerifyError{Code: attest.CodeBadIndex, Err: errors.New("x")}, 7},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            if got := verifyExitCode(tc.err); got != tc.want {
                t.Fatalf("verifyExitCode(%s) = %d, want %d", tc.name, got, tc.want)
            }
        })
    }
}
```

## Imports to add to `bundle.go`

```go
import (
    "errors"
    "os"

    "github.com/defenseunicorns/uds-cli/src/pkg/attest"
)
```
