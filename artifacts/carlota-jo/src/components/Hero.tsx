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
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-8">
            Strategic Advisory &bull; Portfolio Optimization &bull; Transformation
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-light text-cream-50 leading-[1.1] mb-8"
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
          className="text-lg md:text-xl text-cream-200/50 font-light max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Carlota Jo partners with enterprise leaders to navigate strategic
          complexity, optimize portfolios, and capture transformative growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book`}
            className="px-8 py-3.5 bg-gold-500/90 text-navy-950 text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-all duration-300"
          >
            Schedule Consultation
          </a>
          <button
            onClick={() =>
              document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-3.5 border border-cream-200/20 text-cream-200/70 text-sm font-medium tracking-widest uppercase hover:border-gold-500/40 hover:text-gold-400 transition-all duration-300"
          >
            Our Services
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
