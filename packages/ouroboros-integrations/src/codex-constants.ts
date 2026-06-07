export const PHYSICAL_CONSTANTS = Object.freeze({
  G: 6.6743e-11,
  c: 2.99792458e8,
  h: 6.62607015e-34,
  hbar: 1.054571817e-34,
  k_B: 1.380649e-23,
  e: 1.602176634e-19,
  eps0: 8.8541878128e-12,
  mu0: 1.25663706212e-6,
  pi: Math.PI,
  phi: 1.6180339887498948482,
  ln2: Math.LN2,
});

export const SACRED_CUBIT_FT = 2.068;
export const ROYAL_CUBIT_M = 0.5236;
export const PI_RHIND = 256 / 81;
export const Q_I_INCA = 328 / 41;
export const Q_M_MAYA = 73;
export const Q_IC_ICHING = 64;
export const Q_V_VEDIC = 1.4142156;
export const Q_D_DOGON = 50;
export const Q_GT_GOBEKLI = -11600;
export const E8_DIM = 248;
export const E8_TRIALITY = 3;
export const E8_FERMION_BLOCK = E8_DIM / E8_TRIALITY;

export const L_PLANCK = Math.sqrt(
  PHYSICAL_CONSTANTS.hbar * PHYSICAL_CONSTANTS.G / (PHYSICAL_CONSTANTS.c ** 3),
);
export const A_PLANCK = L_PLANCK ** 2;

export const NEWTON_FORMULAS_EXPANDED = Object.freeze({
  mechanics: {
    first_law: "v = const when F_net = 0",
    second_law: "F = dp/dt = m*a (p = m*v)",
    third_law: "F_12 = -F_21",
    momentum: "p = m*v",
    angular_momentum: "L = r x p",
    torque: "tau = r x F = dL/dt",
    impulse: "J = integral(F dt) = Delta p",
    work: "W = integral(F . dr)",
    kinetic_energy: "KE = (1/2) m v^2",
    potential_energy_grav_local: "U = m g h",
    power: "P = dW/dt = F . v",
    centripetal: "F_c = m v^2 / r = m omega^2 r",
    simple_harmonic: "F = -k x ; omega = sqrt(k/m)",
    pendulum: "T = 2 pi sqrt(L/g)",
  },
  gravitation: {
    universal: "F = G m1 m2 / r^2",
    potential: "U = -G m1 m2 / r",
    field: "g = -G M / r^2 r_hat",
    escape_velocity: "v_e = sqrt(2 G M / r)",
    orbital_velocity: "v = sqrt(G M / r)",
    kepler_I: "Orbits are ellipses with the Sun at one focus.",
    kepler_II: "Equal areas in equal times: dA/dt = L/(2m) = const.",
    kepler_III_newton: "T^2 = (4 pi^2 /(G(M+m))) a^3",
    shell_theorem:
      "Spherically symmetric body attracts externals as point mass at center.",
  },
  calculus: {
    derivative: "dy/dx = lim_{h->0} (f(x+h)-f(x))/h",
    fluxion_notation: "x-dot = dx/dt",
    fundamental_theorem: "integral_a^b f'(x) dx = f(b)-f(a)",
    binomial_series: "(1+x)^n = sum_{k=0..inf} C(n,k) x^k",
    taylor_series: "f(x) = sum_{n=0..inf} f^(n)(a)/n! (x-a)^n",
    newton_raphson: "x_{n+1} = x_n - f(x_n)/f'(x_n)",
    newton_identities: "p_k - e_1 p_{k-1} + ... + (-1)^{k-1} k e_k = 0",
    generalized_binomial: "(1+x)^alpha = sum C(alpha,k) x^k for real alpha",
    method_of_fluxions_inverse:
      "Given x-dot, find x via anti-fluxion (integration).",
  },
  optics: {
    snell: "n1 sin(theta1) = n2 sin(theta2)",
    dispersion_cauchy: "n(lambda) = A + B/lambda^2 + C/lambda^4",
    newtons_rings_bright: "r_m^2 = (m + 1/2) lambda R",
    newtons_rings_dark: "r_m^2 = m lambda R",
    reflecting_telescope:
      "f-number uses concave mirror to avoid chromatic aberration",
    prism_deviation: "delta = (n-1) A (thin prism)",
  },
  thermal_fluid: {
    law_of_cooling:
      "dT/dt = -k (T - T_env); T(t) = T_env + (T0-T_env) e^(-k t)",
    speed_of_sound_newton:
      "v = sqrt(P/rho) (isothermal, later Laplace-corrected)",
    viscous_drag: "F_drag proportional to v (Newton's experimental law)",
  },
});

export const ALCHEMICAL_PROCESSES = Object.freeze([
  "Calcination",
  "Dissolution",
  "Separation",
  "Conjunction",
  "Putrefaction",
  "Congelation",
  "Cibation",
  "Sublimation",
  "Fermentation",
  "Exaltation",
  "Multiplication",
  "Projection",
]);

