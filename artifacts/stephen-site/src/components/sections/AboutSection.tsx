import { motion } from "framer-motion";
import { useGetStephenProfile, useListStephenContentBlocks } from "@workspace/api-client-react";

export function AboutSection() {
  const { data: profile } = useGetStephenProfile();
  const { data: statBlocks } = useListStephenContentBlocks({ type: "stat" });

  const fallbackBio = `Over the past 15 years, I've operated at the intersection of enterprise technology, defense systems, and financial infrastructure — building platforms that handle real complexity at real scale.

My career started in the trenches of enterprise IT, architecting mission-critical systems for federal defense contractors where failure wasn't a slide in a post-mortem — it was a national security concern. From there I moved into fintech, leading engineering teams that built payment processing infrastructure handling millions of daily transactions across global markets.

In 2022, I founded SZL Holdings to bring everything I'd learned into a single, vertically integrated technology company. Today, SZL operates six live products spanning maritime intelligence, cybersecurity simulation, creative production, and enterprise commerce — each built from the ground up, each solving problems I encountered firsthand.

I don't advise from the sidelines. I build, I ship, and I operate. Every system in the SZL portfolio runs in production, serves real users, and generates real outcomes.`;

  const defaultStats = [
    { label: "Years in Enterprise Tech", value: "15+" },
    { label: "Systems Architected (Value)", value: "$2B+" },
    { label: "Live Products in Production", value: "6" },
    { label: "Platform Uptime", value: "99.97%" },
  ];

  const statsToDisplay = statBlocks && statBlocks.length > 0 
    ? statBlocks.map(block => ({ label: block.title, value: block.content }))
    : defaultStats;

  const domains = [
    "Enterprise Architecture", "Defense & Intelligence", "Fintech & Payments", 
    "Maritime Operations", "Cybersecurity", "Cloud Infrastructure (AWS/GCP)", 
    "Full-Stack Engineering", "Product Strategy", "M&A Technical Due Diligence"
  ];

  return (
    <section id="about" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">The Story</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-10 leading-tight">
              I don't pitch ideas.<br />
              <span className="gold-gradient-text">I build companies.</span>
            </h3>
            
            <div className="prose prose-lg prose-invert max-w-none text-foreground/60 space-y-5">
              {(profile?.bio || fallbackBio).split('\n\n').map((paragraph, i) => (
                <motion.p 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="leading-relaxed"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <div className="mt-12">
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] mb-5">Domain Expertise</h4>
              <div className="flex flex-wrap gap-2.5">
                {domains.map((domain) => (
                  <motion.span
                    key={domain}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="px-4 py-2 rounded-full border border-white/8 bg-white/[0.02] text-sm font-medium text-foreground/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300 cursor-default"
                  >
                    {domain}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-5 grid grid-cols-2 gap-5"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {statsToDisplay.map((stat, i) => (
              <motion.div 
                key={`stat-${stat.label}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center text-center hover:border-primary/30 transition-all duration-300"
              >
                <span className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">{stat.value}</span>
                <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider leading-tight">{stat.label}</span>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="col-span-2 glass-panel p-6 rounded-2xl border-primary/10"
            >
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] mb-4">Career Arc</h4>
              <div className="space-y-3">
                {[
                  { year: "2010 - 2015", role: "Senior Systems Engineer, Defense Contractor (DoD)" },
                  { year: "2015 - 2018", role: "Lead Architect, Global Fintech Platform" },
                  { year: "2018 - 2021", role: "VP Engineering, Enterprise SaaS (Series B)" },
                  { year: "2022 - Present", role: "Founder & CEO, SZL Holdings" },
                ].map((item) => (
                  <div key={item.year} className="flex items-start gap-3">
                    <span className="text-xs font-mono text-primary/70 whitespace-nowrap pt-0.5">{item.year}</span>
                    <span className="text-sm text-foreground/60">{item.role}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
