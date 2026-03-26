import { motion } from "framer-motion";
import { useGetStephenProfile, useListStephenContentBlocks } from "@workspace/api-client-react";

export function AboutSection() {
  const { data: profile } = useGetStephenProfile();
  const { data: statBlocks } = useListStephenContentBlocks({ type: "stat" });

  const fallbackBio = "I am a visionary technology executive with a passion for building robust, scalable platforms. Through SZL Holdings, I've developed an ecosystem of interconnected applications that solve complex enterprise challenges while maintaining an unwavering standard of design and performance.";
  
  const defaultStats = [
    { label: "Years Experience", value: "15+" },
    { label: "Projects Delivered", value: "50+" },
    { label: "Enterprise Clients", value: "12" },
    { label: "Uptime", value: "99.9%" },
  ];

  const statsToDisplay = statBlocks && statBlocks.length > 0 
    ? statBlocks.map(block => ({ label: block.title, value: block.content }))
    : defaultStats;

  const skills = [
    "Enterprise Architecture", "React & Node.js", "Cloud Infrastructure", 
    "Product Strategy", "Team Leadership", "UI/UX Direction", 
    "System Integration", "Venture Capital"
  ];

  return (
    <section id="about" className="py-24 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Bio Side */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">About Me</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8 leading-tight">
              Bridging the gap between <span className="gold-gradient-text">design and engineering</span>.
            </h3>
            
            <div className="prose prose-lg prose-invert max-w-none text-muted-foreground mb-10">
              <p>{profile?.bio || fallbackBio}</p>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              {skills.map((skill) => (
                <motion.span
                  key={skill}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-4 py-2 rounded-full border border-white/10 bg-secondary/50 text-sm font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-default"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Stats Side */}
          <motion.div 
            className="lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6"
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
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
