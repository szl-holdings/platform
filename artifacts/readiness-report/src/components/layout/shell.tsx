import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import bgTexture from "@assets/bg-texture.png";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Background Texture Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay"
        style={{ 
          backgroundImage: `url(${import.meta.env.BASE_URL}images/bg-texture.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
      />
      
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] pointer-events-none" />

      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto relative z-10 scroll-smooth">
        <div className="max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
