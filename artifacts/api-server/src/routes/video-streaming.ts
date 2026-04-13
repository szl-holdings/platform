import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { gatewayInfer } from "../lib/ai-gateway";
import { services } from "@szl-holdings/services";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS video_stream_sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      stream_type TEXT NOT NULL DEFAULT 'webrtc',
      domain TEXT NOT NULL DEFAULT 'general',
      source_url TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      frame_rate INTEGER DEFAULT 5,
      resolution TEXT DEFAULT '1280x720',
      ai_analysis_enabled BOOLEAN DEFAULT TRUE,
      analysis_mode TEXT DEFAULT 'general',
      detections JSONB DEFAULT '[]',
      last_frame_at TIMESTAMP,
      total_frames_processed INTEGER DEFAULT 0,
      alerts JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      created_by INTEGER,
      started_at TIMESTAMP,
      ended_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_stream_detections (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES video_stream_sessions(id) ON DELETE CASCADE,
      frame_index INTEGER NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      detection_type TEXT NOT NULL,
      objects JSONB DEFAULT '[]',
      anomalies JSONB DEFAULT '[]',
      scene_classification TEXT,
      confidence REAL DEFAULT 0,
      alert_generated BOOLEAN DEFAULT FALSE,
      alert_severity TEXT,
      annotations JSONB DEFAULT '{}',
      domain_context TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_stream_alerts (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES video_stream_sessions(id) ON DELETE CASCADE,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      frame_index INTEGER,
      detection_data JSONB DEFAULT '{}',
      acknowledged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

ensureTables().catch((err) => logger.warn({ err }, "video-streaming: table init failed"));

const DOMAIN_ANALYSIS_PROMPTS: Record<string, string> = {
  maritime: "Analyze this maritime camera feed frame. Identify: vessels (type, size, direction), harbor congestion, weather conditions, navigation hazards. Return JSON: {objects:[{type,description,position,confidence}],anomalies:[{type,severity,description}],sceneClassification:string,maritimeAlerts:[string]}",
  security: "Analyze this security camera feed for threats. Identify: persons (count, behavior, anomalies), vehicles, objects of interest, access violations, crowd density. Return JSON: {objects:[{type,description,position,confidence}],anomalies:[{type,severity,description}],threatLevel:string,securityAlerts:[string]}",
  property: "Analyze this property walkthrough feed. Identify: room type, condition issues, structural concerns, notable features, maintenance needs. Return JSON: {objects:[{type,description,position,confidence}],anomalies:[{type,severity,description}],roomType:string,conditionScore:number,issues:[string]}",
  general: "Analyze this video frame. Identify objects, detect anomalies, classify the scene. Return JSON: {objects:[{type,description,position,confidence}],anomalies:[{type,severity,description}],sceneClassification:string,summary:string}",
};

async function analyzeFrame(
  domain: string,
  frameDataBase64: string,
  sessionContext: Record<string, unknown>,
): Promise<{
  objects: Array<{ type: string; description: string; position: string; confidence: number }>;
  anomalies: Array<{ type: string; severity: string; description: string }>;
  sceneClassification: string;
  alerts: string[];
  domainInsights: Record<string, unknown>;
}> {
  const prompt = DOMAIN_ANALYSIS_PROMPTS[domain] ?? DOMAIN_ANALYSIS_PROMPTS.general!;

  try {
    const result = await services.ai.chatCompletion([
      { role: "system", content: prompt },
      { role: "user", content: `[Frame data base64: ${frameDataBase64.slice(0, 100)}...] Context: ${JSON.stringify(sessionContext)}` },
    ], { maxTokens: 400 });

    const match = result.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        objects?: Array<{ type: string; description: string; position: string; confidence: number }>;
        anomalies?: Array<{ type: string; severity: string; description: string }>;
        sceneClassification?: string;
        summary?: string;
        threats?: string[];
        issues?: string[];
        maritimeAlerts?: string[];
        securityAlerts?: string[];
      };
      return {
        objects: parsed.objects ?? [],
        anomalies: parsed.anomalies ?? [],
        sceneClassification: parsed.sceneClassification ?? parsed.summary ?? "unknown",
        alerts: [...(parsed.maritimeAlerts ?? []), ...(parsed.securityAlerts ?? []), ...(parsed.issues ?? [])],
        domainInsights: parsed,
      };
    }
  } catch (err) {
    logger.warn({ err, domain }, "video-streaming: frame analysis failed");
  }

  return {
    objects: [],
    anomalies: [],
    sceneClassification: "analysis_unavailable",
    alerts: [],
    domainInsights: {},
  };
}

