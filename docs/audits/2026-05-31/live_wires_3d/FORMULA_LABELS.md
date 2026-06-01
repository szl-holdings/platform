# FORMULA_LABELS — Which PURIQ master-formula factor rides which wire

**Master formula (PURIQ charter seed):**
\[ P(x,t) = \arg\max_{a\in\mathcal{A}} \Big[\; \Lambda(x)\cdot \text{Yuyay}_{13}(a)\cdot \exp(-\beta\cdot \text{HUKLLA}(a))\cdot \prod_i \text{Khipu}_i(a) \;\Big] \]

Each wire carries (as floating KaTeX math in the 3D scene) the factor it physically transports. Colours match the anatomy-3d wire palette.

| Wire | Role (per 500_ deliverable) | Master-formula factor | KaTeX label | PURIQ formula(s) | Scene colour |
|---|---|---|---|---|---|
| **B** | ledger (∏ Khipu) | `∏ᵢ Khipu_i(a)` | `\prod_i \text{Khipu}_i(a)` | F1 Euler-Khipu, F3 Noether-Khipu, F7 Zeta-provenance | green |
| **C** | cortex broadcast | `Λ(x)` | `\Lambda(x)` | F10 Baudhāyana √2, F13 Gauss-Bonnet | cyan |
| **D** | W3C traceparent | `OTel(x)` cross-span | `\mathrm{OTel}(x)` | (Wire-D trace linking; F15 functor composition) | yellow |
| **E** | cortex publish / Yuyay gate | `Yuyay₁₃(a)` | `\text{Yuyay}_{13}(a)` | F4 Gauss-Yuyay, F9 Sulba mass-conservation | blue |
| **F** | receipt ingest | `Khipu_{new}(a)` | `\text{Khipu}_{\text{new}}(a)` | F21 Dirac-commit, F1 Euler-Khipu | red |
| **G** | RAG retrieve / brain-jack | `Amaru(query)` | `\mathrm{Amaru}(\text{query})` | F22 Feynman path-integral, F5 Euler-Lagrange | purple |
| **H** | cross-Space orchestration | full master formula | `P(x,t)=\arg\max_{a\in\mathcal{A}}[\Lambda\cdot\text{Yuyay}_{13}\cdot e^{-\beta\text{HUKLLA}}\cdot\prod_i\text{Khipu}_i]` | F16 minimax, F19 Turing-fuel halt, F23 Bekenstein cap | gold |

**Penalty term** `exp(−β·HUKLLA(a))` is rendered as a red **damping ring** on any wire whose pulse carries fired tripwires (T01–T20) — the visual analogue of the exponential penalty zeroing the selection (F6 Newton risk-velocity, F8 parsimony, F12 CRT schedule, F16 minimax all live in HUKLLA).

**Bekenstein cap** `|𝒜| ≤ min(exp(2πRE/ℏc), 2^{K+1}−1)` (F23) bounds the number of simultaneous pulses the scene admits — honest cap, prevents unbounded particle spawn under the 100 receipts/sec load test.

All seven labels float along their wire in the **Wire view** and are listed in each wire's hover tooltip. This reinforces: *the agentic master formula, alive in 3D.*
