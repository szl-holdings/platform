# REMOTE_FORENSICS — Post-Incident Drone Evidence Pull & Sandbox Replay

**Layer:** Killinchu · forensics authority
**Goal (founder):** "See if it's damaged, see if tampered" — and prove *why*, after the fact.
**Sign-off:** Yachay-extension.

> When an airframe has an incident (crash, suspected hijack, anomaly flag), Killinchu pulls a
> defined evidence set, hashes every artifact into the Khipu chain (chain-of-custody), and replays
> the flight in a sandbox so the failure is reproducible — not a guess.

---

## 0. Chain-of-custody principle

Every artifact pulled is **hashed (sha-256) at the moment of capture** and the digest is written as a
Khipu cord *before* analysis. The drone's running attestation (DICE Alias key, T11) signs the bundle
manifest where supported, so the evidence is bound to the exact TCB that produced it. Any later
analysis references the cord, not a mutable copy — so tampering with evidence after capture is itself
detectable (and trips the existing HUKLLA **T10 log-deletion** if anyone tries to rewrite it).

---

## 1. The evidence set (what we pull)

| # | Artifact | Source / format | How pulled | Hashed into Khipu |
|---|---|---|---|---|
| 1 | **Flight logs** | ArduPilot DataFlash `.bin`; MAVLink telemetry `.tlog`; PX4 `.ulog` | MAVLink FTP read of `/fs/microsd/log/*`; `.tlog` from GCS capture | yes |
| 2 | **Parameter dump** | full param set (key→value) | MAVLink `PARAM_REQUEST_LIST` / log `param` extract | yes |
| 3 | **Sensor traces** | IMU/accel/gyro/mag/baro/GPS raw series | decoded from `.bin`/`.ulog` (`IMU`, `GPS`, `BARO` messages) | yes |
| 4 | **Kernel ring buffer** | dmesg/console ring (NuttX/Linux companion) | MAVLink FTP read of console log / `dmesg` on companion | yes |
| 5 | **Execution trace** | eBPF trace (Linux companion computers only) | eBPF program capture where the platform supports it | yes |
| 6 | **MAVLink message history** | full session frame log | GCS-side capture + on-board `.tlog` | yes |
| 7 | **RF link log** | RSSI / SNR / link-quality time series | `RADIO_STATUS` messages + radio driver log | yes |
| 8 | **Video frame hashes** | per-frame sha-256 of the camera stream | computed live at capture (see §3) | yes (Merkle root) |
| 9 | **Attestation evidence** | DICE TCI chain, boot status at incident | last attestation cord (T11) | yes |
| 10 | **Active tamper flags** | T11–T20 detections during the flight | from twin `tamperFlags[]` | already cords |

> **Honest scope:** items 5 (eBPF) and 4 (kernel ring) apply to drones with a **Linux companion
> computer** (e.g. Skynode, Jetson-based). A bare flight-controller (NuttX-only Pixhawk) exposes the
> console log and DataFlash/ulog but no eBPF; the bundle records "eBPF: not-supported-on-platform"
> honestly rather than faking a trace.

---

## 2. Pull procedure

```
1. Quiesce: command safe state (disarm-on-ground / hold). Do NOT power-cycle (preserves volatile state).
2. Snapshot twin: freeze the DroneTwin object + tamperFlags + khipuChain tail.
3. FTP read evidence set (item 1-7,9) over signed MAVLink2 link (or SD card pull if grounded).
4. Hash each artifact; write a Khipu FORENSIC_CAPTURE cord per artifact (subjectHash = sha256).
5. Build a signed manifest (in-toto statement, subjects = all artifact digests).
6. Store the bundle in evidence WORM storage; the manifest cord is the case anchor.
```

The bundle manifest is an in-toto statement so it slots into the same provenance tooling as OTA:
```json
{ "_type":"https://in-toto.io/Statement/v1",
  "subject":[ {"name":"flight.bin","digest":{"sha256":"…"}},
              {"name":"params.json","digest":{"sha256":"…"}},
              {"name":"video.merkleroot","digest":{"sha256":"…"}} ],
  "predicateType":"https://szlholdings.dev/killinchu/forensic-bundle/v1",
  "predicate":{ "twinId":"9f2c…","incidentId":"INC-2026-…","capturedAt":"…",
                "ebpf":"not-supported-on-platform","attestationAtIncident":"verified" } }
```

---

## 3. Video frame hashing (tamper-evident imagery)

The camera stream is hashed per frame at capture: `h_i = sha256(frame_i)`, and the per-frame hashes
form a **Merkle tree** whose root is anchored in the Khipu chain. This means: (a) any later edit to a
frame is detectable, and (b) a specific frame can be proven authentic with a Merkle inclusion proof
without revealing the whole video. The live WebRTC stream (see `DRONE_FLEET_DB_SCHEMA.md` §video) is
stamped with the rolling Merkle root so the *live* feed and the *forensic* feed share one
chain-of-custody.

