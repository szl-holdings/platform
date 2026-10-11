import {
  createDefaultBackend,
  type EmbeddingBackend,
  type EmbedOutput,
} from '@workspace/alloy-vector-worker';

const embeddingBackend = createDefaultBackend();
let readinessProbe: Promise<boolean> | undefined;

export function getEmbeddingBackend(): EmbeddingBackend {
  return embeddingBackend;
}

function isValidProbe(output: EmbedOutput | undefined): boolean {
  if (
    !output ||
    output.dimensions !== embeddingBackend.dimensions ||
    output.vector.length !== embeddingBackend.dimensions ||
    output.modelRef !== embeddingBackend.modelRef ||
    !output.vector.every(Number.isFinite)
  ) {
    return false;
  }
  const norm = Math.sqrt(output.vector.reduce((sum, value) => sum + value * value, 0));
  return Number.isFinite(norm) && Math.abs(norm - 1) <= 1e-3;
}

export function areAuthoritativeEmbeddingOutputs(
  inputs: ReadonlyArray<{ chunkId: string }>,
  outputs: readonly EmbedOutput[],
): boolean {
  return (
    outputs.length === inputs.length &&
    outputs.every(
      (output, index) => output.chunkId === inputs[index]?.chunkId && isValidProbe(output),
    )
  );
}

export async function verifyEmbeddingBackendReadiness(): Promise<boolean> {
  if (!readinessProbe) {
    readinessProbe = (async () => {
      if (!(await embeddingBackend.isAvailable())) return false;
      const outputs = await embeddingBackend.embed([
        {
          chunkId: 'fabric-readiness-probe',
          text: 'readiness probe',
          modelRef: embeddingBackend.modelRef,
          profileId: 'readiness',
          inputType: 'passage',
        },
      ]);
      return areAuthoritativeEmbeddingOutputs([{ chunkId: 'fabric-readiness-probe' }], outputs);
    })()
      .catch(() => false)
      .finally(() => {
        readinessProbe = undefined;
      });
  }
  return readinessProbe;
}
