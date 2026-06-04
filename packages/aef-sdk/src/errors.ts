export class AefError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AefError';
  }
}

export class AefUnavailableError extends AefError {
  constructor(baseUrl: string, cause?: unknown) {
    super(
      `AEF gateway is unreachable at ${baseUrl}. Ensure AEF_GATEWAY_URL is set and the service is running.`,
      'AEF_UNAVAILABLE',
      503,
      false,
    );
    this.name = 'AefUnavailableError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class AefAuthError extends AefError {
  constructor() {
    super(
      'AEF request rejected — invalid or missing bearer token. Set AEF_API_KEY in your environment.',
      'AEF_AUTH_FAILED',
      401,
      false,
    );
    this.name = 'AefAuthError';
  }
}

export class AefPolicyError extends AefError {
  constructor(detail: string) {
    super(`AEF policy guard rejected the request: ${detail}`, 'AEF_POLICY_REJECTED', 403, false);
    this.name = 'AefPolicyError';
  }
}

export class AefTimeoutError extends AefError {
  constructor(endpoint: string, timeoutMs: number) {
    super(`AEF request to ${endpoint} timed out after ${timeoutMs}ms.`, 'AEF_TIMEOUT', 408, true);
    this.name = 'AefTimeoutError';
  }
}

export class AefRateLimitError extends AefError {
  constructor(retryAfterMs?: number) {
    super(
      `AEF rate limit exceeded${retryAfterMs ? ` — retry after ${retryAfterMs}ms` : ''}.`,
      'AEF_RATE_LIMITED',
      429,
      true,
    );
    this.name = 'AefRateLimitError';
  }
}
