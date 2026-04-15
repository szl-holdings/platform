import { useState, useCallback } from "react";
import type { CrdtMergeEvent } from "./use-crdt-entity";

export interface MergeNotificationProps {
  merges: CrdtMergeEvent[];
  onDismiss: () => void;
  onResolveConflict?: (fieldKey: string, choice: "local" | "remote", localValue: unknown, remoteValue: unknown) => void;
}

export function MergeNotification({ merges, onDismiss, onResolveConflict }: MergeNotificationProps) {
  const [reviewField, setReviewField] = useState<CrdtMergeEvent | null>(null);

  const reviewMerges = merges.filter((m) => m.requiresReview);
  const autoMerges = merges.filter((m) => !m.requiresReview);

  const handleReview = useCallback((merge: CrdtMergeEvent) => {
    setReviewField(merge);
  }, []);

  const handleResolve = useCallback(
    (choice: "local" | "remote") => {
      if (!reviewField) return;
      onResolveConflict?.(reviewField.fieldKey, choice, reviewField.oldValue, reviewField.newValue);
      setReviewField(null);
    },
    [reviewField, onResolveConflict]
  );

  if (merges.length === 0) return null;

  if (reviewField) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 12,
          padding: "20px 24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          maxWidth: 380,
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#f59e0b" }}>
          Conflict — review required
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
          Field: <span style={{ color: "#e2e8f0" }}>{reviewField.fieldKey}</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Your version</div>
            <div
              style={{
                background: "#0f172a",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 13,
                color: "#e2e8f0",
                wordBreak: "break-all",
              }}
            >
              {String(reviewField.oldValue ?? "(empty)")}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              {reviewField.actorId}&apos;s version
            </div>
            <div
              style={{
                background: "#0f172a",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 13,
                color: "#e2e8f0",
                wordBreak: "break-all",
              }}
            >
              {String(reviewField.newValue ?? "(empty)")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handleResolve("local")}
            style={{
              flex: 1,
              background: "#334155",
              color: "#e2e8f0",
              border: "none",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Keep mine
          </button>
          <button
            onClick={() => handleResolve("remote")}
            style={{
              flex: 1,
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Accept theirs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        maxWidth: 340,
        color: "#f1f5f9",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {autoMerges.length > 0 && (
        <div style={{ fontSize: 13, color: "#94a3b8" }}>
          <span style={{ color: "#22c55e", fontWeight: 500 }}>
            {autoMerges[0]!.actorId}
          </span>{" "}
          updated {autoMerges.length} field{autoMerges.length > 1 ? "s" : ""} — merged
          automatically.
        </div>
      )}
      {reviewMerges.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#f59e0b" }}>
            {reviewMerges.length} field{reviewMerges.length > 1 ? "s" : ""} need review
          </span>
          <button
            onClick={() => handleReview(reviewMerges[0]!)}
            style={{
              background: "transparent",
              border: "1px solid #f59e0b",
              color: "#f59e0b",
              borderRadius: 5,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            View changes
          </button>
        </div>
      )}
      <button
        onClick={onDismiss}
        style={{
          alignSelf: "flex-end",
          background: "transparent",
          border: "none",
          color: "#475569",
          fontSize: 12,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
