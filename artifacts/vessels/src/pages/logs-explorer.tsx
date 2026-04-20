import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronRight,
  Filter,
  Info,
  ScrollText,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { dataProvider } from '@/data/data-provider';

const severityConfig = {
  Critical: {
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertTriangle,
    dotColor: 'bg-red-400',
    lineColor: 'border-l-red-400',
  },
  Warning: {
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: AlertCircle,
    dotColor: 'bg-orange-400',
    lineColor: 'border-l-orange-400',
  },
  Info: {
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Info,
    dotColor: 'bg-blue-400',
    lineColor: 'border-l-blue-400',
  },
  Debug: {
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    icon: Bug,
    dotColor: 'bg-zinc-400',
    lineColor: 'border-l-zinc-400',
  },
};

const severityOptions = ['All', 'Critical', 'Warning', 'Info', 'Debug'] as const;

export default function LogsExplorerPage() {
  const [severity, setSeverity] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: logs = [], isLoading } = useStandardQuery({
    queryKey: ['event-logs', severity, search],
    queryFn: () =>
      dataProvider.getEventLogs({
        severity: severity === 'All' ? undefined : severity,
        search: search || undefined,
      }),
  });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const criticalCount = logs.filter((l) => l.severity === 'Critical').length;
  const warningCount = logs.filter((l) => l.severity === 'Warning').length;

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary" /> Logs Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AIS events, system alerts, compliance entries, and crew reports — searchable log stream
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 animate-fade-in-up stagger-1">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by message, vessel, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {severityOptions.map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${severity === s ? 'bg-primary/10 text-primary border-primary/30' : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{logs.length} events</span>
          {criticalCount > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
              {criticalCount} Critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-400 border-orange-500/20"
            >
              {warningCount} Warning
            </Badge>
          )}
        </div>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-2">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const config =
                severityConfig[log.severity as keyof typeof severityConfig] ?? severityConfig.Debug;
              const SeverityIcon = config.icon;
              const isExpanded = expandedIds.has(log.id);
              return (
                <div
                  key={log.id}
                  className={`border-l-2 ${config.lineColor} transition-all hover:bg-muted/30`}
                >
                  <button
                    className="w-full text-left p-4 flex items-start gap-3"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center gap-2 mt-0.5 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                      <SeverityIcon
                        className={`w-4 h-4 ${log.severity === 'Critical' ? 'text-red-400' : log.severity === 'Warning' ? 'text-orange-400' : log.severity === 'Info' ? 'text-blue-400' : 'text-zinc-400'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          {log.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(log.timestamp ?? Date.now()).toLocaleString()}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted text-muted-foreground"
                        >
                          {log.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{log.vesselName}</span>
                      </div>
                      <p className="text-sm mt-1 font-medium">{log.message}</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 ml-9 space-y-2 animate-fade-in-up">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Source: <span className="text-foreground">{log.source}</span>
                        </span>
                        <span>
                          Vessel ID: <span className="text-foreground">{log.vesselId}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {logs.length === 0 && !isLoading && (
              <div className="p-12 text-center">
                <ScrollText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No logs match your filters</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try adjusting the severity filter or search terms
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
