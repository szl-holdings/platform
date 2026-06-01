# TAMPER_HACK_DETECTION — HUKLLA T11–T20 (Air-Domain Deadman Tripwires)

**Layer:** Killinchu · immune/halt authority extension
**Doctrine:** v12 (PURIQ). Extends HUKLLA T01–T10 (thesis ch.4) with ten air-domain tripwires.
**Principle (carried from HUKLLA):** *a governance gate that can be argued out of halting is not a*
*halt authority.* Each tripwire is an independent deadman monitor evaluated **outside the agent's**
**policy loop**; firing forces a halt-or-quarantine and emits a Khipu receipt.
**Sign-off:** Yachay-extension.

> HUKLLA deadman verdict (extended):
> Halt(s) ⇔ ⋁_{j=1}^{20} T_j(s). T01–T10 are the existing software tripwires (gate-bypass,
> sacred-breach, receipt-gap, dag-fork, summation-fail, budget-breach, entropy-cap,
> directive-reversal, signer-absent, log-deletion). **T11–T20 below are the drone hardware/RF/firmware tripwires.**

---

## 0. Common detection contract

Every tripwire `T11..T20` implements:

```ts
interface Tripwire {
  id: `T${11|..|20}`;
  signal: TamperSignal;
  evaluate(s: RuntimeState): Detection;     // pure predicate over telemetry + attestation state
}
interface Detection {
  fired: boolean;
  confidence: number;        // 0..1
  severity: 'info'|'warn'|'halt';
  evidence: object;          // the raw features that fired it (for the receipt)
}
```

- **Two-stage gate:** `warn` arms the flag in the twin (amber arrow in the 3D viewer); `halt` forces
  the deadman. Severity escalation requires a `confidence` threshold AND a corroborating second
  signal where noted (defence-in-depth, reduces false halts).
- **Every detection emits a Khipu receipt** (DSSE envelope; `PLACEHOLDER` signature where Sigstore
  CI not yet wired — honest, per Doctrine v11). A fired tripwire with no receipt would itself trip
  the existing **T03 (receipt-gap)**.
- **False-positive estimates** below are engineering targets for the production detector, expressed
  as expected false alarms per flight-hour (FA/h) at the stated `halt` threshold, and are honestly
  labelled as targets pending field calibration — NOT measured field rates.

---

## T11 — secure-boot / DICE attestation failure

**What it catches:** the running firmware's measured boot chain does not match the expected TCB —
i.e. an attacker flashed unsigned/modified firmware, or the secure boot chain was bypassed.

