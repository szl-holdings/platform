from pathlib import Path
import re


source_path = Path("packages/a11oy-runtime/src/state-native/filesystem-transport.ts")
source = source_path.read_text()

old_import = (
    "import { createHmac, randomUUID } from 'node:crypto';\n"
    "import { link, lstat, mkdir, open, readFile, realpath, rm } from 'node:fs/promises';"
)
new_import = (
    "import { createHmac, randomUUID } from 'node:crypto';\n"
    "import { constants as fsConstants } from 'node:fs';\n"
    "import {\n"
    "  link,\n"
    "  lstat,\n"
    "  mkdir,\n"
    "  open,\n"
    "  realpath,\n"
    "  rm,\n"
    "  unlink,\n"
    "  type FileHandle,\n"
    "} from 'node:fs/promises';"
)
if source.count(old_import) != 1:
    raise SystemExit("filesystem transport import shape changed")
source = source.replace(old_import, new_import)

constant_marker = "const RECORD_OVERHEAD_BYTES = 1024 * 1024;\n"
if source.count(constant_marker) != 1:
    raise SystemExit("record-overhead marker changed")
source = source.replace(
    constant_marker,
    constant_marker + "const READ_CHUNK_BYTES = 64 * 1024;\n",
)

read_method = r'''  async #readBounded(path: string): Promise<string | undefined> {
    const flags = fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0);
    const handle: FileHandle | undefined = await open(path, flags).catch((error: unknown) => {
      if (errorCode(error) === 'ENOENT') return undefined;
      if (errorCode(error) === 'ELOOP') {
        throw new StateNativeError(
          'SIGNATURE_INVALID',
          'Durable state paths must not be symbolic links.',
          { path },
          { cause: error },
        );
      }
      throw error;
    });
    if (!handle) return undefined;

    try {
      const opened = await handle.stat();
      assertStateNative(
        opened.isFile(),
        'SIGNATURE_INVALID',
        'Durable state paths must contain regular files, not links or special files.',
        { path },
      );
      assertStateNative(
        opened.size <= this.#maxRecordBytes,
        'BUDGET_EXCEEDED',
        'Durable state record exceeds the configured read limit.',
        { path, size: opened.size, maxRecordBytes: this.#maxRecordBytes },
      );

      const chunks: Buffer[] = [];
      let byteLength = 0;
      while (true) {
        const capacity = Math.min(
          READ_CHUNK_BYTES,
          this.#maxRecordBytes - byteLength + 1,
        );
        const chunk = Buffer.allocUnsafe(capacity);
        const { bytesRead } = await handle.read(chunk, 0, chunk.byteLength, null);
        if (bytesRead === 0) break;
        byteLength += bytesRead;
        assertStateNative(
          byteLength <= this.#maxRecordBytes,
          'BUDGET_EXCEEDED',
          'Durable state record grew beyond the configured read limit.',
          { path, size: byteLength, maxRecordBytes: this.#maxRecordBytes },
        );
        chunks.push(chunk.subarray(0, bytesRead));
      }

      const afterRead = await handle.stat();
      assertStateNative(
        opened.dev === afterRead.dev &&
          opened.ino === afterRead.ino &&
          opened.size === afterRead.size &&
          opened.mtimeMs === afterRead.mtimeMs,
        'SIGNATURE_INVALID',
        'Durable state record changed while it was read.',
        { path },
      );
      const current = await lstat(path).catch((error: unknown) => {
        throw new StateNativeError(
          'SIGNATURE_INVALID',
          'Durable state path changed while it was read.',
          { path },
          { cause: error },
        );
      });
      assertStateNative(
        current.isFile() &&
          !current.isSymbolicLink() &&
          current.dev === afterRead.dev &&
          current.ino === afterRead.ino,
        'SIGNATURE_INVALID',
        'Durable state path no longer identifies the opened record.',
        { path },
      );
      return Buffer.concat(chunks, byteLength).toString('utf8');
    } finally {
      await handle.close();
    }
  }'''
