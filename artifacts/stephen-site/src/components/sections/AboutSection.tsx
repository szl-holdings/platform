import { motion } from "framer-motion";
import { useGetStephenProfile } from "@workspace/api-client-react";

const arc = [
  { period: "2010 – 2015", role: "Senior Systems Engineer", org: "Defense Contractor (DoD)" },
  { period: "2015 – 2018", role: "Lead Architect", org: "Global Fintech Platform" },
  { period: "2018 – 2021", role: "VP Engineering", org: "Enterprise SaaS (Series B)" },
  { period: "2022 – Present", role: "Founder & CEO", org: "SZL Holdings" },
];

const stats = [
  { value: "15+", label: "Years in Enterprise Tech" },
  { value: "$2B+", label: "Systems Architected" },
  { value: "6", label: "Live Products" },
  { value: "99.97%", label: "Platform Uptime" },
];

export function AboutSection() {
  const { data: profile } = useGetStephenProfile();

  const fallbackBio = `15 years at the intersection of defense systems, financial infrastructure, and enterprise technology — from architecting mission-critical DoD platforms to leading fintech engineering teams processing millions of daily transactions.

In 2022, I founded SZL Holdings: six live products across maritime intelligence, adversarial security simulation, and AI-native creative production. I don't advise on building companies. I build them.`;

  return (
    <section id="about" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.25em] mb-5">The Story</p>
            <h2 className="text-4xl sm:text-5xl font-serif text-foreground mb-10 leading-tight">
              I don't pitch ideas.<br />
              <span className="italic text-primary">I build companies.</span>
            </h2>
            
            <div className="space-y-5 text-foreground/55 text-base leading-relaxed font-light">
              {(profile?.bio || fallbackBio).split('\n\n').map((paragraph, i) => (
                <motion.p 
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 border-t border-white/6 pt-10"
            >
              <p className="text-[10px] font-semibold text-foreground/30 uppercase tracking-[0.2em] mb-6">Career arc</p>
              <div className="space-y-4">
                {arc.map((item) => (
                  <div key={item.period} className="flex items-start gap-6">
                    <span className="text-xs font-mono text-primary/60 whitespace-nowrap pt-0.5 w-32 shrink-0">{item.period}</span>
                    <div>
                      <span className="text-sm text-foreground/70">{item.role}</span>
                      <span className="text-sm text-foreground/30"> — {item.org}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="lg:col-span-5 grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-panel p-7 flex flex-col justify-center items-center text-center hover:border-primary/20 transition-all duration-300"
              >
                <span className="text-4xl font-serif text-primary mb-2">{stat.value}</span>
                <span className="text-[10px] font-medium text-foreground/35 uppercase tracking-[0.15em] leading-tight">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
