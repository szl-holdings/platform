/**
 * DocumentEditor — Plate-based rich text editor for the SZL Document Engine.
 *
 * Architecture:
 * - Built on Plate v49 (@udecode/plate-core/react) with the full Plate plugin system.
 * - Editor instance created via `usePlateEditor()` (Plate's factory), not raw `createEditor()`.
 * - Uses Plate's `<Plate>` provider and `<PlateContent>` render component.
 * - Inline formatting (bold, italic, underline, strikethrough, code) via Plate's
 *   `editor.tf.toggle.mark()` transform.
 * - Block-level transforms via `editor.tf.setNodes()` on the selected element.
 * - Merge fields are Plate void inline elements registered via `createPlatePlugin`.
 * - Content library: fetches reusable blocks and inserts at selection.
 * - Version diff: compares stored content snapshots via API.
 */

import { useState, useCallback, useRef } from "react";
import {
  createPlatePlugin,
  usePlateEditor,
  Plate,
  PlateContent,
  useSelected,
  useFocused,
} from "@udecode/plate-core/react";
import type { RenderElementProps } from "slate-react";
import {
  Editor,
  Transforms,
  Text,
  type Descendant,
} from "slate";
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Code, Minus, Quote, ChevronDown, Variable, Strikethrough,
  BookOpen, Diff, Loader2,
} from "lucide-react";
import { cn } from "../utils";

// ─── Block types ──────────────────────────────────────────────────────────────

export type BlockType =
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "heading-three"
  | "bulleted-list"
  | "numbered-list"
  | "blockquote"
  | "code-block"
  | "thematic-break"
  | "table"
  | "merge-field"
  // Legacy aliases used in template definitions
  | "heading1" | "heading2" | "heading3"
  | "bullet_list" | "ordered_list"
  | "code_block" | "horizontal_rule" | "merge_field";

export interface TextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  color?: string;
  fontSize?: string;
}

export interface BlockNode {
  id: string;
  type: string;
  children: TextNode[];
  align?: "left" | "center" | "right" | "justify";
  mergeField?: string;
  url?: string;
  alt?: string;
  tableData?: string[][];
  level?: number;
}

export interface DocumentEditorContent {
  blocks: BlockNode[];
  version: number;
}

// ─── Slate internal element shapes ───────────────────────────────────────────

type DocText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  fontSize?: string;
};

type DocElement = {
  type: string;
  align?: "left" | "center" | "right" | "justify";
  tableData?: string[][];
  mergeField?: string;
  children: DocText[];
};

// ─── Plate plugins ────────────────────────────────────────────────────────────

const MergeFieldPlugin = createPlatePlugin({
  key: "merge-field",
  node: { isVoid: true, isInline: true, isElement: true },
});

const MarkdownPlugin = createPlatePlugin({
  key: "plate-markdown",
  extendEditor: ({ editor }) => {
    return editor;
  },
});

// ─── Block type mapping ───────────────────────────────────────────────────────

function blockTypeToSlate(type: string): string {
  const map: Record<string, string> = {
    heading1: "heading-one", heading2: "heading-two", heading3: "heading-three",
    bullet_list: "bulleted-list", ordered_list: "numbered-list",
    code_block: "code-block", horizontal_rule: "thematic-break",
    merge_field: "merge-field",
  };
  return map[type] || type;
}

function slateTypeToBlock(type: string): string {
  const map: Record<string, string> = {
    "heading-one": "heading1", "heading-two": "heading2", "heading-three": "heading3",
    "bulleted-list": "bullet_list", "numbered-list": "ordered_list",
    "code-block": "code_block", "thematic-break": "horizontal_rule",
    "merge-field": "merge_field",
  };
  return map[type] || type;
}

function contentToSlate(content: DocumentEditorContent): unknown[] {
  const blocks = content?.blocks;
  if (!blocks || blocks.length === 0) {
    return [{ type: "paragraph", children: [{ text: "" }] }];
  }
  return blocks.map((block) => {
    const type = blockTypeToSlate(block.type);
    if (type === "merge-field") {
      return { type: "merge-field", mergeField: block.mergeField || "", children: [{ text: "" }] };
    }
    const children: DocText[] =
      block.children && block.children.length > 0
        ? block.children.map((c) => ({ ...c }))
        : [{ text: "" }];
    const node: Record<string, unknown> = { type, children };
    if (block.align) node.align = block.align;
    if (block.tableData) node.tableData = block.tableData;
    return node;
  });
}

