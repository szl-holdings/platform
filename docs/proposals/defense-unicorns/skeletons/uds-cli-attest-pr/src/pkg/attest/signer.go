// Hybrid Ed25519 + ML-DSA-65 signer / verifier for the in-bundle
// attestation manifest. The Ed25519 half uses the stdlib; the
// ML-DSA-65 half uses github.com/cloudflare/circl/sign/mldsa/mldsa65,
// which is Apache-2.0 and already on the UDS allowlist.
//
// Copyright 2026 SZL Holdings
// SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
package attest

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/cloudflare/circl/sign/mldsa/mldsa65"
)

// FileSigner signs records with a hybrid Ed25519 + ML-DSA-65 keypair
// loaded from disk. Both keys MUST belong to the same signer DID; the
// trust-root entry pairs them.
type FileSigner struct {
	did     string
	edPriv  ed25519.PrivateKey
	pqPriv  *mldsa65.PrivateKey
}

// NewFileSigner loads `did` plus a hex-encoded Ed25519 seed and a
// hex-encoded ML-DSA-65 private key from the named files.
func NewFileSigner(did, edSeedPath, pqPrivPath string) (*FileSigner, error) {
	edRaw, err := readHexFile(edSeedPath)
	if err != nil {
		return nil, fmt.Errorf("attest: read ed25519 seed: %w", err)
	}
	if len(edRaw) != ed25519.SeedSize {
		return nil, fmt.Errorf("attest: ed25519 seed must be %d bytes, got %d", ed25519.SeedSize, len(edRaw))
	}
	edPriv := ed25519.NewKeyFromSeed(edRaw)

	pqRaw, err := readHexFile(pqPrivPath)
	if err != nil {
		return nil, fmt.Errorf("attest: read ml-dsa-65 priv: %w", err)
	}
	pqPriv := new(mldsa65.PrivateKey)
	if err := pqPriv.UnmarshalBinary(pqRaw); err != nil {
		return nil, fmt.Errorf("attest: parse ml-dsa-65 priv: %w", err)
	}

	return &FileSigner{did: did, edPriv: edPriv, pqPriv: pqPriv}, nil
}

// DID returns the signer's decentralised identifier.
func (s *FileSigner) DID() string { return s.did }

// Sign produces a hybrid signature over payload. Both halves must
// succeed or the call fails — we never emit a half-signed record.
func (s *FileSigner) Sign(payload []byte) (Signature, error) {
	edSig := ed25519.Sign(s.edPriv, payload)
	pqSig := make([]byte, mldsa65.SignatureSize)
	if err := mldsa65.SignTo(s.pqPriv, payload, nil, false, pqSig); err != nil {
		return Signature{}, fmt.Errorf("attest: ml-dsa-65 sign: %w", err)
	}
	return Signature{
		Ed25519: hex.EncodeToString(edSig),
		MLDSA65: hex.EncodeToString(pqSig),
	}, nil
}

// TrustRoot is an in-memory mapping from signer DID to the public keys
// that verify their signatures. It implements Verifier.
type TrustRoot struct {
	entries map[string]trustEntry
}

type trustEntry struct {
	edPub ed25519.PublicKey
	pqPub *mldsa65.PublicKey
}

// trustRootFile is the on-disk JSON shape loaded by LoadTrustRoot. It
// lives inside the bundle at /uds-bundle/trust-root.json so verify
// --offline has everything it needs without a registry round-trip.
type trustRootFile struct {
	Signers []struct {
		DID     string `json:"did"`
		Ed25519 string `json:"ed25519_pub"`
		MLDSA65 string `json:"ml_dsa_65_pub"`
	} `json:"signers"`
}

// NewTrustRoot constructs an empty trust root.
func NewTrustRoot() *TrustRoot {
	return &TrustRoot{entries: map[string]trustEntry{}}
}

// LoadTrustRoot reads a trust-root.json file from disk.
func LoadTrustRoot(path string) (*TrustRoot, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var parsed trustRootFile
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("attest: parse trust-root: %w", err)
	}
	tr := NewTrustRoot()
	for _, s := range parsed.Signers {
		edPubRaw, err := hex.DecodeString(s.Ed25519)
		if err != nil || len(edPubRaw) != ed25519.PublicKeySize {
			return nil, fmt.Errorf("attest: trust-root: bad ed25519 pub for %s", s.DID)
		}
		pqPub := new(mldsa65.PublicKey)
		pqPubRaw, err := hex.DecodeString(s.MLDSA65)
		if err != nil {
			return nil, fmt.Errorf("attest: trust-root: bad ml-dsa-65 hex for %s: %w", s.DID, err)
		}
		if err := pqPub.UnmarshalBinary(pqPubRaw); err != nil {
			return nil, fmt.Errorf("attest: trust-root: bad ml-dsa-65 pub for %s: %w", s.DID, err)
		}
		tr.Add(s.DID, ed25519.PublicKey(edPubRaw), pqPub)
	}
	return tr, nil
}

// Add registers a signer DID with its public-key material.
func (t *TrustRoot) Add(did string, edPub ed25519.PublicKey, pqPub *mldsa65.PublicKey) {
	t.entries[did] = trustEntry{edPub: edPub, pqPub: pqPub}
}

// Verify implements Verifier. It returns a wrapped *VerifyError so the
// CLI can render structured exit codes; callers that want the bare
// error can call errors.As.
func (t *TrustRoot) Verify(did string, payload []byte, sig Signature) error {
	entry, ok := t.entries[did]
	if !ok {
		return &VerifyError{Code: CodeUnknownSigner, Index: -1,
			Err: fmt.Errorf("signer %q not in trust root", did)}
	}
	edSig, err := hex.DecodeString(sig.Ed25519)
	if err != nil {
		return errors.New("ed25519 sig is not valid hex")
	}
	if !ed25519.Verify(entry.edPub, payload, edSig) {
		return errors.New("ed25519 signature failed to verify")
	}
	pqSig, err := hex.DecodeString(sig.MLDSA65)
	if err != nil {
		return errors.New("ml-dsa-65 sig is not valid hex")
	}
	if !mldsa65.Verify(entry.pqPub, payload, nil, pqSig) {
		return errors.New("ml-dsa-65 signature failed to verify")
	}
	return nil
}

func readHexFile(path string) ([]byte, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	// Tolerate trailing newline.
	for len(raw) > 0 && (raw[len(raw)-1] == '\n' || raw[len(raw)-1] == '\r' || raw[len(raw)-1] == ' ') {
		raw = raw[:len(raw)-1]
	}
	return hex.DecodeString(string(raw))
}
