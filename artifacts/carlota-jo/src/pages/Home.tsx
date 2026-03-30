import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";

function WhoWeServeStrip() {
  return (
    <section className="py-16 lg:py-20" style={{ background: "var(--color-stone-50)", borderTop: "1px solid var(--color-stone-200)", borderBottom: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
              Who We Serve
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-5" style={{ color: "var(--color-ink-900)" }}>
              High-net-worth families
              <br />
              <span style={{ fontStyle: "italic" }}>and private residences.</span>
            </h2>
            <p className="text-sm font-light leading-relaxed mb-6" style={{ color: "var(--color-ink-600)" }}>
              Carlota Jo works with principals who require a trusted single point of contact for their residential and operational environment. The client base is deliberately small — which is why the standard of service is what it is.
            </p>
            <Link
              href="/who-we-serve"
              className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.1em] uppercase transition-colors"
              style={{ color: "var(--color-gold)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              See who we work with →
            </Link>
          </motion.div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: "var(--color-stone-200)" }}>
            {[
              { label: "High-net-worth families", detail: "Primary and secondary residences" },
              { label: "Private residences", detail: "Estate-scale environments" },
              { label: "Principals", detail: "Individuals with complex personal environments" },
              { label: "Estate environments", detail: "Family office residential contexts" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="px-6 py-7"
                style={{ background: "var(--color-cream-warm)" }}
              >
                <p className="text-[13px] font-medium mb-1" style={{ color: "var(--color-ink-900)" }}>{item.label}</p>
                <p className="text-[12px] font-light" style={{ color: "var(--color-stone-500)" }}>{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RosaBlock() {
  return (
    <section className="py-16 lg:py-20" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
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
              The founder
            </p>
            <h2 className="font-serif text-3xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
              Rosa Lutar
            </h2>
            <p className="text-sm font-light leading-relaxed mb-2" style={{ color: "var(--color-ink-600)" }}>
              Fractional Director of Properties and Residence
            </p>
            <p className="text-xs font-light" style={{ color: "var(--color-stone-500)" }}>
              SZL Holdings · Carlota Jo Consulting
            </p>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-600)" }}>
              Rosa built Carlota Jo to fill a gap she observed in every environment she worked in: high-net-worth families with complex, multi-residence lives who needed someone they could genuinely trust to manage the operational layer — not an agency, not rotating staff, but one person who understood their standard and held it consistently.
            </p>
            <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
              She operates with the warmth that builds long-term relationships, the detail-orientation that prevents anything from falling through the gaps, and the discretion that principals require as a baseline, not a premium.
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
              About Rosa →
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
      <WhoWeServeStrip />
      <RosaBlock />
      <Footer />
    </div>
  );
}
