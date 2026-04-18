# AGENTS — artifacts/szl-holdings-mobile (CORTEX)

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the CORTEX mobile command artifact.

## What This Is

CORTEX is the unified mobile command app built with Expo / React Native. It provides mobile access to all domain packs: decision approvals, fleet tracking, alert triage, and executive briefing — with push notifications and offline capability.

## Mobile-Specific Rules

- **Never show stale data without a timestamp.** Mobile users often have cached data from poor network conditions. Always show `updatedAt` on any entity card.
- **Approval actions must confirm before executing.** Any approval or rejection action must present a confirmation dialog — mobile taps are error-prone.
- **Push notifications require explicit opt-in.** Never request push notification permission without a clear user-facing explanation of what notifications will be sent.
- **Offline mode must be labeled.** When the app is operating from cached data (no network), show a visible "Offline" indicator. Never present cached data as live.
- **NativeWind classes only.** Do not mix Tailwind web classes with React Native StyleSheet objects. Use NativeWind consistently.

## Route Structure (Expo Router)

```
app/
├── (shell)/
│   ├── intelligence/decisions.tsx  — Decision Center
│   ├── maritime/                   — Vessels mobile surfaces
│   ├── real-estate/               — Terra mobile surfaces
│   └── security/                  — Security mobile surfaces
```

## Key Files

| File | Purpose |
|------|---------|
| `app/` | Expo Router app directory |
| `app/(shell)/intelligence/decisions.tsx` | Mobile Decision Center |
| `lib/` | Shared mobile utilities |
