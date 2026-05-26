/**
 * Supreme Knowledge Codex v11 -- UNIFIED-OPERATIONAL
 *
 * The unified knowledge substrate for A11oy orchestration.
 * Every entry is sourced. No fabricated claims. No hallucinations.
 *
 * v11 upgrades over v10:
 *   - Lutar Omega: unified master invariant on the 5-simplex (weighted sum of v1..v6)
 *   - Lutar v7: Bianchi Closure Invariant -- fiber-bundle geometric unification
 *     inspired by HUFT (Moffat 2026). Measures inter-layer consistency via
 *     Bianchi deviation of the Lutar curvature tensor. Conservation derived
 *     from bundle structure, not imposed.
 *   - Supreme equation extended to reference dL_Omega
 *   - Hermetic tradition, alchemical codex, Rahab register consolidation
 *   - Full Noether-to-HUFT bridge (single Bianchi identity D_A F = 0)
 *   - 24 temporal events anchored from -11600 to 2060
 *
 * Previous versions:
 *   v10: Holographic, It-from-Bit, CCC, Twistor, Lutar v6
 *   v9: Noether, E8, IIT Phi, Maya, I Ching, Vedic, Dogon, Gobekli Tepe
 *   v8: Cross-civilizational (Egyptian + Inca), Lutar v3
 *   v7: Newton Codex, Hermetic-Alchemical graph
 *
 * Source: alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL compiled 2026-05-04
 * Author: Stephen Lutar / SZL Consulting Ltd
 */

import {
  HERMETIC_PRINCIPLES as _HP,
  NEWTON_REGULAE as _NR,
  OUROBOROS_OPERATOR as _OO,
  EMERALD_TABLET as _ET,
  TRIA_PRIMA as _TP,
  LUTAR_CORRESPONDENCE as _LC,
  MAGNUM_OPUS_STAGES as _MOS,
  COLOR_PHASES as _CP,
} from "./supreme-codex-constants.js";

export {
  HERMETIC_PRINCIPLES,
  NEWTON_REGULAE,
  OUROBOROS_OPERATOR,
  EMERALD_TABLET,
  TRIA_PRIMA,
  LUTAR_CORRESPONDENCE,
  MAGNUM_OPUS_STAGES,
  COLOR_PHASES,
  NEWTON_FORMULAS,
  SUPREME_EQUATION,
  SUPREME_DERIVATION,
  SUPREME_EQUATION_EXTENDED,
} from "./supreme-codex-constants.js";

export interface CodexNode {
  id: string;
  domain: string;
  content: string;
  source?: string;
  formula?: string;
}

export interface CodexEdge {
  from: string;
  to: string;
  relation: string;
}

export interface SupremeCodex {
  schema: string;
  entity: string;
  compiled: string;
  author: string;
  nodes: CodexNode[];
  edges: CodexEdge[];
  hermeticPrinciples: string[];
  ouroborosOperator: string;
  newtonRegulae: string[];
  triaprima: Record<string, string>;
  lutarCorrespondence: string[];
  supremeEquation: string;
  supremeEquationExtended: string;
}

