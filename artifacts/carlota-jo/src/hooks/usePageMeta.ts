import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
  canonical?: string;
}

export function usePageMeta({ title, description, canonical }: PageMeta) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = descEl?.content ?? '';
    if (description && descEl) {
      descEl.content = description;
    }

    const ogTitleEl = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const prevOgTitle = ogTitleEl?.content ?? '';
    if (ogTitleEl) ogTitleEl.content = title;

    const ogDescEl = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const prevOgDesc = ogDescEl?.content ?? '';
    if (description && ogDescEl) ogDescEl.content = description;

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonicalEl?.href ?? '';
    if (canonical && canonicalEl) canonicalEl.href = canonical;

    return () => {
      document.title = prev;
      if (descEl && prevDesc) descEl.content = prevDesc;
      if (ogTitleEl && prevOgTitle) ogTitleEl.content = prevOgTitle;
      if (ogDescEl && prevOgDesc) ogDescEl.content = prevOgDesc;
      if (canonicalEl && prevCanonical) canonicalEl.href = prevCanonical;
    };
  }, [title, description, canonical]);
}
