import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface ThoughtBranch {
  branchId: string;
  thought: string;
  evaluation: number;
  depth: number;
  children: ThoughtBranch[];
  selected: boolean;
}

export interface TreeOfThoughtResult {
  query: string;
  selectedPath: string[];
  allBranches: ThoughtBranch[];
  finalReasoning: string;
  confidence: number;
  latencyMs: number;
}

export interface PlanCritiqueResult {
  originalPlan: string;
  critique: string;
  revisedPlan: string;
  iterations: number;
  confidence: number;
  latencyMs: number;
}

export interface MonteCarloSimulation {
  simulationId: string;
  actionPath: string[];
  simulatedOutcome: string;
  successProbability: number;
  risks: string[];
}

export interface MonteCarloResult {
  query: string;
  simulations: MonteCarloSimulation[];
  selectedPath: string[];
  expectedOutcome: string;
  confidence: number;
  latencyMs: number;
}

export interface PlanningTrace {
  planningMode: "direct" | "react" | "tot" | "plan_critique" | "monte_carlo";
  steps: Array<{
    step: number;
    type: string;
    content: string;
    evaluation?: number;
  }>;
  selectedStrategy: string;
  totalLatencyMs: number;
  confidence: number;
}

export async function runTreeOfThought(
  query: string,
  systemContext: string,
  options: { branches?: number; depth?: number } = {}
): Promise<TreeOfThoughtResult> {
  const startTime = Date.now();
  const numBranches = options.branches ?? 3;
  const maxDepth = options.depth ?? 2;

  const branchPrompt = `You are reasoning through a complex problem using Tree of Thought.
Generate ${numBranches} distinct reasoning approaches for this query. Each should explore a different angle or strategy.
Respond with JSON array:
[
  {"thought": "approach description", "rationale": "why this angle"},
  ...
]`;

  let branches: ThoughtBranch[] = [];
  try {
    const branchResponse = await gatewayInfer({
      messages: [
        { role: "system", content: systemContext + "\n\n" + branchPrompt },
        { role: "user", content: query },
      ],
      maxTokens: 800,
      strategy: "preferred",
    });

    const match = branchResponse.content.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      branches = parsed.map((b: any, i: number) => ({
        branchId: `branch_${i}`,
        thought: b.thought || b.rationale || String(b),
        evaluation: 0,
        depth: 0,
        children: [],
        selected: false,
      }));
    }
  } catch {
    branches = [
      { branchId: "branch_0", thought: "Direct analytical approach", evaluation: 0, depth: 0, children: [], selected: false },
      { branchId: "branch_1", thought: "First-principles reasoning approach", evaluation: 0, depth: 0, children: [], selected: false },
      { branchId: "branch_2", thought: "Risk-aware strategic approach", evaluation: 0, depth: 0, children: [], selected: false },
    ];
  }

  const evalPrompt = `Rate each of these reasoning approaches on a scale of 0-10 for solving the user's query. Consider completeness, feasibility, and quality.
Approaches:
${branches.map((b, i) => `${i + 1}. ${b.thought}`).join("\n")}

Respond with JSON: {"scores": [n, n, n], "bestIndex": n, "reasoning": "why"}`;

  let bestIndex = 0;
  let scores = branches.map(() => 5);
  let evalReasoning = "";

  try {
    const evalResponse = await gatewayInfer({
      messages: [
        { role: "system", content: evalPrompt },
        { role: "user", content: `Query: ${query}` },
      ],
      maxTokens: 300,
      strategy: "cheapest",
    });

    const evalMatch = evalResponse.content.match(/\{[\s\S]*\}/);
    if (evalMatch) {
      const parsed = JSON.parse(evalMatch[0]);
      scores = parsed.scores || scores;
      bestIndex = parsed.bestIndex ?? 0;
      evalReasoning = parsed.reasoning || "";
    }
  } catch { /* fallback to first branch */ }

  branches = branches.map((b, i) => ({ ...b, evaluation: scores[i] ?? 5, selected: i === bestIndex }));

  const selectedBranch = branches[bestIndex] || branches[0]!;
  const selectedPath = [selectedBranch.thought];

  let finalReasoning = "";
  try {
    const reasonResponse = await gatewayInfer({
      messages: [
        { role: "system", content: systemContext },
        {
          role: "user",
          content: `Using the reasoning approach: "${selectedBranch.thought}"\n\nAnswer this query thoroughly: ${query}`,
        },
      ],
      maxTokens: 1200,
      strategy: "preferred",
    });
    finalReasoning = reasonResponse.content;
  } catch {
    finalReasoning = `Reasoning via Tree of Thought (${selectedBranch.thought}): Analysis complete.`;
  }

  return {
    query,
    selectedPath,
    allBranches: branches,
    finalReasoning,
    confidence: Math.min(1, (scores[bestIndex] ?? 5) / 10),
    latencyMs: Date.now() - startTime,
  };
}

