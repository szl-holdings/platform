SZL HOLDINGS — X (TWITTER) LAUNCH KIT
======================================

Quick start (plug-and-play):

 1. Open bio.md. Copy Name, Handle, Bio (use the Primary one), Location,
    Website straight into x.com/settings/profile.
 2. Upload avatar-400x400.png as your profile picture.
 3. Upload header-1500x500.png as your header image.
    (Try header-variants/* if you want to A/B a different tone.)
 4. Open content-calendar.md. Schedule the 9 posts at the times listed
    in your scheduler of choice (Typefully, Hypefury, Buffer, or native
    X scheduling — whichever you use).
 5. Attach the matching file from screenshots/ to each post. The calendar
    names the exact file per post.
 6. Pin Post 1 immediately after publishing on Thursday.
 7. Block 30 min after each post for the reply ladder (see calendar).
 8. Reference profile-mockup-desktop.png / profile-mockup-mobile.png
    to preview how the assembled profile will look before you save it.
 9. inspiration-research.md has the "why" behind every choice — skim it
    if you want to tweak copy.
10. poster/ contains a ready-to-run Python script that posts the 9 posts
    directly to X once you add your API keys. See poster/README.md.

Folder layout:

  avatar-400x400.png           ← profile picture
  header-1500x500.png          ← primary header banner
  header-variants/             ← 3 alternate header concepts
  profile-mockup-desktop.png   ← preview of finished profile (desktop)
  profile-mockup-mobile.png    ← preview of finished profile (mobile)
  bio.md                       ← all profile fields + pinned tweet copy
  content-calendar.md          ← 9-post calendar (Thu/Sun/Mon × 3)
  inspiration-research.md      ← 2026 best practice + takeaways
  screenshots/                 ← product captures (16:9 and 1:1 crops)
    raw/                       ← full-size source captures (reference)
  poster/                      ← X API posting script + instructions
  build_kit.py                 ← regenerates all images (for tweaks)
  README.txt                   ← this file
