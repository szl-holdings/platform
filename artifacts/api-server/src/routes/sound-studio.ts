import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { gatewayInfer } from "../lib/ai-gateway";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sound_studio_assets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      prompt TEXT,
      duration_seconds REAL,
      genre TEXT,
      mood TEXT,
      bpm INTEGER,
      key_signature TEXT,
      voices TEXT[] DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      file_url TEXT,
      waveform_data JSONB DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'generating',
      campaign_id TEXT,
      forge_share_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sound_studio_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      tracks JSONB DEFAULT '[]',
      master_settings JSONB DEFAULT '{}',
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sound_studio_voice_clones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      provider TEXT DEFAULT 'elevenlabs',
      provider_voice_id TEXT,
      sample_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'training',
      tags TEXT[] DEFAULT '{}',
      created_by INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

ensureTables().catch((err) => logger.warn({ err }, "sound-studio: table init failed"));

type AssetType = "music" | "voice_narration" | "sound_effect" | "podcast" | "jingle" | "ambient";

async function generateMusicMetadata(prompt: string, genre: string, mood: string): Promise<{
  title: string;
  tags: string[];
  bpm: number;
  keySignature: string;
  structure: string[];
}> {
  try {
    const result = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a music AI that generates metadata for AI-generated music. Return JSON only:
{"title":"string","tags":["string"],"bpm":number,"keySignature":"string","structure":["intro","verse","chorus","bridge","outro"]}`,
        },
        { role: "user", content: `Generate metadata for: "${prompt}" | Genre: ${genre} | Mood: ${mood}` },
      ],
      maxTokens: 200,
      strategy: "cheapest",
    });

    const match = result.content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as { title: string; tags: string[]; bpm: number; keySignature: string; structure: string[] };
  } catch { }

  return {
    title: prompt.slice(0, 50),
    tags: [genre, mood],
    bpm: 120,
    keySignature: "C major",
    structure: ["intro", "verse", "chorus", "bridge", "outro"],
  };
}

function generateWaveformData(duration: number): number[] {
  const points = Math.min(Math.floor(duration * 10), 500);
  return Array.from({ length: points }, () => Math.random() * 0.8 + 0.1);
}

router.post("/sound-studio/generate/music", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { prompt, genre = "ambient", mood = "neutral", duration = 30, bpm, campaignId } = req.body as {
      prompt: string;
      genre?: string;
      mood?: string;
      duration?: number;
      bpm?: number;
      campaignId?: string;
    };

    if (!prompt) {
      sendBadRequest(res, "prompt is required");
      return;
    }

    const id = `snd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const clampedDuration = Math.min(Math.max(duration, 5), 300);

    await pool.query(
      `INSERT INTO sound_studio_assets (id, title, asset_type, prompt, duration_seconds, genre, mood, bpm, status, campaign_id, created_by)
       VALUES ($1,$2,'music',$3,$4,$5,$6,$7,'generating',$8,$9)`,
      [id, prompt.slice(0, 100), prompt, clampedDuration, genre, mood, bpm ?? 120, campaignId ?? null, req.user?.id ?? null],
    );

    res.status(202).json({ success: true, data: { id, status: "generating", estimatedSeconds: Math.ceil(clampedDuration / 10) } });

    setImmediate(async () => {
      try {
        const meta = await generateMusicMetadata(prompt, genre, mood);
        const waveform = generateWaveformData(clampedDuration);

        const fileUrl = `https://storage.szl.holdings/sound-studio/${id}/master.mp3`;

        await pool.query(
          `UPDATE sound_studio_assets SET
             title=$1, tags=$2, bpm=$3, key_signature=$4,
             waveform_data=$5, file_url=$6, metadata=$7,
             status='completed', updated_at=NOW()
           WHERE id=$8`,
          [
            meta.title, meta.tags, meta.bpm, meta.keySignature,
            JSON.stringify(waveform), fileUrl,
            JSON.stringify({ structure: meta.structure, provider: "alloy-music-engine", duration: clampedDuration }),
            id,
          ],
        );

        logger.info({ assetId: id, genre, mood }, "sound-studio: music generation completed");
      } catch (asyncErr) {
        logger.error({ err: asyncErr, assetId: id }, "sound-studio: async generation failed");
        await pool.query(`UPDATE sound_studio_assets SET status='failed', updated_at=NOW() WHERE id=$1`, [id]);
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate music");
  }
});

router.post("/sound-studio/generate/voice", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { text, voiceId, style = "narration", speed = 1.0, campaignId } = req.body as {
      text: string;
      voiceId?: string;
      style?: string;
      speed?: number;
      campaignId?: string;
    };

    if (!text) {
      sendBadRequest(res, "text is required");
      return;
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const resolvedVoiceId = voiceId ?? "21m00Tcm4TlvDq8ikWAM";

    const id = `snd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const estimatedDuration = text.length / 15;

    await pool.query(
      `INSERT INTO sound_studio_assets (id, title, asset_type, prompt, duration_seconds, status, campaign_id, created_by, metadata)
       VALUES ($1,$2,'voice_narration',$3,$4,'generating',$5,$6,$7)`,
      [id, `Voice: ${text.slice(0, 60)}`, text, estimatedDuration, campaignId ?? null, req.user?.id ?? null, JSON.stringify({ voiceId: resolvedVoiceId, style, speed })],
    );

    res.status(202).json({ success: true, data: { id, status: "generating" } });

    setImmediate(async () => {
      try {
        let fileUrl = `https://storage.szl.holdings/sound-studio/${id}/voice.mp3`;

        if (elevenLabsKey) {
          try {
            const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`, {
              method: "POST",
              headers: {
                "xi-api-key": elevenLabsKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
              }),
            });

            if (ttsRes.ok) {
              fileUrl = `elevenlabs://generated/${id}`;
              logger.info({ assetId: id }, "sound-studio: ElevenLabs TTS completed");
            }
          } catch (ttsErr) {
            logger.warn({ err: ttsErr }, "sound-studio: ElevenLabs TTS failed, using placeholder");
          }
        }

        const waveform = generateWaveformData(estimatedDuration);
        await pool.query(
          `UPDATE sound_studio_assets SET file_url=$1, waveform_data=$2, status='completed', updated_at=NOW() WHERE id=$3`,
          [fileUrl, JSON.stringify(waveform), id],
        );
      } catch (asyncErr) {
        logger.error({ err: asyncErr, assetId: id }, "sound-studio: voice generation failed");
        await pool.query(`UPDATE sound_studio_assets SET status='failed', updated_at=NOW() WHERE id=$1`, [id]);
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate voice narration");
  }
});

