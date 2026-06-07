import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { ReactNode, } from 'react';

const BG = 'hsl(214,16%,4%)';
const ACCENT = 'hsl(191,92%,44%)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';

export interface HeroAction {
  label: string;
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  primary?: boolean | undefined;
}

export interface HeroBadge {
  label: string;
  live?: boolean | undefined;
}

export interface HeroProps {
  badge?: HeroBadge;
  eyebrow?: string;
  headline: string;
  subheadline: string;
  body?: string;
  actions?: HeroAction[];
  proof?: ReactNode;
  accentColor?: string;
  backgroundCanvas?: ReactNode;
}

export function Hero({
  badge,
  eyebrow,
  headline,
  subheadline,
  body,
  actions = [],
  proof,
  accentColor = ACCENT,
  backgroundCanvas,
}: HeroProps) {
  return (
    <section
      style={{ background: BG, position: 'relative', overflow: 'hidden' }}
      className="min-h-[88vh] flex flex-col items-center justify-center pt-28 pb-20 px-4 text-center"
    >
      {backgroundCanvas && (
        <div className="absolute inset-0 pointer-events-none">{backgroundCanvas}</div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{
              background: `${accentColor}12`,
              borderColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            {badge.live && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: accentColor }}
              />
            )}
            {badge.label}
          </motion.div>
        )}

        {eyebrow && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: accentColor }}
          >
            {eyebrow}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight"
          style={{ color: TEXT }}
        >
          {headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg sm:text-xl md:text-2xl max-w-2xl leading-relaxed"
          style={{ color: TEXT_SEC }}
        >
          {subheadline}
        </motion.p>

        {body && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-sm max-w-xl leading-relaxed"
            style={{ color: TEXT_SEC }}
          >
            {body}
          </motion.p>
        )}

        {actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center mt-2"
          >
            {actions.map((action, i) =>
              action.primary ? (
                <HeroButtonPrimary key={i} action={action} accentColor={accentColor} />
              ) : (
                <HeroButtonSecondary key={i} action={action} accentColor={accentColor} />
              ),
            )}
          </motion.div>
        )}

        {proof && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 w-full"
          >
            {proof}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function HeroButtonPrimary({ action, accentColor }: { action: HeroAction; accentColor: string }) {
  const el = (
    <button
      onClick={action.onClick}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
      style={{ background: accentColor, color: BG }}
    >
      {action.label}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
  if (action.href) {
    return <a href={action.href}>{el}</a>;
  }
  return el;
}

function HeroButtonSecondary({ action, accentColor }: { action: HeroAction; accentColor: string }) {
  const el = (
    <button
      onClick={action.onClick}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-all duration-200 hover:bg-white/5 active:scale-95"
      style={{ borderColor: `${accentColor}30`, color: TEXT }}
    >
      {action.label}
      <ChevronRight className="w-4 h-4" style={{ color: accentColor }} />
    </button>
  );
  if (action.href) {
    return <a href={action.href}>{el}</a>;
  }
  return el;
}
