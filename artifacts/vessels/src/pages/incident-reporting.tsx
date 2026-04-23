import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, } from '@szl-holdings/shared-ui/ui/card';
import {
  AlertTriangle,
  Bomb,
  Clock,
  Flag,
  MapPin,
  Shield,
  Skull,
} from 'lucide-react';
import { type ElementType, useState } from 'react';

const regions = [
  {
    name: 'Gulf of Guinea',
    threats: ['Piracy', 'Armed Robbery'],
    level: 'Critical',
    incidents30d: 8,
    avgResponse: '4.2h',
    advisory: 'IMO + BIMCO High Risk Zone',
  },
  {
    name: 'Red Sea / Gulf of Aden',
    threats: ['Houthi Attacks', 'Drone Strikes', 'War Risk'],
    level: 'Critical',
    incidents30d: 23,
    avgResponse: '1.8h',
    advisory: 'UK MOD War Risk — Avoid if Possible',
  },
  {
    name: 'Strait of Malacca',
    threats: ['Petty Theft', 'Opportunistic Boarding'],
    level: 'Medium',
    incidents30d: 4,
    avgResponse: '6.1h',
    advisory: 'ReCAAP ISC Active Monitoring',
  },
  {
    name: 'Persian Gulf',
    threats: ['Sanctions Zone Transit', 'State Actor Risk'],
    level: 'High',
    incidents30d: 11,
    avgResponse: '2.4h',
    advisory: 'JMIC — Enhanced Vigilance',
  },
  {
    name: 'Black Sea',
    threats: ['Mining Risk', 'Military Activity'],
    level: 'High',
    incidents30d: 9,
    avgResponse: '3.1h',
    advisory: 'War Risk — Insurance Premium Zone',
  },
  {
    name: 'West Africa',
    threats: ['Armed Robbery', 'Crew Kidnapping'],
    level: 'High',
    incidents30d: 6,
    avgResponse: '5.7h',
    advisory: 'MDAT-GoG Coordination Required',
  },
];

const incidents = [
  {
    id: 'INC-001',
    type: 'Houthi Drone Attack',
    vessel: 'LIBERTY TRADER',
    region: 'Red Sea — 15.2°N 43.8°E',
    timestamp: '2h ago',
    casualties: 0,
    damage: 'Minor structural',
    status: 'Under Investigation',
    severity: 'Critical',
  },
  {
    id: 'INC-002',
    type: 'Armed Piracy Boarding',
    vessel: 'SILVER CLOUD',
    region: 'Gulf of Guinea — 2.1°N 7.4°E',
    timestamp: '7h ago',
    casualties: 2,
    damage: 'Cargo stolen',
    status: 'Resolved',
    severity: 'High',
  },
  {
    id: 'INC-003',
    type: 'Suspicious Approach',
    vessel: 'NORDIC SEA',
    region: 'Strait of Malacca — 1.8°N 103.2°E',
    timestamp: '14h ago',
    casualties: 0,
    damage: 'None',
    status: 'Resolved',
    severity: 'Medium',
  },
  {
    id: 'INC-004',
    type: 'Mine Warning',
    vessel: 'Fleet Advisory',
    region: 'Black Sea — General Alert',
    timestamp: '1d ago',
    casualties: 0,
    damage: 'N/A',
    status: 'Active Advisory',
    severity: 'High',
  },
  {
    id: 'INC-005',
    type: 'Crew Kidnapping Threat',
    vessel: 'GOLDEN HORIZON',
    region: 'Gulf of Guinea — 4.5°N 8.1°E',
    timestamp: '2d ago',
    casualties: 0,
    damage: 'None — vessel diverted',
    status: 'Resolved',
    severity: 'Critical',
  },
];

const threatTypeIcon: Record<string, ElementType> = {
  'Houthi Drone Attack': Bomb,
  'Armed Piracy Boarding': Skull,
  'Suspicious Approach': AlertTriangle,
  'Mine Warning': Flag,
  'Crew Kidnapping Threat': Shield,
};

const levelColor: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function IncidentReporting() {
  const [selected, setSelected] = useState<(typeof incidents)[0] | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          Maritime Incident & Threat Feed
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Piracy, sanctions zone, war risk, and regional threat intelligence with incident reporting
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Critical Zones', value: '2', color: 'text-red-400' },
          { label: 'Incidents (30 days)', value: '61', color: 'text-orange-400' },
          { label: 'SEXTANT in High Risk', value: '18', color: 'text-amber-400' },
          { label: 'Avg Response Time', value: '3.6h', color: 'text-sky-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Regional Threat Assessment
          </h3>
          <div className="space-y-2">
            {regions.map((r) => (
              <Card key={r.name} className={r.level === 'Critical' ? 'border-red-500/30' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{r.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${levelColor[r.level]}`}>
                          {r.level}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.threats.map((t) => (
                          <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{r.advisory}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-muted-foreground">30d Incidents</p>
                      <p
                        className={`text-lg font-bold ${r.level === 'Critical' ? 'text-red-400' : r.level === 'High' ? 'text-orange-400' : 'text-amber-400'}`}
                      >
                        {r.incidents30d}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Live Incident Feed
          </h3>
          <div className="space-y-2">
            {incidents.map((inc) => {
              const Icon = threatTypeIcon[inc.type] || AlertTriangle;
              return (
                <Card
                  key={inc.id}
                  onClick={() => setSelected(selected?.id === inc.id ? null : inc)}
                  className={`cursor-pointer transition-all hover:border-primary/30 ${selected?.id === inc.id ? 'border-primary' : ''} ${inc.severity === 'Critical' ? 'border-red-500/20' : ''}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${inc.severity === 'Critical' ? 'bg-red-500/10' : inc.severity === 'High' ? 'bg-orange-500/10' : 'bg-amber-500/10'}`}
                      >
                        <Icon
                          className={`w-4 h-4 ${inc.severity === 'Critical' ? 'text-red-400' : inc.severity === 'High' ? 'text-orange-400' : 'text-amber-400'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs">{inc.type}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${levelColor[inc.severity]}`}
                          >
                            {inc.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-primary mt-0.5">{inc.vessel}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {inc.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {inc.timestamp}
                          </span>
                        </div>
                        {selected?.id === inc.id && (
                          <div className="mt-2 pt-2 border-t border-border space-y-1">
                            <div className="flex gap-4 text-xs">
                              <span>
                                Casualties:{' '}
                                <span
                                  className={
                                    inc.casualties > 0
                                      ? 'text-red-400 font-bold'
                                      : 'text-emerald-400'
                                  }
                                >
                                  {inc.casualties}
                                </span>
                              </span>
                              <span>
                                Damage: <span className="text-foreground">{inc.damage}</span>
                              </span>
                            </div>
                            <span
                              className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${inc.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                            >
                              {inc.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
