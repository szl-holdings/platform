import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type SupportedLocale = 'en' | 'es';

export interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  supportedLocales?: SupportedLocale[];
  variant?: 'light' | 'dark' | 'gold';
  className?: string;
}

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
};

const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
};

export function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  supportedLocales = ['en', 'es'],
  variant = 'light',
  className = '',
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const styles = {
    light: {
      button:
        'text-[#6b6259] hover:text-[#1a1614] border border-[#d4ccc2] bg-transparent hover:border-[#9a9086]',
      buttonStyle: undefined as React.CSSProperties | undefined,
      dropdown: 'bg-white border border-[#e8e2da] shadow-sm',
      item: 'text-[#6b6259] hover:bg-[#f5f0e8] hover:text-[#1a1614]',
      itemStyle: undefined as React.CSSProperties | undefined,
      activeItem: 'text-[#1a1614] bg-[#f5f0e8]',
      activeItemStyle: undefined as React.CSSProperties | undefined,
    },
    dark: {
      button:
        'border border-[rgba(245,240,232,0.1)] bg-transparent hover:border-[rgba(245,240,232,0.25)]',
      buttonStyle: { color: 'rgba(245,240,232,0.85)' } as React.CSSProperties,
      dropdown: 'bg-[#12141a] border border-[rgba(245,240,232,0.1)] shadow-lg',
      item: 'hover:bg-[rgba(245,240,232,0.06)]',
      itemStyle: { color: 'rgba(245,240,232,0.7)' } as React.CSSProperties,
      activeItem: 'bg-[rgba(245,240,232,0.06)]',
      activeItemStyle: { color: 'rgba(245,240,232,0.92)' } as React.CSSProperties,
    },
    gold: {
      button:
        'border border-[rgba(196,170,126,0.25)] bg-transparent hover:border-[rgba(196,170,126,0.45)]',
      buttonStyle: { color: 'rgba(196,170,126,0.9)' } as React.CSSProperties,
      dropdown: 'bg-[#1a1714] border border-[rgba(196,170,126,0.12)] shadow-lg',
      item: 'hover:bg-[rgba(196,170,126,0.06)]',
      itemStyle: { color: 'rgba(196,170,126,0.85)' } as React.CSSProperties,
      activeItem: 'bg-[rgba(196,170,126,0.06)]',
      activeItemStyle: { color: 'rgba(196,170,126,0.95)' } as React.CSSProperties,
    },
  };

  const s = styles[variant];

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium tracking-[0.08em] uppercase transition-all duration-200 ${s.button}`}
        style={s.buttonStyle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <span aria-hidden="true">{LOCALE_FLAGS[currentLocale]}</span>
        <span>{LOCALE_LABELS[currentLocale]}</span>
        <ChevronDown
          size={10}
          strokeWidth={2}
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          className={`absolute end-0 top-full mt-1 min-w-[130px] z-50 ${s.dropdown}`}
          role="listbox"
          aria-label="Language options"
        >
          {supportedLocales.map((locale) => (
            <button
              key={locale}
              role="option"
              aria-selected={locale === currentLocale}
              onClick={() => {
                onLocaleChange(locale);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-150 ${
                locale === currentLocale ? s.activeItem : s.item
              }`}
              style={locale === currentLocale ? s.activeItemStyle : s.itemStyle}
            >
              <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
              <span>{LOCALE_LABELS[locale]}</span>
              {locale === currentLocale && <span className="ms-auto text-[8px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
