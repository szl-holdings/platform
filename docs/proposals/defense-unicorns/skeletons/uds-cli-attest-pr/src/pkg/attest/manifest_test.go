// Round-trip + tamper tests for the in-bundle attestation manifest.
// These exercise the spec'd acceptance criteria:
//
//   * chain linkage is enforced (broken prev_hash -> BROKEN_CHAIN)
//   * hash recompute is enforced (tampered record -> BROKEN_CHAIN)
//   * signature is enforced (mutated sig -> BAD_SIGNATURE)
//   * unknown signer -> UNKNOWN_SIGNER
//   * missing artifact -> MISSING_ARTIFACT
//   * BenchmarkBuild10 backstops the "≤ 2s on 10 components" criterion
//
// Copyright 2026 SZL Holdings
// SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
package attest

import (
        "bytes"
        "crypto/ed25519"
        "crypto/rand"
        "encoding/hex"
        "encoding/json"
        "errors"
        "strings"
        "testing"
        "time"

        "github.com/cloudflare/circl/sign/mldsa/mldsa65"
)

func fixedNow() time.Time {
        return time.Date(2026, 5, 16, 8, 30, 0, 0, time.UTC)
}

// inMemorySigner sidesteps the on-disk key-loading path in tests.
type inMemorySigner struct {
        did    string
        edPriv ed25519.PrivateKey
        pqPriv *mldsa65.PrivateKey
}

func (s *inMemorySigner) DID() string { return s.did }
func (s *inMemorySigner) Sign(payload []byte) (Signature, error) {
        edSig := ed25519.Sign(s.edPriv, payload)
        pqSig := make([]byte, mldsa65.SignatureSize)
        if err := mldsa65.SignTo(s.pqPriv, payload, nil, false, pqSig); err != nil {
                return Signature{}, err
        }
        return Signature{
                Ed25519: hex.EncodeToString(edSig),
                MLDSA65: hex.EncodeToString(pqSig),
        }, nil
}

func newTestSigner(t *testing.T, did string) (*inMemorySigner, *TrustRoot) {
        t.Helper()
        edPub, edPriv, err := ed25519.GenerateKey(rand.Reader)
        if err != nil {
                t.Fatalf("ed25519 keygen: %v", err)
        }
        pqPub, pqPriv, err := mldsa65.GenerateKey(rand.Reader)
        if err != nil {
                t.Fatalf("ml-dsa-65 keygen: %v", err)
        }
        tr := NewTrustRoot()
        tr.Add(did, edPub, pqPub)
        return &inMemorySigner{did: did, edPriv: edPriv, pqPriv: pqPriv}, tr
}

func sampleArtifacts() []Artifact {
        return []Artifact{
                {Component: "a11oy", Ref: "ghcr.io/szl-holdings/a11oy:v1.0.0-alpha",
                        SHA256: strings.Repeat("a", 64)},
                {Component: "sentra", Ref: "ghcr.io/szl-holdings/sentra:v1.0.0-alpha",
                        SHA256: strings.Repeat("b", 64)},
                {Component: "amaru", Ref: "ghcr.io/szl-holdings/amaru:v1.0.0-alpha",
                        SHA256: strings.Repeat("c", 64)},
        }
}

func TestBuildAndVerify_RoundTrip(t *testing.T) {
        signer, trust := newTestSigner(t, "did:plat:szl-test")
        var buf bytes.Buffer
        if err := BuildManifest(&buf, signer, sampleArtifacts(), fixedNow); err != nil {
                t.Fatalf("build: %v", err)
        }
        expected := map[string]string{
                "ghcr.io/szl-holdings/a11oy:v1.0.0-alpha":  strings.Repeat("a", 64),
                "ghcr.io/szl-holdings/sentra:v1.0.0-alpha": strings.Repeat("b", 64),
                "ghcr.io/szl-holdings/amaru:v1.0.0-alpha":  strings.Repeat("c", 64),
        }
        if err := VerifyOffline(bytes.NewReader(buf.Bytes()), trust, expected); err != nil {
                t.Fatalf("verify clean bundle: %v", err)
        }
}

func TestVerify_DetectsTamperedSHA(t *testing.T) {
        signer, trust := newTestSigner(t, "did:plat:szl-test")
        var buf bytes.Buffer
        if err := BuildManifest(&buf, signer, sampleArtifacts(), fixedNow); err != nil {
                t.Fatalf("build: %v", err)
        }

        // Flip one byte in record #1's payload (the sha256 field).
        lines := bytes.Split(bytes.TrimRight(buf.Bytes(), "\n"), []byte("\n"))
        var rec Record
        if err := json.Unmarshal(lines[1], &rec); err != nil {
                t.Fatalf("unmarshal: %v", err)
        }
        rec.SHA256 = strings.Repeat("d", 64) // attacker swaps the artifact
        tampered, _ := json.Marshal(rec)
        lines[1] = tampered
        mutated := bytes.Join(lines, []byte("\n"))
        mutated = append(mutated, '\n')

        err := VerifyOffline(bytes.NewReader(mutated), trust, nil)
        var ve *VerifyError
        if !errors.As(err, &ve) {
                t.Fatalf("expected *VerifyError, got %v", err)
        }
        if ve.Code != CodeBrokenChain {
                t.Fatalf("expected BROKEN_CHAIN, got %s", ve.Code)
        }
}

