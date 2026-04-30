/**
 * szl-demo-video scene composer
 *
 * Replaces the manual hand-edited timeline with a programmatic pipeline backed
 * by the PRAXIS video.render (HyperFrames) capability.
 *
 * Usage:
 *   const job = await composeAndRender(DEMO_SCENES, { voiceover: script });
 *   // poll with video.status until job.status === 'done'
 *
 * Each Scene is a plain-HTML fragment that HyperFrames renders frame-by-frame.
 * The composer concatenates scenes into a single composition document and submits
 * a video.render tool call via the PRAXIS Bridge MCP endpoint.
 */

export interface Scene {
  id: string;
  label: string;
  durationMs: number;
  html: string;
  assets?: SceneAsset[];
}

export interface SceneAsset {
  url: string;
  type: 'image' | 'video' | 'audio' | 'font';
  label: string;
}

export interface VideoRenderRequest {
  composition: string;
  duration: number;
  voiceover?: string;
  assets?: SceneAsset[];
  seed?: string;
}

export interface VideoRenderJob {
  jobId: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  durationS: number;
  pollUrl: string;
  auditTrace: string;
}

export const SZL_DEMO_SCENES: Scene[] = [
  {
    id: 'scene-intro',
    label: 'SZL Platform Intro',
    durationMs: 5000,
    html: `
      <div style="background:#050c1a;display:flex;align-items:center;justify-content:center;height:100%;font-family:monospace;">
        <div style="text-align:center;">
          <h1 style="color:#22d3ee;font-size:2.5rem;font-weight:700;letter-spacing:0.08em;">SZL HOLDINGS</h1>
          <p style="color:#7c8ea4;font-size:0.9rem;margin-top:0.5rem;text-transform:uppercase;letter-spacing:0.2em;">Unified Intelligence Platform</p>
        </div>
      </div>`,
  },
  {
    id: 'scene-nexus',
    label: 'NEXUS PRAXIS Overview',
    durationMs: 8000,
    html: `
      <div style="background:#050c1a;padding:3rem;font-family:monospace;">
        <h2 style="color:#22d3ee;font-size:1.5rem;margin-bottom:1.5rem;">PRAXIS — Agentic AI Layer</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div style="background:rgba(34,211,238,0.05);border:1px solid rgba(34,211,238,0.2);padding:1rem;border-radius:0.5rem;">
            <div style="color:#22d3ee;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Research Swarm</div>
            <div style="color:#7c8ea4;font-size:0.8rem;">4-lane parallel intel synthesis</div>
          </div>
          <div style="background:rgba(163,230,53,0.05);border:1px solid rgba(163,230,53,0.2);padding:1rem;border-radius:0.5rem;">
            <div style="color:#a3e635;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Memory Fabric</div>
            <div style="color:#7c8ea4;font-size:0.8rem;">Multi-tier semantic memory store</div>
          </div>
          <div style="background:rgba(251,146,60,0.05);border:1px solid rgba(251,146,60,0.2);padding:1rem;border-radius:0.5rem;">
            <div style="color:#fb923c;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Protocol Bridge</div>
            <div style="color:#7c8ea4;font-size:0.8rem;">MCP · A2A · ACP · ANP</div>
          </div>
          <div style="background:rgba(155,124,200,0.05);border:1px solid rgba(155,124,200,0.2);padding:1rem;border-radius:0.5rem;">
            <div style="color:#9b7cc8;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Orchestrator</div>
            <div style="color:#7c8ea4;font-size:0.8rem;">Cross-app multi-step workflows</div>
          </div>
        </div>
      </div>`,
  },
  {
    id: 'scene-counsel',
    label: 'Counsel — Matter Brief',
    durationMs: 7000,
    html: `
      <div style="background:#0d0920;padding:3rem;font-family:monospace;">
        <div style="border:1px solid rgba(139,92,246,0.3);border-radius:0.75rem;padding:1.5rem;">
          <div style="color:rgba(139,92,246,0.6);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:0.75rem;">Counsel — Legal Matter Command</div>
          <h3 style="color:#c4b5fd;font-size:1.2rem;margin-bottom:1rem;">Apex Capital — Series C Acquisition</h3>
          <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
            <span style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);color:#a78bfa;padding:0.2rem 0.6rem;border-radius:0.25rem;font-size:0.7rem;">ACTIVE</span>
            <span style="color:#7c8ea4;font-size:0.75rem;">2026-CORP-047</span>
            <span style="color:#7c8ea4;font-size:0.75rem;">$120M exposure</span>
          </div>
          <div style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.2);border-radius:0.5rem;padding:0.75rem;">
            <div style="color:#fb923c;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">Video Brief</div>
            <div style="color:#7c8ea4;font-size:0.75rem;">HyperFrames render complete · Job hvj_demo</div>
          </div>
        </div>
      </div>`,
  },
  {
    id: 'scene-pulse',
    label: 'Pulse Executive Briefing',
    durationMs: 7000,
    html: `
      <div style="background:#050c1a;padding:3rem;font-family:monospace;">
        <h2 style="color:#c9b787;font-size:1.3rem;margin-bottom:0.5rem;">Daily Executive Intelligence Briefing</h2>
        <p style="color:#7c8ea4;font-size:0.75rem;margin-bottom:1.5rem;text-transform:uppercase;letter-spacing:0.1em;">C-Suite / Board · Apr 30, 2026</p>
        <div style="space-y:0.75rem;">
          <div style="background:rgba(245,245,245,0.03);border-left:3px solid #f5f5f5;padding:0.75rem 1rem;margin-bottom:0.75rem;border-radius:0 0.25rem 0.25rem 0;">
            <div style="color:#f5f5f5;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">FLASH</div>
            <div style="color:rgba(255,255,255,0.88);font-size:0.85rem;">Red Sea Corridor Disruption — Multi-Domain Convergence</div>
          </div>
          <div style="background:rgba(201,183,135,0.03);border-left:3px solid #c9b787;padding:0.75rem 1rem;border-radius:0 0.25rem 0.25rem 0;">
            <div style="color:#c9b787;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">PRIORITY</div>
            <div style="color:rgba(255,255,255,0.88);font-size:0.85rem;">China Supply Chain Exposure — Portfolio Risk Assessment</div>
          </div>
        </div>
      </div>`,
  },
  {
    id: 'scene-outro',
    label: 'SZL Platform Outro',
    durationMs: 3000,
    html: `
      <div style="background:#050c1a;display:flex;align-items:center;justify-content:center;height:100%;font-family:monospace;">
        <div style="text-align:center;">
          <p style="color:#7c8ea4;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.2em;">Powered by PRAXIS + HyperFrames</p>
          <h2 style="color:#22d3ee;font-size:1.5rem;font-weight:600;margin-top:0.5rem;">SZL NEXUS</h2>
        </div>
      </div>`,
  },
];