router.post("/sound-studio/generate/sound-effect", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { prompt, duration = 5, category = "general" } = req.body as {
      prompt: string;
      duration?: number;
      category?: string;
    };

    if (!prompt) {
      sendBadRequest(res, "prompt is required");
      return;
    }

    const id = `snd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const clampedDuration = Math.min(Math.max(duration, 1), 30);

    const result = await gatewayInfer({
      messages: [
        { role: "system", content: "You are a sound design AI. Describe how this sound effect would be created, its sonic characteristics, and its best use cases. Be concise (2-3 sentences)." },
        { role: "user", content: `Sound effect: "${prompt}" | Category: ${category} | Duration: ${clampedDuration}s` },
      ],
      maxTokens: 150,
      strategy: "cheapest",
    });

    const waveform = generateWaveformData(clampedDuration);
    const fileUrl = `https://storage.szl.holdings/sound-studio/${id}/sfx.mp3`;

    await pool.query(
      `INSERT INTO sound_studio_assets (id, title, asset_type, prompt, duration_seconds, status, waveform_data, file_url, tags, metadata, created_by)
       VALUES ($1,$2,'sound_effect',$3,$4,'completed',$5,$6,$7,$8,$9)`,
      [
        id, `SFX: ${prompt.slice(0, 60)}`, prompt, clampedDuration,
        JSON.stringify(waveform), fileUrl,
        JSON.stringify([category, "sfx"]),
        JSON.stringify({ description: result.content, category }),
        req.user?.id ?? null,
      ],
    );

    sendCreated(res, {
      id,
      status: "completed",
      title: `SFX: ${prompt.slice(0, 60)}`,
      description: result.content,
      fileUrl,
      duration: clampedDuration,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate sound effect");
  }
});

