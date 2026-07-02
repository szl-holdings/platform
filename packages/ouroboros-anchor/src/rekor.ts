/**
 * Sigstore Rekor v1 transparency-log client.
 *
 * Spec: https://github.com/sigstore/rekor/tree/main/openapi.yaml
 *
 * We submit a hashedrekord type entry, which is the simplest payload
 * that anchors a precomputed sha256 root hash. No signing key is required
 * at submission time — the anchor itself is the signature artifact.
 *
 * The integrator is responsible for choosing the rekorUrl and for any
 * authentication their environment requires.
 */

export interface RekorEntry {
  readonly logIndex: number;
  readonly logID: string;
  readonly integratedTime: number;
  readonly uuid: string;
  readonly rawResponse: unknown;
}

export interface RekorSubmitOptions {
  readonly rekorUrl?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

const DEFAULT_REKOR_URL = "https://rekor.sigstore.dev";

function stripTrailingSlashes(u: string): string {
  let end = u.length;
  while (end > 0 && u.charCodeAt(end - 1) === 47 /* "/" */) end--;
  return u.slice(0, end);
}

export async function submitRekorEntry(
  rootHashHex: string,
  signatureBase64: string,
  publicKeyBase64: string,
  options: RekorSubmitOptions = {}
): Promise<RekorEntry> {
  const url = stripTrailingSlashes(options.rekorUrl ?? DEFAULT_REKOR_URL);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("No fetch implementation available; provide options.fetchImpl");

  const body = {
    apiVersion: "0.0.1",
    kind: "hashedrekord",
    spec: {
      data: {
        hash: { algorithm: "sha256", value: rootHashHex },
      },
      signature: {
        content: signatureBase64,
        publicKey: { content: publicKeyBase64 },
      },
    },
  };

  const ctrl = new AbortController();
  const timeout = options.timeoutMs ?? 10_000;
  const timer = setTimeout(() => ctrl.abort(), timeout);

  try {
    const res = await fetchImpl(`${url}/api/v1/log/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Rekor submit failed ${res.status}: ${text.slice(0, 256)}`);
    }
    const json = (await res.json()) as Record<string, unknown>;
    const uuid = Object.keys(json)[0] ?? "";
    const entry = (json[uuid] ?? {}) as Record<string, unknown>;
    return {
      logIndex: Number((entry.logIndex as number | undefined) ?? -1),
      logID: String((entry.logID as string | undefined) ?? ""),
      integratedTime: Number((entry.integratedTime as number | undefined) ?? Date.now() / 1000),
      uuid,
      rawResponse: json,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRekorEntry(
  uuid: string,
  options: RekorSubmitOptions = {}
): Promise<unknown> {
  const url = stripTrailingSlashes(options.rekorUrl ?? DEFAULT_REKOR_URL);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("No fetch implementation available; provide options.fetchImpl");

  const res = await fetchImpl(`${url}/api/v1/log/entries/${encodeURIComponent(uuid)}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Rekor fetch failed ${res.status}: ${text.slice(0, 256)}`);
  }
  return res.json();
}