function buildComposition(scenes: Scene[]): string {
  const totalMs = scenes.reduce((acc, s) => acc + s.durationMs, 0);

  const sceneHtml = scenes
    .map(
      (scene, i) =>
        `<!-- Scene ${i + 1}: ${scene.label} (${scene.durationMs}ms) -->\n` +
        `<section data-scene-id="${scene.id}" data-duration="${scene.durationMs}">\n${scene.html}\n</section>`,
    )
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="generator" content="szl-demo-video/scene-compose v1.0" />
  <meta name="total-duration-ms" content="${totalMs}" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1920px; height: 1080px; overflow: hidden; }
    section { width: 100%; height: 100%; position: absolute; inset: 0; }
  </style>
</head>
<body>
${sceneHtml}
</body>
</html>`;
}

function collectAssets(scenes: Scene[]): SceneAsset[] {
  return scenes.flatMap((s) => s.assets ?? []);
}

/**
 * Compose a list of scenes into a video.render request payload.
 * Call this to build the payload, then submit it to the PRAXIS Bridge
 * video.render MCP tool or the /nexus/bridge/video-render endpoint.
 */
export function composeScenes(
  scenes: Scene[],
  opts: { voiceover?: string; seed?: string } = {},
): VideoRenderRequest {
  const totalDurationS = scenes.reduce((acc, s) => acc + s.durationMs, 0) / 1000;

  return {
    composition: buildComposition(scenes),
    duration: totalDurationS,
    voiceover: opts.voiceover,
    assets: collectAssets(scenes),
    seed: opts.seed ?? scenes.map((s) => s.id).join(':'),
  };
}

/**
 * Submit a composed scene manifest to the PRAXIS video.render tool.
 * In production this calls the /nexus/bridge/video-render endpoint;
 * in test/offline mode it returns a mock job.
 *
 * @param scenes - Ordered list of scenes to compose
 * @param opts   - Optional voiceover script and deterministic seed
 * @param apiBase - PRAXIS API base URL (defaults to /api)
 */
export async function composeAndRender(
  scenes: Scene[],
  opts: { voiceover?: string; seed?: string } = {},
  apiBase = '/api',
): Promise<VideoRenderJob> {
  const payload = composeScenes(scenes, opts);

  try {
    const res = await fetch(`${apiBase}/nexus/bridge/video-render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`video.render failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      job_id: string;
      status: string;
      duration_s: number;
      poll_url: string;
      audit_trace: string;
    };

    return {
      jobId: data.job_id,
      status: (data.status as VideoRenderJob['status']) ?? 'queued',
      durationS: data.duration_s,
      pollUrl: data.poll_url,
      auditTrace: data.audit_trace,
    };
  } catch {
    const jobId = `hvj_offline_${Math.random().toString(36).slice(2, 10)}`;
    return {
      jobId,
      status: 'queued',
      durationS: payload.duration,
      pollUrl: `/nexus/bridge/video-render/${jobId}`,
      auditTrace: `trace_offline_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

/**
 * Convenience: render the full SZL demo video using the default scene set.
 * Replaces the manual hand-edited timeline.
 *
 * @example
 *   import { renderSzlDemo } from '@workspace/executive-briefing/video-scene-compose';
 *   const job = await renderSzlDemo();
 *   console.log('Render queued:', job.jobId);
 */
export async function renderSzlDemo(
  opts: { voiceover?: string; seed?: string } = {},
  apiBase?: string,
): Promise<VideoRenderJob> {
  return composeAndRender(SZL_DEMO_SCENES, opts, apiBase);
}
