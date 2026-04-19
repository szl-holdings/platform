AEGIS (@aegis_soc) — X (TWITTER) LAUNCH KIT
============================================

Subaccount kit forked from the parent @szlholdings template. Same grammar,
Aegis-amber accent, with the SZL affiliate badge baked into the avatar,
header and bio so the parent ↔ sub relationship is always legible.

Quick start (plug-and-play):

 1. Open bio.md. Copy Name, Handle, Bio (use the Primary one), Location and
    Website straight into x.com/settings/profile for @aegis_soc.
 2. Upload avatar-400x400.png as your profile picture.
 3. Upload header-1500x500.png as your header image. Try
    header-variants/* if you want a different tone (editorial or
    saturated).
 4. Open content-calendar.md. Schedule the 5 posts at the listed times.
 5. Attach the matching file from screenshots/ to each post (the calendar
    names the exact file).
 6. Pin Post 1 immediately after publishing on Tuesday.
 7. Open cross-promote-plan.md and confirm the @szlholdings quote-repost
    fires within 60 minutes of post #1 — that's what establishes the
    affiliate badge publicly.
 8. Reference profile-mockup-desktop.png / profile-mockup-mobile.png to
    preview the assembled profile.
 9. poster/ contains a ready-to-run Python script for direct API posting.
    See poster/README.md.

Folder layout:

  avatar-400x400.png            ← profile picture
  header-1500x500.png           ← primary header banner
  header-variants/              ← editorial + saturated alts
  profile-mockup-desktop.png    ← preview of finished profile (desktop)
  profile-mockup-mobile.png     ← preview of finished profile (mobile)
  bio.md                        ← all profile fields + pinned tweet copy
  content-calendar.md           ← 5-post calendar (Tue/Thu/Fri/Mon/Wed)
  cross-promote-plan.md         ← parent ↔ sub cadence (one each direction/wk)
  screenshots/                  ← product captures (16:9 and 1:1 crops)
  poster/                       ← X API posting script + instructions
  build_kit.py                  ← regenerates all images (re-uses parent raws)
  README.txt                    ← this file

Raw screenshots are read from ../szl-x-launch-kit/screenshots/raw/ so the
parent kit must remain in place for build_kit.py to regenerate images.
