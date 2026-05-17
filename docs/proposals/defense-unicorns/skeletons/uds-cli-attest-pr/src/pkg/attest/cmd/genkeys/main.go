// genkeys writes a fresh Ed25519 seed, a fresh ML-DSA-65 private key,
// and a matching trust-root.json into --out. Used by the round-trip CI
// fixture so that committed key material never leaves the workspace.
//
// Copyright 2026 SZL Holdings
// SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"flag"
	"log"
	"os"
	"path/filepath"

	"github.com/cloudflare/circl/sign/mldsa/mldsa65"
)

func main() {
	did := flag.String("did", "did:plat:szl-attest-roundtrip", "signer DID")
	out := flag.String("out", "./keys", "output directory")
	flag.Parse()

	if err := os.MkdirAll(*out, 0o700); err != nil {
		log.Fatalf("mkdir: %v", err)
	}

	edPub, edPriv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		log.Fatalf("ed25519 keygen: %v", err)
	}
	pqPub, pqPriv, err := mldsa65.GenerateKey(rand.Reader)
	if err != nil {
		log.Fatalf("mldsa65 keygen: %v", err)
	}

	seed := edPriv.Seed()
	must(os.WriteFile(filepath.Join(*out, "ed25519.seed.hex"),
		[]byte(hex.EncodeToString(seed)+"\n"), 0o600))

	pqPrivBytes, err := pqPriv.MarshalBinary()
	if err != nil {
		log.Fatalf("mldsa65 marshal: %v", err)
	}
	must(os.WriteFile(filepath.Join(*out, "mldsa65.priv.hex"),
		[]byte(hex.EncodeToString(pqPrivBytes)+"\n"), 0o600))

	pqPubBytes, err := pqPub.MarshalBinary()
	if err != nil {
		log.Fatalf("mldsa65 marshal pub: %v", err)
	}
	trust := map[string]any{
		"signers": []map[string]string{{
			"did":           *did,
			"ed25519_pub":   hex.EncodeToString(edPub),
			"ml_dsa_65_pub": hex.EncodeToString(pqPubBytes),
		}},
	}
	tr, err := json.MarshalIndent(trust, "", "  ")
	if err != nil {
		log.Fatalf("marshal trust root: %v", err)
	}
	must(os.WriteFile(filepath.Join(*out, "trust-root.json"), append(tr, '\n'), 0o644))
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}
