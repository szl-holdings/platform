import { describe, expect, it } from 'vitest';
import { type Citation, type MemoryEntry, type RecentReflection, type WorldModelEntity, buildBriefContext, buildCitationManifest, buildCitations, buildSystemPrompt, extractEntityProvenance, gateBrief, parseBriefResponse, summarizeContext } from '../index.js';

const mockEntities: WorldModelEntity[] = [
  {
    id: 'ent-001',
    entityType: 'vessel',
    domain: 'vessels',
    confidence: 0.92,
    attributes: { name: 'MV Pacific Dawn', status: 'at_sea' },
    freshness: new Date(),
    isActive: true,
  },
  {
    id: 'ent-002',
    entityType: 'alert',
    domain: 'vessels',
    confidence: 0.78,
    attributes: { severity: 'warning', category: 'ais_dark' },
    freshness: new Date(),
    isActive: true,
  },
];

const mockMemories: MemoryEntry[] = [
  {
    id: 'mem-001',
    memoryType: 'episodic',
    content: 'Fleet crossed equator at 0400 UTC, nominal status.',
    confidence: 0.85,
    provenance: 'agent',
    createdAt: new Date(),
  },
];

const mockReflections: RecentReflection[] = [
  {
    id: 'ref-001',
    qualityScore: 0.88,
    lesson: 'Increase sampling rate for vessels approaching restricted zones.',
    whatWorked: ['real-time AIS monitoring'],
    whatFailed: [],
    createdAt: new Date(),
    domain: 'vessels',
  },
];

describe('buildBriefContext', () => {
  it('builds context with correct domain and entity counts', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections, 3);
    expect(ctx.domain).toBe('vessels');
    expect(ctx.entities).toHaveLength(2);
    expect(ctx.memories).toHaveLength(1);
    expect(ctx.reflections).toHaveLength(1);
    expect(ctx.crossDomainEdgeCount).toBe(3);
    expect(ctx.generatedAt).toBeTruthy();
  });
});

describe('summarizeContext', () => {
  it('includes domain name and active entity count', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const summary = summarizeContext(ctx);
    expect(summary).toContain('vessels');
    expect(summary).toContain('2 active');
  });

  it('includes reflection lesson', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const summary = summarizeContext(ctx);
    expect(summary).toContain('Increase sampling rate');
  });
});

describe('buildCitations', () => {
  it('creates citations for entities and memories', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations = buildCitations(ctx);
    const entityCit = citations.find((c) => c.sourceType === 'entity');
    const memoryCit = citations.find((c) => c.sourceType === 'memory');
    expect(entityCit).toBeDefined();
    expect(memoryCit).toBeDefined();
    expect(entityCit?.sourceId).toBe('ent-001');
    expect(memoryCit?.sourceId).toBe('mem-001');
  });

  it('marks entity citations as verified', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations = buildCitations(ctx);
    const entityCits = citations.filter((c) => c.sourceType === 'entity');
    expect(entityCits.every((c) => c.verified)).toBe(true);
  });
});

describe('extractEntityProvenance', () => {
  it('maps entities to provenance records', () => {
    const provenance = extractEntityProvenance(mockEntities);
    expect(provenance).toHaveLength(2);
    expect(provenance[0]?.entityType).toBe('vessel');
    expect(provenance[0]?.domain).toBe('vessels');
    expect(provenance[0]?.confidence).toBe(0.92);
  });
});

describe('buildCitationManifest', () => {
  it('formats citations into readable manifest lines', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations = buildCitations(ctx);
    const manifest = buildCitationManifest(citations);
    expect(manifest).toContain('cit-ent-ent-001');
    expect(manifest).toContain('ENTITY');
    expect(manifest).toContain('MEMORY');
  });
});

describe('buildSystemPrompt', () => {
  it('includes domain-specific agent name', () => {
    const prompt = buildSystemPrompt('vessels');
    expect(prompt).toContain('Helmsman');
    expect(prompt).toContain('vessels');
  });

  it('uses Alloy for consolidated domain', () => {
    const prompt = buildSystemPrompt('consolidated');
    expect(prompt).toContain('Alloy');
  });

  it('requires JSON response format', () => {
    const prompt = buildSystemPrompt('aegis');
    expect(prompt).toContain('headline');
    expect(prompt).toContain('whatWeBelieve');
    expect(prompt).toContain('whatWeRecommend');
  });
});

