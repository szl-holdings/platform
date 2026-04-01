import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "lyte_session_token";
const API_KEY_KEY = "lyte_api_key";

interface AuthState {
  token: string | null;
  apiKey: string | null;
  isReady: boolean;
}

interface AuthContextValue extends AuthState {
  setCredentials: (token: string | null, apiKey: string | null) => Promise<void>;
  clearCredentials: () => Promise<void>;
  buildHeaders: () => Record<string, string>;
  buildWsAuthMessage: () => string | null;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  apiKey: null,
  isReady: false,
  setCredentials: async () => {},
  clearCredentials: async () => {},
  buildHeaders: () => ({ "Content-Type": "application/json" }),
  buildWsAuthMessage: () => null,
});

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch {}
    return;
  }
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, apiKey: null, isReady: false });

  useEffect(() => {
    const load = async () => {
      const [token, apiKey] = await Promise.all([secureGet(TOKEN_KEY), secureGet(API_KEY_KEY)]);
      setAuth({ token, apiKey, isReady: true });
    };
    load();
  }, []);

  const setCredentials = useCallback(async (token: string | null, apiKey: string | null) => {
    await Promise.all([secureSet(TOKEN_KEY, token), secureSet(API_KEY_KEY, apiKey)]);
    setAuth(prev => ({ ...prev, token, apiKey }));
  }, []);

  const clearCredentials = useCallback(async () => {
    await Promise.all([secureSet(TOKEN_KEY, null), secureSet(API_KEY_KEY, null)]);
    setAuth(prev => ({ ...prev, token: null, apiKey: null }));
  }, []);

  const buildHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth.token) {
      headers["Authorization"] = `Bearer ${auth.token}`;
    }
    if (auth.apiKey) {
      headers["X-API-Key"] = auth.apiKey;
    }
    return headers;
  }, [auth.token, auth.apiKey]);

  const buildWsAuthMessage = useCallback((): string | null => {
    if (!auth.token && !auth.apiKey) return null;
    return JSON.stringify({
      type: "auth",
      ...(auth.token ? { token: auth.token } : {}),
      ...(auth.apiKey ? { apiKey: auth.apiKey } : {}),
    });
  }, [auth.token, auth.apiKey]);

  return (
    <AuthContext.Provider
      value={{ ...auth, setCredentials, clearCredentials, buildHeaders, buildWsAuthMessage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
