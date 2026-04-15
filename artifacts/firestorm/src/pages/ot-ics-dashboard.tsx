import { useState } from "react";
import { Cpu, AlertTriangle, Activity, Radio, Server, Zap, Eye, ChevronDown, ChevronUp, Wifi, Lock } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const RISK_COLOR: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e" };
const STATUS_COLOR: Record<string, string> = { online: "#22c55e", degraded: "#f59e0b", offline: "#ef4444", isolated: "#94a3b8" };

interface OTAsset {
  id: string;
  name: string;
  type: "plc" | "scada" | "hmi" | "rtu" | "historian" | "engineering-workstation" | "sensor";
  vendor: string;
  firmware: string;
  site: string;
  zone: "purdue-l0" | "purdue-l1" | "purdue-l2" | "purdue-l3" | "dmz";
  status: "online" | "degraded" | "offline" | "isolated";
  riskLevel: "critical" | "high" | "medium" | "low";
  protocols: string[];
  lastSeen: string;
  vulns: number;
  anomalies: number;
}

interface OTAnomaly {
  id: string;
  assetId: string;
  title: string;
  severity: "critical" | "high" | "medium";
  protocol: string;
  description: string;
  timestamp: string;
  status: "active" | "investigating" | "resolved";
  mitre: string;
}

const ASSETS: OTAsset[] = [
  { id: "OT-001", name: "PLC-PROD-TURBINE-01", type: "plc", vendor: "Siemens", firmware: "S7-1500 v3.0.1", site: "Main Plant — Unit A", zone: "purdue-l1", status: "online", riskLevel: "critical", protocols: ["S7", "Modbus TCP"], lastSeen: "2s ago", vulns: 3, anomalies: 2 },
  { id: "OT-002", name: "SCADA-MAIN-SERVER", type: "scada", vendor: "Wonderware", firmware: "InTouch 2023", site: "Control Room", zone: "purdue-l2", status: "online", riskLevel: "high", protocols: ["OPC-UA", "DNP3", "ICCP"], lastSeen: "5s ago", vulns: 7, anomalies: 1 },
  { id: "OT-003", name: "HMI-CONTROL-PANEL-03", type: "hmi", vendor: "GE", firmware: "iFIX 6.5", site: "Main Plant — Unit A", zone: "purdue-l2", status: "degraded", riskLevel: "high", protocols: ["OPC-DA", "DDE"], lastSeen: "12s ago", vulns: 5, anomalies: 3 },
  { id: "OT-004", name: "RTU-PIPELINE-WEST", type: "rtu", vendor: "ABB", firmware: "RTU560 v3.2", site: "West Pipeline Station", zone: "purdue-l1", status: "online", riskLevel: "medium", protocols: ["DNP3", "IEC 60870-5"], lastSeen: "8s ago", vulns: 2, anomalies: 0 },
  { id: "OT-005", name: "ENG-WORKSTATION-07", type: "engineering-workstation", vendor: "Dell", firmware: "Windows 10 LTSC", site: "Engineering Office", zone: "purdue-l3", status: "online", riskLevel: "critical", protocols: ["RDP", "VNC", "USB"], lastSeen: "1m ago", vulns: 14, anomalies: 4 },
  { id: "OT-006", name: "HISTORIAN-PRIMARY", type: "historian", vendor: "OSIsoft", firmware: "PI Server 2023", site: "Data Center", zone: "dmz", status: "online", riskLevel: "high", protocols: ["PI-AF", "OPC-UA", "ODBC"], lastSeen: "3s ago", vulns: 4, anomalies: 0 },
  { id: "OT-007", name: "SENSOR-PRESSURE-ARRAY", type: "sensor", vendor: "Honeywell", firmware: "SmartLine v5.1", site: "Main Plant — Unit B", zone: "purdue-l0", status: "online", riskLevel: "low", protocols: ["Modbus RTU", "HART"], lastSeen: "1s ago", vulns: 0, anomalies: 0 },
  { id: "OT-008", name: "PLC-WATER-TREATMENT", type: "plc", vendor: "Allen-Bradley", firmware: "CompactLogix v33", site: "Water Treatment Facility", zone: "purdue-l1", status: "isolated", riskLevel: "critical", protocols: ["EtherNet/IP", "CIP"], lastSeen: "4m ago", vulns: 6, anomalies: 8 },
];

