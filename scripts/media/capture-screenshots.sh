#!/bin/bash
set -euo pipefail

OUTPUT_DIR="docs/media/screenshots"
DOMAIN="${REPLIT_DEV_DOMAIN:-localhost}"

echo "=== SZL Holdings — Screenshot Capture ==="
echo "Domain: $DOMAIN"
echo "Output: $OUTPUT_DIR"
echo ""

mkdir -p "$OUTPUT_DIR"

PAGES=(
  "/" "landing-hero"
  "/trust" "trust-center"
  "/design-partners" "design-partners"
  "/lyte" "lyte-overview"
  "/alloy" "alloy-overview"
  "/alloy/governance" "alloy-governance"
  "/aegis" "aegis-overview"
  "/vessels" "vessels-overview"
  "/terra" "terra-overview"
)

echo "This script generates a list of URLs for manual screenshot capture."
echo "Use a browser or automated tool (Playwright, Puppeteer) to capture these pages."
echo ""
echo "--- Screenshot Targets ---"
echo ""

for ((i=0; i<${#PAGES[@]}; i+=2)); do
  path="${PAGES[$i]}"
  name="${PAGES[$i+1]}"
  echo "  $name: https://$DOMAIN$path"
  echo "    -> Save as: $OUTPUT_DIR/$name.png"
done

echo ""
echo "--- Manual Capture Instructions ---"
echo ""
echo "1. Ensure the SZL Holdings web app is running"
echo "2. Open each URL in a browser at 1440x900 viewport"
echo "3. Use dark mode / dark theme (default)"
echo "4. Save screenshots as PNG to $OUTPUT_DIR/"
echo "5. Crop to content area — no browser chrome"
echo ""
echo "--- Architecture Diagrams ---"
echo ""
echo "Generate these using draw.io, Mermaid, or code-based SVG:"
echo "  - docs/media/diagrams/platform-map.svg"
echo "  - docs/media/diagrams/ecosystem-map.svg"
echo "  - docs/media/diagrams/signal-to-action-flow.svg"
echo "  - docs/media/diagrams/public-mirror-architecture.svg"
echo ""
echo "All visuals should use the premium dark palette:"
echo "  Background: #080c14"
echo "  Surface: #0f1520"
echo "  Border: #1e293b"
echo "  Text: #e2e8f0"
echo "  Accent: #d4a054 (amber)"
echo ""
echo "=== Done ==="
