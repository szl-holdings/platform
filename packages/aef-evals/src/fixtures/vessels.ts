import type { GoldenQuery } from "../metrics.js";

export const VESSELS_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: "vessels-q001",
    query: "What is the current sanctions status for vessel IMO 9234567?",
    relevantChunkIds: ["vessels-chunk-001", "vessels-chunk-002"],
    exactMatchBoostTerms: ["IMO", "sanctions"],
    metadata: { domain: "vessels", entityTypes: ["vessel"] },
  },
  {
    queryId: "vessels-q002",
    query: "Show me all dark vessel detections in the Strait of Hormuz over the past 7 days.",
    relevantChunkIds: ["vessels-chunk-003", "vessels-chunk-004", "vessels-chunk-005"],
    exactMatchBoostTerms: ["dark vessel", "AIS"],
    metadata: { domain: "vessels", entityTypes: ["vessel", "signal"] },
  },
  {
    queryId: "vessels-q003",
    query: "Retrieve the port-state control findings for MMSI 123456789.",
    relevantChunkIds: ["vessels-chunk-006", "vessels-chunk-007"],
    exactMatchBoostTerms: ["MMSI", "port-state control"],
    metadata: { domain: "vessels", entityTypes: ["vessel", "voyage"] },
  },
  {
    queryId: "vessels-q004",
    query: "Which vessels flagged under Panama are currently showing AIS anomalies?",
    relevantChunkIds: ["vessels-chunk-008", "vessels-chunk-009"],
    exactMatchBoostTerms: ["flag state", "AIS", "Automatic Identification System"],
    metadata: { domain: "vessels", entityTypes: ["vessel"] },
  },
  {
    queryId: "vessels-q005",
    query: "What cargo types are associated with voyages flagged for elevated risk scoring?",
    relevantChunkIds: ["vessels-chunk-010", "vessels-chunk-011"],
    exactMatchBoostTerms: ["cargo manifest", "voyage"],
    metadata: { domain: "vessels", entityTypes: ["voyage"] },
  },
  {
    queryId: "vessels-q006",
    query: "Summarise the sanctions screening history for vessel name Meridian Star.",
    relevantChunkIds: ["vessels-chunk-012", "vessels-chunk-013"],
    exactMatchBoostTerms: ["vessel name", "sanctions"],
    metadata: { domain: "vessels", entityTypes: ["vessel"] },
  },
];

export const VESSELS_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  ["vessels-chunk-001", { text: "Vessel IMO 9234567 — MV Albatross Crown, Panama flag. Sanctions screening result: MATCHED. Flagged against OFAC SDN list on 2024-03-14. Investigation open.", boostTerms: ["IMO", "sanctions"] }],
  ["vessels-chunk-002", { text: "IMO 9234567 sanctions history: first flagged 2023-11-02 (EU sanctions list, Russia energy sector). Watchlist maintained. Operator: Meridian Shipping Co.", boostTerms: ["IMO", "sanctions"] }],
  ["vessels-chunk-003", { text: "Dark vessel detection — Strait of Hormuz, 2024-06-10: AIS signal lost for 14 hours. Last known position: 26.4°N 56.1°E. Vessel type: crude oil tanker.", boostTerms: ["dark vessel", "AIS"] }],
  ["vessels-chunk-004", { text: "AIS anomaly report: 3 vessels showed simultaneous AIS blackout in Strait of Hormuz on 2024-06-12 between 0200-0800 UTC. Coordinated dark activity pattern suspected.", boostTerms: ["dark vessel", "AIS"] }],
  ["vessels-chunk-005", { text: "Hormuz dark detection cluster June 2024: IMO 9187432, IMO 9301856, IMO 9445221. All operating under flags of convenience. Intelligence escalated to maritime security team.", boostTerms: ["dark vessel", "AIS"] }],
  ["vessels-chunk-006", { text: "Port-state control inspection report: MMSI 123456789, MV Saffron Tide. Inspection date: 2024-04-22, Port of Rotterdam. Deficiencies noted: fire safety equipment (3 findings). Detained: No.", boostTerms: ["MMSI", "port-state control"] }],
  ["vessels-chunk-007", { text: "MMSI 123456789 port-state control history: 4 inspections since 2022. Two detentions on record (Singapore 2022, Hamburg 2023). Current certificate status: valid.", boostTerms: ["MMSI", "port-state control"] }],
  ["vessels-chunk-008", { text: "AIS anomaly alert: 7 Panama-flagged vessels showing intermittent AIS signal loss in Persian Gulf over past 48h. Possible transponder manipulation. Risk score: 0.82.", boostTerms: ["flag state", "AIS"] }],
  ["vessels-chunk-009", { text: "Panama flag state: elevated anomaly rate Q2 2024. 12 vessels under Panama registry showing AIS irregularities in high-risk zones. Operator notification pending.", boostTerms: ["flag state", "Automatic Identification System"] }],
  ["vessels-chunk-010", { text: "High-risk voyage RV-2024-0614: Crude oil cargo, origin Bandar Abbas, destination Fujairah. Risk score 0.91. Cargo manifest inconsistency detected at origin declaration.", boostTerms: ["cargo manifest", "voyage"] }],
  ["vessels-chunk-011", { text: "Elevated-risk voyages by cargo type Q2 2024: crude oil (14 voyages), refined petroleum (8), dual-use chemicals (3). Dual-use chemical voyages show highest average risk score at 0.87.", boostTerms: ["cargo manifest", "voyage"] }],
  ["vessels-chunk-012", { text: "Meridian Star (IMO 9312445): sanctions screening history — clear until 2023-08-15. OFAC match identified on secondary owner entity. Watchlist status: AMBER.", boostTerms: ["vessel name", "sanctions"] }],
  ["vessels-chunk-013", { text: "Vessel name Meridian Star appears on UN COMTRADE sanctions monitoring list under secondary entity flag. Operator: Meridian Holdings BV (Netherlands). Beneficial ownership under review.", boostTerms: ["vessel name", "sanctions"] }],
]);
