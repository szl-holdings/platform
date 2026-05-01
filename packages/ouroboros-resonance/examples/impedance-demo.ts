import {
  computeImpedance,
  impedanceVerdict,
  reflectionCoefficient,
} from "../src/index.js";

const tier1 = computeImpedance({ boundaryCardinality: 8, stateCardinality: 32 });
const tier3 = computeImpedance({ boundaryCardinality: 2, stateCardinality: 4 });

const refl = reflectionCoefficient(tier1, tier3);
console.log("source Z =", tier1.impedance.toFixed(3));
console.log("load   Z =", tier3.impedance.toFixed(3));
console.log("|Γ| =", refl.magnitude.toFixed(3), "η =", refl.efficiency.toFixed(3));
console.log("verdict =", impedanceVerdict(refl));
