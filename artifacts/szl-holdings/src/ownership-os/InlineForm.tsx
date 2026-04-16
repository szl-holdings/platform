import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiFetch } from "./api";

export function InlineForm({ fields, onSubmit, onCancel, submitLabel = "Add" }: {
  fields: Array<{ key: string; label: string; type: "text" | "select" | "number" | "checkbox"; options?: string[]; placeholder?: string; required?: boolean }>;
  onSubmit: (values: Record<string, string | number | boolean>) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => {
    const init: Record<string, string | number | boolean> = {};
    for (const f of fields) init[f.key] = f.type === "checkbox" ? false : f.type === "number" ? 0 : "";
    return init;
  });

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.type === "checkbox" ? "flex items-center gap-2" : "space-y-1"}>
            {f.type === "checkbox" ? (
              <>
                <input type="checkbox" checked={!!values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.checked }))} className="rounded" />
                <span className="text-xs text-foreground">{f.label}</span>
              </>
            ) : (
              <>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={String(values[f.key])}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={String(values[f.key] ?? "")}
                    onChange={e => setValues(v => ({ ...v, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        <button
          onClick={() => onSubmit(values)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> {submitLabel}
        </button>
      </div>
    </div>
  );
}

export function useEntityMutation(scenarioId: number, endpoint: string) {
  const qc = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch(`/ownership/scenarios/${scenarioId}/${endpoint}`, {
      method: "POST", body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/ownership/${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => apiFetch(`/ownership/${endpoint}/${id}`, {
      method: "PATCH", body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenario-detail", scenarioId] }),
  });
  return { addMutation, deleteMutation, updateMutation };
}
