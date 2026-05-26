/**
 * PageIndex doc-tree retrieval over the payload bundle.
 *
 * Source: VectifyAI / PageIndex (Synthesis dossier row 9, Anatomy(ops)
 * primitive).
 *
 * Builds a hierarchical, path-addressable index over arbitrary JSON-shaped
 * payload documents. Operators / agents can then resolve "doc paths" like
 *
 *     doctrine/lambda_conjunctive_floor
 *     thesis/TH8-GLR/theorems/8
 *     org_summary/hygiene_gaps
 *
 * back to their concrete value and to a stable breadcrumb chain — the
 * dossier's "doc-tree retrieval" primitive.
 *
 * Browser-safe: takes any plain-JSON value as input. The server-side wrapper
 * in `@szl-holdings/payload/server` is not required.
 */

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [k: string]: JsonValue };

export type NodeKind = 'object' | 'array' | 'leaf';

export interface PageIndexNode {
  readonly path: string;                 // "/"-separated, leading slash omitted
  readonly key: string;                  // last path segment ("" at root)
  readonly kind: NodeKind;
  readonly depth: number;
  readonly childKeys: ReadonlyArray<string>;
  readonly leafType?: 'string' | 'number' | 'boolean' | 'null';
}

export interface PageIndex {
  readonly nodes: ReadonlyMap<string, PageIndexNode>;
  /** Get the raw value at `path`, or `undefined` if the path is missing. */
  readonly lookup: (path: string) => JsonValue | undefined;
  /** Ordered breadcrumb from the root to `path` (inclusive). */
  readonly breadcrumb: (path: string) => ReadonlyArray<PageIndexNode>;
  /** Recursive search by case-insensitive substring against the path. */
  readonly search: (query: string, limit?: number) => ReadonlyArray<PageIndexNode>;
}

const PATH_SEP = '/' as const;

function leafType(v: JsonValue): 'string' | 'number' | 'boolean' | 'null' {
  if (v === null) return 'null';
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  throw new Error(`buildPageIndex: unsupported leaf type ${t}`);
}

function joinPath(parent: string, key: string): string {
  return parent === '' ? key : `${parent}${PATH_SEP}${key}`;
}

/**
 * Build a PageIndex over `root`. Arrays are indexed by stringified integer
 * keys (`"0"`, `"1"`, …), matching the JSON-Pointer convention.
 */
export function buildPageIndex(root: JsonValue): PageIndex {
  const nodes = new Map<string, PageIndexNode>();

  function visit(value: JsonValue, path: string, key: string, depth: number): void {
    if (value !== null && typeof value === 'object') {
      const isArray = Array.isArray(value);
      const entries: Array<[string, JsonValue]> = isArray
        ? (value as readonly JsonValue[]).map((v, i) => [String(i), v])
        : Object.entries(value as { readonly [k: string]: JsonValue });
      const childKeys = entries.map(([k]) => k);
      nodes.set(path, {
        path,
        key,
        kind: isArray ? 'array' : 'object',
        depth,
        childKeys,
      });
      for (const [k, v] of entries) {
        visit(v, joinPath(path, k), k, depth + 1);
      }
      return;
    }
    nodes.set(path, {
      path,
      key,
      kind: 'leaf',
      depth,
      childKeys: [],
      leafType: leafType(value),
    });
  }

  visit(root, '', '', 0);

  function lookup(path: string): JsonValue | undefined {
    if (path === '' || path === PATH_SEP) return root;
    const parts = path.replace(/^\/+/, '').split(PATH_SEP);
    let cur: JsonValue = root;
    for (const p of parts) {
      if (cur === null || typeof cur !== 'object') return undefined;
      if (Array.isArray(cur)) {
        const i = Number(p);
        if (!Number.isInteger(i) || i < 0 || i >= cur.length) return undefined;
        cur = cur[i]!;
      } else {
        const rec = cur as { readonly [k: string]: JsonValue };
        if (!Object.prototype.hasOwnProperty.call(rec, p)) return undefined;
        cur = rec[p]!;
      }
    }
    return cur;
  }

  function breadcrumb(path: string): ReadonlyArray<PageIndexNode> {
    const norm = path.replace(/^\/+/, '');
    if (!nodes.has(norm) && norm !== '') return [];
    const parts = norm === '' ? [] : norm.split(PATH_SEP);
    const out: PageIndexNode[] = [];
    const root0 = nodes.get('');
    if (root0) out.push(root0);
    let acc = '';
    for (const p of parts) {
      acc = joinPath(acc, p);
      const n = nodes.get(acc);
      if (n) out.push(n);
    }
    return out;
  }

  function search(query: string, limit = 20): ReadonlyArray<PageIndexNode> {
    if (query === '') return [];
    const q = query.toLowerCase();
    const hits: PageIndexNode[] = [];
    for (const n of nodes.values()) {
      if (n.path.toLowerCase().includes(q)) {
        hits.push(n);
        if (hits.length >= limit) break;
      }
    }
    return hits;
  }

  return { nodes, lookup, breadcrumb, search };
}
