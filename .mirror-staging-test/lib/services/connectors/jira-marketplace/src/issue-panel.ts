import ForgeUI, { render, IssuePanel, Text, Tag, SectionMessage, Fragment, useState, useEffect } from "@forge/ui";
import api from "@forge/api";

const SZL_API_BASE = process.env.SZL_API_BASE ?? "https://api.szlholdings.com";
const SZL_INTERNAL_TOKEN = process.env.SZL_INTERNAL_TOKEN ?? "";

const szlHeaders = {
  "Content-Type": "application/json",
  "x-internal-token": SZL_INTERNAL_TOKEN,
};

interface PrismScore {
  lens: string;
  score: number;
  trend: "up" | "down" | "stable";
}

interface AlloyRun {
  id: number;
  state: string;
  queuedAt: string;
}

async function fetchPrismScores(): Promise<PrismScore[]> {
  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/lyte/prism/summary`, {
      headers: szlHeaders,
    });
    if (!res.ok) return [];
    const body = await res.json() as { data?: { lenses?: PrismScore[] } };
    return body.data?.lenses ?? [];
  } catch {
    return [];
  }
}

async function fetchRecentRuns(): Promise<AlloyRun[]> {
  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/alloy/runs?limit=5`, {
      headers: szlHeaders,
    });
    if (!res.ok) return [];
    const body = await res.json() as { data?: AlloyRun[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

function scoreColor(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

function stateColor(state: string): "green" | "yellow" | "red" | "blue" {
  if (state === "completed") return "green";
  if (state === "running" || state === "queued") return "blue";
  if (state === "failed") return "red";
  return "yellow";
}

const App = () => {
  const [prism, setPrism] = useState<PrismScore[]>([]);
  const [runs, setRuns] = useState<AlloyRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    const [scores, recentRuns] = await Promise.all([fetchPrismScores(), fetchRecentRuns()]);
    setPrism(scores);
    setRuns(recentRuns);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <IssuePanel>
        <Text>Loading SZL signals...</Text>
      </IssuePanel>
    );
  }

  return (
    <IssuePanel>
      <Fragment>
        <Text>**PRISM Risk Scores**</Text>
        {prism.length === 0 ? (
          <SectionMessage title="No PRISM data" appearance="info">
            <Text>Connect your SZL account to view PRISM risk scores.</Text>
          </SectionMessage>
        ) : (
          <Fragment>
            {prism.map((s, i) => (
              <Tag key={i} text={`${s.lens}: ${s.score}`} color={scoreColor(s.score)} />
            ))}
          </Fragment>
        )}
        <Text>**Recent Alloy Runs**</Text>
        {runs.length === 0 ? (
          <Text>No recent workflow runs.</Text>
        ) : (
          <Fragment>
            {runs.map(r => (
              <Tag key={r.id} text={`Run #${r.id} — ${r.state}`} color={stateColor(r.state)} />
            ))}
          </Fragment>
        )}
      </Fragment>
    </IssuePanel>
  );
};

export const handler = render(<App />);
