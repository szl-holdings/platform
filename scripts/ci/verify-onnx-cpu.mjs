import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Resolve through the real workspace consumer, not an unrelated global copy.
const workerRequire = createRequire(resolve('workers/alloy-vector-worker/package.json'));
const transformersRequire = createRequire(workerRequire.resolve('@huggingface/transformers'));
const ort = transformersRequire('onnxruntime-node');
assert.ok(
  ort.listSupportedBackends().some((backend) => backend.name === 'cpu' && backend.bundled === true),
);

// Owned minimal ONNX Identity graph. Build its protobuf directly so this smoke
// needs no model download, generation tool, network call, or extra dependency.
function integer(value) {
  const bytes = [];
  do {
    bytes.push((value & 127) | (value > 127 ? 128 : 0));
    value = Math.floor(value / 128);
  } while (value);
  return Buffer.from(bytes);
}
const number = (field, value) => Buffer.concat([integer(field * 8), integer(value)]);
const message = (field, ...parts) => {
  const bytes = Buffer.concat(parts);
  return Buffer.concat([integer(field * 8 + 2), integer(bytes.length), bytes]);
};
const text = (field, value) => message(field, Buffer.from(value));
const tensorType = message(1, number(1, 1), message(2, message(1, number(1, 1))));
const input = message(11, text(1, 'X'), message(2, tensorType));
const output = message(12, text(1, 'Y'), message(2, tensorType));
const graph = message(
  7,
  message(1, text(1, 'X'), text(2, 'Y'), text(4, 'Identity')),
  text(2, 'repro-cpu'),
  input,
  output,
);
const model = Buffer.concat([number(1, 10), graph, message(8, number(2, 13))]);
const session = await ort.InferenceSession.create(model, {
  executionProviders: ['cpu'],
  intraOpNumThreads: 1,
  interOpNumThreads: 1,
});
try {
  const result = await session.run({ X: new ort.Tensor('float32', Float32Array.of(2.25), [1]) });
  assert.deepEqual(Array.from(result.Y.data), [2.25]);
  process.stdout.write(
    `Bundled ONNX CPU inference passed (${ort.env.versions.node}); optional CUDA/TensorRT download is outside this proof.\n`,
  );
} finally {
  await session.release();
}
