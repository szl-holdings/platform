import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Command, ArrowRight, MessageSquare, Users, GitBranch, Share2, Shield } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const COMMANDS = [
  { id: "chat", label: "New Chat", icon: MessageSquare, href: "/app/chat", group: "Actions" },
  { id: "agents", label: "View Agents", icon: Users, href: "/app/agents", group: "Navigation" },
  { id: "workflows", label: "View Workflows", icon: GitBranch, href: "/app/workflows", group: "Navigation" },
  { id: "connectors", label: "Manage Connectors", icon: Share2, href: "/app/connectors", group: "Navigation" },
  { id: "governance", label: "Review Approvals", icon: Shield, href: "/app/governance", group: "Actions" },
];

export function AlloyCommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const filteredCommands = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((s) => Math.min(s + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        setLocation(filteredCommands[selectedIndex].href);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, setLocation, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-xl bg-[#0d121c] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-slate-200 outline-none placeholder:text-slate-600 text-lg"
            placeholder="Search commands, agents, workflows..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
            ESC to close
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                  selectedIndex === i ? "bg-[#4B8BDB]/15 text-[#4B8BDB]" : "text-slate-300 hover:bg-slate-800/50"
                )}
                onClick={() => {
                  setLocation(cmd.href);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="flex items-center gap-3">
                  <cmd.icon size={16} className={selectedIndex === i ? "text-[#4B8BDB]" : "text-slate-500"} />
                  {cmd.label}
                </div>
                {selectedIndex === i && <ArrowRight size={14} className="text-[#4B8BDB]" />}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 bg-[#080c14] flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Command size={12}/> Alloy Platform</span>
        </div>
      </div>
    </div>
  );
}
