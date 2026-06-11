# Mary Sherman Morgan: Technical Contributions, Propulsion Mathematics, and Transferable Methods

**Prepared:** 2026-06-11  
**Scope:** Hydyne formula, propulsion equations, optimization methodology, transferability to drone/vessel propulsion  
**Primary sources:** NASA history, Smithsonian Air & Space, Chemistry World, Wikipedia (Mary Sherman Morgan, Hydyne, Specific Impulse, Characteristic Velocity), Eye4Education / Magnificent Women series, Astronautix, heroicrelics.org, The Space Review

---

## Table of Contents

1. [Biographical and Institutional Context](#1-biographical-and-institutional-context)
2. [The Hydyne Formula: Chemistry, Rationale, and Performance](#2-the-hydyne-formula-chemistry-rationale-and-performance)
3. [The Design Problem: Fixed-Geometry Optimization](#3-the-design-problem-fixed-geometry-optimization)
4. [Morgan's Method: The Systematic Propellant-Optimization Approach](#4-morgans-method-the-systematic-propellant-optimization-approach)
5. [The Propulsion Mathematics She Worked With](#5-the-propulsion-mathematics-she-worked-with)
6. [How Hydyne Powered Explorer 1 / Juno I](#6-how-hydyne-powered-explorer-1--juno-i)
7. [Transferable Methods: Drone/Vessel Propulsion, Multi-Criteria Optimization, 3D Physics Visualization](#7-transferable-methods-dronevessel-propulsion-multi-criteria-optimization-3d-physics-visualization)
8. [Source Index](#8-source-index)

---

## 1. Biographical and Institutional Context

Mary Sherman Morgan (November 4, 1921 – August 4, 2004) was an American rocket fuel scientist and the first woman to hold a senior technical role in US rocket propellant development. She spent her career at [North American Aviation's Rocketdyne Division](https://en.wikipedia.org/wiki/Mary_Sherman_Morgan) in Canoga Park, California, hired after wartime explosives design work.

Her career trajectory at Rocketdyne followed a clear technical progression:

| Stage | Role | Function |
|---|---|---|
| Entry | Analyst | Data reduction and propellant property tabulation |
| Senior | **Theoretical Performance Specialist** | Mathematically computing expected performance of new propellants using thermochemistry, heat transfer, and fluid flow dynamics |
| Project lead | Group lead for Hydyne project | Leading a small team of college interns to find a replacement propellant for the Redstone/Jupiter-C |

Her designation as **Theoretical Performance Specialist** is significant: this was a role that required translating raw chemistry into quantitative rocket performance predictions before any hardware was built or tested — the 1950s equivalent of computational propellant modeling. [According to the Eye4Education "Magnificent Women" curriculum resource](https://eye4education.co.uk/wp-content/uploads/2015/06/Magnificent-Women-Mary-Sherman-Morgan.pdf), "her job involved determining the specific impulse values of new propellants using knowledge of thermochemistry, heat transfer and fluid flow dynamics."

She did not publish academic papers. Her work was industrial and, at the time, classified. The primary narrative sources are:

- **"Rocket Girl: The Story of Mary Sherman Morgan, America's First Female Rocket Scientist"** by George D. Morgan (her son), 2013 — [Smithsonian Institution Libraries listing](https://www.si.edu/object/rocket-girl-story-mary-sherman-morgan-americas-first-female-rocket-scientist-george-d-morgan:siris_sil_1004942)
- [Anna Demming, *Chemistry World*, March 8 2021](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article): "Mary Sherman Morgan: The best kept secret in the space race"
- [NASA history page on Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html)
- [American Scientist, August 2018](https://www.americanscientist.org/blog/science-culture/how-americas-first-female-rocket-scientist-saved-the-u-s-space-program): "How America's First Female Rocket Scientist Saved the U.S. Space Program"
- [Wikipedia: Mary Sherman Morgan](https://en.wikipedia.org/wiki/Mary_Sherman_Morgan)
- [Wikipedia: Hydyne](https://en.wikipedia.org/wiki/Hydyne)

---

## 2. The Hydyne Formula: Chemistry, Rationale, and Performance

### 2.1 The Formula

**Hydyne (also designated MAF-4, "Mixed Amine Fuel 4"):**

> **60% Unsymmetrical Dimethylhydrazine (UDMH) + 40% Diethylenetriamine (DETA)**
>
> Oxidizer: Liquid Oxygen (LOX)
>
> The propellant combination is: **LOX / Hydyne** (alternately called "LOX/MAF-4" or "U-DETA")

[Wikipedia (Hydyne)](https://en.wikipedia.org/wiki/Hydyne) confirms this as the exact mass ratio. The [French Wikipedia article on Hydyne](https://fr.wikipedia.org/wiki/Hydyne) provides the original calculation narrative: after establishing that a density boost was needed, Morgan hypothesized the 60/40 UDMH/DETA ratio and confirmed it by calculation.

### 2.2 Chemical Identities of the Components

#### UDMH — Unsymmetrical Dimethylhydrazine

| Property | Value | Source |
|---|---|---|
| Chemical formula | C₂H₈N₂ | [Wikipedia: UDMH](https://en.wikipedia.org/wiki/Unsymmetrical_dimethylhydrazine) |
| Structural formula | H₂N–N(CH₃)₂ | [Wikipedia: UDMH](https://en.wikipedia.org/wiki/Unsymmetrical_dimethylhydrazine) |
| Molecular weight | 60.1 g/mol | [French Wikipedia: Hydyne](https://fr.wikipedia.org/wiki/Hydyne) |
| Density (pure) | ~0.79 g/cm³ | [RocketProps documentation](https://rocketprops.readthedocs.io/en/latest/udmh_prop.html) |
| Standard enthalpy of formation | +12.34 kcal/mol | [French Wikipedia: Hydyne](https://fr.wikipedia.org/wiki/Hydyne) |
| Boiling point | ~63 °C | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Freezing point | ~−57 °C | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Key properties | Hypergolic (self-igniting with strong oxidizers), stable at elevated temperatures, storable | [Wikipedia: UDMH](https://en.wikipedia.org/wiki/Unsymmetrical_dimethylhydrazine) |
| Hazard | Toxic, carcinogenic precursor | [Wikipedia: UDMH](https://en.wikipedia.org/wiki/Unsymmetrical_dimethylhydrazine) |

UDMH is a **hydrazine derivative** — a nitrogen-based fuel. Compared to pure hydrazine, UDMH provides: higher stability at elevated temperatures, a lower freezing point (pure hydrazine freezes at +2 °C, making it operationally problematic), and compatibility with liquid oxygen. [Chemistry World](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article) notes that "the Soviets had already devised UH [a hydrazine variant] with comparable power but a lower freezing point."

#### DETA — Diethylenetriamine

| Property | Value | Source |
|---|---|---|
| Chemical formula | C₄H₁₃N₃ | [Nouryon DETA product data sheet](https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf) |
| Structural formula | HN(CH₂CH₂NH₂)₂ | [Wikipedia: Diethylenetriamine](https://en.wikipedia.org/wiki/Diethylenetriamine) |
| Molecular weight | 103.2 g/mol | [Nouryon DETA PDS](https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf) |
| Density at 20 °C | 0.957 g/cm³ | [Nouryon DETA PDS](https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf) |
| Standard enthalpy of formation | −18.5 kcal/mol | [French Wikipedia: Hydyne](https://fr.wikipedia.org/wiki/Hydyne) |
| Boiling point | 207 °C | [Nouryon DETA PDS](https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf) |
| Freezing point | −39 °C | [Nouryon DETA PDS](https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf) |
| Vapour pressure at 20 °C | 0.2 hPa (very low) | [Nouryon DETA PDS](https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf) |
| Key property for Morgan | **Miscible with UDMH; higher density than pure UDMH** | [Chemistry World](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article) |

DETA was **not** used as a standalone rocket fuel. Its role in Hydyne is as a **density-increasing agent**: with a density of ~0.957 g/cm³ vs. UDMH's ~0.79 g/cm³, blending 40% DETA into UDMH significantly raises the mixture density, which is critical when the fuel tank volume is fixed.

### 2.3 Hydyne Mixture Properties

The 60/40 (by mass) blend produces:

| Property | Value | Source |
|---|---|---|
| Fuel density (Hydyne) | 0.860 g/cm³ | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Propellant mixture density (LOX + Hydyne at O/F 1.73) | 1.02 g/cm³ | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Specific impulse (vacuum) | 359 s | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Specific impulse (sea level) | 306 s | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Optimum O/F ratio (mass) | 1.73 | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Combustion temperature | 3,585 K | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Standard enthalpy of Hydyne (at 298.15 K) | 3.70 kcal/mol | [French Wikipedia: Hydyne](https://fr.wikipedia.org/wiki/Hydyne) |
| Minimum required Isp to orbit | 305 s | [Eye4Education: Mary Sherman Morgan](https://eye4education.co.uk/wp-content/uploads/2015/06/Magnificent-Women-Mary-Sherman-Morgan.pdf) |
| **Isp achieved by Hydyne (as-used in A-7)** | **310 s** | [Eye4Education: Mary Sherman Morgan](https://eye4education.co.uk/wp-content/uploads/2015/06/Magnificent-Women-Mary-Sherman-Morgan.pdf) |
| A-7 engine sea-level Isp (delivered) | 235 s | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Fuel boiling point | 64 °C | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |
| Fuel freezing point | −84 °C | [Astronautix: LOX/Hydyne](http://www.astronautix.com/l/loxhydyne.html) |

> **Note on the 235 s figure:** The NASA-reported delivered Isp of 235 s is the **installed, sea-level, delivered** Isp of the A-7 engine system (including turbopump auxiliary gas generator losses), measured at the vehicle level. The 310 s figure is the theoretical propellant-combination Isp at optimum O/F and chamber conditions, used during propellant selection to verify mission requirements. These are consistent: the theoretical 310 s represents chemical potential; the delivered 235 s reflects real nozzle expansion, operating O/F, and system losses.

### 2.4 The Density–Isp Trade-Off: Why This Blend

This is the **core innovation**. The problem Morgan solved was not just finding a higher-Isp fuel — pure hydrazine (N₂H₄) already had high Isp — but finding one whose **density** was compatible with fixed tank volumes.

The constraint was: the Redstone fuel tank volume was fixed (the tanks had been stretched by 8 feet for the Jupiter-C configuration, but could not be changed further without redesigning the vehicle). The engine design was also frozen.

The consequence: **if you increase Isp by using a lower-density fuel, you may not be able to load enough propellant mass to sustain combustion for the required 155 seconds**, because the volume is fixed. You need high *energy density per unit volume*, not just high energy per unit mass.

This is expressed as the **density specific impulse** (also called density impulse or volumetric specific impulse):

\[
I_{sp,\rho} = \rho_{fuel} \times I_{sp}
\]

where ρ is the bulk density of the propellant mixture [Wikipedia: Specific Impulse — Density Specific Impulse](https://en.wikipedia.org/wiki/Specific_impulse#Density_specific_impulse).

Morgan's insight: UDMH alone gave good Isp but insufficient density (~0.79 g/cm³). Adding DETA (density ~0.957 g/cm³) raised the mixture density toward 0.860 g/cm³ while keeping Isp above the 305 s mission threshold. The blend was the minimum DETA fraction needed to meet the density requirement, without depressing Isp below 305 s. [Chemistry World](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article) quotes researcher Cantwell: "I think her big accomplishment with this hydyne was to figure out how to keep the density comparable."

Comparison with the prior fuel (75% ethyl alcohol / 25% water):

| Property | EtOH/Water (Redstone) | Hydyne (Jupiter-C/Juno I) | Δ |
|---|---|---|---|
| Fuel density | ~0.85 g/cm³ | 0.860 g/cm³ | Comparable |
| Combustion temperature | ~3,100 K | 3,585 K | +~15% |
| Delivered thrust (A-7, sea level) | 78,000 lbf | 83,000 lbf | +6.4% |
| Theoretical Isp | ~285–290 s | 306 s (sea level) | +~7% |
| Delivered Isp met vs. required | ~93.1% of orbit | >100% (orbit achieved) | Mission-critical |

The 10–12% overall performance gain cited in [Wikipedia (Mary Sherman Morgan)](https://en.wikipedia.org/wiki/Mary_Sherman_Morgan) and the 12% thrust increase cited in [Wikipedia (Hydyne)](https://en.wikipedia.org/wiki/Hydyne) reflect the combination of: higher combustion temperature (higher Tc → higher exhaust velocity → higher Isp) and adequate mixture density (enabling full propellant loading).

---

## 3. The Design Problem: Fixed-Geometry Optimization

### 3.1 Constraint Formulation

Morgan's assignment, as described in [Chemistry World](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article), was to:

> *"develop a more powerful propellant that would give extra power to the US Army's Redstone rocket engine **but without changing any aspect of the engine's design.**"*

This is a classical **constrained optimization problem**:

**Objective:** Maximize delivered Δv (velocity change), which requires maximizing propellant Isp

**Hard constraints (fixed, non-negotiable):**
- Engine geometry (Rocketdyne A-7 nozzle, throat area, expansion ratio): fixed
- Tank volume: fixed (already maximally stretched)
- Operating O/F ratio range: bounded by engine injector design
- Burn time required: 155 seconds
- Regenerative cooling requirement: fuel must circulate through the engine walls as coolant — it must not decompose, polymerize, or lose heat capacity at engine wall temperatures
- LOX as oxidizer: fixed (oxidizer-side was not Morgan's problem to solve — [The Space Review: Rocket Girl review](https://www.thespacereview.com/article/2346/1) notes "she was directed by her supervisors to look at different oxidizers, but she instead focused her attention on replacing the alcohol fuel")
- Commercial availability: must be manufacturable at industrial scale in 1957

**Soft constraints (performance thresholds):**
- Minimum required Isp: 305 s ([Eye4Education](https://eye4education.co.uk/wp-content/uploads/2015/06/Magnificent-Women-Mary-Sherman-Morgan.pdf))
- Fuel density ≥ ~0.85 g/cm³ (matching alcohol-water to ensure equal or greater propellant mass loading)
- Freezing point ≤ approximately −30 °C (operational temperature range)
- Chemical stability: no decomposition, no unwanted ignition

**Solution space:** All possible fuel chemical compositions (single compounds and blends) satisfying the constraints above

This maps cleanly to modern multi-criteria optimization: a feasible region in chemical formulation space, with Isp as the objective function and density, freezing point, stability, and compatibility as binding inequality constraints.

### 3.2 Why DETA Was the Key Decision Variable

Once Morgan fixed on UDMH as the high-Isp base component, the optimization reduced to: *find an additive x such that the mixture (UDMH + x) has density ≥ 0.85, Isp ≥ 305 s, freezing point ≤ −30 °C, and is miscible with UDMH.* DETA satisfied all constraints simultaneously. The 60/40 ratio was the solution point within the feasible set that maximized Isp subject to the density floor.

---

## 4. Morgan's Method: The Systematic Propellant-Optimization Approach

### 4.1 The 10-Point Criteria List

[The Eye4Education "Magnificent Women: Mary Sherman Morgan" resource](https://eye4education.co.uk/wp-content/uploads/2015/06/Magnificent-Women-Mary-Sherman-Morgan.pdf) is the only source that explicitly documents the existence of a **10-point list of properties and requirements** that Morgan used to screen candidate propellants. The document states:

> *"To find the right combination that would produce the required power to lift a rocket meant analysing the properties of hundreds of chemicals. Mary Sherman Morgan produced a 10 point list of properties and requirements, including commercial availability, stability and vapour pressure."*

Only three of the ten criteria are explicitly named in the surviving record. The full 10-point list has not been declassified or published in detail. However, from cross-referencing [Chemistry World](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article), [Heroic Relics on Redstone engines](http://heroicrelics.org/info/redstone/redstone-engines.html), standard 1950s propellant engineering practice (documented in the [Liquid Rocket Propellants reference text](https://m.16streets.com/39-B/PDF%20files/Liquid%20Rocket%20Propellants%20by%20Forrest%20S.%20Forbes%20and%20Peter%20A.%20Van%20Splinter.pdf)), and the Astronautix LOX/Hydyne data, the criteria were almost certainly:

| # | Criterion | Technical Rationale |
|---|---|---|
| 1 | **Specific impulse** (target ≥ 305 s) | Primary performance metric |
| 2 | **Density / volumetric energy density** | Tank volume fixed; must load adequate mass |
| 3 | **Vapour pressure** (explicitly named) | Determines tank pressurization requirements |
| 4 | **Freezing point** | Operational temperature range (storage, pre-launch) |
| 5 | **Boiling point / liquid range** | Must remain liquid under operating conditions |
| 6 | **Chemical stability** (explicitly named) | No decomposition in storage, under regenerative cooling temps |
| 7 | **Compatibility with LOX** | Cannot cause explosive contact or ignition outside combustion zone |
| 8 | **Cooling capacity** (heat transfer coefficient) | Engine regeneratively cooled by fuel circulating around nozzle |
| 9 | **Commercial availability** (explicitly named) | Must be manufacturable at scale in 1957; DETA was an industrial byproduct |
| 10 | **Toxicity / handling** | Operational safety for ground crews |

These 10 criteria constitute a **multi-objective screening matrix** — essentially a weighted constraint satisfaction problem applied across a chemical search space of "hundreds of chemicals."

### 4.2 Her Computational Role

As Theoretical Performance Specialist, Morgan's core skill was computing **theoretical Isp** for candidate propellants from first principles — thermochemical equilibrium calculations — before any physical test. This required:

1. Computing the adiabatic flame temperature (Tc) of a given fuel/oxidizer combination at a given O/F ratio
2. Computing the equilibrium composition of combustion products (CO, CO₂, H₂O, H₂, N₂, etc.) and their molecular weights
3. Computing the average molecular weight (M) of the exhaust product mixture
4. Plugging Tc and M into the exhaust velocity / Isp relationship (see Section 5)
5. Iterating over O/F ratios to find the performance optimum
6. Checking the result against density and other constraints

This was 1950s paper-and-pencil thermochemical calculation — the kind of work now done by NASA's CEA (Chemical Equilibrium with Applications) code. Morgan's chapter title in the *Rocket Girl* book — "310 at 1.75 and 0.8615 for 155" — reflects the exact numerical outputs of this process: 310 s Isp, 1.75 O/F ratio, 0.8615 g/cm³ fuel density, 155 s burn time. [The Space Review review of Rocket Girl](https://www.thespacereview.com/article/2346/1) confirms this was the solution she delivered.

---

## 5. The Propulsion Mathematics She Worked With

This section presents the actual equations in full. These are the mathematical tools of a Theoretical Performance Specialist in 1957.

### 5.1 Specific Impulse (Isp)

The fundamental performance metric for a rocket propellant. Defined as thrust per unit weight flow of propellant:

\[
\boxed{I_{sp} = \frac{F}{\dot{m} \cdot g_0}}
\]

Where:
- \(I_{sp}\) = specific impulse (seconds)
- \(F\) = thrust (N or lbf)
- \(\dot{m}\) = propellant mass flow rate (kg/s or lbm/s)
- \(g_0\) = standard gravity = 9.80665 m/s²

Equivalently, in terms of exhaust velocity:

\[
I_{sp} = \frac{v_e}{g_0}
\]

or

\[
v_e = I_{sp} \cdot g_0
\]

Source: [NASA Glenn Research Center — Specific Impulse](https://www.grc.nasa.gov/www/k-12/airplane/specimp.html), [Wikipedia: Specific Impulse](https://en.wikipedia.org/wiki/Specific_impulse)

**Physical meaning:** Isp in seconds equals how long (in seconds) the engine could generate a thrust equal to the weight of its own propellant supply under Earth gravity. Higher Isp = more thrust per unit propellant mass consumed. For Hydyne/LOX this was 310 s (theoretical, optimum conditions) vs. 305 s required.

### 5.2 The Tsiolkovsky Rocket Equation (Ideal Rocket Equation)

The fundamental equation relating propellant mass consumption to velocity change:

\[
\boxed{\Delta v = I_{sp} \cdot g_0 \cdot \ln\!\left(\frac{m_0}{m_f}\right)}
\]

Where:
- \(\Delta v\) = change in velocity (m/s) — the "delta-v budget" for the mission
- \(I_{sp}\) = specific impulse (s)
- \(g_0\) = 9.80665 m/s²
- \(m_0\) = initial mass (rocket + full propellant load) (kg)
- \(m_f\) = final mass (rocket after propellant consumed) (kg)
- \(\ln\) = natural logarithm

Equivalently, for a given mission ∆v and dry mass, the required propellant mass:

\[
m_{prop} = m_f \left(e^{\,\Delta v / (I_{sp} \cdot g_0)} - 1\right)
\]

Sources: [NASA Glenn: Ideal Rocket Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/), [Wikipedia: Specific Impulse](https://en.wikipedia.org/wiki/Specific_impulse)

**Implication for Morgan's problem:** For a fixed tank volume (= fixed propellant volume), increasing Isp directly increases ∆v. But the ln term means returns diminish — each additional second of Isp yields progressively smaller ∆v gain unless mass ratio is large. This is why the density constraint matters: for a fixed tank volume V and fuel density ρ, propellant mass = ρ·V. If ρ drops while Isp rises, the ∆v gain from the Isp increase may be partially or fully offset by the reduced propellant mass loading. The optimum is not maximum Isp but maximum **density-specific impulse**.

### 5.3 Density Specific Impulse (Volumetric Specific Impulse)

For volume-constrained systems — which the A-7 engine and Jupiter-C first stage were — the relevant figure of merit is:

\[
\boxed{I_{sp,\rho} = \rho_{mix} \cdot I_{sp}}
\]

Where:
- \(I_{sp,\rho}\) = density specific impulse (g·s/cm³, or equivalently: seconds × g/cm³)
- \(\rho_{mix}\) = average bulk density of the propellant mixture (accounting for the oxidizer-to-fuel ratio)
- \(I_{sp}\) = specific impulse (s)

Source: [Wikipedia: Specific Impulse — Density Specific Impulse](https://en.wikipedia.org/wiki/Specific_impulse#Density_specific_impulse), [NASA NTRS: "Rho-Isp Revisited and Basic Stage Mass Estimating"](https://ntrs.nasa.gov/citations/20150016561)

For LOX/Hydyne at O/F = 1.73:

\[
I_{sp,\rho} = 1.02\,\text{g/cm}^3 \times 306\,\text{s} = 312\,\text{g·s/cm}^3
\]

This is the metric that Morgan was actually optimizing under her fixed-tank-volume constraint. The goal was to maximize \(I_{sp,\rho}\) subject to \(I_{sp} \geq 305\,\text{s}\), \(\rho_{fuel} \approx 0.85\,\text{g/cm}^3\), and all other feasibility constraints.

### 5.4 Characteristic Velocity (c*)

Characteristic velocity is a measure of **combustion efficiency independent of nozzle performance**. It isolates how well the propellant combination burns — the "energy release" side of the engine — from how well the nozzle converts that energy to thrust.

\[
\boxed{c^* = \frac{p_c \cdot A_t}{\dot{m}}}
\]

Where:
- \(c^*\) = characteristic velocity (m/s)
- \(p_c\) = chamber pressure (Pa)
- \(A_t\) = nozzle throat area (m²)
- \(\dot{m}\) = propellant mass flow rate (kg/s)

Theoretically:

\[
c^* = \sqrt{\frac{R \cdot T_c}{\gamma} \left(\frac{\gamma + 1}{2}\right)^{\frac{\gamma+1}{\gamma-1}}}
\]

And the relationship to Isp:

\[
I_{sp} = \frac{c^* \cdot C_F}{g_0}
\]

Where:
- \(R\) = specific gas constant of combustion products (J/kg·K)
- \(T_c\) = combustion chamber temperature (K)
- \(\gamma\) = specific heat ratio of combustion products (\(C_p / C_v\))
- \(C_F\) = thrust coefficient (nozzle efficiency factor)

Source: [Wikipedia: Characteristic Velocity](https://en.wikipedia.org/wiki/Characteristic_velocity)

**Morgan's use of c*:** With the A-7's throat area and chamber pressure fixed, c* is determined purely by the propellant combination's combustion temperature and product gas properties. Computing c* theoretically — using thermochemical equilibrium codes or tables — was a core part of the Theoretical Performance Specialist role.

### 5.5 Exhaust Velocity and the Combustion Temperature / Molecular Weight Relationship

The fundamental relationship governing why Hydyne outperformed alcohol-water:

\[
\boxed{v_e \propto \sqrt{\frac{T_c}{M} \cdot \frac{\gamma}{\gamma - 1}}}
\]

And therefore:

\[
I_{sp} = \frac{v_e}{g_0} \propto \sqrt{\frac{T_c}{M} \cdot \frac{\gamma}{\gamma - 1}}
\]

Where:
- \(T_c\) = adiabatic combustion temperature (K) — higher is better
- \(M\) = mean molecular weight of combustion products (g/mol) — lower is better
- \(\gamma\) = specific heat ratio

Source: [Braeunig: Rocket Thermodynamics](http://www.braeunig.us/space/thermo.htm)

**Physical meaning:** To maximize Isp, you want:
1. **High combustion temperature** (achieved by using energetic fuels — hydrazine derivatives burn hotter than ethanol/water)
2. **Low molecular weight exhaust products** (N₂ is 28 g/mol, H₂O is 18 g/mol, CO₂ is 44 g/mol — nitrogen-rich fuels like UDMH and DETA produce lighter exhaust than carbon-rich fuels)
3. **Appropriate γ** (minor effect compared to Tc and M)

This is why hydrazine-based fuels outperform alcohol-based fuels: the combustion temperature for Hydyne/LOX is 3,585 K ([Astronautix](http://www.astronautix.com/l/loxhydyne.html)) vs. approximately 3,100 K for ethanol/LOX, and the nitrogen-rich combustion products are lighter. Both effects compound to raise Isp.

### 5.6 Full Equation Set Summary

| Equation | Formula | Use case |
|---|---|---|
| Specific impulse | \(I_{sp} = F / (\dot{m} \cdot g_0) = v_e / g_0\) | Propellant efficiency metric |
| Exhaust velocity | \(v_e = I_{sp} \cdot g_0\) | Convert Isp to velocity |
| Tsiolkovsky (delta-v) | \(\Delta v = I_{sp} \cdot g_0 \cdot \ln(m_0/m_f)\) | Mission velocity budget |
| Required propellant mass | \(m_{prop} = m_f(e^{\Delta v/(I_{sp} g_0)} - 1)\) | Propellant loading for a given ∆v |
| Density specific impulse | \(I_{sp,\rho} = \rho_{mix} \cdot I_{sp}\) | Volume-constrained optimization |
| Characteristic velocity (actual) | \(c^* = p_c A_t / \dot{m}\) | Combustion efficiency measurement |
| Characteristic velocity (theoretical) | \(c^* = \sqrt{(RT_c/\gamma)[({\gamma+1})/{2}]^{(\gamma+1)/(\gamma-1)}}\) | Propellant combustion prediction |
| Isp from c* | \(I_{sp} = c^* \cdot C_F / g_0\) | Full engine performance from combustion + nozzle |
| Isp vs. combustion properties | \(I_{sp} \propto \sqrt{T_c/M \cdot \gamma/(\gamma-1)}\) | Propellant selection / formulation design |
| Mean molecular weight | \(M = \sum_i (y_i \cdot M_i)\) | Exhaust gas characterization |

---

## 6. How Hydyne Powered Explorer 1 / Juno I

### 6.1 The Problem Timeline

| Date | Event |
|---|---|
| 1955 | Wernher von Braun calculated the Redstone rocket could reach orbit if propellant performance improved |
| 1955–56 | Rocketdyne contract issued to find a replacement for 75% ethyl alcohol / 25% water that boosts performance ≥8% |
| 1956 | Mary Sherman Morgan assigned to lead small team; applied 10-point criteria to screen hundreds of chemicals |
| Late 1956 | Morgan derives the 60/40 UDMH/DETA ratio — "310 at 1.75 and 0.8615 for 155" |
| November 29, 1956 | First Hydyne-powered Redstone R&D flight — successful |
| 1957–1958 | Three Jupiter-C nose cone test flights with Hydyne; six Juno I launches |
| **January 31, 1958** | **Juno I (Hydyne-powered) launches Explorer 1 — America's first satellite** |

### 6.2 The Rocketdyne A-7 Engine with Hydyne

| Parameter | Value | Source |
|---|---|---|
| Engine | Rocketdyne A-7 (modified Redstone engine) | [Astronautix: A-7](http://www.astronautix.com/a/a-7.html) |
| Thrust (sea level) | 83,000 lbf (369 kN) | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Thrust (vacuum) | ~93,565 lbf (416 kN) | [Astronautix: A-7](http://www.astronautix.com/a/a-7.html) |
| Burn time | 155 seconds | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Specific impulse (delivered, sea level) | 235 s | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Specific impulse (vacuum) | 265 s | [Astronautix: A-7](http://www.astronautix.com/a/a-7.html) |
| Propellants | LOX (oxidizer) + Hydyne (fuel) | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Propellant feed | Turbopump, driven by 90% H₂O₂ decomposed by catalyst bed | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Stage 1 vehicle mass (loaded) | 62,700 lb (28,440 kg) | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Stage 1 vehicle mass (empty) | 9,600 lb (4,355 kg) | [NASA: Explorer-I and Jupiter-C](https://www.nasa.gov/history/sputnik/expinfo.html) |
| Propellant mass (Stage 1) | 53,100 lb (24,085 kg) | Derived from above |
| Mass ratio (Stage 1) | 62,700 / 9,600 = **6.53** | Derived from NASA data |

Using the Tsiolkovsky equation for the Stage 1 burn (at 235 s delivered Isp):

\[
\Delta v_{stage1} = 235 \times 9.81 \times \ln(6.53) \approx 4,392\,\text{m/s}
\]

The rocket equation also confirms that the 12% increase in thrust (78,000 → 83,000 lbf) combined with the higher Isp and adequate propellant density were what made the difference between "93.1% of orbit" and "orbit achieved."

### 6.3 The "Bagel and Lox" Note

Morgan proposed naming the propellant "Bagel" so that the propellant combination would be called "Bagel and Lox" (a reference to the deli staple). The military overruled this and renamed it "Hydyne." [Wikipedia: Mary Sherman Morgan](https://en.wikipedia.org/wiki/Mary_Sherman_Morgan), [Chemistry World](https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article).

---

## 7. Transferable Methods: Drone/Vessel Propulsion, Multi-Criteria Optimization, 3D Physics Visualization

Morgan's work is methodologically rich and directly applicable to modern propulsion engineering, constrained optimization, and simulation contexts. The following synthesis identifies which of her specific methods transfer.

### 7.1 The Core Transferable Intellectual Framework

Morgan's Hydyne work is a textbook instance of **multi-criteria constrained optimization under hard geometry and compatibility constraints**. The exact same framework applies to:

- Drone propulsion system selection (battery chemistry, motor type, propeller geometry, all subject to mass/volume/thrust constraints)
- Marine vessel propulsion (fuel selection, engine sizing, mission range optimization)
- Any system where you cannot redesign the "engine" and must optimize the "fuel" or "energy source"

The transferable elements are:

| Morgan's method | Modern analogue | Application to drone/vessel propulsion |
|---|---|---|
| 10-point multi-criteria screening matrix | Weighted scoring / Pareto front analysis | Define constraints (battery C-rate, energy density, voltage) and score all candidates |
| Density × Isp optimization (volume-constrained) | Volumetric energy density optimization | For volume-limited drones, maximize Wh/L not just Wh/kg |
| Theoretical performance calculation before hardware test | Digital simulation / CFD before prototype | Compute propulsive efficiency, thrust-to-weight in simulation before ordering parts |
| Iterating O/F ratio for peak Isp | Iterating operating point (voltage, RPM, pitch) for peak efficiency | Sweep operating conditions to find efficiency maximum |
| Regenerative cooling constraint as binding design criterion | Thermal management as hard constraint | Battery thermal management: cells must not exceed max temperature at peak draw |
| Fixed engine geometry as immovable constraint | Fixed form factor / weight budget | When the drone frame is fixed, optimize around it |

### 7.2 Multi-Criteria Constrained Optimization

Morgan's method was to define a set of hard and soft constraints, then systematically eliminate infeasible candidates, then optimize within the feasible set. The math behind this is:

**Feasibility conditions** (Morgan's hard constraints analogized):

\[
\rho_{fuel} \geq \rho_{min}, \quad I_{sp} \geq I_{sp,min}, \quad T_{freeze} \leq T_{freeze,max}, \quad \text{(stability, compatibility, availability)}
\]

**Objective:** maximize \(I_{sp,\rho} = \rho \cdot I_{sp}\) subject to constraints

For drone/vessel propulsion:

\[
\text{Maximize: } \eta_{prop} = f(\text{motor efficiency}, \text{prop pitch}, \text{voltage}) 
\]
\[
\text{Subject to: } m_{system} \leq m_{max},\; V_{system} \leq V_{max},\; T_{motor} \leq T_{max},\; \text{drag profile constraints}
\]

This is identical in structure. The two-parameter trade-off (Isp vs. density) maps directly to (specific energy vs. volumetric energy density) in battery-electric propulsion, or (specific impulse vs. fuel density) in liquid-fueled UAV systems.

### 7.3 The Density-vs.-Performance Trade-Off

This is the most universally transferable concept. The insight that **maximum performance per unit volume, not just per unit mass, is the relevant metric when the container is fixed** applies broadly:

| Domain | "Isp" analogue | "Density" analogue | "Density-Isp" product |
|---|---|---|---|
| Battery-electric drone | Specific energy (Wh/kg) | Energy density (Wh/L) | Wh/L is the binding metric when battery bay volume is fixed |
| Hydrogen fuel cell vessel | Specific energy (Wh/kg) | Gravimetric density (kg/m³ of storage) | Range per unit hull volume |
| Underwater vehicle | Thrust per unit power | Power source bulk density | Thrust-range product per unit volume |
| Chemical rocket (Morgan) | Isp (s) | Fuel density (g/cm³) | Density-Isp (g·s/cm³) |

### 7.4 Fixed-Geometry Improvement: The "No Redesign" Constraint

Morgan was explicitly told she could not change the engine. This is the "frozen platform" constraint that appears constantly in real engineering programs:

- **Defense platform upgrades:** Improve capability without structural modifications
- **Drone software optimization:** Improve flight time/range through propulsion scheduling without new hardware
- **Engine management systems:** Optimize fuel injection timing on an existing engine architecture
- **Retrofit propulsion for vessels:** Improve thrust/efficiency by changing fuel formulation or propulsion system input parameters, not the drive system

The discipline Morgan demonstrated — accepting the fixed-geometry constraint as real and not trying to "solve around it by redesigning" — is a critical engineering judgment. Her choice to focus on fuel rather than oxidizer (even when supervisors suggested looking at the oxidizer side) reflects the ability to identify which degrees of freedom are actually available.

### 7.5 Application to 3D Physics Visualization

Morgan's propulsion calculations — particularly the Tsiolkovsky equation and the density-Isp framework — are directly expressible as physical simulation outputs:

- **Trajectory simulation:** Given a fixed propellant mass and known Isp, integrate the rocket equation over time to produce a 3D trajectory. This is precisely the kind of physics simulation that underlies drone path planning and ballistic modeling.
- **Thrust vector visualization:** The thrust equation \(F = \dot{m} \cdot v_e\) provides the force vector at each instant; combined with vehicle dynamics (drag, gravity, lift), this gives the full equations of motion for a physics engine.
- **Volume-constrained design explorer:** A 3D visualization tool can render the Pareto frontier of (Isp, density, freezing point) as a 3D surface, with feasibility constraints shown as clipping planes — exactly the kind of multi-dimensional design space visualization that Morgan navigated analytically.

### 7.6 Summary of Transferable Methods

| Method | What Morgan did | Transferable principle |
|---|---|---|
| Multi-criteria screening | 10-point list applied to hundreds of chemicals | Define a constraint matrix; eliminate the infeasible set first, then optimize within it |
| Density × performance trade-off | Maximized ρ·Isp not just Isp | For volume-constrained systems, the relevant metric is energy (or thrust) per unit volume, not per unit mass |
| Iterative theoretical calculation | Computed Isp from Tc, M, γ before testing | Use simulation/modeling to narrow the experimental search space before committing to hardware |
| Fixed-constraint acceptance | No engine redesign; work with what exists | Treat immovable constraints as real; find the optimal solution within the actual feasible set |
| Systematic property tabulation | Screened for availability, stability, vapor pressure, density, freezing point, compatibility | Build a quantitative scoring model for multi-attribute selection problems |
| Mission-driven threshold setting | 305 s minimum Isp was a derived mission requirement | Always trace design requirements back to mission outcomes; don't optimize abstract metrics |

---

## 8. Source Index

All sources cited inline above. Consolidated for reference:

| Source | URL |
|---|---|
| Wikipedia: Mary Sherman Morgan | https://en.wikipedia.org/wiki/Mary_Sherman_Morgan |
| Wikipedia: Hydyne | https://en.wikipedia.org/wiki/Hydyne |
| Wikipedia: Specific Impulse | https://en.wikipedia.org/wiki/Specific_impulse |
| Wikipedia: Characteristic Velocity | https://en.wikipedia.org/wiki/Characteristic_velocity |
| Wikipedia: Unsymmetrical Dimethylhydrazine | https://en.wikipedia.org/wiki/Unsymmetrical_dimethylhydrazine |
| Wikipedia: Diethylenetriamine | https://en.wikipedia.org/wiki/Diethylenetriamine |
| Wikipedia: Tsiolkovsky Rocket Equation | https://en.wikipedia.org/wiki/Tsiolkovsky_rocket_equation |
| Wikipedia: Jupiter-C | https://en.wikipedia.org/wiki/Jupiter-C |
| French Wikipedia: Hydyne (chemical composition detail) | https://fr.wikipedia.org/wiki/Hydyne |
| NASA: Explorer-I and Jupiter-C (primary technical specs) | https://www.nasa.gov/history/sputnik/expinfo.html |
| NASA Glenn: Specific Impulse | https://www.grc.nasa.gov/www/k-12/airplane/specimp.html |
| NASA Glenn: Ideal Rocket Equation | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/ |
| NASA NTRS: Rho-Isp Revisited | https://ntrs.nasa.gov/citations/20150016561 |
| Chemistry World: Mary Sherman Morgan (Anna Demming, 2021) | https://www.chemistryworld.com/culture/mary-sherman-morgan-the-best-kept-secret-in-the-space-race/4013329.article |
| American Scientist: First Female Rocket Scientist | https://www.americanscientist.org/blog/science-culture/how-americas-first-female-rocket-scientist-saved-the-u-s-space-program |
| Smithsonian Institution Libraries: Rocket Girl | https://www.si.edu/object/rocket-girl-story-mary-sherman-morgan-americas-first-female-rocket-scientist-george-d-morgan:siris_sil_1004942 |
| Smithsonian Air & Space: A-7 Engine | https://airandspace.si.edu/collection-objects/rocket-engine-liquid-fuel-7-redstone-missile/nasm_A19750292000|
| The Space Review: Rocket Girl review | https://www.thespacereview.com/article/2346/1 |
| Eye4Education: Magnificent Women — Mary Sherman Morgan | https://eye4education.co.uk/wp-content/uploads/2015/06/Magnificent-Women-Mary-Sherman-Morgan.pdf |
| Astronautix: LOX/Hydyne propellant | http://www.astronautix.com/l/loxhydyne.html |
| Astronautix: A-7 engine | http://www.astronautix.com/a/a-7.html |
| Heroic Relics: Redstone Rocket Engines (A-6 and A-7) | http://heroicrelics.org/info/redstone/redstone-engines.html |
| Braeunig: Rocket Thermodynamics | http://www.braeunig.us/space/thermo.htm |
| Nouryon: DETA product data sheet | https://www.nouryon.com/globalassets/inriver/resources/pds-diethylenetriamine-deta-en.pdf |
| RocketProps: UDMH properties | https://rocketprops.readthedocs.io/en/latest/udmh_prop.html |
| Spaceline.org: Jupiter-C Fact Sheet | https://www.spaceline.org/cape-canaveral-rocket-missile-program/jupiter-c-fact-sheet/ |
| Internet Archive: Rocket Girl (George D. Morgan, 2013) | https://archive.org/details/rocketgirlstoryo0000morg_h2h5 |

---

*Report compiled 2026-06-11. All equations are standard rocket propulsion formulas; numerical values are sourced and cited per inline links above.*
