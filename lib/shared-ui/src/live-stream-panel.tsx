import React, { useState, useEffect, useRef, useCallback } from "react";

export type StreamDomain = "maritime" | "security" | "property" | "general";

export interface StreamAlert {
  id: string;
  type: string;
  severity: "info" | "warning" | "high" | "critical";
  message: string;
  timestamp: string;
}

export interface StreamDetection {
  id: string;
  frame_index: number;
  scene_classification: string;
  objects: Array<{ type: string; description: string; confidence: number }>;
  anomalies: Array<{ type: string; severity: string; description: string }>;
  alert_generated: boolean;
}

export interface LiveStreamPanelProps {
  domain: StreamDomain;
  apiBase: string;
  title?: string;
  compact?: boolean;
  onAlert?: (alert: StreamAlert) => void;
  onDetection?: (detection: StreamDetection) => void;
}

const DOMAIN_META: Record<StreamDomain, { color: string; label: string; icon: string }> = {
  maritime: { color: "#0ea5e9", label: "Maritime Monitor", icon: "⚓" },
  security: { color: "#ef4444", label: "Security Surveillance", icon: "🛡️" },
  property: { color: "#22c55e", label: "Property Walkthrough", icon: "🏠" },
  general: { color: "#8b5cf6", label: "Live Vision Feed", icon: "📹" },
};

