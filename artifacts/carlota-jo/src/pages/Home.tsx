import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";

function RosaBlock() {
  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          <div className="lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
              The Founder
            </p>
            <h2 className="font-serif text-3xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
              Rosa Lutar
            </h2>
            <p className="text-sm font-light leading-relaxed mb-1" style={{ color: "var(--color-ink-600)" }}>
              Fractional Director of Properties & Residence
            </p>
            <p className="text-xs font-light" style={{ color: "var(--color-stone-500)" }}>
              SZL Holdings
            </p>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>
              Rosa built Carlota Jo for principals who need one person they can genuinely trust to manage the operational layer of their residential life — with warmth, detail-orientation, and the discretion that high-net-worth families require as a baseline.
            </p>
          </div>
          <div className="lg:col-span-3 flex flex-col items-start gap-4">
            <Link
              href="/founder"
              className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.1em] uppercase transition-colors"
              style={{ color: "var(--color-gold)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              About Rosa
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-6 py-3 text-[12px] font-medium tracking-[0.08em] transition-colors"
              style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
            >
              Request a consultation
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <Hero />
      <Services />
      <RosaBlock />
      <Footer />
    </div>
  );
}
