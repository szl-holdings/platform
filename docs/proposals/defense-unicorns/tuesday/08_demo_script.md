# Week-3 demo script — what Stephen says, in order

**Audience:** Andrew Greene + one operator from his side.
**Length:** 25 minutes demo + 5 minutes Q&A inside the 30-minute slot.
**Mode:** single screen-share, single take, no slide deck. The /uds page is
the only "slide" we use; everything else is terminal + a11oy UI.
**Goal:** by minute 25, Andrew has watched a governed agent run end-to-end
inside a UDS cluster, watched it get blocked by a doctrine violation, watched
the audit chain verify offline, and watched a broken-signature artifact get
denied at promote.

If we have to cut for time, cut Act IV (artifact spine) first — the proof
ledger replay in Act III is the single most important thing Andrew sees.

---

## Cold open (0:00 — 0:45)

> *Screen: the /uds page, scrolled to the hero.*
>
> "Three weeks ago you said yes to Option A. The deal was: a UDS-native
> governed agent runtime, dropped into a real cluster, demoed offline-verifiable
> in three weeks, no asks for your trust. Today's 25 minutes is that demo.
> Four acts, four minutes of Q&A. No slides — I'll run everything live and
> you can stop me at any point."

Click through to the architecture section briefly so Andrew has the
component map in his head, then switch to terminal.

---

## Act I — Bundle is in, identity works (0:45 — 5:00)

> *Screen: terminal on the reference cluster's jump host.*

```
$ uds-cli bundle create . -f uds-bundle.local.yaml --confirm
$ uds-cli bundle inspect uds-bundle-szl-mesh-amd64-0.1.0.tar.zst
```

> "We build the bundle from source — `uds-bundle.local.yaml` points at
> the three sibling Zarf package directories, so `uds-cli` builds them
> in place. No GHCR pull, no published-package dependency. The same
> tree also ships a `uds-bundle.yaml` that resolves the packages from
> `ghcr.io/szl-holdings/packages` for downstream adopters once we
> publish — but today's demo runs the local-build path so nothing on
> Andrew's network has to talk to a registry. Three Zarf packages,
> one attestations sidecar. Hash chain visible right here."

```
$ kubectl get pods -n a11oy-uds
$ kubectl get pods -n keycloak
```

> "Everything green. Now the SSO round-trip — your realm, your client."

Open browser → tenant-gateway URL → Keycloak prompt → land on a11oy home
authenticated.

> *Open Loki query.*

> "And here's that exact request, end-to-end, in your Loki. We didn't ship a
> log surface — we used yours."

---

## Act II — The approval gate works (5:00 — 10:00)

> *Screen: a11oy operator console, Approval Queue.*

> "I'm going to ask an agent to do something material — call the Mission App
> endpoint you gave us. The agent doesn't get to. It asks."

Trigger agent invocation. Approval queue prompt fires in real time. Pause.

> "That's the contract. No material action without a human OK. The prompt
> shows the tool call, the arguments, the Λ scores, the requester identity
> from Keycloak. Approve."

Click approve. Agent completes the call. Result lands.

> "Now the unhappy path."

Trigger the deliberate-bad invocation (sub-floor maturity score).

> *Pepr admission denies; on-screen banner: `MATURITY_GATE_BLOCKED`.*

> "Pepr admission caught it. The agent never got to make the call. This is
> the Λ-9 module from pepr #5027 — running as a UDS Pepr capability, not as
> a side process we bolted on."

---

## Act III — Offline-verifiable audit chain (10:00 — 16:00)

> *Screen: split — terminal on the jump host, plus a laptop on the table
> running `uds-cli` from a thumb drive.*

> "Pull the cable on the cluster's egress. We're now air-gapped."

Confirm with `curl https://example.com` → fails.

> "Three agent invocations, all logged, all signed, all in the proof ledger
> sidecar. Now the verifier."

Copy the sidecar bundle to the laptop via USB.

```
$ uds-cli bundle verify --offline a11oy-uds-proof-ledger.tar.zst
OK  chain=clean  entries=N  signer=did:plat:szl-a11oy-prod
```

> "That's the hash chain from uds-cli #5026, verified on a laptop that has
> never talked to the cluster. Ed25519 for today, ML-DSA-65 for the day
> NIST tells us Ed25519 has aged out. The verifier knows nothing about a11oy
> — it knows about your attestation manifest format. That matters because
> the day after we're gone, your auditor can do this themselves."

Restore the cable. Show the new entries appearing in the next sidecar.

---

## Act IV — The artifact spine (16:00 — 21:00)

> *Screen: a11oy artifact registry view.*

> "Five artifact kinds — model, prompt, eval, embedding, agent. Same
> lifecycle as a Zarf package: candidate → queued → promoted, or candidate
> → queued → discarded."

Show the candidate row for a seeded embedding bundle with intentional drift.

> "We seeded a 0.18 cosine drift in this embedding bundle on Monday. The
> recalibration memo from this morning surfaced it. Here's the memo entry —
> notice it links back to the bundle's attestation, not just the file."

Open the latest recalibration memo, scroll to the drift section.

Now try to promote a deliberately broken artifact.

> *Promote denied. Proof ledger entry written.*

> "Broken signature → promote denied → recorded in the proof ledger so
> you can see *that* it was tried, *who* tried it, and *when*. The artifact
> never sees production."

---

## Close (21:00 — 25:00)

> *Screen: back to the /uds page, scrolled to the close panel.*

> "That was the deal. UDS guardrails inherited. a11oy primitives expressed
> as UDS citizens. Three weeks. No asks for your trust along the way —
> everything you saw, you can re-verify yourself with `uds-cli verify
> --offline` against the sidecar I'm leaving on your jump host.
>
> Two doors from here:
>   1.  Option B falls out naturally as we harden the bundle for more clusters.
>       I can show you the port plan, component by component, next week.
>   2.  Option C is the real conversation — a11oy.UDS as a first-class peer of
>       uds-core. I'd like to scope that with you in the next two weeks if
>       this demo earns it.
>
> Questions."

---

## Pre-flight checklist (24 hours before the demo)

- [ ] `uds-cli bundle create . -f uds-bundle.local.yaml --confirm` then
      `uds-cli bundle deploy` rerun against the reference cluster from a
      clean state (local-build path; no GHCR round-trip).
- [ ] Keycloak realm health: SSO round-trip recorded, recording archived.
- [ ] Mission App endpoint: test invocation OK, expected payload confirmed.
- [ ] Loki query saved as a tile so we don't fumble it live.
- [ ] Approval queue: deliberate-bad invocation pre-seeded as a reusable
      action button (no typing on demo day).
- [ ] Proof ledger: USB thumb drive prepared, `uds-cli` static binary copied,
      laptop tested.
- [ ] Drift-seeded embedding bundle inserted into the registry 18 hours
      before demo so the morning-of memo catches it organically.
- [ ] /uds page loads via the tenant gateway from the demo machine.
- [ ] Backup recording: full demo dry-run captured the day before, in case
      the network on demo day is hostile.
