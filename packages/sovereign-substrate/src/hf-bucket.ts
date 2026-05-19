/**
 * HuggingFace Bucket storage adapter.
 *
 * Backed by `@huggingface/hub`. Uploads artifacts and Proof Packets to a HF
 * bucket and returns the resulting bucket URIs. We import the SDK lazily so
 * test/CLI consumers don't pay for the dependency unless they actually push.
 */

import { computeContentHash } from './sign.js';
import type { ProofPacket } from './packet.js';

export type SovereignBucket = 'forge-models' | 'forge-datasets' | 'forge-public';

export interface HfBucketConfig {
  org: string;
  buckets: Record<SovereignBucket, string>;
  token: string;
  endpoint?: string;
}

export interface UploadArtifactInput {
  bucket: SovereignBucket;
  path: string;
  bytes: Uint8Array;
  contentType?: string;
}

export interface UploadResult {
  bucketUri: string;
  contentHash: string;
}

export interface UploadPacketInput {
  bucket: SovereignBucket;
  artifactPath: string;
  packet: ProofPacket;
}

export interface HfBucketAdapter {
  uploadArtifact(input: UploadArtifactInput): Promise<UploadResult>;
  uploadPacket(input: UploadPacketInput): Promise<{ packetUri: string; packetHash: string }>;
  downloadArtifact(bucketUri: string): Promise<Uint8Array>;
  downloadPacket(packetUri: string): Promise<ProofPacket>;
}

function buildBucketUri(config: HfBucketConfig, bucket: SovereignBucket, path: string): string {
  const bucketName = config.buckets[bucket];
  return `hf-bucket://${config.org}/${bucketName}/${path.replace(/^\/+/, '')}`;
}

function parseBucketUri(uri: string): { org: string; bucket: string; path: string } {
  const m = uri.match(/^hf-bucket:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!m) throw new Error(`invalid hf-bucket URI: ${uri}`);
  return { org: m[1]!, bucket: m[2]!, path: m[3]! };
}

/**
 * Minimal typed view of the @huggingface/hub surface we use. Defining this
 * locally keeps us off untyped `as { uploadFile: ... }` casts while still
 * allowing the SDK to be a lazy/optional runtime dep.
 */
interface HfUploadFileArgs {
  repo: string;
  file: { path: string; content: Blob };
  accessToken?: string;
  hubUrl?: string;
}
interface HfDownloadFileArgs {
  repo: string;
  path: string;
  accessToken?: string;
  hubUrl?: string;
}
interface HfHubModule {
  uploadFile: (args: HfUploadFileArgs) => Promise<unknown>;
  downloadFile: (args: HfDownloadFileArgs) => Promise<Response | null>;
}

/**
 * Production adapter using @huggingface/hub. Lazily imported.
 */
export class HuggingFaceBucketAdapter implements HfBucketAdapter {
  constructor(private readonly config: HfBucketConfig) {}

  private async getHub(): Promise<HfHubModule> {
    const mod = await import('@huggingface/hub' as string).catch(() => {
      throw new Error(
        '@huggingface/hub is not installed in this runtime. ' +
          'Install it in the consuming package to use HuggingFaceBucketAdapter.',
      );
    });
    return mod as unknown as HfHubModule;
  }

  async uploadArtifact(input: UploadArtifactInput): Promise<UploadResult> {
    const hub = await this.getHub();
    const repo = `${this.config.org}/${this.config.buckets[input.bucket]}`;
    const blob = new Blob([new Uint8Array(input.bytes)], {
      type: input.contentType ?? 'application/octet-stream',
    });
    const uploadArgs: HfUploadFileArgs = {
      repo,
      file: { path: input.path, content: blob },
      ...(this.config.token ? { accessToken: this.config.token } : {}),
      ...(this.config.endpoint ? { hubUrl: this.config.endpoint } : {}),
    };
    await hub.uploadFile(uploadArgs);
    return {
      bucketUri: buildBucketUri(this.config, input.bucket, input.path),
      contentHash: computeContentHash(input.bytes),
    };
  }