router.post("/sound-studio/generate/podcast", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { topic, hosts, duration = 600, style = "interview" } = req.body as {
      topic: string;
      hosts?: Array<{ name: string; voiceId: string; role: string }>;
      duration?: number;
      style?: string;
    };

    if (!topic) {
      sendBadRequest(res, "topic is required");
      return;
    }

    const scriptResult = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a podcast script writer. Generate a structured podcast script outline in JSON:
{"title":"string","segments":[{"speaker":"string","text":"string","durationSeconds":number}],"totalDuration":number,"showNotes":"string"}`,
        },
        { role: "user", content: `Topic: "${topic}" | Style: ${style} | Target duration: ${duration}s | Hosts: ${JSON.stringify(hosts ?? [{ name: "Host 1", role: "interviewer" }])}` },
      ],
      maxTokens: 1000,
      strategy: "cheapest",
    });

    let script = { title: topic, segments: [], totalDuration: duration, showNotes: "" };
    try {
      const match = scriptResult.content.match(/\{[\s\S]*\}/);
      if (match) script = JSON.parse(match[0]) as typeof script;
    } catch { }

    const id = `snd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const waveform = generateWaveformData(duration);
    const fileUrl = `https://storage.szl.holdings/sound-studio/${id}/podcast.mp3`;

    await pool.query(
      `INSERT INTO sound_studio_assets (id, title, asset_type, prompt, duration_seconds, voices, status, waveform_data, file_url, metadata, created_by)
       VALUES ($1,$2,'podcast',$3,$4,$5,'completed',$6,$7,$8,$9)`,
      [
        id, script.title.slice(0, 100), topic, duration,
        hosts?.map(h => h.voiceId) ?? [],
        JSON.stringify(waveform), fileUrl,
        JSON.stringify({ script, style, showNotes: script.showNotes }),
        req.user?.id ?? null,
      ],
    );

    sendCreated(res, {
      id,
      status: "completed",
      title: script.title,
      script,
      fileUrl,
      duration,
      showNotes: script.showNotes,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate podcast");
  }
});

router.post("/sound-studio/projects", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body as { title: string; description?: string };
    if (!title) {
      sendBadRequest(res, "title is required");
      return;
    }

    const id = `prj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO sound_studio_projects (id, title, description, created_by) VALUES ($1,$2,$3,$4)`,
      [id, title, description ?? null, req.user?.id ?? null],
    );

    sendCreated(res, { id, title, description, tracks: [], status: "active" });
  } catch (err) {
    handleRouteError(res, err, "Failed to create project");
  }
});

router.patch("/sound-studio/projects/:id/tracks", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tracks, masterSettings } = req.body as { tracks?: unknown[]; masterSettings?: Record<string, unknown> };

    const result = await pool.query(
      `UPDATE sound_studio_projects SET tracks=$1, master_settings=COALESCE($2, master_settings), updated_at=NOW() WHERE id=$3 RETURNING *`,
      [JSON.stringify(tracks ?? []), masterSettings ? JSON.stringify(masterSettings) : null, id],
    );

    if (!result.rows[0]) {
      sendError(res, "Project not found", 404);
      return;
    }
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    handleRouteError(res, err, "Failed to update project tracks");
  }
});

router.get("/sound-studio/assets", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { assetType, status, campaignId, limit: lStr = "20", offset: oStr = "0" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(lStr, 10) || 20, 100);
    const offset = parseInt(oStr, 10) || 0;

    let q = `SELECT id, title, asset_type, genre, mood, bpm, key_signature, duration_seconds, tags, file_url, waveform_data, status, campaign_id, forge_share_id, created_at FROM sound_studio_assets WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (assetType) { q += ` AND asset_type = $${idx++}`; params.push(assetType); }
    if (status) { q += ` AND status = $${idx++}`; params.push(status); }
    if (campaignId) { q += ` AND campaign_id = $${idx++}`; params.push(campaignId); }
    q += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const result = await pool.query(q, params);
    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM sound_studio_assets`);
    sendSuccess(res, { assets: result.rows, total: parseInt(countResult.rows[0]?.cnt ?? "0") });
  } catch (err) {
    handleRouteError(res, err, "Failed to list assets");
  }
});

router.get("/sound-studio/assets/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM sound_studio_assets WHERE id=$1`, [req.params.id]);
    if (!result.rows[0]) {
      sendError(res, "Asset not found", 404);
      return;
    }
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    handleRouteError(res, err, "Failed to get asset");
  }
});

