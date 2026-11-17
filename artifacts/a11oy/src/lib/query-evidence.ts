export type EvidenceMode = 'api' | 'demo';
export type QueryEvidenceState = 'LOADING' | 'ERROR' | 'STALE' | 'UNAVAILABLE' | 'EMPTY' | 'API_DATA';

export interface QueryEvidence {
  state: QueryEvidenceState;
  usable: boolean;
  received: boolean;
  reason: 'loading' | 'error' | 'error_with_cache' | 'refreshing_cache' | 'stale_cache' | 'no_response' | 'null_response' | 'empty_response' | 'response_received';
  detail: string;
}

/** A response observation is not a runtime-health or receipt-verification claim. */
export function classifyQueryEvidence(input: {
  value: unknown;
  fetching?: boolean;
  stale?: boolean;
  error?: unknown;
}): QueryEvidence {
  const received = input.value !== undefined;
  const hasData = received && input.value !== null;
  const result = (state: QueryEvidenceState, reason: QueryEvidence['reason'], detail: string): QueryEvidence => ({
    state, reason, detail, received, usable: state === 'API_DATA' || state === 'EMPTY',
  });
  if (input.error) {
    return hasData
      ? result('STALE', 'error_with_cache', 'The query failed; previously returned data is withheld.')
      : result('ERROR', 'error', 'The query failed. No response data is available.');
  }
  if (input.fetching) {
    return hasData
      ? result('STALE', 'refreshing_cache', 'The query is refreshing; previously returned data is withheld.')
      : result('LOADING', 'loading', 'Waiting for this query response.');
  }
  if (input.stale) {
    return result('STALE', 'stale_cache', 'The query is marked stale; response data is withheld.');
  }
  if (!received) {
    return result('UNAVAILABLE', 'no_response', 'This query has not returned a value.');
  }
  if (input.value === null) {
    return result('UNAVAILABLE', 'null_response', 'This query returned null; no value is available.');
  }
  if (Array.isArray(input.value) && input.value.length === 0) {
    return result('EMPTY', 'empty_response', 'This query returned an empty list.');
  }
  return result('API_DATA', 'response_received', 'A query response was received; it is not independent verification.');
}
