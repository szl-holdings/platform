import { createHash } from 'node:crypto';
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
} from 'node:fs/promises';
import path from 'node:path';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

export function requireOutputDirectory(
  repositoryRoot,
  requested = process.env.PROOF_OUTPUT_DIR?.trim() || 'artifacts/series-a-screenshot-proof',
) {
  const outputDirectory = path.resolve(repositoryRoot, requested);
  const relative = path.relative(repositoryRoot, outputDirectory);
  const portableRelative = relative.replaceAll(path.sep, '/');
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error('PROOF_OUTPUT_DIR must stay within the repository');
  }
  if (
    !/^artifacts\/[A-Za-z0-9._-]+$/.test(portableRelative) &&
    !/^docs\/assets\/screenshots\/[A-Za-z0-9._-]+$/.test(portableRelative)
  ) {
    throw new Error(
      'PROOF_OUTPUT_DIR must be one direct evidence directory under artifacts/ or docs/assets/screenshots/',
    );
  }
  return outputDirectory;
}

export async function requirePathAbsent(targetPath) {
  try {
    await lstat(targetPath);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`proof output already exists and will not be replaced: ${targetPath}`);
}

export async function publishCaptureDirectory(
  repositoryRoot,
  captureDirectory,
  outputDirectory,
  options = {},
) {
  const relativeOutput = path.relative(repositoryRoot, outputDirectory);
  const validatedOutput = requireOutputDirectory(repositoryRoot, relativeOutput);
  if (validatedOutput !== path.resolve(outputDirectory)) {
    throw new Error('proof output did not match the validated repository destination');
  }

  await requirePathAbsent(outputDirectory);
  const outputParent = path.dirname(outputDirectory);
  await mkdir(outputParent, { recursive: true });

  const repositoryRealPath = await realpath(repositoryRoot);
  const parentRealPath = await realpath(outputParent);
  const realParentRelative = path.relative(repositoryRealPath, parentRealPath);
  if (
    !realParentRelative ||
    realParentRelative === '..' ||
    realParentRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realParentRelative)
  ) {
    throw new Error('proof output parent resolved outside the repository');
  }

  const copy = options.copyFile ?? copyFile;
  const stagingDirectory = await mkdtemp(
    path.join(outputParent, `.${path.basename(outputDirectory)}-staging-`),
  );
  try {
    const entries = await readdir(captureDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        throw new Error(`capture publication only accepts regular files: ${entry.name}`);
      }
      const sourcePath = path.join(captureDirectory, entry.name);
      const stagedPath = path.join(stagingDirectory, entry.name);
      await copy(sourcePath, stagedPath);
      const [sourceBytes, stagedBytes] = await Promise.all([
        readFile(sourcePath),
        readFile(stagedPath),
      ]);
      if (
        sourceBytes.byteLength !== stagedBytes.byteLength ||
        sha256(sourceBytes) !== sha256(stagedBytes)
      ) {
        throw new Error(`capture publication digest mismatch: ${entry.name}`);
      }
    }
    await requirePathAbsent(outputDirectory);
    await rename(stagingDirectory, outputDirectory);
  } catch (error) {
    await rm(stagingDirectory, { force: true, recursive: true });
    throw error;
  }
}

export async function installCaptureNetworkPolicy(context, allowedOrigin) {
  if (typeof context.route !== 'function' || typeof context.routeWebSocket !== 'function') {
    throw new Error('capture context must support HTTP and WebSocket routing');
  }
  const normalizedAllowedOrigin = new URL(allowedOrigin).origin;
  const state = {
    blockedNetworkRequests: [],
    stubbedFontRequests: [],
    webSocketRequests: [],
  };

  await context.route('**/*', async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    if (requestUrl.origin === normalizedAllowedOrigin) {
      await route.continue();
      return;
    }
    if (requestUrl.origin === 'https://fonts.googleapis.com') {
      state.stubbedFontRequests.push(`${request.method()} ${requestUrl.href}`);
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return;
    }
    if (requestUrl.origin === 'https://fonts.gstatic.com') {
      state.stubbedFontRequests.push(`${request.method()} ${requestUrl.href}`);
      await route.abort('blockedbyclient');
      return;
    }
    state.blockedNetworkRequests.push(`${request.method()} ${requestUrl.href}`);
    await route.abort('blockedbyclient');
  });

  await context.routeWebSocket(/.*/, async (webSocketRoute) => {
    state.webSocketRequests.push(webSocketRoute.url());
    await webSocketRoute.close({
      code: 1008,
      reason: 'Exact-source evidence capture forbids WebSocket connections',
    });
  });

  return state;
}
