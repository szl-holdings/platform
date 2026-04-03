import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  twitterCard?: string;
}

export function usePageMeta({ title, description, canonical, ogImage, twitterCard }: PageMeta) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string | undefined) => {
      if (!value) return undefined;
      const el = document.querySelector<HTMLMetaElement>(selector);
      const prevVal = el?.getAttribute(attr) ?? undefined;
      if (el) el.setAttribute(attr, value);
      return prevVal;
    };

    const prevDesc = setMeta('meta[name="description"]', "content", description);
    const prevOgTitle = setMeta('meta[property="og:title"]', "content", title);
    const prevOgDesc = setMeta('meta[property="og:description"]', "content", description);
    const prevTwTitle = setMeta('meta[name="twitter:title"]', "content", title);
    const prevTwDesc = setMeta('meta[name="twitter:description"]', "content", description);
    const prevOgImage = setMeta('meta[property="og:image"]', "content", ogImage);
    const prevTwImage = setMeta('meta[name="twitter:image"]', "content", ogImage);
    const prevTwCard = setMeta('meta[name="twitter:card"]', "content", twitterCard ?? (ogImage ? "summary_large_image" : undefined));

    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonicalEl?.href ?? "";
    if (canonical && canonicalEl) canonicalEl.href = canonical;

    const prevOgUrl = setMeta('meta[property="og:url"]', "content", canonical);

    return () => {
      document.title = prev;
      const restore = (selector: string, attr: string, val: string | undefined) => {
        if (val === undefined) return;
        const el = document.querySelector<HTMLMetaElement>(selector);
        if (el) el.setAttribute(attr, val);
      };
      restore('meta[name="description"]', "content", prevDesc);
      restore('meta[property="og:title"]', "content", prevOgTitle);
      restore('meta[property="og:description"]', "content", prevOgDesc);
      restore('meta[name="twitter:title"]', "content", prevTwTitle);
      restore('meta[name="twitter:description"]', "content", prevTwDesc);
      restore('meta[property="og:image"]', "content", prevOgImage);
      restore('meta[name="twitter:image"]', "content", prevTwImage);
      restore('meta[name="twitter:card"]', "content", prevTwCard);
      restore('meta[property="og:url"]', "content", prevOgUrl);
      if (canonicalEl && prevCanonical) canonicalEl.href = prevCanonical;
    };
  }, [title, description, canonical, ogImage, twitterCard]);
}