source, read_count = re.subn(
    r"  async #readBounded\(path: string\): Promise<string \| undefined> \{.*?\n  \}\n\n  async #readRecord",
    read_method + "\n\n  async #readRecord",
    source,
    count=1,
    flags=re.S,
)
if read_count != 1:
    raise SystemExit(f"expected one readBounded replacement, found {read_count}")

remove_method = r'''  async #removeObjectFile(capsuleId: string): Promise<void> {
    const path = this.#objectPath(capsuleId);
    try {
      await unlink(path);
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return;
      throw new StateNativeError(
        'RECEIPT_WRITE_FAILED',
        'Durable state object entry could not be unlinked.',
        { path },
        { cause: error },
      );
    }
    await this.#syncDirectory(dirname(path));
  }'''
source, remove_count = re.subn(
    r"  async #removeObjectFile\(capsuleId: string\): Promise<void> \{.*?\n  \}\n\n  async #syncDirectory",
    remove_method + "\n\n  async #syncDirectory",
    source,
    count=1,
    flags=re.S,
)
if remove_count != 1:
    raise SystemExit(f"expected one removeObjectFile replacement, found {remove_count}")
source_path.write_text(source)


test_path = Path("packages/a11oy-runtime/test/state-native-filesystem-transport.test.mjs")
tests = test_path.read_text()
old_test_import = (
    "import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } "
    "from 'node:fs/promises';"
)
new_test_import = (
    "import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } "
    "from 'node:fs/promises';"
)
if tests.count(old_test_import) != 1:
    raise SystemExit("filesystem test import shape changed")
tests = tests.replace(old_test_import, new_test_import)

test_marker = "\ntest(\n  'filesystem links cannot redirect state records or shard directories',"
test_addition = r'''

test(
  'terminal deletion unlinks only the canonical directory entry',
  { skip: process.platform === 'win32' },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'szl-state-'));
    const object = portableObject('unlink safety');
    try {
      const adapter = new FileSystemStateTransportAdapter({
        rootDirectory: root,
        masterKey: randomBytes(32),
      });
      await adapter.put(object);
      await adapter.delete(object.capsule.capsuleId);

      const recordPath = storagePath(root, object.capsule.capsuleId);
      const outsideRecord = join(root, 'outside-must-survive.json');
      await mkdir(dirname(recordPath), { recursive: true });
      await writeFile(outsideRecord, 'outside survives\n', 'utf8');
      await symlink(outsideRecord, recordPath);

      await adapter.delete(object.capsule.capsuleId);
      assert.equal(await readFile(outsideRecord, 'utf8'), 'outside survives\n');
      await assert.rejects(
        lstat(recordPath),
        (error) => error && typeof error === 'object' && error.code === 'ENOENT',
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
'''
if tests.count(test_marker) != 1:
    raise SystemExit("filesystem link-test marker changed")
test_path.write_text(tests.replace(test_marker, test_addition + test_marker))


proof_path = Path("audit/frontier/ALLOY_DURABLE_STATE_TRANSPORT_PROOF_2026-08-17.md")
proof = proof_path.read_text()
proof_marker = "- link and special-file rejection for records and every created shard component;"
proof_replacement = (
    "- descriptor-bound, bounded no-follow reads with post-read path identity checks;\n"
    "- link and special-file rejection for records and every created shard component;\n"
    "- direct unlink cleanup that removes a replaced link entry without following its target;"
)
if proof.count(proof_marker) != 1:
    raise SystemExit("proof hardening marker changed")
proof_path.write_text(proof.replace(proof_marker, proof_replacement))


architecture_path = Path("docs/architecture/alloy-state-native-runtime.md")
architecture = architecture_path.read_text()
architecture_marker = "- bounded payload and record sizes;"
if architecture.count(architecture_marker) != 1:
    raise SystemExit("architecture hardening marker changed")
architecture_path.write_text(
    architecture.replace(
        architecture_marker,
        architecture_marker
        + "\n- descriptor-bound no-follow reads with post-read path identity verification;",
    )
)
