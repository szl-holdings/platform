import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { getDomainBaseUrl } from '../env';

export type UploadStatus = 'idle' | 'requesting' | 'uploading' | 'registering' | 'done' | 'error';

export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadedFile {
  id: number | string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageUrl: string;
  category?: FileCategory;
  createdAt?: string;
}

export interface FileUploadOptions {
  apiBase?: string;
  /** Explicit file category stored in the DB. Inferred from MIME type if omitted. */
  category?: FileCategory;
  orgId?: number;
  onProgress?: (progress: number, event?: UploadProgressEvent) => void;
  getAuthToken?: () => Promise<string | null> | string | null;
  /** @deprecated Use `category` instead. Kept for backward compatibility. */
  context?: string;
}

export interface FileToUpload {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface ImagePickerAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
}

export interface DocumentPickerAsset {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
}

let _globalAuthTokenGetter: (() => Promise<string | null> | string | null) | null = null;

export function setUploadAuthTokenGetter(
  getter: () => Promise<string | null> | string | null,
): void {
  _globalAuthTokenGetter = getter;
}

async function resolveAuthToken(
  getter?: () => Promise<string | null> | string | null,
): Promise<string | null> {
  const fn = getter ?? _globalAuthTokenGetter;
  if (!fn) return null;
  return fn();
}

function buildAuthHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function fromImagePickerResult(asset: ImagePickerAsset): FileToUpload {
  const rawUri = asset.uri;
  const ext = rawUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const name = asset.fileName ?? `photo_${Date.now()}.${ext}`;
  return {
    uri: rawUri,
    name,
    type: mimeType,
    size: asset.fileSize ?? undefined,
  };
}

export function fromDocumentPickerResult(asset: DocumentPickerAsset): FileToUpload {
  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? undefined,
  };
}

function inferCategory(mimeType: string, explicit?: FileCategory): FileCategory {
  if (explicit) return explicit;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('text/')
  )
    return 'document';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip'))
    return 'archive';
  return 'other';
}

function getApiBase(): string {
  return getDomainBaseUrl() ?? '';
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const { onProgress, getAuthToken } = options;
  const apiBase = options.apiBase ?? getApiBase();

  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const updateProgress = useCallback(
    (p: number, event?: UploadProgressEvent) => {
      setProgress(p);
      onProgress?.(p, event);
    },
    [onProgress],
  );

  const upload = useCallback(
    async (file: FileToUpload): Promise<UploadedFile | null> => {
      setStatus('requesting');
      setError(null);
      setProgress(0);
      setUploadedFile(null);

      try {
        const fileSize = file.size ?? 1;
        const token = await resolveAuthToken(getAuthToken);
        const authHeaders = buildAuthHeaders(token);

        const urlRes = await fetch(`${apiBase}/api/storage/uploads/request-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
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

        setStatus('uploading');
        updateProgress(10);

        if (Platform.OS === 'web') {
          const blob = await fetch(file.uri).then((r) => r.blob());
          updateProgress(30);

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = 30 + Math.round((e.loaded / e.total) * 55);
                updateProgress(pct, {
                  loaded: e.loaded,
                  total: e.total,
                  percent: Math.round((e.loaded / e.total) * 100),
                });
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Upload failed: ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error('Upload network error'));
            xhr.open('PUT', uploadURL);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(blob);
          });
        } else {
          const FileSystem = await import('expo-file-system').catch(() => null);
          if (!FileSystem) {
            throw new Error('expo-file-system not available');
          }

          const uploadTask = FileSystem.createUploadTask(
            uploadURL,
            file.uri,
            {
              httpMethod: 'PUT',
              headers: { 'Content-Type': file.type },
              uploadType: (FileSystem as any).FileSystemUploadType?.BINARY_CONTENT ?? 1,
            },
            (uploadProgress: { totalBytesSent: number; totalBytesExpectedToSend: number }) => {
              const { totalBytesExpectedToSend, totalBytesSent } = uploadProgress;
              if (totalBytesExpectedToSend > 0) {
                const pct = 10 + Math.round((totalBytesSent / totalBytesExpectedToSend) * 75);
                updateProgress(pct, {
                  loaded: totalBytesSent,
                  total: totalBytesExpectedToSend,
                  percent: Math.round((totalBytesSent / totalBytesExpectedToSend) * 100),
                });
              }
            },
          );

          const uploadResult = await uploadTask.uploadAsync();
          if (!uploadResult || uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(`Upload failed: ${uploadResult?.status ?? 'unknown'}`);
          }
        }
        updateProgress(88);
        setStatus('registering');

        const category = inferCategory(file.type, options.category);

        const registerRes = await fetch(`${apiBase}/api/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            objectPath,
            originalName: file.name,
            mimeType: file.type,
            size: fileSize,
            category,
            ...(options.orgId !== undefined && { orgId: options.orgId }),
          }),
        });

        if (!registerRes.ok) {
          throw new Error(`Failed to register file: ${registerRes.status}`);
        }

        const body = (await registerRes.json()) as
          | UploadedFile
          | { data?: UploadedFile; file?: UploadedFile };
        const result: UploadedFile =
          (body as { data?: UploadedFile }).data ??
          (body as { file?: UploadedFile }).file ??
          (body as UploadedFile);

        updateProgress(100);
        setStatus('done');
        setUploadedFile(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [apiBase, options.category, options.orgId, getAuthToken, updateProgress],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return { upload, status, progress, error, uploadedFile, reset };
}
