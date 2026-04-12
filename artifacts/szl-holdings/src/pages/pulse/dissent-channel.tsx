import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareWarning, Plus, X, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileText, Shield, Loader2, Eye,
} from "lucide-react";
import { Link } from "wouter";
import { pulseFetch, timeAgo } from "./pulse-utils";

const TEXT = { primary: "hsl(38 8% 95%)", secondary: "hsl(214 7% 64%)", muted: "hsl(214 6% 42%)", faint: "hsl(214 5% 30%)" };
const BG = { surface: "hsla(214 12% 10% / 0.75)", card: "hsla(214 14% 6% / 0.95)", elevated: "hsla(214 10% 13% / 0.88)" };
const BORDER = { subtle: "hsla(0 0% 100% / 0.055)" };
const PULSE_ACCENT = "hsl(191 92% 44%)";
const PULSE_DIM = "hsla(191 92% 44% / 0.10)";
const PULSE_BORDER = "hsla(191 92% 44% / 0.20)";
const AMBER = "hsl(32 88% 52%)";
const AMBER_DIM = "hsla(32 88% 52% / 0.10)";
const AMBER_BORDER = "hsla(32 88% 52% / 0.22)";

type Dissent = {
  id: string; briefId: string; sectionId: string | null; claim: string;
  dissentingView: string; basis: string; submittedBy: string; submittedAt: string;
  status: string; resolution: string | null; resolvedAt: string | null;
  impactOnConfidence: number; briefHeadline?: string; briefDate?: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  open: { bg: AMBER_DIM, text: AMBER, border: AMBER_BORDER, label: "Open" },
  under_review: { bg: "hsla(218 70% 52% / 0.10)", text: "hsl(218 70% 65%)", border: "hsla(218 70% 52% / 0.22)", label: "Under Review" },
  resolved: { bg: "hsla(160 65% 42% / 0.10)", text: "hsl(160 65% 50%)", border: "hsla(160 65% 42% / 0.22)", label: "Resolved" },
  withdrawn: { bg: "hsla(214 12% 10% / 0.7)", text: TEXT.muted, border: BORDER.subtle, label: "Withdrawn" },
};

