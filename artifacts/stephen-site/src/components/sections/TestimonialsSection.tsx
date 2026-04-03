import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-20">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Client Feedback</h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            What Clients Say
          </h3>
          <p className="text-foreground/50 mt-4 max-w-xl">
            Testimonials are shared with explicit client permission. References available upon request.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center py-20 glass-panel rounded-2xl border border-white/5"
        >
          <MessageSquare className="w-10 h-10 text-primary/20 mb-4" />
          <p className="text-foreground/40 text-sm text-center max-w-sm">
            Client testimonials are added with explicit consent. Reach out directly for references.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