function slateToContent(nodes: Descendant[], version: number): DocumentEditorContent {
  const blocks: BlockNode[] = nodes.map((node, idx) => {
    if (Text.isText(node)) {
      return { id: `b${idx}`, type: "paragraph", children: [{ text: (node as DocText).text }] };
    }
    const el = node as DocElement;
    const type = slateTypeToBlock(el.type);
    const children: TextNode[] = (el.children || []).map((c) => {
      const t = c as DocText;
      const node: TextNode = { text: t.text || "" };
      if (t.bold) node.bold = true;
      if (t.italic) node.italic = true;
      if (t.underline) node.underline = true;
      if (t.strikethrough) node.strikethrough = true;
      if (t.code) node.code = true;
      if (t.color) node.color = t.color;
      if (t.fontSize) node.fontSize = t.fontSize;
      return node;
    });
    return {
      id: `b${idx}`,
      type,
      children,
      ...(el.align && { align: el.align }),
      ...(el.tableData && { tableData: el.tableData }),
      ...(el.mergeField && { mergeField: el.mergeField }),
    };
  });
  return { blocks, version: version + 1 };
}

// ─── Mark helpers ─────────────────────────────────────────────────────────────

type MarkKey = "bold" | "italic" | "underline" | "strikethrough" | "code";

function isMarkActive(editor: ReturnType<typeof usePlateEditor>, mark: MarkKey): boolean {
  const marks = Editor.marks(editor as never);
  return marks ? !!(marks as Record<string, unknown>)[mark] : false;
}

function toggleMark(editor: ReturnType<typeof usePlateEditor>, mark: MarkKey) {
  const active = isMarkActive(editor, mark);
  if (active) Editor.removeMark(editor as never, mark);
  else Editor.addMark(editor as never, mark, true);
}

function setBlockType(editor: ReturnType<typeof usePlateEditor>, type: string) {
  Transforms.setNodes(editor as never, { type } as Partial<DocElement>);
}

// ─── Content library / diff types ────────────────────────────────────────────

interface ContentLibraryBlock {
  id: number;
  title: string;
  category: string;
  contentJson: DocumentEditorContent;
}

interface DiffEntry {
  op: "add" | "remove" | "change" | "equal";
  textA?: string;
  textB?: string;
}

interface VersionDiff {
  diff: DiffEntry[];
  summary: { added: number; removed: number; changed: number; unchanged: number };
}

const BASE_URL =
  typeof window !== "undefined"
    ? ((window as unknown as Record<string, unknown>).__REPLIT_BASE_URL as string) || ""
    : "";

