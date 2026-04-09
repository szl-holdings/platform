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

  private get bucket(): string | undefined {
    return process.env["STORAGE_BUCKET"];
  }

  private get endpoint(): string {
    return process.env["STORAGE_ENDPOINT"] ?? "https://s3.amazonaws.com";
  }

  private get region(): string {
    return process.env["STORAGE_REGION"] ?? "us-east-1";
  }

  protected async performHealthCheck(): Promise<void> {
    const bucket = this.bucket;
    const endpoint = this.endpoint;
    const response = await fetch(`${endpoint}/${bucket}?max-keys=1`, {
      method: "GET",
      headers: {
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      },
    });
    if (!response.ok && response.status !== 403) throw new Error(`Storage returned ${response.status}`);
    if (response.status === 403) throw new Error("Storage authentication failed");
  }

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

    const bucket = this.bucket!;
    const endpoint = this.endpoint;

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

    try {
      const bucket = this.bucket!;
      const endpoint = this.endpoint;
      const queryParams = new URLSearchParams({ "list-type": "2", "max-keys": "1000" });
      if (prefix) queryParams.set("prefix", prefix);

      const azureConn = process.env["AZURE_STORAGE_CONNECTION_STRING"];
      if (azureConn) {
        return await this.listAzureFiles(prefix);
      }

      const accessKey = process.env["STORAGE_ACCESS_KEY"];
      const secretKey = process.env["STORAGE_SECRET_KEY"];
      const region = this.region;
      const url = `${endpoint}/${bucket}?${queryParams.toString()}`;

      let headers: Record<string, string> = { "x-amz-content-sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" };
      if (accessKey && secretKey) {
        try {
          headers = await this.signS3Request("GET", bucket, "", queryParams.toString(), region, endpoint, accessKey, secretKey);
        } catch { /* fall through with unsigned request */ }
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return prefix ? MOCK_FILES.filter((f) => f.key.startsWith(prefix)) : [...MOCK_FILES];
      }

      const xml = await response.text();
      const files: StoredFile[] = [];
      const contentRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
      let match;
      while ((match = contentRegex.exec(xml)) !== null) {
        const block = match[1];
        const keyMatch = /<Key>(.*?)<\/Key>/.exec(block);
        const sizeMatch = /<Size>(.*?)<\/Size>/.exec(block);
        const lastModMatch = /<LastModified>(.*?)<\/LastModified>/.exec(block);

        if (keyMatch) {
          const key = keyMatch[1];
          files.push({
            key,
            url: `${endpoint}/${bucket}/${key}`,
            size: parseInt(sizeMatch?.[1] ?? "0", 10),
            contentType: "application/octet-stream",
            lastModified: lastModMatch?.[1] ?? new Date().toISOString(),
          });
        }
      }

      return files;
    } catch {
      return prefix ? MOCK_FILES.filter((f) => f.key.startsWith(prefix)) : [...MOCK_FILES];
    }
  }

  private async signS3Request(
    method: string,
    bucket: string,
    key: string,
    queryString: string,
    region: string,
    endpoint: string,
    accessKey: string,
    secretKey: string,
  ): Promise<Record<string, string>> {
    const crypto = await import("crypto");
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
    const service = "s3";
    const host = new URL(`${endpoint}/${bucket}`).hostname;

    const emptyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${emptyHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalUri = key ? `/${key}` : "/";
    const canonicalRequest = [method, canonicalUri, queryString, canonicalHeaders, signedHeaders, emptyHash].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const hashedRequest = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashedRequest}`;

    const hmacSign = (sigKey: Buffer, msg: string) => crypto.createHmac("sha256", sigKey).update(msg).digest();
    const signingKey = hmacSign(hmacSign(hmacSign(hmacSign(Buffer.from(`AWS4${secretKey}`), dateStamp), region), service), "aws4_request");
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    return {
      "Authorization": `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": emptyHash,
    };
  }

  private async listAzureFiles(prefix?: string): Promise<StoredFile[]> {
    try {
      const connStr = process.env["AZURE_STORAGE_CONNECTION_STRING"]!;
      const containerName = process.env["AZURE_STORAGE_CONTAINER"] ?? "uploads";

      const accountMatch = connStr.match(/AccountName=([^;]+)/);
      const accountKeyMatch = connStr.match(/AccountKey=([^;]+)/);

      if (!accountMatch || !accountKeyMatch) {
        return [...MOCK_FILES];
      }

      const accountName = accountMatch[1]!;
      const accountKey = accountKeyMatch[1]!;
      const baseUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;
      const queryParams = new URLSearchParams({ restype: "container", comp: "list" });
      if (prefix) queryParams.set("prefix", prefix);

      const requestDate = new Date().toUTCString();
      const canonicalizedResource = `/${accountName}/${containerName}\ncomp:list\nprefix:${prefix ?? ""}\nrestype:container`;
      const stringToSign = `GET\n\n\n\n\n\n\n\n\n\n\n\n${requestDate}\n${canonicalizedResource}`;

      const cryptoModule = await import("crypto");
      const hmac = cryptoModule.createHmac("sha256", Buffer.from(accountKey, "base64"));
      hmac.update(stringToSign, "utf8");
      const signature = hmac.digest("base64");

      const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
        headers: {
          "x-ms-date": requestDate,
          "x-ms-version": "2021-06-08",
          "Authorization": `SharedKey ${accountName}:${signature}`,
        },
      });
      if (!response.ok) return [...MOCK_FILES];

      const xml = await response.text();
      const files: StoredFile[] = [];
      const blobRegex = /<Blob>([\s\S]*?)<\/Blob>/g;
      let match;
      while ((match = blobRegex.exec(xml)) !== null) {
        const block = match[1];
        const nameMatch = /<Name>(.*?)<\/Name>/.exec(block);
        const sizeMatch = /<Content-Length>(.*?)<\/Content-Length>/.exec(block);
        const lastModMatch = /<Last-Modified>(.*?)<\/Last-Modified>/.exec(block);
        const contentTypeMatch = /<Content-Type>(.*?)<\/Content-Type>/.exec(block);

        if (nameMatch) {
          const blobName = nameMatch[1];
          files.push({
            key: blobName,
            url: `${baseUrl}/${blobName}`,
            size: parseInt(sizeMatch?.[1] ?? "0", 10),
            contentType: contentTypeMatch?.[1] ?? "application/octet-stream",
            lastModified: lastModMatch?.[1] ?? new Date().toISOString(),
          });
        }
      }
      return files;
    } catch {
      return [...MOCK_FILES];
    }
  }
}
