export interface DoctrineV6 {
  version: "V6";
  replayRoot: string;
  byline: string;
  orcid: string;
  affiliation: string;
  lambdaFloor: number;
  moralGroundingFloor: number;
  measurabilityHonestyFloor: number;
  lambdaAxes: number;
  byteIdenticalReplays: number;
  ingestionPolicy: "PUBLIC_ONLY";
  licenseAllowlist: ReadonlyArray<string>;
}

export type DoiKind = "paper" | "dataset" | "software";

export interface DoiEntry {
  doi: string;
  title: string;
  kind: DoiKind;
  year: number;
  url: string;
  sha256?: string;
}

export interface RepoTagRef {
  name: string;
  sha: string;
}

export interface RepoReleaseRef {
  tagName: string;
  publishedAt: string | null;
}

export interface RepoEntry {
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  latestCommitSha: string | null;
  latestTag: RepoTagRef | null;
  latestRelease: RepoReleaseRef | null;
  pushedAt: string;
  scorecard: number | null;
  branchProtectionStrict: boolean;
  openCodeScanningAlerts: number;
  openDependabotHighCritical: number;
  cloneUrl: string;
}

export interface OrgSummary {
  reposTotal: number;
  ciFailing: number;
  openPrs: number;
  openAlertsCodeScanning: number;
  openDependabotHighCritical: number;
  scorecardAvg: number;
  branchProtectionCompliant: number;
  branchProtectionWeak: number;
  hygieneGaps: ReadonlyArray<string>;
}

export interface PushQueueEntry {
  id: string;
  artifact?: string;
  targetVersion?: string;
  sha256?: string;
  status?: string;
  blocker: string;
}

export interface LambdaAxis {
  id: string;
  name: string;
  floor: number;
  description: string;
}

export interface AxiomEntry {
  id: string;
  name: string | null;
  statement: string | null;
}

export interface TheoremEntry {
  id: string;
  name: string;
  statement: string | null;
}

export interface DerivationEntry {
  id: string;
  name: string | null;
  statement: string | null;
}

export interface ConstantEntry {
  id: string;
  name: string | null;
  statement: string | null;
}

export interface ArtifactPayload {
  axioms: ReadonlyArray<AxiomEntry>;
  theorems: ReadonlyArray<TheoremEntry>;
  derivations: ReadonlyArray<DerivationEntry>;
  constants: ReadonlyArray<ConstantEntry>;
}
