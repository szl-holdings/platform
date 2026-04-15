import { Radio, Database } from "lucide-react";

interface LiveDataBadgeProps {
  isLive?: boolean;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function LiveDataBadge({ isLive, isLoading, className = "", size = "sm" }: LiveDataBadgeProps) {
  if (isLoading) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        Connecting...
      </span>
    );
  }
  if (isLive) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#6b8f71]/10 text-[#6b8f71] border border-[#6b8f71]/20 ${size === "md" ? "px-3 py-1.5" : ""} ${className}`}>
        <Radio className="w-3 h-3 animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 ${className}`}>
      <Database className="w-3 h-3" />
      Demo
    </span>
  );
}
