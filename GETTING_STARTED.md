# Getting Started — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** New users, design partners, enterprise evaluators

This guide covers everything you need to start using the SZL Holdings governed decision platform. From first login through your first governed workflow, you will be operational in under 30 minutes.

---

## Before You Begin

You will need:
- An invitation email from your organization admin or from SZL Holdings
- A modern browser (Chrome, Firefox, Safari, or Edge — latest version)
- Credentials from your identity provider (if your organization uses SSO)

---

## Step 1 — Sign In

1. Navigate to your assigned platform URL (e.g., `https://szlholdings.com` or your organization's dedicated domain)
2. Click **Sign In**
3. Authenticate via your identity provider (OIDC/SSO) or the default auth screen
4. On first login, you will be prompted to confirm your organization and role assignment

**Note:** If you do not see your expected domain packs after login, contact your organization administrator. Your role determines which surfaces are visible.

---

## Step 2 — Understand Your Starting Surface

After login, you arrive at your primary command surface based on your role:

| Your role | Starting surface | Path |
|---|---|---|
| Executive / Platform admin | Lyte Command — Signal feed + PRISM dashboard | `/command/operations` |
| Security operator | Aegis SOC Command | `/aegis/` |
| Maritime operator | Vessels Fleet Command | `/vessels/` |
| Real estate operator | Terra Dashboard | `/terra/` |
| Advisory client | Carlota Jo portal | `/carlota-jo/` |
| Mobile user | CORTEX app (iOS/Android) | — |

The **Command Portal** at `/command/operations` is the unified cross-domain command surface. Use it to see signals across all domain packs in one view.

---

## Step 3 — Navigate the Governed Decision Loop

Every significant action on the platform follows the same nine-step loop:

1. **Signal** — A business event is detected and surfaced
2. **Context** — Cross-domain intelligence enriches the signal
3. **Recommendation** — AI proposes an action with evidence and confidence score
4. **Simulation** — Monte Carlo models the risk of acting vs. not acting
5. **Policy** — Covenant Policy checks whether the action is authorized
6. **Approval** — The required human approvers are notified and confirm
7. **Execution** — The action runs as a tracked, durable workflow
8. **Proof** — An immutable Proof Chain record is sealed
9. **Outcome** — The actual result is recorded and compared to the prediction

You do not need to understand all nine steps on day one. Your primary interaction will typically be: **receive a recommendation → review the simulation → approve or reject**.

---

## Step 4 — Complete Your First Workflow

### For operators (Lyte):
1. Open the **Signal Feed** — you will see incoming signals ranked by priority
2. Click any signal to open its full context and recommendation
3. Review the **Simulation** panel — understand the risk of acting vs. waiting
4. Click **Approve** or **Reject** to record your decision
5. Watch the **Proof Chain** update with your decision attribution

### For security operators (Aegis):
1. Open the **Threat Feed** — active alerts ranked by severity
2. Select a threat to open the full incident view
3. Review the **SOAR Playbook** recommendations
4. Approve or escalate
5. Check the **Investigations Board** for open cases

### For maritime operators (Vessels):
1. Open the **Fleet Map** — live vessel positions via AIS
2. Select a vessel to open its detail view
3. Review alerts (ETA risk, sanctions flags, dark vessel detection)
4. Take action via the exception-based workflow
5. Check **Voyage P&L** for economic tracking

### For real estate operators (Terra):
1. Open the **Distress Pipeline** — NYC properties at risk
2. Select a property for full detail and AI underwriting
3. Review ownership graph and deal history
4. Track or advance deals through the deal workflow

---

## Step 5 — Set Up Notifications

1. Navigate to **Settings → Notifications**
2. Configure your preferred channels (in-app, email, mobile push via CORTEX)
3. Set notification rules by signal severity and domain pack
4. Confirm CORTEX mobile is installed if you need on-the-go command access

---

## Mobile Access — CORTEX

CORTEX is the unified mobile command layer for iOS and Android. Download it from:
- **iOS:** App Store — search "CORTEX SZL"
- **Android:** Google Play — search "CORTEX SZL"

CORTEX gives you:
- All domain workspaces in one app
- Biometric authentication
- Cross-domain badge counts and unified command feed
- Workspace-adaptive AI copilot
- Push notifications for critical signals

---

## Next Steps

| I want to... | Go to |
|---|---|
| Set up my organization | [ADMIN_SETUP_GUIDE.md](ADMIN_SETUP_GUIDE.md) |
| Understand all features | [FEATURE_OVERVIEW.md](FEATURE_OVERVIEW.md) |
| Learn daily operator workflows | [OPERATOR_GUIDE.md](OPERATOR_GUIDE.md) |
| Troubleshoot an issue | [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) |

---

## Getting Help

- **Help Center:** /help
- **Contact:** /contact
- **Email:** support@szlholdings.com
