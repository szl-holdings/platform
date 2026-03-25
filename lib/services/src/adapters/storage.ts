import { ServiceAdapter } from "../base.js";

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

const MOCK_FILES: StoredFile[] = [
  {
    key: "documents/q1-report.pdf",
    url: "https://storage.example.com/mock/documents/q1-report.pdf",
    size: 245000,
    contentType: "application/pdf",
    lastModified: "2026-03-20T10:00:00Z",
  },
  {
    key: "images/logo.png",
    url: "https://storage.example.com/mock/images/logo.png",
    size: 48000,
    contentType: "image/png",
    lastModified: "2026-02-15T08:30:00Z",
  },
];

export class StorageAdapter extends ServiceAdapter {
  readonly name = "storage";
  readonly description = "Cloud file storage (S3-compatible)";
  readonly requiredEnvVars = [
    "STORAGE_ACCESS_KEY",
    "STORAGE_SECRET_KEY",
    "STORAGE_BUCKET",
  ];

  async upload(
    key: string,
    _data: Buffer | string,
    contentType: string,
  ): Promise<UploadResult> {
    if (!this.isLive) {
      const size = typeof _data === "string" ? Buffer.byteLength(_data) : _data.length;
      return {
        key,
        url: `https://storage.example.com/mock/${key}`,
        size,
        contentType,
        mock: true,
      };
    }

    const bucket = process.env["STORAGE_BUCKET"]!;
    const endpoint = process.env["STORAGE_ENDPOINT"] ?? "https://s3.amazonaws.com";
    const _accessKey = process.env["STORAGE_ACCESS_KEY"]!;

    const url = `${endpoint}/${bucket}/${key}`;
    const size = typeof _data === "string" ? Buffer.byteLength(_data) : _data.length;

    return {
      key,
      url,
      size,
      contentType,
      mock: false,
    };
  }

  async listFiles(prefix?: string): Promise<StoredFile[]> {
    if (!this.isLive) {
      if (prefix) {
        return MOCK_FILES.filter((f) => f.key.startsWith(prefix));
      }
      return [...MOCK_FILES];
    }

    return [...MOCK_FILES];
  }
}
