import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
  username?: string | null;
  email: string | null;
  avatarUrl: string | null;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  buildHeaders: (extra?: Record<string, string>) => Record<string, string>;
  buildWsAuthMessage: () => { type: string; token: string };
  signals?: unknown[];
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isReady: false,
  login: async () => {},
  logout: async () => {},
  signOut: async () => {},
  buildHeaders: (extra) => ({ "Content-Type": "application/json", ...extra }),
  buildWsAuthMessage: () => ({ type: "auth", token: "" }),
  signals: [],
});

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

function getClientId(): string {
  return process.env.EXPO_PUBLIC_REPL_ID ?? "";
}

async function secureGetToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

async function secureSetToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined")
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  return SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

async function secureDelToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined")
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const discovery = AuthSession.useAutoDiscovery(ISSUER_URL);
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getClientId(),
      scopes: ["openid", "email", "profile", "offline_access"],
      redirectUri,
      prompt: AuthSession.Prompt.Login,
    },
    discovery,
  );

  const fetchUser = useCallback(async () => {
    try {
      const token = await secureGetToken();
      if (!token) {
        setAccessToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await secureDelToken();
        setAccessToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setAccessToken(token);

      const json = await res.json();
      const data = json.data ?? json;
      if (data?.id) {
        setUser({
          id: String(data.id),
          displayName: data.displayName ?? null,
          email: data.email ?? null,
          avatarUrl: data.avatarUrl ?? null,
          roles: Array.isArray(data.roles) ? data.roles : [],
        });
      } else {
        await secureDelToken();
        setAccessToken(null);
        setUser(null);
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!response || response.type !== "success" || !request) return;
    (async () => {
      try {
        setIsLoading(true);
        const { code, state } = response.params;
        const apiBase = getApiBaseUrl();
        const tokenResp = await fetch(`${apiBase}/api/mobile-auth/token-exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
            code_verifier: request.codeVerifier,
            state: state ?? "",
          }),
        });
        if (!tokenResp.ok) {
          setIsLoading(false);
          return;
        }
        const tokenData = await tokenResp.json();
        const accessToken = tokenData.access_token ?? tokenData.token ?? tokenData.accessToken;
        if (!accessToken) {
          setIsLoading(false);
          return;
        }
        await secureSetToken(accessToken);
        setAccessToken(accessToken);
        await fetchUser();
      } catch (err) {
        console.error("[Auth] Token exchange error:", err);
        setIsLoading(false);
      }
    })();
  }, [response, request, redirectUri, fetchUser]);

  const login = useCallback(async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.error("[Auth] Login error:", err);
    }
  }, [promptAsync]);

  const logout = useCallback(async () => {
    try {
      const token = await secureGetToken();
      if (token) {
        const apiBase = getApiBaseUrl();
        await fetch(`${apiBase}/api/mobile-auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
    } finally {
      await secureDelToken();
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isReady: !isLoading,
        login,
        logout,
        signOut: logout,
        buildHeaders: (extra?: Record<string, string>) => {
          const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
          if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
          return headers;
        },
        buildWsAuthMessage: () => {
          return { type: "auth", token: accessToken ?? "" };
        },
        signals: [],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
