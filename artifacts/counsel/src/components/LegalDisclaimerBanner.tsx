import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const SESSION_KEY = 'counsel_disclaimer_dismissed';

export function LegalDisclaimerBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="flex items-start gap-3 px-4 py-2.5 border-b"
      style={{
        background: 'rgba(139,92,246,0.06)',
        borderColor: 'rgba(139,92,246,0.18)',
      }}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
      <p className="flex-1 text-[11px] text-violet-200/70 leading-relaxed">
        <span className="font-semibold text-violet-100/90">Informational only.</span>{' '}
        This surface is for informational purposes only. It does not constitute legal advice.
        Consult qualified legal counsel for advice on any legal matter.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss disclaimer"
        className="shrink-0 text-violet-400/40 hover:text-violet-300/70 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
