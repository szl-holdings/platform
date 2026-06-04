#!/usr/bin/env tsx
/**
 * SZL Holdings — Wiki Gallery Generator
 *
 * Scans the wiki/assets folder and generates a gallery markdown page.
 * Outputs to docs/wiki/Screenshots-and-Demos.md
 *
 * Usage:
 *   npx tsx scripts/media/generate-wiki-gallery.ts
 *   npx tsx scripts/media/generate-wiki-gallery.ts --assets-dir docs/wiki/assets
 *   npx tsx scripts/media/generate-wiki-gallery.ts --output docs/wiki/Screenshots-and-Demos.md
 */

import fs from 'node:fs';
import path from 'node:path';

const ASSETS_DIR =
  process.argv.find((_, i) => process.argv[i - 1] === '--assets-dir') || 'docs/wiki/assets';

const OUTPUT_FILE =
  process.argv.find((_, i) => process.argv[i - 1] === '--output') ||
  'docs/wiki/Screenshots-and-Demos.md';

interface GalleryEntry {
  file: string;
  label: string;
  product: string;
  description: string;
}

const KNOWN_FILES: Record<string, Omit<GalleryEntry, 'file'>> = {
  'szl-holdings-landing.jpg': {
    label: 'SZL Holdings — Platform Landing',
    product: 'SZL Holdings',
    description:
      'Main marketing landing page. Dark-premium aesthetic with the core thesis: "Signal → visibility → forecast → governed action."',
  },
  'lyte-overview.jpg': {
    label: 'Lyte — Business Observability',
    product: 'Lyte',
    description:
      'Lyte marketing and command surface. PRISM framework: People, Revenue, Infrastructure, Security, Market.',
  },
  'lyte-dashboard.jpg': {
    label: 'Lyte — Command Dashboard',
    product: 'Lyte',
    description:
      'Lyte command center dashboard with PRISM panels, signal timeline, and priority action queue.',
  },
  'aegis-overview.jpg': {
    label: 'Aegis — Defense & Intelligence',
    product: 'Aegis',
    description:
      'Aegis unified defense and intelligence platform. SOC, managed operations, and intelligence engine in one console.',
  },
  'vessels-overview.jpg': {
    label: 'Vessels — Fleet Command',
    product: 'Vessels',
    description:
      'Vessels maritime intelligence platform. Fleet tracking, voyage economics, and exception-based operations.',
  },
  'terra-overview.jpg': {
    label: 'Terra — Real Estate Intelligence',
    product: 'Terra',
    description:
      'Terra real estate intelligence platform. Distress signal detection, ownership analysis, and deal pipeline.',
  },
  'mobile-view.jpg': {
    label: 'SZL Holdings — Mobile Responsive',
    product: 'SZL Holdings',
    description:
      'Mobile viewport (390px) — responsive layout verification for the platform landing page.',
  },
  'platform-map.svg': {
    label: 'Platform Architecture Map',
    product: 'Architecture',
    description: 'Full platform architecture diagram showing Lyte, Counsel, and domain packs.',
  },
  'ecosystem-map.svg': {
    label: 'Ecosystem Map',
    product: 'Architecture',
    description: 'Ecosystem-level view showing how all SZL Holdings products connect.',
  },
  'founder-card.svg': {
    label: 'Founder Card',
    product: 'Profile',
    description: 'Founder identity card for profile README.',
  },
};

function getEntry(file: string): GalleryEntry {
  const known = KNOWN_FILES[file];
  if (known) return { file, ...known };

  const name = path
    .basename(file, path.extname(file))
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    file,
    label: name,
    product: 'Platform',
    description: `${name} — visual asset from the SZL Holdings platform ecosystem.`,
  };
}

function generateGalleryMarkdown(entries: GalleryEntry[]): string {
  const byProduct: Record<string, GalleryEntry[]> = {};

  for (const entry of entries) {
    if (!byProduct[entry.product]) byProduct[entry.product] = [];
    byProduct[entry.product].push(entry);
  }

  const productOrder = [
    'SZL Holdings',
    'Lyte',
    'Counsel',
    'Aegis',
    'Vessels',
    'Terra',
    'Carlota Jo',
    'Architecture',
    'Profile',
  ];

  const orderedProducts = [
    ...productOrder.filter((p) => byProduct[p]),
    ...Object.keys(byProduct).filter((p) => !productOrder.includes(p)),
  ];

  let md = `# Screenshots & Demos

**SZL Holdings Platform — Visual Gallery**

This page contains live screenshots and visual assets from all products in the SZL Holdings ecosystem. Screenshots are captured from running applications at 1440×900 (desktop) and 390×844 (mobile) viewports with dark-premium styling.

> Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

---

## Table of Contents

`;

  for (const product of orderedProducts) {
    md += `- [${product}](#${product
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')})\n`;
  }

  md += '\n---\n\n';

  for (const product of orderedProducts) {
    const productEntries = byProduct[product];
    const anchor = product
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    md += `## ${product} {#${anchor}}\n\n`;

    for (const entry of productEntries) {
      const ext = path.extname(entry.file).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);

      md += `### ${entry.label}\n\n`;
      md += `${entry.description}\n\n`;

      if (isImage) {
        md += `![${entry.label}](assets/${entry.file})\n\n`;
      } else {
        md += `[View file](assets/${entry.file})\n\n`;
      }

      md += '---\n\n';
    }
  }

  md += `## Capture Pipeline

Screenshots are captured using the automated pipeline in \`scripts/media/\`:

\`\`\`bash
# Capture all screenshots (requires running apps)
npx tsx scripts/media/capture-screenshots.ts

# Optimize and distribute to correct folders
npx tsx scripts/media/optimize-images.ts

# Regenerate this gallery
npx tsx scripts/media/generate-wiki-gallery.ts
\`\`\`

### Quality Standards

- Viewport: 1440×900 (desktop), 390×844 (mobile)
- Format: JPEG, 85–90% quality, progressive
- Color scheme: Dark (forced)
- Scale: 1x device pixel ratio
- No debug chrome, no broken states, no placeholder data
- Meaningful demo data in all views

### Asset Placement

| Destination | Purpose |
|-------------|---------|
| \`docs/media/screenshots/\` | Source originals |
| \`docs/wiki/assets/\` | Wiki gallery (this page) |
| \`profile-readme/assets/\` | GitHub profile README |
| \`docs/media/social-preview/\` | Social preview / OG image |
`;

  return md;
}

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    process.exit(1);
  }

  const files = fs.readdirSync(ASSETS_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext);
  });

  if (files.length === 0) {
    process.exit(0);
  }

  const entries: GalleryEntry[] = files.map(getEntry);
  const markdown = generateGalleryMarkdown(entries);

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
}

main();
