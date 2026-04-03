import { useState, useCallback, useEffect, useRef } from "react";
import type {
  UserContext,
  TenantContext,
  DomainContext,
  PrismContextBundle,
  PrismDomain,
} from "./context.js";
import type { PrismBusEvent, PrismBusEventType } from "./bus.js";
import { prismBus } from "./bus.js";
import { prismConnectorRegistry } from "./connectors.js";
import type { PrismToolDescriptor } from "./connectors.js";

export interface UsePrismContextReturn {
  context: PrismContextBundle;
  setUser: (user: UserContext | null) => void;
  setTenant: (tenant: TenantContext | null) => void;
  setDomain: (domain: DomainContext | null) => void;
  publishEvent: (event: Omit<PrismBusEvent, "id" | "timestamp">) => Promise<PrismBusEvent>;
}

export function usePrismContext(initialContext: PrismContextBundle = {}): UsePrismContextReturn {
  const [context, setContext] = useState<PrismContextBundle>(initialContext);

  const setUser = useCallback((user: UserContext | null) => {
    setContext(prev => ({ ...prev, user }));
  }, []);

  const setTenant = useCallback((tenant: TenantContext | null) => {
    setContext(prev => ({ ...prev, tenant }));
  }, []);

  const setDomain = useCallback((domain: DomainContext | null) => {
    setContext(prev => ({ ...prev, domain }));
  }, []);

  const publishEvent = useCallback(
    (event: Omit<PrismBusEvent, "id" | "timestamp">) => prismBus.publish(event),
    []
  );

  return { context, setUser, setTenant, setDomain, publishEvent };
}

export interface UsePrismBusReturn {
  events: PrismBusEvent[];
  subscribe: (
    types: PrismBusEventType[] | "*",
    handler: (event: PrismBusEvent) => void,
    domains?: PrismDomain[] | "*"
  ) => () => void;
  publishEvent: (event: Omit<PrismBusEvent, "id" | "timestamp">) => Promise<PrismBusEvent>;
  stats: ReturnType<typeof prismBus.getStats>;
}

export function usePrismBus(
  subscriberId: string,
  watchTypes?: PrismBusEventType[] | "*",
  watchDomains?: PrismDomain[] | "*"
): UsePrismBusReturn {
  const [events, setEvents] = useState<PrismBusEvent[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!watchTypes) return;

    const unsub = prismBus.subscribe(
      subscriberId,
      watchTypes,
      (event) => {
        setEvents(prev => [event, ...prev].slice(0, 200));
      },
      watchDomains
    );
    unsubRef.current = unsub;
    return () => {
      unsub();
      unsubRef.current = null;
    };
  }, [subscriberId, watchTypes, watchDomains]);

  const subscribe = useCallback(
    (
      types: PrismBusEventType[] | "*",
      handler: (event: PrismBusEvent) => void,
      domains?: PrismDomain[] | "*"
    ) => prismBus.subscribe(subscriberId, types, handler, domains),
    [subscriberId]
  );

  const publishEvent = useCallback(
    (event: Omit<PrismBusEvent, "id" | "timestamp">) => prismBus.publish(event),
    []
  );

  return { events, subscribe, publishEvent, stats: prismBus.getStats() };
}

export interface UsePrismToolsReturn {
  tools: PrismToolDescriptor[];
  getToolsForDomain: (domain: PrismDomain) => PrismToolDescriptor[];
  connectorHealth: ReturnType<typeof prismConnectorRegistry.getHealthSummary>;
}

export function usePrismTools(domain?: PrismDomain): UsePrismToolsReturn {
  const tools = domain
    ? prismConnectorRegistry.getToolsForDomain(domain)
    : prismConnectorRegistry.getAllTools();

  return {
    tools,
    getToolsForDomain: prismConnectorRegistry.getToolsForDomain.bind(prismConnectorRegistry),
    connectorHealth: prismConnectorRegistry.getHealthSummary(),
  };
}
