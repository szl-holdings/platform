import type {
  ArtifactPayload,
  AxiomEntry,
  ConstantEntry,
  DerivationEntry,
  TheoremEntry,
} from "./types.js";

// NOTE: /tmp/payload/dev2_runtime/raw_runtime/a11oy.json package_json description
// enumerates A1-A14, TH1-TH3, T1-T10, K01-K13 and the v040_build_note adds A10-A14
// + TH4/TH6/TH7. The JSON does NOT carry per-id names or statements for the axiom,
// derivation, or constant indices, so name/statement are exported as null where
// the payload does not provide them. TH1-TH7 statements are pulled verbatim from
// /tmp/payload/dev1_thesis/thesis_payload.json. A4, A6, and A7 names are recovered
// from inline references inside the TH3/TH6 statements (the only places they are
// named in the canonical payload).

export const A11OY_AXIOMS: ReadonlyArray<AxiomEntry> = [
  { id: "A1", name: null, statement: null },
  { id: "A2", name: null, statement: null },
  { id: "A3", name: null, statement: null },
  { id: "A4", name: "dualWitnessDisjointness", statement: null },
  { id: "A5", name: null, statement: null },
  { id: "A6", name: "hashChainIntegrity", statement: null },
  {
    id: "A7",
    name: "Bekenstein-style Entropy Bound",
    statement:
      "Conjectured physical Bekenstein-style bound; reclassified as a corollary of TH6 (Bekenstein via DPI).",
  },
  { id: "A8", name: null, statement: null },
  { id: "A9", name: null, statement: null },
  { id: "A10", name: null, statement: null },
  { id: "A11", name: null, statement: null },
  { id: "A12", name: null, statement: null },
  { id: "A13", name: null, statement: null },
  { id: "A14", name: null, statement: null },
];

export const A11OY_THEOREMS: ReadonlyArray<TheoremEntry> = [
  {
    id: "TH1",
    name: "Lambda-Gate Invariant (Composability)",
    statement:
      "**Theorem 13 (Composability, TH1):** If systems \\(A\\) and \\(B\\) share a doctrine.json SHA and use compatible \\(\\Lambda\\)-floors (\\(A\\)'s exit floor \\(\\leq B\\)'s entry floor), their composition \\(A \\circ B\\) is itself doctrine-locked. Proven in \\cite{zenodo_v13_20162352}.",
  },
  {
    id: "TH2",
    name: "Replay-DOI Duality",
    statement:
      "Every multi-agent computation in the SZL Holdings ecosystem is DOI-anchored (TH2/Replay-DOI Duality): the 5× byte-identical replay root \\(\\texttt{1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b}\\) is permanently anchored to Zenodo DOI 10.5281/zenodo.20119582, establishing an irreversible duality between deterministic replay and permanent citable priority.",
  },
  {
    id: "TH3",
    name: "rho-Closure Completeness",
    statement:
      "**Theorem 5 (rho-Closure Composability, T1):** If \\(\\rho(r_1)\\) and \\(\\rho(r_2)\\), then \\(\\rho(r_1 \\circ r_2)\\) iff \\(W_1 \\cap W_2 = \\emptyset\\) or \\(\\exists w_3 \\in W \\setminus (W_1 \\cup W_2)\\) co-signing the composed root. Production result: 100% rho-closure on 8,000/8,000 paired calls. **Theorem 9 (Anatomy Reduction, TH3)**: Any system with \\(|R| > 8\\) is bisimilar to a system with exactly 8 regions under the axiom set A1-A9.",
  },
  {
    id: "TH4",
    name: "Lambda-Category Composability",
    statement:
      "**Theorem 4 (Lambda-Category Composability, TH4)** (conjectured): The receipt category \\(\\text{Rec}_\\Lambda\\) is a monoidal category; the gate function \\(\\Lambda\\) is a monoidal functor from \\(\\text{Rec}_\\Lambda\\) to \\(\\{0,1\\}\\). Pending Lean 4 proof in \\texttt{lutar-lean/Lutar/LaxFunctor.lean}.",
  },
  {
    id: "TH6",
    name: "Bekenstein Entropy Bound via Data Processing Inequality",
    statement:
      "**Theorem 11 (Bekenstein via DPI, TH6):** The entropy of the receipt chain is bounded by H(receipt chain of length n) ≤ H(registry) ≤ 8 × |registry in bytes|. Proof by data processing inequality: the receipt chain is a deterministic function of the registry under fixed PRNG seed, canonical JSON, and frozen registry.",
  },
  {
    id: "TH7",
    name: "Curry-Howard Receipt Calculus",
    statement:
      "**Theorem 6 (Curry-Howard, TH7):** The receipt calculus satisfies the Curry-Howard correspondence: PassReceipt(r) is inhabited iff ∀i: λ_i(r) ≥ θ_i; gate evaluation is proof construction; receipt building is proof serialization; receipt verification is proof checking. Machine-checked in Lean 4 with sorry-count = 0.",
  },
];

export const A11OY_DERIVATIONS: ReadonlyArray<DerivationEntry> = [
  { id: "T1", name: null, statement: null },
  { id: "T2", name: null, statement: null },
  { id: "T3", name: null, statement: null },
  { id: "T4", name: null, statement: null },
  {
    id: "T5",
    name: "Deterministic Replay",
    statement:
      "For canonical JSON + pinned PRNG (mulberry32, seed = constant) + frozen registry + Node ≥20 LTS with pinned pnpm lockfile: ∀ i ∈ {1..5}: root_i = 1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b.",
  },
  { id: "T6", name: null, statement: null },
  { id: "T7", name: null, statement: null },
  { id: "T8", name: null, statement: null },
  { id: "T9", name: null, statement: null },
  { id: "T10", name: null, statement: null },
];

export const A11OY_CONSTANTS: ReadonlyArray<ConstantEntry> = [
  { id: "K01", name: null, statement: null },
  { id: "K02", name: null, statement: null },
  { id: "K03", name: null, statement: null },
  { id: "K04", name: null, statement: null },
  { id: "K05", name: null, statement: null },
  { id: "K06", name: null, statement: null },
  { id: "K07", name: null, statement: null },
  { id: "K08", name: null, statement: null },
  { id: "K09", name: null, statement: null },
  {
    id: "K10",
    name: "Empirical Replay Root",
    statement:
      "5× byte-identical replay empirically verified at root 1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b.",
  },
  { id: "K11", name: null, statement: null },
  { id: "K12", name: null, statement: null },
  { id: "K13", name: null, statement: null },
];

export const A11OY_ARTIFACT_PAYLOAD: ArtifactPayload = {
  axioms: A11OY_AXIOMS,
  theorems: A11OY_THEOREMS,
  derivations: A11OY_DERIVATIONS,
  constants: A11OY_CONSTANTS,
};
