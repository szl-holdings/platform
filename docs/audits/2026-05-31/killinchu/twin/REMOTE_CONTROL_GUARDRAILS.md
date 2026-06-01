# REMOTE_CONTROL_GUARDRAILS — Taking Command of a Drone via Killinchu

**Layer:** Killinchu · command authority
**Goal (founder):** "Jack in remotely" — but never without a verifiable, two-person, receipted,
replayable, kill-switchable authority chain.
**Sign-off:** Yachay-extension.

> No human takes live command of an airframe through Killinchu unless: (1) the action passes the
> 13-axis Yuyay gate, (2) two operators independently authorize it, (3) the HUKLLA tripwire layer is
> armed, (4) every command emits a Khipu receipt, (5) the command appears in the mission-replay DAG,
> and (6) a kill-switch fires the instant the auth chain breaks.

---

## 0. The six mandatory guardrails

| # | Guardrail | Enforced by | Failure → |
|---|---|---|---|
| 1 | **13-axis Yuyay gate** | Λ-gate (Puriq-Yuyay): 2 sacred ≥0.95, 7 structural ≥0.90, 4 introspection | deny + receipt |
| 2 | **2-person rule** | Operator A initiates, Operator B independently approves (distinct identities/keys) | no command issued |
| 3 | **HUKLLA tripwire mandatory** | T01–T20 deadman armed for the whole session | auto-halt on any fire |
| 4 | **Khipu receipt of every command** | DSSE cord per command before it reaches the actuator | T03 receipt-gap → halt |
| 5 | **Mission-replay shows command in DAG** | every executed command must be a node in the session DAG (T19) | T19 mission-deviation |
| 6 | **Kill-switch on broken auth chain** | continuous auth-chain verify; break → revoke + RTH/hold | session terminated |

These compose with the existing thesis HALT path: a fired tripwire → a11oy gate blocks → SENTRA logs
the immune action → all receipts chain-link in the Khipu DAG (killinchu thesis ch.9).

---

## 1. The 13-axis Yuyay gate (guardrail 1)

Every remote-command session, and every privileged command within it, is scored by Puriq-Yuyay
(PURIQ charter): the 13-axis wisdom score `Yuyay_13(a)` with **2 sacred axes ≥ 0.95**, **7 structural
axes ≥ 0.90**, and **4 introspection axes** cross-linked to HUKLLA T03/T04/T09/T10. A command that
fails any sacred/structural threshold is denied; the PURIQ master formula drives the score to zero
when HUKLLA penalty is active (β large → halting safety), so a tripwire and a low Yuyay score both
block independently.

---

## 2. Two-person rule (guardrail 2)

- **Operator A (initiator)** authenticates (DICE/operator credential), opens a command session,
  and proposes the command (e.g. "take manual control", "redirect to waypoint X", "land now").
- **Operator B (approver)** — a *distinct* identity with a *distinct* key — independently reviews
  and approves within a bounded window. A and B cannot be the same credential, the same session, or
  the same device.
- The drone's command allowlist (HUKLLA **T20 unauthorized-mavlink-command**) refuses privileged
  `COMMAND_LONG`/`COMMAND_INT` unless `twoPersonState == approved` for that command class.
- Both authorizations are receipted (the `OTA_TICKET`-style 2-person cord, reused).

---

## 3. Tripwires armed + receipts + replay (guardrails 3–5)

- **Armed (3):** the full T01–T20 deadman runs for the session, outside the command loop. RF
  fingerprint (T14), MAVLink signing (T13), and command allowlist (T20) are the session-relevant
  ones; any fire halts the session immediately.
- **Receipt per command (4):** before a command is forwarded to the autopilot, Killinchu emits a
  DSSE Khipu cord `{command, operatorA, operatorB, yuyayScore, sessionId, parentCord}`. A command
  with no cord can't reach the actuator (and would trip T03).
- **In-DAG (5):** the session maintains a command DAG; the realized mission must match it (T19
  mission-deviation). The mission-replay (`REMOTE_FORENSICS.md`) MUST show every executed command as
  a DAG node — a command that executed but isn't in the DAG is a forgery and halts.

