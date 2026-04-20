import { ParticleField } from '@/components/ParticleField';

interface CommandBackgroundProps {
  variant?: 'default' | 'grid' | 'minimal';
  accentColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function CommandBackground({
  variant = 'default',
  accentColor = '201, 169, 110',
  intensity = 'medium',
}: CommandBackgroundProps) {
  const densityMap = { low: 'sparse', medium: 'normal', high: 'dense' } as const;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 szl-depth-glow-gold" />

      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {variant !== 'minimal' && (
        <ParticleField color={accentColor} density={densityMap[intensity]} className="opacity-60" />
      )}

      {variant === 'grid' && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(214,14%,5%)] to-transparent" />
    </div>
  );
}
