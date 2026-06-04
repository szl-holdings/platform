export class SZLApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(message: string, status: number, code: string, requestId?: string) {
    super(message);
    this.name = 'SZLApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export class SZLAuthError extends SZLApiError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'SZLAuthError';
  }
}

export class SZLNotFoundError extends SZLApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'SZLNotFoundError';
  }
}

export class SZLRateLimitError extends SZLApiError {
  readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMITED');
    this.name = 'SZLRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class SZLValidationError extends SZLApiError {
  readonly fields?: Record<string, string[]>;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'SZLValidationError';
    this.fields = fields;
  }
}
