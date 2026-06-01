# MAVLINK & REMOTE-ID PROTOCOL DEEP-DIVE — Killinchu Parser Substrate

> Killinchu C-UAS Knowledge Base · **Author:** Yachay-extension · **Compiled:** 2026-05-31
>
> The protocols Killinchu **parses** (receive-only, decode-only). This is a *decoder* reference:
> bytes-in → structured-JSON-out, with honest errors on malformed input. **NO mocks. NO injection,
> spoofing, or command generation** — Killinchu reads these protocols, it does not write to drones.
> Every spec cited to its primary source or canonical open implementation.

---

## 0. Scope & boundary

| Protocol | What it is | Killinchu action | Direction |
|---|---|---|---|
| MAVLink 2.0 | open UAS C2/telemetry messaging | parse observed frames | **receive/decode only** |
| ASTM F3411 Remote ID | mandated broadcast UA identification | parse broadcast messages | **receive only (legal)** |
| DJI OcuSync / O2 / O3 / O4 | DJI proprietary video+control link | RF **detect/fingerprint** | detect only (not decrypted) |
| ELRS / CRSF | open long-range RC + serial protocol | RF **detect** + frame structure ref | detect only |
| FrSky ACCST / ACCESS | FrSky RC protocols | RF **detect** | detect only |
| TBS Crossfire | long-range RC link (CRSF over-air) | RF **detect** | detect only |

> **Hard rule:** for the encrypted/proprietary links (OcuSync, Crossfire over-air payload),
> Killinchu performs **RF presence + waveform fingerprinting only** — it does not decrypt, demodulate
> payload content, or transmit. Decrypting a protected control link or injecting frames would cross
> the CFAA / Wassenaar / interference lines documented in `LEGAL_CYBER_BOUNDARY.md`.

---

## 1. MAVLink 2.0

