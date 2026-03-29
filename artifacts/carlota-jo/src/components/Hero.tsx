import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gold-400/3 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(to right, rgba(212,168,83,0.03) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(212,168,83,0.03) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="text-[11px] font-medium tracking-[0.4em] uppercase text-gold-400/70 mb-10">
            Strategic Advisory &bull; Portfolio Optimization &bull; Enterprise Transformation
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] font-light text-cream-50 leading-[1.08] mb-8"
        >
          Counsel for
          <br />
          <span className="italic text-gold-400">Consequential</span>
          <br />
          Decisions
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="text-base md:text-lg text-cream-200/45 font-light max-w-2xl mx-auto leading-relaxed mb-6"
        >
          Trusted by boards and leadership teams at Fortune 500 companies,
          sovereign wealth funds, and private equity portfolios.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-sm text-cream-300/30 font-light max-w-xl mx-auto leading-relaxed mb-14"
        >
          Rigorous strategy. Proprietary frameworks. Measurable outcomes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book`}
            className="px-10 py-4 bg-gold-500/90 text-navy-950 text-xs font-medium tracking-[0.2em] uppercase hover:bg-gold-400 transition-all duration-300"
          >
            Request a Consultation
          </a>
          <button
            onClick={() =>
              document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-10 py-4 border border-cream-200/15 text-cream-200/60 text-xs font-medium tracking-[0.2em] uppercase hover:border-gold-500/40 hover:text-gold-400 transition-all duration-300"
          >
            Explore Capabilities
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-gold-500/30 to-transparent" />
      </motion.div>
    </section>
  );
}