export const PLANETARY_METALS = Object.freeze({
  "Sun-Gold": "Au",
  "Moon-Silver": "Ag",
  "Mercury-Quicksilver": "Hg",
  "Venus-Copper": "Cu",
  "Mars-Iron": "Fe",
  "Jupiter-Tin": "Sn",
  "Saturn-Lead": "Pb",
});

export const FOUR_ELEMENTS = Object.freeze({
  Fire: "hot + dry",
  Air: "hot + wet",
  Water: "cold + wet",
  Earth: "cold + dry",
});

export const NOETHER_CANONICAL_PAIRS = Object.freeze({
  time_translation: "energy conservation",
  space_translation: "linear momentum",
  rotation: "angular momentum",
  gauge_U1: "electric charge",
  gauge_SU2: "weak isospin",
  gauge_SU3: "color charge",
});

export const TEN_SEFIROT = Object.freeze([
  "Keter (Crown)",
  "Chokhmah (Wisdom)",
  "Binah (Understanding)",
  "Chesed (Mercy)",
  "Gevurah (Severity)",
  "Tiferet (Beauty)",
  "Netzach (Eternity)",
  "Hod (Splendor)",
  "Yesod (Foundation)",
  "Malkuth (Kingdom)",
]);

export const TEMPORAL_INDEX = Object.freeze([
  { year: -11600, event: "Gobekli Tepe empirical floor of prisca" },
  { year: -3114, event: "Maya Long Count epoch (11 Aug)" },
  { year: -1650, event: "Rhind Mathematical Papyrus scribed" },
  { year: -800, event: "Baudhayana Sulba Sutra" },
  { year: -457, event: "Decree of Artaxerxes -- anchor for Daniel 9's 70 weeks" },
  { year: 33, event: "Messianic terminus ad quem per Daniel 9 (Newton's reading)" },
  { year: 325, event: "Council of Nicaea -- origin of Trinitarian 'corruption' per Newton" },
  { year: 609, event: "Rise of the Saracen empire -- Fifth Trumpet (Yahuda MS 7)" },
  { year: 1077, event: "Shao Yong dies; binary hexagram arrangement" },
  { year: 1687, event: "Principia published" },
  { year: 1696, event: "Newton Warden of the Mint" },
  { year: 1701, event: "Leibniz receives Shao Yong diagram from Bouvet" },
  { year: 1704, event: "Opticks published" },
  { year: 1713, event: "General Scholium appended to Principia 2nd ed." },
  { year: 1717, event: "21 Sept Treasury report -- gold standard" },
  { year: 1727, event: "Newton's death" },
  { year: 1728, event: "Chronology of Ancient Kingdoms + System of the World (posthumous)" },
  { year: 1733, event: "Observations upon Daniel & Apocalypse published" },
  { year: 1936, event: "Sotheby's Portsmouth sale" },
  { year: 1997, event: "Maldacena AdS/CFT" },
  { year: 2007, event: "Lisi E8 theory" },
  { year: 2010, event: "Penrose CCC" },
  { year: 2060, event: "Newton's earliest terminus for eschaton -- NOT BEFORE this date" },
]);

export const NEWTON_PUBLICATIONS = Object.freeze([
  { year: 1669, title: "De analysi per aequationes numero terminorum infinitas", domain: "math" },
  { year: 1671, title: "Methodus fluxionum et serierum infinitarum", published: 1736, domain: "calculus" },
  { year: 1672, title: "New Theory about Light and Colours (Phil. Trans.)", domain: "optics" },
  { year: 1675, title: "Hypothesis Explaining the Properties of Light", domain: "optics" },
  { year: 1684, title: "De motu corporum in gyrum", domain: "mechanics" },
  { year: 1687, title: "Philosophiae Naturalis Principia Mathematica", domain: "mechanics/gravity" },
  { year: 1704, title: "Opticks", domain: "optics" },
  { year: 1704, title: "Tractatus de Quadratura Curvarum", domain: "calculus" },
  { year: 1704, title: "Enumeratio linearum tertii ordinis", domain: "geometry" },
  { year: 1707, title: "Arithmetica Universalis", domain: "algebra" },
  { year: 1711, title: "Analysis per quantitatum series, fluxiones, ac differentias", domain: "math" },
  { year: 1713, title: "Commercium Epistolicum", domain: "history-of-math" },
  { year: 1728, title: "The System of the World", domain: "celestial-mechanics" },
  { year: 1728, title: "The Chronology of Ancient Kingdoms Amended", domain: "chronology" },
  { year: 1733, title: "Observations upon the Prophecies of Daniel and the Apocalypse of St. John", domain: "theology" },
  { year: 1736, title: "Method of Fluxions (English)", domain: "calculus" },
  { year: 1740, title: "De Mundi Systemate (Latin system of the world)", domain: "celestial-mechanics" },
]);

export const MANUSCRIPT_ARCHIVES = Object.freeze([
  "King's College Cambridge (Keynes)",
  "Cambridge University Library (MS Add.)",
  "National Library of Israel (Yahuda)",
  "Royal Society",
  "Trinity College Cambridge",
  "Indiana University Chymistry of Isaac Newton project",
]);
