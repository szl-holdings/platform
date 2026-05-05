/**
 * Anthropic Citations Support
 *
 * Enables and parses citations in Anthropic model responses.
 * When citations are enabled, Claude grounds its answers in source documents
 * and returns citation references alongside the response text.
 *
 * Use with document blocks (file or text) in the messages array.
 * Citation blocks appear in the response content alongside text blocks.
 */

export interface CitationSource {
  type: 'document' | 'file' | 'url';
  documentId?: string;
  fileId?: string;
  url?: string;
  title?: string;
  startPageNumber?: number;
  endPageNumber?: number;
  startCharIndex?: number;
  endCharIndex?: number;
  quote?: string;
}

export interface Citation {
  type: 'char_location' | 'page_location' | 'content_block_location';
  citedText: string;
  documentIndex?: number;
  documentTitle?: string;
  startCharIndex?: number;
  endCharIndex?: number;
  startPageNumber?: number;
  endPageNumber?: number;
  sources: CitationSource[];
}

export interface TextWithCitations {
  text: string;
  citations: Citation[];
}

export interface CitationsConfig {
  enabled: boolean;
}

export function buildCitationsConfig(): CitationsConfig {
  return { enabled: true };
}

export function buildDocumentBlockWithCitations(
  text: string,
  options?: { title?: string; context?: string },
): Record<string, unknown> {
  return {
    type: 'document',
    source: {
      type: 'text',
      media_type: 'text/plain',
      data: text,
    },
    ...(options?.title ? { title: options.title } : {}),
    ...(options?.context ? { context: options.context } : {}),
    citations: { enabled: true },
  };
}

export function parseCitationBlocks(
  contentBlocks: Array<{ type: string; text?: string; citations?: unknown[] }>,
): TextWithCitations {
  let text = '';
  const citations: Citation[] = [];

  for (const block of contentBlocks) {
    if (block.type === 'text' && block.text) {
      text += block.text;
    }
    if (block.citations && Array.isArray(block.citations)) {
      for (const raw of block.citations) {
        const c = raw as Record<string, unknown>;
        citations.push({
          type: (c['type'] as Citation['type']) ?? 'char_location',
          citedText: (c['cited_text'] as string) ?? '',
          documentIndex: c['document_index'] as number | undefined,
          documentTitle: c['document_title'] as string | undefined,
          startCharIndex: c['start_char_index'] as number | undefined,
          endCharIndex: c['end_char_index'] as number | undefined,
          startPageNumber: c['start_page_number'] as number | undefined,
          endPageNumber: c['end_page_number'] as number | undefined,
          sources: [],
        });
      }
    }
  }

  return { text, citations };
}

export function formatCitationsMarkdown(result: TextWithCitations): string {
  if (result.citations.length === 0) return result.text;

  const citationFootnotes = result.citations
    .map((c, i) =>
      `[${i + 1}] "${c.citedText}"${c.documentTitle ? ` — ${c.documentTitle}` : ''}${c.startPageNumber !== undefined ? ` (p. ${c.startPageNumber})` : ''}`
    )
    .join('\n');

  return `${result.text}\n\n---\n**Citations**\n${citationFootnotes}`;
}