  async uploadPacket(
    input: UploadPacketInput,
  ): Promise<{ packetUri: string; packetHash: string; signatureUri?: string }> {
    const packetPath = `${input.artifactPath}.proof.json`;
    // Canonical packet hash: hash of the serialized JSON bytes that are
    // uploaded to HF. Anyone who downloads the same bytes from the bucket
    // can recompute the same hash. Must match what /publish stores in the DB.
    const bytes = new TextEncoder().encode(JSON.stringify(input.packet, null, 2));
    const result = await this.uploadArtifact({
      bucket: input.bucket,
      path: packetPath,
      bytes,
      contentType: 'application/json',
    });
    // Also publish a detached signature file (`<artifact>.proof.sig`)
    // alongside the packet so external verifiers can fetch the raw
    // Ed25519 signature without parsing JSON. The envelope JSON still
    // embeds the same signature so verification works either way.
    let signatureUri: string | undefined;
    if (input.packet.signature?.signature) {
      const sigBytes = new TextEncoder().encode(input.packet.signature.signature);
      const sigResult = await this.uploadArtifact({
        bucket: input.bucket,
        path: `${input.artifactPath}.proof.sig`,
        bytes: sigBytes,
        contentType: 'text/plain',
      });
      signatureUri = sigResult.bucketUri;
    }
    return { packetUri: result.bucketUri, packetHash: result.contentHash, signatureUri };
  }

  async downloadArtifact(bucketUri: string): Promise<Uint8Array> {
    const { org, bucket, path } = parseBucketUri(bucketUri);
    const hub = await this.getHub();
    // Omit accessToken entirely when unset — passing an empty string can
    // confuse the HF SDK into attempting auth and rejecting anonymous
    // reads of public datasets.
    const dlArgs: HfDownloadFileArgs = {
      repo: `${org}/${bucket}`,
      path,
      ...(this.config.token ? { accessToken: this.config.token } : {}),
      ...(this.config.endpoint ? { hubUrl: this.config.endpoint } : {}),
    };
    const downloaded = await hub.downloadFile(dlArgs);
    if (!downloaded) throw new Error(`artifact not found at ${bucketUri}`);
    const ab = await downloaded.arrayBuffer();
    return new Uint8Array(ab);
  }

  async downloadPacket(packetUri: string): Promise<ProofPacket> {
    const bytes = await this.downloadArtifact(packetUri);
    return JSON.parse(new TextDecoder().decode(bytes)) as ProofPacket;
  }
}

/**
 * In-memory adapter for tests and dev. Stores everything in a Map keyed by
 * bucket URI. Honors the same content-hash contract.
 */
export class InMemoryHfBucketAdapter implements HfBucketAdapter {
  private store = new Map<string, Uint8Array>();

  constructor(private readonly config: HfBucketConfig) {}

  async uploadArtifact(input: UploadArtifactInput): Promise<UploadResult> {
    const uri = buildBucketUri(this.config, input.bucket, input.path);
    this.store.set(uri, new Uint8Array(input.bytes));
    return { bucketUri: uri, contentHash: computeContentHash(input.bytes) };
  }

  async uploadPacket(
    input: UploadPacketInput,
  ): Promise<{ packetUri: string; packetHash: string }> {
    const path = `${input.artifactPath}.proof.json`;
    const bytes = new TextEncoder().encode(JSON.stringify(input.packet, null, 2));
    const result = await this.uploadArtifact({
      bucket: input.bucket,
      path,
      bytes,
      contentType: 'application/json',
    });
    return { packetUri: result.bucketUri, packetHash: result.contentHash };
  }

  async downloadArtifact(bucketUri: string): Promise<Uint8Array> {
    const bytes = this.store.get(bucketUri);
    if (!bytes) throw new Error(`artifact not found at ${bucketUri}`);
    return bytes;
  }

  async downloadPacket(packetUri: string): Promise<ProofPacket> {
    const bytes = await this.downloadArtifact(packetUri);
    return JSON.parse(new TextDecoder().decode(bytes)) as ProofPacket;
  }
}

export { buildBucketUri, parseBucketUri };
