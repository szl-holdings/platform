import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Download, FileText, Presentation } from "lucide-react";

const downloads = [
  { icon: FileText, title: "CV / Résumé", description: "Current CV covering enterprise software, AI infrastructure, and portfolio company experience.", format: "PDF", size: "85 KB" },
  { icon: Presentation, title: "SZL Holdings overview", description: "Portfolio summary covering Vessels, INCA, Carlota Jo, and the shared infrastructure thesis.", format: "PDF", size: "1.2 MB" },
  { icon: FileText, title: "AI explainability in enterprise operations", description: "Technical paper on the accountability and auditability requirements for enterprise AI deployments.", format: "PDF", size: "220 KB" },
];

export function Downloads() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Downloads</p>
          <h1 className="text-3xl font-bold text-foreground mb-4">Resources & documents</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            CV, portfolio overviews, and technical writing available for download.
          </p>
        </div>

        <div className="space-y-4">
          {downloads.map((item) => (
            <div key={item.title} className="flex items-start gap-5 border border-white/6 rounded-xl p-5 hover:border-white/12 transition-colors group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground/40 font-mono">{item.format} · {item.size}</span>
                    <Download className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/5 pt-8">
          <p className="text-muted-foreground/40 text-[13px]">
            Other materials available on request. <a href="mailto:hello@stephenlutar.com" className="text-primary hover:text-primary/80 transition-colors">Email me</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Downloads;
