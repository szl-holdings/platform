import { ServiceAdapter } from "../base.js";
import { Storage } from "@google-cloud/storage";

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  mock: boolean;
}

export interface StoredFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: string;
}

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

function createGCSClient(): Storage {
  return new Storage({
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      type: "external_account",
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: {
          type: "json",
          subject_token_field_name: "access_token",
        },
      },
      universe_domain: "googleapis.com",
    } as any,
    projectId: "",
  });
}

export class StorageAdapter extends ServiceAdapter {
  readonly name = "storage";
  readonly description = "Cloud file storage (GCS — Replit Object Storage)";
  readonly requiredEnvVars = ["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];

  protected async performHealthCheck(): Promise<void> {
    const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
    if (!bucketId) {
      throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set");
    }
    const client = createGCSClient();
    const [exists] = await client.bucket(bucketId).exists();
    if (!exists) {
      throw new Error(`GCS bucket '${bucketId}' does not exist or is inaccessible`);
    }
  }

  async upload(
    key: string,
    data: Buffer | string,
    contentType: string,
  ): Promise<UploadResult> {
    const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
    const size = typeof data === "string" ? Buffer.byteLength(data) : data.length;

    if (!this.isLive || !bucketId) {
      return {
        key,
        url: `https://storage.googleapis.com/${bucketId ?? "mock-bucket"}/${key}`,
        size,
        contentType,
        mock: !bucketId,
      };
    }

    const client = createGCSClient();
    const bucket = client.bucket(bucketId);
    const file = bucket.file(key);

    const buffer = typeof data === "string" ? Buffer.from(data) : data;
    await file.save(buffer, { contentType, resumable: false });

    const url = `https://storage.googleapis.com/${bucketId}/${key}`;
    return { key, url, size, contentType, mock: false };
  }

  async listFiles(prefix?: string): Promise<StoredFile[]> {
    const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
    if (!this.isLive || !bucketId) {
      return [];
    }

    const client = createGCSClient();
    const bucket = client.bucket(bucketId);
    const [files] = await bucket.getFiles({ prefix });

    return await Promise.all(
      files.map(async (file) => {
        const [meta] = await file.getMetadata();
        return {
          key: file.name,
          url: `https://storage.googleapis.com/${bucketId}/${file.name}`,
          size: parseInt(String(meta.size ?? "0"), 10),
          contentType: String(meta.contentType ?? "application/octet-stream"),
          lastModified: String(meta.updated ?? new Date().toISOString()),
        };
      }),
    );
  }
}
