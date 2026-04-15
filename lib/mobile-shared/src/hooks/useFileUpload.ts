import { useState, useCallback } from "react";
import { Platform } from "react-native";

export type UploadStatus = "idle" | "requesting" | "uploading" | "registering" | "done" | "error";

export interface UploadedFile {
  id: number | string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageUrl: string;
  category?: string;
  createdAt?: string;
}

export interface FileUploadOptions {
  apiBase?: string;
  context?: string;
  onProgress?: (progress: number) => void;
}

export interface FileToUpload {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

function getApiBase(): string {
  const domain =
    typeof process !== "undefined" && process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "";
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const { context = "general", onProgress } = options;
  const apiBase = options.apiBase ?? getApiBase();

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const updateProgress = useCallback(
    (p: number) => {
      setProgress(p);
      onProgress?.(p);
    },
    [onProgress],
  );

  const upload = useCallback(
    async (file: FileToUpload): Promise<UploadedFile | null> => {
      setStatus("requesting");
      setError(null);
      setProgress(0);
      setUploadedFile(null);

      try {
        const fileSize = file.size ?? 1;

        const urlRes = await fetch(`${apiBase}/api/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: fileSize,
            contentType: file.type,
          }),
        });

        if (!urlRes.ok) {
          throw new Error(`Failed to get upload URL: ${urlRes.status}`);
        }

        const { uploadURL, objectPath } = (await urlRes.json()) as {
          uploadURL: string;
          objectPath: string;
        };

        setStatus("uploading");
        updateProgress(10);

        if (Platform.OS === "web") {
          const blob = await fetch(file.uri).then((r) => r.blob());
          updateProgress(30);

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                updateProgress(30 + Math.round((e.loaded / e.total) * 55));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Upload failed: ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error("Upload network error"));
            xhr.open("PUT", uploadURL);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(blob);
          });
        } else {
          const FileSystem = await import("expo-file-system").catch(() => null);
          if (!FileSystem) {
            throw new Error("expo-file-system not available");
          }
          const uploadResult = await FileSystem.uploadAsync(uploadURL, file.uri, {
            httpMethod: "PUT",
            headers: { "Content-Type": file.type },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          });
          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(`Upload failed: ${uploadResult.status}`);
          }
          updateProgress(85);
        }

        updateProgress(90);
        setStatus("registering");

        const registerRes = await fetch(`${apiBase}/api/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectPath,
            originalName: file.name,
            mimeType: file.type,
            size: fileSize,
            category: context === "general" ? "other" : "document",
          }),
        });

        if (!registerRes.ok) {
          throw new Error(`Failed to register file: ${registerRes.status}`);
        }

        const registered = (await registerRes.json()) as
          | UploadedFile
          | { data?: UploadedFile; file?: UploadedFile };
        const result: UploadedFile =
          (registered as { data?: UploadedFile }).data ??
          (registered as { file?: UploadedFile }).file ??
          (registered as UploadedFile);

        updateProgress(100);
        setStatus("done");
        setUploadedFile(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    [apiBase, context, updateProgress],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return { upload, status, progress, error, uploadedFile, reset };
}
