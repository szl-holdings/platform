import { runNightlyEvals } from "./nightly-runner.js";
import { runEvalSuite } from "./runtime.js";
import { FORGE_SUITES, FORGE_SUITE_BY_ID } from "./suites/index.js";
import { ALL_EVAL_TYPES } from "./types.js";

function printHelp(): void {
  console.log("Usage: eval-forge <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  run <suite-id|all>  Run a specific suite or all suites");
  console.log("  list                List all available eval suites");
  console.log("  types               List all 10 eval types");
  console.log("");
  console.log("Options:");
  console.log("  --verbose, -v       Verbose output");
  console.log("  --eval-type <type>  Filter suites by eval type");
  console.log("  --domain <domain>   Filter suites by domain");
  console.log("");
  console.log("Available suites:");
  for (const s of FORGE_SUITES) {
    console.log(`  ${s.suiteId.padEnd(36)} [${s.evalType}] ${s.cases.length} cases — ${s.domain}`);
  }
}

function printList(): void {
  console.log(`\nEval Forge — ${FORGE_SUITES.length} suites across ${ALL_EVAL_TYPES.length} eval types\n`);
  console.log(`${"Suite ID".padEnd(36)} ${"Eval Type".padEnd(24)} ${"Domain".padEnd(16)} Cases  RedTeam`);
  console.log("-".repeat(100));
  for (const s of FORGE_SUITES) {
    const redTeam = s.cases.filter((c) => c.isRedTeam).length;
    console.log(
      `${s.suiteId.padEnd(36)} ${(s.evalType ?? "").padEnd(24)} ${s.domain.padEnd(16)} ${String(s.cases.length).padEnd(7)} ${redTeam > 0 ? `${redTeam} red-team` : "-"}`,
    );
  }
}

function printTypes(): void {
  console.log("\nAll 10 Eval Types:");
  ALL_EVAL_TYPES.forEach((t, i) => {
    const suite = FORGE_SUITES.find((s) => s.evalType === t);
    console.log(`  ${String(i + 1).padEnd(3)} ${t.padEnd(24)} ${suite ? `→ ${suite.suiteId}` : "(no suite)"}`);
  });
}

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0];
  const verbose = args.includes("--verbose") || args.includes("-v");

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    printList();
    return;
  }

  if (command === "types") {
    printTypes();
    return;
  }

  if (command === "run") {
    const suiteArg = args[1];
    const evalTypeFilter = args.find((a, i) => args[i - 1] === "--eval-type");
    const domainFilter = args.find((a, i) => args[i - 1] === "--domain");

    if (!suiteArg) {
      console.error("Error: suite-id or 'all' required");
      console.error("Usage: eval-forge run <suite-id|all> [--verbose]");
      process.exit(1);
    }

    let suitesToRun = FORGE_SUITES;

    if (suiteArg !== "all") {
      const found = FORGE_SUITE_BY_ID[suiteArg];
      if (!found) {
        console.error(`Suite not found: ${suiteArg}`);
        console.error(`Available: ${FORGE_SUITES.map((s) => s.suiteId).join(", ")}`);
        process.exit(1);
      }
      suitesToRun = [found];
    }

    if (evalTypeFilter) {
      suitesToRun = suitesToRun.filter((s) => s.evalType === evalTypeFilter);
    }
    if (domainFilter) {
      suitesToRun = suitesToRun.filter((s) => s.domain === domainFilter);
    }

    if (suitesToRun.length === 0) {
      console.error("No suites match the given filters.");
      process.exit(1);
    }

    const summary = await runNightlyEvals({
      suites: suitesToRun,
      triggeredBy: "cli",
      verbose: verbose || suitesToRun.length === 1,
    });

    if (!verbose && suitesToRun.length > 1) {
      console.log(`\nEval Forge run complete — ${summary.totalPassed}/${summary.totalCases} passed (${(summary.overallPassRate * 100).toFixed(1)}%)`);
      console.log(`Suites: ${summary.totalSuites} | Duration: ${summary.durationMs}ms`);
      if (summary.suitesWithRegression > 0) {
        console.log(`⚠️  ${summary.suitesWithRegression} suite(s) with regressions`);
      }
    }

    if (summary.criticalRegressions.length > 0) {
      process.exit(2);
    }
    if (summary.suitesWithRegression > 0) {
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

const isMain =
  process.argv[1] != null &&
  (process.argv[1].endsWith("cli.ts") ||
    process.argv[1].endsWith("cli.js") ||
    process.argv[1].endsWith("eval-forge"));

if (isMain) {
  runCli(process.argv.slice(2)).catch((err) => {
    console.error("[Eval Forge] Fatal error:", err);
    process.exit(1);
  });
}
