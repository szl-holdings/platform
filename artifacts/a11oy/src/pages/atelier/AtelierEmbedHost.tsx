import { useEffect, useRef, useState } from 'react';
import { useParams } from 'wouter';
import { createSpaceRun, streamRunOutput, validateProof, recordAtelierRun, recordEmbedEvent } from '../../lib/atelier-runtime';
import { ALLOWED_EMBED_ORIGINS } from '../../components/AtelierEmbed';

const EMBED_SPACES: Record<string, { name: string; vertical: string; color: string; connectors: string[]; constitutionRef: string; modelPolicy: string }> = {
  'maritime-routing': {
    name: 'Maritime Routing Agent',
    vertical: 'maritime',
    color: '#7ab8d9',
    connectors: ['AIS Live Feed', 'Port Standby Cost Model'],
    constitutionRef: 'const-vessels-v2',
    modelPolicy: 'governed-default',
  },
  're-underwriting': {
    name: 'Real Estate Underwriting Agent',
    vertical: 'real-estate',
    color: '#c9b787',
    connectors: ['CoStar', 'Lender Covenant API'],
    constitutionRef: 'const-domaine-v3',
    modelPolicy: 'governed-default',
  },
  'legal-discovery': {
    name: 'Legal Discovery Intelligence',
    vertical: 'legal',
    color: '#8a8a8a',
    connectors: ['Docket Search', 'Document Repository'],
    constitutionRef: 'const-counsel-v2',
    modelPolicy: 'governed-default',
  },
  'cyber-triage': {
    name: 'Cyber Threat Triage Agent',
    vertical: 'cyber',
    color: '#10b981',
    connectors: ['Threat Intelligence Feed', 'CVE Database', 'SIEM Events'],
    constitutionRef: 'const-paragon-v4',
    modelPolicy: 'governed-default',
  },
  'platform-health': {
    name: 'A11oy Platform Health',
    vertical: 'platform',
    color: '#5e5e5e',
    connectors: ['Fabric Telemetry'],
    constitutionRef: 'const-platform-v1',
    modelPolicy: 'governed-default',
  },
};

const EMBED_VERTICAL_MAP: Record<string, string> = {
  maritime: 'maritime',
  'real-estate': 'real-estate',
  legal: 'legal',
  cyber: 'cyber',
  platform: 'platform',
  defense: 'defense',
  executive: 'executive',
};

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  for (const pattern of ALLOWED_EMBED_ORIGINS) {
    if (pattern === origin) return true;
    if (pattern.includes('*')) {
      try {
        const url = new URL(origin);
        const patternUrl = new URL(pattern.replace('*.', ''));
        if (url.protocol !== patternUrl.protocol) continue;
        const patternHost = patternUrl.hostname;
        if (url.hostname === patternHost || url.hostname.endsWith('.' + patternHost)) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }
  return false;
}

export function AtelierEmbedHost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';
  const space = EMBED_SPACES[slug];
  const parentOriginRef = useRef<string | null>(null);
  const tenantIdRef = useRef<string>('szl');
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    if (!space) return;

    async function handleRun(origin: string) {
      setStatus('running');
      try {
        await recordEmbedEvent(slug, origin, 'run');
        const state = await createSpaceRun({
          spaceSlug: slug,
          vertical: space.vertical,
          connectors: space.connectors,
          constitutionRef: space.constitutionRef,
          modelPolicy: space.modelPolicy,
        });

        const collectedLines: string[] = [];
        const finalState = await streamRunOutput(
          state.workcellId,
          (line) => {
            collectedLines.push(line);
            window.parent.postMessage(
              { type: 'a11oy-space-line', spaceSlug: slug, line },
              origin,
            );
          },
          { vertical: space.vertical, connectors: space.connectors, spaceSlug: slug },
        );

        const proof = await validateProof(finalState.workcellId, finalState.pceContractId);
        const persisted = await recordAtelierRun({
          spaceSlug: slug, workcellId: finalState.workcellId, vertical: space.vertical,
          proofRef: proof.proofRef, outputLines: collectedLines, verdict: 'pass',
          origin, tenantId: tenantIdRef.current,
        });

        window.parent.postMessage(
          {
            type: 'a11oy-space-done', spaceSlug: slug,
            proofRef: proof.proofRef,
            proofPacketId: persisted?.proofPacketId,
            done: true,
          },
          origin,
        );
      } catch (e) {
        window.parent.postMessage(
          { type: 'a11oy-space-done', spaceSlug: slug, error: e instanceof Error ? e.message : String(e), done: true },
          origin,
        );
      } finally {
        setStatus('done');
      }
    }

    function handleMessage(e: MessageEvent) {
      if (!isOriginAllowed(e.origin)) return;

      const data = e.data;
      if (!data?.type) return;

      if (data.type === 'a11oy-space-handshake' && data.spaceSlug === slug) {
        parentOriginRef.current = e.origin;
        // Tenant context flows from the host artifact (conduit/sentra/
        // vessels) through the handshake. We do NOT trust this value
        // for authorization — packets gated by tenantId only resolve
        // through the X-Tenant-Id header on /api/atelier/proofs/:id,
        // which never leaves the host's auth boundary. The echo back
        // is purely so the iframe can render the tenant badge.
        const tenantId = (typeof data.tenantId === 'string' && data.tenantId.trim()) || 'szl';
        tenantIdRef.current = tenantId;
        (e.source as WindowProxy)?.postMessage(
          { type: 'a11oy-space-ack', spaceSlug: slug, tenantId, ready: true },
          e.origin,
        );
      }

      if (data.type === 'a11oy-space-run' && data.spaceSlug === slug) {
        parentOriginRef.current = e.origin;
        handleRun(e.origin);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slug, space]);

  if (!space) {
    return (
      <div style={{ padding: '2rem', color: '#8a8a8a', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', background: '#0a0a0a', minHeight: '100vh' }}>
        Unknown Space: {slug}
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', color: '#f5f5f5', fontFamily: 'ui-monospace, monospace', fontSize: '0.6875rem', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ color: space.color, marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.5625rem' }}>
        {space.name} · Embed Host
      </div>
      <div style={{ color: '#5e5e5e' }}>
        {status === 'idle' && 'Waiting for parent frame handshake...'}
        {status === 'running' && 'Executing governed run...'}
        {status === 'done' && 'Run complete.'}
      </div>
    </div>
  );
}
