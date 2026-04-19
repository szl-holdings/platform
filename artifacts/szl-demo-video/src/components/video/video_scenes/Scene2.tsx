import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene2() {
  const [activeSurface, setActiveSurface] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveSurface(0), 0),      // Pulse
      setTimeout(() => setActiveSurface(1), 2500),   // Vessels
      setTimeout(() => setActiveSurface(2), 5000),   // Terra
      setTimeout(() => setActiveSurface(3), 7500),   // Aegis
      setTimeout(() => setActiveSurface(4), 10000),  // Carlota Jo
      setTimeout(() => setActiveSurface(5), 12500),  // Sentra
      setTimeout(() => setActiveSurface(6), 15000),  // Lyte
      setTimeout(() => setActiveSurface(7), 17500),  // PRISM Counsel
      setTimeout(() => setActiveSurface(8), 20000),  // Counsel
      setTimeout(() => setActiveSurface(9), 22500),  // Unified Command
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const surfaces = [
    {
      name: "Pulse",
      desc: "EXECUTIVE BRIEFING",
      color: "var(--color-text-primary)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden flex flex-col">
          <div className="h-[2vh] w-full bg-[var(--color-border)] flex items-center px-[1vw]">
            <span className="font-mono text-[0.5vw] tracking-widest text-[var(--color-warning)]">CONFIDENTIAL // PRINCIPAL EYES ONLY</span>
          </div>
          <div className="p-[2vw] flex flex-col gap-[2vh]">
            <div className="font-mono text-[0.7vw] text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)] pb-[1vh]">
              Edition 04.17.2026 — Morning Brief
            </div>
            <h2 className="font-display text-[1.8vw] text-[var(--color-text-primary)] leading-tight">
              Sanctioned crude tanker enters Persian Gulf shadow corridor; counterparty exposure spans 3 portfolio entities.
            </h2>
            <div className="flex gap-[0.5vw]">
              <span className="font-mono text-[0.6vw] px-[0.8vw] py-[0.4vh] rounded-full border border-[var(--color-critical)] text-[var(--color-critical)] bg-[var(--color-critical)]/10">HIGH 0.87</span>
              <span className="font-mono text-[0.6vw] px-[0.8vw] py-[0.4vh] rounded-full border border-[var(--color-warning)] text-[var(--color-warning)] bg-[var(--color-warning)]/10">MODERATE 0.62</span>
            </div>
            <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)] mt-[2vh]">trc_9X2M4K8L1P0R5T</div>
          </div>
        </div>
      )
    },
    {
      name: "Vessels",
      desc: "MARITIME INTELLIGENCE",
      color: "var(--color-vessels)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-[1.5vh] mb-[1.5vh]">
            <div>
              <div className="font-mono text-[0.8vw] text-[var(--color-vessels)] mb-[0.5vh]">IMO 9821045</div>
              <div className="font-display text-[2vw] text-[var(--color-text-primary)]">PACIFIC MERIDIAN</div>
              <div className="font-mono text-[0.7vw] text-[var(--color-text-muted)] mt-[0.5vh]">VLCC · 300,000 DWT · Flag: Unknown</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[0.7vw] text-[var(--color-critical)]">SUSPICION SCORE</div>
              <div className="font-mono text-[3vw] text-[var(--color-critical)] leading-none">94</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="bg-[var(--color-bg-base)] p-[1vw] rounded border border-[var(--color-border)]">
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">AIS GAP</div>
              <div className="font-mono text-[1vw] text-[var(--color-text-primary)]">14h 22m</div>
              <div className="font-mono text-[0.6vw] text-[var(--color-warning)] mt-[0.5vh]">26.1°N 55.8°E — Persian Gulf</div>
            </div>
            <div className="bg-[var(--color-bg-base)] p-[1vw] rounded border border-[var(--color-border)]">
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">CARGO ESTIMATE</div>
              <div className="font-mono text-[1vw] text-[var(--color-text-primary)]">$151.05M</div>
              <div className="font-mono text-[0.6vw] text-[var(--color-critical)] mt-[0.5vh]">Total Potential Fine: $2.98M</div>
            </div>
          </div>
          <div className="font-mono text-[0.6vw] mt-[2vh] px-[1vw] py-[0.5vh] bg-[var(--color-bg-base)] inline-block border border-[var(--color-border)] rounded-full text-[var(--color-text-muted)]">
            POLICY: HUMAN APPROVAL REQUIRED
          </div>
        </div>
      )
    },
    {
      name: "Terra",
      desc: "REAL ESTATE",
      color: "var(--color-terra)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="font-mono text-[0.7vw] text-[var(--color-terra)] tracking-wider mb-[1vh]">AUM: $4.2B+</div>
          <div className="font-display text-[2vw] text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-[1.5vh] mb-[1.5vh]">
            Meridian Tower
          </div>
          <div className="font-mono text-[0.8vw] text-[var(--color-text-muted)] mb-[2vh]">1200 Meridian Ave, Miami, FL</div>
          <div className="flex justify-between items-end">
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">OCCUPANCY</div>
              <div className="font-mono text-[1.5vw] text-[var(--color-success)]">94.2%</div>
            </div>
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">NOI</div>
              <div className="font-mono text-[1.5vw] text-[var(--color-text-primary)]">$4.18M</div>
            </div>
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">VALUE</div>
              <div className="font-mono text-[1.5vw] text-[var(--color-text-primary)]">$72.1M</div>
            </div>
          </div>
          <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)] mt-[2vh]">trc_2F8L9P4M1Q7R5X</div>
        </div>
      )
    },
    {
      name: "Aegis",
      desc: "DEFENSE & INTEL",
      color: "var(--color-aegis)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="flex justify-between items-center mb-[2vh] border-b border-[var(--color-border)] pb-[1.5vh]">
            <div className="font-mono text-[0.8vw] text-[var(--color-aegis)]">CRITICAL EVENTS DETECTED</div>
            <div className="font-mono text-[2vw] text-[var(--color-critical)]">61</div>
          </div>
          <div className="grid grid-cols-3 gap-[1vw] mb-[2vh]">
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">ACTIVE THREATS</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-critical)]">7</div>
            </div>
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">INCIDENTS OPEN</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-warning)]">3</div>
            </div>
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">ENDPOINTS PROTECTED</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-text-primary)]">4,821</div>
            </div>
          </div>
          <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">
            SIMULATIONS EXECUTED: 31,200+ | ATT&CK TECHNIQUES COVERED: 200+
          </div>
          <div className="font-mono text-[0.6vw] mt-[2vh] px-[1vw] py-[0.5vh] bg-[var(--color-bg-base)] inline-block border border-[var(--color-border)] rounded-full text-[var(--color-critical)]">
            POLICY: BLOCKED
          </div>
        </div>
      )
    },
    {
      name: "Carlota Jo",
      desc: "PRIVATE ADVISORY",
      color: "var(--color-carlota)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-carlota)]/30 rounded-lg overflow-hidden p-[2vw]">
          <div className="font-display text-[2vw] text-[var(--color-carlota)] italic border-b border-[var(--color-carlota)]/20 pb-[1vh] mb-[2vh]">
            Residence Operations
          </div>
          <div className="grid grid-cols-2 gap-[1.5vw]">
            <div className="font-mono text-[0.8vw] text-[var(--color-text-primary)]">Property Coordination</div>
            <div className="font-mono text-[0.8vw] text-[var(--color-text-primary)]">Household Systems</div>
            <div className="font-mono text-[0.8vw] text-[var(--color-text-primary)]">Vendor Management</div>
            <div className="font-mono text-[0.8vw] text-[var(--color-text-primary)]">Principal Eyes Only</div>
          </div>
          <div className="font-mono text-[0.6vw] mt-[3vh] px-[1vw] py-[0.5vh] bg-[var(--color-bg-base)] inline-block border border-[var(--color-border)] rounded-full text-[var(--color-text-muted)]">
            POLICY: ADVISORY ALLOW
          </div>
        </div>
      )
    },
    {
      name: "Sentra",
      desc: "CYBER POSTURE",
      color: "var(--color-critical)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="font-mono text-[0.8vw] text-[var(--color-critical)] mb-[1vh]">CYBER POSTURE</div>
          <div className="font-display text-[2vw] text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-[1.5vh] mb-[1.5vh]">
            Critical Infrastructure Monitor
          </div>
          <div className="flex justify-between items-center bg-[var(--color-bg-base)] border border-[var(--color-critical)]/30 p-[1vw] rounded mb-[2vh]">
            <div className="font-mono text-[0.8vw] text-[var(--color-critical)]">ELEVATED · 3 ACTIVE INCIDENTS</div>
            <div className="w-2 h-2 rounded-full bg-[var(--color-critical)] animate-pulse" />
          </div>
          <div className="font-mono text-[0.6vw] mt-[1vh] px-[1vw] py-[0.5vh] bg-[var(--color-bg-base)] inline-block border border-[var(--color-border)] rounded-full text-[var(--color-warning)]">
            GUARDIAN APPROVAL REQUIRED
          </div>
        </div>
      )
    },
    {
      name: "Lyte",
      desc: "DECISION INTELLIGENCE",
      color: "var(--color-lyte-cyan)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="font-mono text-[0.8vw] text-[var(--color-lyte-cyan)] mb-[1vh]">DECISION INTELLIGENCE</div>
          <div className="font-display text-[2vw] text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-[1.5vh] mb-[1.5vh]">
            Q2 Rebalancing Decision
          </div>
          <div className="flex justify-between items-end mb-[2vh]">
            <div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">SCORE</div>
              <div className="font-mono text-[2vw] text-[var(--color-lyte-cyan)] leading-none">92 CONFIDENCE</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="bg-[var(--color-lyte-cyan)]/10 text-[var(--color-lyte-cyan)] p-[1vw] rounded text-center border border-[var(--color-lyte-cyan)]/30 font-mono text-[0.7vw]">
              APPROVE (HUMAN REVIEW REQUIRED)
            </div>
            <div className="bg-[var(--color-bg-base)] text-[var(--color-text-muted)] p-[1vw] rounded text-center border border-[var(--color-border)] font-mono text-[0.7vw]">
              DEFER
            </div>
          </div>
        </div>
      )
    },
    {
      name: "PRISM Counsel",
      desc: "LEGAL COMMAND",
      color: "hsl(263,52%,55%)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="font-mono text-[0.8vw] mb-[1vh]" style={{ color: "hsl(263,52%,55%)" }}>LEGAL COMMAND</div>
          <div className="font-display text-[2vw] text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-[1.5vh] mb-[1.5vh]">
            Santander v. Pacific Meridian VLCC
          </div>
          <div className="flex justify-between items-center mb-[2vh]">
            <div className="font-mono text-[0.8vw] text-[var(--color-text-primary)]">MATTER ACTIVE · 3 OPEN TASKS</div>
          </div>
          <div className="font-mono text-[0.7vw] mt-[1vh] px-[1.5vw] py-[0.8vh] bg-[var(--color-critical)]/10 inline-block border border-[var(--color-critical)]/30 rounded text-[var(--color-critical)]">
            HIGH EXPOSURE: $2.1M
          </div>
        </div>
      )
    },
    {
      name: "Counsel",
      desc: "LEGAL MATTERS",
      color: "hsl(246,48%,60%)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="font-mono text-[0.8vw] mb-[1vh]" style={{ color: "hsl(246,48%,60%)" }}>LEGAL MATTERS</div>
          <div className="font-display text-[2vw] text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-[1.5vh] mb-[1.5vh]">
            Maritime Exposure Assessment
          </div>
          <div className="flex justify-between items-center mb-[2vh] bg-[var(--color-bg-base)] border border-[var(--color-warning)]/30 p-[1vw] rounded">
            <div className="font-mono text-[0.8vw] text-[var(--color-warning)]">URGENT · 12h DEADLINE</div>
          </div>
          <div className="font-mono text-[0.6vw] mt-[1vh] px-[1vw] py-[0.5vh] bg-[var(--color-bg-base)] inline-block border border-[var(--color-border)] rounded-full text-[var(--color-text-muted)]">
            HUMAN REVIEW LOCKED
          </div>
        </div>
      )
    },
    {
      name: "Unified Command",
      desc: "ECOSYSTEM NERVE CENTER",
      color: "var(--color-lyte-cyan)",
      mock: (
        <div className="w-[40vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden p-[2vw]">
          <div className="font-mono text-[0.8vw] text-[var(--color-lyte-cyan)] mb-[2vh]">CROSS-DOMAIN CORRELATION ACTIVE</div>
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="bg-[var(--color-bg-base)] border border-[var(--color-aegis)]/30 p-[1vw] rounded">
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">AEGIS</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-text-primary)]">61</div>
            </div>
            <div className="bg-[var(--color-bg-base)] border border-[var(--color-vessels)]/30 p-[1vw] rounded">
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">VESSELS</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-text-primary)]">82 <span className="text-[0.6vw] text-[var(--color-text-muted)]">($847M)</span></div>
            </div>
            <div className="bg-[var(--color-bg-base)] border border-[var(--color-text-primary)]/30 p-[1vw] rounded">
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">SZL</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-text-primary)]">79 <span className="text-[0.6vw] text-[var(--color-text-muted)]">($3.2B / 18.4%)</span></div>
            </div>
            <div className="bg-[var(--color-bg-base)] border border-[var(--color-lyte-cyan)]/30 p-[1vw] rounded">
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)]">LYTE</div>
              <div className="font-mono text-[1.2vw] text-[var(--color-text-primary)]">88 <span className="text-[0.6vw] text-[var(--color-text-muted)]">(99.97%)</span></div>
            </div>
          </div>
          <div className="font-mono text-[0.6vw] mt-[2vh] px-[1vw] py-[0.5vh] bg-[var(--color-lyte-cyan)]/10 inline-block border border-[var(--color-lyte-cyan)]/30 rounded-full text-[var(--color-lyte-cyan)]">
            CORRELATION: HIGH CONFIDENCE
          </div>
        </div>
      )
    }
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.fadeBlur}
    >
      <div className="w-full flex flex-col items-center justify-center gap-[5vh]">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeSurface}
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-[1vw] tracking-widest mb-[1vh]" style={{ color: surfaces[activeSurface].color }}>
              {surfaces[activeSurface].desc}
            </div>
            <div className="font-display text-[4vw] tracking-tight leading-none text-[var(--color-text-primary)]">
              {surfaces[activeSurface].name}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="relative w-[50vw] h-[40vh] flex items-center justify-center perspective-[1000px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeSurface}
              className="absolute shadow-2xl"
              initial={{ opacity: 0, rotateX: 20, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateX: -20, y: -50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {surfaces[activeSurface].mock}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
