import i18n, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export type SupportedLocale = "en" | "es";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "es"];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
};

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

export interface I18nConfig {
  namespace: string;
  resources: Record<string, Record<string, unknown>>;
  defaultLocale?: SupportedLocale;
  supportedLocales?: SupportedLocale[];
}

export function createI18n(config: I18nConfig): I18nInstance {
  const {
    namespace,
    resources,
    defaultLocale = "en",
    supportedLocales = SUPPORTED_LOCALES,
  } = config;

  const instance = i18n.createInstance();

  instance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: Object.fromEntries(
        Object.entries(resources).map(([lng, translations]) => [
          lng,
          { [namespace]: translations },
        ])
      ),
      defaultNS: namespace,
      ns: [namespace],
      lng: undefined,
      fallbackLng: defaultLocale,
      supportedLngs: supportedLocales,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["querystring", "cookie", "localStorage", "navigator"],
        lookupQuerystring: "lang",
        lookupCookie: "i18n_lang",
        lookupLocalStorage: "i18n_lang",
        caches: ["localStorage", "cookie"],
      },
    });

  return instance;
}
