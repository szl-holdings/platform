declare module "@szl-holdings/mobile-ai" {
  import type { ReactNode } from "react";

  export interface CopilotConfig {
    accentColor: string;
    agentId: string;
    placeholder: string;
    systemContext: string;
    apiBaseUrl: string;
    authToken?: string;
  }

  export interface Message {
    id: string;
    role: "user" | "assistant" | "tool";
    content: string;
    toolName?: string;
    toolStatus?: "running" | "done" | "error";
    toolOutput?: string;
    pendingApproval?: { id: string; actionType: string; description: string };
    timestamp: Date;
  }

  export interface NotificationConfig {
    accentColor: string;
    apiBaseUrl: string;
    appId: string;
    authToken?: string;
  }

  export interface AiNotification {
    id: string;
    title: string;
    body: string;
    category: string;
    actionLabel?: string;
    actionEndpoint?: string;
    timestamp: Date;
    priority: "low" | "medium" | "high" | "critical";
  }

  export interface DocumentCaptureConfig {
    accentColor: string;
    apiBaseUrl: string;
    authToken?: string;
    allowedTypes?: string[];
  }

  export interface DocumentResult {
    uri: string;
    base64?: string;
    mimeType: string;
    name: string;
    size?: number;
  }

  export interface ExtractedEntity {
    type: string;
    value: string;
    confidence: number;
  }

  export interface UseSecureVaultReturn {
    saveMessage: (content: string) => Promise<void>;
    loadMessages: () => Promise<Array<{ id: string; content: string; timestamp: number }>>;
    clearVault: () => Promise<void>;
    isReady: boolean;
  }

  export interface VaultMessage {
    id: string;
    content: string;
    timestamp: number;
  }

  export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: number;
  }

  export interface UseOfflineCacheOptions {
    maxStalenessMs?: number;
    fetchFn: () => Promise<unknown>;
    key: string;
    apiBaseUrl?: string;
    authToken?: string;
  }

  export function AICopilot(props: { config: CopilotConfig }): JSX.Element;

  export function usePushNotifications(config: NotificationConfig): {
    pushToken: string | null;
    permissionStatus: "unknown" | "granted" | "denied";
  };

  export function PushNotificationOverlay(props: {
    config: NotificationConfig;
    notifications: AiNotification[];
    onDismiss: (id: string) => void;
    onAction: (notif: AiNotification) => void;
  }): JSX.Element | null;

  export function DocumentCapture(props: {
    config: DocumentCaptureConfig;
    onCapture: (result: DocumentResult, entities: ExtractedEntity[]) => void;
    onClose: () => void;
  }): JSX.Element;

  export function useOfflineCache<T>(options: UseOfflineCacheOptions): {
    data: T | null;
    isLoading: boolean;
    isOffline: boolean;
    isStale: boolean;
    lastUpdated: Date | null;
    invalidate: () => Promise<void>;
    forceRefresh: () => Promise<void>;
    queueOfflineWrite: (endpoint: string, payload: unknown) => Promise<void>;
  };

  export function useSecureVault(vaultKey: string): UseSecureVaultReturn;
}