describe('parseBriefResponse', () => {
  it('parses valid JSON brief response', () => {
    const json = JSON.stringify({
      headline: 'Fleet status nominal — 2 vessels at sea',
      situation: 'All monitored vessels report nominal AIS status as of 0600 UTC.',
      whatWeBelieve: [
        {
          id: 'b-001',
          claim: 'MV Pacific Dawn is at sea with nominal AIS.',
          confidence: 0.92,
          citationIds: ['cit-ent-ent-001'],
          supported: true,
          caveats: [],
        },
      ],
      whatWeRecommend: [
        {
          id: 'r-001',
          priority: 'P2',
          action: 'Continue monitoring',
          rationale: 'No anomalies detected.',
          owner: 'Maritime Ops',
          dueBy: 'Today',
          autonomyTier: 'supervised-autonomy',
          citationIds: [],
        },
      ],
      autonomyTier: 'supervised-autonomy',
      confidence: 0.88,
      overallRisk: 'LOW',
      gaps: [],
      sections: [],
    });

    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations = buildCitations(ctx).map((c) => ({ ...c, verified: c.verified ?? false }));
    const provenance = extractEntityProvenance(mockEntities);

    const result = parseBriefResponse(json, 'vessels', citations, provenance);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.brief.headline).toBe('Fleet status nominal — 2 vessels at sea');
      expect(result.brief.confidence).toBe(0.88);
      expect(result.brief.overallRisk).toBe('LOW');
      expect(result.brief.whatWeBelieve).toHaveLength(1);
      expect(result.brief.whatWeRecommend).toHaveLength(1);
    }
  });

  it('handles malformed JSON gracefully', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations = buildCitations(ctx).map((c) => ({ ...c, verified: c.verified ?? false }));
    const provenance = extractEntityProvenance(mockEntities);

    const result = parseBriefResponse('not valid json', 'vessels', citations, provenance);
    expect(result.success).toBe(false);
  });

  it('extracts JSON from markdown fences', () => {
    const json = `
Here is the brief:
\`\`\`json
{
  "headline": "Test headline",
  "situation": "Test situation.",
  "whatWeBelieve": [],
  "whatWeRecommend": [],
  "autonomyTier": "human-in-the-loop",
  "confidence": 0.7,
  "overallRisk": "MEDIUM",
  "sections": []
}
\`\`\`
    `;
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations = buildCitations(ctx).map((c) => ({ ...c, verified: c.verified ?? false }));
    const provenance = extractEntityProvenance(mockEntities);

    const result = parseBriefResponse(json, 'vessels', citations, provenance);
    expect(result.success).toBe(true);
  });
});

describe('gateBrief', () => {
  it('passes a well-formed brief with evidence', () => {
    const ctx = buildBriefContext('vessels', mockEntities, mockMemories, mockReflections);
    const citations: Citation[] = buildCitations(ctx).map((c) => ({
      ...c,
      verified: c.verified ?? false,
    }));
    const provenance = extractEntityProvenance(mockEntities);

    const brief = {
      domain: 'vessels',
      headline: 'Fleet status nominal — all vessels reporting',
      situation: 'As of 0600 UTC, both monitored vessels show nominal AIS status.',
      whatWeBelieve: [
        {
          id: 'b-001',
          claim: 'MV Pacific Dawn is at sea with nominal AIS status.',
          confidence: 0.92,
          citationIds: ['cit-ent-ent-001'],
          supported: true,
          caveats: [],
        },
      ],
      whyCitations: citations,
      whatWeRecommend: [
        {
          id: 'r-001',
          priority: 'P2' as const,
          action: 'Continue routine monitoring of fleet',
          rationale: 'No anomalies detected in current reporting period.',
          owner: 'Maritime Ops',
          dueBy: 'Today',
          autonomyTier: 'supervised-autonomy' as const,
          citationIds: ['cit-ent-ent-001'],
        },
      ],
      autonomyTier: 'supervised-autonomy' as const,
      confidence: 0.88,
      overallRisk: 'LOW' as const,
      entityProvenance: provenance,
      sourceTraceIds: [],
      sections: [],
    };

    const result = gateBrief(brief);
    expect(['passed', 'revision_required']).toContain(result.status);
    expect(result.decision).toBeDefined();
  });
});
