# NEXUS Visual Regression Baselines

These PNG files are committed baseline screenshots for the NEXUS visual regression suite.

## Updating baselines

Run the following command locally after intentional visual changes:

```bash
PLAYWRIGHT_UPDATE_SNAPSHOTS=1 pnpm test:e2e --grep "NEXUS visual"
```

Then review the diff, commit the updated PNG files, and push.

## CI behaviour

The visual regression suite runs on every PR. If any screenshot differs from the baseline by more than 0.5% of pixels, the PR fails.