const ANOMALIES: OTAnomaly[] = [
  { id: "OTA-001", assetId: "OT-008", title: "Unauthorized Modbus Function Code 0x08 — Diagnostic Reset", severity: "critical", protocol: "Modbus TCP", description: "Engineering workstation OT-005 issued undocumented diagnostic reset command to PLC-WATER-TREATMENT outside scheduled maintenance window. Command deviates from 90-day behavioral baseline.", timestamp: "8m ago", status: "active", mitre: "T0803" },
  { id: "OTA-002", assetId: "OT-005", title: "IT/OT Boundary Crossing — RDP session to Purdue L1", severity: "critical", protocol: "RDP", description: "Engineering workstation established RDP session directly to PLC network segment (Purdue L1) bypassing DMZ controls. This path is not part of authorized network topology.", timestamp: "22m ago", status: "investigating", mitre: "T0886" },
  { id: "OTA-003", assetId: "OT-003", title: "HMI Scan — Unusual port enumeration from HMI-03", severity: "high", protocol: "OPC-DA", description: "HMI initiated sequential port scan across SCADA subnet (172.16.4.0/24). No operator interaction logged. Possible malware or unauthorized script execution.", timestamp: "45m ago", status: "active", mitre: "T0840" },
  { id: "OTA-004", assetId: "OT-001", title: "Abnormal Setpoint Write — Turbine speed threshold modified", severity: "high", protocol: "S7", description: "PLC received write command to turbine speed setpoint — value exceeds documented safe operating range. Source IP not in authorized engineering station list.", timestamp: "1h ago", status: "investigating", mitre: "T0831" },
];

const ZONE_LABELS: Record<string, string> = { "purdue-l0": "L0 — Field Devices", "purdue-l1": "L1 — Controllers", "purdue-l2": "L2 — SCADA/HMI", "purdue-l3": "L3 — Operations", dmz: "DMZ" };
const ZONE_COLOR: Record<string, string> = { "purdue-l0": "#22c55e", "purdue-l1": "#06b6d4", "purdue-l2": "#8b5cf6", "purdue-l3": "#3b82f6", dmz: "#f59e0b" };
const TYPE_ICON: Record<string, typeof Cpu> = { plc: Cpu, scada: Server, hmi: Activity, rtu: Radio, historian: Eye, "engineering-workstation": Server, sensor: Wifi };

