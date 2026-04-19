VESSELS (@vessels_maritime) — X (TWITTER) LAUNCH KIT
=====================================================

Subaccount kit forked from the parent @szlholdings template. Same grammar,
Vessels-cyan accent, SZL affiliate badge baked into avatar, header and bio.

Quick start (plug-and-play):

 1. Open bio.md. Copy Name, Handle, Bio (use the Primary one), Location and
    Website into x.com/settings/profile for @vessels_maritime.
 2. Upload avatar-400x400.png as your profile picture.
 3. Upload header-1500x500.png as your header image. header-variants/*
    has editorial + saturated alts.
 4. Open content-calendar.md. Schedule the 5 posts at the listed times.
 5. Attach the matching file from screenshots/ to each post.
 6. Pin Post 1 immediately after publishing on Tuesday.
 7. Open cross-promote-plan.md and fire the @szlholdings quote-repost
    within 60 minutes of post #1 — establishes the affiliate badge.
 8. Reference profile-mockup-{desktop,mobile}.png to preview the profile.
 9. poster/ has the API runner. See poster/README.md.

Folder layout:

  avatar-400x400.png            ← profile picture
  header-1500x500.png           ← primary header banner
  header-variants/              ← editorial + saturated alts
  profile-mockup-desktop.png    ← preview of finished profile (desktop)
  profile-mockup-mobile.png     ← preview of finished profile (mobile)
  bio.md                        ← all profile fields + pinned tweet copy
  content-calendar.md           ← 5-post calendar (Tue/Thu/Fri/Mon/Wed)
  cross-promote-plan.md         ← parent ↔ sub cadence
  screenshots/                  ← product captures (16:9 and 1:1 crops)
  poster/                       ← X API posting script + instructions
  build_kit.py                  ← regenerates all images
  README.txt                    ← this file

Raw screenshots are read from ../szl-x-launch-kit/screenshots/raw/.
