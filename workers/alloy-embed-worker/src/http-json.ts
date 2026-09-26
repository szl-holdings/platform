export class UpstreamProtocolError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'UpstreamProtocolError';
  }
}

/** Read and parse a bounded JSON response without echoing an upstream body. */
export async function readBoundedJson(response: Response, maxResponseBytes: number): Promise<unknown> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength) {
    const parsed = Number(declaredLength);
    if (Number.isFinite(parsed) && parsed > maxResponseBytes) {
      throw new UpstreamProtocolError(
        'UPSTREAM_RESPONSE_TOO_LARGE',
        `Upstream response exceeds ${maxResponseBytes} bytes`,
        response.status,
      );
    }
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxResponseBytes) {
    throw new UpstreamProtocolError(
      'UPSTREAM_RESPONSE_TOO_LARGE',
      `Upstream response exceeds ${maxResponseBytes} bytes`,
      response.status,
    );
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new UpstreamProtocolError(
      'UPSTREAM_INVALID_JSON',
      'Upstream returned invalid JSON',
      response.status,
    );
  }
}

export function sanitizedTransportMessage(error: unknown): string {
  if (error instanceof UpstreamProtocolError) return `${error.code}: ${error.message}`;
  if (error instanceof Error && error.name === 'TimeoutError') return 'UPSTREAM_TIMEOUT';
  if (error instanceof Error && error.name === 'AbortError') return 'UPSTREAM_TIMEOUT';
  return 'UPSTREAM_NETWORK_ERROR';
}
