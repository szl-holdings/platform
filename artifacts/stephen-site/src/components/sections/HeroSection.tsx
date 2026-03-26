import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetStephenProfile } from "@workspace/api-client-react";

export function HeroSection() {
  const { data: profile, isLoading } = useGetStephenProfile();

  const fallback = {
    name: "Stephen Lutar",
    title: "Founder & CEO, SZL Holdings",
    tagline: "Building the future of integrated technology",
  };

  const name = profile?.name || fallback.name;
  const title = profile?.title || fallback.title;
  const tagline = profile?.tagline || fallback.tagline;

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Luxury Abstract Background"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Available for Consulting</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-foreground leading-[1.1] mb-6">
              <span className={isLoading ? "blur-sm" : ""}>{name}</span>
            </h1>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-light mb-8">
              <span className={isLoading ? "blur-sm" : ""}>{title}</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mb-12 leading-relaxed">
              <span className={isLoading ? "blur-sm" : ""}>{tagline}</span>
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#portfolio">
                <Button size="lg" className="rounded-full px-8 py-6 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 group">
                  View Portfolio 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="#contact" className="text-foreground hover:text-primary font-medium transition-colors flex items-center gap-2">
                Request a Meeting
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>
    </section>
  );
}