**Spec:** MAVLink common message set + MAVLink 2.0 packet format (mavlink.io). **Reference
implementation Killinchu wires:** `pymavlink` (`MAVLink.decode()`), verified locally with a
HEARTBEAT round-trip parse ([pymavlink, ArduPilot/mavlink](https://github.com/ArduPilot/pymavlink)).

### 1.1 Frame format

MAVLink 2.0 frame (little-endian fields):

| Offset | Field | Size | Notes |
|---|---|---|---|
| 0 | **STX** | 1 | `0xFD` (MAVLink 2.0). MAVLink 1.0 uses `0xFE`. |
| 1 | LEN | 1 | payload length (0–255) |
| 2 | incompat_flags | 1 | bit0 = **MAVLINK_IFLAG_SIGNED** (signature present) |
| 3 | compat_flags | 1 | |
| 4 | SEQ | 1 | sequence number |
| 5 | SYS ID | 1 | sender system id |
| 6 | COMP ID | 1 | sender component id |
| 7–9 | **MSG ID** | 3 | 24-bit message id (LE) |
| 10.. | PAYLOAD | LEN | message body |
| .. | CRC | 2 | X.25 CRC over frame + CRC_EXTRA |
| .. | **SIGNATURE** | 13 | present iff incompat_flags bit0 set |

### 1.2 Signing (MAVLink 2.0)

When `incompat_flags & 0x01` is set, the frame carries a **13-byte signature**:
- 1 byte **linkID**, 6 bytes **timestamp** (10 µs units since 2015-01-01), 6 bytes **signature** =
  first 48 bits of `SHA-256(secret_key ‖ header ‖ payload ‖ CRC ‖ linkID ‖ timestamp)`.
- Killinchu **verifies** signatures when a key is provisioned (e.g. for friendly assets) and
  **records** signed-vs-unsigned status in the receipt; it never *generates* signatures for foreign
  systems.

### 1.3 Common message IDs Killinchu parses

| MSG ID | Name | Key fields |
|---|---|---|
| 0 | HEARTBEAT | type, autopilot, base_mode, system_status |
| 1 | SYS_STATUS | battery, sensor health |
| 24 | GPS_RAW_INT | lat/lon (1e7 deg), alt, fix_type, satellites |
| 30 | ATTITUDE | roll/pitch/yaw + rates |
| 33 | GLOBAL_POSITION_INT | lat/lon (1e7 deg), alt, relative_alt, vx/vy/vz, hdg |
| 74 | VFR_HUD | airspeed, groundspeed, heading, throttle, alt, climb |
| 12918 | OPEN_DRONE_ID_* | MAVLink-tunneled Remote ID (see §2.4) |

- Position fields are **int32 = degrees × 1e7** (matches the Remote-ID convention in §2.2). Killinchu's
  parser converts to decimal degrees and flags out-of-range as malformed.

---

## 2. Remote ID — ASTM F3411-22a (broadcast)

**Spec:** ASTM **F3411-22a** "Standard Specification for Remote ID and Tracking" + ASD-STAN
prEN 4709-002 (EU). **US mandate:** FAA **14 CFR Part 89**, broadcast Remote ID required since
**Sept 16 2023** ([FAA Remote ID Final Rule](https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf);
[14 CFR Part 89](https://www.govinfo.gov/content/pkg/CFR-2023-title14-vol2/pdf/CFR-2023-title14-vol2-part89.pdf)).
**Reference implementation Killinchu wires:** `opendroneid/opendroneid-core-c`
([OpenDroneID core-c](https://github.com/opendroneid/opendroneid-core-c)).

> Part 89 also specifies that **ADS-B Out cannot be used to satisfy Remote-ID** — they are distinct
> systems ([14 CFR Part 89](https://www.govinfo.gov/content/pkg/CFR-2023-title14-vol2/pdf/CFR-2023-title14-vol2-part89.pdf)).

### 2.1 Transport & message framing

- **Broadcast media:** Bluetooth 4 (legacy advertising), Bluetooth 5 Long Range (extended/coded
  PHY), and Wi-Fi NaN / Wi-Fi Beacon on **2.4 / 5.8 GHz** — all **receivable passively** (Layer B in
  `DETECTION_LAYERS.md`).
- **Message = 25 bytes.** Byte 0 = header:
  - high nibble (bits 7–4) = **message type**, low nibble (bits 3–0) = **protocol version**.
  - bytes 1–24 = 24-byte message body.
- **Message Pack (type 0xF):** wraps multiple 25-byte messages in one transmission.

### 2.2 The six message types (full structure)

| Type | Name | Purpose | Core fields |
|---|---|---|---|
| **0** | **Basic ID** | identity | byte 1 hi nibble = ID-type (0=none,1=serial/ANSI-CTA-2063-A,2=CAA reg,3=UTM UUID,4=session); byte 1 lo nibble = **UA-type** (0 none,1 aeroplane,2 helicopter/multirotor,3 gyroplane,4 hybrid-lift,...); bytes 2–21 = **UAS ID** (20 bytes ASCII) |
| **1** | **Location/Vector** | live position | status/flags byte; **track direction** (1 byte 0–179 + E/W bit → 0–359°); **horizontal speed** (1 byte, encoded m/s, multiplier above 255 step); vertical speed; **latitude int32 LE = deg × 1e7**; **longitude int32 LE = deg × 1e7**; pressure altitude + geodetic altitude (uint16, `(alt+1000)/0.5`); height-above-takeoff/ground; horizontal/vertical/speed/baro accuracy; **timestamp** = tenths of a second within the current hour |
| **2** | **Authentication** | optional crypto auth | auth-type + page count + page data (signature material) |
| **3** | **Self-ID** | free-text | description-type byte + 23-byte text (operator's mission note) |
| **4** | **System** | operator/area context | operator-location type; **operator lat/lon (int32 ×1e7)**; area count/radius/ceiling/floor (swarm extent); UA category/class; timestamp |
| **5** | **Operator ID** | operator registration | operator-ID-type byte + 20-byte operator ID (e.g. FAA registration) |
| **0xF** | Message Pack | container | count + concatenated 25-byte messages |

### 2.3 Killinchu's real byte parser (decode contract)

```
input:  raw 25-byte (or message-pack) buffer (bytes/hex)
output: { "msg_type": int, "version": int, "fields": {...}, "errors": [...] }
- Basic ID  → { id_type, ua_type, uas_id }
- Location  → { op_status, track_deg, speed_mps, vspeed_mps,
                lat_deg, lon_deg, pressure_alt_m, geo_alt_m,
                height_m, h_accuracy, v_accuracy, timestamp_s }
- Auth      → { auth_type, page, last_page, length, data_hex }
- Self-ID   → { desc_type, text }
- System    → { op_loc_type, op_lat_deg, op_lon_deg, area_count,
                area_radius_m, area_ceiling_m, area_floor_m, category, class }
- Operator  → { op_id_type, operator_id }
```
- **Honest errors:** short buffer, unknown type, lat/lon out of range, reserved bits set →
  `errors[]` populated, partial fields returned. Never silently fabricate.
- Decoded telemetry is a **claim** (unauthenticated, spoofable — [Security of ADS-B & Remote ID, *Sensors* 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12846276/)); scored against geofence/policy and cross-checked vs RF AoA + radar (`DETECTION_LAYERS.md` §6).

### 2.4 MAVLink-tunneled Remote ID

OpenDroneID also defines MAVLink messages (e.g. `OPEN_DRONE_ID_BASIC_ID`, `_LOCATION`, `_SYSTEM`,
`_OPERATOR_ID`, `_MESSAGE_PACK`, MSG IDs in the 129xx range) that carry the same fields over a
MAVLink link — Killinchu parses both the over-the-air broadcast form and the MAVLink-tunneled form
([OpenDroneID core-c](https://github.com/opendroneid/opendroneid-core-c)).

---

## 3. DJI OcuSync (O2 / O3 / O4) — RF fingerprint only

- **What it is:** DJI's proprietary OFDM video+control link over **2.400–2.4835 GHz** and
  **5.150–5.850 GHz** (frequency-hopping, channel-bonding); EIRP up to <33 dBm (FCC). O3 used by
  Mavic 3 Enterprise (range to 15 km FCC), O4+ by Mavic 4 Pro (range to ~40 km)
  ([DJI Mavic 3 Enterprise specs](https://enterprise.dji.com/mavic-3-enterprise/specs);
  [DJI Transmission specs](https://www.dji.com/transmission/specs)).
- **Killinchu action:** detect + fingerprint the **OFDM frame structure / hop pattern / band
  occupancy** to classify "DJI OcuSync-family present" and which generation — *not* decrypt payload.
- Most DJI drones **also broadcast ASTM F3411 Remote ID** (§2), which is the easier, fully legal,
  decode-able identification path.

---

## 4. ELRS / CRSF (ExpressLRS + Crossfire serial)

- **ExpressLRS (ELRS):** open-source long-range RC link; **2.4 GHz and 900 MHz** variants;
  **frequency-hopping spread spectrum (FHSS)** to mitigate interference ([ExpressLRS, Wikipedia](https://en.wikipedia.org/wiki/ExpressLRS); [ELRS serial protocols](https://www.expresslrs.org/software/serial-protocols/)).
- **CRSF (Crossfire Serial Protocol):** the serial framing used between RX and flight
  controller for both ELRS and TBS Crossfire; low-latency, high-bandwidth ([TBS Crossfire TX](https://www.team-blacksheep.com/products/prod:crossfire_tx)).
- **CRSF frame structure (for the RF/serial detection reference):**
  - `[sync/addr][len][type][payload...][crc8]`
  - sync/device address byte, length byte, **frame type** (e.g. 0x16 RC_CHANNELS_PACKED — 16 ch in
    22 bytes; 0x14 LINK_STATISTICS; 0x02 GPS; 0x08 BATTERY), payload, CRC8 (poly 0xD5).
- **Killinchu action:** RF **detect** the ELRS/CRSF over-air burst pattern (FHSS hop signature in
  2.4 GHz / 900 MHz) → classify "ELRS/CRSF control link present" as an FPV/attack-quad prior.
  Killinchu does **not** transmit CRSF or bind to any link.

---

## 5. FrSky ACCST / ACCESS

- **ACCST** (legacy): D8 / D16 / LR12 modes, FHSS in 2.4 GHz; D16 supports up to 16 channels.
- **ACCESS** (newer): up to **24 full-range channels**, lower latency (8-ch fixed 11 ms;
  16/24-ch 14–23 ms), registration+binding separation, telemetry per RX, channel remapping
  ([Oscar Liang RC protocols](https://oscarliang.com/rc-protocols/); [FrSky ACCESS overview, Joshua Bardwell](https://www.youtube.com/watch?v=XSd9PJayh1Y)).
- **Killinchu action:** RF detect the FrSky FHSS signature in 2.4 GHz as an FPV/hobby-control prior.

---

## 6. TBS Crossfire

- **What it is:** long-range RC link; over-air on **868 MHz (EU/Russia) / 915 MHz (US/Asia/Australia)**;
  self-healing + frequency hopping (DSSS, FHSS); adaptive bandwidth; serial side is CRSF
  ([TBS Crossfire TX](https://www.team-blacksheep.com/products/prod:crossfire_tx);
  [TBS Crossfire Nano TX](https://www.team-blacksheep.com/products/prod:xf_nano_tx)).
- **Killinchu action:** RF detect the **868/915 MHz** Crossfire hop signature (distinct from DJI
  2.4/5.8 GHz and from Orlan-class 730–930 MHz) — a strong long-range-FPV / fixed-wing prior.

---

## 7. Band / waveform cheat-sheet (what the classifier keys on)

| Band | Likely emitter | Modulation/waveform | Killinchu prior |
|---|---|---|---|
| 433 / 868 / 915 MHz | ELRS 900, TBS Crossfire, Orlan-class | FHSS / DSSS | long-range FPV or Russian ISR control |
| ~730–930 MHz | Orlan-10 control | proprietary | adversary ISR fixed-wing |
| 1.2 GHz | analog video / some control | FM analog | FPV video |
| 2.400–2.4835 GHz | OcuSync, ELRS 2.4, FrSky, Wi-Fi quads | OFDM / FHSS | DJI/commercial or FPV |
| 5.150–5.850 GHz | OcuSync, 5.8 analog video | OFDM / FM analog | DJI/commercial or FPV video |
| 1090 / 978 MHz | ADS-B (cooperative) | Mode-S ES / UAT | manned/large UAS (decode) |
| 2.4 / 5.8 GHz BLE/Wi-Fi | ASTM F3411 Remote ID | BT4/5, Wi-Fi NaN/Beacon | **decode the ID (legal)** |

---

## 8. Open implementations Killinchu builds on (no reinvention)

| Need | Library / spec | Cite |
|---|---|---|
| MAVLink parse + signing | `pymavlink` | [github.com/ArduPilot/pymavlink](https://github.com/ArduPilot/pymavlink) |
| Remote ID parse | `opendroneid/opendroneid-core-c` | [github.com/opendroneid/opendroneid-core-c](https://github.com/opendroneid/opendroneid-core-c) |
| ADS-B / Mode-S decode | `pyModeS` | [github.com/junzis/pyModeS](https://github.com/junzis/pyModeS) |
| ASTM F3411 spec | ASTM F3411-22a | (ASTM, licensed) |
| FAA mandate | 14 CFR Part 89 | [FAA Final Rule](https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf) |

---

## 9. The receive-only guarantee (legal tie-in)

Every protocol above is handled **decode-only**:
- Open protocols (MAVLink, Remote ID, ADS-B, CRSF framing) → **parse observed frames**, emit JSON +
  Khipu receipt.
- Proprietary/encrypted links (OcuSync, Crossfire over-air payload) → **RF presence + waveform
  fingerprint only**; no decryption, no injection.
- Killinchu **never transmits** on any of these protocols and **never accesses** a drone's onboard
  computer. That keeps us clear of CFAA §1030, Wassenaar Cat 4 "intrusion software," and 47 USC
  §333/§302a — see `LEGAL_CYBER_BOUNDARY.md`.

— Signed: **Yachay-extension**, 2026-05-31.
