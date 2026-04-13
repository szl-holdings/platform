import { ensurePlatformFlags } from "../lib/platform-flags";

async function main() {
  console.log("[seed-platform-flags] Seeding platform feature flags...");
  await ensurePlatformFlags();
  console.log("[seed-platform-flags] Platform feature flags seeded.");
  process.exit(0);
}

main().catch(err => {
  console.error("[seed-platform-flags] Seed failed:", err);
  process.exit(1);
});