export function LiveStreamPanel({ domain, apiBase, title, compact = false, onAlert, onDetection }: LiveStreamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "error">("idle");
  const [alerts, setAlerts] = useState<StreamAlert[]>([]);
  const [detections, setDetections] = useState<StreamDetection[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [frameRate, setFrameRate] = useState(2);
  const [showDebug, setShowDebug] = useState(false);

  const meta = DOMAIN_META[domain];

  const analyzeFrame = useCallback(async (sessionId: string, frameData: string, frameIndex: number) => {
    try {
      const res = await fetch(`${apiBase}/video-streaming/sessions/${sessionId}/analyze-frame`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameData, frameIndex }),
      });
      if (!res.ok) return;
      const result = await res.json() as { data: { analysis: StreamDetection; alerts: StreamAlert[] } };
      const data = result.data;

      if (data.analysis) {
        setDetections(prev => [data.analysis, ...prev].slice(0, 20));
        onDetection?.(data.analysis);
      }
      if (data.alerts?.length) {
        setAlerts(prev => [...data.alerts, ...prev].slice(0, 50));
        data.alerts.forEach((a: StreamAlert) => onAlert?.(a));
      }
    } catch { }
  }, [apiBase, onAlert, onDetection]);

  const startStream = useCallback(async () => {
    setStatus("starting");
    setError(null);

    try {
      const session = await fetch(`${apiBase}/video-streaming/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title ?? `${meta.label} Session`, domain, frameRate, analysisMode: domain }),
      });
      if (!session.ok) throw new Error("Failed to create stream session");
      const sessionData = await session.json() as { data: { id: string } };
      const sid = sessionData.data.id;
      setSessionId(sid);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await fetch(`${apiBase}/video-streaming/sessions/${sid}/start`, {
        method: "POST",
        credentials: "include",
      });

      setStatus("live");
      let frameIndex = 0;

      intervalRef.current = setInterval(async () => {
        if (!canvasRef.current || !videoRef.current) return;
        const video = videoRef.current;
        if (video.readyState < 2) return;

        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const frameData = canvas.toDataURL("image/jpeg", 0.6).split(",")[1] ?? "";
        setFrameCount(prev => prev + 1);
        analyzeFrame(sid, frameData, frameIndex++);
      }, Math.round(1000 / frameRate));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start stream");
      setStatus("error");
    }
  }, [apiBase, domain, frameRate, meta.label, title, analyzeFrame]);

  const stopStream = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (sessionId) {
      try {
        await fetch(`${apiBase}/video-streaming/sessions/${sessionId}/stop`, {
          method: "POST",
          credentials: "include",
        });
      } catch { }
    }
    setStatus("idle");
    setSessionId(null);
  }, [apiBase, sessionId]);

  useEffect(() => {
    return () => { stopStream(); };
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    if (!sessionId) return;
    await fetch(`${apiBase}/video-streaming/sessions/${sessionId}/alerts/${alertId}/acknowledge`, {
      method: "PATCH",
      credentials: "include",
    });
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const severityColors: Record<string, string> = {
    info: "#3b82f6",
    warning: "#f59e0b",
    high: "#ef4444",
    critical: "#dc2626",
  };

  if (compact) {
    return (
      <div style={{ background: "#0f1520", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 12, fontFamily: "system-ui, sans-serif", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{meta.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{title ?? meta.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {status === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 1s infinite" }} />}
            <span style={{ fontSize: 11, color: status === "live" ? "#22c55e" : "#6b7280" }}>
              {status === "live" ? `LIVE · ${frameCount}f` : status}
            </span>
            <button
              onClick={status === "live" ? stopStream : startStream}
              style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: status === "live" ? "#ef4444" : meta.color, color: "#fff" }}
            >
              {status === "live" ? "Stop" : status === "starting" ? "..." : "Live"}
            </button>
          </div>
        </div>
        {alerts.length > 0 && (
          <div style={{ fontSize: 10, color: severityColors[alerts[0]!.severity] ?? "#fff", background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "4px 8px" }}>
            ⚠ {alerts[0]!.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#080c14", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}20`, border: `1px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{title ?? meta.label}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {status === "live" ? `Streaming · ${frameCount} frames analyzed` : status === "starting" ? "Initializing..." : "Camera feed — AI analysis ready"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {status === "live" && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>LIVE</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
            <span>FPS:</span>
            <select
              value={frameRate}
              onChange={e => setFrameRate(parseInt(e.target.value))}
              disabled={status === "live"}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fff", fontSize: 11, padding: "2px 4px" }}
            >
              {[1, 2, 5, 10].map(fps => <option key={fps} value={fps}>{fps}</option>)}
            </select>
          </div>
          <button
            onClick={status === "live" ? stopStream : startStream}
            disabled={status === "starting"}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: status === "starting" ? "not-allowed" : "pointer",
              background: status === "live" ? "#ef4444" : meta.color,
              color: "#fff", fontSize: 12, fontWeight: 600,
              opacity: status === "starting" ? 0.6 : 1,
            }}
          >
            {status === "live" ? "■ Stop" : status === "starting" ? "Starting..." : "▶ Start"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", minHeight: 300 }}>
        <div style={{ position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain", display: status === "live" ? "block" : "none" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {status !== "live" && (
            <div style={{ textAlign: "center", color: "#374151" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{meta.icon}</div>
              <div style={{ fontSize: 12 }}>{error ?? "Click Start to begin live analysis"}</div>
            </div>
          )}
          {status === "live" && detections.length > 0 && detections[0] && (
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.8)", borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>
              <div style={{ color: "#9ca3af", marginBottom: 2 }}>Scene: {detections[0].scene_classification}</div>
              {detections[0].objects.slice(0, 3).map((obj, i) => (
                <div key={i} style={{ color: "#e5e7eb" }}>• {obj.type}: {obj.description.slice(0, 40)}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Alerts {alerts.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "50%", padding: "1px 5px", marginLeft: 4 }}>{alerts.length}</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {alerts.length === 0 ? (
              <div style={{ padding: "16px 12px", color: "#374151", fontSize: 11, textAlign: "center" }}>
                {status === "live" ? "Monitoring — no alerts" : "Start stream to monitor"}
              </div>
            ) : alerts.slice(0, 20).map(alert => (
              <div key={alert.id} style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: severityColors[alert.severity] ?? "#6b7280", flexShrink: 0, marginTop: 3 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#e5e7eb", lineHeight: 1.3 }}>{alert.message}</div>
                  <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>{alert.type} · {alert.severity}</div>
                </div>
                <button onClick={() => acknowledgeAlert(alert.id)} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 10, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>

          {detections.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>LAST DETECTION</div>
              <div style={{ fontSize: 11, color: "#e5e7eb" }}>{detections[0]?.scene_classification ?? "—"}</div>
              {detections[0]?.anomalies.length ? (
                detections[0].anomalies.slice(0, 2).map((a, i) => (
                  <div key={i} style={{ fontSize: 10, color: severityColors[a.severity] ?? "#9ca3af", marginTop: 2 }}>⚠ {a.description.slice(0, 60)}</div>
                ))
              ) : (
                <div style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>No anomalies detected</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
