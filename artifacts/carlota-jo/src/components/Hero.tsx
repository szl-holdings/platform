import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const featuredEngagement = {
  label: "Featured Engagement",
  title: "Portfolio Transformation for a Global Industrial Group — $1.4B repositioning across six operating companies.",
  category: "Enterprise Strategy",
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden bg-navy-950">
      <div className="absolute inset-0 border-b border-cream-200/5" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-end">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-8"
            >
              Carlota Jo Advisory
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-serif text-5xl md:text-6xl lg:text-[4.5rem] font-light text-cream-50 leading-[1.1] mb-8"
            >
              Strategy for
              <br />
              <span className="italic">consequential</span>
              <br />
              decisions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-lg text-cream-200 font-light max-w-lg leading-relaxed mb-10"
            >
              We advise boards, leadership teams, and investors on their most
              critical strategic challenges — from portfolio transformation to
              market entry, M&A, and enterprise-wide change.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start gap-5"
            >
              <button
                onClick={() =>
                  document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-3.5 bg-gold-500 text-navy-950 text-xs font-medium tracking-[0.15em] uppercase hover:bg-gold-400 transition-colors duration-300"
              >
                Start a Conversation
              </button>
              <button
                onClick={() =>
                  document.querySelector("#case-studies")?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-3.5 text-xs font-medium tracking-[0.15em] uppercase text-cream-200/60 border border-cream-200/12 hover:border-cream-200/25 hover:text-cream-50 transition-all duration-300"
              >
                Explore Our Work
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="border border-cream-200/8 p-8 lg:p-10 hover:border-cream-200/15 transition-colors duration-500 group cursor-pointer"
              onClick={() =>
                document.querySelector("#case-studies")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-gold-400/70 mb-5">
                {featuredEngagement.label}
              </p>
              <p className="text-[11px] tracking-wider uppercase text-cream-300/40 mb-3">
                {featuredEngagement.category}
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-light text-cream-50 leading-snug mb-6 group-hover:text-gold-300 transition-colors duration-300">
                {featuredEngagement.title}
              </h3>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-gold-400/60 group-hover:text-gold-400 transition-colors">
                View engagement
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 pt-8 border-t border-cream-200/5 flex flex-wrap items-center gap-x-10 gap-y-3"
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-cream-300/25">
            Trusted by leadership teams at
          </p>
          {["Fortune 500 Industrials", "Global Private Equity", "Sovereign Wealth Funds", "NYSE-Listed Healthcare"].map((name) => (
            <span key={name} className="text-[11px] tracking-wider text-cream-300/20 font-light">
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
