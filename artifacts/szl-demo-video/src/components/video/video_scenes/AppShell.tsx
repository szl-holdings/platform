import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Menu, Circle } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  activeItem?: string;
  activeSection?: string;
}

export function AppShell({ children, activeItem, activeSection }: AppShellProps) {
  return (
    <motion.div
      className="absolute inset-0 flex bg-[#0a0a0a] text-[#f5f5f5] font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8 }}
    >
      {/* Sidebar */}
      <div className="w-64 border-r border-[#c9b787]/10 bg-[rgba(201,183,135,0.02)] flex flex-col h-full z-20">
        <div className="h-14 flex items-center px-4 border-b border-[#c9b787]/10 gap-3">
          <Menu className="w-5 h-5 text-[#8a8a8a]" />
          <span className="font-display text-xl tracking-wide">a11oy</span>
        </div>
        
        <div className="flex-1 p-4 space-y-8 overflow-hidden">
          <NavSection 
            title="NOW" 
            items={['Home', 'Now Board', 'Command']} 
            activeItem={activeItem} 
          />
          <NavSection 
            title="INTELLIGENCE" 
            items={['Recommendations', 'Executive Brief', 'Frontier Intel', 'Agent Registry']} 
            activeItem={activeItem} 
          />
          <NavSection 
            title="FABRIC" 
            items={['Fabric', 'Verticals', 'Signal Mesh', 'Covenant Governance']} 
            activeItem={activeItem} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <div className="h-14 border-b border-[#c9b787]/10 bg-[rgba(201,183,135,0.02)] flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-2 h-2 rounded-full bg-[#c9b787]"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-mono text-[#8a8a8a]">Fabric operational</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="px-3 py-1 rounded border border-[#c9b787]/20 text-[#c9b787] text-xs font-mono">
              Investor demo
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 relative p-8">
          {/* Subtle background glow */}
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-[#c9b787] opacity-[0.03] blur-[60px] rounded-full pointer-events-none"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.02, 0.04, 0.02]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function NavSection({ title, items, activeItem }: { title: string, items: string[], activeItem?: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-mono text-[#555555] tracking-widest">{title}</h3>
      <div className="space-y-1">
        {items.map(item => (
          <div 
            key={item}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              activeItem === item || (activeItem === 'Governance' && item === 'Covenant Governance')
                ? 'bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20' 
                : 'text-[#8a8a8a]'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}