/**
 * Adapter — Scene (procedural-kit) → USD stage descriptor.
 *
 * The procedural-kit owns the *authoring* shape (part graph); this
 * file owns the *export* shape. Splitting the two keeps the USD
 * exporter a pure renderer of typed input.
 *
 * Re-expressed from kitbash composition + USD export pattern
 * (docs/research/perception-bio-synthesis-2026.md §5).
 *
 * UV strategy: per-part UV channels are inherited verbatim from
 * `meshRef`. The synthesis doc flagged UV-rebake as an open question;
 * until a part-graph carries a re-bake hint we keep `meshRef` UVs
 * unchanged and document the choice here so future re-bakes are an
 * explicit add, not a silent default.
 */

export interface PartGraphTransform {
  readonly translation: readonly [number, number, number];
  readonly rotation: readonly [number, number, number, number];
  readonly scale: readonly [number, number, number];
}

export interface PartGraphSceneNode {
  readonly partId: string;
  readonly transform: PartGraphTransform;
  readonly slotBindings: Readonly<Record<string, readonly PartGraphSceneNode[]>>;
}

export interface PartGraphScene {
  readonly libraryRef: string;
  readonly root: PartGraphSceneNode;
}

export interface UsdStageDescriptor {
  readonly libraryRef: string;
  readonly rootPrimPath: string;
  readonly prims: readonly UsdPrim[];
  readonly uvStrategy: 'inherit-from-meshref';
}

export interface UsdPrim {
  readonly primPath: string;
  readonly typeName: 'Xform' | 'Mesh';
  readonly meshRef?: string;
  readonly transform: PartGraphTransform;
}

export function fromPartGraph(scene: PartGraphScene, meshRefResolver?: (partId: string) => string | undefined): UsdStageDescriptor {
  const prims: UsdPrim[] = [];
  walk(scene.root, '/world', prims, meshRefResolver);
  return {
    libraryRef: scene.libraryRef,
    rootPrimPath: '/world',
    prims,
    uvStrategy: 'inherit-from-meshref',
  };
}

function walk(
  node: PartGraphSceneNode,
  parentPath: string,
  prims: UsdPrim[],
  meshRefResolver?: (partId: string) => string | undefined,
): void {
  const safePartId = sanitisePrimToken(node.partId);
  const xformPath = `${parentPath}/${safePartId}`;
  prims.push({ primPath: xformPath, typeName: 'Xform', transform: node.transform });
  const meshRef = meshRefResolver?.(node.partId);
  if (meshRef) {
    prims.push({
      primPath: `${xformPath}/Mesh`,
      typeName: 'Mesh',
      meshRef,
      transform: { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    });
  }
  const slotKeys = Object.keys(node.slotBindings).sort();
  for (const slotKey of slotKeys) {
    const slotPath = `${xformPath}/${sanitisePrimToken(slotKey)}`;
    prims.push({
      primPath: slotPath,
      typeName: 'Xform',
      transform: { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    });
    const children = node.slotBindings[slotKey]!;
    for (const child of children) walk(child, slotPath, prims, meshRefResolver);
  }
}

function sanitisePrimToken(s: string): string {
  // USD prim tokens must match [A-Za-z_][A-Za-z0-9_]*.
  let t = s.replace(/[^A-Za-z0-9_]/g, '_');
  if (!/^[A-Za-z_]/.test(t)) t = `_${t}`;
  return t;
}
