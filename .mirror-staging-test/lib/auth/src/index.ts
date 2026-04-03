export interface AuthIdentity {
  externalId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  provider: string;
}

export interface AuthProvider {
  name: string;
  verifyIdentity(credential: string): Promise<AuthIdentity | null>;
  isConfigured(): boolean;
}

export class DevAuthProvider implements AuthProvider {
  name = "dev";

  async verifyIdentity(credential: string): Promise<AuthIdentity | null> {
    if (process.env.NODE_ENV === "production") return null;
    if (!credential.startsWith("dev:")) return null;
    const username = credential.slice(4);
    if (!username || username.length < 1) return null;
    return {
      externalId: `dev_${username}`,
      displayName: username,
      email: `${username}@dev.local`,
      provider: this.name,
    };
  }

  isConfigured(): boolean {
    return process.env.NODE_ENV !== "production";
  }
}

export class AuthService {
  private providers: AuthProvider[] = [];

  constructor(providers?: AuthProvider[]) {
    if (providers) {
      this.providers = providers;
    } else {
      const dev = new DevAuthProvider();
      if (dev.isConfigured()) this.providers.push(dev);
    }
  }

  async verifyIdentity(credential: string): Promise<AuthIdentity | null> {
    for (const provider of this.providers) {
      const identity = await provider.verifyIdentity(credential);
      if (identity) return identity;
    }
    return null;
  }

  registerProvider(provider: AuthProvider): void {
    this.providers.push(provider);
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.name);
  }
}

export function createAuthService(providers?: AuthProvider[]): AuthService {
  return new AuthService(providers);
}
