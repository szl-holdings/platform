import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface ShellProps {
  children: ReactNode;
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
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
