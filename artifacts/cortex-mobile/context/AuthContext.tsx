import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export const AUTH_TOKEN_KEY = "cortex_auth_token";
const ISSUER_URL = process.env.EXPO_PUBLIC_ISSUER_URL ?? "https://replit.com/oidc";

export interface AuthUser {
  id: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const discovery = AuthSession.useAutoDiscovery(ISSUER_URL);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "cortex" });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    { clientId: "cortex-mobile", redirectUri, scopes: ["openid", "profile", "email"], responseType: AuthSession.ResponseType.Code, usePKCE: true },
    discovery
  );

  const fetchUser = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUser({ id: data.id ?? "1", displayName: data.displayName ?? data.name ?? "User", email: data.email ?? null, avatarUrl: data.avatarUrl ?? data.profileImageUrl ?? null, roles: data.roles ?? [] });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = Platform.OS === "web" ? (typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null) : await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (token) { await fetchUser(token); }
      } catch {}
      setIsLoading(false);
    })();
  }, [fetchUser]);

  useEffect(() => {
    if (response?.type === "success" && response.params?.code && discovery) {
      (async () => {
        try {
          const tokenRes = await AuthSession.exchangeCodeAsync({ clientId: "cortex-mobile", code: response.params.code, redirectUri, extraParams: { code_verifier: request?.codeVerifier ?? "" } }, discovery);
          const token = tokenRes.accessToken;
          if (Platform.OS === "web") { if (typeof window !== "undefined") window.localStorage.setItem(AUTH_TOKEN_KEY, token); } else { await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token); }
          await fetchUser(token);
        } catch { console.warn("[Auth] Token exchange failed"); }
      })();
    }
  }, [response, discovery, request, redirectUri, fetchUser]);

  const login = useCallback(async () => {
    if (request) { await promptAsync(); } else { console.warn("[Auth] Auth request not ready"); }
  }, [request, promptAsync]);

  const logout = useCallback(async () => {
    setUser(null);
    if (Platform.OS === "web") { if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_TOKEN_KEY); } else { await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
