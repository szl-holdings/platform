import { FileText, Download, Eye, BookOpen, Image, Presentation, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const pdfGuides = [
  { id: "PDF-001", title: "SZL Holdings Marketing Playbook", description: "Comprehensive marketing strategy guide covering brand voice, content pillars, audience targeting, and campaign execution framework", pages: 24, category: "strategy", size: "4.2 MB" },
  { id: "PDF-002", title: "LinkedIn Carousel: Platform Overview", description: "10-slide carousel showcasing the SZL Holdings ecosystem with key features of each platform app", pages: 10, category: "carousel", size: "8.1 MB" },
  { id: "PDF-003", title: "LinkedIn Carousel: Tech Stack Deep Dive", description: "8-slide carousel breaking down the technical architecture, frameworks, and infrastructure", pages: 8, category: "carousel", size: "6.5 MB" },
  { id: "PDF-004", title: "Profile Kit: Stephen Lutar", description: "Professional profile kit with bio, headshot guidelines, speaking topics, and media kit materials", pages: 6, category: "profile-kit", size: "3.8 MB" },
  { id: "PDF-005", title: "LinkedIn Carousel: Security Operations", description: "7-slide carousel highlighting Firestorm's security capabilities and SOC dashboard features", pages: 7, category: "carousel", size: "5.9 MB" },
  { id: "PDF-006", title: "Content Creator Guide", description: "Step-by-step guide for creating on-brand social media content with templates and best practices", pages: 16, category: "strategy", size: "3.2 MB" },
  { id: "PDF-007", title: "LinkedIn Carousel: AI Research", description: "9-slide carousel featuring INCA's AI research capabilities, model registry, and prediction dashboard", pages: 9, category: "carousel", size: "7.3 MB" },
  { id: "PDF-008", title: "Brand Guidelines Document", description: "Complete brand identity guidelines including colors, typography, logo usage, and tone of voice", pages: 32, category: "strategy", size: "12.4 MB" },
];

const screenshots = [
  { name: "Firestorm SOC Dashboard", app: "Firestorm", description: "Security Operations Center with live threat map and alert feed" },
  { name: "INCA Research Command", app: "INCA", description: "AI Research dashboard with model health scores and experiment tracking" },
  { name: "Dreamscape Workspace", app: "Dreamscape", description: "Creative engine workspace with campaign management" },
  { name: "Terra Intelligence Map", app: "Terra", description: "Real estate intelligence with property analysis and market trends" },
  { name: "Vessels Maritime", app: "Vessels", description: "Maritime intelligence dashboard with fleet tracking" },
  { name: "Lyte Command Center", app: "Lyte", description: "Business operations command center with signal feed" },
  { name: "Admin Control Plane", app: "Admin Panel", description: "System administration with connector health and integration management" },
  { name: "SZL Holdings Hub", app: "SZL Holdings", description: "Corporate portal with ecosystem overview" },
];

const categoryColors: Record<string, string> = {
  strategy: "text-blue-400 bg-blue-400/10",
  carousel: "text-purple-400 bg-purple-400/10",
  "profile-kit": "text-emerald-400 bg-emerald-400/10",
};

export function ContentGuides() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          Content Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">PDF guides, carousel content, marketing playbooks, and app screenshots</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> PDF Guides & Carousels
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {pdfGuides.map(guide => (
            <div key={guide.id} className="bg-card/60 border border-border rounded-xl p-5 hover:border-primary/20 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{guide.id}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize", categoryColors[guide.category])}>
                      {guide.category.replace("-", " ")}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{guide.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{guide.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>{guide.pages} pages</span>
                    <span>{guide.size}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" /> App Screenshots Gallery
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {screenshots.map((ss, i) => (
            <div key={i} className="bg-card/60 border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all group">
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-muted/20 to-cyan-500/10 flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground/60">{ss.app}</p>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-foreground">{ss.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ss.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ContentGuides;
