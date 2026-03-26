import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PremiumSection() {
  return (
    <section id="premium" className="py-32 bg-background relative overflow-hidden border-t border-white/5">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        <div className="glass-panel rounded-3xl overflow-hidden relative border border-primary/20 shadow-2xl shadow-primary/5">
          
          {/* Mock Content (Blurred) */}
          <div className="p-12 filter blur-md opacity-40 select-none">
            <h3 className="text-3xl font-serif font-bold text-foreground mb-6">Exclusive VC Insights Q3</h3>
            <div className="space-y-4">
              <div className="h-4 bg-secondary rounded w-3/4"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-5/6"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="h-32 bg-secondary rounded-xl"></div>
              <div className="h-32 bg-secondary rounded-xl"></div>
            </div>
          </div>

          {/* Paywall Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-background/60 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-primary to-yellow-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <Lock className="w-8 h-8 text-background" />
            </div>
            <h3 className="text-3xl font-serif font-bold text-foreground mb-4">Premium Content</h3>
            <p className="text-muted-foreground max-w-md mb-8 text-lg">
              Unlock exclusive architectural templates, investment thesis reports, and deep technical analyses.
            </p>
            <Button size="lg" className="rounded-full px-10 py-6 text-base font-semibold shadow-xl shadow-primary/20">
              Subscribe to Access
            </Button>
            <p className="mt-6 text-sm text-muted-foreground">
              Already a member? <a href="#" className="text-primary hover:underline">Log in</a>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