router.post("/video-streaming/sessions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { title, streamType = "webrtc", domain = "general", sourceUrl, frameRate = 5, resolution = "1280x720", analysisMode = "general" } = req.body as {
      title?: string;
      streamType?: string;
      domain?: string;
      sourceUrl?: string;
      frameRate?: number;
      resolution?: string;
      analysisMode?: string;
    };

    const id = `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const clampedFrameRate = Math.min(Math.max(frameRate, 1), 30);

    await pool.query(
      `INSERT INTO video_stream_sessions (id, title, stream_type, domain, source_url, frame_rate, resolution, analysis_mode, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, title ?? `Stream ${id}`, streamType, domain, sourceUrl ?? null, clampedFrameRate, resolution, analysisMode, req.user?.id ?? null],
    );

    sendCreated(res, {
      id,
      title: title ?? `Stream ${id}`,
      streamType,
      domain,
      frameRate: clampedFrameRate,
      resolution,
      status: "idle",
      wsEndpoint: `/api/video-streaming/sessions/${id}/ws`,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create stream session");
  }
});

router.post("/video-streaming/sessions/:id/start", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE video_stream_sessions SET status='live', started_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id],
    );
    if (!result.rows[0]) {
      sendError(res, "Session not found", 404);
      return;
    }
    sendSuccess(res, { ...result.rows[0], message: "Stream session started" });
  } catch (err) {
    handleRouteError(res, err, "Failed to start stream session");
  }
});

router.post("/video-streaming/sessions/:id/stop", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE video_stream_sessions SET status='ended', ended_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING id, total_frames_processed, alerts`,
      [id],
    );
    if (!result.rows[0]) {
      sendError(res, "Session not found", 404);
      return;
    }
    sendSuccess(res, { ...result.rows[0], message: "Stream session stopped" });
  } catch (err) {
    handleRouteError(res, err, "Failed to stop stream session");
  }
});

router.post("/video-streaming/sessions/:id/analyze-frame", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { frameData, frameIndex = 0 } = req.body as { frameData: string; frameIndex?: number };

    if (!frameData) {
      sendBadRequest(res, "frameData (base64) is required");
      return;
    }

    const session = await pool.query(`SELECT * FROM video_stream_sessions WHERE id=$1`, [id]);
    const s = session.rows[0] as Record<string, unknown> | undefined;

    if (!s) {
      sendError(res, "Session not found", 404);
      return;
    }

    const analysis = await analyzeFrame(
      s.domain as string,
      frameData,
      { domain: s.domain, analysisMode: s.analysis_mode, frameIndex },
    );

    const detectionId = `det-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const highSeverityAnomalies = analysis.anomalies.filter(a => a.severity === "high" || a.severity === "critical");
    const alertGenerated = highSeverityAnomalies.length > 0 || analysis.alerts.length > 0;
    const alertSeverity = highSeverityAnomalies.length > 0 ? highSeverityAnomalies[0]!.severity : (analysis.alerts.length > 0 ? "warning" : null);

    await pool.query(
      `INSERT INTO video_stream_detections (id, session_id, frame_index, detection_type, objects, anomalies, scene_classification, confidence, alert_generated, alert_severity, annotations, domain_context)
       VALUES ($1,$2,$3,'ai_analysis',$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        detectionId, id, frameIndex,
        JSON.stringify(analysis.objects),
        JSON.stringify(analysis.anomalies),
        analysis.sceneClassification,
        analysis.objects.length > 0 ? analysis.objects.reduce((s, o) => s + o.confidence, 0) / analysis.objects.length : 0,
        alertGenerated,
        alertSeverity,
        JSON.stringify(analysis.domainInsights),
        s.domain as string,
      ],
    );

    await pool.query(
      `UPDATE video_stream_sessions SET total_frames_processed=total_frames_processed+1, last_frame_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [id],
    );

    const alerts: Array<{ id: string; type: string; severity: string; message: string }> = [];

    for (const anomaly of highSeverityAnomalies) {
      const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await pool.query(
        `INSERT INTO video_stream_alerts (id, session_id, alert_type, severity, message, frame_index, detection_data)
         VALUES ($1,$2,'anomaly_detected',$3,$4,$5,$6)`,
        [alertId, id, anomaly.severity, anomaly.description, frameIndex, JSON.stringify({ anomaly, detectionId })],
      );
      alerts.push({ id: alertId, type: "anomaly_detected", severity: anomaly.severity, message: anomaly.description });
    }

    for (const alertMsg of analysis.alerts) {
      const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await pool.query(
        `INSERT INTO video_stream_alerts (id, session_id, alert_type, severity, message, frame_index, detection_data)
         VALUES ($1,$2,'domain_alert','warning',$3,$4,$5)`,
        [alertId, id, alertMsg, frameIndex, JSON.stringify({ detectionId })],
      );
      alerts.push({ id: alertId, type: "domain_alert", severity: "warning", message: alertMsg });
    }

    sendSuccess(res, {
      detectionId,
      frameIndex,
      analysis,
      alertGenerated,
      alerts,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to analyze frame");
  }
});

