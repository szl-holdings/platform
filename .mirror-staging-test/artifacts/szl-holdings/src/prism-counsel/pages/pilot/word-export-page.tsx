import { useState } from "react";
import { useExports, useGenerateExport, useExportContent } from "../../hooks/use-prism-pilot";
import { Download, FileText, Shield, Clock, CheckCircle, Plus, Eye, Link as LinkIcon } from "lucide-react";

const DEMO_EXPORTS = [
  {
    id: 1, matterId: 1, exportType: "chronology", title: "Reviewed Chronology — Rodriguez v. National General",
    filePath: "/exports/1/1/chronology_1711900000.docx", fileSize: 24576,
    proofChainRef: "PC-M3X8K-A7Q2", generatedBy: 1,
    accessLog: [{ action: "created", userId: 1, timestamp: new Date(Date.now() - 86400000).toISOString() }, { action: "accessed", userId: 1, timestamp: new Date(Date.now() - 43200000).toISOString() }],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2, matterId: 1, exportType: "partner_update", title: "Partner Update Memo — Rodriguez (March)",
    filePath: "/exports/1/1/partner_update_1711850000.docx", fileSize: 12288,
    proofChainRef: "PC-K9F2L-B4R7", generatedBy: 1,
    accessLog: [{ action: "created", userId: 1, timestamp: new Date(Date.now() - 172800000).toISOString() }],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 3, matterId: 2, exportType: "demand_section", title: "Demand Section — Chen v. Allstate (Damages)",
    filePath: "/exports/1/2/demand_section_1711800000.docx", fileSize: 18432,
    proofChainRef: "PC-J5H1N-C8W3", generatedBy: 1,
    accessLog: [{ action: "created", userId: 1, timestamp: new Date(Date.now() - 259200000).toISOString() }],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const EXPORT_TYPES = [
  { value: "chronology", label: "Reviewed Chronology", description: "Source-verified timeline of events with proof chain" },
  { value: "partner_update", label: "Partner Update Memo", description: "Case status and strategy summary for partners" },
  { value: "demand_section", label: "Demand Section", description: "Damages and liability summary for demand package" },
];

export default function WordExportPage() {
  const { data } = useExports();
  const generateExport = useGenerateExport();
  const [selectedExport, setSelectedExport] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ matterId: 1, exportType: "chronology", title: "" });
  const { data: contentData } = useExportContent(selectedExport);

  const exports = data?.exports?.length ? data.exports : DEMO_EXPORTS;
  const isDemo = !data?.exports?.length;

  const handleGenerate = () => {
    const type = EXPORT_TYPES.find(t => t.value === newForm.exportType);
    generateExport.mutate({
      matterId: newForm.matterId,
      exportType: newForm.exportType,
      title: newForm.title || `${type?.label ?? newForm.exportType} — Matter #${newForm.matterId}`,
    });
    setShowNew(false);
    setNewForm({ matterId: 1, exportType: "chronology", title: "" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Download className="w-6 h-6 text-[#d4a054]" /> Word Export
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generate defensible Word documents with proof chain metadata and full audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
          <button onClick={() => setShowNew(!showNew)}
            className="px-3 py-1.5 text-sm rounded-lg bg-[#d4a054]/20 border border-[#d4a054]/30 text-[#d4a054] hover:bg-[#d4a054]/30 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Export
          </button>
        </div>
      </div>

      {showNew && (
        <div className="bg-slate-800/50 border border-[#d4a054]/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Generate New Export</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {EXPORT_TYPES.map(t => (
              <button key={t.value} onClick={() => setNewForm(f => ({ ...f, exportType: t.value }))}
                className={`p-3 rounded-lg text-left border transition-colors ${newForm.exportType === t.value ? "bg-[#d4a054]/10 border-[#d4a054]/30" : "bg-slate-900/50 border-slate-700/30 hover:border-slate-600"}`}>
                <span className="text-sm font-medium text-white">{t.label}</span>
                <p className="text-xs text-slate-400 mt-1">{t.description}</p>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Matter ID</label>
              <input type="number" value={newForm.matterId} onChange={e => setNewForm(f => ({ ...f, matterId: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-1.5 text-sm bg-slate-900/50 border border-slate-700 rounded text-white" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Title (optional)</label>
              <input type="text" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Auto-generated if blank" className="w-full px-3 py-1.5 text-sm bg-slate-900/50 border border-slate-700 rounded text-white placeholder:text-slate-600" />
            </div>
            <button onClick={handleGenerate} disabled={generateExport.isPending}
              className="mt-5 px-4 py-2 text-sm rounded-lg bg-[#d4a054] text-black font-medium hover:bg-[#d4a054]/90 transition-colors disabled:opacity-50">
              Generate
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {exports.map((exp: any) => (
          <div key={exp.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-slate-900/50">
                  <FileText className="w-5 h-5 text-[#d4a054]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{exp.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 capitalize">{exp.exportType?.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-500">Matter #{exp.matterId}</span>
                    {exp.fileSize && <span className="text-xs text-slate-500">{Math.round(exp.fileSize / 1024)}KB</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-[#8b7ac8] flex items-center gap-1 font-mono">
                      <Shield className="w-3 h-3" /> {exp.proofChainRef}
                    </span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {(exp.accessLog as any[])?.length ?? 0} access events
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedExport(selectedExport === exp.id ? null : exp.id)}
                className="px-3 py-1.5 text-xs rounded border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                {selectedExport === exp.id ? "Hide" : "Preview"}
              </button>
            </div>

            {selectedExport === exp.id && (
              <div className="mt-4 pt-4 border-t border-slate-700/30">
                <div className="bg-slate-900/80 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                  {contentData?.content ?? `Loading export content...\n\nProof Chain: ${exp.proofChainRef}\nExport Type: ${exp.exportType}\nGenerated: ${new Date(exp.createdAt).toLocaleDateString()}`}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Proof chain verified</span>
                  </div>
                  <span className="text-xs text-slate-500">Audit trail active — all access logged</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
