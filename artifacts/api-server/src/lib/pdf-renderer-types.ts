export interface TextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  fontSize?: string;
}

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bullet_list"
  | "ordered_list"
  | "blockquote"
  | "code_block"
  | "horizontal_rule"
  | "table"
  | "image"
  | "merge_field";

export interface BlockNode {
  id: string;
  type: BlockType;
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
