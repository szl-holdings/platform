import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { File, FileText, Image, Film, Archive, Clock } from "lucide-react";

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

export default function FilesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-files"],
    queryFn: api.getFiles,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">File Browser</h1>
        <p className="text-sm text-muted-foreground mt-1">Uploaded assets and documents</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">File</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Size</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Modified</th>
              </tr>
            </thead>
            <tbody>
              {data?.files.map((file) => (
                <tr key={file.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.contentType)}
                      <span className="text-sm font-mono">{file.key}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{file.contentType}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{formatBytes(file.size)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(file.lastModified).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.files || data.files.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">No files uploaded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
