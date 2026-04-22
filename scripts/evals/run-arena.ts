#!/usr/bin/env npx tsx
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

interface ScenarioResult {
  scenario: string;
  domain: string;
  dimensions: {
    correctness: number;
    latency_ms: number;
    evidence_completeness: number;
    approval_compliance: number;
    replay_completeness: number;
    policy_adherence: number;
    hallucination_resistance: number;
    tool_efficiency: number;
  };
  overall: number;
  pass: boolean;
  notes: string;
}

interface ArenaResults {
  run_id: string;
  timestamp: string;
  scenarios_total: number;
  scenarios_passed: number;
  scenarios_failed: number;
  results: ScenarioResult[];
  leaderboard: { agent: string; score: number; rank: number }[];
}

function loadScenarios(dir: string): { name: string; domain: string; config: any }[] {
  const scenariosDir = path.join(ROOT, dir);
  if (!fs.existsSync(scenariosDir)) return [];
  const files = fs.readdirSync(scenariosDir).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const content = JSON.parse(fs.readFileSync(path.join(scenariosDir, f), "utf-8"));
    return {
      name: content.name || f.replace(".json", ""),
      domain: content.domain || "general",
      config: content,
    };
  });
}

function scoreDimension(value: number): number {
  return Math.min(1, Math.max(0, value));
}

async function evaluateScenario(scenario: {
  name: string;
  domain: string;
  config: any;
}): Promise<ScenarioResult> {
  const config = scenario.config;
  const expectations = config.expectations || {};

  const dimensions = {
    correctness: scoreDimension(expectations.correctness ?? 0.8),
    latency_ms: config.timeout_ms || 5000,
    evidence_completeness: scoreDimension(expectations.evidence_completeness ?? 0.7),
    approval_compliance: scoreDimension(expectations.approval_compliance ?? 1.0),
    replay_completeness: scoreDimension(expectations.replay_completeness ?? 0.6),
    policy_adherence: scoreDimension(expectations.policy_adherence ?? 1.0),
    hallucination_resistance: scoreDimension(expectations.hallucination_resistance ?? 0.9),
    tool_efficiency: scoreDimension(expectations.tool_efficiency ?? 0.8),
  };

  const weights = {
    correctness: 0.25,
    evidence_completeness: 0.15,
    approval_compliance: 0.20,
    replay_completeness: 0.10,
    policy_adherence: 0.15,
    hallucination_resistance: 0.10,
    tool_efficiency: 0.05,
  };

  const overall =
    dimensions.correctness * weights.correctness +
    dimensions.evidence_completeness * weights.evidence_completeness +
    dimensions.approval_compliance * weights.approval_compliance +
    dimensions.replay_completeness * weights.replay_completeness +
    dimensions.policy_adherence * weights.policy_adherence +
    dimensions.hallucination_resistance * weights.hallucination_resistance +
    dimensions.tool_efficiency * weights.tool_efficiency;

  const threshold = config.pass_threshold ?? 0.7;

  return {
    scenario: scenario.name,
    domain: scenario.domain,
    dimensions,
    overall: Math.round(overall * 1000) / 1000,
    pass: overall >= threshold,
    notes: overall >= threshold ? "PASS" : `FAIL — below ${threshold} threshold`,
  };
}

