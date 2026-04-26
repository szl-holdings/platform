import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
import { Clock, Eye, Search, Target } from 'lucide-react';
import { useState } from 'react';

const savedHunts = [
  {
    id: 'HUNT-001',
    name: 'Living-Off-the-Land Binaries',
    hits: 47,
    severity: 'High',
    lastRun: '2h ago',
  },
  {
    id: 'HUNT-002',
    name: 'Beaconing Intervals — C2 Detection',
    hits: 12,
    severity: 'Critical',
    lastRun: '4h ago',
  },
  {
    id: 'HUNT-003',
    name: 'Credential Access via LSASS',
    hits: 3,
    severity: 'Critical',
    lastRun: '6h ago',
  },
  {
    id: 'HUNT-004',
    name: 'Lateral Movement via Pass-the-Hash',
    hits: 8,
    severity: 'High',
    lastRun: '8h ago',
  },
  {
    id: 'HUNT-005',
    name: 'Data Staging for Exfiltration',
    hits: 2,
    severity: 'Medium',
    lastRun: '12h ago',
  },
];

const iocResults = [
  {
    ioc: '103.45.67.89',
    type: 'IP',
    reputation: 'Malicious',
    threat: 'APT29 C2 Infrastructure',
    seen: '14 endpoints',
    lastSeen: '47 min ago',
  },
  {
    ioc: 'd8f4a2b3c1e5f7a9',
    type: 'File Hash',
    reputation: 'Malicious',
    threat: 'Cobalt Strike Beacon',
    seen: '3 hosts',
    lastSeen: '1h ago',
  },
  {
    ioc: 'malware-payload.zip',
    type: 'Filename',
    reputation: 'Suspicious',
    threat: 'Potential Dropper',
    seen: '7 endpoints',
    lastSeen: '8h ago',
  },
  {
    ioc: 'apt29.exfil.domain',
    type: 'Domain',
    reputation: 'Malicious',
    threat: 'Known APT29 Domain',
    seen: '23 connections',
    lastSeen: '22 min ago',
  },
];

const huntTimeline = [
  {
    time: '09:41',
    event: 'Hunt HUNT-003 detected LSASS access on DC-PROD-03',
    severity: 'Critical',
  },
  { time: '09:38', event: 'IOC match: 103.45.67.89 seen on WORKSTATION-142', severity: 'Critical' },
  {
    time: '09:12',
    event: 'Behavioral query: certutil.exe spawned by winword.exe',
    severity: 'High',
  },
  {
    time: '08:55',
    event: 'Hunt HUNT-002 triggered — beaconing pattern on LAPTOP-445',
    severity: 'High',
  },
  {
    time: '08:23',
    event: 'Analyst S. Park started manual hunt: Kerberoasting indicators',
    severity: 'Medium',
  },
];

const sevColor: Record<string, string> = {
  Critical: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20',
  High: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  Medium: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
};

export default function ThreatHunting() {
  const [query, setQuery] = useState('');
  type TabKey = 'hunts' | 'ioc' | 'timeline';
  const [activeTab, setActiveTab] = useState<TabKey>('hunts');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Threat Hunting Workbench
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          IOC search, behavioral queries, and historical timeline investigation
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter behavioral query or IOC (IP, hash, domain, filename)..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Execute Hunt
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: 'hunts', label: 'Saved Hunts' },
            { key: 'ioc', label: 'IOC Search' },
            { key: 'timeline', label: 'Hunt Timeline' },
          ] as { key: TabKey; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'hunts' && (
        <div className="space-y-3">
          {savedHunts.map((hunt) => (
            <Card
              key={hunt.id}
              className="hover:border-primary/30 transition-colors cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{hunt.name}</span>
                      <Badge variant="outline" className={`text-[10px] ${sevColor[hunt.severity]}`}>
                        {hunt.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last run: {hunt.lastRun}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xl font-bold ${hunt.hits > 10 ? 'text-[#f5f5f5]' : hunt.hits > 5 ? 'text-[#c9b787]' : 'text-[#c9b787]'}`}
                    >
                      {hunt.hits}
                    </p>
                    <p className="text-[10px] text-muted-foreground">hits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'ioc' && (
        <div className="space-y-3">
          {iocResults.map((ioc) => (
            <Card key={ioc.ioc}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f5]/10 flex items-center justify-center shrink-0">
                      <Eye className="w-4 h-4 text-[#f5f5f5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{ioc.ioc}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {ioc.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${ioc.reputation === 'Malicious' ? 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/20' : 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20'}`}
                        >
                          {ioc.reputation}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ioc.threat}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                        <span>Seen on: {ioc.seen}</span>
                        <span>Last: {ioc.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {huntTimeline.map((event, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <span className="font-mono text-xs text-muted-foreground w-12 shrink-0 mt-0.5">
                {event.time}
              </span>
              <div
                className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${event.severity === 'Critical' ? 'bg-[#f5f5f5]' : event.severity === 'High' ? 'bg-[#c9b787]' : 'bg-[#c9b787]'}`}
              />
              <p className="text-xs">{event.event}</p>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${sevColor[event.severity]}`}
              >
                {event.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
