import { createLogger } from "./logger.js";

const logger = createLogger("prompt-registry:registry");

export type PromptStatus = "draft" | "review" | "active" | "deprecated" | "archived";

export interface PromptVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  defaultValue?: unknown;
}

export interface PromptVersion {
  versionId: string;
  version: number;
  template: string;
  systemPrompt?: string;
  variables: PromptVariable[];
  modelHints: {
    preferredProvider?: string;
    preferredModel?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
  status: PromptStatus;
  createdAt: string;
  createdBy?: string;
  changelog?: string;
  evalMetadata?: PromptEvalMetadata;
  tags: string[];
}

export interface PromptEvalMetadata {
  lastEvalAt?: string;
  score?: number;
  passRate?: number;
  avgLatencyMs?: number;
  sampleCount?: number;
  evalSuite?: string;
  passedCases?: number;
  failedCases?: number;
  comparedTo?: string;
  improvement?: number;
}

export interface PromptDefinition {
  id: string;
  name: string;
  description: string;
  domain: string;
  routeClass: string;
  activeVersionId: string | null;
  versions: PromptVersion[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

function makeVersionId(promptId: string, version: number): string {
  return `${promptId}@v${version}`;
}

class PromptRegistry {
  private prompts: Map<string, PromptDefinition> = new Map();

  create(params: {
    id: string;
    name: string;
    description: string;
    domain: string;
    routeClass: string;
    template: string;
    systemPrompt?: string;
    variables?: PromptVariable[];
    modelHints?: PromptVersion["modelHints"];
    tags?: string[];
    createdBy?: string;
  }): PromptDefinition {
    if (this.prompts.has(params.id)) {
      throw new Error(`Prompt '${params.id}' already exists — use addVersion() to add a new version`);
    }

    const version: PromptVersion = {
      versionId: makeVersionId(params.id, 1),
      version: 1,
      template: params.template,
      systemPrompt: params.systemPrompt,
      variables: params.variables ?? [],
      modelHints: params.modelHints ?? {},
      status: "draft",
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy,
      tags: params.tags ?? [],
    };

    const prompt: PromptDefinition = {
      id: params.id,
      name: params.name,
      description: params.description,
      domain: params.domain,
      routeClass: params.routeClass,
      activeVersionId: null,
      versions: [version],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: params.tags ?? [],
    };

    this.prompts.set(params.id, prompt);
    logger.info({ id: params.id, version: 1 }, "Prompt created");
    return prompt;
  }

  addVersion(
    id: string,
    params: {
      template: string;
      systemPrompt?: string;
      variables?: PromptVariable[];
      modelHints?: PromptVersion["modelHints"];
      changelog?: string;
      createdBy?: string;
      tags?: string[];
    },
  ): PromptVersion {
    const prompt = this.prompts.get(id);
    if (!prompt) throw new Error(`Prompt '${id}' not found`);

    const nextVersion = Math.max(...prompt.versions.map(v => v.version)) + 1;
    const version: PromptVersion = {
      versionId: makeVersionId(id, nextVersion),
      version: nextVersion,
      template: params.template,
      systemPrompt: params.systemPrompt,
      variables: params.variables ?? prompt.versions[prompt.versions.length - 1]?.variables ?? [],
      modelHints: params.modelHints ?? prompt.versions[prompt.versions.length - 1]?.modelHints ?? {},
      status: "draft",
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy,
      changelog: params.changelog,
      tags: params.tags ?? [],
    };

    prompt.versions.push(version);
    prompt.updatedAt = new Date().toISOString();
    logger.info({ id, version: nextVersion }, "Prompt version added");
    return version;
  }

  promote(id: string, versionId: string): PromptDefinition {
    const prompt = this.prompts.get(id);
    if (!prompt) throw new Error(`Prompt '${id}' not found`);

    const version = prompt.versions.find(v => v.versionId === versionId);
    if (!version) throw new Error(`Version '${versionId}' not found`);

    const previousActive = prompt.versions.find(v => v.versionId === prompt.activeVersionId);
    if (previousActive) previousActive.status = "deprecated";

    version.status = "active";
    prompt.activeVersionId = versionId;
    prompt.updatedAt = new Date().toISOString();
    logger.info({ id, versionId }, "Prompt promoted to active");
    return prompt;
  }

  setStatus(id: string, versionId: string, status: PromptStatus): void {
    const prompt = this.prompts.get(id);
    if (!prompt) throw new Error(`Prompt '${id}' not found`);
    const version = prompt.versions.find(v => v.versionId === versionId);
    if (!version) throw new Error(`Version '${versionId}' not found`);
    version.status = status;
    prompt.updatedAt = new Date().toISOString();
  }

  updateEvalMetadata(id: string, versionId: string, evalMetadata: PromptEvalMetadata): void {
    const prompt = this.prompts.get(id);
    if (!prompt) throw new Error(`Prompt '${id}' not found`);
    const version = prompt.versions.find(v => v.versionId === versionId);
    if (!version) throw new Error(`Version '${versionId}' not found`);
    version.evalMetadata = { ...version.evalMetadata, ...evalMetadata, lastEvalAt: new Date().toISOString() };
  }

  get(id: string): PromptDefinition | undefined {
    return this.prompts.get(id);
  }

  getActiveVersion(id: string): PromptVersion | undefined {
    const prompt = this.prompts.get(id);
    if (!prompt || !prompt.activeVersionId) return undefined;
    return prompt.versions.find(v => v.versionId === prompt.activeVersionId);
  }

  getVersion(id: string, versionId: string): PromptVersion | undefined {
    return this.prompts.get(id)?.versions.find(v => v.versionId === versionId);
  }

  getEffectiveStatus(prompt: PromptDefinition): PromptStatus {
    if (prompt.activeVersionId) {
      const activeVersion = prompt.versions.find(v => v.versionId === prompt.activeVersionId);
      if (activeVersion) return activeVersion.status;
    }
    const latest = prompt.versions[prompt.versions.length - 1];
    return latest?.status ?? "draft";
  }

  list(filters: { domain?: string; routeClass?: string; status?: PromptStatus; tags?: string[] } = {}): PromptDefinition[] {
    let results = Array.from(this.prompts.values());
    if (filters.domain) results = results.filter(p => p.domain === filters.domain);
    if (filters.routeClass) results = results.filter(p => p.routeClass === filters.routeClass);
    if (filters.status) results = results.filter(p => this.getEffectiveStatus(p) === filters.status);
    if (filters.tags?.length) results = results.filter(p => filters.tags!.some(t => p.tags.includes(t)));
    return results;
  }

  delete(id: string): boolean {
    return this.prompts.delete(id);
  }
}

export const promptRegistry = new PromptRegistry();
export { PromptRegistry };