router.get("/video-streaming/sessions/:id/detections", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit: lStr = "50", alertsOnly } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(lStr, 10) || 50, 500);

    let q = `SELECT * FROM video_stream_detections WHERE session_id=$1`;
    if (alertsOnly === "true") q += ` AND alert_generated=TRUE`;
    q += ` ORDER BY frame_index DESC LIMIT $2`;

    const result = await pool.query(q, [id, limit]);
    sendSuccess(res, { detections: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to get detections");
  }
});

router.get("/video-streaming/sessions/:id/alerts", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acknowledged } = req.query as Record<string, string>;

    let q = `SELECT * FROM video_stream_alerts WHERE session_id=$1`;
    const params: unknown[] = [id];
    if (acknowledged !== undefined) {
      q += ` AND acknowledged=$2`;
      params.push(acknowledged === "true");
    }
    q += ` ORDER BY created_at DESC`;

    const result = await pool.query(q, params);
    sendSuccess(res, { alerts: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to get alerts");
  }
});

router.patch("/video-streaming/sessions/:id/alerts/:alertId/acknowledge", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id, alertId } = req.params;
    await pool.query(
      `UPDATE video_stream_alerts SET acknowledged=TRUE WHERE id=$1 AND session_id=$2`,
      [alertId, id],
    );
    sendSuccess(res, { acknowledged: true, alertId });
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge alert");
  }
});

router.get("/video-streaming/sessions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { status, domain, limit: lStr = "20" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(lStr, 10) || 20, 100);

    let q = `SELECT id, title, stream_type, domain, status, frame_rate, resolution, total_frames_processed, last_frame_at, started_at, created_at FROM video_stream_sessions WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (status) { q += ` AND status = $${idx++}`; params.push(status); }
    if (domain) { q += ` AND domain = $${idx++}`; params.push(domain); }
    q += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);

    const result = await pool.query(q, params);
    sendSuccess(res, { sessions: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to list sessions");
  }
});

router.get("/video-streaming/sessions/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const session = await pool.query(`SELECT * FROM video_stream_sessions WHERE id=$1`, [req.params.id]);
    if (!session.rows[0]) {
      sendError(res, "Session not found", 404);
      return;
    }
    const alerts = await pool.query(`SELECT * FROM video_stream_alerts WHERE session_id=$1 AND acknowledged=FALSE ORDER BY created_at DESC LIMIT 10`, [req.params.id]);
    const lastDetections = await pool.query(`SELECT * FROM video_stream_detections WHERE session_id=$1 ORDER BY frame_index DESC LIMIT 5`, [req.params.id]);

    sendSuccess(res, {
      ...session.rows[0],
      activeAlerts: alerts.rows,
      recentDetections: lastDetections.rows,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get session");
  }
});

export default router;
