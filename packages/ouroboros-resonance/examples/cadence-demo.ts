import { checkCadenceMatch, measureCadence } from "../src/index.js";

const fast = Array.from({ length: 50 }, (_, i) => ({ tick: i * 2 }));   // f = 0.5/tick
const slow = Array.from({ length: 50 }, (_, i) => ({ tick: i * 12 }));  // f ≈ 0.083/tick

const cFast = measureCadence(fast);
const cSlow = measureCadence(slow);
console.log("fast", cFast);
console.log("slow", cSlow);
console.log("match", checkCadenceMatch(cFast, cSlow));
