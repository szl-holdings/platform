/**
 * Production Confirm — SZL Holdings Platform
 *
 * Double-confirmation guard for destructive actions in production mode.
 * Wrap the app with <ProductionConfirmProvider /> — the dialog renders
 * automatically when needed. In non-production modes, confirm() resolves
 * immediately without showing a dialog.
 *
 * Usage:
 *   const { confirm } = useProductionConfirm();
 *   const ok = await confirm({ action: "Delete all records", confirmText: "DELETE" });
 *   if (ok) { ... do the thing ... }
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useAppMode } from "./app-mode-banner";

export interface ConfirmOptions {
  title?: string;
  action: string;
  description?: string;
  confirmText?: string;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface ProductionConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ProductionConfirmContext = createContext<ProductionConfirmContextValue>({
  confirm: async () => true,
});

export function ProductionConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<ConfirmState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const mode = useAppMode();

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> => {
      if (mode !== "production") {
        return Promise.resolve(true);
      }
      return new Promise<boolean>((resolve) => {
        setInputValue("");
        setPending({ ...opts, resolve });
      });
    },
    [mode],
  );

  const handleConfirm = () => {
    if (!pending) return;
    const expected = (pending.confirmText ?? "CONFIRM").toUpperCase();
    if (inputValue.toUpperCase() !== expected) return;
    pending.resolve(true);
    setPending(null);
  };

  const handleCancel = () => {
    if (!pending) return;
    pending.resolve(false);
    setPending(null);
  };

  return (
    <ProductionConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <ConfirmDialogUI
          pending={pending}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ProductionConfirmContext.Provider>
  );
}

interface ConfirmDialogUIProps {
  pending: ConfirmOptions;
  inputValue: string;
  onInputChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogUI({ pending, inputValue, onInputChange, onConfirm, onCancel }: ConfirmDialogUIProps) {
  const expected = (pending.confirmText ?? "CONFIRM").toUpperCase();
  const isMatch = inputValue.toUpperCase() === expected;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prod-confirm-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(10,10,18,0.98)",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: "14px",
          padding: "28px 32px",
          maxWidth: "440px",
          width: "90vw",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <span
            id="prod-confirm-title"
            style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            Production — Destructive Action
          </span>
        </div>

        <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: "8px" }}>
          {pending.title ?? pending.action}
        </p>

        {pending.description && (
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: "16px" }}>
            {pending.description}
          </p>
        )}

        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.50)", marginBottom: "8px" }}>
          Type <strong style={{ color: "#ef4444", letterSpacing: "0.05em" }}>{expected}</strong> to confirm:
        </p>

        <input
          autoFocus
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isMatch) onConfirm();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={expected}
          style={{
            width: "100%",
            padding: "9px 12px",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${isMatch ? "rgba(239,68,68,0.60)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: "8px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.9)",
            outline: "none",
            fontFamily: "Inter, system-ui, sans-serif",
            boxSizing: "border-box",
            marginBottom: "16px",
            transition: "border-color 0.15s",
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "9px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.65)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch}
            style={{
              flex: 1,
              padding: "9px",
              background: isMatch ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isMatch ? "rgba(239,68,68,0.50)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "8px",
              color: isMatch ? "#ef4444" : "rgba(255,255,255,0.25)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isMatch ? "pointer" : "not-allowed",
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "all 0.15s",
            }}
          >
            {pending.confirmText ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useProductionConfirm(): ProductionConfirmContextValue {
  return useContext(ProductionConfirmContext);
}

/**
 * useDestructiveAction — Systematic wrapper for any destructive async action.
 *
 * Centralises the production-confirm pattern: in production mode, a type-in
 * confirmation dialog is shown before the action proceeds. In demo/sandbox
 * modes the action is bypassed immediately (write interception happens at the
 * API layer anyway).
 *
 * Usage:
 *   const doDelete = useDestructiveAction(
 *     async () => { await apiFetch(`/items/${id}`, { method: "DELETE" }); },
 *     { action: "Delete Item", confirmText: "DELETE" }
 *   );
 *   <button onClick={doDelete}>Delete</button>
 *
 * Returns a stable callback that resolves to `null` if the user cancels,
 * or the action's return value on success.
 */
export function useDestructiveAction<T = void>(
  action: () => Promise<T>,
  opts: ConfirmOptions,
): () => Promise<T | null> {
  const { confirm: productionConfirm } = useProductionConfirm();
  const actionRef = useRef(action);
  const optsRef = useRef(opts);
  actionRef.current = action;
  optsRef.current = opts;
  return useCallback(async () => {
    const ok = await productionConfirm(optsRef.current);
    if (!ok) return null;
    return actionRef.current();
  }, [productionConfirm]);
}
