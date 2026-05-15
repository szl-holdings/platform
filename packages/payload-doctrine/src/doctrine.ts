import type { DoctrineV6 } from "./types.js";

export const DOCTRINE_V6: DoctrineV6 = {
  version: "V6",
  replayRoot:
    "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b",
  byline: "Lutar, Stephen P.",
  orcid: "0009-0001-0110-4173",
  affiliation: "SZL Holdings",
  lambdaFloor: 0.9,
  moralGroundingFloor: 0.95,
  measurabilityHonestyFloor: 0.95,
  lambdaAxes: 9,
  byteIdenticalReplays: 5,
  ingestionPolicy: "PUBLIC_ONLY",
  licenseAllowlist: ["Apache-2.0", "MIT", "BSD-3-Clause", "CC-BY-4.0"],
};

export const PAYLOAD_SCHEMA_VERSION = "1.0.0";
export const PAYLOAD_GENERATED_AT = "2026-05-15T21:22:51Z";

export const PAYLOAD_COMPONENTS = {
  thesis: {
    owner: "Dev-1",
    payloadFile: "dev1_thesis/thesis_payload.json",
    stagedFilesDir: "_files/thesis/",
    description:
      "TH1-TH3 (published v11), TH4-TH7 (arxiv-ready), TH8 GΛR (Lean skeleton)",
  },
  runtime: {
    owner: "Dev-2",
    payloadFile: "dev2_runtime/runtime_payload.json",
    rawPerRepoDir: "dev2_runtime/raw_runtime/",
    description:
      "8-region anatomy: ouroboros (brain), a11oy (heart), sentra (wires), amaru (spine), lutar-lean (skeleton), counsel+terra (hands), ouroboros-thesis (full body), vessels+szl-trust+szl-cookbook (vessels)",
  },
  agiV5: {
    owner: "Dev-3",
    payloadFile: "dev3_agi_v5/agi_v5_payload.json",
    stagedFilesDir: "_files/agi_v5/",
    description:
      "V5 proposal, VSP, Forecast Gauge (12 gauges, 3 derived, 4 a11oy gates), 60 leader recon catalog",
  },
  ops: {
    owner: "Dev-4",
    payloadFile: "dev4_ops/ops_payload.json",
    stagedFilesDir: "_files/ops/",
    description:
      "5 active crons, credentials map, connectors, Anthropic apps, GitHub merge logs, doctrine, push queue",
  },
  github: {
    owner: "GitHub Pro",
    payloadFile: "github_pro/github_inventory.json",
    auditReport: "github_pro/github_audit_report.md",
    cloneManifest: "github_pro/clone_manifest.json",
    rawPerRepoDir: "github_pro/raw/",
    description:
      "Full inventory + audit of 16 szl-holdings repos: metadata, releases, tags, commits, BP, rulesets, CODEOWNERS, workflows, CI, PRs, scorecard, alerts, hygiene files, CITATION.cff verification",
  },
} as const;

export const FILE_INTEGRITY_COUNT = 312;
