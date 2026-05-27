import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { Shield } from 'lucide-react';
import { useState } from 'react';

const fleetCyberStatus = [
  {
    vessel: 'MV AURORA BOREALIS',
    systems: {
      bridge: 'Secure',
      ecdis: 'Patch Required',
      ais: 'Secure',
      satcom: 'Vulnerable',
      engine: 'Secure',
    },
    riskScore: 62,
    lastScan: '2h ago',
  },
  {
    vessel: 'MV PACIFIC SPIRIT',
    systems: {
      bridge: 'Secure',
      ecdis: 'Secure',
      ais: 'Anomaly Detected',
      satcom: 'Secure',
      engine: 'Patch Required',
    },
    riskScore: 71,
    lastScan: '4h ago',
  },
  {
    vessel: 'MV NORDIC CROWN',
    systems: {
      bridge: 'Patch Required',
      ecdis: 'Secure',
      ais: 'Secure',
      satcom: 'Vulnerable',
      engine: 'Vulnerable',
    },
    riskScore: 83,
    lastScan: '8h ago',
  },
  {
    vessel: 'MV OCEAN PRIDE',
    systems: {
      bridge: 'Secure',
      ecdis: 'Secure',
      ais: 'Secure',
      satcom: 'Secure',
      engine: 'Secure',
    },
    riskScore: 18,
    lastScan: '1h ago',
  },
];

const threats = [
  {
    id: 'CT-001',
    vessel: 'MV NORDIC CROWN',
    type: 'GPS Spoofing Attempt',
    severity: 'Critical',
    detected: '34 min ago',
    details: 'Position offset of 2.3nm detected. GNSS signal authenticity failed.',
    mitigation: 'Switch to backup GNSS — DR mode activated',
  },
  {
    id: 'CT-002',
    vessel: 'MV PACIFIC SPIRIT',
    type: 'AIS Data Injection',
    severity: 'High',
    detected: '2h ago',
    details: 'Unauthorized AIS broadcast modification attempt from local network node.',
    mitigation: 'AIS isolated from crew network — investigation ongoing',
  },
  {
    id: 'CT-003',
    vessel: 'MV AURORA BOREALIS',
    type: 'VSAT Firmware Exploit',
    severity: 'High',
    detected: '5h ago',
    details: 'Known CVE exploit attempted against VSAT modem. Blocked by IDS.',
    mitigation: 'Firmware patch queued — ETA port arrival in 3d',
  },
  {
    id: 'CT-004',
    vessel: 'MV OCEAN PRIDE',
    type: 'Phishing Email — Crew',
    severity: 'Medium',
    detected: '9h ago',
    details: 'Spear phishing targeting Chief Officer. Malicious attachment intercepted.',
    mitigation: 'Email filtered. Crew awareness training triggered.',
  },
];

const patchStatus = [
  { category: 'ECDIS Systems', total: 24, patched: 18, critical: 2 },
  { category: 'VSAT/Satcom', total: 24, patched: 15, critical: 4 },
  { category: 'Bridge IT', total: 24, patched: 22, critical: 0 },
  { category: 'Engine Room', total: 24, patched: 19, critical: 1 },
  { category: 'Crew Wi-Fi', total: 24, patched: 24, critical: 0 },
];

const systemColor: Record<string, string> = {
  Secure: 'text-emerald-400 bg-emerald-500/10',
  'Patch Required': 'text-amber-400 bg-amber-500/10',
  Vulnerable: 'text-red-400 bg-red-500/10',
  'Anomaly Detected': 'text-orange-400 bg-orange-500/10',
};

const sevColor: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function CyberThreatPanel() {
  const [selectedThreat, setSelectedThreat] = useState(threats[0]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Fleet Cyber Threat Monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          OT/IT security across fleet vessels — ECDIS, VSAT, AIS, bridge, and engine room systems
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Threats', value: '4', color: 'text-red-400' },
          { label: 'Vulnerable Systems', value: '12', color: 'text-orange-400' },
          { label: 'Patches Pending', value: '9', color: 'text-amber-400' },
          { label: 'Fleet Cyber Score', value: '74/100', color: 'text-[#c9b787]' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fleet Vessel Cyber Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Vessel', 'Bridge', 'ECDIS', 'AIS', 'SATCOM', 'Engine', 'Risk', 'Scan'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left py-2 pr-3 font-medium text-muted-foreground"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {fleetCyberStatus.map((v) => (
                      <tr key={v.vessel} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium whitespace-nowrap">{v.vessel}</td>
                        {Object.values(v.systems).map((status, i) => (
                          <td key={i} className="py-2 pr-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${systemColor[status]}`}
                            >
                              {status}
                            </span>
                          </td>
                        ))}
                        <td className="py-2 pr-3 font-bold">
                          <span
                            className={
                              v.riskScore >= 75
                                ? 'text-red-400'
                                : v.riskScore >= 50
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                            }
                          >
                            {v.riskScore}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{v.lastScan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Patch Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patchStatus.map((p) => (
                <div key={p.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{p.category}</span>
                    <div className="flex items-center gap-2">
                      {p.critical > 0 && (
                        <span className="text-red-400">{p.critical} critical</span>
                      )}
                      <span className="text-muted-foreground">
                        {p.patched}/{p.total} patched
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(p.patched / p.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Threat Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {threats.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreat(t)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedThreat.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{t.type}</span>
                    <Badge variant="outline" className={`text-[10px] ${sevColor[t.severity]}`}>
                      {t.severity}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t.vessel} · {t.detected}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Threat Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold">{selectedThreat.type}</p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedThreat.vessel} · {selectedThreat.detected}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">Details</p>
                <p className="text-xs">{selectedThreat.details}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-muted-foreground mb-1">Mitigation</p>
                <p className="text-xs text-emerald-400">{selectedThreat.mitigation}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
