import { motion } from "framer-motion";
import { ArrowUpRight, Layers, Shield, Anchor, Cpu, BarChart3, Eye, Users, Sparkles } from "lucide-react";

const platforms = [
  { Icon: Layers, name: "Alloy", role: "Execution Fabric", color: "hsl(214,80%,65%)", desc: "Cross-platform workflow orchestration. Signals normalized, decisions routed, actions governed.", href: "/alloy/" },
  { Icon: Eye, name: "Lyte", role: "Business Observability", color: "hsl(190,90%,55%)", desc: "Command-layer business visibility. Risk, latency, ownership gaps — surfaced before they hit execution.", href: "/lyte-command-center/" },
  { Icon: Anchor, name: "Vessels", role: "Maritime Intelligence", color: "hsl(205,85%,55%)", desc: "Real-time fleet command for shipping operators. Voyage economics, route visibility, and AIS-grade signal processing.", href: "/vessels/" },
  { Icon: Shield, name: "Aegis", role: "Defense & Intelligence", color: "hsl(232,68%,60%)", desc: "Unified defense command — SOC, XDR, adversary emulation, managed operations, and AI intelligence in one platform.", href: "/firestorm/" },
  { Icon: Cpu, name: "INCA", role: "AI Research Platform", color: "hsl(265,80%,60%)", desc: "Agentic AI research command. Experiment tracking, model lineage, drift detection, and ensemble operations.", href: "/firestorm/intel/dashboard" },
  { Icon: BarChart3, name: "Terra", role: "Real Estate Intelligence", color: "hsl(140,56%,40%)", desc: "Distress property tracking, deal pipeline intelligence, and NYC market data for serious real estate operators.", href: "/terra/" },
  { Icon: Users, name: "Rosie", role: "Incident Command", color: "hsl(356,70%,52%)", desc: "MSP-grade threat and incident response. SLA prediction, dispatch automation, and client ops management.", href: "/firestorm/ops/dashboard" },
  { Icon: Sparkles, name: "Carlota Jo", role: "Private Advisory", color: "hsl(38,55%,58%)", desc: "High-trust private advisory and residence management for high-net-worth principals.", href: "/carlota-jo/" },
];

export function EcosystemRoleSection() {
  return (
    <section id="ecosystem" className="py-24 lg:py-32 bg-[#080c11] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-4">
            The Ecosystem
          </p>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight mb-5">
                Eight products. One operator.
              </h2>
              <p className="text-white/45 text-base font-light leading-relaxed">
                Every platform in the SZL Holdings portfolio is founder-built, founder-operated, and connected by a single shared architecture. Here's the current roster — what each does and why it exists.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-end">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-2xl font-semibold text-[#7ba3d4] leading-none">8</p>
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] mt-1">Products live</p>
                </div>
                <div className="w-px h-8 bg-white/8 hidden sm:block" />
                <div>
                  <p className="text-2xl font-semibold text-[#7ba3d4] leading-none">1</p>
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] mt-1">Shared architecture</p>
                </div>
                <div className="w-px h-8 bg-white/8 hidden sm:block" />
                <div>
                  <p className="text-2xl font-semibold text-[#7ba3d4] leading-none">5+</p>
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] mt-1">Domains covered</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-white/5">
          {platforms.map((p, i) => {
            const Icon = p.Icon;
            return (
              <motion.a
                key={p.name}
                href={p.href}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-[#080c11] hover:bg-[#0c1018] transition-colors duration-300 p-7 lg:p-8"
                style={{ textDecoration: "none" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 flex items-center justify-center rounded-sm"
                      style={{ background: `${p.color}18`, border: `1px solid ${p.color}28` }}
                    >
                      <Icon size={13} style={{ color: p.color }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors">{p.name}</p>
                      <p className="text-[9px] text-white/25 font-mono tracking-wide">{p.role}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={13} className="text-white/10 group-hover:text-white/35 transition-colors duration-300 mt-0.5 flex-shrink-0" />
                </div>
                <p className="text-white/35 text-[13px] font-light leading-relaxed group-hover:text-white/50 transition-colors duration-300">
                  {p.desc}
                </p>
                <div
                  className="mt-4 w-8 h-0.5 transition-all duration-300 group-hover:w-14"
                  style={{ background: p.color, opacity: 0.4 }}
                />
              </motion.a>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 p-7 lg:p-10"
          style={{
            background: "hsla(210,20%,8%,0.6)",
            border: "1px solid hsla(0,0%,100%,0.06)",
          }}
        >
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6">
              <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/50 mb-3">My Role</p>
              <h3 className="text-2xl font-semibold text-white tracking-tight mb-4">
                Founder, architect, operator.
              </h3>
              <p className="text-white/40 text-[14px] font-light leading-relaxed">
                I designed, built, and run every platform in this portfolio. No co-founders, no outsourced product teams. The architecture decisions, the design language, the technical implementation — all owner-operated from inception to production.
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full-stack architect", desc: "System design to production deployment" },
                  { label: "Product owner", desc: "Requirements to shipped experience" },
                  { label: "Technical operator", desc: "Infrastructure, monitoring, incident response" },
                  { label: "Domain researcher", desc: "Maritime, cybersecurity, AI/ML, enterprise ops" },
                ].map((item) => (
                  <div key={item.label} className="p-3" style={{ borderLeft: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <p className="text-[12px] font-semibold text-white/65 mb-1">{item.label}</p>
                    <p className="text-[11px] text-white/25 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
