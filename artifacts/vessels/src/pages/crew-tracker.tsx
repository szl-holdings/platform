import { useState } from "react";
import { Users, AlertTriangle, CheckCircle2, Clock, Award, Calendar, Ship, User, Globe } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

interface Certification {
  name: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expiring_soon" | "expired";
}

interface CrewMember {
  id: string;
  name: string;
  rank: string;
  nationality: string;
  vessel: string;
  joinDate: string;
  reliefDate: string;
  daysOnBoard: number;
  maxRotation: number;
  certifications: Certification[];
  medicalExpiry: string;
  mlcCompliant: boolean;
  flagState: string;
  stcwEndorsement: boolean;
}

const CREW: CrewMember[] = [
  {
    id: "CR-001", name: "Capt. Erik Magnusson", rank: "Master", nationality: "Norwegian",
    vessel: "Pacific Navigator", joinDate: "2026-01-15", reliefDate: "2026-07-15",
    daysOnBoard: 90, maxRotation: 180, flagState: "Marshall Islands", mlcCompliant: true, stcwEndorsement: true,
    medicalExpiry: "2026-11-30",
    certifications: [
      { name: "STCW II/2 — Master", issueDate: "2021-03-10", expiryDate: "2026-03-10", status: "expired" },
      { name: "GMDSS General Operator", issueDate: "2022-06-15", expiryDate: "2027-06-15", status: "valid" },
      { name: "Advanced Fire Fighting", issueDate: "2023-01-20", expiryDate: "2028-01-20", status: "valid" },
      { name: "ECDIS Type Specific", issueDate: "2022-09-12", expiryDate: "2027-09-12", status: "valid" },
    ],
  },
  {
    id: "CR-002", name: "C/O Priya Nair", rank: "Chief Officer", nationality: "Indian",
    vessel: "Pacific Navigator", joinDate: "2026-02-10", reliefDate: "2026-08-10",
    daysOnBoard: 64, maxRotation: 180, flagState: "Marshall Islands", mlcCompliant: true, stcwEndorsement: true,
    medicalExpiry: "2027-02-28",
    certifications: [
      { name: "STCW II/1 — Officer of the Watch", issueDate: "2023-04-05", expiryDate: "2028-04-05", status: "valid" },
      { name: "Tanker Familiarisation", issueDate: "2022-07-18", expiryDate: "2026-05-15", status: "expiring_soon" },
      { name: "ECDIS Type Specific", issueDate: "2021-11-22", expiryDate: "2026-11-22", status: "valid" },
    ],
  },
  {
    id: "CR-003", name: "Ch. Eng. Lars Petersen", rank: "Chief Engineer", nationality: "Danish",
    vessel: "Arctic Breeze", joinDate: "2025-11-20", reliefDate: "2026-05-20",
    daysOnBoard: 146, maxRotation: 180, flagState: "Norway", mlcCompliant: true, stcwEndorsement: true,
    medicalExpiry: "2026-04-30",
    certifications: [
      { name: "STCW III/2 — Chief Engineer", issueDate: "2020-08-14", expiryDate: "2025-08-14", status: "expired" },
      { name: "High Voltage Safety", issueDate: "2023-03-10", expiryDate: "2028-03-10", status: "valid" },
      { name: "IGF Code — Gas Fuelled Ships", issueDate: "2022-10-01", expiryDate: "2027-10-01", status: "valid" },
    ],
  },
  {
    id: "CR-004", name: "AB Omar Al-Rashidi", rank: "Able Seaman", nationality: "Philippines",
    vessel: "Meridian Bulk", joinDate: "2026-03-01", reliefDate: "2026-09-01",
    daysOnBoard: 45, maxRotation: 180, flagState: "Panama", mlcCompliant: true, stcwEndorsement: true,
    medicalExpiry: "2027-06-15",
    certifications: [
      { name: "STCW II/4 — Rating", issueDate: "2024-01-15", expiryDate: "2029-01-15", status: "valid" },
      { name: "Basic Safety Training", issueDate: "2024-01-15", expiryDate: "2029-01-15", status: "valid" },
      { name: "Security Awareness", issueDate: "2024-01-15", expiryDate: "2029-01-15", status: "valid" },
    ],
  },
  {
    id: "CR-005", name: "2/E Fatima Ouedraogo", rank: "2nd Engineer", nationality: "Nigerian",
    vessel: "Cape Resolute", joinDate: "2025-12-01", reliefDate: "2026-06-01",
    daysOnBoard: 135, maxRotation: 180, flagState: "Liberia", mlcCompliant: false, stcwEndorsement: true,
    medicalExpiry: "2026-06-30",
    certifications: [
      { name: "STCW III/1 — Engineer Officer of the Watch", issueDate: "2022-05-10", expiryDate: "2027-05-10", status: "valid" },
      { name: "Advanced Fire Fighting", issueDate: "2021-09-22", expiryDate: "2026-04-22", status: "expiring_soon" },
      { name: "Medical First Aid", issueDate: "2023-02-18", expiryDate: "2028-02-18", status: "valid" },
    ],
  },
];

