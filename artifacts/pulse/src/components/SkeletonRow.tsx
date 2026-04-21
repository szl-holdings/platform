interface SkeletonRowProps {
  height?: number | string;
  width?: number | string;
  style?: React.CSSProperties;
}

export function SkeletonRow({ height = 14, width = '100%', style }: SkeletonRowProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        width,
        borderRadius: 4,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function BriefSkeleton() {
  return (
    <div style={{ padding: '28px 28px 40px' }} aria-label="Loading brief…">
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ borderBottom: '1px solid var(--pulse-border)', paddingBottom: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <SkeletonRow height={10} width={120} />
          <SkeletonRow height={10} width={80} />
        </div>
        <SkeletonRow height={28} width="75%" style={{ marginBottom: 10 }} />
        <SkeletonRow height={14} width="55%" style={{ marginBottom: 6 }} />
        <SkeletonRow height={14} width="45%" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: '14px 20px', borderRadius: 6, border: '1px solid var(--pulse-border)', background: 'var(--pulse-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonRow height={10} width={100} />
                <SkeletonRow height={16} width="70%" />
              </div>
              <SkeletonRow height={24} width={60} style={{ borderRadius: 4, marginLeft: 16 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibrarySkeleton() {
  return (
    <div aria-label="Loading library…" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ padding: '16px 20px', borderRadius: 6, border: '1px solid var(--pulse-border)', background: 'var(--pulse-card)', display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonRow height={10} width={120} />
            <SkeletonRow height={18} width="80%" />
            <SkeletonRow height={12} width="60%" />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <SkeletonRow height={18} width={60} style={{ borderRadius: 12 }} />
              <SkeletonRow height={18} width={70} style={{ borderRadius: 12 }} />
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <SkeletonRow height={22} width={50} style={{ borderRadius: 4 }} />
            <SkeletonRow height={18} width={70} style={{ borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
