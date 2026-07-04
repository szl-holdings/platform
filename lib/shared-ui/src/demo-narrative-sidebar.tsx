import { useEffect, useState } from 'react';

export interface DemoNarrativeStep {
  step: string;
  duration?: string;
  narrative: string;
  showIn?: string[];
}

export interface DemoNarrativeSidebarProps {
  title: string;
  scenario: string;
  steps: DemoNarrativeStep[];
  accentColor?: string;
  storageKey?: string;
  defaultOpen?: boolean;
}

const DEFAULT_ACCENT = '#d4a054';

export function DemoNarrativeSidebar({
  title,
  scenario,
  steps,
  accentColor = DEFAULT_ACCENT,
  storageKey = 'szl-demo-narrative',
  defaultOpen = true,
}: DemoNarrativeSidebarProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.open === 'boolean') setOpen(parsed.open);
        if (typeof parsed.activeStep === 'number') {
          setActiveStep(Math.max(0, Math.min(parsed.activeStep, steps.length - 1)));
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, steps.length]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ open, activeStep }));
    } catch {}
  }, [open, activeStep, storageKey]);

  if (!steps || steps.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Open guided demo walkthrough"
        style={{
          position: 'fixed',
          right: '16px',
          bottom: '120px',
          zIndex: 8800,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(10,12,20,0.92)',
          border: `1px solid ${accentColor}66`,
          borderRadius: '999px',
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          color: accentColor,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}
        data-testid="demo-narrative-open"
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
        />
        Guided Walkthrough
      </button>
    );
  }

  const _current = steps[activeStep];

  return (
    <aside
      data-testid="demo-narrative-sidebar"
      style={{
        position: 'fixed',
        right: '16px',
        bottom: '120px',
        zIndex: 8800,
        width: '320px',
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10,12,20,0.96)',
        border: `1px solid ${accentColor}55`,
        borderRadius: '12px',
        boxShadow: '0 20px 56px rgba(0,0,0,0.55)',
        backdropFilter: 'blur(16px)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'rgba(255,255,255,0.85)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            Guided Demo
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.55)',
              marginTop: '4px',
              lineHeight: 1.4,
            }}
          >
            {scenario}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide guided walkthrough"
          style={{
            flex: '0 0 auto',
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '11px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          data-testid="demo-narrative-close"
        >
          ✕
        </button>
      </header>

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '10px 8px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {steps.map((s, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          return (
            <li key={`${s.step}-${idx}`} style={{ marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveStep(idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isActive ? `1px solid ${accentColor}66` : '1px solid transparent',
                  background: isActive ? `${accentColor}14` : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: 'inherit',
                  transition: 'background 0.15s, border 0.15s',
                }}
                data-testid={`demo-narrative-step-${idx}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  style={{
                    flex: '0 0 22px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: `1px solid ${isActive || isDone ? accentColor : 'rgba(255,255,255,0.2)'}`,
                    background: isDone ? accentColor : 'transparent',
                    color: isDone ? '#0a0c10' : isActive ? accentColor : 'rgba(255,255,255,0.5)',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDone ? '✓' : idx + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {s.step}
                  </span>
                  {s.duration && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.55)',
                        marginTop: '2px',
                      }}
                    >
                      {s.duration}
                    </span>
                  )}
                  {isActive && (
                    <span
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '11.5px',
                        lineHeight: 1.5,
                        color: 'rgba(255,255,255,0.78)',
                        fontWeight: 400,
                      }}
                    >
                      {s.narrative}
                    </span>
                  )}
                  {isActive && s.showIn && s.showIn.length > 0 && (
                    <span
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}
                    >
                      {s.showIn.map((loc) => (
                        <span
                          key={loc}
                          style={{
                            fontSize: '9.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.55)',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {loc}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <footer
        style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveStep((i) => Math.max(0, i - 1))}
          disabled={activeStep === 0}
          style={{
            flex: 1,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
            opacity: activeStep === 0 ? 0.4 : 1,
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          data-testid="demo-narrative-prev"
        >
          ← Prev
        </button>
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.6)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {activeStep + 1} / {steps.length}
        </span>
        <button
          type="button"
          onClick={() => setActiveStep((i) => Math.min(steps.length - 1, i + 1))}
          disabled={activeStep === steps.length - 1}
          style={{
            flex: 1,
            padding: '6px 10px',
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}55`,
            borderRadius: '6px',
            cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer',
            opacity: activeStep === steps.length - 1 ? 0.4 : 1,
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          data-testid="demo-narrative-next"
        >
          Next →
        </button>
      </footer>
    </aside>
  );
}