---

## 4. Sandbox replay (reproduce the incident)

The pulled logs are replayed in a simulator so the failure is reproducible and analysts can probe
counterfactuals ("what if the EKF had rejected GPS at t=412s?").

| Sandbox | Use | Source |
|---|---|---|
| **PX4 SITL** | replay `.ulog`-driven PX4 incident; software-in-the-loop | [PX4 Simulation](https://docs.px4.io/main/en/simulation/) |
| **Gazebo (gz)** | full physics + sensor world for crash dynamics | [PX4 Gazebo](https://docs.px4.io/main/en/sim_gazebo_gz/) |
| **AirSim** | photoreal visual replay (vision/optical-flow incidents) | Microsoft AirSim |
| **ArduPilot SITL** | replay `.bin` for ArduPilot airframes | ArduPilot SITL |

Replay is deterministic: feed the recorded sensor/RC inputs into SITL and confirm the simulated
state track matches the recorded track; divergence localizes the fault (sensor vs estimator vs
control vs actuator). The replay run itself emits a Khipu cord referencing the source bundle, so the
analysis is also receipted.

---

## 5. Analysis tooling (compare with established tools)

We do not reinvent log analysis; we wrap the standard tools and add receipting:

- **PX4 Flight Review** — the canonical `.ulog` web analyzer (GPS uncertainty, EKF, vibration,
  actuator, **GPS jamming indicator ≈40 nominal / ≥80 inspect**)
  ([PX4 Flight Review](https://docs.px4.io/main/en/log/flight_review)). Killinchu surfaces the same
  plots and pins the jamming-indicator threshold used by T16 (gps-spoof).
- **PX4 Flight Log Analysis / Data Comets** — interactive log exploration on the flight path
  ([PX4 Flight Log Analysis](https://docs.px4.io/main/en/log/flight_log_analysis)).
- **MAVExplorer (MAVProxy)** — ArduPilot `.bin`/`.tlog` analysis: `dump <msg>`, `param`,
  `paramchange`, `messages`, graphing
  ([ArduPilot MAVExplorer](https://ardupilot.org/dev/docs/using-mavexplorer-for-log-analysis.html)).
- **MAVProxy DataFlash logger** — pull/manage `.bin` logs
  ([MAVProxy DataFlash Logs](https://ardupilot.org/mavproxy/docs/modules/dataflash_logger.html)).

Killinchu's added value over raw tools: every artifact is hashed into the Khipu chain (tamper-evident
custody), the tamper-flag timeline (T11–T20) is overlaid on the log timeline, and the replay is
reproducible + receipted.

---

## 6. Forensic → twin & tripwire feedback

Findings write back:
- A confirmed sensor fault sets the relevant `hardware.<comp>.status = fault` and lowers `health`.
- A confirmed spoof/hijack confirms the corresponding tripwire detection (T13/T14/T15/T16/T20) and
  upgrades its confidence in the case record.
- Crash dynamics → impact-damage map feeds the 3D viewer's per-vertex `aHealth` heatmap
  (`THREE_JS_TWIN_VIEWER.md` §3).

---

## Honest status

- `.bin`/`.tlog`/`.ulog` pull + param dump + sensor traces + MAVLink history + RF log are all
  real and library-backed (pymavlink, MAVExplorer, Flight Review, pyulog).
- eBPF execution tracing and kernel ring buffer require a Linux companion; on FC-only airframes the
  bundle records the limitation honestly.
- Video Merkle hashing is real (sha-256 per frame); chain-of-custody signature is `PLACEHOLDER`
  until Sigstore CI is wired (Doctrine v11), surfaced not hidden.

## Primary sources

- PX4 Flight Review (`.ulog`, jamming indicator, GPS fix types): <https://docs.px4.io/main/en/log/flight_review>
- PX4 Flight Log Analysis / Data Comets: <https://docs.px4.io/main/en/log/flight_log_analysis>
- PX4 Simulation (SITL): <https://docs.px4.io/main/en/simulation/> · Gazebo: <https://docs.px4.io/main/en/sim_gazebo_gz/>
- ArduPilot MAVExplorer log analysis: <https://ardupilot.org/dev/docs/using-mavexplorer-for-log-analysis.html>
- MAVProxy DataFlash logger (`.bin`): <https://ardupilot.org/mavproxy/docs/modules/dataflash_logger.html>
- MAVLink FTP (log pull): <https://mavlink.io/en/services/ftp.html>
- in-toto statement format: <https://github.com/in-toto/attestation/blob/main/spec/predicates/link.md>

*Signed: Yachay-extension · Doctrine v12 (PURIQ) · 2026-05-31*
