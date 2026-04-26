export type MetaSuccess = {
  requestId: string;
  timestamp: string;
  mode?: string;
  tenant?: string;
  total?: number;
  page?: number;
  pageSize?: number;
};

export type MetaError = {
  requestId: string;
  timestamp: string;
};

export interface SuccessEnvelope<T> {
  ok: true;
  data: T;
  meta: MetaSuccess;
}

export interface ErrorEnvelope {
  ok: false;
  error: {
    code?: string;
    type?: string;
    message: string;
    detail?: string;
    retryable?: boolean;
    timestamp?: string;
  };
  meta?: MetaError;
}

export type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope;