const ROTATIONS = [
  { vessel: "Pacific Navigator", reliefs: [
    { name: "Capt. Magnus Ericson", rank: "Master", eta: "Jul 15", status: "confirmed" },
    { name: "C/O Sanjay Gupta", rank: "Chief Officer", eta: "Aug 10", status: "pending" },
  ]},
  { vessel: "Arctic Breeze", reliefs: [
    { name: "Ch. Eng. Henk van der Berg", rank: "Chief Engineer", eta: "May 20", status: "urgent" },
  ]},
  { vessel: "Cape Resolute", reliefs: [
    { name: "2/E Grace Adeola", rank: "2nd Engineer", eta: "Jun 01", status: "confirmed" },
  ]},
];

const certStatus: Record<string, { color: string; label: string }> = {
  valid: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Valid" },
  expiring_soon: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Expiring Soon" },
  expired: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Expired" },
};

const rotationStatus: Record<string, string> = {
  confirmed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  urgent: "text-red-400 bg-red-500/10 border-red-500/20",
};

function CrewCard({ cm }: { cm: CrewMember }) {
  const [expanded, setExpanded] = useState(false);
  const expiredCerts = cm.certifications.filter(c => c.status === "expired").length;
  const expiringSoon = cm.certifications.filter(c => c.status === "expiring_soon").length;
  const rotationPct = (cm.daysOnBoard / cm.maxRotation) * 100;
  const medExpiry = new Date(cm.medicalExpiry);
  const daysToMedExpiry = Math.round((medExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const medAlert = daysToMedExpiry < 60;

  return (
    <div className={cn("bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all",
      expiredCerts > 0 || !cm.mlcCompliant ? "border-red-500/20" :
      expiringSoon > 0 || medAlert ? "border-amber-500/20" :
      "border-sky-500/10")}>
      <button className="w-full text-left px-4 py-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-sky-100">{cm.name}</span>
              <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/10">{cm.rank}</Badge>
              <Badge variant="outline" className="text-[9px] text-sky-400/30 border-sky-500/8">{cm.nationality}</Badge>
              {!cm.mlcCompliant && <Badge variant="outline" className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20">MLC Non-Compliant</Badge>}
              {expiredCerts > 0 && <Badge variant="outline" className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20">{expiredCerts} cert expired</Badge>}
              {expiringSoon > 0 && <Badge variant="outline" className="text-[9px] text-amber-400 bg-amber-500/10 border-amber-500/20">{expiringSoon} expiring soon</Badge>}
            </div>
            <p className="text-[10px] text-sky-400/50 mt-0.5">{cm.vessel} · {cm.flagState}</p>
            <div className="mt-1.5">
              <div className="flex justify-between mb-0.5">
                <span className="text-[9px] text-sky-400/30">Rotation: {cm.daysOnBoard}/{cm.maxRotation} days</span>
                <span className={cn("text-[9px] font-mono", rotationPct > 85 ? "text-orange-400" : "text-sky-400/40")}>{Math.round(rotationPct)}%</span>
              </div>
              <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", rotationPct > 85 ? "bg-orange-400" : rotationPct > 60 ? "bg-amber-400" : "bg-emerald-400")}
                  style={{ width: `${rotationPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {([ 
              { label: "Join Date", value: cm.joinDate, alert: false },
              { label: "Relief Date", value: cm.reliefDate, alert: false },
              { label: "Medical Expiry", value: cm.medicalExpiry, alert: medAlert },
            ] as { label: string; value: string; alert: boolean }[]).map(f => (
              <div key={f.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                <p className={cn("text-xs font-mono mt-0.5", f.alert ? "text-amber-400" : "text-sky-200")}>{f.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">STCW Certifications</p>
            <div className="space-y-1.5">
              {cm.certifications.map(cert => (
                <div key={cert.name} className="flex items-center gap-3 p-2 rounded-lg bg-sky-500/3 border border-sky-500/8">
                  <Badge variant="outline" className={cn("text-[9px] shrink-0", certStatus[cert.status].color)}>
                    {certStatus[cert.status].label}
                  </Badge>
                  <span className="text-[11px] text-sky-200 flex-1">{cert.name}</span>
                  <span className="text-[9px] font-mono text-sky-400/40 shrink-0">Exp: {cert.expiryDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              {cm.mlcCompliant
                ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                : <AlertTriangle className="w-3 h-3 text-red-400" />}
              <span className={cm.mlcCompliant ? "text-emerald-400" : "text-red-400"}>MLC 2006</span>
            </div>
            <div className="flex items-center gap-1.5">
              {cm.stcwEndorsement
                ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                : <AlertTriangle className="w-3 h-3 text-red-400" />}
              <span className={cm.stcwEndorsement ? "text-emerald-400" : "text-red-400"}>STCW Endorsement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-sky-400/30" />
              <span className="text-sky-400/50">Flag: {cm.flagState}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrewTrackerPage() {
  const [tab, setTab] = useState<"crew" | "rotations">("crew");
  const [vesselFilter, setVesselFilter] = useState("all");

  const expiredCount = CREW.reduce((a, c) => a + c.certifications.filter(x => x.status === "expired").length, 0);
  const expiringCount = CREW.reduce((a, c) => a + c.certifications.filter(x => x.status === "expiring_soon").length, 0);
  const mlcIssues = CREW.filter(c => !c.mlcCompliant).length;
  const vessels = [...new Set(CREW.map(c => c.vessel))];

  const filtered = CREW.filter(c => vesselFilter === "all" || c.vessel === vesselFilter);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-400" />
          Crew & Certification Tracker
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">Rotation scheduling, STCW certification expiry alerts, medical compliance, and flag-state manning requirements</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Crew", value: CREW.length, color: "text-sky-300", icon: Users },
          { label: "Expired Certs", value: expiredCount, color: "text-red-400", icon: AlertTriangle },
          { label: "Expiring Soon", value: expiringCount, color: "text-amber-400", icon: Clock },
          { label: "MLC Issues", value: mlcIssues, color: mlcIssues > 0 ? "text-red-400" : "text-emerald-400", icon: Award },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {(["crew", "rotations"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("text-xs px-3 py-1.5 rounded-lg capitalize transition-colors",
                tab === t ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "text-sky-400/50 hover:text-sky-300")}>
              {t === "crew" ? "Crew Roster" : "Rotation Schedule"}
            </button>
          ))}
        </div>
        {tab === "crew" && (
          <div className="flex gap-1 ml-auto">
            {["all", ...vessels].map(v => (
              <button key={v} onClick={() => setVesselFilter(v)}
                className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border transition-all",
                  vesselFilter === v ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
                {v === "all" ? "All Vessels" : v}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "crew" && (
        <div className="space-y-2">
          {filtered.map(c => <CrewCard key={c.id} cm={c} />)}
        </div>
      )}

      {tab === "rotations" && (
        <div className="space-y-4">
          {ROTATIONS.map(r => (
            <div key={r.vessel} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
                <Ship className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sm font-semibold text-sky-200">{r.vessel}</span>
              </div>
              <div className="divide-y divide-sky-500/5">
                {r.reliefs.map(relief => (
                  <div key={relief.name} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-sky-200">{relief.name}</p>
                      <p className="text-[10px] text-sky-400/50">{relief.rank}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-sky-400/30" />
                      <span className="text-xs text-sky-300">{relief.eta}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px]", rotationStatus[relief.status])}>
                      {relief.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
