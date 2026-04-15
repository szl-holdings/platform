#!/usr/bin/env node
/**
 * generate-screenshots.js
 * Generates store-ready screenshot manifests and HTML capture guides
 * for all 7 mobile apps at required App Store and Google Play dimensions.
 *
 * This script produces:
 *  1. A screenshot manifest JSON per app listing all required sizes and screens
 *  2. An HTML screenshot guide for browser-based capture at each device viewport
 *  3. Output directory structure ready to receive captured screenshots
 *
 * Usage:
 *   node scripts/generate-screenshots.js [apps...] [--all] [--output-dir <dir>]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const DEVICE_SIZES = {
  ios: [
    {
      name: 'iPhone 6.7" (required)',
      width: 1290,
      height: 2796,
      label: "iphone-6_7",
      required: true,
      notes: "iPhone 15 Pro Max / 14 Plus",
    },
    {
      name: 'iPhone 6.5"',
      width: 1242,
      height: 2688,
      label: "iphone-6_5",
      required: false,
      notes: "iPhone 11 Pro Max / XS Max",
    },
    {
      name: 'iPhone 5.5"',
      width: 1242,
      height: 2208,
      label: "iphone-5_5",
      required: false,
      notes: "iPhone 8 Plus",
    },
    {
      name: 'iPad Pro 12.9" (required for tablet)',
      width: 2048,
      height: 2732,
      label: "ipad-12_9",
      required: false,
      notes: "iPad Pro 12.9\" 3rd gen+",
    },
  ],
  android: [
    {
      name: "Android Phone (required)",
      width: 1080,
      height: 1920,
      label: "android-phone",
      required: true,
      notes: "Standard Android phone",
    },
    {
      name: 'Android Tablet 7"',
      width: 1200,
      height: 1920,
      label: "android-tablet-7",
      required: false,
      notes: "7-inch tablet",
    },
    {
      name: 'Android Tablet 10"',
      width: 1920,
      height: 1200,
      label: "android-tablet-10",
      required: false,
      notes: "10-inch tablet",
    },
  ],
};

const APPS = {
  aegis: {
    dir: "artifacts/aegis-mobile",
    name: "Aegis — SOC Command Center",
    color: "#080B12",
    accentColor: "#6366f1",
    screens: [
      "Threat Dashboard — Live incident feed with severity triage",
      "Active Incidents — List with status and assignee",
      "Incident Detail — Timeline, evidence, and response actions",
      "Intelligence Feed — Correlated threat data and ATT&CK mapping",
      "Alert Settings — Push notification configuration",
    ],
  },
  "carlota-jo": {
    dir: "artifacts/carlota-jo-mobile",
    name: "Carlota Jo — Client App",
    color: "#0e0c09",
    accentColor: "#c9a84c",
    screens: [
      "Dashboard — Portfolio overview and engagement status",
      "Secure Messaging — Encrypted advisor communication",
      "Document Vault — Agreements and reports",
      "Meeting Schedule — Advisory session calendar",
      "Profile — Account and access settings",
    ],
  },
  lyte: {
    dir: "artifacts/lyte-mobile",
    name: "Lyte — AIOps Command",
    color: "#070c14",
    accentColor: "#00d4ff",
    screens: [
      "Infrastructure Health — Service status overview",
      "Anomaly Detection — ML-surfaced incidents with root cause",
      "Incident Detail — Correlated services and remediation steps",
      "Topology Map — Service dependency visualization",
      "Alert Policies — Smart alerting configuration",
    ],
  },
  szl: {
    dir: "artifacts/szl-holdings-mobile",
    name: "SZL Holdings — Executive Command",
    color: "#090810",
    accentColor: "#c9a84c",
    screens: [
      "Portfolio Overview — Entity performance KPIs",
      "Deal Flow — Active transactions and pipeline",
      "Communications — Encrypted principal messaging",
      "Documents — Board materials and investment memos",
      "Reporting — Financial summaries and analytics",
    ],
  },
  stephen: {
    dir: "artifacts/stephen-mobile",
    name: "Stephen Lutar — Personal Command",
    color: "#0a0a0a",
    accentColor: "#ffffff",
    screens: [
      "Home — Personal command dashboard",
      "Content Feed — Exclusive updates and insights",
      "Scheduling — Meeting request and management",
      "Messages — Private communication channel",
      "Network — Contact and connection management",
    ],
  },
  terra: {
    dir: "artifacts/terra-mobile",
    name: "Terra — Real Estate Intelligence",
    color: "#0d0b08",
    accentColor: "#b8943c",
    screens: [
      "Distress Feed — Filtered property opportunities",
      "Property Detail — Comps, history, and field notes",
      "Map View — Geographic property visualization",
      "Acquisition Pipeline — Deal lifecycle tracking",
      "Watchlist — Monitored properties with alerts",
    ],
  },
  vessels: {
    dir: "artifacts/vessels-mobile",
    name: "Vessels — Fleet Command",
    color: "#020d18",
    accentColor: "#0ea5e9",
    screens: [
      "Fleet Map — Live AIS vessel positions",
      "Vessel Detail — Specs, voyage, and cargo",
      "Port Intelligence — Berth and congestion status",
      "Route Tracking — Active voyage with waypoints",
      "Alerts — Fleet events and incident notifications",
    ],
  },
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateManifest(appKey, app) {
  return {
    app: appKey,
    name: app.name,
    generatedAt: new Date().toISOString(),
    instructions: {
      step1: "Run the app with: npx expo start --web",
      step2: "Open browser dev tools and set viewport to each device size below",
      step3: "Navigate to each screen listed and capture a screenshot",
      step4: "Save screenshots with the naming convention: <label>-<screen-index>.png",
      step5: "Upload to App Store Connect / Google Play Console using store/ metadata",
    },
    ios: DEVICE_SIZES.ios.map((device) => ({
      ...device,
      screens: app.screens,
      outputDir: `screenshots/${appKey}/ios/${device.label}/`,
      fileNaming: `${device.label}-NN.png (01 through ${String(app.screens.length).padStart(2, "0")})`,
    })),
    android: DEVICE_SIZES.android.map((device) => ({
      ...device,
      screens: app.screens,
      outputDir: `screenshots/${appKey}/android/${device.label}/`,
      fileNaming: `${device.label}-NN.png (01 through ${String(app.screens.length).padStart(2, "0")})`,
    })),
  };
}

function generateHtmlTemplate(appKey, app) {
  const screensList = app.screens
    .map((s, i) => `<li><strong>Screen ${String(i + 1).padStart(2, "0")}:</strong> ${s}</li>`)
    .join("\n          ");

  const iosSizes = DEVICE_SIZES.ios
    .map(
      (d) =>
        `<tr>
        <td>${d.name}</td>
        <td>${d.width} &times; ${d.height}</td>
        <td><span class="${d.required ? "required" : "optional"} badge">${d.required ? "Required" : "Optional"}</span></td>
        <td>${d.notes}</td>
      </tr>`
    )
    .join("\n      ");

  const androidSizes = DEVICE_SIZES.android
    .map(
      (d) =>
        `<tr>
        <td>${d.name}</td>
        <td>${d.width} &times; ${d.height}</td>
        <td><span class="${d.required ? "required" : "optional"} badge">${d.required ? "Required" : "Optional"}</span></td>
        <td>${d.notes}</td>
      </tr>`
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${app.name} — Screenshot Guide</title>
  <style>
    body { font-family: system-ui, sans-serif; background: ${app.color}; color: #e5e5e5; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1 { color: ${app.accentColor}; margin-bottom: 0.25rem; }
    h2 { color: #999; border-bottom: 1px solid #333; padding-bottom: 0.5rem; margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th { background: #111; color: ${app.accentColor}; padding: 0.75rem; text-align: left; }
    td { padding: 0.75rem; border-bottom: 1px solid #222; }
    ol, ul { line-height: 2.2; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8em; font-weight: 600; }
    .required { background: #1a472a; color: #69db7c; }
    .optional { background: #1c1c2e; color: #888; }
    code { background: #111; padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #111; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    .subtitle { color: #666; margin-top: 0; }
  </style>
</head>
<body>
  <h1>${app.name}</h1>
  <p class="subtitle">Screenshot capture guide for App Store and Google Play submission</p>

  <h2>Capture Steps</h2>
  <ol>
    <li>Start the app: <code>cd ${app.dir} &amp;&amp; npx expo start --web</code></li>
    <li>Open Chrome or Safari and navigate to the local Expo dev URL</li>
    <li>Open Developer Tools &rarr; Device Toolbar (Ctrl+Shift+M / Cmd+Opt+I)</li>
    <li>Set the viewport to each device size listed below</li>
    <li>Navigate to each screen and capture using your screenshot tool</li>
    <li>Save files to the output paths listed in <code>store/screenshot-manifest.json</code></li>
  </ol>

  <h2>Screens to Capture (${app.screens.length} screens)</h2>
  <ul>
    ${screensList}
  </ul>

  <h2>iOS Device Sizes</h2>
  <table>
    <thead>
      <tr><th>Device</th><th>Resolution</th><th>Status</th><th>Notes</th></tr>
    </thead>
    <tbody>
      ${iosSizes}
    </tbody>
  </table>

  <h2>Android Device Sizes</h2>
  <table>
    <thead>
      <tr><th>Device</th><th>Resolution</th><th>Status</th><th>Notes</th></tr>
    </thead>
    <tbody>
      ${androidSizes}
    </tbody>
  </table>

  <h2>Output Directory Structure</h2>
  <pre><code>screenshots/${appKey}/
  ios/
    iphone-6_7/    ← 1290×2796  (required)
    iphone-6_5/    ← 1242×2688
    iphone-5_5/    ← 1242×2208
    ipad-12_9/     ← 2048×2732
  android/
    android-phone/     ← 1080×1920  (required)
    android-tablet-7/  ← 1200×1920
    android-tablet-10/ ← 1920×1200</code></pre>
</body>
</html>`;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { apps: [], all: false, outputDir: "screenshots" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--all") opts.all = true;
    else if (args[i] === "--output-dir") opts.outputDir = args[++i];
    else if (!args[i].startsWith("--")) opts.apps.push(args[i]);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  const targetKeys =
    opts.all ? Object.keys(APPS)
    : opts.apps.length > 0 ? opts.apps
    : Object.keys(APPS);

  console.log("\n📸 Screenshot Generation Utility\n");

  for (const appKey of targetKeys) {
    const app = APPS[appKey];
    if (!app) {
      console.warn(`  ⚠️  Unknown app: ${appKey}, skipping`);
      continue;
    }

    console.log(`  Processing ${app.name}...`);

    const appDir = path.resolve(REPO_ROOT, app.dir);
    const manifestDir = path.join(appDir, "store");
    ensureDir(manifestDir);

    const manifest = generateManifest(appKey, app);
    fs.writeFileSync(
      path.join(manifestDir, "screenshot-manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    const htmlGuide = generateHtmlTemplate(appKey, app);
    fs.writeFileSync(path.join(manifestDir, "screenshot-guide.html"), htmlGuide);

    const outputBase = path.resolve(REPO_ROOT, opts.outputDir, appKey);
    const screenshotDirs = [
      ...DEVICE_SIZES.ios.map((d) => path.join(outputBase, "ios", d.label)),
      ...DEVICE_SIZES.android.map((d) => path.join(outputBase, "android", d.label)),
    ];
    screenshotDirs.forEach(ensureDir);

    const readmePath = path.join(outputBase, "README.txt");
    fs.writeFileSync(
      readmePath,
      `${app.name} — Screenshots\n${"=".repeat(50)}\n\nOpen ${app.dir}/store/screenshot-guide.html\nfor capture instructions and device size requirements.\n\nManifest: ${app.dir}/store/screenshot-manifest.json\n`
    );

    console.log(`  ✅ ${appKey}: manifest + guide written, ${screenshotDirs.length} output dirs created`);
  }

  console.log("\n✅ Done! Next steps:");
  console.log("   1. Open each app's store/screenshot-guide.html in a browser");
  console.log("   2. Follow the capture instructions for each device size");
  console.log("   3. Place captured screenshots in the output directories");
  console.log("   4. Upload to App Store Connect and Google Play Console\n");
}

main();
