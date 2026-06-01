import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { PRISM_BUILT_IN_TOOLS } from './bridge.js';
import { type PrismBusEvent, type PrismBusEventType, prismBus } from './bus.js';
import { prismConnectorRegistry } from './connectors.js';
import type {
  DomainContext,
  PrismContextBundle,
  PrismDomain,
  TenantContext,
  UserContext,
} from './context.js';

interface PrismBusContextValue {
  context: PrismContextBundle;
  domain: PrismDomain;
  setUser: (user: UserContext | null) => void;
  setTenant: (tenant: TenantContext | null) => void;
  setDomain: (domain: DomainContext | null) => void;
  publishEvent: (event: Omit<PrismBusEvent, 'id' | 'timestamp'>) => Promise<PrismBusEvent>;
  subscribe: (
    types: PrismBusEventType[] | '*',
    handler: (event: PrismBusEvent) => void,
    domains?: PrismDomain[] | '*',
  ) => () => void;
}

const PrismBusContext = createContext<PrismBusContextValue | null>(null);

export interface PrismBusProviderProps {
  children: ReactNode;
  domain: PrismDomain;
  initialContext?: PrismContextBundle;
}

export function PrismBusProvider({ children, domain, initialContext = {} }: PrismBusProviderProps) {
  const [context, setContext] = useState<PrismContextBundle>({
    ...initialContext,
    domain: initialContext.domain ?? {
      domain,
      displayName: domain,
      isActive: true,
      tools: PRISM_BUILT_IN_TOOLS.filter((t) => t.domains.includes(domain)).map((t) => t.name),
      connectors: prismConnectorRegistry.getConnectorsForDomain(domain).map((c) => c.id),
      agentSchedules: [],
    },
  });

  const setUser = useCallback(
    (user: UserContext | null) => {
      setContext((prev) => ({ ...prev, user }));
      if (user) {
        prismBus
          .publish({
            type: 'context_updated',
            domain,
            sourceId: `prism-provider:${domain}`,
            severity: 'info',
            payload: { contextType: 'user', userId: user.userId },
            userId: user.userId,
          })
          .catch(() => {});
      }
    },
    [domain],
  );

  const setTenant = useCallback((tenant: TenantContext | null) => {
    setContext((prev) => ({ ...prev, tenant }));
  }, []);

  const setDomain = useCallback((domainCtx: DomainContext | null) => {
    setContext((prev) => ({ ...prev, domain: domainCtx }));
  }, []);

  const publishEvent = useCallback(
    (event: Omit<PrismBusEvent, 'id' | 'timestamp'>) => prismBus.publish(event),
    [],
  );

  const subscribe = useCallback(
    (
      types: PrismBusEventType[] | '*',
      handler: (event: PrismBusEvent) => void,
      domains?: PrismDomain[] | '*',
    ) => prismBus.subscribe(`provider-${domain}`, types, handler, domains),
    [domain],
  );

  return (
    <PrismBusContext.Provider
      value={{ context, domain, setUser, setTenant, setDomain, publishEvent, subscribe }}
    >
      {children}
    </PrismBusContext.Provider>
  );
}

export function usePrismBusContext(): PrismBusContextValue {
  const ctx = useContext(PrismBusContext);
  if (!ctx) {
    throw new Error('usePrismBusContext must be used within a PrismBusProvider');
  }
  return ctx;
}

export function usePrismBusContextSafe(): PrismBusContextValue | null {
  return useContext(PrismBusContext);
}
