import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
} from 'lucide-react';

const properties = [
  {
    name: 'One Market Plaza',
    location: 'San Francisco, CA',
    flood: 'Low',
    wildfire: 'Medium',
    seismic: 'High',
    heat: 'Low',
    insurance: '$2.1M/yr',
    adjustment: '+34%',
    physicalRisk: 62,
    score: 'B',
  },
  {
    name: 'Pacific Heights Apts',
    location: 'San Francisco, CA',
    flood: 'Low',
    wildfire: 'Medium',
    seismic: 'High',
    heat: 'Low',
    insurance: '$890K/yr',
    adjustment: '+28%',
    physicalRisk: 58,
    score: 'B+',
  },
  {
    name: 'South Beach Retail',
    location: 'Miami, FL',
    flood: 'Critical',
    wildfire: 'Low',
    seismic: 'Low',
    heat: 'High',
    insurance: '$1.4M/yr',
    adjustment: '+87%',
    physicalRisk: 89,
    score: 'D',
  },
  {
    name: 'Silicon Valley Industrial',
    location: 'San Jose, CA',
    flood: 'Low',
    wildfire: 'Medium',
    seismic: 'High',
    heat: 'Medium',
    insurance: '$1.8M/yr',
    adjustment: '+41%',
    physicalRisk: 71,
    score: 'B-',
  },
  {
    name: 'Austin Mixed-Use Tower',
    location: 'Austin, TX',
    flood: 'Medium',
    wildfire: 'Medium',
    seismic: 'Low',
    heat: 'Critical',
    insurance: '$1.2M/yr',
    adjustment: '+52%',
    physicalRisk: 76,
    score: 'C+',
  },
];

const riskColor: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  High: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const scoreColor: Record<string, string> = {
  D: 'text-red-400',
  'C+': 'text-orange-400',
  C: 'text-orange-400',
  'B-': 'text-amber-400',
  B: 'text-sky-400',
  'B+': 'text-emerald-400',
};

const regulatoryUpdates = [
  {
    jurisdiction: 'California',
    update: 'SB 54 — Climate Disclosure Requirement for CRE > $5M',
    effective: 'Jan 2026',
    impact: 'High',
  },
  {
    jurisdiction: 'Florida',
    update: 'HB 1557 — Mandatory Flood Risk Disclosure',
    effective: 'Jul 2025',
    impact: 'Critical',
  },
  {
    jurisdiction: 'SEC',
    update: 'Climate Risk Disclosure Rule (Final)',
    effective: 'Mar 2026',
    impact: 'High',
  },
  {
    jurisdiction: 'FEMA',
    update: 'Revised SFHA Flood Maps — 2025 Update',
    effective: 'Ongoing',
    impact: 'Medium',
  },
];

export default function ClimateRisk() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Thermometer className="w-6 h-6 text-orange-400" />
          Climate Risk & Insurance Overlay
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Climate risk scoring, insurance projections, and regulatory watch across all assets
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Critical Risk Properties', value: '1', color: 'text-red-400' },
          { label: 'High Risk Properties', value: '2', color: 'text-orange-400' },
          { label: 'Total Insurance Cost', value: '$7.4M/yr', color: 'text-foreground' },
          { label: 'Avg Risk Premium vs Market', value: '+48%', color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {properties.map((p) => (
          <Card
            key={p.name}
            className={p.flood === 'Critical' || p.heat === 'Critical' ? 'border-red-500/30' : ''}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { label: 'Flood', icon: Droplets, risk: p.flood },
                      { label: 'Wildfire', icon: Wind, risk: p.wildfire },
                      { label: 'Seismic', icon: AlertTriangle, risk: p.seismic },
                      { label: 'Heat', icon: Thermometer, risk: p.heat },
                    ].map(({ label, icon: Icon, risk }) => (
                      <div key={label} className="flex items-center gap-1">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{label}:</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${riskColor[risk]}`}
                        >
                          {risk}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>
                      Insurance: <span className="text-foreground font-medium">{p.insurance}</span>
                    </span>
                    <span>
                      vs. 2020 baseline:{' '}
                      <span
                        className={
                          p.adjustment.includes('+')
                            ? 'text-red-400 font-medium'
                            : 'text-emerald-400'
                        }
                      >
                        {p.adjustment}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <p className={`text-3xl font-bold ${scoreColor[p.score]}`}>{p.score}</p>
                  <p className="text-[10px] text-muted-foreground">Climate Score</p>
                  <div className="mt-1 h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.physicalRisk >= 80 ? 'bg-red-500' : p.physicalRisk >= 65 ? 'bg-orange-500' : 'bg-amber-500'}`}
                      style={{ width: `${p.physicalRisk}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Regulatory Watch — Climate Disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {regulatoryUpdates.map((r) => (
            <div
              key={r.update}
              className="flex items-start justify-between p-3 rounded-lg bg-muted/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {r.jurisdiction}
                  </Badge>
                  <span className="text-xs font-medium">{r.update}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Effective: {r.effective}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${riskColor[r.impact]}`}>
                {r.impact}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
