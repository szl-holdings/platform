import { BarChart3, Trophy, Zap, Target, ArrowUp, ArrowDown, Clock, Cpu } from "lucide-react";

interface BenchmarkResult {
  model: string;
  mmlu: number;
  humanEval: number;
  gsm8k: number;
  hellaSwag: number;
  truthfulQA: number;
  avgScore: number;
  latencyP50: string;
  latencyP99: string;
  throughput: string;
  cost: string;
}

const results: BenchmarkResult[] = [
  { model: "INCA-LLM-7B", mmlu: 72.4, humanEval: 68.2, gsm8k: 74.1, hellaSwag: 82.3, truthfulQA: 51.2, avgScore: 69.6, latencyP50: "45ms", latencyP99: "128ms", throughput: "2,400 tok/s", cost: "$0.0004/1K" },
  { model: "INCA-Code-13B", mmlu: 78.1, humanEval: 82.4, gsm8k: 81.3, hellaSwag: 86.7, truthfulQA: 54.8, avgScore: 76.7, latencyP50: "78ms", latencyP99: "210ms", throughput: "1,200 tok/s", cost: "$0.0012/1K" },
  { model: "GPT-4 Turbo", mmlu: 86.4, humanEval: 87.1, gsm8k: 92.0, hellaSwag: 95.3, truthfulQA: 59.4, avgScore: 84.0, latencyP50: "320ms", latencyP99: "890ms", throughput: "800 tok/s", cost: "$0.01/1K" },
  { model: "Claude 3 Opus", mmlu: 86.8, humanEval: 84.9, gsm8k: 95.0, hellaSwag: 95.4, truthfulQA: 62.1, avgScore: 84.8, latencyP50: "280ms", latencyP99: "750ms", throughput: "900 tok/s", cost: "$0.015/1K" },
  { model: "Llama 3 70B", mmlu: 82.0, humanEval: 81.7, gsm8k: 83.0, hellaSwag: 87.5, truthfulQA: 55.2, avgScore: 77.9, latencyP50: "120ms", latencyP99: "340ms", throughput: "1,800 tok/s", cost: "$0.0008/1K" },
];

function ScoreCell({ value, max }: { value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-blue-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
  return <span className={`font-mono text-sm ${color}`}>{value.toFixed(1)}</span>;
}

export default function Benchmarking() {
  const bestAvg = Math.max(...results.map(r => r.avgScore));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" /> AI Model Benchmarking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Head-to-head model evaluation — accuracy, latency, and throughput benchmarks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Models Evaluated</div>
          <div className="text-2xl font-display font-bold mt-1">{results.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Best Average Score</div>
          <div className="text-2xl font-display font-bold text-emerald-400 mt-1">{bestAvg.toFixed(1)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">INCA Best Model</div>
          <div className="text-2xl font-display font-bold text-primary mt-1">76.7</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Cost Efficiency Leader</div>
          <div className="text-2xl font-display font-bold text-violet-400 mt-1">INCA-7B</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-4">Model</th>
              <th className="text-center p-4">MMLU</th>
              <th className="text-center p-4">HumanEval</th>
              <th className="text-center p-4">GSM8K</th>
              <th className="text-center p-4">HellaSwag</th>
              <th className="text-center p-4">TruthfulQA</th>
              <th className="text-center p-4">Average</th>
              <th className="text-center p-4">P50 Latency</th>
              <th className="text-center p-4">Throughput</th>
              <th className="text-center p-4">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r) => (
              <tr key={r.model} className={`hover:bg-muted/30 transition-colors ${r.model.startsWith("INCA") ? "bg-primary/5" : ""}`}>
                <td className="p-4">
                  <span className={`text-sm font-semibold ${r.model.startsWith("INCA") ? "text-primary" : ""}`}>{r.model}</span>
                </td>
                <td className="p-4 text-center"><ScoreCell value={r.mmlu} max={100} /></td>
                <td className="p-4 text-center"><ScoreCell value={r.humanEval} max={100} /></td>
                <td className="p-4 text-center"><ScoreCell value={r.gsm8k} max={100} /></td>
                <td className="p-4 text-center"><ScoreCell value={r.hellaSwag} max={100} /></td>
                <td className="p-4 text-center"><ScoreCell value={r.truthfulQA} max={100} /></td>
                <td className="p-4 text-center">
                  <span className={`font-mono text-sm font-bold ${r.avgScore === bestAvg ? "text-emerald-400" : ""}`}>{r.avgScore.toFixed(1)}</span>
                </td>
                <td className="p-4 text-center text-xs text-muted-foreground">{r.latencyP50}</td>
                <td className="p-4 text-center text-xs text-muted-foreground">{r.throughput}</td>
                <td className="p-4 text-center text-xs text-muted-foreground">{r.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4">Performance vs Cost Analysis</h2>
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.model} className="flex items-center gap-4">
              <span className={`text-sm w-32 ${r.model.startsWith("INCA") ? "text-primary font-semibold" : "text-muted-foreground"}`}>{r.model}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12">Score</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className={`h-2 rounded-full ${r.model.startsWith("INCA") ? "bg-primary" : "bg-muted-foreground/40"}`} style={{ width: `${(r.avgScore / 100) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono w-12 text-right">{r.avgScore.toFixed(1)}</span>
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground w-24 text-right">{r.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
