# @workspace/seeing-eye

Doctrine-clean visual grounding primitive — the **SeeingEye** re-expression in
SZL doctrine.

## Why this exists

A visual claim ("I see a vessel") is only emitted alongside a bounding box, a
frame hash, a perceptual hash, and a per-detection confidence. Un-grounded
captions are rejected at the schema layer (`UngroundedVisualClaimError`). This
mirrors the contract of `@workspace/langextract-bridge` for text — every claim
must have a verifiable provenance.

## Doctrine V6

- **Pillar:** Evidence-First.
- **Receipt:** `vision.seeing-eye.v1` — fields: `frameHash`, `perceptualHash`,
  `detections[]`, `notDetected[]`. A visual claim without `frameHash` is
  rejected at receipt write.
- Negative claims (`notDetected[]`) are first-class outputs — silently
  omitting an "asked-about-but-absent" label would be mock theater.

---
© 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 ·
Apache-2.0 (code) · CC-BY-4.0 (docs)
