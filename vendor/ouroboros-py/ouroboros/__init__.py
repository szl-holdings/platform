"""Ouroboros — Python SDK for the runtime trust envelope.

Four axes:
  C — Cleanliness (witness anchor)
  H — Horizon (Page-curve bounded reversibility)
  R — Resonance (handoff Q-factor, Landauer-bounded)
  F — Frustum (three-witness Jaccard reconciliation)

Compounded by the Lutar Invariant Λ = C^α · H^β · R^γ · F^δ
with Egyptian-inspectable weights (each w expressible as a finite sum
of distinct unit fractions, sum exactly 1).

This SDK is a faithful Python reimplementation of the TypeScript runtime
in packages/invariant, packages/reconciliation. The TS runtime is the
reference; this SDK matches it numerically.
"""
from ouroboros.invariant import (
    LutarAxes,
    LutarReport,
    LutarWeights,
    InspectableWeight,
    default_weights,
    inspectable_weight,
    lutar_invariant,
    verify_lutar_bound,
    weights_are_exact,
    LutarAxes5,
    LutarReport5,
    LutarWeights5,
    default_weights_5,
    lutar_invariant_5,
    verify_lutar_bound_5,
    weights_are_exact_5,
)
from ouroboros.gauss import (
    LeastSquaresReport,
    least_squares,
    gauss_closure_axis,
    Jacobian2x2,
    ConformalReading,
    ConformalThresholds,
    check_conformal,
    conformal_axis,
    estimate_jacobian,
    ClassNumberReport,
    class_number,
    class_number_axis,
    ResidualReport,
    ResidualThresholds,
    residual_fit,
    residual_axis,
)
from ouroboros.reconciliation import (
    WitnessView,
    ReconciliationReport,
    reconcile_frustum,
    frustum_formula,
    compute_seked,
    seked_to_degrees,
    decompose_unit_fraction,
    threshold_inspectable,
    reconstruct_fraction,
    egyptian_multiply,
    verify_doubling_trace,
    shift_add_accumulate,
    GREAT_PYRAMID_SEKED,
    PALMS_PER_CUBIT,
    SHIFT_ADD_PRIME,
)
from ouroboros.thales import (
    Chord,
    LocusReport,
    LocusThresholds,
    LocusVerdict,
    Point2D,
    SimilarityReading,
    SimilarityThresholds,
    SimilarityVerdict,
    SubtendedReading,
    ThalesObservation,
    ThalesReference,
    WitnessOnCircle,
    compute_similarity,
    locus_axis,
    similarity_axis,
    unit_diameter,
    verify_inscribed_angle,
)

from ouroboros import blanca, oppenheimer, socrates, lara, newton, emerald, jung, theosophy, trithemius, davinci, aristotle, fractional, anduril

__version__ = "4.6.0"
__all__ = [
    "LutarAxes",
    "LutarReport",
    "LutarWeights",
    "InspectableWeight",
    "default_weights",
    "inspectable_weight",
    "lutar_invariant",
    "verify_lutar_bound",
    "weights_are_exact",
    "WitnessView",
    "ReconciliationReport",
    "reconcile_frustum",
    "frustum_formula",
    "compute_seked",
    "seked_to_degrees",
    "decompose_unit_fraction",
    "threshold_inspectable",
    "reconstruct_fraction",
    "egyptian_multiply",
    "verify_doubling_trace",
    "shift_add_accumulate",
    "GREAT_PYRAMID_SEKED",
    "PALMS_PER_CUBIT",
    "SHIFT_ADD_PRIME",
    # Thales primitives
    "Chord",
    "LocusReport",
    "LocusThresholds",
    "LocusVerdict",
    "Point2D",
    "SimilarityReading",
    "SimilarityThresholds",
    "SimilarityVerdict",
    "SubtendedReading",
    "ThalesObservation",
    "ThalesReference",
    "WitnessOnCircle",
    "compute_similarity",
    "locus_axis",
    "similarity_axis",
    "unit_diameter",
    "verify_inscribed_angle",
    # Lutar Invariant v2 (5-axis)
    "LutarAxes5",
    "LutarReport5",
    "LutarWeights5",
    "default_weights_5",
    "lutar_invariant_5",
    "verify_lutar_bound_5",
    "weights_are_exact_5",
    # Gauß primitives 17–20
    "LeastSquaresReport",
    "least_squares",
    "gauss_closure_axis",
    "Jacobian2x2",
    "ConformalReading",
    "ConformalThresholds",
    "check_conformal",
    "conformal_axis",
    "estimate_jacobian",
    "ClassNumberReport",
    "class_number",
    "class_number_axis",
    "ResidualReport",
    "ResidualThresholds",
    "residual_fit",
    "residual_axis",
]