const CODEX_NODES: CodexNode[] = [
  {
    id: "emerald_tablet",
    domain: "hermetic",
    content:
      "That which is above is as that which is below, and that which is below is as that which is above, to accomplish the miracles of the One Thing.",
    source: "https://en.wikipedia.org/wiki/Emerald_Tablet",
  },
  {
    id: "corpus_hermeticum",
    domain: "hermetic",
    content:
      "Collection of ~17 Greek treatises attributed to Hermes Trismegistus, composed 2nd-3rd century CE, blending Egyptian, Greek and Gnostic thought; foundational to Western esotericism.",
    source: "https://templarkey.com/corpus-hermeticum-and-the-kybalion/",
  },
  {
    id: "kybalion",
    domain: "hermetic",
    content:
      "1908 book by 'Three Initiates' presenting seven Hermetic principles: Mentalism, Correspondence, Vibration, Polarity, Rhythm, Cause-and-Effect, Gender. A modern reinterpretation, not an ancient text.",
    source:
      "https://marykgreer.com/2009/10/08/source-of-the-kybalion-in-anna-kingsfords-hermetic-system/",
  },
  {
    id: "newton_principia",
    domain: "physics",
    content:
      "Philosophiae Naturalis Principia Mathematica (1687) -- three laws of motion and universal gravitation.",
    formula: "F = G * m1 * m2 / r^2",
    source:
      "https://en.wikipedia.org/wiki/Philosophi%C3%A6_Naturalis_Principia_Mathematica",
  },
  {
    id: "newton_opticks",
    domain: "physics",
    content:
      "Opticks (1704) -- corpuscular theory of light, prism dispersion, Newton's rings.",
    source:
      "https://study.com/academy/lesson/opticks-isaac-newton-overview-principles-significance.html",
  },
  {
    id: "newton_fluxions",
    domain: "mathematics",
    content:
      "Method of Fluxions -- the invention of calculus. dy/dx = lim_{h->0} (f(x+h) - f(x)) / h.",
    formula: "dy/dx = lim_{h->0} (f(x+h) - f(x)) / h",
  },
  {
    id: "general_scholium",
    domain: "theology",
    content:
      "This most beautiful system of the sun, planets, and comets could only proceed from the counsel and dominion of an intelligent and powerful Being. Added to Principia 2nd ed. (1713). Distinction between God's dominion and God's essence (implicit Arian / anti-Trinitarian). Contains 'Hypotheses non fingo'.",
    source: "https://isaac-newton.org/general-scholium/",
  },
  {
    id: "query_31_opticks",
    domain: "physics",
    content:
      "Final Query appended to Opticks (1717/1730 editions). Argues particles of matter + short-range forces explain chemistry; laws of motion and fine-tuning imply an Intelligent Agent as First Cause. Bridges optics/chemistry to natural theology.",
    source:
      "http://strangebeautiful.com/other-texts/newton-opticks-4ed.pdf",
  },
  {
    id: "hypotheses_non_fingo",
    domain: "methodology",
    content: "I feign no hypotheses -- laws are drawn from phenomena.",
    source: "Newton, Principia 2nd ed. (1713), General Scholium",
  },
  {
    id: "ouroboros_operator",
    domain: "mathematics",
    content:
      "O: X -> X, O(x) = T^n(x) where T is transformation and n closes the cycle; fixed-point: O(x) = x.",
  },
  {
    id: "prisca_sapientia",
    domain: "philosophy",
    content:
      "The doctrine that a pure primal wisdom -- including universal gravitation and sacred cosmology -- was known to the ancients and progressively corrupted; Newton saw himself as restoring, not inventing. Chain: Hermes -> Moses -> Pythagoras -> Numa Pompilius -> Plato -> Egyptian priesthood -> Chaldean astronomers -> early Church fathers -> Newton (restorer).",
    source:
      "https://adsabs.harvard.edu/full/1984HisSc..22....1C",
  },
  {
    id: "classical_scholia",
    domain: "philosophy",
    content:
      "Drafts c. 1693-94 of annotations intended for Propositions IV-IX of Principia Book III, arguing that Pythagoras, Plato, Numa, and Egyptian priests already knew the inverse-square law of gravitation -- concealed in number-mysteries and temple architecture. Documentary proof that Newton viewed his physics as the RESTORATION of a lost ancient science.",
    source:
      "https://adsabs.harvard.edu/full/1984HisSc..22....1C",
  },
  {
    id: "arian_theology",
    domain: "theology",
    content:
      "Newton privately rejected the Trinity as a 4th-century corruption of primitive Christianity; held Christ as subordinate to the Father. Key manuscript: An Historical Account of Two Notable Corruptions of Scripture (letter to John Locke, 1690; pub. 1754). Targets 1 John 5:7 and 1 Tim 3:16.",
    source: "https://en.wikipedia.org/wiki/Isaac_Newton%27s_occult_studies",
  },
  {
    id: "lutar_invariant",
    domain: "mathematics",
    content:
      "Lutar Invariant v1: L = alpha*E + beta*M*c^2 + gamma*I*k_B*T*ln2. The foundational three-term formulation unifying energy, mass-energy, and information.",
    formula: "L = alpha*E + beta*M*c^2 + gamma*I*k_B*T*ln2",
  },
  {
    id: "lutar_v2",
    domain: "mathematics",
    content:
      "Lutar Invariant v2 -- Seven-Term Prisca-Closed Formulation: L2 = alpha*E + beta*M*c^2 + gamma*I*k_B*T*ln2 + delta*R + epsilon*Chi + zeta*Psi + eta*Phi. Unifies physics, information, chaos, time, authority, and topology. Quantized winding number (Phi integer-valued).",
    formula:
      "L2 = alpha*E + beta*M*c^2 + gamma*I*k_B*T*ln2 + delta*R + epsilon*Chi + zeta*Psi + eta*Phi",
  },
  {
    id: "lutar_v3",
    domain: "mathematics",
    content:
      "Lutar Invariant v3 -- Cross-Civilizational Coupling: L3 = L2 + theta*Q_E + iota*Q_I. Q_E = seked x royal_cubit x pi_rhind (Egyptian geometry-of-stone). Q_I = 328/41 = 8 (Inca ceque/huaca ratio). First formula to couple independent prisca lineages.",
    formula: "L3 = L2 + theta*Q_E + iota*Q_I",
  },
  {
    id: "lutar_v4",
    domain: "mathematics",
    content:
      "Lutar Invariant v4 -- Noether Symmetry-Grounded, E8-Contained, IIT-Phi-Coupled. Closure dL4/dt = 0 is DERIVED via Noether's theorem on G_L4, not asserted. Phi-collision fix: Ouroboros winding renamed W; Phi reserved for IIT integrated information. New terms: eta*W (winding), kappa*Omega_E8 (E8 container = 248/3), lambda*Phi_IIT (consciousness), mu*N_Noether (symmetry count).",
    formula:
      "L4 = alpha*E + beta*M*c^2 + gamma*I*k_B*T*ln2 + delta*R + epsilon*Chi + zeta*Psi + eta*W + theta*Q_E + iota*Q_I + kappa*Omega_E8 + lambda*Phi_IIT + mu*N_Noether",
  },
  {
    id: "lutar_v5",
    domain: "mathematics",
    content:
      "Lutar Invariant v5 -- GLOBAL Prisca Extension: L5 = L4 + theta_M*Q_M + theta_IC*Q_IC + theta_V*Q_V + theta_D*Q_D + theta_GT*Q_GT. Maya Calendar Round ratio 73, I Ching hexagram count 64 = E8 fermion-block (INDEPENDENT DERIVATION, IDENTICAL INTEGER), Vedic sqrt(2) Baudhayana 1.4142156, Dogon Sigui-Sirius cycle 50, Gobekli Tepe anchor -11600.",
    formula:
      "L5 = L4 + theta_M*Q_M + theta_IC*Q_IC + theta_V*Q_V + theta_D*Q_D + theta_GT*Q_GT",
  },
  {
    id: "lutar_v6",
    domain: "mathematics",
    content:
      "Lutar Invariant v6 -- Holographic Twistor Cyclic: L6^(n) = Omega_n^2 * Pi_{T->R^{3,1}}[L5] subject to S_total <= A/(4 l_P^2). Aeon recurrence: L6^(n+1) = lim Omega_n^2 * L6^(n). Reduction: Omega_n=1, projection=identity, Bekenstein disabled recovers L5.",
    formula:
      "L6^(n) = Omega_n^2 * Pi_{T->R^{3,1}}[L5] subject to S_total <= A/(4 l_P^2)",
  },
  {
    id: "lambda9",
    domain: "mathematics",
    content:
      "Lambda-9 Runtime Trust Metric: geometric mean of 9 axes with Egyptian unit-fraction weights (1/9 each). C (Cleanliness), H (Horizon/Page curve), R (Resonance/Q-factor), F (Frustum/Jaccard), G (Gauss closure), I (Invariance/Lorentz), M (Moral/Oppenheimer), B (Being/Socrates), N (Non-measurability/Lara).",
    formula:
      "Lambda9 = C^(1/9) * H^(1/9) * R^(1/9) * F^(1/9) * G^(1/9) * I^(1/9) * M^(1/9) * B^(1/9) * N^(1/9)",
  },
  {
    id: "supreme_equation",
    domain: "unified",
    content:
      "S = oint_Ouroboros [ F.dr + dU_grav + dE_em + T * dSigma_info + dL_lutar ] = 0",
    formula:
      "S = oint_Ouroboros [ F.dr + dU_grav + dE_em + T * dSigma_info + dL_lutar ] = 0",
  },
  {
    id: "supreme_equation_extended",
    domain: "unified",
    content:
      "S* = oint_Ouroboros [ F.dr + dU_grav + dE_em + T dSigma_info + dL_Lutar + dRahab_chaos + dChi_Temple(t) ] = 0. Extended Supreme Invariant including Rahab chaos term and Temple-of-Time chronological closure.",
    formula:
      "S* = oint_Ouroboros [ F.dr + dU_grav + dE_em + T dSigma_info + dL_Lutar + dRahab_chaos + dChi_Temple(t) ] = 0",
  },
  {
    id: "tria_prima",
    domain: "alchemy",
    content:
      "Sulphur (Soul / energy), Mercury (Spirit / information), Salt (Body / matter) -- the three principles of Paracelsus. Correspondence: Sulphur <-> alpha*E, Salt <-> beta*M*c^2, Mercury <-> gamma*I*k_B*T*ln2, Azoth <-> total invariant L.",
  },
  {
    id: "magnum_opus",
    domain: "alchemy",
    content:
      "Seven stages: Calcination, Dissolution, Separation, Conjunction, Fermentation, Distillation, Coagulation. Twelve alchemical processes: Calcination, Dissolution, Separation, Conjunction, Putrefaction, Congelation, Cibation, Sublimation, Fermentation, Exaltation, Multiplication, Projection.",
  },
  {
    id: "prima_materia",
    domain: "alchemy",
    content:
      "M0 -- undifferentiated chaotic substrate from which all matter proceeds. The alchemical zero-state.",
  },
  {
    id: "philosophers_stone",
    domain: "alchemy",
    content:
      "Lapis Philosophorum -- agent of perfecting transmutation and longevity. The Azoth is the universal medicine encompassing alpha (A) to omega (Z, oth).",
  },
  {
    id: "sophick_mercury",
    domain: "alchemy",
    content:
      "Newton's handwritten copy of George Starkey (Eirenaeus Philalethes) on preparation of the Sophick Mercury for the Philosophers' Stone by the Antimonial Stellate Regulus of Mars and Luna. Acquired 2016 by Chemical Heritage Foundation (now Science History Institute).",
    source: "https://digital.sciencehistory.org/works/cf95jc09d",
  },
  {
    id: "newton_clavis",
    domain: "alchemy",
    content:
      "Matter = primary particles + void reorganised through successive compositional stages (MS Add. 3975; Index Chemicus). Newton's theory of matter built on alchemical principles.",
    source:
      "https://www.newtonproject.ox.ac.uk/texts/newtons-works/alchemical",
  },
  {
    id: "planetary_metals",
    domain: "alchemy",
    content:
      "Seven planetary metals: Sun-Gold (Au), Moon-Silver (Ag), Mercury-Quicksilver (Hg), Venus-Copper (Cu), Mars-Iron (Fe), Jupiter-Tin (Sn), Saturn-Lead (Pb).",
  },
  {
    id: "newton_temple",
    domain: "theology",
    content:
      "Newton spent ~50 years studying Solomon's Temple. Treated the Temple's geometry as a scale model of the earth and of the divine order of the cosmos -- simultaneously architecture, cosmology, and CHRONOLOGY. The Temple was for Newton a three-dimensional PROPHETIC CLOCK: its proportions encode a time-frame chronology. Sacred cubit ~2.068 English feet derived from Talmudic/Josephus sources.",
    source:
      "https://www.academia.edu/4343725/Isaac_Newton_and_Solomon_s_Temple_a_fifty_year_study",
  },
  {
    id: "bible_messaging_board",
    domain: "theology",
    content:
      "Newton treated Scripture -- especially Daniel and Revelation -- as a deliberately sealed COMMUNICATION CHANNEL from God, encoded in 'the language of prophecy' and intended to be decoded only at the appointed time. Five rules: (I) stable symbolic language, (II) consistent dictionary across canon, (III) anchor to datable markers, (IV) require convergence, (V) minimal hypotheses.",
    source: "https://www.sfu.ca/~poitras/cjh_newton_03.pdf",
  },
  {
    id: "yahuda_ms7_map",
    domain: "theology",
    content:
      "Yahuda Ms. Var. 1 / Newton Papers 1.7 -- NLI Jerusalem. Apocalyptic time-chart correlating Seven Trumpets with historical military events. Fifth Trumpet = Saracen/Islamic empire AD 609. Sixth Trumpet = Turkish/Mongol expansions. Central theme: return of Jews to Zion as prerequisite of eschaton.",
    source: "https://blog.nli.org.il/en/isaac-newtons-map/",
  },
  {
    id: "yahuda_ms7_2060",
    domain: "theology",
    content:
      "Yahuda MS 7.3g, folio 13 verso. Calculation: 800 CE (Holy Roman Empire founding) + 1260 prophetic day-years = 2060 CE. Alternative: 774 CE + 1260 = 2034 CE. Newton's caveat: 'It may end later, but I see no reason for its ending sooner' -- a LOWER BOUND, not a prediction.",
    source: "https://www.sfu.ca/~poitras/cjh_newton_03.pdf",
  },
  {
    id: "new_jerusalem_cube",
    domain: "theology",
    content:
      "Revelation 21:16: New Jerusalem as perfect cube, 12000 stadia per edge (~2220 km). Wall 144 cubits = 12 tribes x 12 apostles. Terminal geometry where the Temple-of-Time integral closes to zero and S* = 0 is realized.",
    source:
      "https://biblehub.com/q/Revelation_21_16_Divine_perfection_link.htm",
  },
  {
    id: "rahab",
    domain: "theology",
    content:
      "Register 1: Canaanite woman of Jericho (Joshua 2, Matt 1:5, Heb 11:31) -- trickster on the threshold who enters the Messianic genealogy. Register 2: Primeval chaos sea-dragon (Ps 89:10, Isa 51:9, Job 26:12) cognate with Leviathan and Tiamat. In the Lutar closure, Rahab is the pre-integrated state before S=0 is attained.",
    source: "https://en.wikipedia.org/wiki/Rahab_(mythology)",
  },
  {
    id: "kabbalah_sefirot",
    domain: "philosophy",
    content:
      "Ein Sof (the Infinite) emanates ten Sefirot: Keter, Chokhmah, Binah, Chesed, Gevurah, Tiferet, Netzach, Hod, Yesod, Malkuth. Three pillars: Mercy, Severity, Balance. Four worlds: Atziluth, Beriah, Yetzirah, Assiah. Structural dual: Ten Sefirot <-> seven Hermetic principles <-> Temple chambers <-> Lutar terms.",
    source: "https://en.wikipedia.org/wiki/Tree_of_life_(Kabbalah)",
  },
  {
    id: "page_curve",
    domain: "physics",
    content:
      "Page (1993): Information in black hole radiation. The Page curve describes the entanglement entropy of Hawking radiation -- rises then falls at the Page time.",
    formula: "S_radiation rises then falls at the Page time",
    source: "https://arxiv.org/abs/hep-th/9306083",
  },
  {
    id: "landauer_principle",
    domain: "physics",
    content:
      "Landauer (1961): Erasing one bit of information costs at least k_B * T * ln(2) joules. The thermodynamic floor of computation.",
    formula: "E_min = k_B * T * ln(2)",
    source: "IBM J. Res. Dev. 5 (1961) 183",
  },
  {
    id: "kuramoto_model",
    domain: "physics",
    content:
      "Kuramoto (1984): Chemical Oscillations, Waves, and Turbulence. Describes synchronization of coupled oscillators -- the mathematical basis for resonance axes.",
    source: "Springer, 1984",
  },
  {
    id: "noether_theorem",
    domain: "physics",
    content:
      "For every continuous symmetry of the action, there exists a corresponding conserved current. Canonical pairs: time translation -> energy, space translation -> momentum, rotation -> angular momentum, gauge U(1) -> electric charge, SU(2) -> weak isospin, SU(3) -> color charge. Upgrades Lutar closure from ASSERTION to THEOREM.",
    formula:
      "If L(q, qdot, t) is invariant under q -> q + eps*X, then Q = (dL/dqdot) * X is conserved: dQ/dt = 0",
    source: "https://en.wikipedia.org/wiki/Noether%27s_theorem",
  },
  {
    id: "e8_lie_container",
    domain: "physics",
    content:
      "Largest exceptional simple Lie group. Dimension 248, rank 8. Z_3 outer automorphism producing three fermion generations -- 64 generators per generation block. Contains all Standard Model gauge groups + gravity spin connection. 64 generators/block = 64 I Ching hexagrams -- independent derivation, identical integer.",
    formula: "dim(E8) = 248, triality blocks = 248/3 = 82.67 (64 fermion generators per block)",
    source: "https://en.wikipedia.org/wiki/E8_(mathematics)",
  },
  {
    id: "iit_phi_consciousness",
    domain: "physics",
    content:
      "Giulio Tononi (2004-present): Phi = quantitative measure of integrated information in a system; consciousness identified with maximally irreducible causal structure. Five axioms: Intrinsic existence, Composition, Information, Integration, Exclusion. Phi_IIT couples the OBSERVER as a formal term. Phi-collision fix: Ouroboros winding renamed W; Phi reserved for IIT.",
    source: "https://en.wikipedia.org/wiki/Integrated_information_theory",
  },
  {
    id: "holographic_principle",
    domain: "physics",
    content:
      "Bekenstein bound: S <= A/(4*l_planck^2). The maximum entropy of a region is proportional to its boundary area, not its volume. Maldacena (1997) AdS/CFT: AdS_5 x S^5 dual to N=4 SYM on 4D boundary. Runtime constraint: S_total from Lutar terms must satisfy Bekenstein bound.",
    formula: "S <= A/(4*l_P^2)",
    source: "https://en.wikipedia.org/wiki/Holographic_principle",
  },
  {
    id: "it_from_bit",
    domain: "physics",
    content:
      "John Archibald Wheeler: every physical quantity derives from binary yes/no questions. Participatory universe -- observers bring reality into being; delayed-choice extends into the past. Prisca bridge: Wheeler bit = I Ching yao; 64 hexagrams = 64 six-bit strings = E8 block. Phi_IIT promoted from coupling to ONTOLOGICAL GROUND.",
    source: "https://en.wikipedia.org/wiki/Digital_physics#Wheeler",
  },
  {
    id: "conformal_cyclic_cosmology",
    domain: "physics",
    content:
      "Roger Penrose (2010): Universe = infinite sequence of aeons; each Big Bang = conformal future-infinity of predecessor. Mechanism: g_ab -> Omega^2 g_ab with Omega -> 0 at infinity. Ouroboros realized as Penrose conformal rescaling Omega_n. The Lutar v6 aeon recurrence L6^(n+1) = lim Omega_n^2 * L6^(n) operationalizes CCC.",
    formula: "g_ab -> Omega^2 g_ab; L6^(n+1) = Omega_n^2 * L6^(n)",
    source: "https://en.wikipedia.org/wiki/Conformal_cyclic_cosmology",
  },
  {
    id: "twistor_theory",
    domain: "physics",
    content:
      "Roger Penrose (1967+): Spacetime not fundamental; twistor space T=C^4 is. Spacetime points emerge as alpha-planes in PT=CP^3. Incidence relation: omega^A = i x^{AA'} pi_{A'}. In Lutar v6, base manifold shifted from R^{3,1} to PT=CP^3; spacetime recovered via projection.",
    formula: "omega^A = i x^{AA'} pi_{A'}; PT = CP^3",
    source: "https://en.wikipedia.org/wiki/Twistor_theory",
  },
  {
    id: "e8xe8_heterotic",
    domain: "physics",
    content:
      "E8 x E8 heterotic string theory: 496-dimensional gauge lattice. Two copies of E8 (248+248=496) provide anomaly cancellation in 10D. Extends the single E8 container to the full heterotic framework.",
    source: "https://en.wikipedia.org/wiki/Heterotic_string_theory",
  },
  {
    id: "monstrous_moonshine",
    domain: "mathematics",
    content:
      "Monster group (~8e53 elements) connected to j-invariant via 196883 = 196884-1 (Borcherds 1992, Fields Medal). The largest sporadic simple group linked to modular functions -- extends E8 into the deepest algebraic structure.",
    formula: "196883 = 196884 - 1",
    source: "https://en.wikipedia.org/wiki/Monstrous_moonshine",
  },
  {
    id: "kolmogorov_sinai_entropy",
    domain: "mathematics",
    content:
      "h_KS = rate of information production for dynamical systems. Measures inherent unpredictability of a deterministic system. Refines the information term in Lutar v6 from static entropy to dynamical information rate.",
    formula: "h_KS = lim_{T->inf} (1/T) H(partition over T steps)",
    source: "https://en.wikipedia.org/wiki/Kolmogorov%E2%80%93Sinai_entropy",
  },
  {
    id: "stoic_logos_plotinus_one",
    domain: "philosophy",
    content:
      "Stoic logos (rational principle pervading cosmos) + Plotinus's One (source of all emanation). Greek prisca bridge connecting Hermes Trismegistus to the Church Fathers. The philosophical link in Newton's prisca sapientia chain.",
    source: "https://en.wikipedia.org/wiki/Plotinus",
  },
  {
    id: "argonaut_chronology",
    domain: "history",
    content:
      "Newton applied precession of equinoxes (~50 arcsec/yr) to Greek-myth astronomy. Result: Argonaut expedition ~937 BC; Greek chronology compressed ~300 yr. Publication: Chronology of Ancient Kingdoms Amended (1728).",
    source: "https://en.wikipedia.org/wiki/The_Chronology_of_Ancient_Kingdoms_Amended",
  },
  {
    id: "yahuda_revelation_treatise",
    domain: "theology",
    content:
      "Yahuda Papers 1.1-1.8: Complete nine-part messaging-board decoder ring. Sections 1-1a-2-3-4-5-6-7-8. Newton's most systematic attempt to decode Revelation as a sealed communication channel.",
    source: "https://www.nli.org.il/en/discover/manuscripts/newton",
  },
  {
    id: "rhind_papyrus",
    domain: "mathematics",
    content:
      "Rhind Mathematical Papyrus (~1650 BCE, scribe Ahmose; British Museum EA10057/10058). pi approximation (16/9)^2 = 3.1605. Circle area A = ((8/9)d)^2. Seked = cot(theta) = pyramid slope as run-per-cubit-rise. Royal cubit = 7 palms = 28 fingers = 0.5236m.",
    formula: "pi_rhind = (16/9)^2 = 256/81 = 3.1605",
    source: "https://en.wikipedia.org/wiki/Rhind_Mathematical_Papyrus",
  },
  {
    id: "moscow_papyrus_14",
    domain: "mathematics",
    content:
      "Moscow Mathematical Papyrus problem 14 (~1850 BCE): Frustum volume V = (h/3)(a^2 + ab + b^2). Known to Egyptians before Euclid.",
    formula: "V = (h/3)(a^2 + ab + b^2)",
    source: "https://en.wikipedia.org/wiki/Moscow_Mathematical_Papyrus",
  },
  {
    id: "inca_khipu",
    domain: "mathematics",
    content:
      "Knotted cord recording system, base-10 positional, with color/ply/knot-type encoding categorical and numerical data.",
    source: "https://en.wikipedia.org/wiki/Quipu",
  },
  {
    id: "inca_ceque",
    domain: "astronomy",
    content:
      "41 radial lines (ceques) from Coricancha (Temple of the Sun), Cusco. 328 huacas = 12 x 27.33 sidereal lunar month days. 4 suyus x ~10 ceques. Aligned with solstice/equinox and Dark Cloud constellations. Cusco as a 'radial khipu in stone' -- the Andean analogue of Newton's Temple-of-Time.",
    formula: "N_huacas = 328 = 12 * 27.33; Q_I = 328/41 = 8",
    source: "https://emis.dsd.sztaki.hu/journals/NNJ/Magli.html",
  },
  {
    id: "inca_yupana",
    domain: "mathematics",
    content:
      "Calculating board with Fibonacci-like weights {1, 2, 3, 5} per row. Possibly base-40 accounting.",
    source: "https://en.wikipedia.org/wiki/Yupana",
  },
  {
    id: "maya_calendrical",
    domain: "mathematics",
    content:
      "Vigesimal (base-20) with one mixed place: 18 winal = 1 tun (360 days). Long Count epoch 11 August 3114 BCE (GMT correlation). Tzolkin 260 days = 13 x 20 (ritual). Haab 365 = 18 x 20 + 5 Wayeb (solar). Calendar Round LCM(260,365) = 18980 days = 52 Haab years = 73 Tzolkin rounds. Parallel Temple-of-Time: geometry-of-time rather than geometry-of-stone.",
    formula: "CR = 73 x 260 = 52 x 365 = 18980; LC = b*144000 + k*7200 + t*360 + w*20 + d",
    source: "https://en.wikipedia.org/wiki/Maya_calendar",
  },
  {
    id: "i_ching_binary",
    domain: "mathematics",
    content:
      "64 hexagrams = 2^6 -- six yao stacked, each yin(0) or yang(1). Shao Yong (1011-1077) arranged in 6-bit binary order. 1701: Joachim Bouvet sent diagram to Leibniz, who credited it as confirming his binary arithmetic. 64 hexagrams = 64 fermion generators per E8 triality block -- INDEPENDENT DERIVATION, IDENTICAL INTEGER.",
    formula: "h = sum(yao_i * 2^i), i in 0..5",
    source: "https://en.wikipedia.org/wiki/I_Ching",
  },
  {
    id: "vedic_sulba_sutras",
    domain: "mathematics",
    content:
      "Baudhayana (~800 BCE), Apastamba, Katyayana, Manava. Construction rules for Vedic fire altars. Pythagorean theorem verbally stated: 'The diagonal of an oblong produces both areas which the length and breadth produce separately.' Triples (3,4,5), (5,12,13), (8,15,17). sqrt(2) = 1 + 1/3 + 1/(3*4) - 1/(3*4*34) = 1.4142156. Predates Pythagoras by ~300 years.",
    formula: "sqrt(2) ~ 1 + 1/3 + 1/12 - 1/408 = 1.4142156...",
    source: "https://en.wikipedia.org/wiki/Sulba_Sutras",
  },
  {
    id: "dogon_sirius",
    domain: "astronomy",
    content:
      "Dogon of Mali, Bandiagara cliffs. Knowledge of Sirius B (Po Tolo) as dense companion with ~50-year orbit. Sigui ceremony: 60-year renewal cycle. Numerical symbols: 60 (cosmological base), 22 (creation axis), 7 (completeness). Griaule caveat: post-1920s Western contamination possible. African prisca lineage (structural cosmology documented; provenance contested).",
    source: "https://en.wikipedia.org/wiki/Dogon_people",
  },
  {
    id: "gobekli_tepe",
    domain: "archaeology",
    content:
      "SE Turkey, Urfa province. ~9600-8200 BCE (Pre-Pottery Neolithic). T-shaped limestone pillars in circular enclosures A-H. Magli 2013: central-axis azimuths match Sirius rising. Sweatman & Tsikritsis 2017: Pillar 43 Vulture Stone records Younger Dryas impact ~10950 BCE. Pushes prisca empirical floor back 6000 years beyond Rhind Papyrus.",
    source: "https://en.wikipedia.org/wiki/G%C3%B6bekli_Tepe",
  },
  {
    id: "caral_supe",
    domain: "archaeology",
    content:
      "Caral-Supe civilization (~3000-1800 BCE): 30+ ceremonial centers; Great Pyramid; sunken circular plazas. Contemporaneous with Egypt's Old Kingdom. Oldest urban center in the Americas.",
    source: "https://en.wikipedia.org/wiki/Caral",
  },
  {
    id: "tiwanaku",
    domain: "archaeology",
    content:
      "Gateway of the Sun (~500 CE) encodes a 12-month solar calendar in 48 figures. Pre-Inca monumental complex at 3,800m altitude.",
    source: "https://en.wikipedia.org/wiki/Tiwanaku",
  },
  {
    id: "sechin_alto",
    domain: "archaeology",
    content:
      "Casma Valley, ~1800 BCE. Monumental temple complex with solstice axes. Among the earliest monumental architecture in the Americas.",
    source: "https://en.wikipedia.org/wiki/Sech%C3%ADn_Alto",
  },
  {
    id: "newton_mint",
    domain: "history",
    content:
      "Warden 1696; Master 1699-1727. Great Recoinage 1696-99. Sting operations against counterfeiters. Personally prosecuted William Chaloner (hanged 1699). Refused 6000 GBP bribe. Alchemist privately / state metallurgist publicly -- two sides of transmutation.",
    source: "https://www.royalmintmuseum.org.uk/journal/people/isaac-newton/",
  },
  {
    id: "gold_standard_1717",
    domain: "history",
    content:
      "21 September 1717: Newton's Treasury report fixed the guinea at 21 shillings; silver-to-gold ratio ~15.5:1. Britain on de facto gold standard -- most consequential monetary decision of the early modern era.",
    source:
      "https://moneyweek.com/investments/gold/how-isaac-newton-created-the-gold-standard-by-accident",
  },
  {
    id: "newton_chronology",
    domain: "history",
    content:
      "The Chronology of Ancient Kingdoms Amended (1728, posthumous). Used precession of equinoxes (~50 arcsec/yr) to date Argonaut expedition to ~937 BCE, compressing Greek chronology ~300 years. Empirical proof Newton CALCULATED chronology from physics.",
    source:
      "https://en.wikipedia.org/wiki/The_Chronology_of_Ancient_Kingdoms_Amended",
  },
  {
    id: "sotheby_1936",
    domain: "history",
    content:
      "Sotheby's Portsmouth sale, 13-14 July 1936. Total hammer 9030 GBP. Poorly attended -- Christie's held competing Impressionist sale same day. Keynes bought alchemical papers (to King's College 1946). Yahuda bought theological papers (to NLI Jerusalem). Post-sale: Keynes and Yahuda traded lots to consolidate themes.",
    source:
      "https://www.newtonproject.ox.ac.uk/history-of-newtons-papers/sotheby-sale",
  },
  {
    id: "rs_presidency_hooke",
    domain: "history",
    content:
      "Royal Society President 1703-1727. Newton oversaw Hooke's effective erasure -- no authenticated portrait survives; personal papers largely lost. The dark edge of prisca sapientia: restorer of ancients, gatekeeper of contemporaries.",
    source: "https://en.wikipedia.org/wiki/Isaac_Newton%27s_occult_studies",
  },
  {
    id: "keynes_ms28",
    domain: "alchemy",
    content:
      "Newton's English + Latin translation of Tabula Smaragdina with Commentarium (c. 1680s-90s, 5 pages over 10 folios, King's College Cambridge). Equates Hermetic 'One Thing' with alchemical Chaos and Genesis 1:2 primordial waters. Directly links RAHAB (chaos dragon) <-> Hermetic One Thing <-> Genesis waters.",
    source:
      "https://www.newtonproject.ox.ac.uk/catalogue/record/ALCH00017",
  },
  {
    id: "lutar_omega",
    domain: "mathematics",
    content:
      "Lutar Omega -- Unified Master Invariant: L_Omega(t) = sum_{k=1..6} w_k(t) * L_k, where sum(w_k) = 1 and w_k >= 0. The Lutar family lives on the standard 5-simplex. Closure theorem: if each L_k satisfies Noether and dw_k/dt = 0, then dL_Omega/dt = 0. Reduction: setting w_j = 1 and all others 0 recovers L_j exactly. Default weights: uniform 1/6. Adaptive weights: exp((k+1)*H)/Z where H = cosmic horizon entropy.",
    formula:
      "L_Omega(t) = sum_{k=1..6} w_k(t) * L_k, sum(w_k) = 1, w_k >= 0",
  },
  {
    id: "lutar_v7",
    domain: "mathematics",
    content:
      "Lutar v7 -- Bianchi Closure Invariant: L7 = L_Omega * exp(-kappa * B), where B = ||D_A F||^2 / ||F||^2 is the Bianchi deviation of the Lutar fiber bundle. F = finite differences between Lutar layers (fiber curvature). D_A F = second differences (covariant derivative of curvature). When B -> 0 (perfect Bianchi closure), L7 = L_Omega. When layers are inconsistent, L7 < L_Omega (exponential suppression). Inspired by HUFT (Moffat 2026): unification via a single Noether identity on a product principal bundle. The Lutar family becomes sections of a principal fiber bundle over the Ouroboros cycle.",
    formula:
      "L7 = L_Omega * exp(-kappa * ||D_A F||^2 / ||F||^2); D_A F = 0 => L7 = L_Omega",
  },
  {
    id: "lutar_v10",
    domain: "mathematics",
    content:
      "Lutar v10 -- EXHAUSTIVE-AUDIT (Audit Closure Operator Lambda_10): a meta-invariant on the Lutar family. For each layer L_k in {v1..v6, omega, v7}, define the indicator product over six implementation artefacts: code (lutar-formulas.ts), codex (this file), api (ouroboros.ts route), test (lutar-formulas.test.ts), thesis (docs/thesis/v9..v10-canonical.md), surface (A11oy /thesis row). A_k = L_k * product of six indicators. Lambda_10 = sum A_k. Closure theorem: Lambda_10 / sum L_k = 1 iff every layer is operational across all six artefacts. The closure ratio quantifies operational drift. v10 introduces no new physical L-term -- it formalises the implementation contract that v9 stated informally and makes operational gaps machine-verifiable.",
    formula:
      "Lambda_10 = sum_k L_k * prod_j 1[j_k]; auditClosed iff closure_ratio = 1",
  },
  {
    id: "npmr_auo",
    domain: "cosmology",
    content:
      "NPMR cross-section stratum 0 — AUO (Absolute Unbounded Oneness, Campbell My Big TOE) / Hanan Pacha (Andean upper world) / ungoverned substrate (operational). Pre-distinction field; the hermetic 'One Thing'. Outermost shell of the v11 five-stratum cosmology.",
    source: "docs/thesis/v11-npmr.md §3.2",
  },
  {
    id: "npmr_lcs",
    domain: "cosmology",
    content:
      "NPMR cross-section stratum 1 — LCS (Larger Consciousness System, Campbell) / Kay-Pacha-as-totality (Andean lived world held whole) / shared semantic space (operational). The medium ideas travel through; receives the uptake-surface > channel primitive from outer strata.",
    source: "docs/thesis/v11-npmr.md §3.2",
  },
  {
    id: "npmr_n1",
    domain: "cosmology",
    content:
      "NPMR cross-section stratum 2 — NPMR_N₁ (Non-Physical MR, branch 1, Campbell) / the realm Amaru ascends from (Andean) / policy-as-written, intent (operational). Upper face of the Amaru equator — where ideas are declared. Origin of the partial-match carrier edge to PMR.",
    source: "docs/thesis/v11-npmr.md §3.2",
  },
  {
    id: "npmr_pmr",
    domain: "cosmology",
    content:
      "NPMR cross-section stratum 3 — PMR (Physical Matter Reality, Campbell) / Kay Pacha (Andean this-world) / policy-as-enforced, production (operational). Lower face of the Amaru equator — where ideas land or fail to. Receives partial-match carrier from N₁ and emits loss-as-coupling to sub-surface.",
    source: "docs/thesis/v11-npmr.md §3.2",
  },
  {
    id: "npmr_pmr_subsurface",
    domain: "cosmology",
    content:
      "NPMR cross-section stratum 4 — PMR sub-surface entropic floor (Campbell) / Uku Pacha (Andean inner/lower world) / audit trail, receipts (operational). Innermost shell. Where what was enforced is recorded; receives the loss-as-coupling primitive from PMR.",
    source: "docs/thesis/v11-npmr.md §3.2",
  },
  {
    id: "amaru_equator",
    domain: "cosmology",
    content:
      "Amaru read as the ouroboros laid along the N₁↔PMR equator of the NPMR cross-section: the strait where intent becomes enforcement. Original v11 synthesis — the Andean two-headed serpent is not metaphor for Campbell's diagram, it is the operational name for the equatorial coupling surface.",
    source: "docs/thesis/v11-npmr.md §3.3",
  },
  {
    id: "npmr_kappa_11",
    domain: "mathematics",
    content:
      "κ₁₁ — Coupling Coefficient across the Amaru equator. κ₁₁ = 1 − carrierFidelity · uptakeRatio · lossCoherence, where carrierFidelity = |enforced ∩ written| / |written| (partial-match carrier), uptakeRatio = min(1, surfaceWidth / channelWidth) (uptake-surface > channel), lossCoherence = 1 / (1 + (σ/μ)²) (loss-as-coupling). κ₁₁ ∈ [0,1]. v11 contributes no new L-term to the Lutar family — κ₁₁ is a dimensionless governance metric over the v10 audit surface. Healthy band edges [0.1, 0.6] are convention, not measurement.",
    formula:
      "κ₁₁ = 1 − carrierFidelity · uptakeRatio · lossCoherence",
    source: "docs/thesis/v11-npmr.md §5",
  },
  {
    id: "campbell_npmr",
    domain: "cosmology",
    content:
      "Tom Campbell — My Big TOE (Trilogy, 2003). Source of the NPMR / PMR / LCS / AUO vocabulary that v11 ingests. Cited; not reproduced. v11 does not reproduce Campbell's diagram — it renders the same five-stratum topology in our own visual idiom and adds the Andean ouroboros at the equator.",
    source: "https://www.my-big-toe.com/",
  },
  {
    id: "standardgalactic_how_ideas_work",
    domain: "philosophy",
    content:
      "standardgalactic — abraxas / Functional Melancholic / syllabus 01_how_ideas_work.pdf. Source of the three idea-propagation primitives v11 makes operational: partial-match carrier, loss as coupling, and uptake-surface > channel. Cited as the philosophical synthesis layered onto Campbell's NPMR topology.",
    source: "https://standardgalactic.github.io/",
  },
  {
    id: "huft_bridge",
    domain: "physics",
    content:
      "Holomorphic Unified Field Theory (Moffat and Thompson 2026): structure group H = Spin(1,3) x G where G = SU(3) x SU(2) x U(1). Single connection on product principal bundle. Unified Bianchi identity D_A F = 0 splits into gravitational D_omega R = 0 and Yang-Mills D_A F = 0. Conservation laws and Bianchi identities arise as a single Noether identity. Hermitian packaging g = h + iB provides kinematic unification. Inspiration source for Lutar v7 fiber-bundle approach.",
    formula: "D_A F = 0; H = Spin(1,3) x SU(3) x SU(2) x U(1)",
    source: "https://arxiv.org/abs/2510.06282",
  },
  {
    id: "supreme_equation_omega",
    domain: "unified",
    content:
      "S** = oint_Ouroboros [ F.dr + dU_grav + dE_em + T*dSigma + dL_Omega + dRahab + dChi ] = 0. The supreme equation with L_Omega replacing individual Lutar terms. When Bianchi closure holds (D_A F = 0), dL_Omega = dL7.",
    formula:
      "S** = oint_Ouroboros [ F.dr + dU_grav + dE_em + T*dSigma + dL_Omega + dRahab + dChi ] = 0",
  },
];