export async function runPlanCritique(
  query: string,
  systemContext: string,
  options: { maxIterations?: number } = {}
): Promise<PlanCritiqueResult> {
  const startTime = Date.now();
  const maxIter = options.maxIterations ?? 2;

  let currentPlan = "";
  let currentCritique = "";
  let iterations = 0;

  try {
    const planResponse = await gatewayInfer({
      messages: [
        { role: "system", content: systemContext + "\n\nGenerate a detailed step-by-step plan to address the user's request. Be specific and actionable." },
        { role: "user", content: query },
      ],
      maxTokens: 1000,
      strategy: "preferred",
    });
    currentPlan = planResponse.content;
  } catch {
    currentPlan = `Initial plan for: ${query}`;
  }

  for (let i = 0; i < maxIter; i++) {
    iterations++;
    try {
      const critiqueResponse = await gatewayInfer({
        messages: [
          {
            role: "system",
            content: `You are a rigorous plan critic. Identify weaknesses, gaps, risks, and improvements in this plan. Be specific about what could go wrong and what's missing.`,
          },
          { role: "user", content: `Original request: ${query}\n\nPlan to critique:\n${currentPlan}` },
        ],
        maxTokens: 600,
        strategy: "cheapest",
      });
      currentCritique = critiqueResponse.content;

      const reviseResponse = await gatewayInfer({
        messages: [
          { role: "system", content: systemContext + "\n\nRevise the plan based on the critique to make it more robust and complete." },
          {
            role: "user",
            content: `Original request: ${query}\n\nPrevious plan:\n${currentPlan}\n\nCritique:\n${currentCritique}\n\nProvide an improved revised plan:`,
          },
        ],
        maxTokens: 1000,
        strategy: "preferred",
      });
      currentPlan = reviseResponse.content;
    } catch {
      break;
    }
  }

  return {
    originalPlan: currentPlan,
    critique: currentCritique,
    revisedPlan: currentPlan,
    iterations,
    confidence: 0.85,
    latencyMs: Date.now() - startTime,
  };
}

