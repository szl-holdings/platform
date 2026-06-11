# SZL Holdings — OSS Repos + Quantum Edge AI Deep Research
**Prepared for:** SZL Holdings internal use  
**Source dataset:** `/home/user/workspace/wide/browse_results_mq9qt0el.json` (25 DoD CDAO autonomy companies)  
**Research date:** June 2026  
**Doctrine:** Pattern learning only. Never copy proprietary IP. Never claim others' work.

---

## EXECUTIVE SUMMARY

Of the 25 companies surveyed, **six have genuine public OSS repos** worth deep study. The rest are closed-source defense primes whose GitHub presence consists of SDKs, legacy forks, or marketing scaffolding. The PX4/MAVLink/QGroundControl ecosystem (Auterion-adjacent) is by far the most architecturally rich open codebase for drone autonomy. Post-quantum cryptography is now standardized (NIST FIPS 203/204/205) and actively being trialled on live drone C2 links — the patterns are ready to learn from. Three concrete SZL tab upgrades follow at the end.

---

## PART A — REAL OPEN-SOURCE GITHUB REPOS

### 1. Astral Technology Corp — `github.com/astral-us`

**Verified:** Yes — 2 public repos confirmed at [`github.com/astral-us`](https://github.com/astral-us)

| Repo | License | Language | Stars | What it does |
|---|---|---|---|---|
| [`astral-sdk`](https://github.com/astral-us/astral-sdk) | **Apache 2.0** | Python 100% | 0 (new) | MAVLink wrappers + ROS 2 bridge |
| [`astral-docs`](https://github.com/astral-us/astral-docs) | Not stated | — | — | Public docs via Mintlify |

**Architecture exposed in `astral-sdk`:**
- MAVLink primitives: **arm, takeoff, land, velocity control, position control, telemetry, parameter read/write, failsafe setup** — all as clean Python wrappers
- ROS 2 bridge: `ros2_ws/astral_drone` package exposing camera and MAVLink as ROS 2 topics; native integration with **Isaac ROS Visual SLAM** and **Nav2**
- Safety pattern: movement commands clamped by `MIN_ALTITUDE`, `MAX_ALTITUDE`, `MAX_VELOCITY`, `MAX_YAW_RATE` constants — a configurable envelope guard
- Config-driven: YAML-based serial port configuration, failsafes installable once with `configure_failsafes()`

**Honest OSS signal:** Genuinely public, Apache 2.0. Code is sparse and new (0 stars as of research date). The value is in the **interface pattern** — it shows exactly how a Python SDK bridges MAVLink to ROS 2 topics for nav stack consumption, which is more useful as a design reference than as a dependency.

**Research publications:** [arXiv:2506.10756](https://arxiv.org/abs/2506.10756) — Vision-Language Navigation for UAVs with Continuous Control; ["Yonder" drone navigation dataset](https://astral.us/research) — NeurIPS 2026 submission with 4.65M frames.

**SZL transferable patterns:**
- Python SDK command-dispatch pattern (MAVLink → safe clamped calls) → adaptable for a **killinchu drone-control mock backend**
- ROS 2 topic bridge structure → reference for **a11oy real-time telemetry graph** that subscribes to `/mavlink/telemetry` style topics

---

### 2. Robotics-Ark / Ark Framework — `github.com/Robotics-Ark/ark_framework`

**Verified:** Yes — confirmed public at [`github.com/Robotics-Ark/ark_framework`](https://github.com/Robotics-Ark/ark_framework)

| Repo | License | Language | Stars |
|---|---|---|---|
| [`ark_framework`](https://github.com/Robotics-Ark/ark_framework) | View license (custom, check before use) | Python 100% | **169** |

**Architecture from [arXiv:2506.21628](https://arxiv.org/abs/2506.21628):**
- **Description:** "The PyTorch + Gym for robotics" — Python-first playground for robot learning
- **Gym-style environment interface** for data collection, preprocessing, and policy training
- Supports **ACT** (Action Chunking with Transformers) and **Diffusion Policy** — two leading imitation learning paradigms
- **Lightweight client-server pub/sub architecture** for networked module communication — similar philosophy to uORB but Python-native
- **Optional C/C++ bindings** for real-time performance when needed
- Built-in modules: **control, SLAM, motion planning, system identification, visualization**
- **Native ROS interoperability** and seamless sim-to-real toggle
- Authors: Magnus Dierking, Christopher Mower, Sarthak Das et al. (affiliated with TU Darmstadt, UCL, Huawei Noah's Ark Lab)

**IMPORTANT CAVEAT:** The "Ark Robotics" defense company (Estonia, Ukraine deployments) is **completely separate** from this academic `Robotics-Ark/ark_framework`. They share a name but no organizational relationship. The framework is **academic OSS**; the defense product "Frontier OS" is closed-source proprietary. Do not conflate.

**SZL transferable patterns:**
- Gym-style environment interface → reference for **simulation scaffolding in SZL autonomy visualizations**
- Client-server pub/sub model → clean Python-native alternative to ROS 2 for **killinchu backend event bus** prototyping
- ACT/Diffusion Policy pipeline structure → understanding what "robot learning" data flows look like

---

### 3. Auterion / PX4 Ecosystem — The Most Architecturally Rich OSS Stack

**Verified:** Auterion GitHub at [`github.com/auterion`](https://github.com/auterion) — **82 public repos**. The founders built PX4 and MAVLink; the ecosystem spans three major projects.

#### 3a. PX4-Autopilot — [`github.com/PX4/PX4-Autopilot`](https://github.com/PX4/PX4-Autopilot)

| Field | Value |
|---|---|
| License | **BSD-3-Clause** |
| Stars | **10.3k** (10,300) |
| Languages | C++ 49%, C 39%, CMake 4%, Python 3% |
| Latest stable | v1.16.0 (Aug 2025) |
| Contributors | 752 |

**Architecture (from [official docs](https://docs.px4.io/main/en/concept/architecture.html)):**

```
┌─────────────────────────────────────────────────────┐
│                   FLIGHT STACK                       │
│  Sensors → Estimator → Controller → Mixer → Actuators│
│  Navigator (autonomous waypoints)                    │
│  Commander (flight mode state machine)               │
└─────────────────────────────────────────────────────┘
              ↕ uORB pub/sub (shared memory)
┌─────────────────────────────────────────────────────┐
│                   MIDDLEWARE                         │
│  Device drivers (IMU, GPS, barometer, RC)            │
│  MAVLink (GCS / companion computer comms)            │
│  Simulation layer (Gazebo, JSBSim bridges)           │
└─────────────────────────────────────────────────────┘
              Running on: NuttX RTOS (BSD) or POSIX
```

**uORB message bus:** Publish-subscribe over shared memory, zero-copy, thread-safe. Modules define topics (e.g., `vehicle_status`, `sensor_combined`, `vehicle_command`). IMU drivers publish at 1 kHz, integrate, republish at 250 Hz. `navigator`, `commander` run slower. Fully reactive, asynchronous — the system updates instantly on new data.

**Commander / state machine:** The `commander` module is the flight mode state machine — handles MANUAL → STABILIZED → ALTITUDE → POSITION → AUTO:MISSION → AUTO:RTL transitions, arming logic, failsafe triggers. It is the single source of truth for vehicle state.

**Module pattern:** Every building block is a self-contained module (task or work-queue task). Tasks have own stack + priority; work-queue tasks share a queue cooperatively. Modules are inspected with `top` and started/stopped individually at runtime.

**Key Auterion-specific repos:**

| Repo | License | Stars | What it enables |
|---|---|---|---|
| [`px4-ros2-interface-lib`](https://github.com/auterion/px4-ros2-interface-lib) | BSD-3-Clause | **173** | External ROS 2 modes that register with PX4 exactly like internal ones; bridges uORB ↔ ROS 2 topics via message compatibility checking |
| [`mavlink-military`](https://github.com/auterion/mavlink-military) | MIT | — | `military.xml` — MAVLink dialect extension for military messages; the schema pattern for adding custom message types |
| [`c_library_v2`](https://github.com/auterion/c_library_v2) | MIT | — | Official MAVLink v2 C/C++ reference implementation (auto-generated from XML definitions) |
| [`pymavlink`](https://github.com/auterion/pymavlink) | MIT | — | Python MAVLink interface and utilities |
| [`embedded-debug-tools`](https://github.com/auterion/embedded-debug-tools) | — | **77** | Python tools for profiling ARM Cortex-M (PX4 FMU boards) |
| [`px4-jsbsim-bridge`](https://github.com/auterion/px4-jsbsim-bridge) | — | **47** | PX4 SITL/HITL simulation bridge via JSBSim |

#### 3b. MAVSDK — [`github.com/mavlink/MAVSDK`](https://github.com/mavlink/MAVSDK)

| Field | Value |
|---|---|
| License | **BSD-3-Clause** |
| Stars | **777** |
| Language | C++ 93% |

**Architecture:** Core C++ library + plugin libraries + gRPC server (`mavsdk_server`). Each feature area (telemetry, action, mission, camera, param, offboard) is a plugin. Language clients (Python, Swift, Java) connect to `mavsdk_server` via gRPC — proto IDL defines the API. Both synchronous (blocking) and async (callback) call patterns supported. The `MavlinkDirect` plugin exposes raw MAVLink message injection for custom dialects.

**MAVLink protocol pattern:** XML-defined message schemas (`common.xml`, `ardupilotmega.xml`, custom dialects like `military.xml`) → code generation → typed C/C++ structs. MAVLink v2 adds packet signing, component IDs, message extensions. The wire protocol is: header (magic byte, length, flags, seq, sysid, compid, msgid) + payload + CRC.

#### 3c. QGroundControl — [`github.com/mavlink/qgroundcontrol`](https://github.com/mavlink/qgroundcontrol)

| Field | Value |
|---|---|
| License | **Apache 2.0 / GPLv3 dual** |
| Stars | **4k** |
| Languages | C++ 65%, QML 29%, CMake 4% |
| Latest stable | v5.0.8 (Oct 2025) |
| Forks | 4.4k |

**Architecture:** C++/Qt backend handles MAVLink decoding, vehicle state, mission management. QML frontend handles all UI (maps, instrument displays, mission planning). Clear backend/frontend separation. **MAVLink Inspector** provides real-time message monitoring with live value graphs. Mission planning uses drag-and-drop waypoint UI backed by MAVLink MISSION_ITEM protocol.

**Honest OSS signal:** PX4/MAVSDK/QGroundControl is **genuinely the most open and well-documented drone autonomy stack in existence**. BSD/Apache licensed, 10k+ combined stars, Linux Foundation governance (Dronecode). The state machine, message bus, telemetry pipeline, and GCS UI patterns are all fully legible in public code. This is the gold standard reference for drone C2 architecture.

**SZL transferable patterns:**
- uORB pub/sub reactive model → **event bus design for killinchu telemetry stream** (any state change = publish to topic, all visualizations subscribe)
- Commander state machine transitions → **SZL flight-mode state visualization tab** (live FSM diagram showing MANUAL/AUTO/MISSION/FAILSAFE states)
- QGC MAVLink Inspector telemetry graph → **SZL MAVLink Living Graph tab** (live-updating time-series for altitude, groundspeed, battery, RSSI)
- MAVLink XML schema + code-gen pattern → **custom SZL telemetry message definition framework**

---

### 4. BlueHalo (AeroVironment) — `github.com/bluehalo`

**Verified:** Yes — confirmed at [`github.com/bluehalo`](https://github.com/bluehalo) — **76 public repos**

**Honest assessment:** BlueHalo's GitHub is an **Angular/Node.js web development library collection**, not a defense autonomy OSS stack. The repos reflect their origins as a web software division. The geospatial and FHIR repos are genuinely useful open-source projects, but have no drone autonomy content.

| Repo | License | Stars | What it does | Defense relevance |
|---|---|---|---|---|
| [`ngx-leaflet`](https://github.com/bluehalo/ngx-leaflet) | **MIT** | **805** | Angular component wrapping Leaflet maps | **HIGH** — geospatial map layer for operational picture |
| [`ngx-leaflet-draw`](https://github.com/bluehalo/ngx-leaflet-draw) | MIT | — | Polygon/shape drawing on Leaflet maps | HIGH — killbox/geofence drawing |
| [`ngx-leaflet-markercluster`](https://github.com/bluehalo/ngx-leaflet-markercluster) | MIT | — | Cluster large numbers of map markers | HIGH — multi-asset COP display |
| [`leaflet-d3`](https://github.com/bluehalo/leaflet-d3) | MIT | — | D3.js hexbin + other plugins for Leaflet | MEDIUM — density heatmaps |
| `node-rest-starter` | MIT | — | Node.js REST API boilerplate | LOW |
| `node-fhir-server-core` | MIT | — | HL7 FHIR health data server | NONE (health domain) |

**Honest OSS signal:** The `ngx-leaflet` suite is **genuinely excellent, actively maintained MIT-licensed OSS**. It is the de facto Angular mapping library (805 stars, used in real GIS applications). The rest of the 76 repos are web framework boilerplate, healthcare tooling, and internal utilities. **No PX4, no MAVLink, no drone flight code.** AeroVironment's core C-UAS and AV_Halo technologies are fully closed-source.

**SZL transferable patterns:**
- `ngx-leaflet` + `ngx-leaflet-draw` + `ngx-leaflet-markercluster` → **complete Angular geospatial stack for killinchu/a11oy operational map tab**: live asset tracks, polygon killboxes, marker clustering for swarm visualization

---

### 5. Anduril Technologies — `github.com/anduril`

**Verified:** Yes — confirmed public repos at [`github.com/anduril`](https://github.com/anduril)

| Repo | License | Stars | What it does |
|---|---|---|---|
| [`jetpack-nixos`](https://github.com/anduril/jetpack-nixos) | **MIT** | **228** | NixOS module for NVIDIA Jetson (Orin AGX/NX, Xavier) — CUDA, CuDNN, TensorRT, V4L2, reproducible builds |
| [`lattice-sdk-python`](https://github.com/anduril/lattice-sdk-python) | View license | 25 | Official Python SDK for Lattice platform APIs |
| [`mcap-rs`](https://github.com/anduril/mcap-rs) | Apache 2.0 | — | Rust library for MCAP robotics data logging (Foxglove format) |
| [`sample-app-auto-reconnaissance`](https://github.com/anduril/sample-app-auto-reconnaissance) | — | — | Example Lattice Tasks/Entities API usage for automated ISR |

**`jetpack-nixos` architecture:** Declarative NixOS config (flake.nix) for Jetson Orin/Xavier. Packages NVIDIA JetPack SDK components: firmware flash scripts, NV kernel (nvgpu open-source driver), EDK2 UEFI, ARM TF/OP-TEE, CUDA/CuDNN/TensorRT, hardware-accelerated video (V4L2/GStreamer), Wayland/Vulkan graphics, OCI container support (Podman + CDI). A/B OTA firmware update via capsule. Result: **completely reproducible, declarative edge AI deployment** — flash once, everything from model weights to OS is specified in a single Nix expression.

**Honest OSS signal:** `jetpack-nixos` is **genuinely useful OSS** (MIT, 228 stars, Anduril open-sourced it explicitly). It solves a real problem. The Lattice SDK is a thin API client — interesting as a pattern reference but reveals little about core Lattice internals. Everything inside Lattice OS itself (sensor fusion, mesh networking, autonomy) is closed-source proprietary.

**SZL transferable patterns:**
- `jetpack-nixos` declarative Nix pattern → **SZL edge deployment spec** — declare what models, what OS, what hardware in a single file, reproducible across fleets of Jetson nodes
- MCAP data logging pattern (`mcap-rs`) → **time-indexed telemetry storage format** for SZL replay/analysis tab

---

### 6. OpenDefense — `github.com/opendefensecloud`

**Verified:** Yes — confirmed at [`github.com/opendefensecloud`](https://github.com/opendefensecloud)

| Repo | License | Stars | What it does |
|---|---|---|---|
| [`artifact-conduit`](https://github.com/opendefensecloud/artifact-conduit) | **Apache 2.0** | 14 | Kubernetes-native gateway for transferring artifacts (containers, Helm charts, packages) across security zones |

**Architecture of `artifact-conduit`:**
- Kubernetes-native declarative CRD-based config
- Sources: OCI registries, Helm repos, S3-compatible storage, HTTP endpoints
- Validation pipeline: malware scan → CVE analysis → license verification → signature validation
- Only compliant artifacts cross security boundaries
- Provides attestation + traceability of all operations
- Does NOT replace existing registries — it's a gateway layer

**Honest OSS signal:** Small repo (14 stars), newly released. The pattern is real and the problem is genuinely hard (getting software into air-gapped DoD environments). The open-source signal is authentic but the maturity is early-stage.

**SZL transferable patterns:**
- Artifact-conduit scanning pipeline → **SZL model governance pattern**: before any AI model is deployed to an edge node, run it through CVE scan + signature check + attestation — build this as a pipeline stage, not an afterthought

---

### 7. Helsing — `github.com/helsing-ai`

**Verified:** Yes — 16 public repos confirmed at [`github.com/helsing-ai`](https://github.com/helsing-ai)

| Repo | Language | What it does | Relevance |
|---|---|---|---|
| [`edth-copenhagen-drone-acoustics`](https://github.com/helsing-ai/edth-copenhagen-drone-acoustics) | Python/Jupyter | ML on drone acoustics (EDTH Copenhagen 2025 hackathon challenge by Helsing) | **HIGH** — drone detection by sound signature |
| [`edth-copenhagen-drone-control`](https://github.com/helsing-ai/edth-copenhagen-drone-control) | — | Autonomous drone control in adverse conditions | HIGH |
| [`sguaba`](https://github.com/helsing-ai/sguaba) | **Rust** | Hard-to-misuse rigid body transforms ("spatial math") | MEDIUM — robotics geometry library |
| [`dson`](https://github.com/helsing-ai/dson) | Rust | δ-CRDT (Conflict-free Replicated Data Type) for space-efficient distributed state | MEDIUM — distributed state sync |
| `buffrs` | Rust | Modern Protobuf package management | LOW-MEDIUM |
| `atmosphere` | — | Lightweight SQL framework | LOW |

**Honest OSS signal:** Helsing is a closed-source defense prime. Their GitHub is predominantly **Rust utility crates and hackathon code**. The `edth-copenhagen-drone-acoustics` repo is a competition dataset + ML challenge — it reveals that Helsing thinks acoustic detection of drones is important enough to run a public challenge around it. The core Centaur RL-agent, Cirra EW platform, HX-2 strike drone guidance — all closed. **The sguaba spatial math library is the most technically transferable utility.**

**Centaur RL context (closed-source but publicly described):** Trained via self-play reinforcement learning at "RL-Factory." Gained "decades of virtual air combat experience in 24 hours." Flew on a Saab Gripen-E in May/June 2025, conducting BVR maneuvers and issuing fire commands autonomously. Processes onboard sensor inputs in real-time. The architecture is closed but the pattern — sim-to-real RL with opponent leagues in a high-fidelity simulator — is well-documented in academic literature.

**SZL transferable patterns:**
- `sguaba` rigid body transform library → use directly in any Rust-based SZL spatial math backend
- `dson` δ-CRDT → pattern for **distributed state in a killinchu multi-operator COP** where multiple operators see the same live picture without a central sync server
- Drone acoustics challenge → **SZL acoustic detection tab concept**: ML classifier on audio signatures to identify drone type/distance

---

### 8. Lockheed Martin — `github.com/lmco`

**Verified:** Public repos exist but are **not drone autonomy OSS**. Repos are: `laikaboss` (file scanning), `dart` (red team docs), `streamflow` (stream processing), `hoppr-cop` (SBOM/CVE), `ChaordicLedger` (distributed ledger), `bomctl` (SBOM tooling). All infrastructure/security tooling, zero flight code. **Not relevant to drone architecture learning.** Closed-source prime for all autonomy.

---

### 9. Shield AI, Palantir, Anduril (Additional Notes)

- **Shield AI `github.com/shield-ai`:** `OmniGCD` (generalized category discovery, Python), `Bootloader` (PX4-compatible bootloader for flight controllers — **actually useful** as it confirms PX4 bootloader architecture). Core Hivemind is proprietary.
- **Palantir `github.com/palantir`:** `defense-sdk-examples` (TypeScript/Java SDK examples for Defense Ontology). Pattern reference only — Foundry/Maven internals closed.
- **Mistral AI `github.com/mistralai`:** `mistral-inference`, `mistral-finetune`, `cookbook` — all **Apache 2.0 open weights**. Genuinely usable.

---

## PART B — QUANTUM / POST-QUANTUM / EDGE AI CLUSTER

### 1. The NIST PQC Standards (FIPS 203 / 204 / 205)

The three NIST Post-Quantum Cryptography standards were finalized August 13, 2024. They replace classical ECDH/ECDSA/RSA for key exchange and signatures in a quantum-capable adversary environment.

#### FIPS 203 — ML-KEM (Module-Lattice Key Encapsulation Mechanism)
**Formerly CRYSTALS-Kyber.** Source: [NIST FIPS 203](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf)

| Parameter Set | Security Level | Encap Key (bytes) | Decap Key (bytes) | Ciphertext (bytes) | Shared Secret (bytes) |
|---|---|---|---|---|---|
| ML-KEM-512 | Category 1 (AES-128 equiv.) | 800 | 1,632 | 768 | 32 |
| **ML-KEM-768** | **Category 3 (AES-192 equiv.)** | **1,184** | **2,400** | **1,088** | **32** |
| ML-KEM-1024 | Category 5 (AES-256 equiv.) | 1,568 | 3,168 | 1,568 | 32 |

**NIST recommends ML-KEM-768 as default** ("large security margin at reasonable performance cost"). Based on Module Learning With Errors (MLWE) — hardness of finding short vectors in a lattice. Security holds against Grover's and Shor's algorithms on quantum computers.

**Why it matters for drone C2:** Classical ECDH key exchange in MAVLink datalinks (e.g., MAVLink v2 signing uses HMAC-SHA256 but not PQ-safe key exchange) is vulnerable to "Harvest Now, Decrypt Later" attacks where an adversary records encrypted C2 traffic today and decrypts it after quantum computers mature. ML-KEM provides quantum-safe key encapsulation to establish the session key for symmetric encryption (AES-256-GCM) of the C2 datalink.

#### FIPS 204 — ML-DSA (Module-Lattice Digital Signature Algorithm)
**Formerly CRYSTALS-Dilithium.** Source: [NIST FIPS 204](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf)

| Parameter Set | Security Level | Private Key (bytes) | Public Key (bytes) | Signature (bytes) |
|---|---|---|---|---|
| ML-DSA-44 | Category 2 | 2,560 | 1,312 | 2,420 |
| **ML-DSA-65** | **Category 3** | **4,032** | **1,952** | **3,309** |
| ML-DSA-87 | Category 5 | 4,896 | 2,592 | 4,627 |

**Why it matters for drone command authentication:** Every `COMMAND_LONG` or `MISSION_ITEM` MAVLink message that controls a drone needs to be authenticated — an operator needs to prove their identity and the drone needs to verify the command came from a legitimate source and wasn't tampered with. ML-DSA signatures provide this authentication in a quantum-safe way. At ML-DSA-65, a 3.3 KB signature on a ~50-byte MAVLink packet adds overhead but is tolerable on modern datalinks. The DroneCrypt IFF system demonstrated ML-KEM + ML-DSA key generation, encapsulation, and decapsulation in **<1ms** on embedded systems — confirming feasibility.

#### FIPS 205 — SLH-DSA (Stateless Hash-Based Digital Signature)
**Formerly SPHINCS+.** Source: [NIST FIPS 205](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.205.pdf)

12 approved parameter sets (SHA2 and SHAKE variants, "s" for small signatures, "f" for fast signing). Based purely on hash function security — no lattice assumptions. Stateless (no key state to manage, unlike XMSS/LMS). Security rests only on the collision-resistance of SHA-256/SHA-512/SHAKE-256. NIST recommends SHAKE-based sets for long-term use.

**Why it matters:** SLH-DSA is the conservative backup signature scheme — if lattice cryptography is ever broken, hash-based signatures still hold. For high-value drone mission authentication (e.g., a launch authorization command), SLH-DSA-SHAKE-128s provides a quantum-hard backup with no assumption other than SHA-3 security.

---

### 2. Post Quantum Labs (PQL) — Closed-Source DoD SDVOSB

**Source:** [postquantumlabs.com](https://postquantumlabs.com) | [SBIR portfolio](https://www.sbir.gov/portfolio/2553625)

**Honest signal:** PQL is a closed-source defense contractor. No public repos. Their products apply NIST PQC standards to Group 1-3 UAS:

| Product | Function | PQC relevance |
|---|---|---|
| **HAVOC** | Hardened Aerial Vehicle Operations Communications — secure tactical links | Key exchange over C2 datalink (ML-KEM equivalent) |
| **SWORDFISH** | Scalable Warfighter Overlay for Role-based Drone Federation | Command authentication (ML-DSA equivalent) |
| **SPARTAN** | Secure Path-routing + Adaptive Navigation (GPS-denied) | PQ-secure nav data integrity |
| **ARES** | Autonomous Resilient Edge Swarming (multi-agent) | PQ-secure inter-swarm messaging |
| **TEMPEST** | Tactical Environmental Monitoring + Persistent Swarming | Sensor data confidentiality |
| **VORTEX** | RF target emission exploration (threat avoidance) | PQ-authenticated target data |

Selected for **CDAO Crucible 2 Swarm Forge** initiative. Multiple SBIR awards for "PQC-enabled autonomy substrate" for small unmanned systems in electronically contested environments.

**What to learn from PQL:** Their product architecture suggests the right PQC decomposition for a drone C2 stack — separate concerns for (1) the datalink (HAVOC = key exchange / symmetric encryption), (2) command authentication (SWORDFISH = digital signatures), (3) navigation data integrity (SPARTAN = signed sensor feeds). The **SZL recipe**: implement the same three-layer PQC stack but build it as an open pattern on top of FIPS 203/204/205 reference implementations.

**Real-world demo:** STV Group + Post-Quantum (the UK PQC company, not PQL) successfully trialled **Classic McEliece** in live drone missions at a Czech weapons testing facility ([The Quantum Insider, March 2026](https://thequantuminsider.com/2026/03/31/stv-post-quantum-secure-drone-communications/)). Classic McEliece's large key size was previously considered infeasible for airborne DDIL comms — they proved it works at mission scale, protecting full-motion video and flight metadata for the duration of the mission against "Harvest Now, Decrypt Later" attacks.

---

### 3. Tycho AI — Closed-Source Edge Autonomy

**Source:** [tycho.ai](https://tycho.ai) | [AFRL TRIDENT contract announcement](https://tycho.ai/news/tycho-ai-secures-2m-afrl-tacfi-contract-to-advance-maritime-autonomy-in-gps-denied-environments)

**No public repos.** Closed-source defense company. MIT-educated engineers, steered by national security experts.

**Voyager autonomy stack (publicly described architecture):**
- **GNSS-denied navigation:** Visual-Inertial Odometry (VIO) fusing monocular/stereo cameras with IMU — claims **<1% drift error**. Additionally uses satellite image matching for absolute position correction.
- **Foundation vision models** for real-time perception, obstacle detection, 3D mapping
- **Rapid trajectory generation** for high-speed, low-altitude obstacle avoidance
- **Low-SWaP hardware** — compact module integratable on any uncrewed platform
- **MOSA (Modular Open Systems Approach)** design
- Integration with **FANTOM middleware** for transition into operational frameworks

**TRIDENT contract context:** $2M AFRL TACFI for maritime autonomy in GPS-DDIL environments. Scope includes test flights with rotary- and fixed-wing platforms over water, validating autonomous waypoint traversal, multi-agent coordination, and resilient perception. This is the specific technical gap: over-water GPS-denied navigation where neither terrain features nor GPS are available.

**SZL transferable pattern:** VIO + satellite image matching hybrid navigation → reference architecture for a **SZL GPS-denied navigation simulator tab** — show how drift accumulates on pure VIO and how satellite image matching provides absolute correction (visualize the algorithm, not implement the hardware).

---

### 4. NODA AI — Closed-Source Multi-Domain Orchestration

**Source:** [nodaintelligence.ai](https://www.nodaintelligence.ai) | [Bessemer VP article](https://www.bvp.com/news/noda-ai-building-the-future-of-operational-collaborative-autonomy-at-the-frontlines) | [Booz Allen investment](https://investors.boozallen.com/news-releases/news-release-details/booz-allen-expands-autonomy-ecosystem-noda-ai-investment)

**No public repos.** Operating at DoD IL4/IL5. Sole orchestrator for DoW Multi-domain Collaborative Autonomy program.

**URZA platform architecture (publicly described):**
- AI-native orchestration layer (not a wrapper over existing C2)
- **Dynamic task brokering** — real-time reasoning to delegate tasks across heterogeneous platforms
- **Semantic abstraction** over legacy OEM systems — translates high-level intent into platform-specific commands
- **LARIA synthetic environment** — Monte Carlo simulation for training "plays" (pre-computed tactical decision sequences)
- **Behavioral inference** using pattern-of-life data for predictive tactical planning
- Supports **Counter SHORAD** (Short Range Air Defense) playbooks — directly counter-UAS relevant

**SZL transferable pattern:** LARIA-style simulation → **SZL tactical simulation tab** — a Monte Carlo runner that tests autonomous decision sequences against randomized adversary behaviors, visualizing outcome distributions.

---

### 5. Nokturnal AI — Closed-Source Strike/Navigation

**Source:** [nokturnal.ai](https://www.nokturnal.ai)

**No public repos.** Proprietary defense contractor. CDAO Crucible 2 / Drone Dominance Program (top-10 at Gauntlet I).

**Odyssey GPS-denied navigation module (publicly described):**
- NVIDIA **Jetson Orin Nano/NX** onboard
- **AI-driven feature matching** and sensor data fusion for GPS-denied environments
- **ATD/ATR** (Automatic Target Detection/Recognition) via computer vision
- Custom ATAK Mission Planning plugin — polygon killbox definition, autonomous search parameters

**SZL transferable pattern:** ATAK plugin architecture → **SZL ATAK integration tab** — CoT (Cursor-on-Target) XML feed parser that converts standard ATAK placemarks into SZL entity objects for the operational map.

---

### 6. Mistral AI — Genuine Open-Weights LLMs for Edge AI

**Source:** [mistral.ai/news/mistral-3](https://mistral.ai/news/mistral-3/) | [mistralai GitHub](https://github.com/mistralai)

**This is the real open-source signal in the LLM space.** All Mistral 3 models released under **Apache 2.0** (December 2025).

| Repo | License | What it provides |
|---|---|---|
| [`mistral-inference`](https://github.com/mistralai/mistral-inference) | Apache 2.0 | Official inference library for all Mistral models |
| [`mistral-finetune`](https://github.com/mistralai/mistral-finetune) | Apache 2.0 | Fine-tuning toolkit |
| [`cookbook`](https://github.com/mistralai/cookbook) | Apache 2.0 | RAG, agentic workflow examples |

**Ministral 3 family (edge-relevant):**

| Model | Params | VRAM (4-bit) | Jetson Orin Nano performance | License |
|---|---|---|---|---|
| Ministral 3B | 3B | ~4 GB | **52 tokens/sec on Jetson Thor** | Apache 2.0 |
| Ministral 8B | 8B | ~8 GB | 50-60 tokens/sec on RTX | Apache 2.0 |
| Ministral 14B | 14B | ~12 GB | Single GPU | Apache 2.0 |

Designed explicitly for **NVIDIA Jetson, drones, IoT**. All have vision encoders (multimodal). Reasoning variants (chain-of-thought) available. Multilingual.

**Defense alliance context:** Mistral AI partnered with **Helsing** (Feb 2025) to develop "vision-language-action" models for processing video and controlling drones. Mistral also holds a framework agreement with France's Armed Forces Ministry (Jan 2026).

**SZL transferable patterns:**
- Ministral 3B on Jetson Orin Nano → **SZL edge AI inference tab**: live demo of a small LLM answering natural-language queries about telemetry ("what is the drone's current battery status?") at 52 tokens/sec with no cloud dependency
- `mistral-finetune` → fine-tune Ministral 8B on domain-specific tactical vocabulary for SZL-specific task planning
- RAG cookbook patterns → **SZL doctrine-retrieval agent**: ground LLM responses in uploaded mission SOPs and doctrinal PDFs

---

### 7. Helsing — Edge AI Inference Patterns (Centaur, Lura)

**Source:** [helsing.ai](https://helsing.ai) | [TRANSAR paper arXiv:2504.13310](https://arxiv.org/abs/2504.13310)

**Centaur (closed, but architecture publicly described):**
- Self-play RL at "RL-Factory" — trains at accelerated sim speed, gains "decades of experience in 24 hours"
- Deployed on Saab Gripen-E, took over flight controls for BVR air combat (May/June 2025 Baltic Sea tests)
- Processes onboard sensor data in real-time — purely edge inference, no cloud
- Pattern: **Sim-to-real RL with opponent leagues** → the academic open version of this is documented in papers like [arXiv:2509.24527](https://arxiv.org/abs/2509.24527) (Training Agents Inside of Scalable World Models)

**Lura — Large Acoustic Model (closed, described):**
- Transformer-based model for drone acoustic signature classification and localization
- Powers the SG-1 Fathom underwater surveillance drone
- The `edth-copenhagen-drone-acoustics` hackathon repo provides a **limited public analogue** — ML pipeline for classifying drones from audio in adverse conditions

**SZL transferable patterns:**
- Drone acoustics ML pipeline → **SZL acoustic detection proof-of-concept** using the Helsing hackathon dataset as training data
- RL-Factory sim-to-real pattern → **SZL autonomous agent training pipeline** — use open frameworks (Isaac Sim, AirSim) with opponent leagues to train a tactical edge agent

---

## PART C — THREE SZL TAB UPGRADE IDEAS (DOCTRINE-CLEAN)

All three ideas are grounded in public, open patterns. None replicates proprietary IP. Each represents a **new SZL formula** inspired by observed architectures.

---

### TAB 1: "MAVLink Living Graph" — Real-Time Telemetry Visualization

**Grounded in:** QGroundControl MAVLink Inspector ([Apache 2.0](https://github.com/mavlink/qgroundcontrol)), `astral-sdk` telemetry primitives ([Apache 2.0](https://github.com/astral-us/astral-sdk)), PX4 uORB pub/sub architecture ([docs.px4.io](https://docs.px4.io/main/en/concept/architecture.html))

**Concept:** A tab that subscribes to a live MAVLink telemetry stream (real or simulated) and renders a set of live-updating time-series charts — altitude, groundspeed, battery voltage, RSSI, GPS fix quality, attitude (roll/pitch/yaw) — exactly as QGC's MAVLink Inspector does, but built as a standalone SZL visualization component using D3.js or Observable Plot.

**Architecture:**
```
[MAVLink UDP stream or astral-sdk] 
    → [Python pymavlink decoder] 
    → [WebSocket push to frontend]
    → [SZL chart component: D3.js rolling time-series]
    → [Per-message topic subscription: user selects which channels to display]
```

**Innovation vs QGC:** SZL adds **uORB-inspired topic subscription model** — the user subscribes to any field in any MAVLink message type, and the graph auto-scales, auto-annotates state transitions (ARMED/DISARMED, flight mode changes), and exports MCAP format for replay (Anduril mcap-rs pattern).

**Implementation path:**
1. `pip install pymavlink` (MIT license)
2. `ngx-leaflet` for a mini-map inset showing GPS track
3. Observable Plot for time-series (MIT license)
4. No proprietary dependencies

---

### TAB 2: "PX4 State Machine Visualizer" — Live Flight Mode FSM Diagram

**Grounded in:** PX4 Commander module architecture ([BSD-3](https://github.com/PX4/PX4-Autopilot)), QGroundControl flight mode display, PX4 docs state machine documentation

**Concept:** A tab that renders the PX4 flight mode finite state machine as an interactive graph (nodes = modes, edges = valid transitions, triggers = MAVLink commands / RC inputs / failsafe conditions), and **highlights the current state in real time** from live `vehicle_status` uORB messages (received via MAVLink `HEARTBEAT` and `SYS_STATUS`).

**States to visualize:**
```
PREFLIGHT → STANDBY → ARMED
    ↓ (mode selection)
MANUAL → STABILIZED → ALTITUDE → POSITION → 
    AUTO:MISSION → AUTO:LOITER → AUTO:RTL → AUTO:LAND
    
Failsafe overlays: RC_LOSS, GPS_LOSS, LOW_BATTERY, GEOFENCE_BREACH
```

**Architecture:**
```
[MAVLink HEARTBEAT messages: base_mode, custom_mode fields]
    → [Python state decoder (pymavlink)]
    → [SZL FSM component: Cytoscape.js or D3-dag]
    → [Current node highlighted, transition history logged]
    → [Tooltip shows trigger condition + timestamp]
```

**Innovation:** This tab makes the **invisible Commander state machine legible** — a training tool for understanding drone autonomy, a debugging tool for mission replay, and a template for SZL's own state machine visualizations. Extend to show user-defined state machines (killinchu mission states, a11oy connection states) in the same framework.

**Implementation path:**
1. Parse `MAV_MODE_FLAG` and `MAV_STATE` from `HEARTBEAT` (standard MAVLink)
2. Cytoscape.js for graph rendering (MIT)
3. No flight code, no proprietary dependencies

---

### TAB 3: "Post-Quantum Receipt Bus" — Quantum-Secure Command Audit Log

**Grounded in:** NIST FIPS 203 ML-KEM ([NIST](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf)), NIST FIPS 204 ML-DSA ([NIST](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf)), NIST FIPS 205 SLH-DSA ([NIST](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.205.pdf)), OpenDefense `artifact-conduit` attestation pattern ([Apache 2.0](https://github.com/opendefensecloud/artifact-conduit))

**Concept:** A tab that demonstrates (and optionally implements) a **post-quantum-secure command receipt bus** — every drone command issued is:
1. Signed with **ML-DSA-65** by the operator (command authentication + non-repudiation)
2. Delivered over a channel established with **ML-KEM-768** key exchange (confidential datalink)
3. Logged to an append-only receipt ledger with **SLH-DSA-SHAKE-128s** timestamps (long-lived audit trail — even if lattice crypto is broken, the hash-based timestamp holds)

**Architecture:**
```
Operator issues command 
    → ML-DSA-65 sign (private key on HSM or software key)
    → ML-KEM-768 encrypt session key → AES-256-GCM encrypt payload
    → Transmit over datalink
    → Drone verifies ML-DSA signature + decapsulates ML-KEM session key
    → Command executed
    → Receipt appended to SLH-DSA-timestamped audit log
```

**The "Receipt Bus" innovation:** Inspired by OpenDefense's `artifact-conduit` attestation pattern — every command traversal is attested, with full provenance (who issued, when, what, drone acknowledged at what time). This creates a **doctrine-clean chain of custody** for autonomous system commands — the exact pattern needed for accountable AI in weapons systems (DoD AI Principles compliance).

**Implementation path:**
1. `liboqs` (Open Quantum Safe) — C library for FIPS 203/204/205, MIT/Apache license ([github.com/open-quantum-safe/liboqs](https://github.com/open-quantum-safe/liboqs))
2. Python bindings: `oqs-python` (Apache 2.0)
3. No proprietary crypto — pure NIST reference implementations
4. Visualize the receipt bus as a live-updating Gantt-style audit timeline in the SZL UI

**Demo value:** This tab positions SZL as a thought leader on PQC for autonomous systems — the first GCS-adjacent tool that shows quantum-secure command authentication in action, before it becomes mandatory under CNSA 2.0 (NSA's post-quantum algorithm suite for national security systems, requiring PQC migration by 2030–2035).

---

## APPENDIX: COMPANY OSS STATUS SUMMARY

| Company | GitHub | Real OSS? | License | Best transferable pattern |
|---|---|---|---|---|
| Astral Technology | [`github.com/astral-us`](https://github.com/astral-us) | ✅ Yes | Apache 2.0 | MAVLink/ROS2 SDK pattern |
| Ark Framework (academic) | [`github.com/Robotics-Ark/ark_framework`](https://github.com/Robotics-Ark/ark_framework) | ✅ Yes | Custom | Gym-style robot learning interface |
| Auterion / PX4 | [`github.com/auterion`](https://github.com/auterion) + [`github.com/PX4`](https://github.com/PX4) | ✅ Yes (major) | BSD-3 / MIT | uORB pub/sub, commander FSM, ROS2 bridge |
| MAVLink / MAVSDK / QGC | [`github.com/mavlink`](https://github.com/mavlink) | ✅ Yes (major) | BSD-3 / Apache 2.0 + GPL | Full GCS stack, telemetry, mission planning |
| BlueHalo (AeroVironment) | [`github.com/bluehalo`](https://github.com/bluehalo) | ✅ Partial (web libs) | MIT | ngx-leaflet geospatial map stack |
| Anduril | [`github.com/anduril`](https://github.com/anduril) | ✅ Partial (infra) | MIT | jetpack-nixos edge AI deployment |
| Helsing | [`github.com/helsing-ai`](https://github.com/helsing-ai) | ✅ Partial (utilities) | — | sguaba spatial math, drone acoustics ML |
| OpenDefense | [`github.com/opendefensecloud`](https://github.com/opendefensecloud) | ✅ Yes | Apache 2.0 | Artifact attestation / secure delivery pipeline |
| Mistral AI | [`github.com/mistralai`](https://github.com/mistralai) | ✅ Yes (major) | Apache 2.0 | Ministral 3B/8B/14B edge LLMs |
| Shield AI | [`github.com/shield-ai`](https://github.com/shield-ai) | ⚠️ Minimal | — | PX4-compatible bootloader (reference only) |
| Lockheed Martin | [`github.com/lmco`](https://github.com/lmco) | ⚠️ Infra only | — | SBOM tooling (not drone-relevant) |
| Palantir | [`github.com/palantir`](https://github.com/palantir) | ⚠️ SDK only | — | Defense ontology pattern |
| Post Quantum Labs | None | ❌ No | Closed | PQC decomposition for drone C2 (concept reference) |
| Tycho AI | None | ❌ No | Closed | VIO + satellite image matching nav pattern |
| NODA AI | None | ❌ No | Closed | Monte Carlo tactical simulation pattern |
| Nokturnal AI | None | ❌ No | Closed | ATAK plugin integration pattern |
| Breaker Industries | None | ❌ No | Closed | 1:N intent-based C2 concept |
| DAINAMIX | None | ❌ No | Closed | Decentralized swarm pattern (concept only) |
| Chord Robotics | None | ❌ No | Closed | Distributed edge autonomy concept |
| Hardy Dynamics | None | ❌ No | Closed | MAVLink/CoT interop concept |
| SwarmInt | None | ❌ No | Closed | Docker-containerized autonomy concept |
| Scientific Systems | None | ❌ No | Closed | Decentralized C2 / CAIN counter-UAS concept |
| Scout AI | [`github.com/scoutos`](https://github.com/scoutos) | ⚠️ CLI only | — | VLA foundation model concept |
| Skyeton | None | ❌ No | Closed | Anti-interceptor adaptive evasion concept |
| Data Blanket | None | ❌ No | Closed | Airforce-in-a-Box deployment concept |

---

## KEY CITATIONS

- [PX4 Architecture Documentation](https://docs.px4.io/main/en/concept/architecture.html)
- [PX4-Autopilot GitHub (BSD-3)](https://github.com/PX4/PX4-Autopilot)
- [MAVSDK GitHub (BSD-3)](https://github.com/mavlink/MAVSDK)
- [QGroundControl GitHub (Apache 2.0 / GPL)](https://github.com/mavlink/qgroundcontrol)
- [Auterion GitHub (82 repos)](https://github.com/auterion)
- [Auterion px4-ros2-interface-lib](https://github.com/auterion/px4-ros2-interface-lib)
- [Auterion mavlink-military (MIT)](https://github.com/auterion/mavlink-military)
- [astral-sdk GitHub (Apache 2.0)](https://github.com/astral-us/astral-sdk)
- [Robotics-Ark/ark_framework (169 stars)](https://github.com/Robotics-Ark/ark_framework)
- [Ark Framework paper arXiv:2506.21628](https://arxiv.org/abs/2506.21628)
- [bluehalo/ngx-leaflet (MIT, 805 stars)](https://github.com/bluehalo/ngx-leaflet)
- [Anduril jetpack-nixos (MIT, 228 stars)](https://github.com/anduril/jetpack-nixos)
- [OpenDefense artifact-conduit (Apache 2.0)](https://github.com/opendefensecloud/artifact-conduit)
- [Helsing GitHub org](https://github.com/helsing-ai)
- [Mistral 3 launch announcement (Apache 2.0)](https://mistral.ai/news/mistral-3/)
- [mistralai/mistral-inference (Apache 2.0)](https://github.com/mistralai/mistral-inference)
- [NIST FIPS 203 — ML-KEM](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf)
- [NIST FIPS 204 — ML-DSA](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf)
- [NIST FIPS 205 — SLH-DSA](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.205.pdf)
- [Post Quantum Labs official site](https://postquantumlabs.com)
- [Post Quantum Labs SBIR portfolio](https://www.sbir.gov/portfolio/2553625)
- [STV + Post-Quantum quantum-secure drone test (March 2026)](https://thequantuminsider.com/2026/03/31/stv-post-quantum-secure-drone-communications/)
- [Tycho AI Voyager autonomy stack](https://tycho.ai/voyager)
- [Tycho AI AFRL TRIDENT contract ($2M)](https://tycho.ai/news/tycho-ai-secures-2m-afrl-tacfi-contract-to-advance-maritime-autonomy-in-gps-denied-environments)
- [Helsing Centaur Gripen-E test flight](https://helsing.ai/newsroom/helsing-ai-agent-successfully-completes-saab-gripen-e-test-flight)
- [TRANSAR SAR detection paper arXiv:2504.13310](https://arxiv.org/abs/2504.13310)
- [NODA AI — Bessemer article](https://www.bvp.com/news/noda-ai-building-the-future-of-operational-collaborative-autonomy-at-the-frontlines)
- [DroneCrypt IFF — ML-KEM + ML-DSA in drone identification](https://decentcybersecurity.eu/quantum-resistant-cryptography-in-drone-identification/)
- [WolfSSL support for FIPS 203/204/205](https://www.wolfssl.com/support-for-the-official-post-quantum-standards-ml-kem-and-ml-dsa/)
- [PQShield embedded PQC library for FIPS 203/204/205](https://pqshield.com/embedded-post-quantum-cryptography-library-pqcryptolib/)
- [Open Quantum Safe liboqs library](https://github.com/open-quantum-safe/liboqs)

---

*Research compiled by SZL Holdings research subagent. All findings are from public sources. No proprietary code was accessed or reproduced.*
