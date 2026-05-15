import type { DoiEntry } from "./types.js";

// Source: /tmp/payload/dev2_runtime/runtime_payload.json -> doi_ledger (13 entries:
// concept + v1..v11 + runtime). Title and minted year copied verbatim; "kind" derived
// from "type"/"target" (concept + paper-vN -> paper, runtime -> software).
export const DOI_LEDGER: ReadonlyArray<DoiEntry> = [
  {
    doi: "10.5281/zenodo.19944926",
    title: "Ouroboros Thesis — concept record",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.19944926",
  },
  {
    doi: "10.5281/zenodo.19867281",
    title: "The Loop Is the Product (v1)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.19867281",
  },
  {
    doi: "10.5281/zenodo.19934129",
    title: "The Loop Is the Product (v2)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.19934129",
  },
  {
    doi: "10.5281/zenodo.19983066",
    title: "The Lutar Invariant (v3)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.19983066",
  },
  {
    doi: "10.5281/zenodo.20020841",
    title: "The Lutar Omega Formalism (v4)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20020841",
  },
  {
    doi: "10.5281/zenodo.20020846",
    title: "Lineage-Aware RAG (v5)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20020846",
  },
  {
    doi: "10.5281/zenodo.20020845",
    title: "Sealed Constitutional Guardrails (v6)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20020845",
  },
  {
    doi: "10.5281/zenodo.20020848",
    title: "Tiered Continual Learning (v7)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20020848",
  },
  {
    doi: "10.5281/zenodo.20020849",
    title: "Active Inference (v8)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20020849",
  },
  {
    doi: "10.5281/zenodo.20053148",
    title: "Unified Operational Account (v9)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20053148",
  },
  {
    doi: "10.5281/zenodo.20053163",
    title: "Audit-Closure Operator Λ₁₀ (v10)",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20053163",
  },
  {
    doi: "10.5281/zenodo.20119582",
    title:
      "Applied Λ (v11): Measured Per-Request Latency Overhead of an Audit-Closure Operator in a Governed AI Runtime",
    kind: "paper",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20119582",
  },
  {
    doi: "10.5281/zenodo.20162352",
    title:
      "Ouroboros Runtime: A Bounded-Loop Audit-Closure System Implementing the Lutar Invariant Λ",
    kind: "software",
    year: 2026,
    url: "https://doi.org/10.5281/zenodo.20162352",
  },
];
