export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  authUrl?: string;
  redirectUri?: string;
  scope?: string;
}

export interface ClientCredentialsOptions {
  config: OAuthClientConfig;
  extraParams?: Record<string, string>;
}

export interface AuthorizationCodeOptions {
  config: OAuthClientConfig;
  code: string;
  codeVerifier?: string;
}

export class OAuthTokenStore {
  private tokens = new Map<string, OAuthTokenSet>();
  private refreshCallbacks = new Map<string, (key: string) => Promise<OAuthTokenSet>>();

  store(key: string, tokenSet: OAuthTokenSet): void {
    this.tokens.set(key, tokenSet);
  }

  get(key: string): OAuthTokenSet | undefined {
    return this.tokens.get(key);
  }

  isExpired(key: string, bufferSeconds = 60): boolean {
    const tokenSet = this.tokens.get(key);
    if (!tokenSet) return true;
    if (!tokenSet.expiresAt) return false;
    return Date.now() >= tokenSet.expiresAt - bufferSeconds * 1000;
  }

  registerRefreshCallback(key: string, fn: (key: string) => Promise<OAuthTokenSet>): void {
    this.refreshCallbacks.set(key, fn);
  }

  async getValidToken(key: string): Promise<OAuthTokenSet | undefined> {
    if (!this.isExpired(key)) return this.tokens.get(key);
    const refreshFn = this.refreshCallbacks.get(key);
    if (!refreshFn) return this.tokens.get(key);
    try {
      const newTokens = await refreshFn(key);
      this.store(key, newTokens);
      return newTokens;
    } catch {
      return this.tokens.get(key);
    }
  }
}

export const globalTokenStore = new OAuthTokenStore();

export async function exchangeClientCredentials(
  opts: ClientCredentialsOptions,
): Promise<OAuthTokenSet> {
  const { config, extraParams = {} } = opts;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    ...(config.scope ? { scope: config.scope } : {}),
    ...extraParams,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OAuth client_credentials failed: ${response.status} — ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type ?? 'Bearer',
    scope: data.scope,
  };
}

export async function exchangeAuthorizationCode(
  opts: AuthorizationCodeOptions,
): Promise<OAuthTokenSet> {
  const { config, code, codeVerifier } = opts;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    ...(config.redirectUri ? { redirect_uri: config.redirectUri } : {}),
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OAuth authorization_code exchange failed: ${response.status} — ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type ?? 'Bearer',
    scope: data.scope,
  };
}

export async function refreshAccessToken(
  config: Pick<OAuthClientConfig, 'clientId' | 'clientSecret' | 'tokenUrl'>,
  refreshToken: string,
): Promise<OAuthTokenSet> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OAuth token refresh failed: ${response.status} — ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    tokenType: data.token_type ?? 'Bearer',
    scope: data.scope,
  };
}

export function buildAuthorizationUrl(
  config: OAuthClientConfig,
  state: string,
  codeChallenge?: string,
): string {
  if (!config.authUrl) throw new Error('authUrl required for authorization code flow');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    state,
    ...(config.redirectUri ? { redirect_uri: config.redirectUri } : {}),
    ...(config.scope ? { scope: config.scope } : {}),
    ...(codeChallenge ? { code_challenge: codeChallenge, code_challenge_method: 'S256' } : {}),
  });
  return `${config.authUrl}?${params.toString()}`;
}