export async function runMonteCarlo(
  query: string,
  systemContext: string,
  options: { simulations?: number } = {}
): Promise<MonteCarloResult> {
  const startTime = Date.now();
  const numSims = options.simulations ?? 3;

  const simPrompt = `Generate ${numSims} different action paths to address the user's request, then simulate likely outcomes for each. Consider different strategies, risks, and success probabilities.
Respond with JSON array:
[
  {
    "actionPath": ["step1", "step2", "..."],
    "simulatedOutcome": "what likely happens",
    "successProbability": 0.0-1.0,
    "risks": ["risk1", "risk2"]
  }
]`;

  let simulations: MonteCarloSimulation[] = [];

  try {
    const simResponse = await gatewayInfer({
      messages: [
        { role: "system", content: systemContext + "\n\n" + simPrompt },
        { role: "user", content: query },
      ],
      maxTokens: 1200,
      strategy: "preferred",
    });

    const match = simResponse.content.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      simulations = parsed.map((s: any, i: number) => ({
        simulationId: `sim_${i}`,
        actionPath: s.actionPath || [],
        simulatedOutcome: s.simulatedOutcome || "",
        successProbability: s.successProbability ?? 0.5,
        risks: s.risks || [],
      }));
    }
  } catch {
    simulations = [{
      simulationId: "sim_0",
      actionPath: ["Analyze situation", "Formulate response", "Execute plan"],
      simulatedOutcome: "Successful resolution with standard approach",
      successProbability: 0.75,
      risks: ["Incomplete information", "Changing conditions"],
    }];
  }

  const bestSim = simulations.reduce((best, s) =>
    s.successProbability > best.successProbability ? s : best, simulations[0]!
  );

  let expectedOutcome = "";
  try {
    const outResponse = await gatewayInfer({
      messages: [
        { role: "system", content: systemContext },
        {
          role: "user",
          content: `Based on Monte Carlo simulation analysis, the optimal path is: ${bestSim.actionPath.join(" → ")}\nExpected outcome: ${bestSim.simulatedOutcome}\n\nNow provide a comprehensive response to: ${query}`,
        },
      ],
      maxTokens: 1000,
      strategy: "preferred",
    });
    expectedOutcome = outResponse.content;
  } catch {
    expectedOutcome = bestSim.simulatedOutcome;
  }

  const avgProb = simulations.reduce((s, sim) => s + sim.successProbability, 0) / simulations.length;

  return {
    query,
    simulations,
    selectedPath: bestSim.actionPath,
    expectedOutcome,
    confidence: avgProb,
    latencyMs: Date.now() - startTime,
  };
}

export async function buildPlanningTrace(
  mode: PlanningTrace["planningMode"],
  result: TreeOfThoughtResult | PlanCritiqueResult | MonteCarloResult | { content: string; latencyMs: number }
): Promise<PlanningTrace> {
  const steps: PlanningTrace["steps"] = [];
  let confidence = 0.7;
  let latencyMs = 0;

  if (mode === "tot" && "allBranches" in result) {
    const tot = result as TreeOfThoughtResult;
    tot.allBranches.forEach((b, i) => {
      steps.push({ step: i + 1, type: "branch", content: b.thought, evaluation: b.evaluation });
    });
    steps.push({ step: steps.length + 1, type: "synthesis", content: tot.finalReasoning.slice(0, 300) });
    confidence = tot.confidence;
    latencyMs = tot.latencyMs;
  } else if (mode === "plan_critique" && "critique" in result) {
    const pc = result as PlanCritiqueResult;
    steps.push({ step: 1, type: "plan", content: pc.originalPlan.slice(0, 300) });
    steps.push({ step: 2, type: "critique", content: pc.critique.slice(0, 200) });
    steps.push({ step: 3, type: "revision", content: pc.revisedPlan.slice(0, 300) });
    confidence = pc.confidence;
    latencyMs = pc.latencyMs;
  } else if (mode === "monte_carlo" && "simulations" in result) {
    const mc = result as MonteCarloResult;
    mc.simulations.forEach((s, i) => {
      steps.push({ step: i + 1, type: "simulation", content: `Path: ${s.actionPath.slice(0, 2).join("→")} | Prob: ${s.successProbability}`, evaluation: s.successProbability * 10 });
    });
    steps.push({ step: steps.length + 1, type: "selected_path", content: mc.selectedPath.join(" → ") });
    confidence = mc.confidence;
    latencyMs = mc.latencyMs;
  } else if ("content" in result) {
    steps.push({ step: 1, type: "direct", content: (result as any).content?.slice(0, 300) || "" });
    latencyMs = (result as any).latencyMs || 0;
    confidence = 0.9;
  }

  return {
    planningMode: mode,
    steps,
    selectedStrategy: mode,
    totalLatencyMs: latencyMs,
    confidence,
  };
}
