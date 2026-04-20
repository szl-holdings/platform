import { createElement, type ReactElement } from "react";
import { Helmet } from "react-helmet-async";

interface PageMeta {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  twitterCard?: string;
}

export function usePageMeta({
  title,
  description,
  canonical,
  ogImage,
  twitterCard,
}: PageMeta): ReactElement {
  const card = twitterCard ?? (ogImage ? "summary_large_image" : undefined);
  const children: ReactElement[] = [
    createElement("title", { key: "title" }, title),
    createElement("meta", { key: "og:title", property: "og:title", content: title }),
    createElement("meta", { key: "twitter:title", name: "twitter:title", content: title }),
  ];
  if (description) {
    children.push(
      createElement("meta", { key: "description", name: "description", content: description }),
      createElement("meta", { key: "og:description", property: "og:description", content: description }),
      createElement("meta", { key: "twitter:description", name: "twitter:description", content: description }),
    );
  }
  if (canonical) {
    children.push(
      createElement("link", { key: "canonical", rel: "canonical", href: canonical }),
      createElement("meta", { key: "og:url", property: "og:url", content: canonical }),
    );
  }
  if (ogImage) {
    children.push(
      createElement("meta", { key: "og:image", property: "og:image", content: ogImage }),
      createElement("meta", { key: "twitter:image", name: "twitter:image", content: ogImage }),
    );
  }
  if (card) {
    children.push(createElement("meta", { key: "twitter:card", name: "twitter:card", content: card }));
  }
  return createElement(Helmet, null, ...children);
}