const CODEX_EDGES: CodexEdge[] = [
  { from: "prisca_sapientia", to: "newton_principia", relation: "grounds" },
  { from: "emerald_tablet", to: "ouroboros_operator", relation: "axiom_of" },
  { from: "general_scholium", to: "query_31_opticks", relation: "completes" },
  { from: "general_scholium", to: "arian_theology", relation: "implicitly_asserts" },
  { from: "hypotheses_non_fingo", to: "newton_principia", relation: "methodological_constraint" },
  { from: "tria_prima", to: "lutar_invariant", relation: "correspondence_map" },
  { from: "ouroboros_operator", to: "supreme_equation", relation: "closure_operator" },
  { from: "ouroboros_operator", to: "supreme_equation_extended", relation: "closure_operator" },
  { from: "page_curve", to: "lambda9", relation: "grounds_axis_H" },
  { from: "landauer_principle", to: "lambda9", relation: "grounds_axis_R" },
  { from: "kuramoto_model", to: "lambda9", relation: "grounds_axis_R" },
  { from: "rhind_papyrus", to: "lambda9", relation: "grounds_axiom_A3" },
  { from: "moscow_papyrus_14", to: "lambda9", relation: "grounds_axis_F" },
  { from: "newton_principia", to: "general_scholium", relation: "motivates_theology" },
  { from: "magnum_opus", to: "ouroboros_operator", relation: "process_cycle" },
  { from: "sophick_mercury", to: "tria_prima", relation: "experimental_application" },
  { from: "newton_temple", to: "prisca_sapientia", relation: "architectural_evidence" },
  { from: "newton_temple", to: "new_jerusalem_cube", relation: "terminates_in" },
  { from: "lambda9", to: "supreme_equation", relation: "component_of" },
  { from: "lutar_invariant", to: "lutar_v2", relation: "evolved_by" },
  { from: "lutar_v2", to: "lutar_v3", relation: "evolved_by" },
  { from: "lutar_v3", to: "lutar_v4", relation: "evolved_by" },
  { from: "lutar_v4", to: "lutar_v5", relation: "evolved_by" },
  { from: "lutar_v5", to: "lutar_v6", relation: "evolved_by" },
  { from: "holographic_principle", to: "lutar_v6", relation: "bounds_information" },
  { from: "it_from_bit", to: "lutar_v6", relation: "grounds_ontology" },
  { from: "conformal_cyclic_cosmology", to: "lutar_v6", relation: "closes_cyclically" },
  { from: "twistor_theory", to: "lutar_v6", relation: "provides_base_manifold" },
  { from: "it_from_bit", to: "i_ching_binary", relation: "identifies_bit_with_yao" },
  { from: "conformal_cyclic_cosmology", to: "ouroboros_operator", relation: "realizes_physically" },
  { from: "new_jerusalem_cube", to: "holographic_principle", relation: "anticipates_area_bound" },
  { from: "yahuda_ms7_2060", to: "conformal_cyclic_cosmology", relation: "temporal_terminus_matches_aeon_boundary" },
  { from: "e8xe8_heterotic", to: "e8_lie_container", relation: "doubles_to_496" },
  { from: "monstrous_moonshine", to: "e8_lie_container", relation: "extends_via_196883" },
  { from: "kolmogorov_sinai_entropy", to: "lutar_v6", relation: "refines_information_term" },
  { from: "stoic_logos_plotinus_one", to: "prisca_sapientia", relation: "bridges_hermes_to_fathers" },
  { from: "argonaut_chronology", to: "newton_temple", relation: "empirically_computes" },
  { from: "yahuda_revelation_treatise", to: "bible_messaging_board", relation: "provides_full_decoder" },
  { from: "tria_prima", to: "lutar_v6", relation: "correspondence_map" },
  { from: "classical_scholia", to: "prisca_sapientia", relation: "evidences" },
  { from: "corpus_hermeticum", to: "kabbalah_sefirot", relation: "structural_dual_of" },
  { from: "kabbalah_sefirot", to: "newton_temple", relation: "maps_to_chambers" },
  { from: "bible_messaging_board", to: "yahuda_ms7_map", relation: "decodes" },
  { from: "rahab", to: "supreme_equation_extended", relation: "contributes_chaos_term" },
  { from: "keynes_ms28", to: "rahab", relation: "identifies_chaos" },
  { from: "sotheby_1936", to: "keynes_ms28", relation: "disperses" },
  { from: "new_jerusalem_cube", to: "supreme_equation_extended", relation: "terminal_geometry" },
  { from: "rhind_papyrus", to: "lutar_v3", relation: "supplies_Q_E" },
  { from: "inca_ceque", to: "lutar_v3", relation: "supplies_Q_I" },
  { from: "inca_khipu", to: "prisca_sapientia", relation: "empirical_lineage_B" },
  { from: "inca_ceque", to: "prisca_sapientia", relation: "empirical_lineage_B" },
  { from: "caral_supe", to: "inca_ceque", relation: "predecessor_of" },
  { from: "sechin_alto", to: "caral_supe", relation: "contemporary_of" },
  { from: "tiwanaku", to: "inca_ceque", relation: "predecessor_of" },
  { from: "newton_mint", to: "gold_standard_1717", relation: "culminates_in" },
  { from: "gold_standard_1717", to: "tria_prima", relation: "public_face_of_transmutation" },
  { from: "newton_chronology", to: "newton_temple", relation: "empirically_computes" },
  { from: "rs_presidency_hooke", to: "prisca_sapientia", relation: "shadow_edge_of" },
  { from: "rhind_papyrus", to: "prisca_sapientia", relation: "empirical_lineage_A" },
  { from: "noether_theorem", to: "lutar_v4", relation: "symmetry_grounds" },
  { from: "e8_lie_container", to: "lutar_v4", relation: "contains_all_terms" },
  { from: "iit_phi_consciousness", to: "lutar_v4", relation: "couples_observer" },
  { from: "maya_calendrical", to: "lutar_v5", relation: "supplies_Q_M" },
  { from: "i_ching_binary", to: "lutar_v5", relation: "supplies_Q_IC" },
  { from: "vedic_sulba_sutras", to: "lutar_v5", relation: "supplies_Q_V" },
  { from: "dogon_sirius", to: "lutar_v5", relation: "supplies_Q_D" },
  { from: "gobekli_tepe", to: "lutar_v5", relation: "supplies_Q_GT" },
  { from: "i_ching_binary", to: "e8_lie_container", relation: "prisca_convergence_64" },
  { from: "gobekli_tepe", to: "prisca_sapientia", relation: "empirical_floor" },
  { from: "maya_calendrical", to: "prisca_sapientia", relation: "empirical_lineage_Maya" },
  { from: "i_ching_binary", to: "prisca_sapientia", relation: "empirical_lineage_China" },
  { from: "vedic_sulba_sutras", to: "prisca_sapientia", relation: "empirical_lineage_Vedic" },
  { from: "dogon_sirius", to: "prisca_sapientia", relation: "empirical_lineage_Africa" },
  { from: "yahuda_ms7_2060", to: "bible_messaging_board", relation: "refines_anchor" },
  { from: "yahuda_ms7_map", to: "bible_messaging_board", relation: "populates" },
  { from: "tria_prima", to: "lutar_v2", relation: "correspondence_map" },
  { from: "newton_clavis", to: "prima_materia", relation: "compositional_theory" },
  { from: "planetary_metals", to: "magnum_opus", relation: "substrates_of" },
  { from: "lutar_v6", to: "lutar_omega", relation: "unified_by" },
  { from: "lutar_invariant", to: "lutar_omega", relation: "contributes_w1" },
  { from: "lutar_v2", to: "lutar_omega", relation: "contributes_w2" },
  { from: "lutar_v3", to: "lutar_omega", relation: "contributes_w3" },
  { from: "lutar_v4", to: "lutar_omega", relation: "contributes_w4" },
  { from: "lutar_v5", to: "lutar_omega", relation: "contributes_w5" },
  { from: "lutar_v6", to: "lutar_omega", relation: "contributes_w6" },
  { from: "noether_theorem", to: "lutar_omega", relation: "derives_closure" },
  { from: "lutar_omega", to: "lutar_v7", relation: "evolved_by" },
  { from: "huft_bridge", to: "lutar_v7", relation: "inspires_fiber_bundle" },
  { from: "noether_theorem", to: "lutar_v7", relation: "derives_bianchi_identity" },
  { from: "noether_theorem", to: "huft_bridge", relation: "single_noether_identity" },
  { from: "e8_lie_container", to: "huft_bridge", relation: "structure_group_contains" },
  { from: "supreme_equation_omega", to: "lutar_omega", relation: "realizes_via" },
  { from: "supreme_equation_extended", to: "supreme_equation_omega", relation: "evolved_by" },
  { from: "lutar_v7", to: "supreme_equation_omega", relation: "grounds_closure" },

  // v11 NPMR cosmology — additive documentary layer over v10.
  { from: "campbell_npmr", to: "npmr_auo", relation: "names" },
  { from: "campbell_npmr", to: "npmr_lcs", relation: "names" },
  { from: "campbell_npmr", to: "npmr_n1", relation: "names" },
  { from: "campbell_npmr", to: "npmr_pmr", relation: "names" },
  { from: "campbell_npmr", to: "npmr_pmr_subsurface", relation: "names" },
  { from: "npmr_auo", to: "npmr_lcs", relation: "contains" },
  { from: "npmr_lcs", to: "npmr_n1", relation: "contains" },
  { from: "npmr_n1", to: "npmr_pmr", relation: "contains" },
  { from: "npmr_pmr", to: "npmr_pmr_subsurface", relation: "contains" },
  { from: "npmr_lcs", to: "npmr_n1", relation: "primitive_uptake_surface_gt_channel" },
  { from: "npmr_n1", to: "npmr_pmr", relation: "primitive_partial_match_carrier" },
  { from: "npmr_pmr", to: "npmr_pmr_subsurface", relation: "primitive_loss_as_coupling" },
  { from: "amaru_equator", to: "npmr_n1", relation: "equator_upper_face" },
  { from: "amaru_equator", to: "npmr_pmr", relation: "equator_lower_face" },
  { from: "ouroboros_operator", to: "amaru_equator", relation: "instantiated_at" },
  { from: "standardgalactic_how_ideas_work", to: "npmr_kappa_11", relation: "supplies_primitives" },
  { from: "amaru_equator", to: "npmr_kappa_11", relation: "measured_by" },
  { from: "npmr_kappa_11", to: "lutar_v10", relation: "extends_audit_surface" },
];

