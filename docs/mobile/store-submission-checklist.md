# Store Submission Checklist — Lyte Mobile

Use this checklist before submitting to the App Store (iOS) and Google Play (Android).

---

## iOS App Store — Pre-Submission

### Account & Project Setup
- [ ] Apple Developer Account active ($99/year)
- [ ] App record created in App Store Connect
- [ ] Bundle ID `com.lyte.aiops.mobile` registered in Apple Developer Portal
- [ ] Push notification entitlement enabled
- [ ] App Groups configured if needed
- [ ] `ascAppId` in `eas.json` updated with real App Store Connect App ID
- [ ] `appleTeamId` in `eas.json` updated with real Team ID
- [ ] `appleId` in `eas.json` set to ops@lyte.ai (or Apple ID used for signing)

### Build
- [ ] `eas build --profile production --platform ios` completes without errors
- [ ] Build artifact visible in Expo dashboard
- [ ] TestFlight internal testing completed (invite 5–10 internal users)
- [ ] No crash reports in TestFlight session

### App Store Connect Listing
- [ ] App name: "Lyte — AIOps Command"
- [ ] Subtitle (30 chars): "Business Observability On-Call"
- [ ] Primary language: English (US)
- [ ] Category: Business
- [ ] Secondary category: Developer Tools (optional)
- [ ] Keywords (100 chars): aiops, observability, monitoring, incidents, oncall, alerts, sre
- [ ] Description (4000 chars max): written and reviewed
- [ ] Promotional text (170 chars): written
- [ ] Privacy policy URL: https://lyte.ai/privacy (live and accessible)
- [ ] Support URL: https://lyte.ai/support
- [ ] Marketing URL: https://lyte.ai (optional)

### Screenshots
- [ ] 6.7" (iPhone 15 Pro Max) — 3 minimum, 10 maximum
- [ ] 6.5" (iPhone 14 Plus) — optional if 6.7" provided
- [ ] 5.5" (iPhone 8 Plus) — recommended for older devices
- [ ] iPad (if `supportsTablet: true`) — not required for this app

### Age Rating
- [ ] Complete Age Rating questionnaire
- [ ] No mature content, gambling, or adult themes — expected: 4+

### Compliance
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption: false` set
- [ ] IDFA: not using advertising identifier (confirm no analytics SDK uses it)
- [ ] Privacy Manifest file present and accurate
- [ ] App Tracking Transparency: not required if no tracking

### Submission
- [ ] Version 1.0.0, Build 1 ready
- [ ] `eas submit --profile production --platform ios` run
- [ ] Submission appears in App Store Connect as "Waiting for Review"
- [ ] Review typically takes 24–48 hours

---

## Google Play — Pre-Submission

### Account & Project Setup
- [ ] Google Play Developer Account active ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Package name `com.lyte.aiops.mobile` reserved
- [ ] Service account key `google-play-key.json` created with "Release Manager" role
- [ ] Key file path set in `eas.json` submit config

### Build
- [ ] `eas build --profile production --platform android` completes
- [ ] AAB (app bundle) artifact verified in Expo dashboard
- [ ] Internal testing track tested (10 internal testers)
- [ ] No crashes in internal testing

### Google Play Console Listing
- [ ] App name: "Lyte — AIOps Command"
- [ ] Short description (80 chars): "AIOps on-call companion for real-time incident management"
- [ ] Full description (4000 chars): written and reviewed
- [ ] App icon: 512×512 PNG (high-res icon)
- [ ] Feature graphic: 1024×500 PNG
- [ ] Category: Business
- [ ] Tags: aiops, monitoring, incidents

### Screenshots (Android)
- [ ] Phone screenshots: at least 2, up to 8 (recommended 1080×1920 or similar)
- [ ] 7" tablet: optional
- [ ] 10" tablet: optional

### Privacy & Policy
- [ ] Privacy policy URL live: https://lyte.ai/privacy
- [ ] Data safety section completed (what data is collected, shared, encrypted)
- [ ] Target audience: not primarily for children (18+)

### Rating
- [ ] Content rating questionnaire completed
- [ ] Expected rating: Everyone

### Release
- [ ] Roll out to Internal track first
- [ ] Promote to Closed Testing (Alpha) for beta users
- [ ] Promote to Open Testing (Beta) if applicable
- [ ] Production release: 20% staged rollout recommended for v1.0
- [ ] Monitor ANR rate and crash rate in Android Vitals (<1% target)

---

## Post-Submission Monitoring

- [ ] Check App Store Connect for review status daily
- [ ] Respond to any reviewer questions within 24 hours
- [ ] Monitor crash reports post-launch (target: <0.1% crash-free sessions)
- [ ] Set up App Store Connect notifications for reviews
- [ ] Plan first patch release (1.0.1) within 2 weeks for any post-launch issues
