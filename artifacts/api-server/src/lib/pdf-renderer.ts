/**
 * PDF Renderer — uses @react-pdf/renderer for server-side PDF generation.
 * Converts DocumentEditorContent (block-based JSON) to a styled PDF.
 * Output is a Buffer that can be stored, served, or zipped.
 */
import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import type { BlockNode, DocumentEditorContent, TextNode } from './pdf-renderer-types';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  h1: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    marginTop: 16,
    color: '#111827',
  },
  h2: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    marginTop: 12,
    color: '#1e3a5f',
  },
  h3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    marginTop: 8,
    color: '#374151',
  },
  paragraph: { marginBottom: 6, lineHeight: 1.5 },
  bullet: { marginBottom: 4, lineHeight: 1.4, flexDirection: 'row' },
  bulletMark: { marginRight: 8, color: '#6b7280' },
  bulletContent: { flex: 1 },
  orderedMark: { marginRight: 8, color: '#6b7280', minWidth: 16 },
  blockquote: {
    marginBottom: 6,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    borderLeftStyle: 'solid',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  codeBlock: {
    backgroundColor: '#1e293b',
    color: '#86efac',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'Courier',
    fontSize: 9,
    marginBottom: 8,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    marginVertical: 10,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableCell: { padding: '4 8', flex: 1, fontSize: 9 },
  tableCellHeader: { padding: '4 8', flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  mergeField: { backgroundColor: '#eef2ff', color: '#6366f1', fontFamily: 'Courier', fontSize: 9 },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecoration: 'underline' },
  code: { fontFamily: 'Courier', fontSize: 9, backgroundColor: '#f1f5f9', color: '#0f172a' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
    borderBottomStyle: 'solid',
  },
  headerTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  headerSub: { fontSize: 9, color: '#6b7280', marginTop: 3 },
});

// ─── Text node renderer ───────────────────────────────────────────────────────

function renderTextNode(node: TextNode, key: number): React.ReactElement {
  const text = node.text || '';
  const textProps: Record<string, unknown> = {};
  const styleArr: object[] = [];
  if (node.bold) styleArr.push(styles.bold);
  if (node.italic) styleArr.push(styles.italic);
  if (node.underline) styleArr.push(styles.underline);
  if (node.code) styleArr.push(styles.code);
  if (node.color) styleArr.push({ color: node.color });
  return React.createElement(
    Text,
    { key, style: styleArr.length ? styleArr : undefined } as any,
    text,
  );
}

