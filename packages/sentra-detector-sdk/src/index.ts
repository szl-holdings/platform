/**
 * @szl-holdings/sentra-detector-sdk
 *
 * Canonical detector framework for Sentra. Every detector — TypeScript or
 * Python (via the sidecar) — implements the same `Detector` contract,
 * emits the same `Finding` shape, and is recorded as a `DetectorRun` with
 * a chain receipt. This package is the single source of truth for those
 * contracts and is consumed by:
 *
 *   - `artifacts/api-server`         — registers detectors, runs them,
 *                                      persists findings, emits receipts.
 *   - in-process TS detectors        — implement `Detector`.
 *   - `services/sentra-detector-sidecar` — speaks `./wire` over HTTP and
 *                                      mirrors the contract in pydantic.
 *
 * Keep this package free of any runtime dependency on db, express, or
 * fetch — it must remain pure types + zod schemas so the sidecar and
 * api-server can both import it without dragging in heavy peers.
 */

export * from './contracts.js';
export * from './schemas.js';
