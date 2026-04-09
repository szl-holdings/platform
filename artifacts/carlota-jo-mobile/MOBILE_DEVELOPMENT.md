# Mobile Development Guide

This mobile app is **not started automatically** to conserve system resources. All 7 mobile apps running simultaneously would exceed available memory. Start only one at a time when developing.

## How to Start This App

In the Replit UI, find this app's workflow in the workflow panel and click **Run**.

Alternatively, run from the terminal:
```
pnpm --filter @workspace/<app-name> run dev
```

Replace `<app-name>` with the package name from `package.json` (e.g., `aegis-mobile`, `vessels-mobile`).

## Development Process

1. **Start only this mobile workflow** — do not start other mobile apps at the same time.
2. Work on the app and test in the mobile preview.
3. **Stop this workflow** before starting a different mobile app.

## Why This Restriction Exists

Running all 7 Expo mobile apps simultaneously alongside 8 web apps and the API server exceeds the environment's memory capacity. Mobile apps are heavy — each Expo process uses significant RAM. One at a time ensures stable development.

## Web Apps (Always Running)

The 8 web apps and the API server start automatically and should always be running. Only mobile apps need this manual start/stop workflow.
