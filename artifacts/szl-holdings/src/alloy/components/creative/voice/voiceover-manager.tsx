import { Play, Plus, RefreshCw, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useCreateVoiceover, useVoiceovers } from '@/alloy/hooks/use-creative';

export function VoiceoverManager({ campaignId }: { campaignId: string }) {
  const { data: voices, isLoading } = useVoiceovers(campaignId);
  const createVoice = useCreateVoiceover();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newText, setNewText] = React.useState('');

  const handleCreate = () => {
    createVoice.mutate(
      {
        campaignId: parseInt(campaignId, 10),
        text: newText,
        provider: 'elevenlabs',
        name: 'AI Generate - ' + new Date().toLocaleTimeString(),
      },
      {
        onSuccess: () => {
          setIsCreating(false);
          setNewText('');
        },
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-6 mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">ElevenLabs AI Integration</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Generate high-quality, ultra-realistic voiceovers directly from your scripts. Select an
            AI voice profile and hit generate to get instant audio beds for your storyboards.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Voice Assets</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCreating ? 'border border-white/10 text-slate-400 hover:border-white/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'}`}
        >
          {isCreating ? (
            'Cancel'
          ) : (
            <>
              <Plus className="w-4 h-4" /> Generate Audio
            </>
          )}
        </button>
      </div>

      {isCreating && (
        <div className="p-6 mb-8 border border-blue-500/20 bg-blue-500/3 rounded-xl">
          <h4 className="font-medium mb-3 text-white text-sm">Input Text to Speech</h4>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type script here to generate voiceover..."
            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-slate-200 resize-none outline-none focus:border-blue-500/30 placeholder:text-slate-600 mb-4"
          />
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={!newText.trim() || createVoice.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {voices?.map((voice) => (
          <div
            key={voice.id}
            className="p-4 flex items-center gap-4 bg-[#0d1117] border border-white/8 hover:border-white/12 rounded-xl transition-colors"
          >
            <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-400 transition-colors shrink-0 text-slate-400">
              <Play className="w-5 h-5 ml-1" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-white truncate">{voice.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-500">
                  {voice.provider}
                </span>
                {voice.status === 'generating' && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/20 text-amber-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Generating
                  </span>
                )}
                {voice.status === 'ready' && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 truncate">
                {voice.text || 'No transcript available'}
              </p>
            </div>
            <div className="shrink-0 text-sm font-mono text-slate-500">0:14</div>
          </div>
        ))}
        {voices?.length === 0 && !isLoading && (
          <div className="text-center p-12 border border-dashed border-white/10 rounded-xl text-slate-600">
            No voice assets yet.
          </div>
        )}
      </div>
    </div>
  );
}
