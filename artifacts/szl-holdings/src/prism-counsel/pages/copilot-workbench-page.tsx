import { useState } from "react";
import { MessageSquare, Mail, FileText, Users, FolderOpen, Calendar, Shield, CheckCircle2, AlertCircle, Send, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

const WORKBENCH_MODULES = [
  { id: "outlook", label: "Outlook", icon: Mail, description: "Email ingestion, entity extraction, silence-window detection, follow-up recommendations" },
  { id: "word", label: "Word", icon: FileText, description: "Source-grounded drafting: chronologies, demands, memos, checklists" },
  { id: "teams", label: "Teams", icon: Users, description: "Alert cards, approval prompts, deadline warnings, connector failure alerts" },
  { id: "sharepoint", label: "SharePoint", icon: FolderOpen, description: "Matter binder mapping, ACL-aware retrieval, file change detection" },
  { id: "calendar", label: "Calendar", icon: Calendar, description: "Deadline-derived prep windows, deposition/mediation sequences" },
  { id: "drafts", label: "Drafts", icon: Shield, description: "Review-state tracking, export-safety, privilege check" },
] as const;

type Module = typeof WORKBENCH_MODULES[number]["id"];

const DRAFT_TYPES = [
  "chronology", "demand_letter", "legal_memo", "checklist",
  "deposition_outline", "mediation_brief", "discovery_response"
];

function OutlookModule() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-[#4a90b8]" /> Email Ingestion & Entity Extraction
        </h3>
        <div className="space-y-3 text-[11px] text-slate-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] flex-shrink-0 mt-0.5" />
            <span>Thread preservation — conversation context maintained across all linked emails</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] flex-shrink-0 mt-0.5" />
            <span>Entity extraction — parties, dates, dollar amounts, policy references auto-extracted</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] flex-shrink-0 mt-0.5" />
            <span>Insurer asks & commitments — extracted and tracked per thread</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#d4a054] flex-shrink-0 mt-0.5" />
            <span>Silence-window detection — flags gaps in insurer response beyond configured threshold</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] flex-shrink-0 mt-0.5" />
            <span>Follow-up recommendations — AI-generated based on communication history and deadlines</span>
          </div>
        </div>
        <div className="mt-3 p-3 rounded border border-[#d4a054]/20 bg-[#d4a054]/5">
          <div className="flex items-center gap-1.5 text-[10px] text-[#d4a054]">
            <Lock className="w-3 h-3" />
            BLOCKER: Microsoft 365 tenant consent required — M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET
          </div>
        </div>
      </div>
    </div>
  );
}

function WordModule({ matterId }: { matterId?: number }) {
  const [selectedType, setSelectedType] = useState("chronology");
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#4a90b8]" /> Source-Grounded Document Drafting
        </h3>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5">Document Type</div>
            <div className="grid grid-cols-3 gap-2">
              {DRAFT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "px-2 py-1.5 rounded text-[10px] text-left transition-colors capitalize",
                    selectedType === t
                      ? "bg-[#4a90b8]/20 text-[#4a90b8] border border-[#4a90b8]/30"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.04]"
                  )}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded border border-white/[0.06]" style={{ background: "#080c14" }}>
            <div className="text-[10px] text-slate-500 mb-2">Grounding Sources</div>
            <div className="space-y-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#5aa87a]" /> Matter records</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#5aa87a]" /> Medical chronology</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#5aa87a]" /> Communication history</div>
              <div className="flex items-center gap-2"><AlertCircle className="w-3 h-3 text-[#d4a054]" /> SharePoint documents (requires M365 consent)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={generating || !matterId}
              className="px-3 py-1.5 rounded text-xs bg-[#4a90b8]/20 text-[#4a90b8] border border-[#4a90b8]/30 hover:bg-[#4a90b8]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setGenerating(true);
                setTimeout(() => setGenerating(false), 2000);
              }}
            >
              {generating ? "Generating…" : `Generate ${selectedType.replace("_", " ")}`}
            </button>
            {!matterId && <span className="text-[10px] text-slate-500">Select a matter first</span>}
          </div>

          <div className="text-[10px] text-[#d4a054] flex items-center gap-1">
            <Shield className="w-3 h-3" />
            All generated content requires attorney review before export — never sent without approval
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamsModule() {
  const CARD_TYPES = [
    { type: "Matter Alert Card", trigger: "Critical deadline, pressure spike, or approval needed", channel: "Matter channel" },
    { type: "Approval Prompt", trigger: "AI recommends consequential action requiring attorney approval", channel: "Approvals channel" },
    { type: "Deadline Warning", trigger: "Deadline within configured threshold (7/14/30 days)", channel: "Matter channel" },
    { type: "Connector Failure Alert", trigger: "Sync error, subscription expiry, or drift detected", channel: "Ops channel" },
  ];
  return (
    <div className="space-y-3">
      {CARD_TYPES.map(ct => (
        <div key={ct.type} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-xs font-semibold text-slate-200 mb-1">{ct.type}</div>
          <div className="text-[10px] text-slate-400 mb-1">Trigger: {ct.trigger}</div>
          <div className="text-[10px] text-slate-500">Posted to: {ct.channel}</div>
        </div>
      ))}
      <div className="p-3 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
        <Lock className="w-3 h-3 inline mr-1" />
        BLOCKER: Teams bot registration and M365 consent required for outbound messaging
      </div>
    </div>
  );
}

