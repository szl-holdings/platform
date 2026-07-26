import type { HybridSearchResponse } from '@workspace/aef-contracts';
import { useCallback, useRef, useState } from 'react';
import { AefClient } from './client.js';
import type { AefClientConfig } from './config.js';

export interface UseAefSearchOptions {
  profileId: string;
  gatewayUrl?: string;
  apiKey?: string;
  tenantId?: string;
  topK?: number;
  rerankEnabled?: boolean;
  denseWeight?: number;
  keywordWeight?: number;
  clientConfig?: Partial<AefClientConfig>;
}

export interface UseAefSearchState {
  loading: boolean;
  results: HybridSearchResponse | null;
  error: Error | null;
  query: string;
  configured: boolean;
}

export interface UseAefSearchReturn extends UseAefSearchState {
  search: (query: string) => Promise<void>;
  reset: () => void;
}

function resolveClientConfig(opts: UseAefSearchOptions): Partial<AefClientConfig> | null {
  const gatewayUrl =
    opts.gatewayUrl ??
    opts.clientConfig?.gatewayUrl ??
    getViteEnv('AEF_GATEWAY_URL') ??
    getViteEnv('VITE_AEF_GATEWAY_URL');
  const apiKey =
    opts.apiKey ??
    opts.clientConfig?.apiKey ??
    getViteEnv('AEF_API_KEY') ??
    getViteEnv('VITE_AEF_API_KEY');
  const tenantId =
    opts.tenantId ??
    opts.clientConfig?.tenantId ??
    getViteEnv('AEF_TENANT_ID') ??
    getViteEnv('VITE_AEF_TENANT_ID') ??
    'szl-holdings';

  if (!gatewayUrl || !apiKey) return null;
  return { ...opts.clientConfig, gatewayUrl, apiKey, tenantId };
}

function getViteEnv(key: string): string | undefined {
  const viteEnv = (
    import.meta as ImportMeta & {
      readonly env?: Readonly<Record<string, string | undefined>>;
    }
  ).env;
  if (viteEnv) {
    return viteEnv[key] ?? viteEnv[`VITE_${key}`] ?? undefined;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? undefined;
  }
  return undefined;
}

export function useAefSearch(options: UseAefSearchOptions): UseAefSearchReturn {
  const resolvedConfig = resolveClientConfig(options);
  const isConfigured = resolvedConfig !== null;

  const [state, setState] = useState<UseAefSearchState>({
    loading: false,
    results: null,
    error: null,
    query: '',
    configured: isConfigured,
  });

  const clientRef = useRef<AefClient | null>(null);

  const getClient = useCallback((): AefClient | null => {
    if (!resolvedConfig) return null;
    if (!clientRef.current) {
      try {
        clientRef.current = new AefClient(resolvedConfig);
      } catch {
        return null;
      }
    }
    return clientRef.current;
  }, [resolvedConfig]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      const client = getClient();
      if (!client) {
        setState((prev) => ({
          ...prev,
          error: new Error(
            'AEF is not configured. Set VITE_AEF_GATEWAY_URL and VITE_AEF_API_KEY in your environment. See docs/aef/RUNBOOK.md.',
          ),
          configured: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, query }));

      try {
        const response = await client.hybridSearch({
          query,
          profileId: options.profileId,
          topK: options.topK ?? 8,
          rerankEnabled: options.rerankEnabled ?? true,
          denseWeight: options.denseWeight ?? 0.6,
          keywordWeight: options.keywordWeight ?? 0.4,
          candidatePool: (options.topK ?? 8) * 10,
          includeProvenance: true,
        });

        setState({ loading: false, results: response, error: null, query, configured: true });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    },
    [
      getClient,
      options.profileId,
      options.topK,
      options.rerankEnabled,
      options.denseWeight,
      options.keywordWeight,
    ],
  );

  const reset = useCallback(() => {
    setState({ loading: false, results: null, error: null, query: '', configured: isConfigured });
  }, [isConfigured]);

  return { ...state, search, reset };
}

export interface UseAefEmbedOptions {
  clientConfig?: Partial<AefClientConfig>;
  profileId?: string;
}

export function useAefEmbed(options: UseAefEmbedOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<AefClient | null>(null);
  const getClient = useCallback((): AefClient | null => {
    try {
      if (!clientRef.current) {
        clientRef.current = new AefClient(options.clientConfig ?? {});
      }
      return clientRef.current;
    } catch {
      return null;
    }
  }, [options.clientConfig]);

  const embed = useCallback(
    async (texts: string[]) => {
      const client = getClient();
      if (!client) {
        const e = new Error(
          'AEF not configured for embed. Check VITE_AEF_GATEWAY_URL and VITE_AEF_API_KEY.',
        );
        setError(e);
        throw e;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await client.embed({ texts, profileId: options.profileId });
        setLoading(false);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setLoading(false);
        throw e;
      }
    },
    [getClient, options.profileId],
  );

  return { embed, loading, error };
}
