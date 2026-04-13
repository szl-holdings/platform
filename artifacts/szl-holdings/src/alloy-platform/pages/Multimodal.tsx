import { AlloyAppShell } from "../components/AlloyAppShell";
import { UploadCloud, File, Image as ImageIcon, FileText, Music } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

export default function MultimodalPage() {
  return (
    <AlloyAppShell title="Multimodal Workspace">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Multimodal Analysis</h2>
        <p className="text-sm text-slate-400 mt-1">Upload unstructured data — images, PDFs, audio — for deep intelligence extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2">
          <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 hover:border-slate-600 transition-all cursor-pointer h-64 mb-6">
            <div className="w-16 h-16 bg-[#4B8BDB]/10 rounded-full flex items-center justify-center text-[#4B8BDB] mb-4">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Drag & drop files here</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Supports PDF, DOCX, JPG, PNG, MP3, WAV. Maximum file size 100MB.
            </p>
            <button className="mt-6 bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-700 transition-colors">
              Browse Files
            </button>
          </div>

          <h3 className="text-sm font-semibold text-white mb-4">Recent Uploads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileCard name="Q3_Earnings_Call.mp3" type="audio" size="14.2 MB" time="2 hours ago" />
            <FileCard name="Architecture_Diagram.png" type="image" size="2.4 MB" time="Yesterday" />
            <FileCard name="Master_Service_Agreement.pdf" type="pdf" size="1.8 MB" time="Yesterday" />
            <FileCard name="Product_Roadmap_v2.docx" type="doc" size="4.1 MB" time="3 days ago" />
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-5 h-[calc(100vh-14rem)] flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
            Analysis Results
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded uppercase tracking-wider">Complete</span>
          </h3>

          <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded">
              <Music size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">Q3_Earnings_Call.mp3</div>
              <div className="text-xs text-slate-500">Audio Transcription & Summary</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">Executive Summary</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Q3 revenue exceeded expectations by 14%, driven by strong enterprise adoption in the EMEA region. Operating margins improved to 22%. The CEO highlighted the upcoming launch of the new AI module as a key growth driver for Q4.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">Key Entities Extracted</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">Revenue: +14%</span>
                <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">Margin: 22%</span>
                <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">Region: EMEA</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">Action Items</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 pl-2">
                <li>Prepare Q4 forecast model update</li>
                <li>Draft press release for AI module launch</li>
                <li>Schedule EMEA sales team review</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-md text-sm font-medium transition-colors">
              Export to Workflow
            </button>
          </div>
        </div>
      </div>
    </AlloyAppShell>
  );
}

function FileCard({ name, type, size, time }: { name: string, type: 'audio'|'image'|'pdf'|'doc', size: string, time: string }) {
  const icons = {
    audio: <Music size={18} className="text-purple-400" />,
    image: <ImageIcon size={18} className="text-blue-400" />,
    pdf: <FileText size={18} className="text-red-400" />,
    doc: <File size={18} className="text-emerald-400" />
  };

  const bgs = {
    audio: "bg-purple-500/10",
    image: "bg-blue-500/10",
    pdf: "bg-red-500/10",
    doc: "bg-emerald-500/10"
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-[#0d121c] border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group">
      <div className={cn("p-2.5 rounded-md", bgs[type])}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
          <span>{size}</span>
          <span>•</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}