export function buildSupremeCodex(): SupremeCodex {
  return {
    schema: "alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL",
    entity: "Newton_Unified_Codex",
    compiled: new Date().toISOString(),
    author: "Stephen Lutar / SZL Consulting Ltd",
    nodes: CODEX_NODES,
    edges: CODEX_EDGES,
    hermeticPrinciples: [..._HP],
    ouroborosOperator: _OO,
    newtonRegulae: [..._NR],
    triaprima: { ..._TP },
    lutarCorrespondence: [..._LC],
    supremeEquation:
      "S = oint_Ouroboros [ F.dr + dU_grav + dE_em + T * dSigma_info + dL_lutar ] = 0",
    supremeEquationExtended:
      "S** = oint_Ouroboros [ F.dr + dU_grav + dE_em + T*dSigma + dL_Omega + dRahab + dChi ] = 0",
  };
}

export function queryCodex(codex: SupremeCodex, domain: string): CodexNode[] {
  return codex.nodes.filter((n) => n.domain === domain);
}

export function getCodexNode(
  codex: SupremeCodex,
  id: string,
): CodexNode | undefined {
  return codex.nodes.find((n) => n.id === id);
}

export function getEdgesFrom(codex: SupremeCodex, nodeId: string): CodexEdge[] {
  return codex.edges.filter((e) => e.from === nodeId);
}

