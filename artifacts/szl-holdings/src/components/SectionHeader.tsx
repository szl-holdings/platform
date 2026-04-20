import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  accentWord?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
  accentWord,
}: SectionHeaderProps) {
  const titleParts = accentWord ? title.split(accentWord) : [title];

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn('mb-12', align === 'center' && 'text-center', className)}
    >
      {eyebrow && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-szl-text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.625rem, 3vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--color-szl-text)',
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
        }}
      >
        {accentWord && titleParts.length === 2 ? (
          <>
            {titleParts[0]}
            <span style={{ color: 'var(--color-szl-accent)' }}>{accentWord}</span>
            {titleParts[1]}
          </>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p
          style={{
            marginTop: '1rem',
            color: 'var(--color-szl-text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.7,
            maxWidth: align === 'center' ? '38rem' : '32rem',
            marginLeft: align === 'center' ? 'auto' : undefined,
            marginRight: align === 'center' ? 'auto' : undefined,
          }}
        >
          {subtitle}
        </p>
      )}
    </m.div>
  );
}
