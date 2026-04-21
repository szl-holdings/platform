import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface SubstackPublishResult {
  published: boolean;
  externalUrl?: string;
  mock: boolean;
  error?: string;
}

export class SubstackAdapter extends ServiceAdapter {
  readonly name = "substack";
  readonly description = "Substack newsletter publishing via API";
  readonly requiredEnvVars = ["SUBSTACK_API_KEY"];

  private get apiKey(): string | undefined {
    return process.env["SUBSTACK_API_KEY"];
  }

  private get subdomain(): string {
    return process.env["SUBSTACK_SUBDOMAIN"] || "szlholdings";
  }

  override get status(): ServiceStatus {
    if (this.apiKey) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  override get isLive(): boolean {
    return !!this.apiKey;
  }

  override get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.apiKey) present.push("SUBSTACK_API_KEY");
    if (process.env["SUBSTACK_SUBDOMAIN"]) present.push("SUBSTACK_SUBDOMAIN");
    return present;
  }

  override get missingEnvVars(): string[] {
    return this.apiKey ? [] : ["SUBSTACK_API_KEY"];
  }

  protected override async performHealthCheck(): Promise<void> {
    if (!this.isLive) return;
    const res = await fetch(`https://${this.subdomain}.substack.com/api/v1/archive?limit=1`, {
      headers: { Cookie: `substack.sid=${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`Substack API health check failed: ${res.status}`);
  }

  async publishNewsletter(opts: {
    title: string;
    subtitle?: string;
    body: string;
    bodyFormat?: "html" | "markdown";
  }): Promise<SubstackPublishResult> {
    if (!this.isLive) {
      const slug = opts.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        published: true,
        externalUrl: `https://${this.subdomain}.substack.com/p/${slug}`,
        mock: true,
      };
    }

    try {
      const res = await fetch(`https://${this.subdomain}.substack.com/api/v1/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `substack.sid=${this.apiKey}`,
        },
        body: JSON.stringify({
          draft_title: opts.title,
          draft_subtitle: opts.subtitle || "",
          draft_body: opts.body,
          type: "newsletter",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { published: false, mock: false, error: `Substack API ${res.status}: ${err}` };
      }

      const data = (await res.json()) as { id?: number; slug?: string };
      const slug = data.slug || opts.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        published: true,
        externalUrl: `https://${this.subdomain}.substack.com/p/${slug}`,
        mock: false,
      };
    } catch (err) {
      return { published: false, mock: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
