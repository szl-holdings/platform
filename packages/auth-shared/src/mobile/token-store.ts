/**
 * Mobile token storage contract.
 *
 * Implementations must use `expo-secure-store` on device.  The interface
 * is defined here so it can be consumed by the mobile artifact and mocked
 * in tests without pulling in Expo dependencies.
 *
 * FINDING F-07 remediation: The mobile app MUST use `expo-secure-store`
 * (iOS Keychain / Android Keystore) for all session and refresh token
 * storage.  `AsyncStorage` is NOT acceptable — it is unencrypted.
 */

export interface MobileTokenStore {
  /** Persist an opaque session token securely. */
  setSessionToken(token: string): Promise<void>;
  /** Retrieve the stored session token, or null if absent. */
  getSessionToken(): Promise<string | null>;
  /** Remove the session token (call on logout). */
  clearSessionToken(): Promise<void>;
  /** Persist an opaque refresh token securely. */
  setRefreshToken(token: string): Promise<void>;
  /** Retrieve the stored refresh token, or null if absent. */
  getRefreshToken(): Promise<string | null>;
  /** Remove the refresh token. */
  clearRefreshToken(): Promise<void>;
  /** Remove all tokens (full logout). */
  clearAll(): Promise<void>;
}

export const TOKEN_STORE_KEYS = {
  SESSION: 'szl.session_token',
  REFRESH: 'szl.refresh_token',
} as const;

/**
 * In-memory implementation for use in unit tests only.
 * Never use this in production — it provides zero security.
 */
export class InMemoryTokenStore implements MobileTokenStore {
  private _session: string | null = null;
  private _refresh: string | null = null;

  async setSessionToken(token: string): Promise<void> {
    this._session = token;
  }
  async getSessionToken(): Promise<string | null> {
    return this._session;
  }
  async clearSessionToken(): Promise<void> {
    this._session = null;
  }
  async setRefreshToken(token: string): Promise<void> {
    this._refresh = token;
  }
  async getRefreshToken(): Promise<string | null> {
    return this._refresh;
  }
  async clearRefreshToken(): Promise<void> {
    this._refresh = null;
  }
  async clearAll(): Promise<void> {
    this._session = null;
    this._refresh = null;
  }
}
