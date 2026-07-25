# Canonical Vocabulary

**Status: LIVE specification; counts remain sourced from
`artifacts/SOURCE_OF_TRUTH.json`.**

The estate previously used “surface” for four different things. That made
otherwise valid counts contradict one another. New claims and code use the
terms below.

| Canonical term | Definition | Count source |
|---|---|---|
| **Product surface** | A customer-facing vertical with its own product manifest, reachable health endpoint, and at least one receipt in the canonical chain. | `metrics.surfaces_customer_facing` |
| **Lab module** | An experimental or holographic demo unit. It does not count as a product surface and belongs under `/lab`. | Lab registry, when introduced |
| **Runtime organ** | A named internal subsystem in the anatomy/runtime model. | Runtime manifest |
| **Policy gate** | An executable policy decision module that can allow, deny, or block an action. | Policy registry |

## Usage rules

- Never publish a bare numeric “surface” count.
- Use **product surface** only when all three conformance conditions are
  evidenced.
- Use **lab module**, **runtime organ**, and **policy gate** for the other three
  concepts.
- A product surface count is not a repository count, route count, or customer
  count.
- LIVE, MODELED, PLANNED, REPORTED, and UNAVAILABLE labels describe evidence
  state; they do not imply customer traction.
