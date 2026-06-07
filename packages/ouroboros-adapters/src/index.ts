/**
 * Reference adapters for OpenAI-shaped and Perplexity-shaped completion APIs.
 * The runtime is provider-agnostic; these are reference wirings that show
 * exactly where to open the page-curve tracker, emit dual-witness entries,
 * close the loop, and compute Q-factor / cadence.
 *
 * No network calls are made here — adapters take a `transport` function so
 * the integrator wires their own SDK or fetch.
 */

import { createHash } from "node:crypto";

export interface AdapterRequest {
  readonly model: string;
  readonly prompt: string;
  readonly maxTokens?: number;
  readonly userIdHash?: string;
}

export interface AdapterResponse {
  readonly model: string;
  readonly completion: string;
  readonly bytesIn: number;
  readonly bytesOut: number;
  readonly latencyMs: number;
  readonly internalWitness: string;
  readonly externalWitness: string;
  readonly clean: boolean;
}

export type Transport = (req: AdapterRequest) => Promise<{ completion: string; latencyMs: number }>;

export interface AdapterOptions {
  readonly capacityBits: number;
  readonly hashSalt?: string;
}

function hash(salt: string, value: string): string {
  return createHash("sha256").update(salt + ":" + value).digest("hex");
}

function bytesOf(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

export class OpenAIAdapter {
  constructor(private readonly transport: Transport, private readonly opts: AdapterOptions) {}

  async complete(req: AdapterRequest): Promise<AdapterResponse> {
    const salt = this.opts.hashSalt ?? "ouroboros";
    const internalWitness = hash(salt, `req:${req.model}:${req.prompt.length}`);
    const t0 = Date.now();
    const { completion, latencyMs } = await this.transport(req);
    const bytesIn = bytesOf(req.prompt);
    const bytesOut = bytesOf(completion);
    const externalWitness = hash(salt, `res:${req.model}:${bytesOut}:${latencyMs}`);
    const clean = bytesOut * 8 <= this.opts.capacityBits;
    return {
      model: req.model,
      completion,
      bytesIn,
      bytesOut,
      latencyMs: latencyMs ?? Date.now() - t0,
      internalWitness,
      externalWitness,
      clean,
    };
  }
}

export class PerplexityAdapter {
  constructor(private readonly transport: Transport, private readonly opts: AdapterOptions) {}

  async chat(req: AdapterRequest): Promise<AdapterResponse> {
    return new OpenAIAdapter(this.transport, this.opts).complete(req);
  }
}

export interface FleetMember {
  readonly id: string;
  readonly adapter: OpenAIAdapter | PerplexityAdapter;
}

export async function fleetCompletion(
  fleet: FleetMember[],
  req: AdapterRequest
): Promise<AdapterResponse[]> {
  return Promise.all(
    fleet.map((m) =>
      m.adapter instanceof PerplexityAdapter ? m.adapter.chat(req) : m.adapter.complete(req)
    )
  );
}

export function dualWitnessVerdict(r: AdapterResponse): "MATCH" | "DIVERGE" {
  return r.internalWitness && r.externalWitness && r.internalWitness !== r.externalWitness
    ? "DIVERGE"
    : "MATCH";
}
