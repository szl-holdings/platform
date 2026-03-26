import { motion } from "framer-motion";
import { Server, Layout, ShieldCheck, Zap, Database, Search } from "lucide-react";
import { useListStephenContentBlocks } from "@workspace/api-client-react";

const fallbackServices = [
  { id: 1, title: "Enterprise Architecture", content: "Designing scalable, resilient system architectures for high-growth companies.", icon: "Server" },
  { id: 2, title: "Product Strategy", content: "Aligning technical execution with overarching business objectives and market demands.", icon: "Search" },
  { id: 3, title: "UI/UX Direction", content: "Crafting premium, user-centric interfaces that convert and retain users.", icon: "Layout" },
  { id: 4, title: "Security & Compliance", content: "Implementing robust security protocols and ensuring industry compliance standards.", icon: "ShieldCheck" },
];

const iconMap: Record<string, React.ElementType> = {
  Server, Layout, ShieldCheck, Zap, Database, Search
};

export function ServicesSection() {
  const { data: services } = useListStephenContentBlocks({ type: "service" });
  
  const displayServices = services?.length ? services : fallbackServices;

  return (
    <section id="services" className="py-24 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Expertise</h2>
          <h3 className="text-4xl font-serif font-bold text-foreground mb-6">Services & Consulting</h3>
          <p className="text-muted-foreground text-lg">Partnering with ambitious companies to solve complex technical challenges and accelerate growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service, index) => {
            const Icon = service.icon && iconMap[service.icon] ? iconMap[service.icon] : Zap;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-8 rounded-2xl glass-panel hover:bg-white/[0.02] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">{service.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {service.content}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
