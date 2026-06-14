# SZL Forge — ORDER: wire killinchu custom domain to the live HF Space (the moment it's registered)

**Context (honest):** killinchu.com is NOT ours — it is parked by a third party at 93.90.186.45.
The real Killinchu app is LIVE on Hugging Face: https://szlholdings-killinchu.hf.space (healthz +
/elite/mesh = 200, BFT quorum mesh). The founder will REGISTER a domain (likely killinchu.app or
killinchu.ai — .com is taken). This order wires that domain to the HF Space WITH TLS the instant it
exists. Do NOT attempt to touch killinchu.com (not ours). Do NOT buy a domain (founder-only money).

## TRIGGER GUARD (run every pass — act only when the domain is real AND ours)
```bash
DOMAIN="${SZL_KILLINCHU_DOMAIN:-killinchu.app}"   # founder sets the real one in env/secret once bought
# only proceed if it resolves to OUR HF Space target (not the 93.90.186.45 squatter)
RES=$(python3 -c "import socket;print(socket.gethostbyname('$DOMAIN'))" 2>/dev/null || echo none)
echo "[$DOMAIN] resolves -> $RES"
case "$RES" in 93.90.186.45|none) echo "not ours / not registered yet -> REPORT and stop"; exit 0;; esac
```

## WIRE IT (when the guard passes)
HF Spaces support custom domains with automatic Let's Encrypt TLS. Two parts:
```bash
# 1) DNS at the registrar (founder adds this CNAME once; document it back in the report):
#    CNAME  killinchu.app  ->  szlholdings-killinchu.hf.space.
#    (apex .app/.ai may need ALIAS/ANAME or registrar flattening; www CNAME also.)
# 2) Register the domain on the Space via the HF API using the existing HF_WRITE_TOKEN secret:
python3 - <<'PY'
import os
from huggingface_hub import HfApi
api = HfApi(token=os.environ["HF_WRITE_TOKEN"])
dom = os.environ.get("SZL_KILLINCHU_DOMAIN","killinchu.app")
# add the custom domain to SZLHOLDINGS/killinchu (HF provisions TLS automatically)
try:
    api.add_space_domain(repo_id="SZLHOLDINGS/killinchu", domain=dom)   # current HF API
    print("requested custom domain:", dom)
except Exception as e:
    print("HF domain wire note:", e, "-- if API name differs, use the Space Settings -> Custom domain UI")
PY
# 3) verify end-to-end (TLS + app):
for u in "https://$DOMAIN/healthz" "https://$DOMAIN/elite/mesh"; do
  echo "$u -> $(curl -s -m15 -o /dev/null -w '%{http_code}' "$u")"
done   # want 200/200 with a valid cert
```

## SUCCESS GATE
`https://<domain>/healthz` = 200 over valid TLS, `/elite/mesh` = 200, cert issuer = Let's Encrypt.
Report the wired domain + cert status back to AUTO_STATE; notify founder.

## HARD RULES (Doctrine v11)
Never touch killinchu.com (not ours). Never buy a domain (founder-only). Never commit a key
(HF_WRITE_TOKEN stays a secret). Report honestly if the domain isn't registered yet — do NOT fabricate
a live domain. Clean-room only. Λ = Conjecture 1.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED
