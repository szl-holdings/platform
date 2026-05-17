// Package attest implements the in-bundle, hash-chained attestation
// manifest written to /uds-bundle/attestations.jsonl during
// `uds-cli bundle create --attest` and walked by
// `uds-cli bundle verify --offline`.
//
// The chain semantics are ported from SZL Holdings' a11oy-code
// proof-ledger (tools/a11oy-code/src/proof.mjs in the SZL platform
// monorepo), adapted to Go.
//
// Copyright 2026 SZL Holdings
// SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
package attest

import (
        "bufio"
        "crypto/sha256"
        "encoding/hex"
        "encoding/json"
        "errors"
        "fmt"
        "io"
        "os"
        "sort"
        "time"
)

// ManifestPath is the well-known path inside the bundle's .tar.zst
// payload where the attestation sidecar lives.
const ManifestPath = "uds-bundle/attestations.jsonl"

// GenesisPrevHash is the prev_hash value used for the first record in
// a fresh chain. 64 zero hex chars = sha256 width.
const GenesisPrevHash = "0000000000000000000000000000000000000000000000000000000000000000"

// Record is one line of attestations.jsonl. Field tags match the
// payload schema in docs/reference/attestations.mdx exactly.
type Record struct {
        I          int       `json:"i"`
        TS         time.Time `json:"ts"`
        Component  string    `json:"component"`
        Artifact   string    `json:"artifact"`
        SHA256     string    `json:"sha256"`
        PrevHash   string    `json:"prev_hash"`
        ThisHash   string    `json:"this_hash"`
        SignerDID  string    `json:"signer_did"`
        Sig        Signature `json:"sig"`
}

// Signature carries the hybrid Ed25519 + ML-DSA-65 signature pair.
// Both are hex-encoded over the canonical bytes of the record with
// `this_hash` and `sig` zeroed.
type Signature struct {
        Ed25519 string `json:"ed25519"`
        MLDSA65 string `json:"ml-dsa-65"`
}

// Artifact is one input to BuildManifest — a single emitted file or
// image whose sha256 should be chained into the manifest.
type Artifact struct {
        Component string
        Ref       string // e.g. ghcr.io/szl-holdings/a11oy:v1.0.0-alpha or relative path
        SHA256    string // lowercase hex sha256 of the artifact bytes
}

// Signer abstracts the hybrid signer so callers can swap in HSM-backed
// or KMS-backed implementations. The default file-keypair impl is in
// signer.go (NewFileSigner).
type Signer interface {
        DID() string
        Sign(payload []byte) (Signature, error)
}

// Verifier resolves a signer DID to the public-key material needed to
// verify a Record's Signature. The default in-memory trust-root impl
// is in signer.go (NewTrustRoot).
type Verifier interface {
        Verify(did string, payload []byte, sig Signature) error
}

// BuildManifest writes the attestation chain to w. Records are emitted
// in the order given; chain index `i` and `prev_hash` are filled in
// here so callers cannot accidentally desync them.
func BuildManifest(w io.Writer, signer Signer, artifacts []Artifact, now func() time.Time) error {
        if signer == nil {
                return errors.New("attest: nil signer")
        }
        if now == nil {
                now = time.Now
        }

        bw := bufio.NewWriter(w)
        prev := GenesisPrevHash

        for idx, art := range artifacts {
                rec := Record{
                        I:         idx,
                        TS:        now().UTC(),
                        Component: art.Component,
                        Artifact:  art.Ref,
                        SHA256:    art.SHA256,
                        PrevHash:  prev,
                        SignerDID: signer.DID(),
                }

                payload, err := canonicalPayload(rec)
                if err != nil {
                        return fmt.Errorf("attest: canonicalize record %d: %w", idx, err)
                }

                sig, err := signer.Sign(payload)
                if err != nil {
                        return fmt.Errorf("attest: sign record %d: %w", idx, err)
                }
                rec.Sig = sig
                rec.ThisHash = chainHash(prev, payload)

                line, err := json.Marshal(rec)
                if err != nil {
                        return fmt.Errorf("attest: marshal record %d: %w", idx, err)
                }
                if _, err := bw.Write(line); err != nil {
                        return err
                }
                if err := bw.WriteByte('\n'); err != nil {
                        return err
                }
                prev = rec.ThisHash
        }

        return bw.Flush()
}

