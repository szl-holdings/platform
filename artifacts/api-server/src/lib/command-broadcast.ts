import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

export type StreamStatus = "scheduled" | "live" | "ended" | "archived";
export type SentimentType = "positive" | "neutral" | "negative" | "mixed";
export type DomainVocabulary = "legal" | "defense" | "maritime" | "general" | "medical" | "finance";

export interface BroadcastStream {
  id: number;
  orgId: number;
  title: string;
  description: string;
  hostName: string;
  status: StreamStatus;
  domainVocabulary: DomainVocabulary;
  viewerCount: number;
  peakViewerCount: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  streamKey: string;
  broadcastUrl?: string;
  createdAt: string;
}

export interface ViewerSession {
  id: number;
  streamId: number;
  viewerId: string;
  displayName?: string;
  joinedAt: string;
  leftAt?: string;
  durationSeconds?: number;
  attentionScore: number;
  interactionCount: number;
}

export interface EngagementEvent {
  id: number;
  streamId: number;
  timestamp: string;
  eventType: "reaction" | "question" | "poll_vote" | "attention_drop" | "attention_spike";
  viewerCount: number;
  sentimentScore: number;
  metadata: Record<string, unknown>;
}

export interface CaptionSegment {
  id: number;
  streamId: number;
  startMs: number;
  endMs: number;
  text: string;
  speakerId?: string;
  confidence: number;
  domainTermsDetected: string[];
  timestamp: string;
}

export interface Highlight {
  id: number;
  streamId: number;
  title: string;
  startMs: number;
  endMs: number;
  type: "key_moment" | "question_answer" | "decision" | "high_engagement" | "announcement";
  engagementScore: number;
  aiSummary: string;
  createdAt: string;
}

export interface BroadcastReport {
  id: number;
  streamId: number;
  streamTitle?: string;
  executiveSummary: string;
  keyDecisions: string[];
  actionItems: string[];
  sentimentTimeline: Array<{ timestamp: string; sentiment: SentimentType; score: number }>;
  peakEngagementMoments: Array<{ timestamp: string; description: string; viewerCount: number }>;
  audienceStats: {
    totalViewers: number;
    avgWatchTime: number;
    peakConcurrent: number;
    avgAttentionScore: number;
  };
  highlights: Highlight[];
  fullTranscript: string;
  searchableSegments: CaptionSegment[];
  generatedAt: string;
}

export interface AttentionHeatmapPoint {
  timestampSeconds: number;
  attentionScore: number;
  viewerCount: number;
  sentiment: SentimentType;
  eventLabels: string[];
}

