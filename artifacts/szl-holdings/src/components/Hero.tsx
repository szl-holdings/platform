import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'wouter';

function HeroMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;
    const draw = () => {
      if (document.hidden) {
        animFrame = requestAnimationFrame(draw);
        return;
      }
      time += 0.002;
      ctx.clearRect(0, 0, w(), h());
      const cols = 50,
        rows = 30;
      const cellW = w() / cols,
        cellH = h() / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const d1 = Math.sqrt((x - w() * 0.7) ** 2 + (y - h() * 0.3) ** 2);
          const d2 = Math.sqrt((x - w() * 0.2) ** 2 + (y - h() * 0.7) ** 2);
          const wave =
            (Math.sin(d1 * 0.008 + time * 1.2) * 0.5 + 0.5) * 0.6 +
            (Math.sin(d2 * 0.006 - time * 0.8) * 0.5 + 0.5) * 0.4;
          ctx.beginPath();
          ctx.arc(x, y, 0.5 + wave * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${0.015 + wave * 0.045})`;
          ctx.fill();
        }
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
    />
  );
}

export function Hero() {
  return (
    <section
      className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24"
      style={{ background: 'hsl(210,12%,5%)', minHeight: 'min(88vh, 820px)' }}
    >
      <HeroMesh />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 70% 30%, hsla(190,60%,25%,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-8">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2 mb-6"
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'hsl(190,90%,55%)',
                  boxShadow: '0 0 8px hsla(190,90%,55%,0.6)',
                }}
              />
              <span
                className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{
                  color: 'hsl(210,5%,50%)',
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
              >
                Lyte + Alloy
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.08] mb-5 tracking-tight"
              style={{
                color: 'hsl(38,12%,94%)',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                maxWidth: '38rem',
              }}
            >
              See the operational risk before it becomes a revenue problem.
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3 }}
              className="text-[15px] sm:text-base leading-relaxed mb-8"
              style={{ color: 'hsl(210,10%,55%)', maxWidth: '36rem' }}
            >
              Lyte + Alloy helps teams surface critical business signals, route action fast, and
              verify follow-through across the workflows that usually break between systems.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start gap-3 mb-10"
            >
              <Link
                href="/design-partners"
                className="group inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold transition-all duration-200"
                style={{
                  color: 'hsl(210,12%,6%)',
                  background: 'hsl(210,8%,88%)',
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'hsl(38,15%,96%)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'hsl(210,8%,88%)';
                }}
              >
                Request a design partner conversation{' '}
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors"
                style={{
                  color: 'hsl(210,5%,50%)',
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,72%)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,50%)';
                }}
              >
                How it works
              </Link>
            </m.div>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-wrap gap-8 sm:gap-10"
            >
              {[
                { value: 'Lyte', label: 'Decision Intelligence' },
                { value: 'Alloy', label: 'Execution Orchestration' },
                { value: 'One', label: 'Unified Operating Layer' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span
                    className="text-xl sm:text-2xl font-bold tabular-nums"
                    style={{
                      color: 'hsl(190,90%,55%)',
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                      letterSpacing: '-0.03em',
                      lineHeight: '1',
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.14em] uppercase mt-1.5 font-semibold"
                    style={{
                      color: 'hsl(210,5%,42%)',
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </m.div>
          </div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="hidden lg:block lg:col-span-4 self-start mt-4"
          >
            <div
              style={{
                background: 'hsla(210,12%,8%,0.8)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                padding: '1.5rem',
                boxShadow: '0 20px 60px hsla(0,0%,0%,0.5), inset 0 1px 0 hsla(0,0%,100%,0.05)',
                backdropFilter: 'blur(16px)',
                borderRadius: '4px',
              }}
            >
              <p
                style={{
                  fontSize: '9.5px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'hsl(210,5%,40%)',
                  marginBottom: '1.25rem',
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
              >
                What breaks between systems
              </p>
              <div className="space-y-2">
                {[
                  { signal: 'Approval stuck 6 days', source: 'Lyte Signal' },
                  { signal: 'No owner on critical path', source: 'Lyte Signal' },
                  { signal: 'Action routed, unverified', source: 'Alloy Engine' },
                  { signal: 'Follow-through confirmed', source: 'Alloy Engine' },
                ].map((item, i) => (
                  <m.div
                    key={item.signal}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '4px',
                      background: 'hsla(0,0%,100%,0.025)',
                      border: '1px solid hsla(0,0%,100%,0.05)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'hsl(210,5%,68%)',
                        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                      }}
                    >
                      {item.signal}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        color: 'hsl(190,90%,52%)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.source}
                    </span>
                  </m.div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.06), transparent)',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
