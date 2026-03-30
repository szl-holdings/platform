import { m } from "framer-motion";
import siteData from "@/data/site.json";

const teamMembers = [
  {
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop",
    name: "Stephen Lutar", role: "Founder & CEO", focus: "Enterprise Architecture",
  },
  {
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&auto=format&fit=crop",
    name: "Thomas Franklin", role: "Chief Technology Officer", focus: "AI & Infrastructure",
  },
  {
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop",
    name: "Maria Reyes", role: "Chief Investment Officer", focus: "Capital Deployment",
  },
  {
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop",
    name: "James Chen", role: "VP Operations", focus: "Platform Delivery",
  },
];

export function Leadership() {
  const { leadership } = siteData;

  return (
    <section id="leadership" className="py-24 lg:py-32 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">Leadership</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight">
              Built by operators.
            </h2>
            <p className="text-szl-text-secondary text-sm max-w-sm leading-relaxed">
              Founders and executives who have shipped production systems at scale.
            </p>
          </div>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {teamMembers.map((member, index) => (
            <m.div
              key={member.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl border border-szl-border bg-white p-5 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden mb-4">
                <img
                  src={member.photo}
                  alt={`${member.name} - ${member.role} at SZL Holdings`}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-0.5">
                {member.name}
              </h3>
              <p className="text-szl-text-muted text-[11px] font-medium uppercase tracking-wider mb-1">
                {member.role}
              </p>
              <p className="text-szl-text-secondary text-xs">
                {member.focus}
              </p>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-szl-border bg-white p-8 sm:p-10"
        >
          <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-6">Founding Thesis</p>
          <blockquote className="font-[var(--font-display)] text-lg sm:text-xl text-szl-text leading-relaxed mb-6 max-w-4xl">
            "{leadership.quote}"
          </blockquote>
          <p className="text-szl-text-secondary text-sm font-semibold">
            — {leadership.attribution}
          </p>
        </m.div>
      </div>
    </section>
  );
}
