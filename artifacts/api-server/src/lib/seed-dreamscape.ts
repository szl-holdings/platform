import { getRuntimeMode, isSeedDataAllowed } from '@szl-holdings/platform-registry';
import {
  db,
  dreamscapeCampaignAssetsTable,
  dreamscapeCampaignsTable,
  dreamscapeReviewsTable,
  dreamscapeScriptsTable,
  dreamscapeStoryboardsTable,
  dreamscapeVoiceAssetsTable,
} from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

export async function seedDreamscapeData(): Promise<void> {
  if (!isSeedDataAllowed()) {
    const mode = getRuntimeMode();
    throw new Error(
      `[seed-dreamscape] Attempted to seed Creative Workflows data in ${mode} mode. ` +
        `Seed data is only permitted in local-dev, internal-preview, and demo modes.`,
    );
  }

  // Check ALL Dreamscape tables — previously only campaigns was checked, so a
  // partial-state restart (campaigns inserted but a downstream table failed)
  // would silently skip the re-seed and leave scripts/storyboards/voice/
  // assets/reviews permanently empty.
  const counts = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(dreamscapeCampaignsTable),
    db.select({ c: sql<number>`count(*)::int` }).from(dreamscapeScriptsTable),
    db.select({ c: sql<number>`count(*)::int` }).from(dreamscapeStoryboardsTable),
    db.select({ c: sql<number>`count(*)::int` }).from(dreamscapeVoiceAssetsTable),
    db.select({ c: sql<number>`count(*)::int` }).from(dreamscapeCampaignAssetsTable),
    db.select({ c: sql<number>`count(*)::int` }).from(dreamscapeReviewsTable),
  ]);
  const campaignCount = counts[0][0]?.c ?? 0;
  const scriptCount = counts[1][0]?.c ?? 0;
  const storyboardCount = counts[2][0]?.c ?? 0;
  const voiceCount = counts[3][0]?.c ?? 0;
  const assetCount = counts[4][0]?.c ?? 0;
  const reviewCount = counts[5][0]?.c ?? 0;
  if (
    campaignCount > 0 &&
    scriptCount > 0 &&
    storyboardCount > 0 &&
    voiceCount > 0 &&
    assetCount > 0 &&
    reviewCount > 0
  ) {
    return;
  }
  if (campaignCount > 0) {
    return;
  }

  const now = new Date();
  const weeksOut = (n: number) => new Date(now.getTime() + n * 7 * 24 * 3600 * 1000);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

  const campaigns = await db
    .insert(dreamscapeCampaignsTable)
    .values([
      {
        name: 'Horizon Brand Film',
        description:
          "60-second flagship brand film showcasing SZL Holdings' platform ecosystem — intelligence, execution, and precision at scale.",
        clientName: 'SZL Holdings Internal',
        status: 'post_production',
        category: 'brand_story',
        targetAudience: 'Fortune 500 CIOs, CFOs, and innovation officers',
        deadline: weeksOut(3),
        metadata: {
          progress: 72,
          budget: '$420,000',
          director: 'Elena Vasquez',
          client: 'SZL Holdings Internal',
          kpis: [
            { label: 'View Target', value: '2.4M', trend: '+18%' },
            { label: 'Engagement', value: '8.2%', trend: '+3.1%' },
          ],
        },
      },
      {
        name: 'Alloy Platform Launch',
        description:
          'Multi-channel product launch campaign for AlloyScape Execution Fabric — digital video, social cutdowns, and executive demo reels.',
        clientName: 'Alloy Product',
        status: 'production',
        category: 'product_launch',
        targetAudience: 'DevOps leads, platform engineers, and technology executives',
        deadline: weeksOut(5),
        metadata: {
          progress: 45,
          budget: '$185,000',
          director: 'Marcus Delacroix',
          client: 'Alloy Product',
          kpis: [
            { label: 'Demo Signups', value: '1,200', trend: '+22%' },
            { label: 'Pipeline', value: '$3.8M', trend: '+41%' },
          ],
        },
      },
      {
        name: 'Vessels Maritime Intelligence',
        description:
          'Cinematic documentary-style campaign covering global maritime operations — real footage from the Atlantic and Pacific corridors.',
        clientName: 'Vessels Platform',
        status: 'review',
        category: 'documentary',
        targetAudience: 'Fleet operators, shipping companies, port authorities',
        deadline: weeksOut(2),
        metadata: {
          progress: 88,
          budget: '$310,000',
          director: 'Sarah Okonkwo',
          client: 'Vessels Platform',
          kpis: [
            { label: 'Prospects', value: '340', trend: '+12%' },
            { label: 'CTR', value: '4.7%', trend: '+0.9%' },
          ],
        },
      },
      {
        name: 'Aegis Cyber Defense Series',
        description:
          'High-tension social media series demonstrating live-fire cybersecurity simulations — targeting CISO decision makers across LinkedIn and YouTube.',
        clientName: 'Aegis Security',
        status: 'concept',
        category: 'social_media',
        targetAudience: 'CISOs, Security Directors, DoD procurement officers',
        deadline: weeksOut(8),
        metadata: {
          progress: 15,
          budget: '$95,000',
          director: 'James Park',
          client: 'Aegis Security',
          kpis: [
            { label: 'Impressions', value: '500K', trend: '+0%' },
            { label: 'Leads', value: '85', trend: '+0%' },
          ],
        },
      },
      {
        name: 'Carlota Jo — Autumn Collection',
        description:
          'Luxury lifestyle campaign for Carlota Jo Consulting seasonal rebrand — editorial video, brand photography, and Instagram carousel series.',
        clientName: 'Carlota Jo Consulting',
        status: 'published',
        category: 'commercial',
        targetAudience:
          'High-net-worth individuals, C-suite executives, and luxury brand enthusiasts',
        deadline: daysAgo(14),
        metadata: {
          progress: 100,
          budget: '$75,000',
          director: 'Isabelle Fontaine',
          client: 'Carlota Jo Consulting',
          kpis: [
            { label: 'Engagement', value: '11.4%', trend: '+6.2%' },
            { label: 'Bookings', value: '+34%', trend: '+34%' },
          ],
        },
      },
    ])
    .returning();

  if (campaigns.length === 0) return;

  const [horizon, alloy, vessels] = campaigns;

  const scripts = await db
    .insert(dreamscapeScriptsTable)
    .values([
      {
        campaignId: horizon.id,
        title: 'Horizon — V3 Final Script',
        content: `FADE IN:

INT. SERVER HALL — NIGHT
Rows of blinking infrastructure. Camera drifts through them slowly.

NARRATOR (V.O.)
In a world of noise, the signal matters.

CUT TO:

EXT. MARITIME COAST — DAWN
A container vessel cuts through morning fog. The horizon is clear.

NARRATOR (V.O.)
Alloy. Execution fabric for the decisions that define industries.

MONTAGE: Alloy dashboard, Vessels command, Firestorm alert cascade, Counsel research threads.

NARRATOR (V.O.)
Seven platforms. One nervous system. Zero tolerance for ambiguity.

SMASH CUT TO BLACK.
TEXT ON SCREEN: "Alloy. Execute with intelligence."

FADE OUT.`,
        version: 3,
        status: 'approved',
        notes: 'Approved by SZL on March 15. Final VO recording scheduled March 28.',
      },
      {
        campaignId: horizon.id,
        title: 'Horizon — V2 Draft',
        content: `FADE IN:\n\nINT. COMMAND CENTER — NIGHT\nOperators at terminals. Signals flowing.\n\n(Earlier draft — archived)`,
        version: 2,
        status: 'review',
        notes: 'Superseded by V3. Retained for reference.',
      },
      {
        campaignId: alloy.id,
        title: 'Alloy Launch — Demo Reel Script',
        content: `OPEN ON SCREEN RECORDING — Alloy signal ingest dashboard.

VO: "Imagine every signal from every platform — unified."

SCREEN: Workflow run triggers. Steps complete in sequence.

VO: "Alloy doesn't just collect intelligence. It acts on it."

SCREEN: Approval modal. Executive approves. Action dispatched.

VO: "Alloy. The execution layer your enterprise has been waiting for."

END CARD: alloy.szlholdings.com — Request Access`,
        version: 1,
        status: 'draft',
        notes: 'First pass from product team. Needs executive review.',
      },
    ])
    .returning();

  const _storyboards = await db
    .insert(dreamscapeStoryboardsTable)
    .values([
      {
        campaignId: horizon.id,
        scriptId: scripts[0]?.id,
        title: 'Opening — Server Hall',
        sceneNumber: 1,
        visualDescription: 'Slow dolly through server racks, blue ambient light, subtle lens flare',
        dialogue: 'NARRATOR: In a world of noise, the signal matters.',
        duration: '0:00 – 0:08',
        metadata: { shotType: 'Dolly — Wide', transition: 'Dissolve' },
      },
      {
        campaignId: horizon.id,
        scriptId: scripts[0]?.id,
        title: 'Maritime Horizon Shot',
        sceneNumber: 2,
        visualDescription: 'Aerial shot of container vessel at dawn, golden fog, wide establishing',
        dialogue: 'NARRATOR: Alloy. Execution fabric for the decisions that define industries.',
        duration: '0:08 – 0:18',
        metadata: { shotType: 'Aerial — Establishing', transition: 'Hard Cut' },
      },
      {
        campaignId: horizon.id,
        scriptId: scripts[0]?.id,
        title: 'Platform Montage',
        sceneNumber: 3,
        visualDescription:
          '4-panel split of Alloy, Vessels, Firestorm, Counsel dashboards — animated data flows',
        dialogue: 'NARRATOR: Seven platforms. One nervous system. Zero tolerance for ambiguity.',
        duration: '0:18 – 0:45',
        metadata: { shotType: 'Screen Capture — Montage', transition: 'Smash Cut' },
      },
      {
        campaignId: horizon.id,
        scriptId: scripts[0]?.id,
        title: 'End Card',
        sceneNumber: 4,
        visualDescription: 'Black frame, Alloy wordmark appears, tagline fades in',
        dialogue: 'TEXT: Alloy. Execute with intelligence.',
        duration: '0:45 – 0:60',
        metadata: { shotType: 'Graphic — Logo', transition: 'Fade to Black' },
      },
      {
        campaignId: alloy.id,
        scriptId: scripts[2]?.id,
        title: 'Dashboard Walkthrough',
        sceneNumber: 1,
        visualDescription:
          'Screen recording of Alloy signal ingest — animated signals populating in real-time',
        dialogue: 'VO: Imagine every signal from every platform — unified.',
        duration: '0:00 – 0:12',
        metadata: { shotType: 'Screen Recording', transition: 'Dissolve' },
      },
      {
        campaignId: vessels.id,
        title: 'Atlantic Corridor Dawn',
        sceneNumber: 1,
        visualDescription:
          '4K drone footage — container vessel steaming at dawn, Atlantic light, cinematic grade',
        dialogue: 'NARRATOR: Forty-two vessels. Eight continents. One command center.',
        duration: '0:00 – 0:15',
        metadata: { shotType: 'Drone — Wide', transition: 'Slow Dissolve' },
      },
    ])
    .returning();

  await db.insert(dreamscapeVoiceAssetsTable).values([
    {
      campaignId: horizon.id,
      name: 'Horizon VO — Final Take',
      voiceId: 'rachel',
      provider: 'elevenlabs',
      text: 'In a world of noise, the signal matters. Alloy. Execution fabric for the decisions that define industries. Seven platforms. One nervous system. Zero tolerance for ambiguity.',
      audioUrl: undefined,
      duration: '0:32',
      status: 'ready',
      metadata: { voice: 'Rachel — Premium', quality: 'Studio Master', bitrate: '320kbps' },
    },
    {
      campaignId: horizon.id,
      name: 'Horizon VO — Alternate (Male)',
      voiceId: 'adam',
      provider: 'elevenlabs',
      text: 'In a world of noise, the signal matters. Alloy. Execution fabric for the decisions that define industries.',
      audioUrl: undefined,
      duration: '0:18',
      status: 'ready',
      metadata: { voice: 'Adam — Deep', quality: 'Studio Master' },
    },
    {
      campaignId: alloy.id,
      name: 'Alloy Demo Reel VO',
      voiceId: 'placeholder',
      provider: 'placeholder',
      text: "Imagine every signal from every platform — unified. Alloy doesn't just collect intelligence. It acts on it.",
      audioUrl: undefined,
      duration: '0:22',
      status: 'pending',
      metadata: { note: 'Awaiting ElevenLabs generation — scheduled for next sprint' },
    },
  ]);

  await db.insert(dreamscapeCampaignAssetsTable).values([
    {
      campaignId: horizon.id,
      name: 'Horizon Master — 4K ProRes',
      type: 'video',
      fileUrl: undefined,
      thumbnailUrl: undefined,
      fileSize: 14200000000,
      mimeType: 'video/quicktime',
      tags: ['master', '4k', 'prores'],
      metadata: {
        resolution: '3840×2160',
        codec: 'ProRes 4444',
        frameRate: '24fps',
        colorSpace: 'Rec. 2020',
      },
    },
    {
      campaignId: horizon.id,
      name: 'SZL Brand Guidelines v4.2',
      type: 'document',
      fileUrl: undefined,
      thumbnailUrl: undefined,
      fileSize: 48000000,
      mimeType: 'application/pdf',
      tags: ['brand', 'guidelines', 'reference'],
      metadata: {},
    },
    {
      campaignId: horizon.id,
      name: 'Alloy Wordmark — White SVG',
      type: 'image',
      fileUrl: undefined,
      thumbnailUrl: undefined,
      fileSize: 12000,
      mimeType: 'image/svg+xml',
      tags: ['logo', 'alloy', 'vector'],
      metadata: {},
    },
    {
      campaignId: vessels.id,
      name: 'Atlantic Corridor — Raw Footage',
      type: 'video',
      fileUrl: undefined,
      thumbnailUrl: undefined,
      fileSize: 8800000000,
      mimeType: 'video/quicktime',
      tags: ['raw', 'drone', '4k'],
      metadata: { resolution: '4096×2160', codec: 'ARRIRAW', frameRate: '24fps' },
    },
  ]);

  await db.insert(dreamscapeReviewsTable).values([
    {
      campaignId: horizon.id,
      reviewerName: 'James Thornton',
      comment:
        "The opening server hall sequence is outstanding — the pace and score work perfectly together. Minor note: the maritime shot transition at 0:08 could be smoother. Let's discuss in tomorrow's call.",
      status: 'approved',
    },
    {
      campaignId: horizon.id,
      reviewerName: 'Priya Sharma',
      comment:
        'Legal cleared the final VO script. Brand guidelines compliance confirmed. End card duration needs extending from 6s to 8s per accessibility standards.',
      status: 'changes_requested',
    },
    {
      campaignId: horizon.id,
      reviewerName: 'Marcus Chen',
      comment:
        'Client loved V3. The platform montage is exactly what we asked for. Requesting one additional B-roll shot of the Counsel interface for the 0:32 slot.',
      status: 'pending',
    },
    {
      campaignId: vessels.id,
      reviewerName: 'Elena Vasquez',
      comment:
        'Drone footage from the Atlantic is stunning. Color grade is approved. Audio mix needs revision — wind noise in scene 1 is too prominent.',
      status: 'changes_requested',
    },
  ]);
}
