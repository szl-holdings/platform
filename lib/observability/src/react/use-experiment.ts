import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Client-side A/B experiment SDK
// Resolves variant assignment and auto-tracks exposure on mount.
// ---------------------------------------------------------------------------

const BASE_API = (
  typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env
    ? (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? ''
    : ''
) as string;

export interface ExperimentVariantResult {
  assigned: boolean;
  experimentKey: string;
  variantKey: string | null;
  variantId: number | null;
  experimentId: number | null;
  isLoading: boolean;
  error: Error | null;
  trackConversion: (metricKey?: string, metricValue?: number) => Promise<void>;
  trackMetric: (metricKey: string, metricValue: number) => Promise<void>;
}

function getStableEntityId(): string {
  const storageKey = '__szl_experiment_entity_id';
  try {
    const stored = sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey);
    if (stored) return stored;
    const id = `anon-${crypto.randomUUID()}`;
    localStorage.setItem(storageKey, id);
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Experiment API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? data;
}

export function useExperiment(
  experimentKey: string,
  options: {
    entityId?: string;
    entityType?: 'user' | 'org' | 'session' | 'device';
    autoTrackExposure?: boolean;
    disabled?: boolean;
  } = {},
): ExperimentVariantResult {
  const {
    entityId: providedEntityId,
    entityType = 'user',
    autoTrackExposure = true,
    disabled = false,
  } = options;

  const [state, setState] = useState<{
    assigned: boolean;
    variantKey: string | null;
    variantId: number | null;
    experimentId: number | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    assigned: false,
    variantKey: null,
    variantId: null,
    experimentId: null,
    isLoading: !disabled,
    error: null,
  });

  const entityId = providedEntityId ?? getStableEntityId();
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (disabled || resolvedRef.current) return;
    resolvedRef.current = true;

    apiPost<{
      assigned: boolean;
      variantKey: string | null;
      variantId: number | null;
      experimentId: number | null;
    }>('/api/experiments/assign', {
      experimentKey,
      entityId,
      entityType,
      trackExposure: autoTrackExposure,
    })
      .then((data) => {
        setState({
          assigned: data.assigned,
          variantKey: data.variantKey,
          variantId: data.variantId,
          experimentId: data.experimentId,
          isLoading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
  }, [experimentKey, entityId, entityType, autoTrackExposure, disabled]);

  const trackConversion = useCallback(
    async (metricKey?: string, metricValue?: number) => {
      if (!state.experimentId || !state.variantId) return;
      await apiPost('/api/experiments/track', {
        experimentId: state.experimentId,
        variantId: state.variantId,
        entityId,
        eventType: 'conversion',
        metricKey,
        metricValue,
      }).catch(() => {});
    },
    [state.experimentId, state.variantId, entityId],
  );

  const trackMetric = useCallback(
    async (metricKey: string, metricValue: number) => {
      if (!state.experimentId || !state.variantId) return;
      await apiPost('/api/experiments/track', {
        experimentId: state.experimentId,
        variantId: state.variantId,
        entityId,
        eventType: 'metric',
        metricKey,
        metricValue,
      }).catch(() => {});
    },
    [state.experimentId, state.variantId, entityId],
  );

  return {
    ...state,
    experimentKey,
    trackConversion,
    trackMetric,
  };
}

// ---------------------------------------------------------------------------
// Batch variant hook — resolves multiple experiments in one request
// ---------------------------------------------------------------------------

export interface BatchExperimentResult {
  assignments: Record<
    string,
    { variantKey: string; variantId: number; experimentId: number } | null
  >;
  isLoading: boolean;
  error: Error | null;
}

export function useExperiments(
  experimentKeys: string[],
  options: {
    entityId?: string;
    entityType?: 'user' | 'org' | 'session' | 'device';
    autoTrackExposure?: boolean;
    disabled?: boolean;
  } = {},
): BatchExperimentResult {
  const {
    entityId: providedEntityId,
    entityType = 'user',
    autoTrackExposure = true,
    disabled = false,
  } = options;

  const [state, setState] = useState<BatchExperimentResult>({
    assignments: {},
    isLoading: !disabled,
    error: null,
  });

  const entityId = providedEntityId ?? getStableEntityId();
  const keysRef = useRef(experimentKeys.join(','));

  useEffect(() => {
    const currentKeys = experimentKeys.join(',');
    if (disabled || keysRef.current === currentKeys && Object.keys(state.assignments).length > 0) return;
    keysRef.current = currentKeys;

    if (experimentKeys.length === 0) {
      setState({ assignments: {}, isLoading: false, error: null });
      return;
    }

    apiPost<{ assignments: Record<string, { variantKey: string; variantId: number; experimentId: number } | null> }>(
      '/api/experiments/batch-assign',
      {
        experimentKeys,
        entityId,
        entityType,
        trackExposure: autoTrackExposure,
      },
    )
      .then((data) => {
        setState({ assignments: data.assignments, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        setState({
          assignments: {},
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
  }, [experimentKeys.join(','), entityId, entityType, autoTrackExposure, disabled]);

  return state;
}