function DissentCard({ dissent, onUpdate }: { dissent: Dissent; onUpdate: (id: string, status: string, resolution?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [resolution, setResolution] = useState("");
  const style = STATUS_STYLES[dissent.status] ?? STATUS_STYLES.open;

  return (
    <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderLeft: `3px solid ${style.text}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: style.bg, color: style.text, border: `1px solid ${style.border}`, fontWeight: 600, letterSpacing: "0.03em" }}>
                {style.label}
              </span>
              <span style={{ fontSize: 11, color: TEXT.muted }}>Filed by {dissent.submittedBy}</span>
              <span style={{ fontSize: 11, color: TEXT.faint }}>{timeAgo(dissent.submittedAt)}</span>
              {dissent.briefDate && (
                <>
                  <span style={{ fontSize: 11, color: TEXT.faint }}>·</span>
                  <Link href={`/pulse/brief/${dissent.briefId}`}>
                    <span style={{ fontSize: 11, color: PULSE_ACCENT, cursor: "pointer" }}>Brief {dissent.briefDate}</span>
                  </Link>
                </>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, marginBottom: "0.375rem" }}>
              Claim: "<span style={{ fontStyle: "italic" }}>{dissent.claim}</span>"
            </div>
            <div style={{ fontSize: 13, color: TEXT.secondary, lineHeight: 1.6 }}>{dissent.dissentingView}</div>
          </div>
          <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT.muted, flexShrink: 0, padding: "0.25rem" }}>
            <Eye size={16} />
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
              <div style={{ paddingTop: "0.875rem", borderTop: `1px solid ${BORDER.subtle}`, marginTop: "0.875rem" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Tradecraft Basis</div>
                <p style={{ fontSize: 13, color: TEXT.secondary, lineHeight: 1.6, marginBottom: "0.875rem" }}>{dissent.basis}</p>
                {dissent.impactOnConfidence !== 0 && (
                  <div style={{ fontSize: 12, color: TEXT.muted }}>
                    Estimated confidence impact: <span style={{ color: dissent.impactOnConfidence < 0 ? "hsl(2 70% 60%)" : "hsl(160 65% 48%)", fontWeight: 600 }}>
                      {dissent.impactOnConfidence > 0 ? "+" : ""}{dissent.impactOnConfidence}%
                    </span>
                  </div>
                )}

                {dissent.resolution && (
                  <div style={{ marginTop: "0.875rem", padding: "0.75rem", borderRadius: 8, background: "hsla(160 65% 42% / 0.08)", border: "1px solid hsla(160 65% 42% / 0.20)" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(160 65% 48%)", marginBottom: "0.25rem" }}>Resolution</div>
                    <div style={{ fontSize: 13, color: TEXT.secondary }}>{dissent.resolution}</div>
                  </div>
                )}

                {dissent.status === "open" || dissent.status === "under_review" ? (
                  <div style={{ marginTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <textarea
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      placeholder="Enter resolution notes…"
                      rows={2}
                      style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {dissent.status === "open" && (
                        <button onClick={() => onUpdate(dissent.id, "under_review")} style={{ padding: "0.4rem 0.875rem", borderRadius: 6, border: "1px solid hsla(218 70% 52% / 0.25)", background: "hsla(218 70% 52% / 0.10)", color: "hsl(218 70% 65%)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                          Mark Under Review
                        </button>
                      )}
                      <button onClick={() => onUpdate(dissent.id, "resolved", resolution)} disabled={!resolution.trim()} style={{ padding: "0.4rem 0.875rem", borderRadius: 6, border: "1px solid hsla(160 65% 42% / 0.25)", background: "hsla(160 65% 42% / 0.10)", color: "hsl(160 65% 48%)", fontSize: 12, cursor: resolution.trim() ? "pointer" : "default", fontWeight: 600, opacity: resolution.trim() ? 1 : 0.5 }}>
                        Resolve
                      </button>
                      <button onClick={() => onUpdate(dissent.id, "withdrawn")} style={{ padding: "0.4rem 0.875rem", borderRadius: 6, border: `1px solid ${BORDER.subtle}`, background: "hsla(214 12% 10% / 0.6)", color: TEXT.muted, fontSize: 12, cursor: "pointer" }}>
                        Withdraw
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DissentChannel() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ briefId: "", claim: "", dissentingView: "", basis: "", submittedBy: "Analyst" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pulse-dissents"],
    queryFn: () => pulseFetch<{ dissents: Dissent[] }>("/pulse/dissents"),
    refetchInterval: 30000,
  });

  const submitMutation = useMutation({
    mutationFn: () => pulseFetch("/pulse/dissent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-dissents"] });
      setForm({ briefId: "", claim: "", dissentingView: "", basis: "", submittedBy: "Analyst" });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution?: string }) =>
      pulseFetch(`/pulse/dissent/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pulse-dissents"] }),
  });

  const dissents: Dissent[] = data?.dissents ?? [];
  const openCount = dissents.filter(d => d.status === "open" || d.status === "under_review").length;
  const resolvedCount = dissents.filter(d => d.status === "resolved").length;

  const canSubmit = form.briefId && form.claim.length > 10 && form.dissentingView.length > 20 && form.basis.length > 20;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 22, color: TEXT.primary, marginBottom: "0.375rem" }}>Dissent Channel</h1>
          <p style={{ fontSize: 14, color: TEXT.secondary }}>File structured disagreements with AI-generated assessments. Inspired by the State Department Dissent Channel.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: 8, border: `1px solid ${PULSE_BORDER}`, background: PULSE_DIM, color: PULSE_ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          <Plus size={15} />File Dissent
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1rem" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Total Dissents</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: TEXT.primary }}>{dissents.length}</div>
        </div>
        <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1rem" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Active</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: openCount > 0 ? AMBER : TEXT.primary }}>{openCount}</div>
        </div>
        <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1rem" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Resolved</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "hsl(160 65% 48%)" }}>{resolvedCount}</div>
        </div>
      </div>

      {/* What is dissent — explainer */}
      <div style={{ background: "hsla(218 70% 52% / 0.06)", border: "1px solid hsla(218 70% 52% / 0.18)", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", gap: "0.875rem" }}>
        <Shield size={18} style={{ color: "hsl(218 70% 65%)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(218 70% 75%)", marginBottom: "0.25rem" }}>Analytic Dissent Channel</div>
          <div style={{ fontSize: 13, color: TEXT.secondary, lineHeight: 1.6 }}>
            When you disagree with an AI-generated assessment, file a structured dissent with the specific claim, your alternative view, and your tradecraft basis. Dissents are tracked, trigger re-analysis review, and feed into confidence calibration for future briefings.
          </div>
        </div>
      </div>

      {/* File dissent form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ background: BG.card, border: `1px solid ${PULSE_BORDER}`, borderRadius: 10, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary }}>File Analytic Dissent</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT.muted }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>Brief ID *</label>
                <input value={form.briefId} onChange={e => setForm(p => ({ ...p, briefId: e.target.value }))} placeholder="brief_2026-04-12_daily" style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none", fontFamily: "var(--font-mono, monospace)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>Claim Being Dissented *</label>
                <input value={form.claim} onChange={e => setForm(p => ({ ...p, claim: e.target.value }))} placeholder="The specific assessment or claim you disagree with" style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>Your Dissenting View *</label>
                <textarea value={form.dissentingView} onChange={e => setForm(p => ({ ...p, dissentingView: e.target.value }))} placeholder="Your alternative assessment — what you believe is correct and why" rows={3} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>Tradecraft Basis *</label>
                <textarea value={form.basis} onChange={e => setForm(p => ({ ...p, basis: e.target.value }))} placeholder="Evidence and reasoning supporting your dissent — cite standards, analytic frameworks, or specific data" rows={3} style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>Filed By</label>
                <input value={form.submittedBy} onChange={e => setForm(p => ({ ...p, submittedBy: e.target.value }))} style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: 8, border: "none", background: canSubmit ? `linear-gradient(135deg, ${PULSE_ACCENT}, hsl(218 70% 52%))` : "hsla(214 12% 10% / 0.6)", color: canSubmit ? "hsl(214 18% 3%)" : TEXT.muted, fontSize: 13, fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}>
                  {submitMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <MessageSquareWarning size={14} />}
                  {submitMutation.isPending ? "Filing…" : "File Dissent"}
                </button>
                <button onClick={() => setShowForm(false)} style={{ padding: "0.625rem 1rem", borderRadius: 8, border: `1px solid ${BORDER.subtle}`, background: "none", color: TEXT.secondary, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dissent list */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 100, borderRadius: 10, background: "hsla(214 12% 10% / 0.5)" }} />)}
        </div>
      ) : dissents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <MessageSquareWarning size={40} style={{ color: TEXT.faint, marginBottom: "1rem" }} />
          <p style={{ color: TEXT.secondary, fontSize: 14 }}>No dissents filed. When an AI assessment needs challenging, this is where it happens.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {dissents.map((dissent, i) => (
            <motion.div key={dissent.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <DissentCard dissent={dissent} onUpdate={(id, status, resolution) => updateMutation.mutate({ id, status, resolution })} />
            </motion.div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
