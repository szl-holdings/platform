import ForgeUI, { render, IssueAction, ModalDialog, Button, Select, Option, Text, SectionMessage, useState, useProductContext } from "@forge/ui";
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
}

interface JiraContext {
  cloudId: string;
  platformContext: {
    issueKey?: string;
    project?: { key: string; id: string };
  };
}

async function fetchWorkflows(): Promise<Workflow[]> {
  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/alloy/workflows?limit=30`, {
      headers: szlHeaders,
    });
    if (!res.ok) return [];
    const body = await res.json() as { data?: Workflow[] };
    return (body.data ?? []).filter(w => w.isActive);
  } catch {
    return [];
  }
}

async function triggerWorkflow(workflowId: number, issueKey: string, projectKey: string, cloudId: string): Promise<{ runId: number; state: string }> {
  const res = await api.fetch(`${SZL_API_BASE}/api/alloy/workflows/${workflowId}/run`, {
    method: "POST",
    headers: szlHeaders,
    body: JSON.stringify({
      input: {
        source: "jira",
        issueKey,
        projectKey,
        cloudId,
        triggeredFrom: "jira_issue_action",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to trigger workflow: ${res.status} — ${err}`);
  }
  const body = await res.json() as { data?: { id: number; state: string } };
  return { runId: body.data?.id ?? 0, state: body.data?.state ?? "queued" };
}

const App = () => {
  const context = useProductContext() as JiraContext;
  const issueKey = context?.platformContext?.issueKey ?? "";
  const projectKey = context?.platformContext?.project?.key ?? "";
  const cloudId = context?.cloudId ?? "";

  const [open, setOpen] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");

  const handleOpen = async () => {
    setLoading(true);
    try {
      const wfs = await fetchWorkflows();
      setWorkflows(wfs);
    } finally {
      setLoading(false);
    }
    setOpen(true);
    setStatus(null);
  };

  const handleTrigger = async () => {
    if (!selectedWorkflow) return;
    const wfId = parseInt(selectedWorkflow);
    const wf = workflows.find(w => w.id === wfId);
    try {
      const result = await triggerWorkflow(wfId, issueKey, projectKey, cloudId);
      setStatus({ type: "success", message: `Workflow "${wf?.name ?? wfId}" triggered (Run #${result.runId}, state: ${result.state})` });
    } catch (err: unknown) {
      setStatus({ type: "error", message: (err as Error).message });
    }
    setOpen(false);
  };

  return (
    <IssueAction>
      {status && (
        <SectionMessage title={status.type === "success" ? "Workflow Triggered" : "Error"} appearance={status.type === "success" ? "confirmation" : "error"}>
          <Text>{status.message}</Text>
        </SectionMessage>
      )}
      <Button text="Trigger Alloy Workflow" onClick={handleOpen} />
      {open && (
        <ModalDialog header={`Trigger Alloy Workflow — ${issueKey}`} onClose={() => setOpen(false)}>
          {loading ? (
            <Text>Loading workflows...</Text>
          ) : workflows.length === 0 ? (
            <Text>No active workflows found. Configure workflows in the Alloy console.</Text>
          ) : (
            <Select label="Select workflow to trigger" name="workflowId" onChange={(v) => setSelectedWorkflow(String(v))}>
              {workflows.map(w => (
                <Option label={`${w.name}${w.description ? ` — ${w.description.slice(0, 60)}` : ""}`} value={String(w.id)} key={String(w.id)} />
              ))}
            </Select>
          )}
          {workflows.length > 0 && (
            <Button text="Trigger" onClick={handleTrigger} disabled={!selectedWorkflow} />
          )}
        </ModalDialog>
      )}
    </IssueAction>
  );
};

export const handler = render(<App />);
