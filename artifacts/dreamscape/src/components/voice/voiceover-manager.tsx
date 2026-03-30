import * as React from "react";
import { Sparkles, Play, Pause, Plus, RefreshCw } from "lucide-react";
import { useVoiceovers, useCreateVoiceover } from "@/hooks/use-creative";
import { Button, Card, Badge, Input, Textarea } from "@/components/ui";

export function VoiceoverManager({ campaignId }: { campaignId: string }) {
  const { data: voices, isLoading } = useVoiceovers(campaignId);
  const createVoice = useCreateVoiceover();
  
  const [isCreating, setIsCreating] = React.useState(false);
  const [newText, setNewText] = React.useState("");

  const handleCreate = () => {
    createVoice.mutate({ campaignId: parseInt(campaignId, 10), text: newText, provider: "elevenlabs", name: "AI Generate - " + new Date().toLocaleTimeString() }, {
      onSuccess: () => {
        setIsCreating(false);
        setNewText("");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6 mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">ElevenLabs AI Integration</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Generate high-quality, ultra-realistic voiceovers directly from your scripts. Select an AI voice profile and hit generate to get instant audio beds for your storyboards.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Voice Assets</h2>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Generate Audio</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 mb-8 border-primary/30 shadow-lg shadow-primary/5">
          <h4 className="font-medium mb-3">Input Text to Speech</h4>
          <Textarea 
            value={newText} 
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type script here to generate voiceover..."
            className="mb-4"
          />
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={!newText.trim() || createVoice.isPending}>
              <Sparkles className="w-4 h-4 mr-2" /> Generate with AI
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {voices?.map(voice => (
          <Card key={voice.id} className="p-4 flex items-center gap-4 hover:border-border/80 transition-colors">
            <button className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 text-foreground group">
              <Play className="w-5 h-5 ml-1" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-foreground truncate">{voice.name}</h4>
                <Badge variant={voice.provider === 'elevenlabs' ? 'default' : 'outline'} className="text-[10px] py-0">
                  {voice.provider}
                </Badge>
                {voice.status === 'generating' && (
                  <Badge variant="warning" className="animate-pulse flex items-center gap-1 text-[10px] py-0">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Generating
                  </Badge>
                )}
                {voice.status === 'ready' && <Badge variant="success" className="text-[10px] py-0">Ready</Badge>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{voice.text || "No transcript available"}</p>
            </div>
            <div className="shrink-0 text-sm font-mono text-muted-foreground">
              0:14
            </div>
          </Card>
        ))}
        {voices?.length === 0 && !isLoading && (
          <div className="text-center p-12 border border-dashed border-border rounded-xl text-muted-foreground">
            No voice assets yet.
          </div>
        )}
      </div>
    </div>
  );
}