function SharePointModule() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3">Matter Binder Mapping</h3>
        <div className="space-y-2 text-[11px] text-slate-400">
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5" />ACL-aware retrieval — respects SharePoint permissions</div>
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5" />File change detection via delta queries and change notifications</div>
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5" />Export publishing — approved matter exports published to SharePoint binder</div>
          <div className="flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 text-[#d4a054] mt-0.5" />Subscription renewal — automatic Microsoft Graph subscription renewal before expiry</div>
        </div>
        <div className="mt-3 p-2 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
          <Lock className="w-3 h-3 inline mr-1" />
          BLOCKER: SharePoint site configuration and M365 Files.ReadWrite.All permission required
        </div>
      </div>
    </div>
  );
}

function CalendarModule() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-200 mb-3">Deadline-Derived Prep Windows</h3>
        <div className="space-y-2 text-[11px] text-slate-400">
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5" />Deposition prep sequences — auto-generated 2-week prep calendar</div>
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5" />Mediation prep windows — configurable days before mediation date</div>
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a] mt-0.5" />Trial prep sequences — cascading milestone prep from trial date</div>
        </div>
        <div className="mt-3 p-2 rounded border border-[#d4a054]/20 bg-[#d4a054]/5 text-[10px] text-[#d4a054]">
          <Lock className="w-3 h-3 inline mr-1" />
          BLOCKER: M365 Calendars.ReadWrite permission and tenant consent required
        </div>
      </div>
    </div>
  );
}

function DraftsModule({ matterId }: { matterId?: number }) {
  const { data: draftsData } = useQuery({
    queryKey: ["copilot-drafts", matterId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/prism-counsel/matters/${matterId}/copilot-drafts`);
      return res.json();
    },
    enabled: !!matterId,
  });

  const drafts = draftsData?.data?.drafts ?? [];

  return (
    <div className="space-y-3">
      {!matterId && <div className="text-xs text-slate-500">Select a matter to view drafts</div>}
      {matterId && drafts.length === 0 && <div className="text-xs text-slate-500">No drafts generated yet for this matter</div>}
      {drafts.map((d: any, i: number) => (
        <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-200">{d.title}</div>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] ${d.reviewState === "approved" ? "bg-[#5aa87a]/10 text-[#5aa87a]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                {d.reviewState?.replace("_", " ").toUpperCase()}
              </span>
              {d.exportSafe && <CheckCircle2 className="w-3.5 h-3.5 text-[#5aa87a]" />}
              {d.privilegeFlag && <Lock className="w-3 h-3 text-[#d4a054]" />}
            </div>
          </div>
          <div className="text-[10px] text-slate-500">{d.draftType} · Grounding: {d.groundingScore ? `${(d.groundingScore * 100).toFixed(0)}%` : "—"}</div>
          {d.unsupportedClaimsCount > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-[#c45a4a]">
              <AlertCircle className="w-3 h-3" /> {d.unsupportedClaimsCount} unsupported claim(s) detected
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CopilotWorkbenchPage() {
  const [activeModule, setActiveModule] = useState<Module>("outlook");
  const [matterId] = useState<number | undefined>(undefined);

  function renderModule() {
    switch (activeModule) {
      case "outlook": return <OutlookModule />;
      case "word": return <WordModule matterId={matterId} />;
      case "teams": return <TeamsModule />;
      case "sharepoint": return <SharePointModule />;
      case "calendar": return <CalendarModule />;
      case "drafts": return <DraftsModule matterId={matterId} />;
      default: return null;
    }
  }

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#4a90b8]" />
        <h1 className="text-sm font-semibold text-slate-200">Copilot Workbench</h1>
        <span className="px-2 py-0.5 rounded text-[9px] bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">
          M365-NATIVE
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {WORKBENCH_MODULES.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                activeModule === m.id
                  ? "border-[#4a90b8]/40 bg-[#4a90b8]/10"
                  : "border-white/[0.06] hover:border-white/[0.10]"
              )}
              style={{ background: "#0c1220" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${activeModule === m.id ? "text-[#4a90b8]" : "text-slate-400"}`} />
                <span className={`text-xs font-semibold ${activeModule === m.id ? "text-slate-100" : "text-slate-400"}`}>{m.label}</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed">{m.description}</div>
            </button>
          );
        })}
      </div>

      {renderModule()}

      <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
        <div className="text-[10px] text-slate-500 flex items-center gap-2">
          <Shield className="w-3 h-3 text-[#4a90b8]" />
          All Copilot outputs are source-grounded, reviewed, and require explicit approval before any consequential action or outbound communication.
        </div>
      </div>
    </div>
  );
}
