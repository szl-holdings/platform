import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface GoogleAuthStatus {
  configured: boolean;
  projectId?: string | undefined;
  serviceAccountEmail?: string | undefined;
}

export class GoogleAdapter extends ServiceAdapter {
  readonly name = "google";
  readonly description =
    "Google APIs (Sheets, Calendar, Drive, etc.) — requires OAuth or service account setup";
  readonly requiredEnvVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];

  override get supportsMockMode(): boolean {
    return false;
  }

  private get hasServiceAccount(): boolean {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!key) return false;
    try {
      const parsed = JSON.parse(key) as Record<string, unknown>;
      return typeof parsed.client_email === "string" && typeof parsed.private_key === "string";
    } catch {
      return false;
    }
  }

  private get hasOAuthCredentials(): boolean {
    return this.requiredEnvVars.every(
      (v) => process.env[v] !== undefined && process.env[v] !== "",
    );
  }

  protected override async performHealthCheck(): Promise<void> {
    if (this.hasServiceAccount) {
      const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!) as { client_email: string; token_uri?: string };
      const response = await fetch(key.token_uri || "https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: "health-check-probe",
        }),
      });
      if (!response.ok && response.status !== 400) throw new Error(`Google token endpoint returned ${response.status}`);
    } else if (this.hasOAuthCredentials) {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=health-check-probe`);
      if (!response.ok && response.status !== 400) throw new Error(`Google OAuth returned ${response.status}`);
    } else {
      throw new Error("Google API not configured — missing credentials");
    }
  }

  override get status(): ServiceStatus {
    if (this.hasServiceAccount || this.hasOAuthCredentials) {
      return "LIVE_CONFIGURED";
    }
    return "MANUAL_REQUIRED";
  }

  override get isLive(): boolean {
    return this.status === "LIVE_CONFIGURED";
  }

  override get presentEnvVars(): string[] {
    const present: string[] = [];
    for (const v of this.requiredEnvVars) {
      if (process.env[v] !== undefined && process.env[v] !== "") {
        present.push(v);
      }
    }
    if (this.hasServiceAccount) {
      present.push("GOOGLE_SERVICE_ACCOUNT_KEY");
    }
    return present;
  }

  override get missingEnvVars(): string[] {
    if (this.hasServiceAccount) return [];
    return this.requiredEnvVars.filter(
      (v) => process.env[v] === undefined || process.env[v] === "",
    );
  }

  getAuthStatus(): GoogleAuthStatus {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        const parsed = JSON.parse(serviceAccount) as {
          project_id?: string;
          client_email?: string;
        };
        return {
          configured: true,
          projectId: parsed.project_id,
          serviceAccountEmail: parsed.client_email,
        };
      } catch {
        return { configured: false };
      }
    }

    if (this.isLive) {
      return {
        configured: true,
        projectId: process.env.GOOGLE_PROJECT_ID,
      };
    }

    return { configured: false };
  }
}
