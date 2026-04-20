import type { PoolingStrategy } from "./backends/interface.js";

export function applyPooling(
  tokenVectors: number[][],
  strategy: PoolingStrategy,
): number[] {
  if (tokenVectors.length === 0) {
    throw new Error("applyPooling: tokenVectors must not be empty");
  }

  switch (strategy) {
    case "cls":
      return clsPooling(tokenVectors);
    case "mean":
      return meanPooling(tokenVectors);
    case "last_token":
      return lastTokenPooling(tokenVectors);
    default: {
      const exhaustive: never = strategy;
      throw new Error(`applyPooling: unknown pooling strategy '${exhaustive}'`);
    }
  }
}

function clsPooling(tokenVectors: number[][]): number[] {
  const cls = tokenVectors[0];
  if (!cls) {
    throw new Error("clsPooling: no CLS token vector available");
  }
  return cls;
}

function meanPooling(tokenVectors: number[][]): number[] {
  const dim = tokenVectors[0]!.length;
  const sum = new Array<number>(dim).fill(0);

  for (const vec of tokenVectors) {
    if (vec.length !== dim) {
      throw new Error(
        `meanPooling: dimension mismatch — expected ${dim}, got ${vec.length}`,
      );
    }
    for (let i = 0; i < dim; i++) {
      sum[i]! += vec[i]!;
    }
  }

  const n = tokenVectors.length;
  return sum.map((v) => v / n);
}

function lastTokenPooling(tokenVectors: number[][]): number[] {
  const last = tokenVectors[tokenVectors.length - 1];
  if (!last) {
    throw new Error("lastTokenPooling: no last token vector available");
  }
  return last;
}

export function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}
