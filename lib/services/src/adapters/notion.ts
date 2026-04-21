import { ServiceAdapter } from "../base.js";

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
  createdTime: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  properties: Record<string, string>;
}

const MOCK_PAGES: NotionPage[] = [
  {
    id: "page_mock_001",
    title: "Q1 2026 Portfolio Review",
    url: "https://notion.so/mock/q1-review",
    lastEdited: "2026-03-20T10:00:00Z",
    createdTime: "2026-01-05T09:00:00Z",
  },
  {
    id: "page_mock_002",
    title: "SZL Holdings Strategy Doc",
    url: "https://notion.so/mock/strategy",
    lastEdited: "2026-03-15T14:30:00Z",
    createdTime: "2025-11-01T08:00:00Z",
  },
];

const MOCK_DATABASES: NotionDatabase[] = [
  {
    id: "db_mock_001",
    title: "Project Tracker",
    url: "https://notion.so/mock/project-tracker",
    properties: { Status: "select", Priority: "select", Assignee: "people", DueDate: "date" },
  },
];

export class NotionAdapter extends ServiceAdapter {
  readonly name = "notion";
  readonly description = "Notion workspace pages and databases";
  readonly requiredEnvVars = ["NOTION_API_KEY"];

  protected override async performHealthCheck(): Promise<void> {
    const apiKey = process.env["NOTION_API_KEY"];
    const response = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!response.ok) throw new Error(`Notion API returned ${response.status}`);
  }

  private get apiKey(): string | undefined {
    return process.env["NOTION_API_KEY"];
  }

  private async notionRequest(path: string, options?: RequestInit): Promise<unknown> {
    const response = await fetch(`https://api.notion.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    return response.json();
  }

  async listPages(): Promise<NotionPage[]> {
    if (!this.isLive) {
      return [...MOCK_PAGES];
    }

    const data = (await this.notionRequest("/search", {
      method: "POST",
      body: JSON.stringify({ filter: { property: "object", value: "page" }, page_size: 20 }),
    })) as {
      results: Array<{
        id: string;
        url: string;
        last_edited_time: string;
        created_time: string;
        properties: Record<string, { title?: Array<{ plain_text: string }> }>;
      }>;
    };

    return data.results.map((p) => {
      const titleProp = Object.values(p.properties).find((v) => v.title);
      return {
        id: p.id,
        title: titleProp?.title?.[0]?.plain_text ?? "Untitled",
        url: p.url,
        lastEdited: p.last_edited_time,
        createdTime: p.created_time,
      };
    });
  }

  async listDatabases(): Promise<NotionDatabase[]> {
    if (!this.isLive) {
      return [...MOCK_DATABASES];
    }

    const data = (await this.notionRequest("/search", {
      method: "POST",
      body: JSON.stringify({ filter: { property: "object", value: "database" }, page_size: 20 }),
    })) as {
      results: Array<{
        id: string;
        url: string;
        title: Array<{ plain_text: string }>;
        properties: Record<string, { type: string }>;
      }>;
    };

    return data.results.map((d) => ({
      id: d.id,
      title: d.title[0]?.plain_text ?? "Untitled",
      url: d.url,
      properties: Object.fromEntries(
        Object.entries(d.properties).map(([k, v]) => [k, v.type]),
      ),
    }));
  }
}
