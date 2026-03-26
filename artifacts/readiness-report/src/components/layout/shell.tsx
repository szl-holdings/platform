import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Server, WifiOff } from "lucide-react";
import { Sidebar } from "./sidebar";
import bgTexture from "@assets/bg-texture.png";

interface ShellProps {
  children: ReactNode;
}

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-readiness"],
    queryFn: () => fetch("/api/services/health/app/readiness").then((r) => r.json()),
    refetchInterval: 60000,
  });
  if (!data) return null;
  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;
  const demoNames = data.services.filter((s) => s.status === "MOCKED_DEMO_MODE").map((s) => s.name);
  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 shrink-0 relative z-20">
        <WifiOff className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 shrink-0 relative z-20">
      <Server className="w-4 h-4 text-amber-400" />
      <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
      <span className="text-xs text-amber-400/60">— {demoNames.join(", ")} using simulated data</span>
    </div>
  );
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay"
        style={{ 
          backgroundImage: `url(${import.meta.env.BASE_URL}images/bg-texture.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
      />
      
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative z-10">
        <DemoModeBanner />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
