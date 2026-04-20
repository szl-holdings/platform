# Demo Environment Checklist — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Demo operator preparing the demo tenant before a customer call
**Companion docs:** [DEMO_STRATEGY.md](demo-strategy.md) · [DEMO_GUIDE.md](demo-guide.md)

---

## Purpose

A demo fails when the environment is not ready. This document is the pre-demo checklist that every demo operator runs through before a customer call. It is a binary list — every item must be green.

---

## T–24 Hours: Environment Preparation

| Item | Owner | Done? |
|------|-------|-------|
| Demo tenant data refreshed (curated demo signals queued) | Demo operator | ☐ |
| AI agents pre-warmed against demo data | Demo operator | ☐ |
| Demo signals queued for each domain pack to be shown | Demo operator | ☐ |
| Proof Chain populated with at least 5 recent demo entries | Demo operator | ☐ |
| Outcome Graph entries showing acceptance / override mix | Demo operator | ☐ |
| At least one Covenant Policy `escalate` decision visible in queue | Demo operator | ☐ |
| Audit export tested end-to-end (download a sample) | Demo operator | ☐ |
| CORTEX device charged to ≥ 80% | Demo operator | ☐ |
| CORTEX signed in as the demo operator account | Demo operator | ☐ |
| CORTEX push notifications enabled and tested with a live notification | Demo operator | ☐ |
| Backup demo recording (≤ 30 days old) accessible offline | Demo operator | ☐ |

---

## T–60 Minutes: Pre-Flight

| Item | Owner | Done? |
|------|-------|-------|
| Restart all artifact workflows (clear stale state) | Demo operator | ☐ |
| Verify production demo URLs respond < 1s | Demo operator | ☐ |
| Verify CORTEX shows signed-in state | Demo operator | ☐ |
| Verify trust center loads | Demo operator | ☐ |
| Verify Known Gaps document loads | Demo operator | ☐ |
| Verify a test signal flows through Aegis end-to-end | Demo operator | ☐ |
| Verify CORTEX receives a test push notification | Demo operator | ☐ |
| Verify Proof Chain export downloads correctly | Demo operator | ☐ |
| Browser: clear cache, sign in fresh, verify no error banners | Demo operator | ☐ |
| Browser: pre-load all demo tabs in the order of the script | Demo operator | ☐ |
| Browser: zoom level set to 110% for legibility | Demo operator | ☐ |

---

## T–10 Minutes: Final Setup

| Item | Owner | Done? |
|------|-------|-------|
| Mute all desktop notifications | Demo operator | ☐ |
| Close email, Slack, calendar | Demo operator | ☐ |
| Turn on do-not-disturb on the laptop and phone | Demo operator | ☐ |
| CORTEX placed in landing position (visible to camera if iPad-on-stand) | Demo operator | ☐ |
| Recording on (with customer permission) | Demo operator | ☐ |
| Demo script open on a second device or paper | Demo operator | ☐ |
| Talking points for buyer's specific industry pinned | Demo operator | ☐ |
| Wifi signal strong; backup hotspot ready | Demo operator | ☐ |
| Backup demo recording URL ready to paste in chat | Demo operator | ☐ |

---

## Post-Demo Cleanup

| Item | Owner | Done? |
|------|-------|-------|
| Recording saved to the shared drive | Demo operator | ☐ |
| Demo notes added to CRM (what landed, what did not, follow-ups) | Demo operator | ☐ |
| Follow-up packet sent within 1 business day | Demo operator | ☐ |
| Trust Center URL sent (technical demo) | Demo operator | ☐ |
| Diligence packet sent (technical demo) | Demo operator | ☐ |
| Operator playbook excerpt sent (operator demo) | Demo operator | ☐ |
| Pricing reference sent if asked | Demo operator | ☐ |
| Demo tenant returned to baseline state | Demo operator | ☐ |
| AI agent override rate noted (catch any drift before next demo) | Demo operator | ☐ |

---

## Equipment Inventory

| Item | Status |
|------|--------|
| Primary laptop (charged, OS up to date) | Required |
| Secondary monitor or tablet for script | Recommended |
| iPad with CORTEX installed | Required for executive + operator demos |
| Mobile phone with CORTEX installed | Recommended (push redundancy) |
| Stylus or pointer for screen highlighting | Recommended |
| Headset (USB or Bluetooth, with mute) | Required |
| External camera | Recommended for board-level demos |
| Hotspot device | Required as wifi backup |

---

## Failure Recovery

| Failure | Action |
|---------|--------|
| Live demo environment unreachable mid-call | Switch to backup recording; commit to live re-demo within 48 hours |
| AI agent slow / unresponsive | Skip to a recorded segment; do not wait > 15 seconds in silence |
| CORTEX push notification fails | Open the app manually and show the queued approval |
| Audit export errors | Walk the Proof Chain UI instead; commit to follow-up with a sample export |
| Browser tab crashes | Take a brief water break; reopen the tab; resume |
| Customer's network blocks demo URL | Switch to recording; offer a re-run from their network on follow-up |

---

## Why This Checklist Exists

Demos that fail rarely fail because of the platform. They fail because the operator skipped one item on a pre-flight that did not exist in writing. This list exists in writing.

---

## Related Documents

| Document | Path |
|----------|------|
| Demo strategy | [DEMO_STRATEGY.md](demo-strategy.md) |
| Demo guide | [DEMO_GUIDE.md](demo-guide.md) |
| Executive demo | [EXECUTIVE_DEMO.md](executive-demo.md) |
| Operator demo | [OPERATOR_DEMO.md](operator-demo.md) |
| Technical demo | [TECHNICAL_DEMO.md](technical-demo.md) |
