import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface XPostResult {
  posted: boolean;
  externalPostId?: string | undefined;
  externalPostUrl?: string | undefined;
  mock: boolean;
  error?: string | undefined;
}

export class XTwitterAdapter extends ServiceAdapter {
  readonly name = "x-twitter";
  readonly description = "X (Twitter) API v2 for posting tweets and threads";
  readonly requiredEnvVars = ["X_BEARER_TOKEN"];

  private get bearerToken(): string | undefined {
    return process.env.X_BEARER_TOKEN;
  }

  private get apiKey(): string | undefined {
    return process.env.X_API_KEY;
  }

  private get apiSecret(): string | undefined {
    return process.env.X_API_SECRET;
  }

  private get accessToken(): string | undefined {
    return process.env.X_ACCESS_TOKEN;
  }

  private get accessSecret(): string | undefined {
    return process.env.X_ACCESS_SECRET;
  }

  override get status(): ServiceStatus {
    if (this.accessToken && this.accessSecret && this.apiKey && this.apiSecret) return "LIVE_CONFIGURED";
    if (this.bearerToken) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  override get isLive(): boolean {
    return !!(this.accessToken && this.accessSecret) || !!this.bearerToken;
  }

  override get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.bearerToken) present.push("X_BEARER_TOKEN");
    if (this.apiKey) present.push("X_API_KEY");
    if (this.apiSecret) present.push("X_API_SECRET");
    if (this.accessToken) present.push("X_ACCESS_TOKEN");
    if (this.accessSecret) present.push("X_ACCESS_SECRET");
    return present;
  }

  override get missingEnvVars(): string[] {
    if (this.isLive) return [];
    return ["X_BEARER_TOKEN (or X_API_KEY + X_API_SECRET + X_ACCESS_TOKEN + X_ACCESS_SECRET)"];
  }

  protected override async performHealthCheck(): Promise<void> {
    if (!this.isLive) return;
    const res = await fetch("https://api.x.com/2/users/me", {
      headers: { Authorization: `Bearer ${this.bearerToken || this.accessToken}` },
    });
    if (!res.ok) throw new Error(`X API health check failed: ${res.status}`);
  }

  async postTweet(text: string): Promise<XPostResult> {
    if (!this.isLive) {
      const mockId = `mock_${Date.now()}`;
      return {
        posted: true,
        externalPostId: mockId,
        externalPostUrl: `https://x.com/szlholdings/status/${mockId}`,
        mock: true,
      };
    }

    try {
      const res = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { posted: false, mock: false, error: `X API ${res.status}: ${err}` };
      }

      const data = (await res.json()) as { data?: { id: string } };
      const tweetId = data.data?.id;
      return {
        posted: true,
        externalPostId: tweetId,
        externalPostUrl: tweetId ? `https://x.com/szlholdings/status/${tweetId}` : undefined,
        mock: false,
      };
    } catch (err) {
      return { posted: false, mock: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async postThread(tweets: string[]): Promise<XPostResult[]> {
    const results: XPostResult[] = [];
    let replyToId: string | undefined;

    for (const text of tweets) {
      if (!this.isLive) {
        const mockId = `mock_thread_${Date.now()}_${results.length}`;
        results.push({
          posted: true,
          externalPostId: mockId,
          externalPostUrl: `https://x.com/szlholdings/status/${mockId}`,
          mock: true,
        });
        replyToId = mockId;
        continue;
      }

      try {
        const body: Record<string, unknown> = { text };
        if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

        const res = await fetch("https://api.x.com/2/tweets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.text();
          results.push({ posted: false, mock: false, error: `X API ${res.status}: ${err}` });
          break;
        }

        const data = (await res.json()) as { data?: { id: string } };
        const tweetId = data.data?.id;
        replyToId = tweetId;
        results.push({
          posted: true,
          externalPostId: tweetId,
          externalPostUrl: tweetId ? `https://x.com/szlholdings/status/${tweetId}` : undefined,
          mock: false,
        });
      } catch (err) {
        results.push({ posted: false, mock: false, error: err instanceof Error ? err.message : String(err) });
        break;
      }
    }

    return results;
  }
}
