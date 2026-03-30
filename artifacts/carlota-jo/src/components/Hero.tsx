import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-stone-50">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-40"
          style={{ background: "radial-gradient(ellipse at top right, rgba(212,204,188,0.5) 0%, transparent 60%)" }}
        />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] opacity-30"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(232,226,214,0.6) 0%, transparent 60%)" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 w-full py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-10"
            >
              Carlota Jo Advisory
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-serif text-5xl md:text-6xl lg:text-[4.5rem] font-light text-ink-900 leading-[1.08] mb-10"
            >
              Counsel for
              <br />
              <span className="italic">consequential</span>
              <br />
              decisions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-lg text-ink-600 font-light max-w-md leading-relaxed mb-5"
            >
              We advise boards, leadership teams, and investors on their most critical strategic decisions — with the rigour of a management consulting firm and the intimacy of a trusted partner.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38 }}
              className="text-sm text-ink-500 font-light max-w-sm leading-relaxed mb-14"
            >
              Every engagement is led personally by Carlota. No associates, no decks handed off down the chain.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.48 }}
              className="flex flex-col sm:flex-row items-start gap-5"
            >
              <button
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                className="group px-8 py-3.5 bg-ink-900 text-stone-50 text-xs font-medium tracking-[0.15em] uppercase hover:bg-ink-700 transition-colors duration-300 flex items-center gap-2.5"
              >
                Inquire privately
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 text-xs font-medium tracking-[0.15em] uppercase text-ink-500 border border-stone-300 hover:border-ink-500 hover:text-ink-900 transition-all duration-300"
              >
                Book a discovery conversation
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="lg:col-span-5 lg:pt-12"
          >
            <div
              className="border border-stone-200 bg-stone-100/60 p-8 lg:p-10 cursor-pointer hover:bg-stone-100 hover:border-stone-300 transition-all duration-500 group"
              onClick={() => document.querySelector("#case-studies")?.scrollIntoView({ behavior: "smooth" })}
            >
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-warm-gold mb-6">
                Featured engagement
              </p>
              <p className="text-[11px] tracking-wider uppercase text-stone-400 mb-3">
                Enterprise Strategy
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-light text-ink-900 leading-snug mb-8 group-hover:text-ink-700 transition-colors duration-300">
                Portfolio transformation for a global industrial group — $1.4B repositioning across six operating companies.
              </h3>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-warm-gold group-hover:text-warm-gold-light transition-colors">
                View engagement
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </div>

            <div className="mt-px grid grid-cols-3 gap-px bg-stone-200">
              {[
                { value: "95%", label: "Retention rate" },
                { value: "140+", label: "Engagements" },
                { value: "12", label: "Industries" },
              ].map((stat) => (
                <div key={stat.label} className="bg-stone-50 px-4 py-5 text-center">
                  <p className="font-serif text-2xl font-light text-ink-900 mb-1">{stat.value}</p>
                  <p className="text-[9px] tracking-wider uppercase text-stone-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-24 lg:mt-32 pt-8 border-t border-stone-200 flex flex-wrap items-center gap-x-10 gap-y-3"
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400">
            Trusted by leadership at
          </p>
          {["Fortune 500 Industrials", "Global Private Equity", "Sovereign Wealth Funds", "NYSE-Listed Healthcare"].map((name) => (
            <span key={name} className="text-[11px] tracking-wider text-stone-400 font-light">
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