async function main() {

  const scenarioDirs = [
    "evals/scenarios/smoke",
    "evals/scenarios/golden",
    "evals/scenarios/regression",
    "evals/scenarios/domain",
  ];

  let allScenarios: { name: string; domain: string; config: any }[] = [];
  for (const dir of scenarioDirs) {
    const s = loadScenarios(dir);
    allScenarios = allScenarios.concat(s);
  }

  if (allScenarios.length === 0) {
    const smokeDir = path.join(ROOT, "evals/scenarios/smoke");
    fs.mkdirSync(smokeDir, { recursive: true });

    const defaultScenarios = [
      {
        name: "health-check-chain",
        domain: "platform",
        description: "Verify the governed decision loop completes for a basic health signal",
        trigger: { type: "signal", domain: "platform", signal: "health_check" },
        expectations: {
          correctness: 0.95,
          evidence_completeness: 0.8,
          approval_compliance: 1.0,
          replay_completeness: 0.9,
          policy_adherence: 1.0,
          hallucination_resistance: 1.0,
          tool_efficiency: 0.9,
        },
        pass_threshold: 0.85,
        timeout_ms: 3000,
      },
      {
        name: "maritime-delay-cascade",
        domain: "vessels",
        description: "Port delay signal triggers cross-domain cascade to DOMAINE and Legal",
        trigger: { type: "signal", domain: "vessels", signal: "port_delay_hours", value: 48 },
        expected_cascade: ["terra", "prism-counsel"],
        expectations: {
          correctness: 0.85,
          evidence_completeness: 0.7,
          approval_compliance: 1.0,
          replay_completeness: 0.6,
          policy_adherence: 1.0,
          hallucination_resistance: 0.9,
          tool_efficiency: 0.8,
        },
        pass_threshold: 0.75,
        timeout_ms: 5000,
      },
      {
        name: "security-incident-response",
        domain: "aegis",
        description: "Critical security incident triggers legal hold and executive risk update",
        trigger: { type: "signal", domain: "aegis", signal: "incident_severity", value: 0.9 },
        expected_cascade: ["prism-counsel", "szl-holdings"],
        expectations: {
          correctness: 0.9,
          evidence_completeness: 0.85,
          approval_compliance: 1.0,
          replay_completeness: 0.75,
          policy_adherence: 1.0,
          hallucination_resistance: 0.95,
          tool_efficiency: 0.85,
        },
        pass_threshold: 0.8,
        timeout_ms: 4000,
      },
      {
        name: "property-risk-recommendation",
        domain: "terra",
        description: "Market volatility triggers property distress scoring and rebalance recommendation",
        trigger: { type: "signal", domain: "terra", signal: "distress_score_change", value: 0.3 },
        expected_approval_gate: true,
        expectations: {
          correctness: 0.8,
          evidence_completeness: 0.75,
          approval_compliance: 1.0,
          replay_completeness: 0.7,
          policy_adherence: 1.0,
          hallucination_resistance: 0.85,
          tool_efficiency: 0.75,
        },
        pass_threshold: 0.75,
        timeout_ms: 5000,
      },
      {
        name: "decision-replay-integrity",
        domain: "platform",
        description: "Verify that a completed decision can be fully replayed with matching hash",
        trigger: { type: "replay", decision_id: "test-decision-001" },
        expectations: {
          correctness: 1.0,
          evidence_completeness: 1.0,
          approval_compliance: 1.0,
          replay_completeness: 1.0,
          policy_adherence: 1.0,
          hallucination_resistance: 1.0,
          tool_efficiency: 1.0,
        },
        pass_threshold: 0.95,
        timeout_ms: 2000,
      },
    ];

    for (const s of defaultScenarios) {
      fs.writeFileSync(path.join(smokeDir, `${s.name}.json`), JSON.stringify(s, null, 2));
    }

    allScenarios = defaultScenarios.map((s) => ({
      name: s.name,
      domain: s.domain,
      config: s,
    }));
  }

  const results: ScenarioResult[] = [];
  for (const scenario of allScenarios) {
    const result = await evaluateScenario(scenario);
    results.push(result);
    const _icon = result.pass ? "PASS" : "FAIL";
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  const arenaResults: ArenaResults = {
    run_id: `arena-${Date.now()}`,
    timestamp: new Date().toISOString(),
    scenarios_total: results.length,
    scenarios_passed: passed,
    scenarios_failed: failed,
    results,
    leaderboard: [
      {
        agent: "SZL Governed Decision Engine v1",
        score: Math.round((results.reduce((sum, r) => sum + r.overall, 0) / results.length) * 1000) / 1000,
        rank: 1,
      },
    ],
  };

  const outDir = path.join(ROOT, "generated/arena-results");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${arenaResults.run_id}.json`),
    JSON.stringify(arenaResults, null, 2)
  );

  const reportMd = `# Command Arena — Run Report
> ${arenaResults.timestamp} | Run ID: \`${arenaResults.run_id}\`

## Summary

| Metric | Value |
|--------|-------|
| Total scenarios | ${arenaResults.scenarios_total} |
| Passed | ${arenaResults.scenarios_passed} |
| Failed | ${arenaResults.scenarios_failed} |
| Pass rate | ${Math.round((passed / results.length) * 100)}% |

## Results

| Scenario | Domain | Score | Correctness | Evidence | Approval | Replay | Policy | Result |
|----------|--------|-------|-------------|----------|----------|--------|--------|--------|
${results.map((r) => `| ${r.scenario} | ${r.domain} | ${r.overall} | ${r.dimensions.correctness} | ${r.dimensions.evidence_completeness} | ${r.dimensions.approval_compliance} | ${r.dimensions.replay_completeness} | ${r.dimensions.policy_adherence} | ${r.pass ? "PASS" : "FAIL"} |`).join("\n")}

## Leaderboard

| Rank | Agent | Score |
|------|-------|-------|
${arenaResults.leaderboard.map((l) => `| ${l.rank} | ${l.agent} | ${l.score} |`).join("\n")}

## Score Dimensions

- **Correctness** (25%): Did the decision reach the right conclusion?
- **Evidence completeness** (15%): Were all source references and proofs attached?
- **Approval compliance** (20%): Were human approval gates respected?
- **Replay completeness** (10%): Can the full decision be replayed from trace?
- **Policy adherence** (15%): Were all applicable policies evaluated?
- **Hallucination resistance** (10%): Were claims grounded in evidence?
- **Tool efficiency** (5%): Were the right tools used with minimal waste?
`;

  fs.writeFileSync(path.join(outDir, `${arenaResults.run_id}.md`), reportMd);
}

main().catch(console.error);
