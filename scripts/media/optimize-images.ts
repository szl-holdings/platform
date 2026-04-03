#!/usr/bin/env tsx
/**
 * SZL Holdings — Image Optimization Pipeline
 *
 * Resize, crop, and compress screenshots for README, wiki, and social preview.
 * Outputs to the appropriate asset folders per the image placement plan.
 *
 * Usage:
 *   npx tsx scripts/media/optimize-images.ts
 *   npx tsx scripts/media/optimize-images.ts --input docs/media/screenshots
 *   npx tsx scripts/media/optimize-images.ts --dry-run
 */

import fs from "fs";
import path from "path";

const INPUT_DIR =
  process.argv.find((_, i) => process.argv[i - 1] === "--input") ||
  "docs/media/screenshots";

const DRY_RUN = process.argv.includes("--dry-run");

interface OptimizationTarget {
  input: string;
  outputs: Array<{
    destination: string;
    width: number;
    height?: number;
    quality: number;
    label: string;
  }>;
}

const TARGETS: OptimizationTarget[] = [
  {
    input: "landing-hero.jpg",
    outputs: [
      {
        destination: "docs/media/screenshots/landing-hero.jpg",
        width: 1440,
        height: 900,
        quality: 88,
        label: "README hero (1440x900)",
      },
      {
        destination: "docs/wiki/assets/szl-holdings-landing.jpg",
        width: 1200,
        height: 750,
        quality: 85,
        label: "Wiki gallery (1200x750)",
      },
      {
        destination: "profile-readme/assets/szl-landing-hero.jpg",
        width: 1200,
        height: 628,
        quality: 88,
        label: "Profile README hero (1200x628)",
      },
      {
        destination: "docs/media/social-preview/org-social-preview.jpg",
        width: 1280,
        height: 640,
        quality: 90,
        label: "Org social preview (1280x640)",
      },
    ],
  },
  {
    input: "lyte-overview.jpg",
    outputs: [
      {
        destination: "docs/media/screenshots/lyte-overview.jpg",
        width: 1440,
        height: 900,
        quality: 88,
        label: "README Lyte (1440x900)",
      },
      {
        destination: "docs/wiki/assets/lyte-overview.jpg",
        width: 1200,
        height: 750,
        quality: 85,
        label: "Wiki gallery Lyte",
      },
      {
        destination: "profile-readme/assets/lyte-overview.jpg",
        width: 800,
        height: 500,
        quality: 85,
        label: "Profile README Lyte",
      },
    ],
  },
  {
    input: "aegis-landing.jpg",
    outputs: [
      {
        destination: "docs/media/screenshots/aegis-overview.jpg",
        width: 1440,
        height: 900,
        quality: 88,
        label: "README Aegis (1440x900)",
      },
      {
        destination: "docs/wiki/assets/aegis-overview.jpg",
        width: 1200,
        height: 750,
        quality: 85,
        label: "Wiki gallery Aegis",
      },
    ],
  },
  {
    input: "vessels-landing.jpg",
    outputs: [
      {
        destination: "docs/media/screenshots/vessels-overview.jpg",
        width: 1440,
        height: 900,
        quality: 88,
        label: "README Vessels (1440x900)",
      },
      {
        destination: "docs/wiki/assets/vessels-overview.jpg",
        width: 1200,
        height: 750,
        quality: 85,
        label: "Wiki gallery Vessels",
      },
    ],
  },
  {
    input: "terra-landing.jpg",
    outputs: [
      {
        destination: "docs/media/screenshots/terra-overview.jpg",
        width: 1440,
        height: 900,
        quality: 88,
        label: "README Terra (1440x900)",
      },
      {
        destination: "docs/wiki/assets/terra-overview.jpg",
        width: 1200,
        height: 750,
        quality: 85,
        label: "Wiki gallery Terra",
      },
    ],
  },
  {
    input: "mobile-narrow-hero.jpg",
    outputs: [
      {
        destination: "docs/media/screenshots/mobile-narrow-hero.jpg",
        width: 390,
        height: 844,
        quality: 88,
        label: "Mobile view (390x844)",
      },
      {
        destination: "docs/wiki/assets/mobile-view.jpg",
        width: 390,
        height: 844,
        quality: 85,
        label: "Wiki gallery mobile",
      },
    ],
  },
];

async function optimizeImages() {
  let sharp: typeof import("sharp");
  try {
    sharp = (await import("sharp")).default as unknown as typeof import("sharp");
  } catch {
    console.log(
      "Sharp not installed. Install with: pnpm add -Dw sharp"
    );
    console.log("Running in copy-only mode (no resize)...");
    await copyOnlyMode();
    return;
  }

  for (const target of TARGETS) {
    const inputPath = path.join(INPUT_DIR, target.input);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${target.input} (not found at ${inputPath})`);
      continue;
    }

    for (const output of target.outputs) {
      console.log(`Processing: ${target.input} → ${output.label}`);

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would write: ${output.destination}`);
        continue;
      }

      const destDir = path.dirname(output.destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      try {
        await (sharp as Function)(inputPath)
          .resize(output.width, output.height, {
            fit: "cover",
            position: "top",
          })
          .jpeg({ quality: output.quality, progressive: true })
          .toFile(output.destination);

        const stat = fs.statSync(output.destination);
        console.log(`  Saved: ${output.destination} (${Math.round(stat.size / 1024)}KB)`);
      } catch (err) {
        console.error(`  Failed: ${err}`);
      }
    }
  }

  console.log("\nOptimization complete.");
}

async function copyOnlyMode() {
  for (const target of TARGETS) {
    const inputPath = path.join(INPUT_DIR, target.input);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${target.input} (not found)`);
      continue;
    }

    for (const output of target.outputs) {
      const destDir = path.dirname(output.destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      if (!fs.existsSync(output.destination)) {
        fs.copyFileSync(inputPath, output.destination);
        console.log(`Copied: ${target.input} → ${output.destination}`);
      }
    }
  }
}

optimizeImages().catch(console.error);
