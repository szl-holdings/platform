import * as integ from "./src/index.js";
console.log("Total exports:", Object.keys(integ).length);
console.log("Has A11oyOrchestrator:", typeof integ.A11oyOrchestrator === "function");
console.log("Has buildSupremeCodex:", typeof integ.buildSupremeCodex === "function");
console.log("Has computeLambdaEngine:", typeof integ.computeLambdaEngine === "function");
console.log("Has a11oy ns:", typeof integ.a11oy === "object");
console.log("Has sentra ns:", typeof integ.sentra === "object");
console.log("Has amaru ns:", typeof integ.amaru === "object");

const codex = integ.buildSupremeCodex();
const sum = integ.codexSummary(codex);
console.log("Codex:", JSON.stringify(sum));

// Try the orchestrator end-to-end
const orch = new integ.A11oyOrchestrator();
console.log("Orchestrator stats:", typeof orch.getStats === "function" ? "method exists" : "missing");
