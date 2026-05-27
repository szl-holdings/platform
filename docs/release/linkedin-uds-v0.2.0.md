# LinkedIn post — UDS v0.2.0

> Markdown source for the LinkedIn announcement. Paste plain text; LinkedIn strips formatting but keeps line breaks.

---

SZL Holdings UDS bundles → v0.2.0 (signed, sha256-pinned, cosign-verified).

Five Defense-Unicorns Zarf payloads, each on its own public repo, deployable in one command:

• A11oy — brand orchestration + KS-18 contextuality witness
• Sentra — cyber resilience, fail-closed Safety Gate
• Amaru — convergent data sync, hash-chained proof receipts
• ROSIE — governed decision fabric, mandatory witnesses on every decision
• Vessels — maritime intelligence, voyage Λ-receipts

What's new in v0.2.0: three cross-cutting shared packages now ship in every bundle:

1) perception-loop — operator-loop envelope with a hard privacy invariant. Raw frame bytes never leave the loop; only feature-vector summaries enter the receipt stream. Enforced by a serialization test, not a comment.

2) sequence-pipeline — multi-stage hashed evidence pipeline. Each stage emits a receipt; the seal folds them into one hash-chained record.

3) sparse-attention-kit (new) — sparse attention re-expressed as 12 receipt classes. Distills NSA, MoBA, MiniMax, FlashAttention, FLA. The non-obvious lesson: MiniMax M2 reverted to full attention because hybrid-sparse wins benchmarks but loses multi-hop reasoning at scale. So the kit gates every sparse pass with a contradiction probe and fails up to full attention automatically. The lesson is in the code, not in a slide deck.

Verify any bundle in four commands:

  PRODUCT=sentra; BUNDLE=${PRODUCT}-uds; TAG=uds-v0.2.0; VERSION=0.2.0
  BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}
  curl -fsSLO $BASE/${BUNDLE}-${VERSION}.tar.zst{,.sha256,.sig}
  curl -fsSLO $BASE/${BUNDLE}-dev.pub
  sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256
  cosign verify-blob --key ${BUNDLE}-dev.pub \
    --signature ${BUNDLE}-${VERSION}.tar.zst.sig ${BUNDLE}-${VERSION}.tar.zst

Deploy:

  zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm

Or kernel-only (omit shared):

  zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm --components=-${PRODUCT}-shared

Bundles total under 35 KB each. Doctrine is in the receipts.

#DefenseUnicorns #Zarf #UDS #SupplyChainSecurity #Sigstore #Cosign #SZLHoldings

— Stephen P. Lutar Jr., SZL Holdings