**Algorithm:**
1. At boot and on demand, the device produces a DICE attestation: the per-boot **Alias key** is
   derived from the **CDI**, which is a one-way function of the **UDS** + the **TCI** (measurement)
   of each layer ([TCG DICE Layering Architecture r19](https://trustedcomputinggroup.org/wp-content/uploads/DICE-Layering-Architecture-r19_pub.pdf)).
2. Killinchu holds the expected `tciChain` (golden measurements) for the drone's `model`+`version`.
3. The device signs a nonce-challenged attestation evidence blob with the Alias key; Killinchu
   verifies the X.509 attestation cert chain
   ([TCG DICE Attestation Architecture](https://trustedcomputinggroup.org/resource/dice-attestation-architecture/))
   and compares the reported TCIs to golden. ArduPilot enforces the device side: "only firmware
   signed with one of the public-private key pairs will run on the autopilot"
   ([ArduPilot Secure Firmware](https://ardupilot.org/dev/docs/secure-firmware.html)).
4. Mismatch (or absent/placeholder attestation in a context requiring a real signer) → fire.

**FP estimate:** ~0 FA/h once golden TCIs are pinned (deterministic compare). Practical false
positive source = un-enrolled legitimate firmware upgrade → mitigated by updating golden on every
SECURE_OTA completion. Target **< 1e-4 FA/h**.
**Severity:** `halt` (this is the strongest tripwire; cross-links to existing **T09 signer-absent**).

**Khipu receipt schema:**
```json
{ "predicateType": "https://szlholdings.dev/killinchu/attestation/v1",
  "subjectHash": "<aliasKeyPub digest>",
  "evidence": { "expectedTci": ["…"], "reportedTci": ["…"], "nonce": "…",
                "certChainValid": false, "firstMismatchLayer": 1 },
  "verdict": "HALT", "tripwire": "T11" }
```
**Recovery:** quarantine → force boot from inactive A/B slot (last attested-good) → if both slots
fail, ground the airframe and require physical re-provisioning (RTRec, NIST SP 800-193 §recovery).

---

## T12 — firmware-Merkle mismatch vs Khipu

**What it catches:** in-flight or at-rest modification of firmware/config that secure boot alone
wouldn't catch (e.g. a writable partition, a tampered parameter file, an injected module).

**Algorithm:** the firmware image and critical config are represented as a **Merkle tree**; the root
is anchored in the Khipu DAG at OTA time (the `firmware.signedHash` cord). Periodically and on demand
the device recomputes leaf hashes (or a sampled subset) and the Merkle root; Killinchu compares
against the anchored root. Any divergent leaf path is reported. This is the firmware analogue of the
existing **T05 summation-fail** (a Khipu cord ≠ sum of its pendants).

**FP estimate:** deterministic hash compare → **< 1e-4 FA/h**; only source is a benign config write
that wasn't re-anchored → fixed by re-anchoring on every authorized param change (emits a cord).
**Severity:** `halt` if the mismatch is in executable/bootable regions; `warn` if in non-safety config.

**Receipt:** `{ "tripwire":"T12", "evidence": { "anchoredRoot":"…", "computedRoot":"…",
"divergentLeafPath":["region/3/param/EK3_*"] }, "verdict":"HALT" }`
**Recovery:** re-flash the affected region from the signed image (RTU), re-attest (T11), re-anchor a
fresh Merkle root cord. If executable region: ground until re-provisioned.

---

## T13 — MAVLink anomaly (rate / sequence / signing-failure)

**What it catches:** injected, replayed, or spoofed MAVLink traffic — a hijack attempt over the
command/telemetry link.

**Algorithm — three sub-detectors, OR-combined:**
1. **Rate:** per-message-ID arrival rate vs expected stream rate (HEARTBEAT ~1 Hz, ATTITUDE(30) at
   configured rate, etc.). EWMA + Poisson upper control limit; a flood/starvation fires.
2. **Sequence:** MAVLink frame `seq` byte must increment monotonically per (sysid, compid). Gaps or
   resets beyond link-loss tolerance indicate injection from a second source.
3. **Signing:** MAVLink 2 message signing — the 48-bit signature is the first 48 bits of a SHA-256
   hash of the packet (incl. timestamp) appended to a shared 32-byte secret key, and a packet with a
   timestamp >1 minute (6,000,000 ticks) behind local is rejected
   ([MAVLink Message Signing](https://mavlink.io/en/guide/message_signing.html);
   [ArduPilot MAVLink2 Signing](https://ardupilot.org/copter/docs/common-MAVLink2-signing.html)).
   A signing failure or stale timestamp on a link configured for signing fires immediately.

**FP estimate:** rate/sequence sub-detectors are the noisy ones (legitimate link loss, congestion) →
tuned to **~0.05–0.2 FA/h** at `warn`; signing-failure sub-detector is near-deterministic
**< 1e-3 FA/h** at `halt`. Escalate to `halt` only on signing-failure OR (rate+sequence both firing).
**Severity:** `warn` (rate/seq alone) → `halt` (signing failure, or corroborated).

**Receipt:** `{ "tripwire":"T13", "evidence": { "subdetector":"signing", "msgId":76,
"sysid":255, "expectedSeq":41, "gotSeq":3, "sigValid":false, "tsSkewTicks":7_200_000 } }`
**Recovery:** drop the offending session, rotate the MAVLink signing key over a secure channel
(GCS-originated per spec), require re-auth (links to REMOTE_CONTROL_GUARDRAILS kill-switch).

---

## T14 — RF-fingerprint deviation (per-radio TX spectral signature)

**What it catches:** a different physical radio impersonating the drone or the GCS (a clone/relay
attack), even when the digital payload validates.

**Algorithm:** each authentic radio has a stable hardware TX impairment signature — carrier
frequency offset, I/Q imbalance, phase noise, transient turn-on envelope. Killinchu (or an
RF-observatory sensor) baselines this per `componentId` during enrollment, then classifies live
captures against the baseline (distance in feature space / one-class SVM or lightweight CNN on the
transient). A capture that decodes correctly but lands outside the radio's fingerprint manifold
fires. This is physical-layer device authentication, complementary to MAVLink signing (T13).

**FP estimate:** RF fingerprinting is environment-sensitive (multipath, temperature, SNR) → realistic
**~0.1–0.5 FA/h** at `warn`; only escalate to `halt` when corroborated by a T13 signing failure or a
GPS/INS disagreement (T16). Honestly the weakest standalone signal — used as corroboration, never a
sole halt.
**Severity:** `warn` standalone; `halt` only corroborated.

**Receipt:** `{ "tripwire":"T14", "evidence": { "radio":"comms-0", "baselineCentroidDist":4.7,
"threshold":3.0, "cfoHz":1820, "iqImbalanceDb":2.1 }, "corroboratedBy":["T13"] }`
**Recovery:** treat the link as untrusted; fall back to a pre-shared authenticated channel; alert
operator; if airborne, initiate return-to-home under last-trusted authority.

---

## T15 — accelerometer / IMU spoof (cross-check IMU vs GPS/dynamics)

**What it catches:** falsified IMU data (sensor tamper, or an attacker feeding fake attitude/accel to
destabilize or hide a maneuver).

**Algorithm:** physical consistency / innovation-residual check. The EKF already computes innovation
residuals; Killinchu cross-checks integrated IMU-derived velocity/position against the independent
GPS velocity/position and against the commanded actuator state (control allocation → expected
acceleration). Sustained residual beyond the EKF-consistent gate (normalized innovation squared,
NIS, exceeding its chi-square bound) without a corresponding GPS dropout indicates IMU spoof rather
than ordinary sensor noise.

**FP estimate:** vibration, hard maneuvers, and genuine sensor faults raise NIS → **~0.05–0.15 FA/h**
at `warn`. Distinguish spoof from fault by checking which sensor disagrees with the *majority* (drones
with redundant IMUs vote; single-IMU drones rely on GPS+dynamics agreement). `halt` only on sustained
disagreement (> N seconds) with healthy GPS.
**Severity:** `warn` → `halt` (sustained, GPS healthy).

**Receipt:** `{ "tripwire":"T15", "evidence": { "nis":31.4, "nisGate":16.9, "imuVel":[…],
"gpsVel":[…], "durationS":3.2, "gpsHealthy":true } }`
**Recovery:** drop the suspect IMU from the EKF fusion (use redundant IMU / GPS-only mode if
available); if no redundancy, RTH/land. Flag the IMU `componentId` health → fault in the twin.

---

## T16 — GPS spoof (INS + RF-observatory cross-check)

**What it catches:** GNSS spoofing — fake satellite signals walking the drone off-course or to a
capture point (the classic counter-UAS and hijack vector; ASTM/FAA telemetry is unauthenticated
broadcast and spoofable, per [Sensors 2026 ADS-B/RemoteID security survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC12846276/)).

**Algorithm — three independent checks, weighted:**
1. **INS divergence:** GPS position/velocity vs INS dead-reckoned solution; a spoof that teleports or
   smoothly drags position creates an INS innovation that exceeds the consistency gate (same NIS
   machinery as T15 but on the GPS update).
2. **GNSS physics:** abnormal C/N0 uniformity across satellites, clock-bias jumps, AGC saturation,
   and PX4's own **jamming indicator** (≈40 nominal, ≥80 inspect, per
   [PX4 Flight Review](https://docs.px4.io/main/en/log/flight_review)).
3. **RF-observatory cross-check:** an independent ground RF observatory (or the Killinchu sensor
   mesh) that holds a trusted position estimate (multilateration / known geometry) disagrees with the
   broadcast position.
Fire when ≥2 of 3 agree on anomaly.

**FP estimate:** urban canyon, multipath, and ionospheric events cause genuine GPS degradation →
single-check FP is high, but the **≥2-of-3 fusion drives target to ~0.02–0.1 FA/h** at `halt`.
**Severity:** `warn` (1 check) → `halt` (≥2 checks).

**Receipt:** `{ "tripwire":"T16", "evidence": { "insDivergenceM":420, "jammingIndicator":86,
"cn0Uniformity":0.97, "observatoryDeltaM":380, "checksFired":["ins","physics","observatory"] } }`
**Recovery:** switch navigation to INS + visual/optical-flow odometry if available; freeze to a safe
hover; initiate RTH along the last-trusted track; alert C-UAS operator. Persist GPS module health →
degraded.

---

## T17 — unexpected OTA attempt

**What it catches:** any firmware-update attempt that did not originate from the authorized
SECURE_OTA pipeline (an attacker pushing firmware, or an OTA outside the 2-person window).

**Algorithm:** every authorized OTA carries a signed in-toto attestation and a pre-registered OTA
ticket id (see `SECURE_OTA.md`). The device's update agent refuses any MAVLink FTP write to the
firmware partition lacking a valid ticket + cosign signature; Killinchu independently watches for
`FILE_TRANSFER_PROTOCOL` writes to firmware paths and `SYS_BL_UPDATE`-style bootloader-update
parameter sets ([PX4 Bootloader Update](https://docs.px4.io/main/en/advanced_config/bootloader_update),
[MAVLink FTP](https://mavlink.io/en/services/ftp.html)) and matches them to open tickets.

**FP estimate:** deterministic ticket match → **< 1e-4 FA/h**. Sole FP source is a legitimate OTA
whose ticket wasn't registered (process gap) → fixed by pipeline discipline.
**Severity:** `halt` (refuse the write, quarantine).

**Receipt:** `{ "tripwire":"T17", "evidence": { "ftpPath":"/fs/microsd/fw/px4.bin",
"opcode":"CreateFile", "ticketId":null, "cosignValid":false } }`
**Recovery:** reject the transfer; the device stays on the current attested slot; raise to operators;
require investigation before any future OTA to this airframe.

---

## T18 — geofence violation

**What it catches:** the airframe crossing an authorized boundary (containment failure, hijack,
runaway), reusing the maritime dark-vessel/geofence primitive (`killinchu_research_notes.md`).

**Algorithm:** point-in-polygon test of `telemetry.live.{lat,lon,altAgl}` against the active
mission's `geofence` (GeoJSON polygon + altitude band). This is the exact Cannonico-shape rule from
the killinchu thesis: `insideGeofence(pos, fence) && altAGL > limit` → HALT. Hysteresis on the
boundary prevents flapping; a sustained breach (> M samples) fires.

**FP estimate:** GPS noise near the fence edge → controlled by hysteresis + buffer zone → target
**~0.01–0.05 FA/h** at `halt`. (Note: a GPS spoof can *cause* a false geofence reading — T16 runs
first and, if firing, downgrades T18 to advisory to avoid acting on spoofed position.)
**Severity:** `warn` (approaching) → `halt` (sustained breach, GPS trusted).

**Receipt:** `{ "tripwire":"T18", "evidence": { "pos":[lat,lon,altAgl], "fenceId":"mission-…",
"breachKind":"lateral", "breachDistM":58, "samples":7, "gpsTrusted":true } }`
**Recovery:** command geofence action (RTH / loiter / land per policy); if hijack suspected
(corroborating T13/T14/T16), escalate to C-UAS effector chain via the a11oy gate (same HALT→a11oy→
SENTRA→Khipu chain as the thesis).

---

## T19 — mission deviation

**What it catches:** the drone executing a flight materially different from its approved plan
(commandeered, or autonomy gone off-script).

**Algorithm:** the approved mission has a `plannedDag` (hash of the waypoint/command DAG). Killinchu
continuously compares the realized track + executed commands against the plan: cross-track error
beyond tolerance, unplanned waypoint insertion/deletion, or executed commands not present in the
planned DAG. Any command executed that does not appear in the mission-replay DAG fires (this is the
`REMOTE_CONTROL_GUARDRAILS` "mission-replay must show command in DAG" invariant).

**FP estimate:** wind/avoidance maneuvers cause benign cross-track error → wide spatial tolerance +
require a *structural* DAG difference (not just track error) for `halt` → **~0.02–0.1 FA/h**.
**Severity:** `warn` (track drift) → `halt` (DAG structural mismatch).

**Receipt:** `{ "tripwire":"T19", "evidence": { "plannedDag":"…", "executedCmd":{"MAV_CMD":16,…},
"inPlannedDag":false, "crossTrackM":210 } }`
**Recovery:** pause autonomy, hold position, require 2-person re-authorization (guardrails) to
continue, or RTH. Persist a deviation cord to the mission record.

---

## T20 — unauthorized MAVLink command

**What it catches:** a privileged/dangerous command (disarm-in-flight, mode change to manual,
mission clear, motor test, parameter write to safety-critical keys, kill) issued by a sender/role not
authorized for it — the command-injection endgame.

**Algorithm:** an allowlist policy keyed on (command, sender identity, current 2-person
authorization state, flight phase). Identity is established by MAVLink 2 signing (T13) + the
operator's Yuyay/2-person session (guardrails). A privileged `COMMAND_LONG`/`COMMAND_INT` (e.g.
`MAV_CMD_COMPONENT_ARM_DISARM`, `MAV_CMD_DO_SET_MODE`, `MAV_CMD_NAV_LAND`, mission clear, param-set to
`SYS_*`/security keys) from an unauthorized or unsigned source fires immediately. Cross-links to the
existing **T01 gate-bypass** (a command with no valid Λ-gate verdict).

**FP estimate:** deterministic policy match → **< 1e-3 FA/h**; FP source is a legitimate operator
acting before their 2-person approval landed (process timing) → mitigated by the guardrail sequence.
**Severity:** `halt` (reject command + quarantine session).

**Receipt:** `{ "tripwire":"T20", "evidence": { "command":"MAV_CMD_COMPONENT_ARM_DISARM",
"sysidFrom":42, "signed":false, "twoPersonState":"none", "flightPhase":"airborne",
"allowlisted":false } }`
**Recovery:** reject the command (it never reaches actuators); kill the offending session; if an auth
chain is broken, the guardrail kill-switch engages (REMOTE_CONTROL_GUARDRAILS); RTH under
last-trusted authority.

---

## Summary table

| ID | Signal | Primary detector | `halt` threshold | FP target (FA/h) | Cross-link |
|---|---|---|---|---|---|
| T11 | secure-boot-attestation | DICE TCI vs golden | mismatch / bad cert chain | <1e-4 | T09 |
| T12 | firmware-merkle-mismatch | Merkle root vs Khipu anchor | exec-region divergence | <1e-4 | T05 |
| T13 | mavlink-anomaly | rate + seq + MAVLink2 signing | signing fail OR rate+seq | <1e-3 | T01 |
| T14 | rf-fingerprint-deviation | TX-impairment classifier | corroborated only | ~0.1–0.5 (warn) | T13, T16 |
| T15 | accelerometer-spoof | IMU↔GPS↔dynamics NIS | sustained, GPS healthy | ~0.05–0.15 | T16 |
| T16 | gps-spoof | INS + GNSS physics + RF obs (≥2/3) | ≥2 checks | ~0.02–0.1 | T15, T18 |
| T17 | unexpected-ota | OTA ticket + cosign match | no valid ticket | <1e-4 | — |
| T18 | geofence-violation | point-in-polygon + hysteresis | sustained, GPS trusted | ~0.01–0.05 | T16 |
| T19 | mission-deviation | plannedDag vs executed DAG | structural DAG mismatch | ~0.02–0.1 | guardrails |
| T20 | unauthorized-mavlink-command | allowlist × identity × 2-person | privileged + unauth | <1e-3 | T01 |

**Deadman composition:** `Halt(s) ⇔ ⋁_{j=1}^{20} T_j(s)`. T11–T20 are evaluated synchronously,
outside the agent policy loop, before any externally visible actuator command — preserving HUKLLA's
deadman-soundness property (thesis Thm. *Deadman soundness*). Each firing appends a halt cord to the
Khipu DAG before any further action (append-only invariant).

---

## Honest status

- DICE attestation (T11) and Merkle anchoring (T12) require hardware support / golden-measurement
  enrollment; on boards lacking a DICE secure element these run in `placeholder` mode and are
  surfaced as such (Doctrine v11 honesty), never silently passed.
- RF fingerprinting (T14) and GPS-spoof RF-observatory check (T16.3) require sensor hardware; absent
  the observatory, T16 runs on INS+physics (2 of 3 checks) only and is labelled reduced-confidence.
- FP rates are **engineering targets pending field calibration**, not measured field statistics.

## Primary sources

- HUKLLA T01–T10 deadman design: internal thesis ch.4 (`thesis_v20/chapters/04-huklla-tripwires.tex`)
- TCG DICE Layering Architecture r19: <https://trustedcomputinggroup.org/wp-content/uploads/DICE-Layering-Architecture-r19_pub.pdf>
- TCG DICE Attestation Architecture: <https://trustedcomputinggroup.org/resource/dice-attestation-architecture/>
- ArduPilot Secure/Tamperproof Firmware: <https://ardupilot.org/dev/docs/secure-firmware.html>
- MAVLink Message Signing (48-bit SHA-256, 32-byte key, 1-min timestamp window): <https://mavlink.io/en/guide/message_signing.html>
- ArduPilot MAVLink2 signing: <https://ardupilot.org/copter/docs/common-MAVLink2-signing.html>
- MAVLink FTP (firmware-path writes): <https://mavlink.io/en/services/ftp.html>
- PX4 Bootloader Update / SYS_BL_UPDATE: <https://docs.px4.io/main/en/advanced_config/bootloader_update>
- PX4 Flight Review (GPS jamming indicator, fix types): <https://docs.px4.io/main/en/log/flight_review>
- ADS-B/Remote-ID unauthenticated-broadcast spoofability survey, Sensors 2026: <https://pmc.ncbi.nlm.nih.gov/articles/PMC12846276/>
- NIST SP 800-193 (RTU/RTD/RTRec recovery): <https://csrc.nist.gov/pubs/sp/800/193/final>

*Signed: Yachay-extension · Doctrine v12 (PURIQ) · 2026-05-31*
