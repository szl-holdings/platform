/**
 * Centralized artifact port registry.
 *
 * Single source of truth for all artifact dev-server port assignments.
 * Port values must match the VITE_PORT / PORT / EXPO_PORT env vars in each
 * artifact's .replit-artifact/artifact.toml [services.env] block.
 *
 * Usage:
 *   import { ARTIFACT_PORTS, artifactUrl } from './artifact-ports.js';
 *   const apiUrl = artifactUrl('api-server'); // http://localhost:8080
 *
 * When a port changes, update ONLY this file — all QA scripts read from here.
 */

export const ARTIFACT_PORTS = {
  "api-server":          8080,
  "szl-holdings":        21130,
  "aegis":               3002,
  "vessels":             8099,
  "terra":               6099,
  "carlota-jo":          3101,
  "command":             5000,
  "pulse":               5201,
  "szl-demo-video":      8765,
  "szl-holdings-mobile": 8085,
  "mockup-sandbox":      8008,
};

/**
 * Returns the localhost base URL for an artifact.
 * @param {keyof typeof ARTIFACT_PORTS} slug
 * @returns {string}  e.g. "http://localhost:8080"
 */
export function artifactUrl(slug) {
  const port = ARTIFACT_PORTS[slug];
  if (!port) throw new Error(`Unknown artifact slug: "${slug}". Add it to scripts/lib/artifact-ports.js.`);
  return `http://localhost:${port}`;
}
