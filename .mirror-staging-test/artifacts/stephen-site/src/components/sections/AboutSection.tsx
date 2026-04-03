import { motion } from "framer-motion";

const FOUNDER_SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/stephenleezl",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/stephenleeszl",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: "SZL Holdings",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
];

const beliefs = [
  { label: "Systems thinking", text: "Every product is a system. Design the interfaces, incentives, and failure modes before writing a line of code." },
  { label: "Speed through clarity", text: "The fastest teams have the clearest mental models. Ambiguity is the hidden cost no one budgets for." },
  { label: "Small sharp teams", text: "I've seen 4-person teams outship 40-person departments. Headcount is not leverage — judgment is." },
  { label: "Own the stack", text: "Understanding every layer — from database index to UI state — is the difference between building fast and building right." },
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-[#080c11] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-6">
              Background
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight mb-7">
              Builder,
              <br />
              <span className="text-white/45 font-normal">not just architect.</span>
            </h2>
            <p className="text-white/50 text-base font-light leading-relaxed mb-5">
              I started writing production code at 17. Since then I've shipped enterprise
              infrastructure, founded two venture-backed companies, and built teams across
              fintech, maritime, and AI.
            </p>
            <p className="text-white/45 text-base font-light leading-relaxed">
              Today I lead SZL Holdings — a multi-venture holding company building the next
              generation of intelligence infrastructure across five product lanes.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {FOUNDER_SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={link.label}
                  title={link.label}
                  className="text-white/25 hover:text-white/60 transition-colors duration-200 inline-flex items-center"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-6">
              How I think
            </p>
            <div className="space-y-px bg-white/5">
              {beliefs.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-[#080c11] hover:bg-[#0d1219] transition-colors duration-300 p-6"
                >
                  <p className="text-[13px] font-semibold text-[#a0c0e8] mb-1.5 tracking-tight">{b.label}</p>
                  <p className="text-[13.5px] text-white/40 font-light leading-relaxed">{b.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
