export interface EvidenceStewardSources {
  catalog: unknown;
  bindings: unknown;
  portfolio: unknown;
}

export type EvidenceStewardResult = Record<string, unknown> & {
  schema: string;
  tool: string;
  digest: string;
};

export interface EvidenceSteward {
  modelIds: string[];
  listCatalog(args: { asset_type: 'models'; limit: 5 | 10 | 25 }): EvidenceStewardResult;
  inspectAsset(args: { asset_id: string }): EvidenceStewardResult;
  assessEvidenceGaps(args: { asset_id: string }): EvidenceStewardResult;
  proposeNextStep(args: { asset_id: string }): EvidenceStewardResult;
}

export declare function createEvidenceSteward(
  sources: EvidenceStewardSources,
  asOf: string,
): EvidenceSteward;

export declare function verifyEvidenceStewardFixtureBlob(
  kind: 'catalog' | 'bindings' | 'portfolio',
  bytes: Uint8Array,
): void;
