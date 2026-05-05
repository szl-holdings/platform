import { Plug } from 'lucide-react';

interface NexusApiPendingProps {
  endpoint: string;
  description: string;
}

export function NexusApiPending({ endpoint, description }: NexusApiPendingProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-praxis-surface border border-praxis flex items-center justify-center mx-auto">
          <Plug className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground/80 mb-1.5">API Endpoint Pending</div>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">{description}</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-praxis-surface border border-praxis">
          <span className="text-[10px] font-mono text-praxis-cyan/70">{endpoint}</span>
        </div>
      </div>
    </div>
  );
}
