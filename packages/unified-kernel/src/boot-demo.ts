/**
 * boot-demo.ts — runnable boot of the unified kernel.
 *
 *   pnpm boot   (=> tsx src/boot-demo.ts)
 *
 * Prints every check's REAL pass/fail, the signed kernel-init receipt header,
 * a signature re-verification, and the module registry. This is the artifact
 * captured in DEMO_RUNBOOK.md. No fabricated output — everything is computed by
 * kernel.start().
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

import { start, verifyInitReceipt } from "./kernel.ts";

async function main(): Promise<void> {
  // Measure the REAL kernel init time. The canonical Λ-axis paragraph claims a
  // 0.59 ms/request median Λ overhead in the ouroboros bench harness; that is a
  // per-request Λ-operator figure, NOT the full kernel boot. We measure and
  // report the actual boot here — no faked 0.59 ms (Doctrine v11 LOCKED 749/14/163 §2 — no fabrication).
  const t0 = performance.now();
  const handle = await start();
  const bootMs = performance.now() - t0;
  const r = handle.initReceipt;

  // eslint-disable-next-line no-console
  console.log("=".repeat(72));
  console.log("@szl-holdings/unified-kernel — boot");
  console.log("=".repeat(72));

  console.log(`\nstatus: ${handle.status}`);
  console.log(`receiptId: ${r.receiptId}`);
  console.log(`schema: ${r.schema}`);
  console.log(`timestamp: ${r.timestampIso}`);

  console.log("\nchecks (real pass/fail):");
  for (const c of r.checks) {
    const mark = c.pass ? "PASS" : "FAIL";
    console.log(`  [${mark}] ${c.thesis} ${c.name}  (${c.durationMs.toFixed(2)}ms)`);
    console.log(`         ${c.detail}`);
  }

  console.log("\nsigned receipt:");
  console.log(`  sigAlg:    ${r.sigAlg}`);
  console.log(`  bodyHash:  ${r.bodyHash}`);
  console.log(`  prevHash:  ${r.prevHash ?? "GENESIS"}`);
  console.log(`  publicKey: ${r.publicKey.slice(0, 32)}…`);
  console.log(`  signature: ${r.signature.slice(0, 32)}…`);
  console.log(`  verify():  ${verifyInitReceipt(r) ? "VALID" : "INVALID"}`);

  console.log("\nmodule registry (19 theses):");
  for (const m of r.modules) {
    const need = m.needs ? `  needs: ${m.needs}` : "";
    console.log(`  ${m.thesis}  ${m.dir.padEnd(16)} ${m.censusStatus.padEnd(8)} ${m.backing}${need}`);
  }

  const passed = r.checks.filter((c) => c.pass).length;
  console.log(`\nsummary: ${passed}/${r.checks.length} checks passed; kernel status ${handle.status}`);
  // Real measured boot time (not the 0.59 ms/request Λ-overhead claim).
  console.log(`boot time (measured): ${bootMs.toFixed(3)} ms (full kernel init)`);
  console.log("=".repeat(72));

  // Real exit code: non-zero on FAIL so CI/that demo reflects reality.
  if (handle.status === "FAIL") process.exitCode = 1;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("boot crashed:", err);
  process.exitCode = 2;
});
