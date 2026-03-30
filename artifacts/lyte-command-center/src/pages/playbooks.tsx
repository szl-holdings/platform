import { usePlaybooks } from "@/hooks/use-lyte";
import { BookOpen, Search, ChevronRight, FileText, Lock, CheckCircle2, Circle, Hash } from "lucide-react";
import { useState } from "react";
import { cn } from "@workspace/shared-ui/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Playbooks() {
  const { data: playbooks, isLoading } = usePlaybooks();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-500 animate-pulse">Loading SOP library...</span>
        </div>
      </div>
    );
  }

  const filtered = playbooks?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const selected = playbooks?.find(p => p.id === selectedId) || filtered[0];

  const categories = [...new Set(filtered.map(p => p.category))];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <div className="w-full md:w-80 flex flex-col shrink-0 h-full bg-glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-white">SOP Library</h2>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-md">{filtered.length} docs</span>
          </div>
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
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {(cat || "").replace('_', ' ')}
              </div>
              <div className="space-y-1">
                {filtered.filter(p => p.category === cat).map((pb, i) => (
                  <motion.button
                    key={pb.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
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
                        "font-medium truncate mb-0.5 transition-colors text-sm",
                        selected?.id === pb.id ? "text-cyan-400" : "text-slate-300 group-hover:text-white"
                      )}>
                        {pb.title}
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 shrink-0 transition-transform",
                      selected?.id === pb.id ? "text-cyan-500 translate-x-1" : "text-slate-600 group-hover:text-slate-400"
                    )} />
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full relative">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div 
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {(selected.category || "").replace('_', ' ')}
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
                  {(selected.content || "").split('\n\n').map((block: string, i: number) => {
                    if (block.startsWith('# ')) {
                      return (
                        <motion.h1
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="text-2xl font-display font-bold text-white mb-4 mt-6 first:mt-0 pb-2 border-b border-white/10"
                        >
                          {block.replace('# ', '')}
                        </motion.h1>
                      );
                    }
                    if (block.startsWith('## ')) {
                      return (
                        <motion.h2
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="text-xl font-display font-semibold text-cyan-50 mb-3 mt-6"
                        >
                          {block.replace('## ', '')}
                        </motion.h2>
                      );
                    }
                    if (block.startsWith('- ') || block.startsWith('1. ')) {
                      const items = block.split('\n');
                      return (
                        <div key={i} className="space-y-2 my-4">
                          {items.map((item: string, j: number) => {
                            const isNumbered = /^\d+\.\s/.test(item);
                            return (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (i + j) * 0.04 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                              >
                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  {isNumbered ? (
                                    <span className="text-[10px] font-bold text-cyan-400">{j + 1}</span>
                                  ) : (
                                    <Circle className="w-2 h-2 text-cyan-500 fill-cyan-500" />
                                  )}
                                </div>
                                <span className="text-slate-300 text-sm leading-relaxed">
                                  {item.replace(/^(- |\d+\. )/, '')}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="text-slate-300 leading-relaxed mb-4"
                      >
                        {block}
                      </motion.p>
                    );
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
        </AnimatePresence>
      </div>
    </div>
  );
}
