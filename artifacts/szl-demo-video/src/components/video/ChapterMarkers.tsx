import { motion } from 'framer-motion';

export interface Chapter {
  index: number;
  title: string;
  subtitle: string;
  startMs: number;
  durationMs: number;
}

interface ChapterMarkersProps {
  chapters: Chapter[];
  currentScene: number;
  totalElapsedMs: number;
  totalDurationMs: number;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export function ChapterMarkers({
  chapters,
  currentScene,
  totalElapsedMs,
  totalDurationMs,
}: ChapterMarkersProps) {
  const progress = Math.min(totalElapsedMs / totalDurationMs, 1);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-1 mb-2">
          {chapters.map((ch, i) => {
            const chProgress = ch.startMs / totalDurationMs;
            const chWidth = ch.durationMs / totalDurationMs;
            const isActive = currentScene === i;
            const isPast = currentScene > i;

            return (
              <div
                key={i}
                className="relative flex-1 group cursor-default"
                style={{ flex: ch.durationMs }}
              >
                <div className="relative h-1 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--color-hero-accent, #00d4ff)'
                        : isPast
                          ? 'rgba(255,255,255,0.5)'
                          : 'transparent',
                    }}
                    animate={{
                      width: isActive
                        ? `${Math.min(((totalElapsedMs - ch.startMs) / ch.durationMs) * 100, 100)}%`
                        : isPast
                          ? '100%'
                          : '0%',
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                <div className="absolute bottom-3 left-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-nowrap border border-white/10">
                    <div className="text-[10px] font-semibold text-white/90">{ch.title}</div>
                    <div className="text-[9px] text-white/50 font-mono">
                      {formatTime(ch.startMs)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2"
          >
            <span className="text-[9px] font-mono text-white/30">
              {currentScene + 1} / {chapters.length}
            </span>
            <span className="text-[10px] font-semibold text-white/70">
              {chapters[currentScene]?.title}
            </span>
            <span className="text-[9px] text-white/40">{chapters[currentScene]?.subtitle}</span>
          </motion.div>
          <span className="text-[9px] font-mono text-white/30">
            {formatTime(totalElapsedMs)} / {formatTime(totalDurationMs)}
          </span>
        </div>
      </div>
    </div>
  );
}