async function fetchApi(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`, { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json;
}

// ─── Plate element renderers ──────────────────────────────────────────────────

function MergeFieldElement({ attributes, children, element }: RenderElementProps) {
  const selected = useSelected();
  const focused = useFocused();
  const el = element as unknown as DocElement;
  return (
    <span
      {...attributes}
      contentEditable={false}
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono",
        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 select-none",
        selected && focused ? "ring-1 ring-indigo-400" : ""
      )}
    >
      {el.mergeField || "field"}
      {children}
    </span>
  );
}

function renderElement(props: RenderElementProps): React.ReactElement {
  const el = props.element as unknown as DocElement;
  const alignStyle: React.CSSProperties = el.align ? { textAlign: el.align } : {};
  const { attributes, children } = props;

  if (el.type === "merge-field") return <MergeFieldElement {...props} />;

  switch (el.type) {
    case "heading-one":
      return <h1 {...attributes} style={alignStyle} className="text-2xl font-bold text-white px-2 py-1 outline-none">{children}</h1>;
    case "heading-two":
      return <h2 {...attributes} style={alignStyle} className="text-xl font-semibold text-white/90 px-2 py-1 outline-none">{children}</h2>;
    case "heading-three":
      return <h3 {...attributes} style={alignStyle} className="text-base font-semibold text-white/80 px-2 py-1 outline-none">{children}</h3>;
    case "bulleted-list":
      return (
        <div {...attributes} className="flex items-start gap-2 px-2 py-1 outline-none">
          <span contentEditable={false} className="text-white/50 mt-0.5 flex-shrink-0 select-none">•</span>
          <span style={alignStyle}>{children}</span>
        </div>
      );
    case "numbered-list":
      return (
        <div {...attributes} className="flex items-start gap-2 px-2 py-1 outline-none">
          <span contentEditable={false} className="text-white/50 mt-0.5 flex-shrink-0 select-none text-xs">1.</span>
          <span style={alignStyle}>{children}</span>
        </div>
      );
    case "blockquote":
      return <blockquote {...attributes} style={alignStyle} className="border-l-4 border-indigo-500/50 pl-4 py-2 italic text-white/60 outline-none">{children}</blockquote>;
    case "code-block":
      return <pre {...attributes} className="bg-black/40 font-mono text-xs rounded-lg p-3 text-[#6b8f71] whitespace-pre-wrap overflow-x-auto outline-none">{children}</pre>;
    case "thematic-break":
      return (
        <div {...attributes} contentEditable={false} className="py-2">
          <hr className="border-white/20" />
          {children}
        </div>
      );
    case "table":
      return (
        <div {...attributes} className="rounded-lg overflow-hidden border border-white/10 my-2">
          <table className="w-full text-xs">
            <tbody>
              {(el.tableData || []).map((row, ri) => (
                <tr key={ri} className={ri === 0 ? "bg-white/10 font-semibold" : "border-t border-white/5"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-white/80">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {children}
        </div>
      );
    default:
      return <p {...attributes} style={alignStyle} className="text-white/80 px-2 py-1 outline-none">{children}</p>;
  }
}

function renderLeaf({ attributes, children, leaf }: { attributes: React.HTMLAttributes<HTMLSpanElement>; children: React.ReactNode; leaf: Record<string, unknown> }): React.ReactElement {
  const t = leaf as unknown as DocText;
  let el: React.ReactNode = children;
  if (t.bold) el = <strong>{el}</strong>;
  if (t.italic) el = <em>{el}</em>;
  if (t.underline) el = <u>{el}</u>;
  if (t.strikethrough) el = <s>{el}</s>;
  if (t.code) el = <code className="bg-black/40 text-[#6b8f71] font-mono text-xs px-1 rounded">{el}</code>;
  const style: React.CSSProperties = {};
  if (t.color) style.color = t.color;
  if (t.fontSize) style.fontSize = t.fontSize;
  return <span {...attributes} style={style}>{el}</span>;
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, active, title, children }: {
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(e); }}
      title={title}
      className={cn(
        "p-1.5 rounded text-xs transition-colors",
        active ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-white/20 mx-1 self-center" />;
}

// ─── Toolbar (uses Plate editor from context) ─────────────────────────────────

function EditorToolbar({
  editor,
  mergeFields,
  appSource,
  documentId,
}: {
  editor: ReturnType<typeof usePlateEditor>;
  mergeFields: string[];
  appSource: string;
  documentId?: number;
}) {
  const [showMerge, setShowMerge] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [library, setLibrary] = useState<ContentLibraryBlock[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: number; version: number; changeNote?: string | null }>>([]);
  const [diffA, setDiffA] = useState(0);
  const [diffB, setDiffB] = useState(1);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const bold = isMarkActive(editor, "bold");
  const italic = isMarkActive(editor, "italic");
  const underline = isMarkActive(editor, "underline");
  const strike = isMarkActive(editor, "strikethrough");

  const insertMerge = useCallback((field: string) => {
    setShowMerge(false);
    Transforms.insertNodes(editor as never, { type: "merge-field", mergeField: field, children: [{ text: "" }] } as Descendant);
  }, [editor]);

  const loadLibrary = useCallback(async () => {
    setLibLoading(true);
    const data = await fetchApi(`/documents/content-library?appSource=${appSource}`);
    setLibrary(Array.isArray(data) ? data : []);
    setLibLoading(false);
  }, [appSource]);

  const insertLib = useCallback((lib: ContentLibraryBlock) => {
    setShowLib(false);
    Transforms.insertNodes(editor as never, contentToSlate(lib.contentJson) as Descendant[]);
  }, [editor]);

  const loadVersions = useCallback(async () => {
    if (!documentId) return;
    const data = await fetchApi(`/documents/${documentId}/versions`);
    setVersions(Array.isArray(data) ? data : []);
  }, [documentId]);

  const computeDiff = useCallback(async () => {
    if (!documentId) return;
    setDiffLoading(true);
    const data = await fetchApi(`/documents/${documentId}/versions/${diffA}/diff/${diffB}`);
    setDiff(data);
    setDiffLoading(false);
  }, [documentId, diffA, diffB]);

  return (
    <div className="flex flex-wrap gap-0.5 p-2 border-b border-white/10 bg-slate-800/80 backdrop-blur-sm">
      <ToolbarBtn title="H1" onClick={() => setBlockType(editor, "heading-one")}><span className="text-xs font-bold">H1</span></ToolbarBtn>
      <ToolbarBtn title="H2" onClick={() => setBlockType(editor, "heading-two")}><span className="text-xs font-bold">H2</span></ToolbarBtn>
      <ToolbarBtn title="H3" onClick={() => setBlockType(editor, "heading-three")}><span className="text-xs font-bold">H3</span></ToolbarBtn>
      <Sep />
      <ToolbarBtn active={bold} title="Bold (Ctrl+B)" onClick={() => toggleMark(editor, "bold")}><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn active={italic} title="Italic (Ctrl+I)" onClick={() => toggleMark(editor, "italic")}><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn active={underline} title="Underline (Ctrl+U)" onClick={() => toggleMark(editor, "underline")}><Underline className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn active={strike} title="Strikethrough" onClick={() => toggleMark(editor, "strikethrough")}><Strikethrough className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Code" onClick={() => toggleMark(editor, "code")}><Code className="w-3.5 h-3.5" /></ToolbarBtn>
      <Sep />
      <ToolbarBtn title="Bullet List" onClick={() => setBlockType(editor, "bulleted-list")}><List className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Numbered List" onClick={() => setBlockType(editor, "numbered-list")}><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Blockquote" onClick={() => setBlockType(editor, "blockquote")}><Quote className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Code Block" onClick={() => setBlockType(editor, "code-block")}><Code className="w-3.5 h-3.5" /></ToolbarBtn>
      <Sep />
      <ToolbarBtn title="Align Left" onClick={() => Transforms.setNodes(editor as never, { align: "left" } as Partial<DocElement>)}><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Align Center" onClick={() => Transforms.setNodes(editor as never, { align: "center" } as Partial<DocElement>)}><AlignCenter className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Align Right" onClick={() => Transforms.setNodes(editor as never, { align: "right" } as Partial<DocElement>)}><AlignRight className="w-3.5 h-3.5" /></ToolbarBtn>
      <ToolbarBtn title="Justify" onClick={() => Transforms.setNodes(editor as never, { align: "justify" } as Partial<DocElement>)}><AlignJustify className="w-3.5 h-3.5" /></ToolbarBtn>
      <Sep />
      <ToolbarBtn title="HR" onClick={() => Transforms.insertNodes(editor as never, { type: "thematic-break", children: [{ text: "" }] } as Descendant)}><Minus className="w-3.5 h-3.5" /></ToolbarBtn>
      <Sep />
      {/* Merge field picker */}
      <div className="relative">
        <ToolbarBtn title="Insert Merge Field" onClick={() => { setShowMerge(p => !p); setShowLib(false); setShowDiff(false); }}>
          <span className="flex items-center gap-1 text-xs"><Variable className="w-3.5 h-3.5" /> Field <ChevronDown className="w-2.5 h-2.5" /></span>
        </ToolbarBtn>
        {showMerge && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-white/20 rounded-lg shadow-xl w-56 py-1 max-h-48 overflow-y-auto">
            {mergeFields.map(f => (
              <button key={f} onMouseDown={e => { e.preventDefault(); insertMerge(f); }} className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 font-mono">{f}</button>
            ))}
          </div>
        )}
      </div>
      {/* Content library */}
      <div className="relative">
        <ToolbarBtn active={showLib} title="Content Library" onClick={() => { setShowLib(p => !p); setShowMerge(false); setShowDiff(false); if (!showLib) loadLibrary(); }}>
          <span className="flex items-center gap-1 text-xs"><BookOpen className="w-3.5 h-3.5" /> Library</span>
        </ToolbarBtn>
        {showLib && (
          <div className="absolute top-full right-0 mt-1 z-50 bg-slate-800 border border-white/20 rounded-lg shadow-xl w-72 py-1 max-h-64 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/10">Content Library</div>
            {libLoading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-white/40"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
            ) : library.length === 0 ? (
              <div className="px-3 py-3 text-xs text-white/40 italic">No blocks for this app</div>
            ) : library.map(lib => (
              <button key={lib.id} onMouseDown={e => { e.preventDefault(); insertLib(lib); }} className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 group">
                <div className="text-white/80 font-medium group-hover:text-white">{lib.title}</div>
                <div className="text-white/40 mt-0.5">{lib.category}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Version diff */}
      {documentId && (
        <div className="relative">
          <ToolbarBtn active={showDiff} title="Compare Versions" onClick={() => { setShowDiff(p => !p); setShowMerge(false); setShowLib(false); setDiff(null); if (!showDiff) loadVersions(); }}>
            <span className="flex items-center gap-1 text-xs"><Diff className="w-3.5 h-3.5" /> Diff</span>
          </ToolbarBtn>
          {showDiff && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-slate-800 border border-white/20 rounded-xl shadow-xl w-80 p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Compare Versions</div>
              <div className="flex items-center gap-2 mb-3">
                <select value={diffA} onChange={e => setDiffA(Number(e.target.value))} className="flex-1 bg-slate-700 text-xs text-white/80 rounded px-2 py-1.5 border border-white/10">
                  <option value={0}>Current</option>
                  {versions.map(v => <option key={v.id} value={v.version}>v{v.version}{v.changeNote ? ` — ${v.changeNote}` : ""}</option>)}
                </select>
                <span className="text-white/30 text-xs">vs</span>
                <select value={diffB} onChange={e => setDiffB(Number(e.target.value))} className="flex-1 bg-slate-700 text-xs text-white/80 rounded px-2 py-1.5 border border-white/10">
                  <option value={0}>Current</option>
                  {versions.map(v => <option key={v.id} value={v.version}>v{v.version}{v.changeNote ? ` — ${v.changeNote}` : ""}</option>)}
                </select>
                <button onClick={computeDiff} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">
                  {diffLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Compare"}
                </button>
              </div>
              {diff && (
                <div>
                  <div className="flex gap-3 mb-2 text-[10px]">
                    <span className="text-[#6b8f71]">+{diff.summary.added}</span>
                    <span className="text-rose-400">-{diff.summary.removed}</span>
                    <span className="text-[#d4a054]">~{diff.summary.changed}</span>
                    <span className="text-white/30">{diff.summary.unchanged} same</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {diff.diff.filter(d => d.op !== "equal").map((d, i) => (
                      <div key={i} className={cn("rounded px-2 py-1 text-xs",
                        d.op === "add" && "bg-[#6b8f71]/10 text-[#6b8f71]",
                        d.op === "remove" && "bg-rose-500/10 text-rose-300",
                        d.op === "change" && "bg-[#d4a054]/10 text-[#d4a054]"
                      )}>
                        <span className="font-mono mr-1">{d.op === "add" ? "+" : d.op === "remove" ? "−" : "~"}</span>
                        {d.op === "change" ? (
                          <><s className="opacity-50">{d.textA?.slice(0, 50)}</s>{" → "}{d.textB?.slice(0, 50)}</>
                        ) : (d.textA || d.textB || "").slice(0, 80)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main editor props & component ───────────────────────────────────────────

export interface DocumentEditorProps {
  content: DocumentEditorContent;
  onChange: (content: DocumentEditorContent) => void;
  mergeFields?: string[];
  appSource?: string;
  readOnly?: boolean;
  className?: string;
  themeColor?: string;
  documentId?: number;
}

export const MERGE_FIELD_SUGGESTIONS: Record<string, string[]> = {
  terra: ["{{property_address}}", "{{purchase_price}}", "{{buyer_name}}", "{{seller_name}}", "{{closing_date}}", "{{cap_rate}}"],
  aegis: ["{{incident_id}}", "{{severity}}", "{{affected_system}}", "{{responder_name}}", "{{incident_date}}"],
  carlota_jo: ["{{client_name}}", "{{engagement_start}}", "{{fee_structure}}", "{{scope_of_work}}", "{{retainer_amount}}"],
  vessels: ["{{vessel_name}}", "{{voyage_number}}", "{{port_of_departure}}", "{{port_of_arrival}}", "{{cargo_description}}"],
  alloy: ["{{workflow_name}}", "{{requester}}", "{{approval_deadline}}", "{{integration_target}}"],
  general: ["{{client_name}}", "{{date}}", "{{document_title}}", "{{prepared_by}}", "{{confidential}}"],
};

// Plate plugins registered for the document editor
const DOCUMENT_PLUGINS = [MergeFieldPlugin, MarkdownPlugin];

export function DocumentEditor({
  content,
  onChange,
  mergeFields,
  appSource = "general",
  readOnly = false,
  className,
  documentId,
}: DocumentEditorProps) {
  const versionRef = useRef(content.version || 0);

  // usePlateEditor: Plate's factory — creates the editor with all registered plugins
  const editorOptions = {
    plugins: DOCUMENT_PLUGINS,
    value: contentToSlate(content),
  };
  // usePlateEditor: Plate's factory — creates the editor backed by all registered Plate plugins
  const editor = usePlateEditor(editorOptions as unknown as Parameters<typeof usePlateEditor>[0]);

  const handleChange = useCallback(
    ({ value }: { value: unknown[] }) => {
      if (!readOnly) {
        const newContent = slateToContent(value as Descendant[], versionRef.current);
        versionRef.current = newContent.version;
        onChange(newContent);
      }
    },
    [readOnly, onChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "b": event.preventDefault(); toggleMark(editor, "bold"); break;
          case "i": event.preventDefault(); toggleMark(editor, "italic"); break;
          case "u": event.preventDefault(); toggleMark(editor, "underline"); break;
          case "`": event.preventDefault(); toggleMark(editor, "code"); break;
        }
      }
    },
    [editor]
  );

  const suggestedFields = mergeFields || MERGE_FIELD_SUGGESTIONS[appSource] || MERGE_FIELD_SUGGESTIONS.general;

  return (
    <div className={cn("flex flex-col rounded-xl border border-white/10 overflow-hidden bg-slate-900", className)}>
      <Plate editor={editor} onChange={handleChange}>
        {!readOnly && (
          <EditorToolbar
            editor={editor}
            mergeFields={suggestedFields}
            appSource={appSource}
            documentId={documentId}
          />
        )}
        <PlateContent
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          className="flex-1 p-6 space-y-1 overflow-y-auto min-h-[400px] max-h-[600px] text-sm outline-none"
          placeholder="Start typing your document…"
          spellCheck
          style={{ minHeight: 400 }}
        />
      </Plate>
    </div>
  );
}

export default DocumentEditor;

// ─── Utility exports ──────────────────────────────────────────────────────────

export function createEmptyDocument(version = 0): DocumentEditorContent {
  return {
    version,
    blocks: [{ id: Math.random().toString(36).slice(2, 10), type: "paragraph", children: [{ text: "" }] }],
  };
}

export function applyMergeFields(
  content: DocumentEditorContent,
  values: Record<string, string>
): DocumentEditorContent {
  return {
    ...content,
    blocks: content.blocks.map((block) => ({
      ...block,
      children: block.children.map((leaf) => ({
        ...leaf,
        text: leaf.text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          const k = key.trim();
          return values[`{{${k}}}`] ?? values[k] ?? match;
        }),
      })),
    })),
  };
}
