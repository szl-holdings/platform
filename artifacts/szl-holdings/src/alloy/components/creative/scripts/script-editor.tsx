import { format } from 'date-fns';
import { CheckCircle, History, MessageSquare, Save } from 'lucide-react';
import * as React from 'react';
import { useScripts, useUpdateScript } from '@/alloy/hooks/use-creative';

export function ScriptEditor({ campaignId }: { campaignId: string }) {
  const { data: scripts } = useScripts(campaignId);
  const updateScript = useUpdateScript();

  const activeScript = scripts?.[0];
  const [content, setContent] = React.useState(activeScript?.content || '');

  React.useEffect(() => {
    if (activeScript) setContent(activeScript.content);
  }, [activeScript]);

  if (!activeScript)
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
        No scripts found. Create one to begin.
      </div>
    );

  const handleSave = () => {
    updateScript.mutate({ id: activeScript.id, campaignId: parseInt(campaignId, 10), content });
  };

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1 flex flex-col bg-[#0d1117] rounded-xl border border-white/8 overflow-hidden">
        <div className="h-14 border-b border-white/8 flex items-center justify-between px-4 bg-white/3">
          <div className="flex items-center gap-3">
            <span className="font-medium text-white">{activeScript.title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-400">
              v{activeScript.version}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded capitalize ${activeScript.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'}`}
            >
              {activeScript.status}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={updateScript.isPending || content === activeScript.content}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {updateScript.isPending ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
        <div className="flex-1 p-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-0 outline-none p-6 lg:p-8 text-base leading-relaxed bg-transparent text-slate-200 font-sans placeholder:text-slate-600"
            placeholder="Start typing your script..."
          />
        </div>
      </div>

      <div className="w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pb-6">
        <div className="bg-[#0d1117] rounded-xl border border-white/8 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm text-white">
            <MessageSquare className="w-4 h-4 text-blue-400" /> Director Notes
          </h3>
          <div className="text-sm text-slate-400 bg-white/3 rounded-lg p-3 border border-white/6">
            {activeScript.notes || 'No notes yet.'}
          </div>

          {activeScript.status !== 'approved' && (
            <button
              className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-colors"
              onClick={() =>
                updateScript.mutate({
                  id: activeScript.id,
                  campaignId: parseInt(campaignId, 10),
                  status: 'approved',
                })
              }
            >
              <CheckCircle className="w-4 h-4" /> Mark as Approved
            </button>
          )}
        </div>

        <div className="bg-[#0d1117] rounded-xl border border-white/8 p-4 flex-1">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm text-white">
            <History className="w-4 h-4 text-blue-400" /> Version History
          </h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {[activeScript.version, activeScript.version - 1].map(
              (v, i) =>
                v > 0 && (
                  <div key={v} className="relative flex items-start gap-3">
                    <div className="absolute left-0 w-2 h-2 rounded-full bg-blue-400 mt-1.5 z-10" />
                    <div className="ml-6 flex-1 text-sm">
                      <p className="font-medium text-slate-200">Version {v}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {i === 0
                          ? 'Current Draft'
                          : format(new Date(activeScript.updatedAt || new Date()), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
