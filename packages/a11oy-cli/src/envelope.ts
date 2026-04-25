export type MetaSuccess = {
  requestId: string;
  timestamp: string;
  mode: string;
  tenant: string;
};

export type MetaError = {
  requestId: string;
  timestamp: string;
};

export interface SuccessEnvelope<T> {
  ok: true;
  result: T;
  meta: MetaSuccess;
}

export interface ErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    detail?: string;
  };
  meta: MetaError;
}

export type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope;
