import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import manifest from '@/data/slides-manifest.json';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const CHANNEL = 'aegis-deck-sync';
const NOTES_OVERRIDE_KEY = 'aegis-deck-notes-overrides-v1';

type ManifestEntry = {
  id: string;
  position: number;
  title: string;
  description: string;
  speakerNotes: string;
};

const SLIDES: ManifestEntry[] = (manifest as ManifestEntry[])
  .slice()
  .sort((a, b) => a.position - b.position);
const TOTAL = SLIDES.length;

function loadOverrides(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(NOTES_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveOverrides(map: Record<string, string>): void {
  try {
    window.localStorage.setItem(NOTES_OVERRIDE_KEY, JSON.stringify(map));
  } catch {
    /* storage full or disabled */
  }
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function SlideThumb({ position, label }: { position: number; label: string }) {
  const url = `${BASE}/slides/${position}?embed=1`;
  return (
    <div
      style={{
        position: 'relative',
        background: '#000',
        border: '1px solid rgba(12,200,217,0.18)',
        borderRadius: 8,
        overflow: 'hidden',
        aspectRatio: '16 / 9',
        width: '100%',
      }}
    >
      <iframe
        title={label}
        src={url}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          transformOrigin: 'top left',
          transform: 'scale(calc(100% / 1920 * var(--thumb-w, 600)))',
          border: 'none',
          pointerEvents: 'none',
        }}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 10,
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(12,200,217,0.75)',
          background: 'rgba(0,0,0,0.55)',
          padding: '3px 8px',
          borderRadius: 4,
          zIndex: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function PresenterMode() {
  const [current, setCurrent] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const n = parseInt(params.get('slide') ?? '1', 10);
    return Number.isFinite(n) && n >= 1 && n <= TOTAL ? n : 1;
  });
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [running, setRunning] = useState<boolean>(true);
  const [now, setNow] = useState<number>(() => Date.now());
  const [overrides, setOverrides] = useState<Record<string, string>>(() => loadOverrides());
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channelRef.current = channel;
    channel.postMessage({ type: 'presenter:hello' });
    channel.onmessage = (ev) => {
      const data = ev.data ?? {};
      if (data.type === 'audience:current' && typeof data.slide === 'number') {
        setCurrent((c) => (c === data.slide ? c : data.slide));
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    document.title = `Presenter — Slide ${current} / ${TOTAL}`;
  }, [current]);

  const goTo = (n: number) => {
    const clamped = Math.min(Math.max(n, 1), TOTAL);
    setCurrent(clamped);
    channelRef.current?.postMessage({ type: 'presenter:goto', slide: clamped });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(current - 1);
      } else if (e.key === 'Home') {
        goTo(1);
      } else if (e.key === 'End') {
        goTo(TOTAL);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);

  const slide = SLIDES[current - 1];
  const next = SLIDES[current] ?? null;
  const noteId = slide.id;
  const noteValue = overrides[noteId] ?? slide.speakerNotes ?? '';

  const handleNotesChange = (value: string) => {
    setOverrides((prev) => {
      const updated = { ...prev, [noteId]: value };
      saveOverrides(updated);
      return updated;
    });
  };

  const resetNote = () => {
    setOverrides((prev) => {
      const updated = { ...prev };
      delete updated[noteId];
      saveOverrides(updated);
      return updated;
    });
  };

  const elapsed = useMemo(() => formatElapsed(now - startedAt), [now, startedAt]);

  const shellStyle: CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #07080d 0%, #0a1322 100%)',
    color: '#e2e8f0',
    fontFamily: 'Inter, sans-serif',
    padding: '20px 24px',
    boxSizing: 'border-box',
  };

  return (
    <div style={shellStyle}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'rgba(12,200,217,0.7)',
              marginBottom: 4,
            }}
          >
            Presenter Mode · Aegis Investor Deck
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            Slide {current} of {TOTAL} · arrow keys / space to advance · syncs with audience window
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28,
              padding: '6px 14px',
              border: '1px solid rgba(12,200,217,0.35)',
              borderRadius: 8,
              background: 'rgba(12,200,217,0.08)',
              minWidth: 110,
              textAlign: 'center',
            }}
          >
            {elapsed}
          </div>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            style={btnStyle(running ? 'rgba(255,255,255,0.08)' : 'rgba(201,183,135,0.18)')}
          >
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStartedAt(Date.now());
              setNow(Date.now());
            }}
            style={btnStyle('rgba(255,255,255,0.08)')}
          >
            Reset
          </button>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={{ '--thumb-w': 900 } as CSSProperties}>
            <SlideThumb position={current} label={`Now · slide ${current}`} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              alignItems: 'stretch',
            }}
          >
            <div>
              <div style={subheadingStyle}>Title</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginTop: 4 }}>
                {slide.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 6,
                  lineHeight: 1.45,
                }}
              >
                {slide.description}
              </div>
            </div>
            <div>
              <div style={subheadingStyle}>Up next</div>
              {next ? (
                <>
                  <div style={{ marginTop: 4, '--thumb-w': 360 } as CSSProperties}>
                    <SlideThumb position={next.position} label={`Next · slide ${next.position}`} />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      marginTop: 8,
                      fontWeight: 500,
                    }}
                  >
                    {next.title}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    marginTop: 8,
                    padding: 16,
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Last slide. Close with the ask, then stop talking.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 420,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={subheadingStyle}>Speaker notes</div>
            {overrides[noteId] !== undefined && (
              <button type="button" onClick={resetNote} style={linkBtnStyle}>
                Reset to default
              </button>
            )}
          </div>
          <textarea
            value={noteValue}
            onChange={(e) => handleNotesChange(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              marginTop: 8,
              minHeight: 320,
              resize: 'vertical',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: 12,
              color: '#e2e8f0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 13,
              lineHeight: 1.55,
              outline: 'none',
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Edits save to this browser only. Defaults live in{' '}
            <code>artifacts/aegis/src/data/slides-manifest.json</code>.
          </div>
        </aside>
      </div>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current <= 1}
            style={btnStyle('rgba(255,255,255,0.08)', current <= 1)}
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current >= TOTAL}
            style={btnStyle('rgba(12,200,217,0.18)', current >= TOTAL)}
          >
            Next →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SLIDES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.position)}
              title={s.title}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border:
                  s.position === current
                    ? '1px solid rgba(12,200,217,0.7)'
                    : '1px solid rgba(255,255,255,0.12)',
                background:
                  s.position === current ? 'rgba(12,200,217,0.25)' : 'rgba(255,255,255,0.04)',
                color: s.position === current ? '#0cc8d9' : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
              }}
            >
              {s.position}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

function btnStyle(bg: string, disabled = false): CSSProperties {
  return {
    background: bg,
    color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif',
  };
}

const linkBtnStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(12,200,217,0.7)',
  fontSize: 11,
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0,
};

const subheadingStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: 'rgba(255,255,255,0.45)',
};
