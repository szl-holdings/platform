#!/usr/bin/env tsx
/**
 * Signal Mesh Seed CLI
 *
 * Boots the signal mesh with synthetic scenarios and starts all connector
 * adapters emitting a live signal stream.
 *
 * Usage:
 *   pnpm --filter @workspace/demo-seed run seed:mesh
 *   pnpm --filter @workspace/demo-seed run seed:mesh --no-connectors
 */

import { seedSignalMesh } from "./seed-signal-mesh.js";
import { defaultSignalBus } from "@szl-holdings/signal-mesh";
import { defaultRecommendationStore, defaultEvidenceStore } from "@szl-holdings/evidence-graph";
import { defaultEntityRegistry } from "@workspace/ontology";

const startConnectors = !process.argv.includes("--no-connectors");

console.log("╔═══════════════════════════════════════════════════╗");
console.log("║  SZL Holdings — Signal Mesh Boot                 ║");
console.log("╚═══════════════════════════════════════════════════╝");
console.log("");

const stats = await seedSignalMesh({ startConnectors });

console.log("");
console.log("✅ Signal Mesh Ready");
console.log("──────────────────────────────────────────────────");
console.log(`  Signals seeded:        ${stats.signalsSeeded}`);
console.log(`  Evidence items:        ${stats.evidenceItemsSeeded}`);
console.log(`  Recommendations:       ${stats.recommendationsSeeded}`);
console.log(`  Entities registered:   ${stats.entitiesRegistered}`);
console.log(`  Connectors started:    ${stats.connectorsStarted}`);
console.log("");
console.log("  Bus signals buffered:  " + defaultSignalBus.count());
console.log("  Evidence graph items:  " + defaultEvidenceStore.count());
console.log("  Recommendations:       " + defaultRecommendationStore.count());
console.log("  Entity snapshots:      " + defaultEntityRegistry.count());
console.log("");
console.log("  Evidence graph read API exposed at:");
console.log("    GET /api/evidence-graph/recommendations");
console.log("    GET /api/evidence-graph/recommendations/:id");
console.log("    GET /api/evidence-graph/why/:entityId");
console.log("    GET /api/evidence-graph/signals");
console.log("");

if (startConnectors) {
  console.log("  Connector adapters running — press Ctrl+C to stop");
  process.on("SIGINT", async () => {
    console.log("\n[seed-mesh] Shutting down connectors...");
    process.exit(0);
  });
} else {
  console.log("  Connector adapters not started (--no-connectors flag)");
  process.exit(0);
}
