-- Pulse: seed one representative published briefing so the app is not empty on first boot.
-- Uses ON CONFLICT DO NOTHING so re-runs are safe.

INSERT INTO pulse_briefings (
  id,
  date,
  edition,
  classification,
  status,
  overall_risk,
  overall_confidence,
  headline,
  lead_sentence,
  domains,
  sections,
  recommended_actions,
  generated_at,
  created_at
)
VALUES (
  'brief-seed-2026-04-26',
  '2026-04-26',
  'Morning Edition · Vol. 848',
  'SZL-EXEC-RESTRICTED',
  'published',
  'MEDIUM',
  0.82,
  'All monitored domains report stable or improving conditions; no critical signals require immediate executive action',
  'Eight monitored domains across the SZL portfolio are operating within normal parameters. Routine monitoring continues across maritime, security, real estate, legal, financial, and platform domains.',
  '["maritime","security","real_estate","legal","financial","platform","executive"]',
  '[
    {
      "id": "exec-summary",
      "title": "Executive Summary",
      "agentId": "alloy",
      "confidence": 0.82,
      "confidenceLabel": "HIGH",
      "riskLevel": "MEDIUM",
      "keyJudgment": "SZL Holdings operates from a position of structural resilience with no critical signals requiring immediate intervention.",
      "narrative": [
        "All eight monitored domains are reporting stable or improving conditions as of this morning. No critical signals or decision-grade items require immediate executive attention.",
        "The platform continues to operate at HIGH confidence (0.82) across all domains. Routine monitoring, compliance tracking, and portfolio management activities are proceeding on schedule.",
        "This briefing represents baseline operational status. No immediate escalations are required."
      ],
      "keyFindings": [
        {"finding": "All domains operating within normal parameters", "severity": "LOW"},
        {"finding": "Portfolio NAV stable — no material changes since last briefing", "severity": "LOW"},
        {"finding": "No active security incidents or maritime risk events", "severity": "LOW"}
      ],
      "assumptions": [
        "AIS coverage is nominal across all tracked vessels",
        "No pending regulatory deadlines within 48 hours"
      ],
      "gaps": [],
      "lastUpdated": "2026-04-26T05:30:00Z"
    },
    {
      "id": "maritime",
      "title": "Maritime Outlook",
      "agentId": "helmsman",
      "confidence": 0.88,
      "confidenceLabel": "HIGH",
      "riskLevel": "LOW",
      "keyJudgment": "Fleet is operating nominally across all tracked corridors with no active threat events.",
      "narrative": [
        "All SZL-tracked vessels are reporting nominal AIS status. No vessels are AIS-dark or operating in elevated-risk corridors.",
        "Fleet insurer (Skuld) has not issued any additional premium notices. P&I exposure remains within budgeted parameters."
      ],
      "keyFindings": [
        {"finding": "All vessels reporting nominal AIS status", "severity": "LOW"},
        {"finding": "No active threat events in tracked corridors", "severity": "LOW"}
      ],
      "assumptions": ["AIS coverage is complete and uninterrupted"],
      "gaps": [],
      "lastUpdated": "2026-04-26T05:15:00Z"
    },
    {
      "id": "security",
      "title": "Threat Landscape",
      "agentId": "sentinel",
      "confidence": 0.85,
      "confidenceLabel": "HIGH",
      "riskLevel": "LOW",
      "keyJudgment": "Platform attack surface is contained; no active intrusion attempts or security incidents detected.",
      "narrative": [
        "No security incidents, phishing campaigns, or anomalous access patterns were detected in the past 24 hours.",
        "All outstanding CVEs rated CVSS ≥8.0 have been patched in the latest maintenance window."
      ],
      "keyFindings": [
        {"finding": "No active security incidents in past 24 hours", "severity": "LOW"},
        {"finding": "All critical CVEs patched", "severity": "LOW"}
      ],
      "assumptions": ["DLP and EDR coverage is complete"],
      "gaps": [],
      "lastUpdated": "2026-04-26T04:55:00Z"
    }
  ]',
  '[]',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
