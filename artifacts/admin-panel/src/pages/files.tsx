import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { File, FileText, Image, Film, Archive, Clock, FolderOpen } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return <Image className="w-4 h-4 text-purple-400" />;
  if (contentType.startsWith("video/")) return <Film className="w-4 h-4 text-blue-400" />;
  if (contentType === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  if (contentType.includes("zip") || contentType.includes("tar")) return <Archive className="w-4 h-4 text-amber-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FilesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-files"],
    queryFn: api.getFiles,
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">File Browser</h1>
          <p className="text-sm text-muted-foreground mt-1">Uploaded assets and documents</p>
        </div>
        {data?.files && data.files.length > 0 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground">{data.files.length} files</span>
        )}
      </div>

      {(!data?.files || data.files.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-1">No files uploaded</h3>
          <p className="text-xs text-muted-foreground text-center max-w-sm">Files will appear here once they are uploaded through the application.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">File</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Size</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Modified</th>
              </tr>
            </thead>
            <tbody>
              {data.files.map((file) => (
                <tr key={file.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {getFileIcon(file.contentType)}
                      </div>
                      <span className="text-sm font-mono">{file.key}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">{file.contentType}</code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">{formatBytes(file.size)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(file.lastModified).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
