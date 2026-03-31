import ForgeUI, { render, ProjectPage, Text, Button, Table, Head, Cell, Row, Fragment, useState, useEffect, Tag, SectionMessage } from "@forge/ui";
import api from "@forge/api";

const SZL_API_BASE = process.env.SZL_API_BASE ?? "https://api.szlholdings.com";
const SZL_INTERNAL_TOKEN = process.env.SZL_INTERNAL_TOKEN ?? "";

const szlHeaders = {
  "Content-Type": "application/json",
  "x-internal-token": SZL_INTERNAL_TOKEN,
};

interface Workflow {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  runCount: number;
  lastRunAt?: string;
}

interface RecentRun {
  id: number;
  workflowId: number;
  state: string;
  queuedAt: string;
  durationMs?: number;
}

async function fetchWorkflows(): Promise<Workflow[]> {
  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/alloy/workflows?limit=20`, {
      headers: szlHeaders,
    });
    if (!res.ok) return [];
    const body = await res.json() as { data?: Workflow[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

async function fetchRecentRuns(): Promise<RecentRun[]> {
  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/alloy/runs?limit=10`, {
      headers: szlHeaders,
    });
    if (!res.ok) return [];
    const body = await res.json() as { data?: RecentRun[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

async function triggerWorkflow(workflowId: number): Promise<boolean> {
  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/alloy/workflows/${workflowId}/run`, {
      method: "POST",
      headers: szlHeaders,
      body: JSON.stringify({ input: { source: "jira_project_page" } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function stateColor(state: string): "green" | "yellow" | "red" | "blue" {
  if (state === "completed") return "green";
  if (state === "running" || state === "queued") return "blue";
  if (state === "failed") return "red";
  return "yellow";
}

const App = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(async () => {
    const [wfs, recentRuns] = await Promise.all([fetchWorkflows(), fetchRecentRuns()]);
    setWorkflows(wfs);
    setRuns(recentRuns);
    setLoading(false);
  }, []);

  const handleTrigger = async (workflowId: number, workflowName: string) => {
    const ok = await triggerWorkflow(workflowId);
    setMessage(ok ? `Triggered "${workflowName}" successfully` : `Failed to trigger "${workflowName}"`);
  };

  if (loading) {
    return (
      <ProjectPage>
        <Text>Loading Alloy workflows...</Text>
      </ProjectPage>
    );
  }

  return (
    <ProjectPage>
      <Fragment>
        <Text>**Alloy Workflows**</Text>
        {message && (
          <SectionMessage title="Action Result" appearance="info">
            <Text>{message}</Text>
          </SectionMessage>
        )}
        {workflows.length === 0 ? (
          <Text>No workflows configured. Visit the SZL Alloy console to create workflows.</Text>
        ) : (
          <Table>
            <Head>
              <Cell><Text>Workflow</Text></Cell>
              <Cell><Text>Status</Text></Cell>
              <Cell><Text>Runs</Text></Cell>
              <Cell><Text>Action</Text></Cell>
            </Head>
            {workflows.map(w => (
              <Row key={w.id}>
                <Cell><Text>{w.name}</Text></Cell>
                <Cell><Tag text={w.isActive ? "Active" : "Inactive"} color={w.isActive ? "green" : "red"} /></Cell>
                <Cell><Text>{String(w.runCount)}</Text></Cell>
                <Cell>
                  <Button text="Run" onClick={() => handleTrigger(w.id, w.name)} disabled={!w.isActive} />
                </Cell>
              </Row>
            ))}
          </Table>
        )}
        <Text>**Recent Run History**</Text>
        {runs.length === 0 ? (
          <Text>No recent runs.</Text>
        ) : (
          <Table>
            <Head>
              <Cell><Text>Run ID</Text></Cell>
              <Cell><Text>State</Text></Cell>
              <Cell><Text>Duration</Text></Cell>
            </Head>
            {runs.map(r => (
              <Row key={r.id}>
                <Cell><Text>#{r.id}</Text></Cell>
                <Cell><Tag text={r.state} color={stateColor(r.state)} /></Cell>
                <Cell><Text>{r.durationMs ? `${Math.round(r.durationMs / 1000)}s` : "—"}</Text></Cell>
              </Row>
            ))}
          </Table>
        )}
      </Fragment>
    </ProjectPage>
  );
};

export const handler = render(<App />);