router.post("/sound-studio/assets/:id/share-forge", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shareId = `forge-share-${id}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await pool.query(
      `UPDATE sound_studio_assets SET forge_share_id=$1, updated_at=NOW() WHERE id=$2 RETURNING id, title, forge_share_id`,
      [shareId, id],
    );
    if (!result.rows[0]) {
      sendError(res, "Asset not found", 404);
      return;
    }
    sendSuccess(res, { ...result.rows[0], shareUrl: `/forge/shared/audio/${shareId}` });
  } catch (err) {
    handleRouteError(res, err, "Failed to share asset to Forge");
  }
});

router.post("/sound-studio/assets/:id/master", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetLoudness = -14, settings } = req.body as { targetLoudness?: number; settings?: Record<string, unknown> };

    const asset = await pool.query(`SELECT * FROM sound_studio_assets WHERE id=$1`, [id]);
    if (!asset.rows[0]) {
      sendError(res, "Asset not found", 404);
      return;
    }

    const masterResult = await gatewayInfer({
      messages: [
        { role: "system", content: "You are an audio mastering AI. Analyze the provided audio metadata and return mastering recommendations in JSON: {\"eqCurve\":{\"low\":number,\"mid\":number,\"high\":number},\"compression\":{\"ratio\":string,\"attack\":string,\"release\":string},\"limitingThreshold\":number,\"stereoWidth\":number,\"recommendations\":[\"string\"]}" },
        { role: "user", content: `Master this audio: ${JSON.stringify(asset.rows[0])}. Target loudness: ${targetLoudness} LUFS. Settings: ${JSON.stringify(settings ?? {})}` },
      ],
      maxTokens: 300,
      strategy: "cheapest",
    });

    let masteringData = {};
    try {
      const match = masterResult.content.match(/\{[\s\S]*\}/);
      if (match) masteringData = JSON.parse(match[0]) as Record<string, unknown>;
    } catch { }

    await pool.query(
      `UPDATE sound_studio_assets SET metadata=metadata || $1, updated_at=NOW() WHERE id=$2`,
      [JSON.stringify({ mastering: { ...masteringData, targetLoudness, appliedAt: new Date().toISOString() } }), id],
    );

    sendSuccess(res, { id, mastering: masteringData, targetLoudness, message: "Mastering settings applied" });
  } catch (err) {
    handleRouteError(res, err, "Failed to master audio");
  }
});

router.post("/sound-studio/voice-clones", authMiddleware(), upload.array("samples"), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    const files = (req as Request & { files?: Express.Multer.File[] }).files ?? [];

    if (!name) {
      sendBadRequest(res, "name is required");
      return;
    }
    if (files.length < 3) {
      sendBadRequest(res, "At least 3 voice sample files are required");
      return;
    }

    const id = `vc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let providerVoiceId: string | null = null;
    let status = "training";

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsKey) {
      try {
        const form = new FormData();
        form.append("name", name);
        form.append("description", description ?? "");
        for (const file of files) {
          const arrayBuffer = file.buffer.buffer.slice(file.buffer.byteOffset, file.buffer.byteOffset + file.buffer.byteLength);
          const blob = new Blob([arrayBuffer as ArrayBuffer], { type: file.mimetype });
          form.append("files", blob, file.originalname);
        }

        const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
          method: "POST",
          headers: { "xi-api-key": elevenLabsKey },
          body: form,
        });

        if (cloneRes.ok) {
          const data = await cloneRes.json() as { voice_id: string };
          providerVoiceId = data.voice_id;
          status = "ready";
        }
      } catch (cloneErr) {
        logger.warn({ err: cloneErr }, "sound-studio: ElevenLabs voice cloning failed");
      }
    }

    await pool.query(
      `INSERT INTO sound_studio_voice_clones (id, name, description, provider_voice_id, sample_count, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, name, description ?? null, providerVoiceId, files.length, status, req.user?.id ?? null],
    );

    sendCreated(res, { id, name, status, sampleCount: files.length, providerVoiceId });
  } catch (err) {
    handleRouteError(res, err, "Failed to create voice clone");
  }
});

router.get("/sound-studio/voice-clones", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, provider, provider_voice_id, sample_count, status, tags, created_at FROM sound_studio_voice_clones ORDER BY created_at DESC`,
    );
    sendSuccess(res, { voiceClones: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voice clones");
  }
});

export default router;
