import * as React from "react";
import { format } from "date-fns";
import { Save, History, MessageSquare, CheckCircle } from "lucide-react";
import { useScripts, useUpdateScript } from "@/hooks/use-creative";
import { Button, Textarea, Badge } from "@/components/ui";

export function ScriptEditor({ campaignId }: { campaignId: string }) {
  const { data: scripts } = useScripts(campaignId);
  const updateScript = useUpdateScript();
  
  const activeScript = scripts?.[0]; // Simplification for demo
  const [content, setContent] = React.useState(activeScript?.content || "");

  React.useEffect(() => {
    if (activeScript) setContent(activeScript.content);
  }, [activeScript]);

  if (!activeScript) return <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">No scripts found. Create one to begin.</div>;

  const handleSave = () => {
    updateScript.mutate({ id: activeScript.id, campaignId, content });
  };

  return (
    <div className="h-full flex gap-6">
      {/* Editor Main */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-lg shadow-black/5">
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="font-medium">{activeScript.title}</span>
            <Badge variant="outline">v{activeScript.version}</Badge>
            <Badge variant={activeScript.status === "approved" ? "success" : "default"} className="capitalize">
              {activeScript.status}
            </Badge>
          </div>
          <Button size="sm" onClick={handleSave} disabled={updateScript.isPending || content === activeScript.content}>
            <Save className="w-4 h-4 mr-2" /> 
            {updateScript.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex-1 p-0">
          <Textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-full resize-none border-0 focus-visible:ring-0 p-6 lg:p-8 text-base leading-relaxed bg-transparent font-sans"
            placeholder="Start typing your script..."
          />
        </div>
      </div>

      {/* Right Sidebar - History & Notes */}
      <div className="w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pb-6">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
            <MessageSquare className="w-4 h-4 text-primary" /> Director Notes
          </h3>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50">
            {activeScript.notes || "No notes yet."}
          </div>
          
          {activeScript.status !== "approved" && (
            <Button className="w-full mt-4" variant="outline" onClick={() => updateScript.mutate({ id: activeScript.id, campaignId, status: "approved" })}>
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Approved
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex-1">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
            <History className="w-4 h-4 text-primary" /> Version History
          </h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {[activeScript.version, activeScript.version - 1].map((v, i) => v > 0 && (
              <div key={v} className="relative flex items-start justify-between gap-3">
                <div className="absolute left-0 w-2 h-2 rounded-full bg-primary mt-1.5 shadow-[0_0_0_4px_var(--color-background)] z-10" />
                <div className="ml-6 flex-1 text-sm">
                  <p className="font-medium text-foreground">Version {v}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {i === 0 ? "Current Draft" : format(new Date(activeScript.updatedAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
