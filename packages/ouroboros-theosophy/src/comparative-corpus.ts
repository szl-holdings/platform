/**
 * Primitive 50 — Comparative-corpus reading
 *
 * Theosophical Society Object 2: "to encourage the comparative study
 * of religion, philosophy, and science." Operationalised as a
 * triangulation requirement: any factual claim of cross-tradition
 * scope must cite >= 3 independent corpora before being accepted.
 */

export interface CorpusCitation {
  corpusId: string;        // distinct corpus identifier
  reference: string;       // citation string
}

export interface TriangulationReceipt {
  citations: CorpusCitation[];
  distinctCorpora: number;
  required: number;
  passes: boolean;
  rationale: string;
}

export function triangulate(
  citations: CorpusCitation[],
  required = 3,
): TriangulationReceipt {
  const distinct = new Set(citations.map((c) => c.corpusId)).size;
  const passes = distinct >= required;
  return {
    citations,
    distinctCorpora: distinct,
    required,
    passes,
    rationale: passes
      ? `triangulation passes: ${distinct} distinct corpora >= ${required}`
      : `under-triangulated: ${distinct} corpora < ${required} required`,
  };
}
