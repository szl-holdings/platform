import type { SupportedLocale } from '@szl-holdings/shared-ui/language-switcher';
import { useTranslation } from 'react-i18next';

export function useLocale(): SupportedLocale {
  const { i18n } = useTranslation();
  const lng = i18n.language?.split('-')[0];
  return (lng === 'es' ? 'es' : 'en') as SupportedLocale;
}

export function useFormatDate() {
  const locale = useLocale();
  return (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const bcp47 = locale === 'es' ? 'es-ES' : 'en-US';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(bcp47, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(d);
  };
}

export function useFormatNumber() {
  const locale = useLocale();
  return (value: number, options?: Intl.NumberFormatOptions) => {
    const bcp47 = locale === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(bcp47, options).format(value);
  };
}

export function useFormatCurrency() {
  const locale = useLocale();
  return (value: number, currency: string = 'USD') => {
    const bcp47 = locale === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(bcp47, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
}