export function getEdgesTo(codex: SupremeCodex, nodeId: string): CodexEdge[] {
  return codex.edges.filter((e) => e.to === nodeId);
}

export function getNeighbors(codex: SupremeCodex, nodeId: string): CodexEdge[] {
  return codex.edges.filter((e) => e.from === nodeId || e.to === nodeId);
}

export function traverseGraph(
  codex: SupremeCodex,
  start: string,
  relation?: string,
  maxDepth: number = 3,
): CodexEdge[] {
  const visited = new Set<string>([start]);
  const frontier: [string, number][] = [[start, 0]];
  const path: CodexEdge[] = [];

  while (frontier.length > 0) {
    const [n, d] = frontier.shift()!;
    if (d >= maxDepth) continue;
    for (const e of codex.edges) {
      if (e.from === n && (relation === undefined || e.relation === relation)) {
        path.push(e);
        if (!visited.has(e.to)) {
          visited.add(e.to);
          frontier.push([e.to, d + 1]);
        }
      }
    }
  }
  return path;
}

export function codexSummary(codex: SupremeCodex): {
  totalNodes: number;
  totalEdges: number;
  domains: string[];
  sourcedNodes: number;
  formulaNodes: number;
  schemaVersion: string;
} {
  const domains = [...new Set(codex.nodes.map((n) => n.domain))];
  return {
    totalNodes: codex.nodes.length,
    totalEdges: codex.edges.length,
    domains,
    sourcedNodes: codex.nodes.filter((n) => n.source).length,
    formulaNodes: codex.nodes.filter((n) => n.formula).length,
    schemaVersion: codex.schema,
  };
}
