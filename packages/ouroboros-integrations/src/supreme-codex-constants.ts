export const HERMETIC_PRINCIPLES = Object.freeze([
  "Mentalism -- All is Mind; the Universe is mental.",
  "Correspondence -- As above, so below; as below, so above.",
  "Vibration -- Nothing rests; everything moves and vibrates.",
  "Polarity -- Everything is dual; opposites are identical in nature.",
  "Rhythm -- Everything flows, out and in; the pendulum-swing manifests in everything.",
  "Cause and Effect -- Every cause has its effect; every effect has its cause.",
  "Gender -- Gender is in everything; everything has its masculine and feminine principles.",
]);

export const NEWTON_REGULAE = Object.freeze([
  "Rule I -- No more causes of natural things than are both true and sufficient.",
  "Rule II -- Same effects assign same causes.",
  "Rule III -- Qualities of bodies admitting neither intensification nor remission belong to all bodies whatsoever.",
  "Rule IV -- Propositions inferred from phenomena by induction are to be held accurately or very nearly true.",
]);

export const OUROBOROS_OPERATOR =
  "O: X -> X, O(x) = T^n(x) where T is transformation and n closes the cycle; fixed-point: O(x) = x.";

export const EMERALD_TABLET =
  "That which is above is as that which is below, and that which is below is as that which is above, to accomplish the miracles of the One Thing.";

export const TRIA_PRIMA = Object.freeze({
  Sulphur: "Soul / combustible principle / energy",
  Mercury: "Spirit / volatile principle / information",
  Salt: "Body / fixed principle / matter",
});

export const LUTAR_CORRESPONDENCE = Object.freeze([
  "Sulphur <-> Energy (alpha * E)",
  "Salt <-> Mass (beta * M * c^2)",
  "Mercury <-> Information (gamma * I * k_B * T * ln2)",
  "Rahab <-> Chaos (delta * R)",
  "Temple <-> Chronology (epsilon * Chi)",
  "Prisca <-> Authority (zeta * Psi)",
  "Azoth <-> total invariant L (eta * W closure)",
]);

export const MAGNUM_OPUS_STAGES = Object.freeze([
  "Calcination",
  "Dissolution",
  "Separation",
  "Conjunction",
  "Fermentation",
  "Distillation",
  "Coagulation",
]);

export const COLOR_PHASES = Object.freeze({
  Nigredo: "Blackening -- putrefaction, dissolution of the ego",
  Albedo: "Whitening -- purification, first appearance of light",
  Citrinitas: "Yellowing -- solar dawn between Albedo and Rubedo",
  Rubedo: "Reddening -- union of opposites, completion of the work",
});

export const NEWTON_FORMULAS = Object.freeze({
  mechanics: {
    second_law: "F = m * a",
    third_law: "F_12 = -F_21",
    momentum: "p = m * v",
    kinetic_energy: "KE = (1/2) * m * v^2",
    pendulum: "T = 2 * pi * sqrt(L/g)",
  },
  gravitation: {
    universal: "F = G * m1 * m2 / r^2",
    potential: "U = -G * m1 * m2 / r",
    escape_velocity: "v_e = sqrt(2 * G * M / r)",
    kepler_III: "T^2 = (4 * pi^2 / (G * M)) * a^3",
    shell_theorem:
      "Spherically symmetric body attracts externals as point mass at center.",
  },
  calculus: {
    derivative: "dy/dx = lim_{h->0} (f(x+h) - f(x)) / h",
    fundamental_theorem: "integral_a^b f'(x) dx = f(b) - f(a)",
    newton_raphson: "x_{n+1} = x_n - f(x_n) / f'(x_n)",
  },
  optics: {
    snell: "n1 * sin(theta1) = n2 * sin(theta2)",
    cooling: "dT/dt = -k * (T - T_env)",
  },
});

export const SUPREME_EQUATION =
  "S = oint_Ouroboros [ F.dr + dU_grav + dE_em + T * dSigma_info + dL_lutar ] = 0";

export const SUPREME_EQUATION_EXTENDED =
  "S* = oint_Ouroboros [ F.dr + dU_grav + dE_em + T dSigma_info + dL_Lutar + dRahab_chaos + dChi_Temple(t) ] = 0";

export const SUPREME_DERIVATION = Object.freeze([
  "Newton II: F = m * a => W = integral(F.dr)",
  "Gravitation: dU = -G * m1 * m2 / r^2 * dr",
  "EM/Optics: dE_em = (1/2)(eps0 * E^2 + B^2/mu0) dV",
  "Information: dSigma = k_B * d(ln Omega), Landauer cost k_B * T * ln2 per bit erased",
  "Hermetic correspondence equates macrocosmic and microcosmic integrals",
  "Ouroboric closure: any loop in state-space integrates to zero",
  "Lutar: L = alpha * E + beta * M * c^2 + gamma * I * k_B * T * ln2 conserved",
  "Rahab: dRahab_chaos = differential of unordered primordial substrate, integrated to zero by Lutar closure",
  "Temple: dChi_Temple(t) = chronological 1-form, cubit-space <-> prophetic-time",
  "Therefore S* = 0 is the Supreme Invariant of the unified codex",
]);
