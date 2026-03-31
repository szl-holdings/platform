/**
 * EmbeddedSigner — Self-hosted in-app signing surface for the Document Engine.
 *
 * Supports three signature input methods:
 *   1. Typed   – renders a cursive-style canvas stroke of the signer's name
 *   2. Drawn   – freehand canvas drawing with mouse/touch
 *   3. Uploaded – JPEG/PNG image upload interpreted as a signature
 *
 * After capture the component calls POST /documents/:docId/sign/:sigId
 * with the base64 PNG image attached.  On success it calls onComplete().
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, Pen, Upload, Type, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "../utils";

const BASE_URL =
  typeof window !== "undefined"
    ? ((window as unknown as Record<string, unknown>).__REPLIT_BASE_URL as string) || ""
    : "";

/**
 * Compute a lightweight browser fingerprint for the audit trail.
 * Uses canvas rendering, screen properties, and navigator metadata.
 * This is NOT a tracking fingerprint — it is used solely as a signing-event
 * identifier in the tamper-evident audit hash.
 */
function collectBrowserFingerprint(): string {
  try {
    const nav = window.navigator;
    const screen = window.screen;

    // Canvas fingerprint
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    let canvasFp = "";
    if (ctx) {
      ctx.textBaseline = "alphabetic";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("SZL DocEngine 🖊", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("SZL DocEngine 🖊", 4, 17);
      canvasFp = canvas.toDataURL().slice(-64);
    }

    const components = [
      nav.userAgent,
      nav.language || nav.languages?.join(",") || "",
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(new Date().getTimezoneOffset()),
      String(nav.hardwareConcurrency || ""),
      canvasFp,
    ].join("|");

    // Simple djb2-style hash as hex string
    let hash = 5381;
    for (let i = 0; i < components.length; i++) {
      hash = ((hash << 5) + hash) ^ components.charCodeAt(i);
      hash = hash & 0xffffffff;
    }
    return (hash >>> 0).toString(16).padStart(8, "0") + "-" + components.length.toString(16);
  } catch {
    return "fp-unavailable";
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return !data.some((v) => v !== 0);
}

function drawTypedSignature(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  clearCanvas(canvas);
  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1e3a5f";
  ctx.font = `italic ${Math.min(canvas.height * 0.6, 52)}px Georgia, serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignatureMode = "type" | "draw" | "upload";

export interface EmbeddedSignerProps {
  documentId: number;
  sigId: number;
  signerName: string;
  signerEmail: string;
  documentTitle?: string;
  signingNotes?: string;
  onComplete: (result: { signedAt: string; signatureImageUrl?: string }) => void;
  onDecline?: () => void;
  themeColor?: string;
  className?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmbeddedSigner({
  documentId,
  sigId,
  signerName,
  signerEmail,
  documentTitle,
  signingNotes,
  onComplete,
  onDecline,
  themeColor = "#8b7ac8",
  className,
}: EmbeddedSignerProps) {
  const [mode, setMode] = useState<SignatureMode>("type");
  const [typedName, setTypedName] = useState(signerName || "");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"review" | "sign" | "done">("review");

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ─── Typed signature preview ─────────────────────────────────────────────

  useEffect(() => {
    if (mode === "type" && typeCanvasRef.current) {
      drawTypedSignature(typeCanvasRef.current, typedName);
    }
  }, [mode, typedName]);

  // ─── Drawing handlers ─────────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const onDrawStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e3a5f";
    ctx.fill();
  }, []);

  const onDrawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas || !lastPos.current) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  }, [isDrawing]);

  const onDrawEnd = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearDraw = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    clearCanvas(canvas);
    setHasDrawn(false);
  }, []);

  // ─── Upload handler ───────────────────────────────────────────────────────

  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // ─── Signature capture ────────────────────────────────────────────────────

  function captureSignatureBase64(): string | null {
    if (mode === "type") {
      const canvas = typeCanvasRef.current;
      if (!canvas || !typedName.trim()) return null;
      return canvasToBase64(canvas);
    }
    if (mode === "draw") {
      const canvas = drawCanvasRef.current;
      if (!canvas || !hasDrawn) return null;
      return canvasToBase64(canvas);
    }
    if (mode === "upload") {
      return uploadPreview;
    }
    return null;
  }

  const isSignatureReady =
    mode === "type" ? typedName.trim().length > 0 :
    mode === "draw" ? hasDrawn :
    mode === "upload" ? !!uploadPreview :
    false;

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSign = useCallback(async () => {
    if (!agreed) { setError("Please read and agree to the signing declaration."); return; }
    const sigImage = captureSignatureBase64();
    if (!sigImage) { setError("Please provide a signature before submitting."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const browserFingerprint = collectBrowserFingerprint();
      const result = await apiFetch(`/documents/${documentId}/sign/${sigId}`, {
        method: "POST",
        body: JSON.stringify({ signatureImage: sigImage, browserFingerprint }),
      });
      setStep("done");
      onComplete({ signedAt: result?.data?.signedAt || new Date().toISOString(), signatureImageUrl: sigImage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [agreed, documentId, sigId, mode, typedName, hasDrawn, uploadPreview, onComplete]);

  const handleDecline = useCallback(async () => {
    if (!window.confirm("Are you sure you want to decline to sign this document?")) return;
    try {
      await apiFetch(`/documents/${documentId}/signatures/${sigId}/decline`, { method: "POST" });
    } catch {}
    onDecline?.();
  }, [documentId, sigId, onDecline]);

  // ─── Done screen ──────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-6 p-12 rounded-2xl bg-slate-900 border border-white/10 text-center", className)}>
        <div className="w-20 h-20 rounded-full bg-[#6b8f71]/10 border-2 border-[#6b8f71]/30 flex items-center justify-center">
          <Check className="w-10 h-10 text-[#6b8f71]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Document Signed</h2>
          <p className="text-white/60 max-w-xs">
            Your signature has been recorded with a full audit trail. You will receive a copy by email.
          </p>
        </div>
        {documentTitle && (
          <div className="text-xs text-white/40 font-mono bg-black/30 rounded-lg px-4 py-2">
            {documentTitle}
          </div>
        )}
      </div>
    );
  }

  // ─── Review step ──────────────────────────────────────────────────────────

  if (step === "review") {
    return (
      <div className={cn("flex flex-col gap-6 p-8 rounded-2xl bg-slate-900 border border-white/10", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Review & Sign</h2>
            {documentTitle && <p className="text-sm text-white/50">{documentTitle}</p>}
          </div>
          <div className="text-right text-xs text-white/40">
            <div>{signerName}</div>
            <div>{signerEmail}</div>
          </div>
        </div>

        {signingNotes && (
          <div className="bg-[#d4a054]/10 border border-[#d4a054]/20 rounded-xl p-4">
            <p className="text-sm text-[#d4a054]">{signingNotes}</p>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-xl p-6 border border-white/5">
          <p className="text-sm text-white/60 leading-relaxed">
            You are being requested to sign the document titled{" "}
            <strong className="text-white">"{documentTitle || "Untitled Document"}"</strong>.
            By proceeding, you acknowledge that your electronic signature is legally binding and
            equivalent to a handwritten signature under applicable e-signature laws (ESIGN Act /
            eIDAS Regulation). A full audit trail of this signing event will be maintained.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-0.5 flex-shrink-0">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
              agreed ? "bg-indigo-500 border-indigo-500" : "border-white/30 bg-transparent"
            )}>
              {agreed && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          <span className="text-sm text-white/70 leading-snug">
            I have reviewed the document and agree to sign electronically. I understand this is
            legally binding and consent to the use of electronic records.
          </span>
        </label>

        <div className="flex gap-3 justify-end">
          {onDecline && (
            <button onClick={handleDecline} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors">
              Decline
            </button>
          )}
          <button
            onClick={() => { if (!agreed) { setError("Please agree to the signing declaration first."); return; } setError(null); setStep("sign"); }}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Continue to Sign
          </button>
        </div>
        {error && <p className="text-sm text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }

  // ─── Sign step ────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col gap-5 p-6 rounded-2xl bg-slate-900 border border-white/10", className)}>
      <div>
        <h2 className="text-lg font-bold text-white mb-0.5">Apply Your Signature</h2>
        <p className="text-xs text-white/40">{documentTitle}</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-lg">
        {(["type", "draw", "upload"] as SignatureMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
              mode === m ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
            )}
          >
            {m === "type" && <><Type className="w-3.5 h-3.5" /> Type</>}
            {m === "draw" && <><Pen className="w-3.5 h-3.5" /> Draw</>}
            {m === "upload" && <><Upload className="w-3.5 h-3.5" /> Upload</>}
          </button>
        ))}
      </div>

      {/* Signature input area */}
      <div className="rounded-xl border-2 border-dashed border-white/10 bg-slate-800/40 overflow-hidden">

        {mode === "type" && (
          <div className="p-5 space-y-4">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name…"
              className="w-full bg-slate-700/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 text-sm outline-none focus:border-indigo-500/50"
            />
            <div className="relative h-24 rounded-xl overflow-hidden bg-white">
              <canvas ref={typeCanvasRef} width={540} height={96} className="absolute inset-0 w-full h-full" />
              {!typedName && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 italic text-lg pointer-events-none">
                  Your signature will appear here
                </div>
              )}
            </div>
          </div>
        )}

        {mode === "draw" && (
          <div className="p-5 space-y-3">
            <div className="relative h-36 rounded-xl overflow-hidden bg-white touch-none select-none cursor-crosshair"
              style={{ userSelect: "none" }}>
              <canvas
                ref={drawCanvasRef}
                width={540}
                height={144}
                className="absolute inset-0 w-full h-full"
                onMouseDown={onDrawStart}
                onMouseMove={onDrawMove}
                onMouseUp={onDrawEnd}
                onMouseLeave={onDrawEnd}
                onTouchStart={onDrawStart}
                onTouchMove={onDrawMove}
                onTouchEnd={onDrawEnd}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 italic text-base pointer-events-none">
                  Draw your signature here
                </div>
              )}
            </div>
            <button onClick={clearDraw} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
        )}

        {mode === "upload" && (
          <div className="p-5 space-y-3">
            <label className="flex flex-col items-center justify-center gap-3 h-32 rounded-xl border border-dashed border-white/20 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors">
              <Upload className="w-6 h-6 text-white/30" />
              <span className="text-xs text-white/40">Click to upload signature image (PNG or JPEG)</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={onUpload} className="sr-only" />
            </label>
            {uploadPreview && (
              <div className="relative rounded-xl overflow-hidden bg-white h-24 flex items-center justify-center">
                <img src={uploadPreview} alt="Uploaded signature" className="max-h-full max-w-full object-contain" />
                <button onClick={() => setUploadPreview(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500/80 flex items-center justify-center hover:bg-rose-400">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signature line decoration */}
      <div className="flex items-center gap-3 px-2">
        <div className="text-xs text-white/30">✕</div>
        <div className="flex-1 border-b border-white/20" />
        <div className="text-xs text-white/30 font-mono">{new Date().toLocaleDateString()}</div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 rounded-lg p-3 border border-rose-500/20">
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button onClick={() => setStep("review")} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">
          Back
        </button>
        {onDecline && (
          <button onClick={handleDecline} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors">
            Decline
          </button>
        )}
        <button
          onClick={handleSign}
          disabled={!isSignatureReady || submitting}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing…</> : <><Check className="w-4 h-4" /> Sign Document</>}
        </button>
      </div>
    </div>
  );
}

export default EmbeddedSigner;
