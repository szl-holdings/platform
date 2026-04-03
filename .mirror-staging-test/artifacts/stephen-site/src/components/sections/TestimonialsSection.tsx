import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO, TechVentures Inc.",
    quote: "Stephen transformed our entire platform architecture. His ability to see the big picture while nailing the details is exceptional. Delivery was on time and the system scaled 10x without breaking a sweat.",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    role: "VP Engineering, DataFlow",
    quote: "Working with Stephen was a game-changer. He modernized our legacy codebase in record time and mentored our team along the way. The ROI was visible within weeks.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Founder, GreenLeaf Digital",
    quote: "Stephen doesn't just write code — he solves business problems. His strategic thinking and technical depth made him an invaluable partner for our product launch.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-20">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Social Proof</h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            What Clients Say
          </h3>
          <p className="text-foreground/50 mt-4 max-w-xl">
            Don't just take my word for it — hear from the people I've worked with.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group glass-panel p-8 rounded-2xl hover:border-primary/20 transition-all duration-500 flex flex-col"
            >
              <Quote className="w-8 h-8 text-primary/20 mb-6" />

              <div className="flex gap-1 mb-5">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-foreground/60 text-sm leading-relaxed mb-8 flex-1 italic">
                "{testimonial.quote}"
              </p>

              <div className="pt-5 border-t border-white/5">
                <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                <p className="text-xs text-foreground/40 mt-0.5">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
