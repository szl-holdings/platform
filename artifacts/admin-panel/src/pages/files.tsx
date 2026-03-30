import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FolderOpen, FileText, Image, File } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime?: string }) {
  if (!mime) return <File className="w-4 h-4 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

export default function FilesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-files"], queryFn: api.getFiles });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground mt-1">Uploaded files and storage assets</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">File</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.files.map((f) => (
                <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <FileIcon mime={f.mimeType} />
                      <span className="font-medium text-sm truncate max-w-[240px]">{f.fileName || f.originalName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{f.mimeType || "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{f.sizeBytes ? formatBytes(f.sizeBytes) : "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {data?.files.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground text-sm">No files uploaded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
