/**
 * Minimal RSS / Atom parser. We intentionally avoid pulling a heavyweight
 * dependency for what is essentially regex over an XML feed. This is enough
 * for blog/release-notes/changelog feeds — title, link, pubDate, and a
 * trimmed description.
 */

export interface RssItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

const ITEM_RE = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;

function tag(block: string, name: string): string | undefined {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i');
  const m = block.match(re);
  if (!m) return undefined;
  return cleanCdata(m[1]).trim();
}

function attr(block: string, name: string, attrName: string): string | undefined {
  const re = new RegExp(`<${name}\\b[^>]*\\b${attrName}=["']([^"']+)["']`, 'i');
  const m = block.match(re);
  return m ? m[1] : undefined;
}

function cleanCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  let m: RegExpExecArray | null;
  ITEM_RE.lastIndex = 0;
  while ((m = ITEM_RE.exec(xml)) !== null) {
    const block = m[1];
    const title = tag(block, 'title') ?? '';
    const link = tag(block, 'link') ?? attr(block, 'link', 'href') ?? '';
    const description = tag(block, 'description') ?? tag(block, 'summary') ?? tag(block, 'content');
    const pubDate = tag(block, 'pubDate') ?? tag(block, 'updated') ?? tag(block, 'published');
    const guid = tag(block, 'guid') ?? tag(block, 'id') ?? link;
    if (title && link) items.push({ title, link, description, pubDate, guid });
  }
  return items;
}