// VerifyOffline reads an attestations.jsonl stream and walks the chain.
// It enforces, in order: monotonic `i`, prev_hash linkage, signature
// validity against `trust`, and (if expected is non-empty) that every
// artifact in expected appears in the chain with a matching sha256.
//
// On any failure it returns a *VerifyError with a structured Code so
// callers (and CI) can branch on the failure mode.
func VerifyOffline(r io.Reader, trust Verifier, expected map[string]string) error {
        if trust == nil {
                return errors.New("attest: nil trust root")
        }
        scanner := bufio.NewScanner(r)
        scanner.Buffer(make([]byte, 64*1024), 4*1024*1024)

        prev := GenesisPrevHash
        seen := map[string]string{}
        idx := 0

        for scanner.Scan() {
                var rec Record
                if err := json.Unmarshal(scanner.Bytes(), &rec); err != nil {
                        return &VerifyError{Code: CodeMalformed, Index: idx, Err: err}
                }
                if rec.I != idx {
                        return &VerifyError{Code: CodeBadIndex, Index: idx,
                                Err: fmt.Errorf("expected i=%d, got %d", idx, rec.I)}
                }
                if rec.PrevHash != prev {
                        return &VerifyError{Code: CodeBrokenChain, Index: idx,
                                Err: fmt.Errorf("prev_hash mismatch: expected %s, got %s", prev, rec.PrevHash)}
                }

                payload, err := canonicalPayload(rec)
                if err != nil {
                        return &VerifyError{Code: CodeMalformed, Index: idx, Err: err}
                }
                if got := chainHash(prev, payload); got != rec.ThisHash {
                        return &VerifyError{Code: CodeBrokenChain, Index: idx,
                                Err: fmt.Errorf("this_hash recompute mismatch: expected %s, got %s", rec.ThisHash, got)}
                }
                if err := trust.Verify(rec.SignerDID, payload, rec.Sig); err != nil {
                        // Preserve the structured failure mode: an unknown signer
                        // must NOT be collapsed into a bad-signature error — the
                        // two have distinct exit codes (5 vs 3) and distinct
                        // operational remediations.
                        var inner *VerifyError
                        if errors.As(err, &inner) {
                                return &VerifyError{Code: inner.Code, Index: idx, Err: err}
                        }
                        return &VerifyError{Code: CodeBadSignature, Index: idx, Err: err}
                }

                seen[rec.Artifact] = rec.SHA256
                prev = rec.ThisHash
                idx++
        }
        if err := scanner.Err(); err != nil {
                return &VerifyError{Code: CodeMalformed, Index: idx, Err: err}
        }

        if expected != nil {
                // Stable order so error messages are deterministic.
                keys := make([]string, 0, len(expected))
                for k := range expected {
                        keys = append(keys, k)
                }
                sort.Strings(keys)
                for _, ref := range keys {
                        want := expected[ref]
                        got, ok := seen[ref]
                        if !ok {
                                // Chain-wide failure — no single record to point at.
                                // Index=-1 matches the contract on VerifyError.
                                return &VerifyError{Code: CodeMissingArtifact, Index: -1,
                                        Err: fmt.Errorf("artifact %q not present in chain", ref)}
                        }
                        if got != want {
                                return &VerifyError{Code: CodeBadSignature, Index: -1,
                                        Err: fmt.Errorf("artifact %q sha256 mismatch: want %s, got %s", ref, want, got)}
                        }
                }
        }

        return nil
}

// VerifyErrorCode enumerates the structured failure modes the CLI surfaces.
type VerifyErrorCode string

const (
        CodeMalformed       VerifyErrorCode = "MALFORMED"
        CodeBadIndex        VerifyErrorCode = "BAD_INDEX"
        CodeBrokenChain     VerifyErrorCode = "BROKEN_CHAIN"
        CodeBadSignature    VerifyErrorCode = "BAD_SIGNATURE"
        CodeMissingArtifact VerifyErrorCode = "MISSING_ARTIFACT"
        CodeUnknownSigner   VerifyErrorCode = "UNKNOWN_SIGNER"
)

// VerifyError is returned by VerifyOffline. The Code is the CLI exit
// reason; Index is the 0-based record where the failure occurred (or
// -1 for whole-chain failures like MISSING_ARTIFACT).
type VerifyError struct {
        Code  VerifyErrorCode
        Index int
        Err   error
}

func (e *VerifyError) Error() string {
        if e.Index >= 0 {
                return fmt.Sprintf("attest: %s at record %d: %v", e.Code, e.Index, e.Err)
        }
        return fmt.Sprintf("attest: %s: %v", e.Code, e.Err)
}

func (e *VerifyError) Unwrap() error { return e.Err }

// canonicalPayload returns the bytes that get hashed and signed: the
// record with `this_hash` and `sig` cleared, JSON-encoded with stable
// field order (encoding/json sorts struct fields by declaration, so
// this is deterministic as long as Record's tags don't move).
func canonicalPayload(rec Record) ([]byte, error) {
        rec.ThisHash = ""
        rec.Sig = Signature{}
        return json.Marshal(rec)
}

// chainHash mirrors tools/a11oy-code/src/proof.mjs `hashOf`:
// sha256(prev || canonical_payload), full 64-char hex. (The .mjs impl
// truncates to 16 chars for human-readability in a local CLI ledger;
// here we keep the full 64 chars because this chain travels offline
// and we don't want birthday-bound collisions to be reachable.)
func chainHash(prev string, payload []byte) string {
        h := sha256.New()
        h.Write([]byte(prev))
        h.Write(payload)
        return hex.EncodeToString(h.Sum(nil))
}

// SHA256File is a small helper used by create.go to hash an emitted
// artifact file by path.
func SHA256File(path string) (string, error) {
        f, err := os.Open(path)
        if err != nil {
                return "", err
        }
        defer f.Close()
        h := sha256.New()
        if _, err := io.Copy(h, f); err != nil {
                return "", err
        }
        return hex.EncodeToString(h.Sum(nil)), nil
}
