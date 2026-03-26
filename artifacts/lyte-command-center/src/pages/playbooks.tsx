import { usePlaybooks } from "@/hooks/use-lyte";
import { BookOpen, Search, ChevronRight, FileText, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Playbooks() {
  const { data: playbooks, isLoading } = usePlaybooks();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = playbooks?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const selected = playbooks?.find(p => p.id === selectedId) || filtered[0];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      {/* Sidebar List */}
      <div className="w-full md:w-80 flex flex-col shrink-0 h-full bg-glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-display font-bold text-white mb-4">SOP Library</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search playbooks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filtered.map(pb => (
            <button
              key={pb.id}
              onClick={() => setSelectedId(pb.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group",
                selected?.id === pb.id 
                  ? "bg-cyan-500/10 border border-cyan-500/20" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="min-w-0 pr-2">
                <div className={cn(
                  "font-medium truncate mb-1 transition-colors",
                  selected?.id === pb.id ? "text-cyan-400" : "text-slate-300 group-hover:text-white"
                )}>
                  {pb.title}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  {pb.category.replace('_', ' ')}
                </div>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 shrink-0 transition-transform",
                selected?.id === pb.id ? "text-cyan-500 translate-x-1" : "text-slate-600 group-hover:text-slate-400"
              )} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 bg-glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full relative">
        {selected ? (
          <motion.div 
            key={selected.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full"
          >
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {selected.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Internal Use Only
                </span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">{selected.title}</h1>
              <p className="text-slate-400">{selected.description}</p>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert prose-cyan max-w-none">
                {/* Simulated Markdown Render */}
                {selected.content.split('\n\n').map((block, i) => {
                  if (block.startsWith('# ')) {
                    return <h1 key={i} className="text-2xl font-display font-bold text-white mb-4 mt-6 first:mt-0 pb-2 border-b border-white/10">{block.replace('# ', '')}</h1>;
                  }
                  if (block.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-display font-semibold text-cyan-50 mb-3 mt-6">{block.replace('## ', '')}</h2>;
                  }
                  if (block.startsWith('- ') || block.startsWith('1. ')) {
                    return (
                      <ul key={i} className="space-y-2 my-4 pl-4 border-l-2 border-cyan-500/30">
                        {block.split('\n').map((item, j) => (
                          <li key={j} className="text-slate-300 flex items-start gap-2">
                            <span className="text-cyan-500 mt-1.5">•</span>
                            {item.replace(/^(- |\d+\. )/, '')}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="text-slate-300 leading-relaxed mb-4">{block}</p>;
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Select a playbook to view its contents.</p>
          </div>
        )}
      </div>
    </div>
  );
}
