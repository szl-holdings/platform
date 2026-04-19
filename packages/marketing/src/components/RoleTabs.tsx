import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const BG = "hsl(214,16%,4%)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const BORDER = "hsla(0,0%,100%,0.07)";
const TEXT = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";

export interface RoleTab {
  id: string;
  label: string;
  icon: LucideIcon;
  headline: string;
  body: string;
  proofPoints: string[];
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
}

export interface RoleTabsProps {
  headline?: string;
  subheadline?: string;
  tabs: RoleTab[];
  accentColor?: string;
  onTabSwitch?: (roleId: string) => void;
}

export function RoleTabs({
  headline = "Built for every stakeholder.",
  subheadline = "The same governed loop — different signal surfaces for different roles.",
  tabs,
  accentColor = "hsl(191,92%,44%)",
  onTabSwitch,
}: RoleTabsProps) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  const handleSwitch = (i: number) => {
    setActive(i);
    onTabSwitch?.(tabs[i]?.id ?? "");
  };

  return (
    <section style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            {headline}
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_SEC }}>
            {subheadline}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const isActive = i === active;
            return (
              <button
                key={t.id}
                onClick={() => handleSwitch(i)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: isActive ? accentColor : SURFACE,
                  color: isActive ? BG : TEXT_SEC,
                  border: `1px solid ${isActive ? accentColor : BORDER}`,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-8 md:p-10"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
                    >
                      <tab.icon className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
                      {tab.label}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: TEXT }}>
                    {tab.headline}
                  </h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                    {tab.body}
                  </p>

                  {tab.ctaLabel && (
                    tab.ctaHref ? (
                      <a
                        href={tab.ctaHref}
                        onClick={tab.onCta}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                        style={{ background: accentColor, color: BG }}
                      >
                        {tab.ctaLabel}
                      </a>
                    ) : (
                      <button
                        onClick={tab.onCta}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                        style={{ background: accentColor, color: BG }}
                      >
                        {tab.ctaLabel}
                      </button>
                    )
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: TEXT_SEC }}>
                    Key outcomes
                  </p>
                  <div className="flex flex-col gap-3">
                    {tab.proofPoints.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{ background: `${accentColor}06`, border: `1px solid ${accentColor}15` }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${accentColor}20` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                        </div>
                        <p className="text-sm" style={{ color: TEXT }}>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