func TestVerify_DetectsBrokenPrevHash(t *testing.T) {
        signer, trust := newTestSigner(t, "did:plat:szl-test")
        var buf bytes.Buffer
        if err := BuildManifest(&buf, signer, sampleArtifacts(), fixedNow); err != nil {
                t.Fatalf("build: %v", err)
        }

        lines := bytes.Split(bytes.TrimRight(buf.Bytes(), "\n"), []byte("\n"))
        var rec Record
        if err := json.Unmarshal(lines[2], &rec); err != nil {
                t.Fatalf("unmarshal: %v", err)
        }
        rec.PrevHash = strings.Repeat("0", 64) // attacker tries to splice
        tampered, _ := json.Marshal(rec)
        lines[2] = tampered
        mutated := bytes.Join(lines, []byte("\n"))
        mutated = append(mutated, '\n')

        err := VerifyOffline(bytes.NewReader(mutated), trust, nil)
        var ve *VerifyError
        if !errors.As(err, &ve) || ve.Code != CodeBrokenChain {
                t.Fatalf("expected BROKEN_CHAIN, got %v", err)
        }
}

func TestVerify_DetectsBadSignature(t *testing.T) {
        signer, trust := newTestSigner(t, "did:plat:szl-test")
        var buf bytes.Buffer
        if err := BuildManifest(&buf, signer, sampleArtifacts(), fixedNow); err != nil {
                t.Fatalf("build: %v", err)
        }

        lines := bytes.Split(bytes.TrimRight(buf.Bytes(), "\n"), []byte("\n"))
        var rec Record
        if err := json.Unmarshal(lines[0], &rec); err != nil {
                t.Fatalf("unmarshal: %v", err)
        }
        // Flip the last hex char of the ed25519 sig.
        last := rec.Sig.Ed25519[len(rec.Sig.Ed25519)-1]
        if last == '0' {
                rec.Sig.Ed25519 = rec.Sig.Ed25519[:len(rec.Sig.Ed25519)-1] + "1"
        } else {
                rec.Sig.Ed25519 = rec.Sig.Ed25519[:len(rec.Sig.Ed25519)-1] + "0"
        }
        // Recompute this_hash so we trip BAD_SIGNATURE, not BROKEN_CHAIN.
        payload, _ := canonicalPayload(rec)
        rec.ThisHash = chainHash(GenesisPrevHash, payload)
        tampered, _ := json.Marshal(rec)
        lines[0] = tampered
        mutated := bytes.Join(lines, []byte("\n"))
        mutated = append(mutated, '\n')

        err := VerifyOffline(bytes.NewReader(mutated), trust, nil)
        var ve *VerifyError
        if !errors.As(err, &ve) || ve.Code != CodeBadSignature {
                t.Fatalf("expected BAD_SIGNATURE, got %v", err)
        }
}

func TestVerify_DetectsUnknownSigner(t *testing.T) {
        signer, _ := newTestSigner(t, "did:plat:szl-test")
        // Build with `signer`, but verify with an empty trust root.
        empty := NewTrustRoot()
        var buf bytes.Buffer
        if err := BuildManifest(&buf, signer, sampleArtifacts(), fixedNow); err != nil {
                t.Fatalf("build: %v", err)
        }
        err := VerifyOffline(bytes.NewReader(buf.Bytes()), empty, nil)
        var ve *VerifyError
        if !errors.As(err, &ve) {
                t.Fatalf("expected *VerifyError, got %v", err)
        }
        // An unknown signer MUST surface as UNKNOWN_SIGNER, not collapse
        // into BAD_SIGNATURE — the two have distinct CLI exit codes
        // (5 vs 3) and distinct operational remediations.
        if ve.Code != CodeUnknownSigner {
                t.Fatalf("expected UNKNOWN_SIGNER, got %s (%v)", ve.Code, err)
        }
}

func TestVerify_DetectsMissingArtifact(t *testing.T) {
        signer, trust := newTestSigner(t, "did:plat:szl-test")
        var buf bytes.Buffer
        if err := BuildManifest(&buf, signer, sampleArtifacts(), fixedNow); err != nil {
                t.Fatalf("build: %v", err)
        }
        expected := map[string]string{
                "ghcr.io/szl-holdings/does-not-exist:v1.0.0": strings.Repeat("e", 64),
        }
        err := VerifyOffline(bytes.NewReader(buf.Bytes()), trust, expected)
        var ve *VerifyError
        if !errors.As(err, &ve) || ve.Code != CodeMissingArtifact {
                t.Fatalf("expected MISSING_ARTIFACT, got %v", err)
        }
}

func BenchmarkBuild10(b *testing.B) {
        edPub, edPriv, _ := ed25519.GenerateKey(rand.Reader)
        pqPub, pqPriv, _ := mldsa65.GenerateKey(rand.Reader)
        _ = edPub
        _ = pqPub
        signer := &inMemorySigner{did: "did:plat:szl-bench", edPriv: edPriv, pqPriv: pqPriv}

        arts := make([]Artifact, 10)
        for i := range arts {
                arts[i] = Artifact{
                        Component: "c",
                        Ref:       "ghcr.io/szl-holdings/c:" + string(rune('a'+i)),
                        SHA256:    strings.Repeat("a", 64),
                }
        }

        b.ResetTimer()
        for i := 0; i < b.N; i++ {
                var buf bytes.Buffer
                if err := BuildManifest(&buf, signer, arts, fixedNow); err != nil {
                        b.Fatal(err)
                }
        }
}
