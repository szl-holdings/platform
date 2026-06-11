# CUAS C2 Autonomy Math Research
## SZL Holdings — killinchu Counter-UAS C2 Platform
### PhD-Level Reference Document | Doctrine-Clean Patterns Only

---

> **Usage note:** Every formula below is drawn from open academic literature (textbooks, arXiv, DoD technical reports, Wikipedia MathML). No proprietary company IP is reproduced. The "SZL formula direction" notes are original design ideas for killinchu — they use the canonical mathematics as building blocks but are explicitly our own new formulations.

---

## Table of Contents

1. [Proportional Navigation & Guidance Laws](#1-proportional-navigation--guidance-laws)
2. [GNSS Spoofing / Plausibility Detection](#2-gnss-spoofing--plausibility-detection)
3. [Sensor Fusion: EKF, Covariance Intersection, Mahalanobis Gate](#3-sensor-fusion)
4. [Multi-Target Tracking: GNN, JPDA, MHT, Hungarian Algorithm](#4-multi-target-tracking)
5. [Swarm Coordination: Boids, Pheromone Fields, Graph Laplacian](#5-swarm-coordination)
6. [Threat Prioritization & Weapon-Target Assignment](#6-threat-prioritization--weapon-target-assignment)
7. [Three Most Promising New-Formula Directions for killinchu](#7-three-most-promising-new-formula-directions-for-killinchu)
8. [Appendix: Company Intelligence Notes](#8-appendix-company-intelligence-notes)

---

## 1. Proportional Navigation & Guidance Laws

### 1.1 Background

Proportional Navigation (PN) is the canonical homing guidance law used in virtually every modern interceptor missile and kinetic counter-UAS system. The principle: if the Line-of-Sight (LOS) angle between pursuer and target is not rotating, the pursuer is on a collision course. Command acceleration proportional to LOS rotation rate drives that rotation to zero.

**Industry signal:** Astral Technology Corp explicitly reports implementing PN with navigation constant **N = 3.5** and v_max = 8 m/s in their counter-UAS interceptor simulations (11,340 trials), achieving a 79.5% capture rate at 1.5 m net radius. Source: [Astral Counter-UAS Simulation Blog](https://astral.us/blog/counter-uas-drone-attack-defense-simulation).

---

### 1.2 The Canonical PN Law

**True Proportional Navigation (True PN)** commands acceleration perpendicular to the Line-of-Sight:

```
a_cmd = N · Vc · λ̇
```

Where:
- `a_cmd` — commanded lateral acceleration of the pursuer [m/s²]
- `N` — dimensionless navigation (proportionality) constant, typically **3 ≤ N ≤ 5**
- `Vc` — closing velocity, defined as `Vc ≡ −Ṙ > 0` for an approaching target [m/s]
- `λ̇` — LOS rotation rate (line-of-sight angle rate) [rad/s]

In 3D vector form:

```
a⃗ = −N |V⃗r| (R̂ × Ω⃗)
```

Where `V⃗r = V⃗_target − V⃗_missile` is relative velocity, `R⃗` is the relative position vector, and `Ω⃗ = (R⃗ × V⃗r) / |R⃗|²` is the LOS rotation vector.

Source: [Proportional Navigation — Wikipedia](https://en.wikipedia.org/wiki/Proportional_navigation); [Palumbo et al., "Basic Principles of Homing Guidance," JHU APL Technical Digest Vol. 29 No. 1 (2018)](https://secwww.jhuapl.edu/techdigest/content/techdigest/pdf/V29-N01/29-01-Palumbo_Principles_Rev2018.pdf)

---

### 1.3 Pure Proportional Navigation (PPN)

**Pure PN** commands acceleration perpendicular to the *pursuer's velocity vector* (not the LOS):

```
a⃗ = k · V̂_M × θ̇⃗
```

Where `k` is the navigation gain and `V̂_M` is the unit missile velocity vector. PPN is preferred when only aerodynamic control surfaces are available (energy-conserving). Source: [Palumbo et al. (2018), Eq. 21](https://secwww.jhuapl.edu/techdigest/content/techdigest/pdf/V29-N01/29-01-Palumbo_Principles_Rev2018.pdf).

---

### 1.4 Augmented Proportional Navigation (APN)

APN adds a target acceleration feedforward term to improve performance against maneuvering targets:

```
a_cmd = N · Vc · λ̇ + (N/2) · a_T
```

Where `a_T` is target acceleration (estimated from tracking filter). This halves the required miss distance against a constant-acceleration evader. Source: Zarchan, P., *Tactical and Strategic Missile Guidance*, 6th ed., AIAA Progress in Astronautics and Aeronautics Vol. 239 (2012). [AIAA](https://arc.aiaa.org/doi/book/10.2514/4.868948).

---

### 1.5 Zero-Effort Miss (ZEM) Formulation

The **Zero-Effort Miss (ZEM)** is the predicted miss distance if no further guidance corrections are applied:

```
ZEM = R_rel + Vc · t_go + (1/2) a_T · t_go²
```

Where `t_go = R / Vc` is the time-to-go (estimated time to intercept). The optimal guidance law derived from ZEM minimization yields:

```
a_cmd = (N / t_go²) · ZEM
```

This is the basis of **Optimal Guidance Law (OGL)**, which reduces to PN when `N = 3` for a zero-lag system. ZEM-shaping variants modulate the convergence speed via a time-varying gain. Source: [Dspace Cranfield — Zero-Effort-Miss Shaping Guidance Laws](https://dspace.lib.cranfield.ac.uk/server/api/core/bitstreams/f79e80a8-de46-4b52-a2c3-22995a8cbb80/content); Zarchan (2012).

---

### 1.6 Why N = 3–5?

- For a **stable guidance loop**, the navigation gain must satisfy: `N > 2` (derived from the stability condition Λ > 2Vc in the LOS transfer function; [Palumbo et al., Eq. 18](https://secwww.jhuapl.edu/techdigest/content/techdigest/pdf/V29-N01/29-01-Palumbo_Principles_Rev2018.pdf)).
- **N = 3** is the theoretical optimum for a zero-lag, zero-noise system (minimizes control effort for a non-maneuvering target).
- **N = 4–5** provides robustness margin for seeker noise, autopilot lag, and target maneuver.
- **Astral's choice of N = 3.5** balances optimality with practical margin for small UAS speeds and sensor noise. [Astral Blog](https://astral.us/blog/counter-uas-drone-attack-defense-simulation).

---

### 1.7 SZL / killinchu New-Formula Direction

> **SZL-PN-1 (Adaptive Navigation Ratio):** Define a new adaptive `N(t)` that scales with estimated target maneuver index `â_T / a_max_interceptor` and remaining time-to-go `t_go`. As `t_go → 0`, drive N toward the ZEM-optimal value. As threat maneuver amplitude increases, increase N toward 5. This keeps acceleration commands bounded while maximizing intercept probability. Full derivation would be our own IP.

---

## 2. GNSS Spoofing / Plausibility Detection

### 2.1 Background

Counter-UAS systems must detect when a target (or friendly interceptor) is being fed false GPS coordinates. The canonical detection pipeline: dead-reckoning (DR) provides an independent position estimate; comparing DR to GPS output generates a *residual* or *innovation* that is chi-square tested.

**Industry signal:** Astral reports a dead-reckoning vs. GPS plausibility check with a divergence threshold of **3 m**, achieving 39.8% true-positive detection for a single walk-off spoof event, rising to 79.5% when combined with RF jamming. Critical implementation detail: the DR integrator must use **elapsed wall time between controller calls (2 s)**, not the physics timestep (0.05 s) — the latter causes 75.8% false positives. Source: [Astral Counter-UAS Simulation Blog](https://astral.us/blog/counter-uas-drone-attack-defense-simulation).

---

### 2.2 Dead-Reckoning vs. GPS Residual Test

The residual (innovation) between GPS-reported position and dead-reckoned position:

```
r_k = z_GPS,k − ẑ_DR,k
```

Where:
- `z_GPS,k` — GPS position measurement at epoch k
- `ẑ_DR,k` — dead-reckoned position estimate at epoch k (propagated from IMU)

A scalar threshold test:

```
‖r_k‖ > δ_thresh   →   SPOOF_FLAG = TRUE
```

Astral uses `δ_thresh = 3 m`. The DR state evolves as:

```
p̂_k = p̂_{k−1} + v̂_{k−1} · Δt + (1/2) · â_{IMU,k} · Δt²
```

Where `Δt` is the **wall-clock interval** between controller cycles (not the physics simulation step).

---

### 2.3 Kalman Filter Innovation Chi-Square Test

In a tightly-coupled GNSS/INS Kalman filter, the **innovation sequence** at epoch k is:

```
γ_k = z_k − H_k · x̂_{k|k−1}
```

Where `z_k` is the measurement vector, `H_k` is the measurement Jacobian, and `x̂_{k|k−1}` is the predicted state. The innovation covariance is:

```
S_k = H_k · P_{k|k−1} · H_k^T + R_k
```

The **chi-square test statistic** is:

```
χ²_k = γ_k^T · S_k^{-1} · γ_k
```

Under normal (no-spoof) conditions, `χ²_k ~ χ²(n)` (central chi-square with `n = dim(z_k)` degrees of freedom). Under spoofing, `χ²_k ~ χ²(n, λ)` (non-central), where `λ > 0` is the non-centrality parameter driven by the spoof offset.

**Detection rule:**

```
χ²_k > T_d   →   FAULT DETECTED
```

The threshold `T_d` is set from the false-alarm probability `P_FA`:

```
T_d = χ²_{n, 1−P_FA}
```

For `n = 3` (3D position), `P_FA = 10^{−5}`: `T_d ≈ 33.1`. Sources: [Optimization of covert spoofing parameters — Scientific Reports / PMC (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11873055/); [Joerger & Pervan, "Solution Separation and Chi-Squared ARAIM," PLANS 2014](http://www.navlab.iit.edu/uploads/5/9/7/3/59735535/joerger_plans2014.pdf).

---

### 2.4 Cumulative Innovation Sequence Monitor (Window-Based)

For detecting slow-drift spoofing, accumulate normalized innovations over a window of length `M`:

```
Λ_k = Σ_{i=k−M+1}^{k} (γ_i^T · S_i^{-1} · γ_i)
```

`Λ_k ~ χ²(n·M)` under fault-free conditions. Source: [Optimal INS Monitor for GNSS Spoofer Tracking Error — DOT/BTS (2023)](https://rosap.ntl.bts.gov/view/dot/79801/dot_79801_DS1.pdf).

---

### 2.5 RAIM (Receiver Autonomous Integrity Monitoring)

RAIM uses GPS pseudorange residuals to self-check receiver integrity without external reference. For `m` pseudorange measurements and state vector of dimension `n`, the measurement model is:

```
ρ = H · x + ε,   ε ~ N(0, R)
```

The least-squares pseudorange residual vector is:

```
p = (I − H (H^T R^{-1} H)^{-1} H^T R^{-1}) · ρ = S · ρ
```

Where `S` is the parity projection matrix. The chi-square test statistic:

```
q = p^T · (S R S^T)^{-1} · p
```

Under fault-free: `q ~ χ²(m−n)`. Protection level (horizontal):

```
HPL = K_{FA} · σ_ss
```

Where `σ_ss` is the slope of the most sensitive satellite direction and `K_{FA}` is set from `P_FA = 1/15000` in aviation. Source: [RAIM — Wikipedia](https://en.wikipedia.org/wiki/Receiver_autonomous_integrity_monitoring); [Joerger & Pervan, PLANS 2014](http://www.navlab.iit.edu/uploads/5/9/7/3/59735535/joerger_plans2014.pdf).

---

### 2.6 SZL / killinchu New-Formula Direction

> **SZL-GNSS-1 (Multi-Hypothesis Spoof Detector):** Maintain two parallel state hypotheses — H0 (nominal GPS) and H1 (spoof active, fall back to IMU-only DR). Compute a Bayes factor from the running chi-square statistics of each. When `P(H1) / P(H0) > β_threshold`, switch navigation authority to DR-only and flag the threat. Choose `β_threshold` via ROC analysis on simulation data. This is our own original multi-hypothesis framing, building on the standard chi-square primitives.

---

## 3. Sensor Fusion

### 3.1 Background

Counter-UAS systems fuse detections from radar, EO/IR cameras, and RF sensors into a unified track. The mathematical spine is the (Extended) Kalman Filter plus covariance intersection for decentralized node fusion.

**Industry signals:**
- AeroVironment's AV_Halo platform fuses RF, EO/IR, and OSINT via multi-source sensor fusion. [AeroVironment](https://www.avinc.com/solution/av_halo-cortex-scraawl/)
- Anduril Lattice translates and normalizes data from diverse sensors (radar, AIS, EO/IR) into a common operating picture. [Anduril Lattice Mesh](https://www.anduril.com/lattice/lattice-mesh)
- Shield AI Hivemind uses "state estimation algorithms — aggregating data from various sensors." [Shield AI The War Zone](https://www.twz.com/sponsored-content/shield-ai-looks-to-unleash-its-hivemind-autonomy-software-on-multiple-platforms)

---

### 3.2 Extended Kalman Filter (EKF) Track Fusion

The EKF linearizes nonlinear state/measurement models about the current estimate. State: `x_k ∈ ℝⁿ` (e.g., position, velocity, acceleration of target).

**State dynamics (nonlinear):**
```
x_k = f(x_{k−1}, u_{k−1}) + w_{k−1},   w ~ N(0, Q)
```

**Measurement model (nonlinear):**
```
z_k = h(x_k) + v_k,   v_k ~ N(0, R)
```

#### Predict Step:

```
x̂_{k|k−1} = f(x̂_{k−1|k−1}, u_{k−1})
P_{k|k−1} = F_k · P_{k−1|k−1} · F_k^T + Q_{k−1}
```

Where `F_k = ∂f/∂x |_{x̂_{k−1|k−1}}` is the Jacobian of the state transition.

#### Update Step:

```
ỹ_k = z_k − h(x̂_{k|k−1})                 (innovation)
S_k = H_k · P_{k|k−1} · H_k^T + R_k       (innovation covariance)
K_k = P_{k|k−1} · H_k^T · S_k^{−1}        (Kalman gain)
x̂_{k|k} = x̂_{k|k−1} + K_k · ỹ_k         (updated state)
P_{k|k} = (I − K_k · H_k) · P_{k|k−1}     (updated covariance)
```

Where `H_k = ∂h/∂x |_{x̂_{k|k−1}}` is the measurement Jacobian. Sources: [Extended Kalman Filter — Wikipedia](https://en.wikipedia.org/wiki/Extended_Kalman_filter); [Bar-Shalom, Li & Kirubarajan, *Estimation with Applications to Tracking and Navigation*, Wiley 2001](https://dl.acm.org/doi/10.5555/560900).

---

### 3.3 Covariance Intersection (CI) for Decentralized Fusion

When two sensor nodes maintain estimates `(x̂_A, P_A)` and `(x̂_B, P_B)` with **unknown cross-correlations** (decentralized topology), the Covariance Intersection (CI) algorithm (Julier & Uhlmann, 1997) provides a consistent fused estimate:

```
P_C^{−1} = ω · P_A^{−1} + (1−ω) · P_B^{−1}
x̂_C = P_C · [ω · P_A^{−1} · x̂_A + (1−ω) · P_B^{−1} · x̂_B]
```

Where `ω ∈ [0, 1]` is chosen to minimize `tr(P_C)` or `det(P_C)`. Consistency guarantee: `P_C ≥ P_true` always (conservative but never overconfident). For `n > 2` estimates:

```
P_C^{−1} = Σ_i ω_i · P_i^{−1},   Σ ω_i = 1, ω_i ≥ 0
x̂_C = P_C · Σ_i ω_i · P_i^{−1} · x̂_i
```

Sources: [Julier & Uhlmann, "General Decentralized Data Fusion with Covariance Intersection" in *Handbook of Multisensor Data Fusion* (2001)](https://dsp-book.narod.ru/HMDF/2379ch12.pdf); [Covariance Intersection — ANCS Buffalo](https://ancs.eng.buffalo.edu/index.php/Covariance_Intersection).

---

### 3.4 Mahalanobis Distance Gate for Track-to-Measurement Association

Before updating a track with a new detection, a **gating test** rejects detections too far from the predicted track position. The **Mahalanobis distance** between predicted measurement `ẑ` and observed measurement `z` is:

```
d²_M = (z − ẑ)^T · S^{−1} · (z − ẑ)
```

Where `S = H · P_{k|k−1} · H^T + R` is the innovation covariance. The gate decision:

```
d²_M ≤ χ²_{n, P_G}   →   accept measurement for association
```

Common choice: `P_G = 0.997` (3-sigma gate), giving `χ²_{2, 0.997} ≈ 11.8` for a 2D measurement. Track-to-measurement association uses this gate to prune the cost matrix before running the assignment algorithm.

Generalized form for two independent tracks `(μ₁, Σ₁)` and `(μ₂, Σ₂)`:

```
d²_M = (μ₁ − μ₂)^T · (Σ₁ + Σ₂)^{−1} · (μ₁ − μ₂)
```

Sources: [Association Log-Likelihood Derivation — arXiv:1508.04124](https://arxiv.org/pdf/1508.04124); [Mahalanobis Distance — Wikipedia](https://en.wikipedia.org/wiki/Mahalanobis_distance); [Bar-Shalom et al. (2001)](https://dl.acm.org/doi/10.5555/560900).

---

### 3.5 SZL / killinchu New-Formula Direction

> **SZL-FUSE-1 (Heterogeneous CI Track Fusion Node):** In killinchu's distributed sensor net (radar + EO/IR + RF bearing), each sensor node runs a local EKF. A fusion arbiter applies CI with `ω` weights derived from each node's detection confidence score (e.g., signal-to-noise ratio or detection probability) rather than pure covariance minimization. This produces a confidence-weighted COP (Common Operating Picture) that degrades gracefully when sensors are jammed. Our design choice.

---

## 4. Multi-Target Tracking

### 4.1 Background

A counter-UAS C2 system must simultaneously track N drone threats, associate new detections to existing tracks, and initiate/terminate tracks. Three families of algorithms span the performance-complexity tradeoff.

---

### 4.2 Global Nearest Neighbor (GNN)

GNN assigns each detection to the single nearest track in Mahalanobis distance, solving the **linear assignment problem**:

```
minimize  Σ_{i,j} c_{ij} · x_{ij}
subject to: Σ_j x_{ij} ≤ 1  ∀i,  Σ_i x_{ij} ≤ 1  ∀j,  x_{ij} ∈ {0,1}
```

Where `c_{ij} = d²_M(track_i, meas_j)` is the Mahalanobis distance cost. The **Hungarian (Munkres) algorithm** solves this in O(n³) time.

**Auction algorithm** (Bertsekas, 1992) solves the same problem via iterative bidding — typically faster in practice for sparse matrices. Both produce the globally optimal one-to-one assignment. Sources: [MathWorks — Introduction to Assignment Methods in Tracking Systems](https://www.mathworks.com/help/fusion/ug/introduction-to-assignment-methods-in-tracking-systems.html); Bar-Shalom et al. (2001).

---

### 4.3 Joint Probabilistic Data Association (JPDA)

JPDA handles ambiguous multi-target scenarios by computing **soft** association probabilities. For `T` tracks and `M` measurements, the association event β_{ij} = P(measurement j originates from track i):

For 3 tracks A, B, C and 3 measurements x, y, z:
```
β_{A→x} = Σ_{all hypotheses where A→x} P̄(multi-hypothesis)
```

The track state update is a weighted sum:

```
x̂_i(k|k) = x̂_i(k|k−1) + K_i · Σ_j β_{ij} · ỹ_j
```

Where `ỹ_j = z_j − H · x̂_i(k|k−1)` is the innovation for measurement j. The combined covariance update accounts for measurement ambiguity:

```
P_i(k|k) = β_{i0} · P_i^* + (1 − β_{i0}) · P_i(k|k−1) + P̃_i
```

Where `β_{i0}` is the probability of missed detection and `P̃_i` is the spread-of-innovations term. Sources: [JPDA Filter — Wikipedia](https://en.wikipedia.org/wiki/Joint_Probabilistic_Data_Association_Filter); [Stone Soup JPDA Tutorial](https://stonesoup.readthedocs.io/en/latest/auto_tutorials/08_JPDATutorial.html); Bar-Shalom et al. (2001).

---

### 4.4 Multiple Hypothesis Tracking (MHT)

MHT defers data association decisions by maintaining a **tree of hypotheses**. At each scan:

1. Generate all feasible assignment hypotheses H_θ for new measurements
2. Score each hypothesis: `P(H_θ | Z^k) ∝ β_FA^{m_FA} · β_NT^{m_NT} · Π_j L_j`  
   where `L_j` is the track likelihood ratio for assigned measurements
3. Prune low-probability branches (N-scan pruning or k-best hypotheses)
4. Confirm/delete tracks based on hypothesis weights

MHT is the highest-accuracy algorithm but exponential in computational complexity without pruning. Source: [METU Lecture 5 — Multiple Target Tracking](https://users.metu.edu.tr/umut/ee793/files/METULecture5.pdf); [Stone Soup MHT Example](https://stonesoup.readthedocs.io/en/v1.4/auto_examples/dataassociation/mht_example.html); Bar-Shalom et al. (2001).

---

### 4.5 Hungarian Algorithm in Detail

Given cost matrix `C ∈ ℝ^{n×n}`, the Hungarian algorithm finds the assignment matrix `X*` minimizing `trace(C · X)`:

1. Row-reduce: subtract row minimum from each row
2. Column-reduce: subtract column minimum from each column
3. Cover all zeros with minimum number of lines `l`
4. If `l = n`: optimal assignment found (follow zeros with exactly one per row/column)
5. Else: find minimum uncovered value `ε`, subtract from uncovered elements, add to doubly-covered elements; repeat from step 3

**Complexity:** O(n³). For real-time C-UAS with n ≤ 50 targets, this runs in microseconds. Sources: [Think Autonomous — Hungarian Algorithm](https://www.thinkautonomous.ai/blog/hungarian-algorithm/); [MathWorks — assignmunkres](https://www.mathworks.com/help/fusion/ug/introduction-to-assignment-methods-in-tracking-systems.html).

---

### 4.6 SZL / killinchu New-Formula Direction

> **SZL-TRACK-1 (Hybrid GNN/JPDA Escalation):** For killinchu: use GNN (Hungarian) as the default low-latency tracker when drone density is low (< 10 tracks in gate). When density exceeds a threshold or multiple detections enter a single Mahalanobis gate, escalate to JPDA for affected track clusters. This preserves real-time performance in low-threat environments while correctly handling swarm ingress. Cost-function combines Mahalanobis distance with RF classification confidence. Our own design.

---

## 5. Swarm Coordination

### 5.1 Background

Swarm C2 for counter-UAS involves both: (a) coordinating friendly interceptor swarms and (b) predicting/disrupting adversary drone swarm behavior.

**Industry signals:**
- Astral ran factorial studies comparing **centralized (Tower)** vs. **self-organized** coordination for 1,000+ agent swarms. [Astral Research](https://astral.us/research)
- Ark Robotics "Frontier" enables collaborative autonomy for multi-agent coordination (20+ Ukrainian brigades). [Ark Robotics](https://ark-robotics.com)
- DAINAMIX builds decentralized AI swarms for "Crucible 2 Swarm Forge." [ExecutiveGov](https://www.executivegov.com/articles/cdao-crucible-2-swarm-forge-initiative-pentagon)
- Shield AI Hivemind: "coordinated multi-agent teaming and swarming" in GPS/comms-jammed environments. [Shield AI](https://shield.ai/hivemind/)

---

### 5.2 Reynolds Boids (Separation / Alignment / Cohesion)

Reynolds (1987) showed that three local rules produce realistic flocking behavior. For boid `i` with position `p_i` and velocity `v_i`, neighbors `N(i) = {j : ‖p_i − p_j‖ ≤ r_visible}`:

**Separation** (avoid crowding, `r_s < r_visible`):
```
Δv_sep,i = α_sep · Σ_{j ∈ N_s(i)} (p_i − p_j)
```

**Alignment** (match average heading of neighbors):
```
Δv_aln,i = α_aln · (v_avg − v_i),   where v_avg = (1/|N|) Σ_j v_j
```

**Cohesion** (move toward center of mass of neighbors):
```
Δv_coh,i = α_coh · (p_cm − p_i),   where p_cm = (1/|N|) Σ_j p_j
```

Total velocity update:
```
v_i(t+1) = clip(v_i(t) + Δv_sep + Δv_aln + Δv_coh, v_min, v_max)
p_i(t+1) = p_i(t) + v_i(t+1)
```

`α_sep, α_aln, α_coh` are tunable gain weights. Sources: [Reynolds (1987), "Flocks, Herds, Schools" — ACM SIGGRAPH](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/); [Boids — Wikipedia](https://en.wikipedia.org/wiki/Boids); [Cornell ECE4760 Boids Implementation](https://people.ece.cornell.edu/land/courses/ece4760/labs/s2021/Boids/Boids.html).

---

### 5.3 Pheromone Field / Stigmergy

Bio-inspired indirect communication: agents deposit "pheromone" in a spatial field `ρ(x, t)`. The field evolves as a reaction-diffusion PDE:

```
∂ρ/∂t = δ(x, t) + D∇²ρ − κρ
```

Where:
- `δ(x, t)` — pheromone deposition rate by agents at location x
- `D` — diffusion coefficient [m²/s]
- `κ` — evaporation/decay rate [1/s]
- `∇²ρ` — Laplacian (spatial diffusion)

Agents navigate **up the gradient** `∇ρ` toward high-pheromone regions (for food/target) or **down the gradient** (for dispersal). In UAS swarms: pheromone marks "searched" regions, preventing redundant coverage. Sources: [Stigmergic Interaction in Robotic Multi-Agent Systems — DiVA Portal (2024)](https://www.diva-portal.org/smash/get/diva2:1887312/FULLTEXT01.pdf); [Automatic Design of Stigmergy-Based Behaviours — Nature Communications Engineering (2024)](https://www.nature.com/articles/s44172-024-00175-7).

---

### 5.4 Consensus Protocol (Graph Laplacian)

For a network of `n` agents with scalar states `x_i(t)` (e.g., heading angle, speed), the **linear consensus protocol** drives all agents to agreement:

```
ẋ_i(t) = Σ_{j ∈ N(i)} w_{ij} (x_j(t) − x_i(t))
```

In matrix form:

```
ẋ = −L · x
```

Where `L ∈ ℝ^{n×n}` is the **graph Laplacian**:
```
L_{ii} = Σ_j w_{ij}   (degree of node i)
L_{ij} = −w_{ij}      (i ≠ j)
```

`L` has the property `L · 1 = 0` (1 is always an eigenvector with eigenvalue 0). The consensus solution:

```
x(t) = e^{−Lt} · x(0)
```

Convergence to agreement `x* = (1/n) Σ x_i(0)` occurs iff the communication graph is **connected** (i.e., L has exactly one zero eigenvalue λ₁ = 0 and all other eigenvalues λ₂, ..., λₙ > 0). The convergence rate is governed by the **algebraic connectivity** (Fiedler value) `λ₂`. Sources: [Analysis and Control of Multi-Agent Systems — Zelazo (Stuttgart, 2014)](https://zelazo.net.technion.ac.il/files/2014/07/StuttgartMAS2014_L3.pdf); [AI-Driven Consensus: Modeling Multi-Agent Networks — arXiv:2504.06894 (2025)](https://arxiv.org/html/2504.06894v1).

---

### 5.5 Centralized vs. Decentralized Tradeoffs

| Property | Centralized (Tower/Lattice) | Decentralized (Consensus/Boids) |
|---|---|---|
| Optimality | Near-optimal global solution | Local rules, emergent near-optimum |
| Latency | Single-point bottleneck | Peer-to-peer, low latency |
| Resilience | Single point of failure | Robust to node dropout |
| Comm. requirement | All→center (O(N) bandwidth) | Neighbor-only (sparse) |
| Scalability | Degrades past ~100 agents | Scales to 1,000+ (boids proven) |
| Attack surface | High (neutralize commander) | Low (no single controller) |

Astral's factorial study found centralized "Tower" coordination trades latency for determinism; self-organized scales better but requires careful tuning of boid gains to prevent oscillation at high densities. [Astral Research](https://astral.us/research).

---

### 5.6 SZL / killinchu New-Formula Direction

> **SZL-SWARM-1 (Laplacian + Urgency Consensus):** Define killinchu's friendly interceptor swarm coordination as a *weighted* consensus protocol where edge weight `w_{ij}` is a product of (a) communication link quality and (b) a **threat urgency multiplier** based on the assigned target's time-to-impact. As TTI decreases, the urgency term increases the effective Fiedler value, forcing faster consensus on intercept geometry. Our own formulation — uses the graph Laplacian foundation but adds a domain-specific dynamic weight.

---

## 6. Threat Prioritization & Weapon-Target Assignment

### 6.1 Background

Given M active drone threats and W available interceptors/effectors, the C2 system must decide which weapon engages which target. This is the **Weapon-Target Assignment (WTA)** problem — a nonlinear integer programming problem known to be NP-hard.

**Industry signals:**
- Lockheed Martin Sanctum C-UAS acts as a C2 mission management layer integrating DroneHunter interceptors with TrueView radar, implicitly solving a WTA subproblem. [Lockheed Sanctum](https://www.lockheedmartin.com/en-us/capabilities/counter-unmanned-aerial-systems.html)
- SSCI's Collaborative Mission Autonomy (CMA) autonomously commands platforms to execute mission objectives in coordination — includes F2T2 (Find, Fix, Track, Target) loops. [SSCI](https://www.ssci.com/news/scientific-systems-company-inc-ssci-awarded-army-contract/)

---

### 6.2 Static WTA Formulation (Manne 1958)

**Minimize total expected survival value** of all targets:

```
minimize   Σ_{j=1}^{n} V_j · Π_{i=1}^{m} q_{ij}^{x_{ij}}
```

Subject to:
```
Σ_{j=1}^{n} x_{ij} ≤ W_i   ∀i ∈ {1,...,m}   (weapon budget constraint)
x_{ij} ≥ 0,  integer                           (integrality)
```

Where:
- `x_{ij}` — number of weapons of type `i` assigned to target `j`
- `W_i` — available count of weapon type `i`
- `V_j` — value (threat score) of target `j`
- `p_{ij}` — single-shot kill probability, weapon type i vs target j
- `q_{ij} = 1 − p_{ij}` — single-shot survival probability

**Expected survival value for target j** (assuming independent shots):
```
E[survival_j] = V_j · Π_i q_{ij}^{x_{ij}}
```

Equivalently, **maximize expected destroyed value**:
```
maximize   Σ_j V_j · (1 − Π_i q_{ij}^{x_{ij}})
```

Sources: [Weapon-Target Assignment Problem — Wikipedia](https://en.wikipedia.org/wiki/Weapon_target_assignment_problem); [WTA NP-hardness, linearization — University of Southern Denmark](https://portal.findresearcher.sdu.dk/files/204132463/WTA.pdf); [Exact and Heuristic Algorithms — Operations Research (2007)](https://ideas.repec.org/a/inm/oropre/v55y2007i6p1136-1146.html).

---

### 6.3 Dynamic (Shoot-Look-Shoot) WTA

The dynamic WTA extends to multi-stage engagement. After the first salvo, observed outcomes update the belief state `b_j = P(target j still alive)`. The next-stage assignment optimizes over the updated belief:

```
maximize   Σ_j V_j · b_j · (1 − Π_i q_{ij}^{x_{ij}^{(2)}})
```

This is solvable as a finite-horizon MDP (Markov Decision Process) or via approximate dynamic programming for small problem sizes. Source: [WTA Dynamic Formulation — CiteSeer](https://citeseerx.ist.psu.edu/document?repid=rep1&type=pdf&doi=0cd864716a6c4fdd8be70ad1c1eebdad28d311d5).

---

### 6.4 Time-to-Intercept / Engageability Math

For an interceptor launched at time `t_0` from position `r_i` to engage a threat at predicted impact time `T_impact` at position `r_T(t)`:

**Minimum intercept time** (linear pursuit, constant closing speed):
```
t_intercept = ‖r_T(t_0) − r_i‖ / Vc
```

**Engageability constraint:** interceptor must reach intercept point before threat reaches the defended asset:
```
t_intercept < T_impact − t_0   →   target is engageable
```

**Layered defense time margin:**
```
Δt_margin = (T_impact − t_0) − t_intercept
```

A positive `Δt_margin` means intercept is feasible; negative means the threat cannot be neutralized kinetically (switch to EW/RF defeat). This margin directly feeds the WTA priority scoring as a time-urgency multiplier. Source: [Counter-UAS C2 Army Military Review, May-June 2024](https://www.armyupress.army.mil/Journals/Military-Review/English-Edition-Archives/May-June-2024/MJ-24-Modern-Warfare/).

---

### 6.5 Threat Value Scoring

Before running WTA, compute a composite threat score `V_j` for each detected drone j. A general-form threat index:

```
V_j = w_TTI · f(t_j^{TTI}) + w_class · C_j + w_payload · P_j + w_geom · G_j
```

Where:
- `t_j^{TTI}` — estimated time-to-impact on the defended asset
- `C_j` — classification confidence (e.g., fixed-wing attack vs. consumer quad)
- `P_j` — estimated payload/lethality (RF signature, size, behavior)
- `G_j` — geometric threat factor (approach angle, maneuver index)
- `w_*` — tunable importance weights

This scoring feeds directly into `V_j` in the WTA objective. The exact weighting function is a killinchu design choice.

---

### 6.6 SZL / killinchu New-Formula Direction

> **SZL-WTA-1 (TTI-Weighted Rolling WTA with Receding Horizon):** At each C2 cycle (e.g., 1 Hz), solve the WTA with a **receding horizon** of `H = 5` steps. Set `V_j = base_value_j / max(1, t_j^{TTI})` so that imminently arriving threats receive effectively infinite priority. Use a greedy branch-and-bound solver (tractable for ≤ 30 threats, ≤ 20 interceptors in real-time). After each engagement, update `b_j` (survival belief) from sensor feedback and re-solve. This is our own priority-weighted receding-horizon WTA design.

---

## 7. Three Most Promising New-Formula Directions for killinchu

Based on the gap analysis between available industry math and the specific requirements of killinchu (counter-UAS C2 platform, multi-sensor, multi-effector, GPS-denied-resilient):

### Priority 1: SZL-PN-1 + SZL-WTA-1 Combined Intercept Allocation Loop

**Why it's highest priority:** The PN guidance law is mathematically proven and directly executable; coupling an adaptive N(t) PN law with a TTI-weighted receding-horizon WTA creates the core "fire solution" engine of killinchu. This is where adversary UAS die.

**The new formula combination:**
```
# At each C2 cycle:
1. Score V_j = base_j / max(1, TTI_j)          # SZL threat priority
2. Solve WTA: min Σ V_j · Π q_{ij}^{x_{ij}}    # allocate interceptors
3. For each assigned intercept pair (i,j):
   N_ij(t) = N_base · (1 + κ · â_T / a_max)    # adaptive PN ratio
   a_cmd = N_ij(t) · Vc · λ̇                   # SZL-PN-1 guidance
4. Update b_j post-engagement via sensor feedback
5. Re-solve WTA with updated beliefs
```

### Priority 2: SZL-GNSS-1 Multi-Hypothesis Spoof Detector Feeding SZL-FUSE-1

**Why second priority:** Adversaries will attack killinchu's interceptors via GPS spoofing. A multi-hypothesis Bayes factor spoof detector that gracefully fails over to IMU-DR navigation, while the CI fusion arbiter maintains a coherent COP from the remaining uncorrupted sensors, is the resilience backbone of the platform.

**Key new formula:**
```
BF_k = P(H1 | χ²_history) / P(H0 | χ²_history)
# If BF_k > β: switch interceptor to DR-only navigation
# CI arbiter: weight fused track by P(sensor_s not spoofed)
```

### Priority 3: SZL-SWARM-1 Urgency-Weighted Laplacian Coordination

**Why third priority:** Swarm interception (multiple killinchu interceptors on one dense threat formation) needs a coordination law that automatically re-prioritizes when TTI drops. The urgency-weighted Laplacian consensus ensures interceptors converge on intercept geometry faster as the threat closes, without centralized bottleneck failure.

**Key new formula:**
```
w_{ij}(t) = w_base · (1 + γ / max(ε, min_k TTI_k))
L(t) = Δ_in(t) − A(t)              # dynamic Laplacian
ẋ = −L(t) · x                      # urgency-accelerated consensus
```

---

## 8. Appendix: Company Intelligence Notes

### Astral Technology Corp
- GNSS plausibility detection: dead-reckoning vs GPS, threshold 3m, wall-clock time critical
- PN guidance N=3.5, v_max=8 m/s, 79.5% capture rate
- Swarm: centralized Tower vs. self-organized factorial study for 1,000+ agents
- Open-source SDK: [github.com/astral-us](https://github.com/astral-us)
- Key blog: [astral.us/blog/counter-uas-drone-attack-defense-simulation](https://astral.us/blog/counter-uas-drone-attack-defense-simulation)

### Breaker Industries (Avalon)
- 1:N intent-based multi-agent orchestration via natural language voice commands
- 100% onboard, comms-denied capable
- CTO Vanja Videnovic: arXiv paper [arXiv:2602.02220](https://arxiv.org/abs/2602.02220) — hierarchical open-vocabulary goal navigation (HieraNav, 4-level: scene/room/region/instance)
- Transferable: hierarchical task decomposition architecture for C2 intent parsing

### Ark Robotics (Frontier)
- Collaborative autonomy for 20+ Ukrainian brigades, 1:N drone control
- arXiv:2506.21628 — Ark open-source Python robotics framework (Gym-style, ACT/Diffusion Policy, ROS interop)
- Transferable: imitation learning policy architecture, pub-sub C2 communication pattern
- [ark-robotics.com](https://ark-robotics.com)

### AeroVironment (AV_Halo / Kinesis)
- MOSA (Modular Open Systems Architecture) for rapid tech insertion
- Kinesis: single UI controls 20+ heterogeneous UxS
- Multi-source sensor fusion: RF + EO/IR + OSINT (Scraawl)
- Relevant: Titan C-UAS, Halo_Shield detection platform
- [avinc.com](https://www.avinc.com/capabilities/av_halo/)

### Shield AI (Hivemind)
- Platform-agnostic autonomy: perception → cognition → action stack
- GPS/comms-jammed environment operations
- "State estimation algorithms — aggregating data from various sensors"
- LUCAS UCAS program (swarm of attack drones, 1 human operator)
- No public math, but architecture: reinforcement learning, task-behavior model
- [shield.ai/hivemind](https://shield.ai/hivemind/)

### Scientific Systems Company (SSCI)
- Collaborative Mission Autonomy (CMA): autonomous TCPED, F2T2
- Army ARTIST program: UAV+satellite collaborative ISR
- FOCUS algorithm: closed-loop route planning + sensor control for F2T2
- [ssci.com](https://www.ssci.com)

### Lockheed Martin (Sanctum C-UAS)
- OATH (Adaptive Obstacle-Aware Task Assignment): cluster-auction-selection framework for heterogeneous robot teaming [arXiv:2510.14063](https://arxiv.org/html/2510.14063v1)
- LTL (Linear Temporal Logic) for mission encoding
- DroneHunter autonomous interceptors integrated via Sanctum

---

## Key References

| Source | URL |
|---|---|
| Zarchan, *Tactical and Strategic Missile Guidance* 6th ed., AIAA (2012) | [https://arc.aiaa.org/doi/book/10.2514/4.868948](https://arc.aiaa.org/doi/book/10.2514/4.868948) |
| Bar-Shalom, Li & Kirubarajan, *Estimation with Applications to Tracking and Navigation*, Wiley (2001) | [https://dl.acm.org/doi/10.5555/560900](https://dl.acm.org/doi/10.5555/560900) |
| Palumbo et al., "Basic Principles of Homing Guidance," JHU APL Technical Digest 29(1) (2018) | [https://secwww.jhuapl.edu/techdigest/content/techdigest/pdf/V29-N01/29-01-Palumbo_Principles_Rev2018.pdf](https://secwww.jhuapl.edu/techdigest/content/techdigest/pdf/V29-N01/29-01-Palumbo_Principles_Rev2018.pdf) |
| Julier & Uhlmann, "Covariance Intersection," *Handbook of Multisensor Data Fusion* (2001) | [https://dsp-book.narod.ru/HMDF/2379ch12.pdf](https://dsp-book.narod.ru/HMDF/2379ch12.pdf) |
| Noack et al., "Decentralized Data Fusion with Inverse Covariance Intersection," *Automatica* (2017) | [https://isas.iar.kit.edu/pdf/Automatica17_Noack.pdf](https://isas.iar.kit.edu/pdf/Automatica17_Noack.pdf) |
| Extended Kalman Filter — Wikipedia | [https://en.wikipedia.org/wiki/Extended_Kalman_filter](https://en.wikipedia.org/wiki/Extended_Kalman_filter) |
| Proportional Navigation — Wikipedia | [https://en.wikipedia.org/wiki/Proportional_navigation](https://en.wikipedia.org/wiki/Proportional_navigation) |
| RAIM — Wikipedia | [https://en.wikipedia.org/wiki/Receiver_autonomous_integrity_monitoring](https://en.wikipedia.org/wiki/Receiver_autonomous_integrity_monitoring) |
| Joerger & Pervan, "Chi-Squared ARAIM for RAIM," PLANS 2014 | [http://www.navlab.iit.edu/uploads/5/9/7/3/59735535/joerger_plans2014.pdf](http://www.navlab.iit.edu/uploads/5/9/7/3/59735535/joerger_plans2014.pdf) |
| PMC/Scientific Reports, "Optimization of covert spoofing parameters," (2025) | [https://pmc.ncbi.nlm.nih.gov/articles/PMC11873055/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11873055/) |
| DOT/BTS, "Optimal INS Monitor for GNSS Spoofer Tracking Error" (2023) | [https://rosap.ntl.bts.gov/view/dot/79801/dot_79801_DS1.pdf](https://rosap.ntl.bts.gov/view/dot/79801/dot_79801_DS1.pdf) |
| Weapon-Target Assignment Problem — Wikipedia | [https://en.wikipedia.org/wiki/Weapon_target_assignment_problem](https://en.wikipedia.org/wiki/Weapon_target_assignment_problem) |
| WTA Linearization — University of Southern Denmark | [https://portal.findresearcher.sdu.dk/files/204132463/WTA.pdf](https://portal.findresearcher.sdu.dk/files/204132463/WTA.pdf) |
| WTA Exact and Heuristic Algorithms — Operations Research (2007) | [https://ideas.repec.org/a/inm/oropre/v55y2007i6p1136-1146.html](https://ideas.repec.org/a/inm/oropre/v55y2007i6p1136-1146.html) |
| Reynolds (1987), Boids — Wikipedia | [https://en.wikipedia.org/wiki/Boids](https://en.wikipedia.org/wiki/Boids) |
| Zelazo, "Analysis and Control of Multi-Agent Systems" (2014) | [https://zelazo.net.technion.ac.il/files/2014/07/StuttgartMAS2014_L3.pdf](https://zelazo.net.technion.ac.il/files/2014/07/StuttgartMAS2014_L3.pdf) |
| arXiv:2504.06894, "AI-Driven Consensus: Modeling Multi-Agent Networks" (2025) | [https://arxiv.org/html/2504.06894v1](https://arxiv.org/html/2504.06894v1) |
| Stigmergy reaction-diffusion model — DiVA Portal (2024) | [https://www.diva-portal.org/smash/get/diva2:1887312/FULLTEXT01.pdf](https://www.diva-portal.org/smash/get/diva2:1887312/FULLTEXT01.pdf) |
| Nature Comms Engineering, stigmergy auto-design (2024) | [https://www.nature.com/articles/s44172-024-00175-7](https://www.nature.com/articles/s44172-024-00175-7) |
| JPDA Filter — Wikipedia | [https://en.wikipedia.org/wiki/Joint_Probabilistic_Data_Association_Filter](https://en.wikipedia.org/wiki/Joint_Probabilistic_Data_Association_Filter) |
| Stone Soup JPDA Tutorial | [https://stonesoup.readthedocs.io/en/latest/auto_tutorials/08_JPDATutorial.html](https://stonesoup.readthedocs.io/en/latest/auto_tutorials/08_JPDATutorial.html) |
| MathWorks Assignment Methods | [https://www.mathworks.com/help/fusion/ug/introduction-to-assignment-methods-in-tracking-systems.html](https://www.mathworks.com/help/fusion/ug/introduction-to-assignment-methods-in-tracking-systems.html) |
| METU MTT Lecture 5 | [https://users.metu.edu.tr/umut/ee793/files/METULecture5.pdf](https://users.metu.edu.tr/umut/ee793/files/METULecture5.pdf) |
| Mahalanobis Distance — Wikipedia | [https://en.wikipedia.org/wiki/Mahalanobis_distance](https://en.wikipedia.org/wiki/Mahalanobis_distance) |
| Association Log-Likelihood — arXiv:1508.04124 | [https://arxiv.org/pdf/1508.04124](https://arxiv.org/pdf/1508.04124) |
| Astral Counter-UAS Blog (GNSS/PN/Swarm data) | [https://astral.us/blog/counter-uas-drone-attack-defense-simulation](https://astral.us/blog/counter-uas-drone-attack-defense-simulation) |
| Lockheed OATH arXiv:2510.14063 | [https://arxiv.org/html/2510.14063v1](https://arxiv.org/html/2510.14063v1) |
| LangMap arXiv:2602.02220 (Breaker CTO) | [https://arxiv.org/abs/2602.02220](https://arxiv.org/abs/2602.02220) |
| Ark Framework arXiv:2506.21628 | [https://arxiv.org/abs/2506.21628](https://arxiv.org/abs/2506.21628) |
| Army Military Review, Counter-UAS C2 (May-Jun 2024) | [https://www.armyupress.army.mil/Journals/Military-Review/English-Edition-Archives/May-June-2024/MJ-24-Modern-Warfare/](https://www.armyupress.army.mil/Journals/Military-Review/English-Edition-Archives/May-June-2024/MJ-24-Modern-Warfare/) |

---

*Document produced for SZL Holdings internal R&D use. All equations are sourced from open academic literature. No proprietary IP reproduced. New formula directions (SZL-PN-1, SZL-GNSS-1, SZL-FUSE-1, SZL-TRACK-1, SZL-SWARM-1, SZL-WTA-1) are original SZL design concepts, doctrine-clean.*