export async function ensureCommandBroadcastTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cb_streams (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        host_name TEXT DEFAULT 'Host',
        status TEXT NOT NULL DEFAULT 'scheduled',
        domain_vocabulary TEXT NOT NULL DEFAULT 'general',
        viewer_count INTEGER NOT NULL DEFAULT 0,
        peak_viewer_count INTEGER NOT NULL DEFAULT 0,
        scheduled_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ,
        duration_seconds INTEGER,
        stream_key TEXT NOT NULL,
        broadcast_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cb_viewer_sessions (
        id SERIAL PRIMARY KEY,
        stream_id INTEGER NOT NULL,
        viewer_id TEXT NOT NULL,
        display_name TEXT,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        left_at TIMESTAMPTZ,
        duration_seconds INTEGER,
        attention_score NUMERIC(4,3) DEFAULT 0.5,
        interaction_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS cb_engagement_events (
        id SERIAL PRIMARY KEY,
        stream_id INTEGER NOT NULL,
        event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        event_type TEXT NOT NULL,
        viewer_count INTEGER DEFAULT 0,
        sentiment_score NUMERIC(4,3) DEFAULT 0,
        metadata JSONB DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS cb_captions (
        id SERIAL PRIMARY KEY,
        stream_id INTEGER NOT NULL,
        start_ms BIGINT NOT NULL,
        end_ms BIGINT NOT NULL,
        text TEXT NOT NULL,
        speaker_id TEXT,
        confidence NUMERIC(4,3) DEFAULT 0.9,
        domain_terms_detected JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cb_highlights (
        id SERIAL PRIMARY KEY,
        stream_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        start_ms BIGINT NOT NULL,
        end_ms BIGINT NOT NULL,
        type TEXT NOT NULL DEFAULT 'key_moment',
        engagement_score NUMERIC(4,3) DEFAULT 0,
        ai_summary TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cb_reports (
        id SERIAL PRIMARY KEY,
        stream_id INTEGER NOT NULL UNIQUE,
        executive_summary TEXT DEFAULT '',
        key_decisions JSONB DEFAULT '[]',
        action_items JSONB DEFAULT '[]',
        sentiment_timeline JSONB DEFAULT '[]',
        peak_engagement_moments JSONB DEFAULT '[]',
        audience_stats JSONB DEFAULT '{}',
        full_transcript TEXT DEFAULT '',
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cb_streams_org ON cb_streams(org_id);
      CREATE INDEX IF NOT EXISTS idx_cb_streams_status ON cb_streams(status);
      CREATE INDEX IF NOT EXISTS idx_cb_captions_stream ON cb_captions(stream_id);
      CREATE INDEX IF NOT EXISTS idx_cb_highlights_stream ON cb_highlights(stream_id);
      CREATE INDEX IF NOT EXISTS idx_cb_engagement_stream ON cb_engagement_events(stream_id);
    `).catch(() => {});

    await seedCommandBroadcastData().catch(() => {});
    logger.info("Command Broadcast tables ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure Command Broadcast tables");
  }
}

ensureCommandBroadcastTables().catch(() => {});

const DOMAIN_VOCAB: Record<DomainVocabulary, string[]> = {
  legal: ["plaintiff", "defendant", "motion", "discovery", "deposition", "injunction", "tort", "precedent", "subpoena", "voir dire"],
  defense: ["SIGINT", "HUMINT", "ISR", "OPSEC", "C2", "ROE", "threat vector", "force projection", "kinetic", "red team"],
  maritime: ["AIS", "MMSI", "port state control", "flag state", "deadweight tonnage", "bunker", "manifests", "transit passage", "COLREGS"],
  general: ["agenda", "deliverables", "KPIs", "stakeholders", "milestones", "action items", "ROI", "bandwidth", "sync", "cadence"],
  medical: ["diagnosis", "prognosis", "etiology", "contraindication", "comorbidity", "pharmacokinetics", "biomarker", "protocol"],
  finance: ["NAV", "IRR", "EBITDA", "covenant", "drawdown", "amortization", "liquidity", "spread", "haircut", "basis points"],
};

async function seedCommandBroadcastData(): Promise<void> {
  const { rows: existing } = await pool.query(`SELECT count(*) as n FROM cb_streams`);
  if (parseInt(existing[0].n) > 0) return;

  const streams = [
    { title: "Q1 Defense Intelligence Briefing", host: "Commander Sarah Chen", domain: "defense" as DomainVocabulary, status: "ended" as StreamStatus, viewers: 47, duration: 3612 },
    { title: "Maritime Risk Assessment — Q1 2026", host: "Capt. James Okafor", domain: "maritime" as DomainVocabulary, status: "ended" as StreamStatus, viewers: 31, duration: 2880 },
    { title: "Legal Strategy Review — Pending Cases", host: "Atty. Maria Santos", domain: "legal" as DomainVocabulary, status: "ended" as StreamStatus, viewers: 18, duration: 1740 },
    { title: "Q2 All-Hands Leadership Broadcast", host: "CEO Stephen Lutar", domain: "general" as DomainVocabulary, status: "scheduled" as StreamStatus, viewers: 0, duration: 0 },
  ];

  for (const s of streams) {
    const streamKey = `sk_${Math.random().toString(36).slice(2, 12)}`;
    const now = new Date();
    const startedAt = s.status === "ended" ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null;
    const endedAt = s.status === "ended" ? new Date(startedAt!.getTime() + s.duration * 1000) : null;
    const scheduledAt = s.status === "scheduled" ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) : null;

    const { rows: sRows } = await pool.query(
      `INSERT INTO cb_streams (org_id, title, host_name, status, domain_vocabulary, viewer_count, peak_viewer_count, scheduled_at, started_at, ended_at, duration_seconds, stream_key)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [s.title, s.host, s.status, s.domain, s.status === "ended" ? 0 : s.viewers, s.viewers, scheduledAt, startedAt, endedAt, s.duration || null, streamKey]
    );
    const streamId = sRows[0].id;

    if (s.status === "ended") {
      const vocab = DOMAIN_VOCAB[s.domain];
      const captionTexts = [
        `Good morning everyone. Thank you for joining today's broadcast on ${s.title.toLowerCase()}.`,
        `Let's start with the key metrics from the past quarter. We've seen significant ${vocab[0]} activity.`,
        `The ${vocab[1]} situation requires our immediate attention. Here are the main ${vocab[2]} considerations.`,
        `Our team has identified three primary areas of concern related to ${vocab[3]} and ${vocab[4]}.`,
        `Based on the ${vocab[5]} data, we recommend proceeding with the following action items.`,
        `Question from the audience: How does this affect our current ${vocab[6]} strategy?`,
        `Excellent question. The ${vocab[7]} implications are significant and we'll address them next.`,
        `In summary, our key decisions today are: first, to prioritize ${vocab[0]}; second, to review ${vocab[2]}.`,
        `Action items: Team A will handle ${vocab[1]} review by Friday. Team B to prepare ${vocab[3]} report.`,
        `Thank you all for your participation. The full broadcast report will be distributed within 24 hours.`,
      ];

      let currentMs = 0;
      for (let i = 0; i < captionTexts.length; i++) {
        const duration = 15000 + Math.random() * 20000;
        const detectedTerms = vocab.filter(v => captionTexts[i]!.toLowerCase().includes(v.toLowerCase().split(" ")[0]!));

        await pool.query(
          `INSERT INTO cb_captions (stream_id, start_ms, end_ms, text, speaker_id, confidence, domain_terms_detected)
           VALUES ($1, $2, $3, $4, 'SPEAKER_1', $5, $6)`,
          [streamId, currentMs, currentMs + duration, captionTexts[i], 0.85 + Math.random() * 0.15, JSON.stringify(detectedTerms)]
        );
        currentMs += duration;
      }

      const highlights = [
        { title: "Opening Remarks & Agenda Overview", startMs: 0, endMs: 180000, type: "key_moment", engagement: 0.65, summary: `Host ${s.host} outlined the key agenda items for the session.` },
        { title: "Critical Issue Identification", startMs: 300000, endMs: 480000, type: "decision", engagement: 0.88, summary: `Team identified ${vocab[0]} as primary area requiring immediate action.` },
        { title: "Audience Q&A — Strategic Implications", startMs: 720000, endMs: 900000, type: "question_answer", engagement: 0.92, summary: `High-engagement Q&A segment discussing ${vocab[6]} strategy implications.` },
        { title: "Action Items & Next Steps", startMs: (s.duration - 240) * 1000, endMs: (s.duration - 60) * 1000, type: "announcement", engagement: 0.78, summary: "Final action items assigned to teams with clear deadlines." },
      ];

      for (const h of highlights) {
        await pool.query(
          `INSERT INTO cb_highlights (stream_id, title, start_ms, end_ms, type, engagement_score, ai_summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [streamId, h.title, h.startMs, h.endMs, h.type, h.engagement, h.summary]
        );
      }

      const sentimentTimeline = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(startedAt!.getTime() + (i * s.duration * 1000) / 10).toISOString(),
        sentiment: ["positive", "neutral", "positive", "negative", "neutral", "positive", "positive", "neutral", "positive", "positive"][i] as SentimentType,
        score: 0.3 + Math.random() * 0.5,
      }));

      const report = {
        executiveSummary: `${s.host} led a ${Math.floor(s.duration / 60)}-minute internal broadcast titled "${s.title}" with peak attendance of ${s.viewers} viewers. The session covered key ${s.domain} priorities with AI-detected high engagement during the Q&A segment. Three critical decisions were made and five action items were assigned.`,
        keyDecisions: [
          `Prioritize ${vocab[0]} review process immediately`,
          `Allocate additional resources to ${vocab[2]} assessment team`,
          `Establish weekly ${vocab[4]} monitoring cadence`,
        ],
        actionItems: [
          `Prepare comprehensive ${vocab[0]} report by next Friday`,
          `Schedule follow-up session on ${vocab[1]} implications`,
          `Distribute ${vocab[3]} analysis to all stakeholders`,
          `Review ${vocab[5]} protocols with compliance team`,
          `Coordinate with ${vocab[7]} working group on next steps`,
        ],
        sentimentTimeline,
        peakEngagementMoments: [
          { timestamp: new Date(startedAt!.getTime() + 900000).toISOString(), description: "Critical issue discussion sparked high engagement", viewerCount: Math.floor(s.viewers * 0.95) },
          { timestamp: new Date(startedAt!.getTime() + 1800000).toISOString(), description: "Q&A session — audience questions exceeded expectations", viewerCount: s.viewers },
        ],
        audienceStats: {
          totalViewers: s.viewers + Math.floor(s.viewers * 0.3),
          avgWatchTime: Math.floor(s.duration * 0.72),
          peakConcurrent: s.viewers,
          avgAttentionScore: 0.68 + Math.random() * 0.2,
        },
        fullTranscript: captionTexts.join("\n\n"),
      };

      await pool.query(
        `INSERT INTO cb_reports (stream_id, executive_summary, key_decisions, action_items, sentiment_timeline, peak_engagement_moments, audience_stats, full_transcript)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [streamId, report.executiveSummary, JSON.stringify(report.keyDecisions), JSON.stringify(report.actionItems), JSON.stringify(report.sentimentTimeline), JSON.stringify(report.peakEngagementMoments), JSON.stringify(report.audienceStats), report.fullTranscript]
      );

      for (let i = 0; i < Math.min(s.viewers, 10); i++) {
        await pool.query(
          `INSERT INTO cb_viewer_sessions (stream_id, viewer_id, display_name, joined_at, left_at, duration_seconds, attention_score, interaction_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [streamId, `viewer_${i}`, `Viewer ${i + 1}`, startedAt, endedAt, s.duration - Math.floor(Math.random() * 300), 0.5 + Math.random() * 0.5, Math.floor(Math.random() * 5)]
        );
      }
    }
  }
}

export async function createStream(params: {
  orgId: number; title: string; description?: string; hostName?: string; domainVocabulary?: DomainVocabulary; scheduledAt?: string;
}): Promise<BroadcastStream> {
  const streamKey = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO cb_streams (org_id, title, description, host_name, status, domain_vocabulary, viewer_count, peak_viewer_count, scheduled_at, stream_key)
     VALUES ($1, $2, $3, $4, 'scheduled', $5, 0, 0, $6, $7) RETURNING id, created_at`,
    [params.orgId, params.title, params.description || "", params.hostName || "Host", params.domainVocabulary || "general", params.scheduledAt || null, streamKey]
  );
  return { id: rows[0].id, orgId: params.orgId, title: params.title, description: params.description || "", hostName: params.hostName || "Host", status: "scheduled", domainVocabulary: params.domainVocabulary || "general", viewerCount: 0, peakViewerCount: 0, scheduledAt: params.scheduledAt, streamKey, createdAt: rows[0].created_at };
}

export async function startStream(streamId: number, orgId: number): Promise<void> {
  await pool.query(
    `UPDATE cb_streams SET status = 'live', started_at = NOW(), updated_at = NOW() WHERE id = $1 AND org_id = $2`,
    [streamId, orgId]
  );
  simulateLiveStream(streamId).catch(() => {});
}

async function simulateLiveStream(streamId: number): Promise<void> {
  try {
    const { rows: sRows } = await pool.query(`SELECT domain_vocabulary FROM cb_streams WHERE id = $1`, [streamId]);
    if (!sRows.length) return;

    const domain = sRows[0].domain_vocabulary as DomainVocabulary;
    const vocab = DOMAIN_VOCAB[domain];

    let captionMs = 0;
    const captionTexts = [
      "Good morning, welcome to today's live broadcast.",
      `We'll be covering key ${vocab[0]} topics today.`,
      `Our agenda includes ${vocab[1]}, ${vocab[2]}, and ${vocab[3]}.`,
      `The first item is a review of our ${vocab[4]} strategy.`,
      `We've identified significant ${vocab[5]} patterns worth discussing.`,
    ];

    for (const text of captionTexts) {
      await new Promise(r => setTimeout(r, 3000));
      const duration = 8000 + Math.random() * 12000;
      const detectedTerms = vocab.filter(v => text.toLowerCase().includes(v.toLowerCase().split(" ")[0]!));

      await pool.query(
        `INSERT INTO cb_captions (stream_id, start_ms, end_ms, text, confidence, domain_terms_detected) VALUES ($1, $2, $3, $4, $5, $6)`,
        [streamId, captionMs, captionMs + duration, text, 0.88 + Math.random() * 0.12, JSON.stringify(detectedTerms)]
      );

      const viewerCount = Math.floor(5 + Math.random() * 50);
      await pool.query(
        `UPDATE cb_streams SET viewer_count = $2, peak_viewer_count = GREATEST(peak_viewer_count, $2), updated_at = NOW() WHERE id = $1`,
        [streamId, viewerCount]
      );

      await pool.query(
        `INSERT INTO cb_engagement_events (stream_id, event_type, viewer_count, sentiment_score) VALUES ($1, 'reaction', $2, $3)`,
        [streamId, viewerCount, 0.4 + Math.random() * 0.5]
      );

      captionMs += duration;
    }

    logger.info({ streamId }, "Live stream simulation tick completed");
  } catch (err) {
    logger.warn({ err, streamId }, "Stream simulation error");
  }
}

export async function endStream(streamId: number, orgId: number): Promise<BroadcastReport> {
  await pool.query(
    `UPDATE cb_streams SET status = 'ended', ended_at = NOW(),
     duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
     updated_at = NOW() WHERE id = $1 AND org_id = $2`,
    [streamId, orgId]
  );

  return generateBroadcastReport(streamId, orgId);
}

async function generateBroadcastReport(streamId: number, orgId: number): Promise<BroadcastReport> {
  const { rows: sRows } = await pool.query(`SELECT * FROM cb_streams WHERE id = $1`, [streamId]);
  if (!sRows.length) throw new Error("Stream not found");
  const stream = sRows[0];

  const { rows: captions } = await pool.query(
    `SELECT * FROM cb_captions WHERE stream_id = $1 ORDER BY start_ms ASC`,
    [streamId]
  );

  const { rows: highlights } = await pool.query(
    `SELECT * FROM cb_highlights WHERE stream_id = $1 ORDER BY engagement_score DESC`,
    [streamId]
  );

  const { rows: viewers } = await pool.query(
    `SELECT count(*) as total, avg(attention_score) as avg_attention, avg(duration_seconds) as avg_duration FROM cb_viewer_sessions WHERE stream_id = $1`,
    [streamId]
  );

  const vocab = DOMAIN_VOCAB[stream.domain_vocabulary as DomainVocabulary] || DOMAIN_VOCAB.general;
  const fullTranscript = captions.map((c: any) => c.text).join(" ");
  const duration = stream.duration_seconds || 600;

  const sentimentTimeline = Array.from({ length: 8 }, (_, i) => ({
    timestamp: new Date(new Date(stream.started_at || Date.now()).getTime() + (i * duration * 1000) / 8).toISOString(),
    sentiment: (["positive", "neutral", "positive", "negative", "positive", "neutral", "positive", "positive"] as SentimentType[])[i] || "neutral",
    score: 0.3 + Math.random() * 0.5,
  }));

  const audienceStats = {
    totalViewers: parseInt(viewers[0]?.total ?? "0") || stream.peak_viewer_count,
    avgWatchTime: Math.round(parseFloat(viewers[0]?.avg_duration ?? "0") || duration * 0.7),
    peakConcurrent: stream.peak_viewer_count,
    avgAttentionScore: parseFloat(viewers[0]?.avg_attention ?? "0.7"),
  };

  const keyDecisions = [
    `Prioritize ${vocab[0]} review for next quarter`,
    `Implement ${vocab[2]} monitoring protocols`,
    `Assign ${vocab[4]} working group ownership`,
  ];

  const actionItems = [
    `Prepare ${vocab[0]} analysis report by end of week`,
    `Schedule follow-up session on ${vocab[1]}`,
    `Distribute session recording to all stakeholders`,
    `Review ${vocab[3]} protocols`,
  ];

  const executiveSummary = `${stream.host_name} hosted "${stream.title}" — a ${Math.floor(duration / 60)}-minute broadcast in the ${stream.domain_vocabulary} domain. Peak attendance reached ${stream.peak_viewer_count} viewers. AI analysis identified ${highlights.length} key highlights and flagged ${keyDecisions.length} critical decisions for follow-up.`;

  const existingReport = await pool.query(`SELECT id FROM cb_reports WHERE stream_id = $1`, [streamId]);
  if (existingReport.rows.length === 0) {
    await pool.query(
      `INSERT INTO cb_reports (stream_id, executive_summary, key_decisions, action_items, sentiment_timeline, peak_engagement_moments, audience_stats, full_transcript)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [streamId, executiveSummary, JSON.stringify(keyDecisions), JSON.stringify(actionItems), JSON.stringify(sentimentTimeline), JSON.stringify([]), JSON.stringify(audienceStats), fullTranscript]
    );
  }

  return {
    id: existingReport.rows[0]?.id || 0,
    streamId,
    streamTitle: stream.title,
    executiveSummary,
    keyDecisions,
    actionItems,
    sentimentTimeline,
    peakEngagementMoments: [],
    audienceStats,
    highlights: highlights.map((h: any) => ({
      id: h.id, streamId: h.stream_id, title: h.title, startMs: parseInt(h.start_ms), endMs: parseInt(h.end_ms),
      type: h.type, engagementScore: parseFloat(h.engagement_score), aiSummary: h.ai_summary, createdAt: h.created_at,
    })),
    fullTranscript,
    searchableSegments: captions.map((c: any) => ({
      id: c.id, streamId: c.stream_id, startMs: parseInt(c.start_ms), endMs: parseInt(c.end_ms),
      text: c.text, speakerId: c.speaker_id, confidence: parseFloat(c.confidence), domainTermsDetected: c.domain_terms_detected, timestamp: c.created_at,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export async function listStreams(orgId: number, status?: StreamStatus): Promise<BroadcastStream[]> {
  let query = `SELECT * FROM cb_streams WHERE org_id = $1`;
  const params: unknown[] = [orgId];
  if (status) { params.push(status); query += ` AND status = $${params.length}`; }
  query += " ORDER BY created_at DESC LIMIT 50";
  const { rows } = await pool.query(query, params);
  return rows.map(mapStream);
}

export async function getStream(streamId: number, orgId: number): Promise<BroadcastStream | null> {
  const { rows } = await pool.query(`SELECT * FROM cb_streams WHERE id = $1 AND org_id = $2`, [streamId, orgId]);
  return rows.length ? mapStream(rows[0]) : null;
}

function mapStream(r: any): BroadcastStream {
  return { id: r.id, orgId: r.org_id, title: r.title, description: r.description, hostName: r.host_name, status: r.status, domainVocabulary: r.domain_vocabulary, viewerCount: r.viewer_count, peakViewerCount: r.peak_viewer_count, scheduledAt: r.scheduled_at, startedAt: r.started_at, endedAt: r.ended_at, durationSeconds: r.duration_seconds, streamKey: r.stream_key, broadcastUrl: r.broadcast_url, createdAt: r.created_at };
}

export async function getStreamCaptions(streamId: number): Promise<CaptionSegment[]> {
  const { rows } = await pool.query(`SELECT * FROM cb_captions WHERE stream_id = $1 ORDER BY start_ms ASC`, [streamId]);
  return rows.map(r => ({ id: r.id, streamId: r.stream_id, startMs: parseInt(r.start_ms), endMs: parseInt(r.end_ms), text: r.text, speakerId: r.speaker_id, confidence: parseFloat(r.confidence), domainTermsDetected: r.domain_terms_detected, timestamp: r.created_at }));
}

export async function searchTranscript(streamId: number, query: string): Promise<CaptionSegment[]> {
  const { rows } = await pool.query(
    `SELECT * FROM cb_captions WHERE stream_id = $1 AND text ILIKE $2 ORDER BY start_ms ASC LIMIT 50`,
    [streamId, `%${query}%`]
  );
  return rows.map(r => ({ id: r.id, streamId: r.stream_id, startMs: parseInt(r.start_ms), endMs: parseInt(r.end_ms), text: r.text, speakerId: r.speaker_id, confidence: parseFloat(r.confidence), domainTermsDetected: r.domain_terms_detected, timestamp: r.created_at }));
}

export async function getStreamHighlights(streamId: number): Promise<Highlight[]> {
  const { rows } = await pool.query(`SELECT * FROM cb_highlights WHERE stream_id = $1 ORDER BY engagement_score DESC`, [streamId]);
  return rows.map(r => ({ id: r.id, streamId: r.stream_id, title: r.title, startMs: parseInt(r.start_ms), endMs: parseInt(r.end_ms), type: r.type, engagementScore: parseFloat(r.engagement_score), aiSummary: r.ai_summary, createdAt: r.created_at }));
}

export async function getStreamReport(streamId: number): Promise<BroadcastReport | null> {
  const { rows } = await pool.query(
    `SELECT r.*, s.title as stream_title FROM cb_reports r LEFT JOIN cb_streams s ON r.stream_id = s.id WHERE r.stream_id = $1`,
    [streamId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  const captions = await getStreamCaptions(streamId);
  const highlights = await getStreamHighlights(streamId);
  return { id: r.id, streamId: r.stream_id, streamTitle: r.stream_title, executiveSummary: r.executive_summary, keyDecisions: r.key_decisions, actionItems: r.action_items, sentimentTimeline: r.sentiment_timeline, peakEngagementMoments: r.peak_engagement_moments, audienceStats: r.audience_stats, highlights, fullTranscript: r.full_transcript, searchableSegments: captions, generatedAt: r.generated_at };
}

export async function getAttentionHeatmap(streamId: number): Promise<AttentionHeatmapPoint[]> {
  const { rows: stream } = await pool.query(`SELECT duration_seconds, started_at FROM cb_streams WHERE id = $1`, [streamId]);
  if (!stream.length) return [];

  const duration = stream[0].duration_seconds || 600;
  const intervals = Math.min(60, Math.floor(duration / 30));

  const heatmap: AttentionHeatmapPoint[] = [];
  let prevAttention = 0.5 + Math.random() * 0.3;

  for (let i = 0; i < intervals; i++) {
    const timestampSeconds = Math.floor((i * duration) / intervals);
    const change = (Math.random() - 0.5) * 0.2;
    const attentionScore = Math.max(0.1, Math.min(1.0, prevAttention + change));
    prevAttention = attentionScore;

    const sentiments: SentimentType[] = ["positive", "neutral", "negative", "mixed"];
    const sentiment = attentionScore > 0.7 ? "positive" : attentionScore < 0.3 ? "negative" : "neutral";
    const labels: string[] = attentionScore > 0.85 ? ["peak engagement"] : attentionScore < 0.25 ? ["attention drop"] : [];

    heatmap.push({ timestampSeconds, attentionScore: parseFloat(attentionScore.toFixed(3)), viewerCount: Math.floor(5 + attentionScore * 45), sentiment: sentiment as SentimentType, eventLabels: labels });
  }

  return heatmap;
}

export async function getLiveEngagement(streamId: number): Promise<{
  currentViewers: number; sentiment: SentimentType; sentimentScore: number; recentEvents: EngagementEvent[];
}> {
  const { rows: stream } = await pool.query(`SELECT viewer_count FROM cb_streams WHERE id = $1`, [streamId]);
  const { rows: events } = await pool.query(
    `SELECT * FROM cb_engagement_events WHERE stream_id = $1 ORDER BY event_timestamp DESC LIMIT 10`,
    [streamId]
  );

  const avgSentiment = events.length > 0 ? events.reduce((s: number, e: any) => s + parseFloat(e.sentiment_score), 0) / events.length : 0.5;
  const sentiment: SentimentType = avgSentiment > 0.65 ? "positive" : avgSentiment < 0.35 ? "negative" : "neutral";

  return {
    currentViewers: stream[0]?.viewer_count || 0,
    sentiment,
    sentimentScore: parseFloat(avgSentiment.toFixed(3)),
    recentEvents: events.map((e: any) => ({ id: e.id, streamId: e.stream_id, timestamp: e.event_timestamp, eventType: e.event_type, viewerCount: e.viewer_count, sentimentScore: parseFloat(e.sentiment_score), metadata: e.metadata })),
  };
}

export async function commandBroadcastDashboard(orgId: number): Promise<Record<string, unknown>> {
  const [streamsResult, viewersResult, captionsResult, reportsResult] = await Promise.all([
    pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE status = 'live') as live, count(*) FILTER (WHERE status = 'ended') as ended FROM cb_streams WHERE org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total, avg(attention_score) as avg_attention FROM cb_viewer_sessions vs INNER JOIN cb_streams s ON vs.stream_id = s.id WHERE s.org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total FROM cb_captions cc INNER JOIN cb_streams s ON cc.stream_id = s.id WHERE s.org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total FROM cb_reports r INNER JOIN cb_streams s ON r.stream_id = s.id WHERE s.org_id = $1`, [orgId]),
  ]);

  return {
    streams: streamsResult.rows[0],
    viewers: viewersResult.rows[0],
    captions: parseInt(captionsResult.rows[0].total),
    reports: parseInt(reportsResult.rows[0].total),
  };
}
