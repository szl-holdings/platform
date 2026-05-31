/**
 * branches.ts — the canonical branch operators of the "Paper to Receipt"
 * architecture, hanging off the Λ Audit-Closure Operator.
 *
 * Founder diagram (2026-05-31): the Λ Operator branches into amaru, rosie,
 * sentra, UDS-Mesh, VSP-OTEL, and a11oy. These are NOT new modules and these
 * are NOT renames that break imports — they are doc-stamped ALIASES that map
 * each canonical branch name onto the existing wired thesis module(s). Importers
 * of the underlying modules (invariants/, qec/, ledger/, gates/, mesh/, memory/)
 * are unaffected.
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

import * as qec from "./qec/index.ts";
import * as ledger from "./ledger/index.ts";
import * as gates from "./gates/index.ts";
import * as mesh from "./mesh/index.ts";
import * as memory from "./memory/index.ts";

/**
 * amaru — Cardano-anchored Shor receipts.
 *
 * The amaru branch anchors receipts on Cardano and protects each receipt with
 * the Shor [[9,1,3]] majority-decode code. Backing: qec/ (Shor encode/recover,
 * REAL) + memory/ (amaru memory-attestation client; the on-chain anchor is a
 * documented network dependency — NotYetError, no fake green).
 */
export const amaru = { ...qec, ...memory } as const;

/**
 * rosie — CSS-ingress, canonical byte-strings.
 *
 * The rosie operator console is the CSS-ingress: it admits receipts through the
 * CSS classical→stabilizer bridge and canonicalises them to byte-strings.
 * Backing: qec/ (classicalToCSS, cssConsistent, REAL) + ledger/ (canonical-JSON
 * byte-string encoding, REAL). (rosie is the canonical operator-console name.)
 */
export const rosie = { ...qec, ...ledger } as const;

/**
 * sentra — Kitaev-surface drift detection.
 *
 * The sentra branch detects drift via the Kitaev surface-code vertex-parity
 * check and enforces the fail-closed egress gates. Backing: qec/ (vertexParity,
 * Kitaev surface, REAL) + gates/ (8-step sentra egress pipeline, REAL).
 */
export const sentra = { ...qec, ...gates } as const;

/**
 * mesh — Span schemas, OTEL — UDS-Mesh + VSP-OTEL Λ-axis span exporter.
 *
 * The UDS-Mesh and VSP-OTEL branches share the W3C TraceContext span plumbing
 * and export spans on the Λ-axis. Backing: mesh/ (W3C traceparent parse/format/
 * propagate, REAL; UDS transport binding is a documented dependency).
 */
export const meshBranch = { ...mesh } as const;

/**
 * a11oy — policy + measurement + knowledge + QEC.
 *
 * The a11oy substrate composes policy (gates), measurement (the Λ invariant /
 * ledger receipts), knowledge (the receipt ledger), and QEC. Backing: gates/ +
 * ledger/ + qec/ (all REAL). (The product is A11oy — that is the canonical name.)
 */
export const a11oy = { ...gates, ...ledger, ...qec } as const;

/** Canonical branch → module mapping, with the founder-diagram doc-strings. */
export const CANONICAL_BRANCHES = [
  { branch: "amaru", doc: "Cardano-anchored Shor receipts", modules: ["qec", "memory"] },
  { branch: "rosie", doc: "CSS-ingress, canonical byte-strings", modules: ["qec", "ledger"] },
  { branch: "sentra", doc: "Kitaev-surface drift detection", modules: ["qec", "gates"] },
  {
    branch: "mesh",
    doc: "Span schemas, OTEL — UDS-Mesh + VSP-OTEL Λ-axis span exporter",
    modules: ["mesh"],
  },
  { branch: "a11oy", doc: "policy + measurement + knowledge + QEC", modules: ["gates", "ledger", "qec"] },
] as const;