function renderInline(children: TextNode[]): React.ReactElement {
  if (!children || children.length === 0) {
    return React.createElement(Text, {}, '');
  }
  if (children.length === 1) {
    const node = children[0];
    const styleArr: object[] = [];
    if (node.bold) styleArr.push(styles.bold);
    if (node.italic) styleArr.push(styles.italic);
    if (node.underline) styleArr.push(styles.underline);
    if (node.code) styleArr.push(styles.code);
    if (node.color) styleArr.push({ color: node.color });
    return React.createElement(
      Text,
      { style: styleArr.length ? styleArr : undefined } as any,
      node.text || '',
    );
  }
  return React.createElement(Text, {}, ...children.map(renderTextNode));
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function renderBlock(block: BlockNode, idx: number, orderNum = 1): React.ReactElement {
  const textAlign = (block.align || 'left') as 'left' | 'center' | 'right' | 'justify';

  switch (block.type) {
    case 'heading1':
      return React.createElement(View, { key: idx }, [
        React.createElement(
          Text,
          { key: 0, style: { ...styles.h1, textAlign } },
          block.children.map((c) => c.text).join(''),
        ),
      ]);

    case 'heading2':
      return React.createElement(View, { key: idx }, [
        React.createElement(
          Text,
          { key: 0, style: { ...styles.h2, textAlign } },
          block.children.map((c) => c.text).join(''),
        ),
      ]);

    case 'heading3':
      return React.createElement(View, { key: idx }, [
        React.createElement(
          Text,
          { key: 0, style: { ...styles.h3, textAlign } },
          block.children.map((c) => c.text).join(''),
        ),
      ]);

    case 'bullet_list':
      return React.createElement(View, { key: idx, style: styles.bullet }, [
        React.createElement(Text, { key: 0, style: styles.bulletMark }, '•'),
        React.createElement(View, { key: 1, style: styles.bulletContent }, [
          React.createElement(Text, { key: 0 }, block.children.map((c) => c.text).join('')),
        ]),
      ]);

    case 'ordered_list':
      return React.createElement(View, { key: idx, style: styles.bullet }, [
        React.createElement(Text, { key: 0, style: styles.orderedMark }, `${orderNum}.`),
        React.createElement(View, { key: 1, style: styles.bulletContent }, [
          React.createElement(Text, { key: 0 }, block.children.map((c) => c.text).join('')),
        ]),
      ]);

    case 'blockquote':
      return React.createElement(View, { key: idx, style: styles.blockquote }, [
        React.createElement(Text, { key: 0 }, block.children.map((c) => c.text).join('')),
      ]);

    case 'code_block':
      return React.createElement(View, { key: idx, style: styles.codeBlock }, [
        React.createElement(Text, { key: 0 }, block.children.map((c) => c.text).join('')),
      ]);

    case 'horizontal_rule':
      return React.createElement(View, { key: idx, style: styles.hr });

    case 'table':
      if (!block.tableData || block.tableData.length === 0)
        return React.createElement(View, { key: idx });
      return React.createElement(View, { key: idx }, [
        ...block.tableData.map((row, ri) =>
          React.createElement(
            View,
            { key: ri, style: ri === 0 ? styles.tableHeader : styles.tableRow },
            row.map((cell, ci) =>
              React.createElement(
                Text,
                { key: ci, style: ri === 0 ? styles.tableCellHeader : styles.tableCell },
                cell,
              ),
            ),
          ),
        ),
      ]);

    case 'merge_field':
      return React.createElement(View, { key: idx }, [
        React.createElement(Text, { key: 0, style: styles.mergeField }, block.mergeField || ''),
      ]);

    default:
      return React.createElement(View, { key: idx }, [
        React.createElement(
          Text,
          { key: 0, style: { ...styles.paragraph, textAlign } },
          block.children.map((c) => c.text).join(''),
        ),
      ]);
  }
}

// ─── Document component ───────────────────────────────────────────────────────

function SzlDocument({
  title,
  documentType,
  appSource,
  blocks,
  generatedAt,
  entityData,
}: {
  title: string;
  documentType?: string;
  appSource?: string;
  blocks: BlockNode[];
  generatedAt: string;
  entityData?: Record<string, unknown>;
}): React.ReactElement {
  let orderNum = 1;
  const elements = blocks.map((block, idx) => {
    const el = renderBlock(block, idx, orderNum);
    if (block.type === 'ordered_list') orderNum++;
    else orderNum = 1;
    return el;
  });

  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, title),
        React.createElement(
          Text,
          { style: styles.headerSub },
          `${documentType || 'Document'} · ${appSource || ''} · ${generatedAt}`,
        ),
      ),
      ...elements,
      React.createElement(Text, {
        style: styles.footer,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `${title} · Page ${pageNumber} of ${totalPages} · Generated by SZL Document Engine`,
      }),
    ),
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function renderDocumentToPdfBuffer(params: {
  title: string;
  documentType?: string;
  appSource?: string;
  content: DocumentEditorContent;
  entityData?: Record<string, unknown>;
}): Promise<Buffer> {
  const { title, documentType, appSource, content, entityData } = params;
  const blocks = content?.blocks || [];
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const element = React.createElement(SzlDocument, {
    title,
    documentType,
    appSource,
    blocks,
    generatedAt,
    entityData,
  });

  const buffer = await renderToBuffer(element);
  return buffer;
}

export async function renderEntityDataToPdfBuffer(params: {
  title: string;
  templateId: string;
  entityType: string;
  entityId: string;
  entityData: Record<string, unknown>;
  appSource?: string;
}): Promise<Buffer> {
  const { title, templateId, entityType, entityId, entityData, appSource } = params;
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build simple blocks from entity data
  const blocks: BlockNode[] = [
    { id: 'h1', type: 'heading2', children: [{ text: 'Document Details' }] },
    { id: 'hr', type: 'horizontal_rule', children: [{ text: '' }] },
    ...Object.entries(entityData)
      .filter(([k]) => !k.startsWith('_') && k !== 'id')
      .map(([k, v], i) => ({
        id: `r${i}`,
        type: 'paragraph' as const,
        children: [{ text: `${k}: ${String(v)}`, bold: false }],
      })),
    { id: 'hr2', type: 'horizontal_rule', children: [{ text: '' }] },
    {
      id: 'meta',
      type: 'paragraph',
      children: [
        {
          text: `Template: ${templateId} · Entity: ${entityType}/${entityId} · Source: ${appSource || 'general'}`,
        },
      ],
    },
  ];

  const element = React.createElement(SzlDocument, {
    title,
    documentType: entityType,
    appSource,
    blocks,
    generatedAt,
    entityData,
  });

  return await renderToBuffer(element);
}