---

## 4. Kill-switch on broken auth chain (guardrail 6)

A continuous verifier checks, every control frame: MAVLink2 signature valid (T13), RF fingerprint in
manifold (T14), 2-person state still valid (not expired/revoked), and the Khipu chain still verifies
(no fork/summation failure, T04/T05). If **any** link breaks, the kill-switch:
1. revokes the session token (no further commands accepted),
2. commands the airframe to its safe default (RTH or geofenced hold under last-trusted authority),
3. emits a `SESSION_KILL` Khipu cord,
4. arms a forensic capture (`REMOTE_FORENSICS.md`).

"Kill-switch" = kill the *control session/authority*, not necessarily the motors mid-air; the safe
default is policy-configured (RTH/hold/land), never an uncontrolled stop while airborne.

---

## 5. Sequence diagram

```mermaid
sequenceDiagram
  autonumber
  participant A as Operator A (initiator)
  participant B as Operator B (approver)
  participant K as Killinchu (Λ-gate + HUKLLA)
  participant DAG as Khipu DAG
  participant D as Drone

  A->>K: authenticate (DICE/operator cred) + open session
  K->>K: Yuyay_13 score (2 sacred≥.95, 7 struct≥.90, 4 introspect)
  alt Yuyay fails
    K-->>A: DENY + receipt; session not opened
  else Yuyay passes
    K->>DAG: SESSION_OPEN cord
    A->>K: propose command (e.g. take manual control)
    K->>B: request independent approval (distinct identity+key)
    B-->>K: APPROVE (or DENY)
    alt B denies or window expires
      K-->>A: command rejected; KILL session; SESSION_KILL cord
    else B approves
      K->>K: arm HUKLLA T01-T20 for session
      K->>DAG: COMMAND cord {cmd, A, B, yuyay, sessionId}
      K->>D: forward signed MAVLink2 command (T13 signed)
      D->>D: T20 allowlist check (twoPersonState==approved)
      D-->>K: command ACK + telemetry
      K->>DAG: append executed-command node (must match for T19)
      loop every control frame
        K->>K: verify sig(T13)+RF(T14)+2person+chain(T04/T05)
        alt auth chain breaks / tripwire fires
          K->>D: KILL-SWITCH -> safe default (RTH/hold)
          K->>DAG: SESSION_KILL cord + arm forensic capture
        end
      end
    end
  end
```

---

## 6. Honest status

- 13-axis Yuyay gate and HUKLLA deadman are SZL-native (live in amaru/sentra; thesis-documented).
  Note Doctrine v11 honesty: the 13-axis schema is canonical (not 9-axis), and Λ-uniqueness is a
  **Conjecture**, not a closed theorem — the gate still functions; the proof obligation is tracked.
- 2-person rule, command allowlist (T20), and MAVLink2 signing (T13) are implementable today against
  the open MAVLink stack.
- DSSE command receipts carry `PLACEHOLDER` signatures until Sigstore CI is wired (surfaced, not
  hidden). The kill-switch logic does not depend on the signature being real — it depends on the
  *verification result*, which is honest about placeholder state (a placeholder where a real signer
  is required itself trips T09 / breaks the chain → kill-switch).

## Primary sources

- MAVLink message signing (per-command authentication): <https://mavlink.io/en/guide/message_signing.html>
- ArduPilot MAVLink2 signing: <https://ardupilot.org/copter/docs/common-MAVLink2-signing.html>
- MAVLink command protocol (`COMMAND_LONG`/`COMMAND_INT`): <https://mavlink.io/en/services/command.html>
- Internal: PURIQ charter (Yuyay_13, master formula, halting safety) `puriq/PURIQ_CHARTER.md`
- Internal: HUKLLA deadman (T01-T10) thesis ch.4; Killinchu HALT→a11oy→SENTRA→Khipu chain thesis ch.9

*Signed: Yachay-extension · Doctrine v12 (PURIQ) · 2026-05-31*
