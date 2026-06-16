# FORGE — FIX a11oy HF Space BUILD_ERROR (ROOT CAUSE FOUND: missing web/dns.html on Space)

DIAGNOSIS (verified by interactive session):
- a11oy Space build fails at a COPY layer. Root cause: `web/dns.html` is PRESENT on GitHub (blob eac8df5b, 7289 bytes, honest content) and the Dockerfile COPYs it (`COPY web/dns.html ./web/dns.html`, Dockerfile line 570), BUT the file is ABSENT from the SZLHOLDINGS/a11oy Space repo (resolve/main/web/dns.html = 404). Every sibling web/*.html (energy.html, materials.html, immune.html, sda.html) resolves 307 = present; only dns.html slipped through.
- WHY: hf-sync-backend.yml mirrors only .py; hf-sync.yml mirrors pages/*.html + console/*. The Dockerfile COPYs web/*.html, and web/dns.html (added by #475) was never mirrored to the Space. So the build COPY fails.
- The box a11oy.net is LIVE + current (HEAD 57a88617, all surfaces 200) — independent of the Space.

FIX (Forge has the authed HF write session the interactive agent lacks — direct commit to Space main is allowed for Forge, forbidden for the connector token):
1. Mirror web/dns.html (and AUDIT all other web/*.html the Dockerfile COPYs — verify each resolves 307 on the Space; mirror any that 404) from GitHub main to the SZLHOLDINGS/a11oy Space repo, byte-identical. Use the current GitHub blob (companion naming, NO jarvis codename).
2. ROOT-CAUSE (no bandaid): extend the GitHub hf-sync workflow so web/*.html in the Dockerfile COPY set is mirrored to the Space going forward (so this never recurs). OR confirm web/*.html should be image_only and instead ensure the Space's own copy is committed. Pick the path consistent with how energy.html/materials.html already get there.
3. Factory-rebuild: POST https://huggingface.co/api/spaces/SZLHOLDINGS/a11oy/restart?factory=true (Bearer $CUSTOM_CRED_HUGGINGFACE_CO_TOKEN). Poll runtime.stage to RUNNING.
PROVE: resolve/main/web/dns.html = 307 on Space; Space stage RUNNING; GET https://szlholdings-a11oy.hf.space/console = 200 and /dns + /materials + /immune reachable.

DOCTRINE: no code change to logic; honest content only; never fake RUNNING; recovery = healing, allowed near freeze.
