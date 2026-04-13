import type { ReactNode } from "react";

interface GraphQLPanelShellProps {
  dotColor: string;
  children: ReactNode;
}

export function GraphQLPanelShell({ dotColor, children }: GraphQLPanelShellProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-pulse`} />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">GraphQL Live Data</span>
      </div>
      {children}
    </div>
  );
}