export default function OTICSDashboard() {
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>("OTA-001");
  const [tab, setTab] = useState<"anomalies" | "assets" | "topology">("anomalies");

  const criticalAssets = ASSETS.filter(a => a.riskLevel === "critical").length;
  const activeAnomalies = ANOMALIES.filter(a => a.status !== "resolved").length;
  const totalVulns = ASSETS.reduce((s, a) => s + a.vulns, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            OT / ICS Security
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Industrial control system monitoring · SCADA anomaly detection · protocol analysis · Purdue model segmentation</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
          <Radio className="w-3 h-3 animate-pulse" /> {activeAnomalies} active anomalies
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Critical OT Assets", value: criticalAssets, color: "#ef4444" },
          { label: "Active Anomalies", value: activeAnomalies, color: "#f97316" },
          { label: "OT Vulnerabilities", value: totalVulns, color: "#f59e0b" },
          { label: "Assets Monitored", value: ASSETS.length, color: "#06b6d4" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Purdue model zone summary */}
      <div className="grid grid-cols-5 gap-2">
        {(["purdue-l0", "purdue-l1", "purdue-l2", "purdue-l3", "dmz"] as const).map(zone => {
          const zoneAssets = ASSETS.filter(a => a.zone === zone);
          const zoneRisk = zoneAssets.some(a => a.riskLevel === "critical") ? "critical" : zoneAssets.some(a => a.riskLevel === "high") ? "high" : "low";
          return (
            <div key={zone} className="rounded-xl border p-3 text-center" style={{ borderColor: `${ZONE_COLOR[zone]}25`, background: `${ZONE_COLOR[zone]}08` }}>
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: ZONE_COLOR[zone] }}>{ZONE_LABELS[zone]}</div>
              <div className="text-lg font-bold text-white">{zoneAssets.length}</div>
              <div className="text-[9px] text-white/30">assets</div>
              {zoneRisk !== "low" && <div className="text-[9px] mt-1" style={{ color: RISK_COLOR[zoneRisk] }}>● {zoneRisk} risk</div>}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {(["anomalies", "assets", "topology"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all" style={tab === t ? { background: "rgba(6,182,212,0.12)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.2)" } : { color: "rgba(255,255,255,0.4)" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "anomalies" && (
        <div className="space-y-2">
          {ANOMALIES.map(anomaly => {
            const asset = ASSETS.find(a => a.id === anomaly.assetId);
            const isExpanded = expandedAnomaly === anomaly.id;
            return (
              <div key={anomaly.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isExpanded ? `${RISK_COLOR[anomaly.severity]}30` : "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left" onClick={() => setExpandedAnomaly(isExpanded ? null : anomaly.id)}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${RISK_COLOR[anomaly.severity]}15` }}>
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: RISK_COLOR[anomaly.severity] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{anomaly.title}</span>
                      <span className="text-[9px] font-mono text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded">{anomaly.protocol}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30">
                      <span>{asset?.name}</span>
                      <span className="font-mono text-violet-400/60">{anomaly.mitre}</span>
                      <span>{anomaly.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase" style={{ color: anomaly.status === "active" ? "#ef4444" : "#f97316", background: anomaly.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.1)" }}>{anomaly.status}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase" style={{ color: RISK_COLOR[anomaly.severity], background: `${RISK_COLOR[anomaly.severity]}15` }}>{anomaly.severity}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-3">
                    <p className="text-xs text-white/60 leading-relaxed">{anomaly.description}</p>
                    <div className="flex gap-2">
                      <button onClick={() => toast.success(`Asset ${asset?.name} isolated from OT network`)} className="px-3 py-1.5 rounded-lg text-[11px] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        <Lock className="w-3 h-3 inline mr-1" />Isolate Asset
                      </button>
                      <button onClick={() => toast.success("Escalated to SOC via ICS incident playbook")} className="px-3 py-1.5 rounded-lg text-[11px] border border-orange-500/25 text-orange-400 hover:bg-orange-500/10 transition-colors">
                        <Zap className="w-3 h-3 inline mr-1" />Escalate to SOC
                      </button>
                      <button onClick={() => toast.success("Opened in forensics timeline")} className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-white/50 hover:bg-white/[0.04] transition-colors">
                        <Eye className="w-3 h-3 inline mr-1" />Forensics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "assets" && (
        <div className="space-y-2">
          {ASSETS.map(asset => {
            const Icon = TYPE_ICON[asset.type] ?? Cpu;
            return (
              <div key={asset.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ZONE_COLOR[asset.zone]}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: ZONE_COLOR[asset.zone] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-white font-mono">{asset.name}</span>
                      <span className="text-[9px] text-white/40">{asset.vendor} · {asset.firmware}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: ZONE_COLOR[asset.zone], background: `${ZONE_COLOR[asset.zone]}15` }}>{ZONE_LABELS[asset.zone]}</span>
                      {asset.protocols.slice(0, 2).map(p => <span key={p} className="text-[9px] font-mono text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{p}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    {asset.vulns > 0 && <div><div className="text-xs font-bold text-red-400">{asset.vulns}</div><div className="text-[9px] text-white/25">vulns</div></div>}
                    {asset.anomalies > 0 && <div><div className="text-xs font-bold text-orange-400">{asset.anomalies}</div><div className="text-[9px] text-white/25">anomalies</div></div>}
                    <span className="text-[9px] px-2 py-0.5 rounded capitalize" style={{ color: STATUS_COLOR[asset.status], background: `${STATUS_COLOR[asset.status]}15` }}>{asset.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "topology" && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-4">Purdue Model Network Topology — Risk Heat Map</div>
          <div className="space-y-3">
            {(["purdue-l0", "purdue-l1", "purdue-l2", "purdue-l3", "dmz"] as const).map(zone => {
              const zoneAssets = ASSETS.filter(a => a.zone === zone);
              return (
                <div key={zone} className="rounded-lg border p-3" style={{ borderColor: `${ZONE_COLOR[zone]}20`, background: `${ZONE_COLOR[zone]}05` }}>
                  <div className="text-[10px] font-semibold mb-2" style={{ color: ZONE_COLOR[zone] }}>{ZONE_LABELS[zone]}</div>
                  <div className="flex flex-wrap gap-2">
                    {zoneAssets.map(a => (
                      <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px]" style={{ borderColor: `${RISK_COLOR[a.riskLevel]}30`, background: `${RISK_COLOR[a.riskLevel]}08`, color: "rgba(255,255,255,0.7)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_COLOR[a.riskLevel] }} />
                        {a.name.replace(/PLC-|SCADA-|HMI-|RTU-|SENSOR-/, "")}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-white/20 mt-4">Inter-zone communication matrix enforced via Purdue Model segmentation policies · OT/IT boundary monitoring active</div>
        </div>
      )}
    </div>
  );
}
