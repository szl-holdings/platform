# ROSIE.UDS — Operator Quickstart

After `zarf package deploy rosie-uds-<version>.tar.zst --confirm`:

```bash
# 1. Smoke the kernel
node /opt/rosie/doctrine-demo.mjs

# 2. Re-verify the provenance manifest
sha256sum /opt/rosie/lib/index.mjs
# compare against the entry in /opt/rosie/MANIFEST.json

# 3. Wire your policy set
node -e "import('/opt/rosie/lib/index.mjs').then(({ admit, detectContradictions }) => {
  const policies = JSON.parse(require('fs').readFileSync('/etc/rosie/policies.json'));
  const c = detectContradictions(policies);
  if (c.length) { console.error('contradictions:', c); process.exit(1); }
  console.log('policies admitted:', policies.length);
});"
```

If `doctrine-demo.mjs` exits 0 and the chain prints `verifyChain = true`, the
kernel is healthy.
