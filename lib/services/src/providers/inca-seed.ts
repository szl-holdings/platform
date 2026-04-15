import type { DataProvider } from "./factory.js";

export interface IncaModel {
  id: string;
  name: string;
  type: "llm" | "vision" | "embedding" | "multimodal";
  status: "training" | "ready" | "deprecated" | "evaluating";
  version: string;
  accuracy: number;
  parameters: string;
  lastTrained: string;
  description: string;
}

const SEED_DATA: IncaModel[] = [
  {
    id: "m-001",
    name: "INCA-Maritime-v3",
    type: "llm",
    status: "ready",
    version: "3.2.1",
    accuracy: 0.94,
    parameters: "7B",
    lastTrained: "2026-03-15T00:00:00Z",
    description: "Maritime operations language model for route optimization and risk analysis",
  },
  {
    id: "m-002",
    name: "INCA-Vision-Cargo",
    type: "vision",
    status: "training",
    version: "1.0.0-beta",
    accuracy: 0.87,
    parameters: "2.1B",
    lastTrained: "2026-03-20T00:00:00Z",
    description: "Computer vision model for cargo inspection and classification",
  },
  {
    id: "m-003",
    name: "INCA-Embed-Docs",
    type: "embedding",
    status: "ready",
    version: "2.0.0",
    accuracy: 0.96,
    parameters: "350M",
    lastTrained: "2026-03-10T00:00:00Z",
    description: "Document embedding model for semantic search across enterprise knowledge base",
  },
];

export const incaSeedProvider: DataProvider<IncaModel> = {
  mode: "seed",
  async getAll() {
    return SEED_DATA;
  },
  async getById(id: string) {
    return SEED_DATA.find((m) => m.id === id) ?? null;
  },
  async search(query: string) {
    const q = query.toLowerCase();
    return SEED_DATA.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.type.includes(q),
    );
  },
};
