import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { Image, Upload, Trash2, Search, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

interface MediaAsset {
  id: number;
  siteId?: number;
  fileName: string;
  fileUrl: string;
  altText?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"];
const MAX_SIZE_MB = 10;

export default function MediaPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cms-media"],
    queryFn: () => apiFetch<MediaAsset[]>("/cms/media-assets"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/cms/media-assets/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-media"] }); setConfirmDelete(null); },
  });

  const assets = (data ?? []).filter(a =>
    !search || a.fileName.toLowerCase().includes(search.toLowerCase()) || (a.altText ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadError(null);

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError(`${file.name}: Unsupported file type (${file.type})`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`${file.name}: File exceeds ${MAX_SIZE_MB}MB limit`);
        continue;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/../api/cms/media-assets/upload`, {
          method: "POST",
          body: formData,
        });
        qc.invalidateQueries({ queryKey: ["cms-media"] });
      } catch (err) {
        setUploadError(`Upload failed: ${(err as Error).message}`);
      } finally {
        setUploading(false);
      }
    }
    e.target.value = "";
  }

  function formatBytes(bytes?: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload, browse, and manage media files</p>
        </div>
        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          uploading ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}>
          {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload Files"}
          <input type="file" multiple accept={ACCEPTED_TYPES.join(",")} onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        Accepted: JPEG, PNG, WebP, SVG, PDF · Max {MAX_SIZE_MB}MB per file
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search assets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-5 py-16 text-center">
          <Image className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No media assets yet. Upload your first file.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {assets.map(asset => (
            <div key={asset.id} className="bg-card border border-border rounded-xl overflow-hidden group relative">
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {asset.mimeType?.startsWith("image/") ? (
                  <img
                    src={asset.fileUrl}
                    alt={asset.altText ?? asset.fileName}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{asset.fileName}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">{asset.mimeType?.split("/")[1]?.toUpperCase() ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{asset.width && asset.height ? `${asset.width}×${asset.height}` : ""}</span>
                </div>
              </div>
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 bg-background/90 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {confirmDelete === asset.id ? (
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => deleteMut.mutate(asset.id)}
                      className="text-xs px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Del
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(asset.id)}
                    className="w-7 h-7 bg-background/90 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
