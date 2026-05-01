"""Gauß primitives — Python port (Primitives 17–20).

Faithful Python reimplementation of packages/gauss/src/*. The TypeScript
runtime is the reference; this SDK matches it numerically.

Sources
-------
Carl Friedrich Gauß, Theoria combinationis observationum erroribus minimis
obnoxiae (1823); Theoria motus corporum coelestium (1809); Disquisitiones
Arithmeticae (1801) §223–§307; Allgemeine Auflösung der Aufgabe… (1825,
prize essay on conformal mapping).

Manuscript provenance: Gauß-Nachlass, SUB Göttingen, Cod. Ms. Gauß
(Kalliope DE-611-BF-61709, GND 104234644), specifically the sections
  Geodäsie 165–170    Netzausgleichungen
  Geodäsie 179–184    Konforme Projektion
  Mathematik  07–10   Über Klassenanzahl
  Mathematik  35–47   Wahrscheinlichkeitsrechnung
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Callable, Iterable, Sequence


# ---------------------------------------------------------------------------
# Primitive 17 — Least-squares network adjustment
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LeastSquaresReport:
    solution: tuple[float, ...]
    residuals: tuple[float, ...]
    residual_norm: float
    max_residual: float
    m: int
    n: int
    normals_positive_definite: bool


def least_squares(A: Sequence[Sequence[float]], b: Sequence[float]) -> LeastSquaresReport:
    """Solve A x = b in the least-squares sense via the normal equations.

    Cholesky factorisation of N = AᵀA. Returns the unique minimiser, the
    per-row residuals, and the closure defect ||r||₂.

    Raises ValueError on degenerate input (empty matrix, ragged rows,
    m < n, or rank-deficient design).
    """
    m = len(A)
    if m == 0:
        raise ValueError("least_squares: empty design matrix")
    n = len(A[0])
    if n == 0:
        raise ValueError("least_squares: zero columns in A")
    if len(b) != m:
        raise ValueError("least_squares: b length must equal row count of A")
    if m < n:
        raise ValueError("least_squares: requires m ≥ n (over-determined system)")
    for i in range(m):
        if len(A[i]) != n:
            raise ValueError(f"least_squares: row {i} has wrong width")
        for v in A[i]:
            if not math.isfinite(v):
                raise ValueError("least_squares: non-finite entry in A")
        if not math.isfinite(b[i]):
            raise ValueError("least_squares: non-finite entry in b")

    # Build N = AᵀA (upper triangle) and rhs = Aᵀb.
    N = [[0.0] * n for _ in range(n)]
    rhs = [0.0] * n
    for i in range(m):
        row = A[i]
        bi = b[i]
        for j in range(n):
            aij = row[j]
            rhs[j] += aij * bi
            for k in range(j, n):
                N[j][k] += aij * row[k]
    # Mirror to lower triangle.
    for j in range(n):
        for k in range(j):
            N[j][k] = N[k][j]

    # Cholesky N = L Lᵀ.
    L = [[0.0] * n for _ in range(n)]
    for j in range(n):
        diag = N[j][j]
        for k in range(j):
            diag -= L[j][k] * L[j][k]
        if diag <= 0 or not math.isfinite(diag):
            raise ValueError(
                "least_squares: normal matrix is not positive-definite (rank-deficient design)"
            )
        L[j][j] = math.sqrt(diag)
        for i in range(j + 1, n):
            s = N[i][j]
            for k in range(j):
                s -= L[i][k] * L[j][k]
            L[i][j] = s / L[j][j]

    # Forward solve L y = rhs.
    y = [0.0] * n
    for i in range(n):
        s = rhs[i]
        for k in range(i):
            s -= L[i][k] * y[k]
        y[i] = s / L[i][i]

    # Back solve Lᵀ x = y.
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        s = y[i]
        for k in range(i + 1, n):
            s -= L[k][i] * x[k]
        x[i] = s / L[i][i]

    residuals = [0.0] * m
    sum_sq = 0.0
    max_r = 0.0
    for i in range(m):
        pred = 0.0
        row = A[i]
        for j in range(n):
            pred += row[j] * x[j]
        r = pred - b[i]
        residuals[i] = r
        sum_sq += r * r
        if abs(r) > max_r:
            max_r = abs(r)

    return LeastSquaresReport(
        solution=tuple(x),
        residuals=tuple(residuals),
        residual_norm=math.sqrt(sum_sq),
        max_residual=max_r,
        m=m,
        n=n,
        normals_positive_definite=True,
    )


def gauss_closure_axis(report: LeastSquaresReport, noise_sigma: float = 1.0) -> float:
    """Reduce a least-squares report to G ∈ [0,1].

        G = exp(-||r||₂² / (m · σ²))

    σ is the operator-supplied noise scale.
    """
    if not math.isfinite(noise_sigma) or noise_sigma <= 0:
        raise ValueError("gauss_closure_axis: noise_sigma must be a positive finite number")
    if report.m == 0:
        return 1.0
    mean_sq = (report.residual_norm * report.residual_norm) / report.m
    value = math.exp(-mean_sq / (noise_sigma * noise_sigma))
    return max(0.0, min(1.0, value))


# ---------------------------------------------------------------------------
# Primitive 18 — Conformal projection check
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Jacobian2x2:
    dudx: float
    dudy: float
    dvdx: float
    dvdy: float


@dataclass(frozen=True)
class ConformalReading:
    cr1: float
    cr2: float
    conformal_defect: float
    scale_factor: float
    determinant: float
    verdict: str  # "CONFORMAL" | "NEAR_CONFORMAL" | "NON_CONFORMAL" | "DEGENERATE"


@dataclass(frozen=True)
class ConformalThresholds:
    conformal: float = 1e-6
    near: float = 0.05


_DEFAULT_CONFORMAL_THRESHOLDS = ConformalThresholds()


def check_conformal(
    J: Jacobian2x2,
    thresholds: ConformalThresholds = _DEFAULT_CONFORMAL_THRESHOLDS,
) -> ConformalReading:
    """Test a 2×2 Jacobian for conformality via Cauchy–Riemann residuals."""
    for v in (J.dudx, J.dudy, J.dvdx, J.dvdy):
        if not math.isfinite(v):
            raise ValueError("check_conformal: Jacobian must contain finite numbers")

    cr1 = J.dudx - J.dvdy
    cr2 = J.dudy + J.dvdx
    det = J.dudx * J.dvdy - J.dudy * J.dvdx

    a = J.dudx * J.dudx + J.dudy * J.dudy + J.dvdx * J.dvdx + J.dvdy * J.dvdy
    bdet = abs(det)
    sum_sq = max(0.0, a)
    diff = math.sqrt(max(0.0, sum_sq * sum_sq / 4 - bdet * bdet))
    sigma1_sq = sum_sq / 2 + diff
    sigma2_sq = max(0.0, sum_sq / 2 - diff)
    sigma1 = math.sqrt(sigma1_sq)
    sigma2 = math.sqrt(sigma2_sq)
    scale = math.sqrt(sigma1 * sigma2)

    if scale == 0:
        return ConformalReading(
            cr1=cr1,
            cr2=cr2,
            conformal_defect=math.inf,
            scale_factor=0.0,
            determinant=det,
            verdict="DEGENERATE",
        )

    defect = math.sqrt(cr1 * cr1 + cr2 * cr2) / scale
    if defect <= thresholds.conformal:
        verdict = "CONFORMAL"
    elif defect <= thresholds.near:
        verdict = "NEAR_CONFORMAL"
    else:
        verdict = "NON_CONFORMAL"

    return ConformalReading(
        cr1=cr1,
        cr2=cr2,
        conformal_defect=defect,
        scale_factor=scale,
        determinant=det,
        verdict=verdict,
    )


def conformal_axis(
    reading: ConformalReading,
    thresholds: ConformalThresholds = _DEFAULT_CONFORMAL_THRESHOLDS,
) -> float:
    """Reduce a conformal reading to P ∈ [0,1].

        P = max(0, 1 − defect / near_threshold).  DEGENERATE ⇒ 0.
    """
    if reading.verdict == "DEGENERATE":
        return 0.0
    t = 1 - reading.conformal_defect / thresholds.near
    return max(0.0, min(1.0, t))


def estimate_jacobian(
    f: Callable[[float, float], tuple[float, float]],
    x: float,
    y: float,
    h: float = 1e-6,
) -> Jacobian2x2:
    """Estimate ∂(u,v)/∂(x,y) by central differences with step h."""
    if not math.isfinite(x) or not math.isfinite(y) or not math.isfinite(h) or h <= 0:
        raise ValueError("estimate_jacobian: x, y, h must be finite and h > 0")
    u_xp, v_xp = f(x + h, y)
    u_xm, v_xm = f(x - h, y)
    u_yp, v_yp = f(x, y + h)
    u_ym, v_ym = f(x, y - h)
    return Jacobian2x2(
        dudx=(u_xp - u_xm) / (2 * h),
        dudy=(u_yp - u_ym) / (2 * h),
        dvdx=(v_xp - v_xm) / (2 * h),
        dvdy=(v_yp - v_ym) / (2 * h),
    )


# ---------------------------------------------------------------------------
# Primitive 19 — Form class number h(d)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ClassNumberReport:
    discriminant: int
    class_number: int
    reduced_forms: tuple[tuple[int, int, int], ...]


def _gcd(a: int, b: int) -> int:
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a


def class_number(d: int) -> ClassNumberReport:
    """Compute the form class number h(d) for a negative discriminant.

    Enumerates reduced binary quadratic forms a x² + b x y + c y² with
    discriminant d = b² − 4ac, gcd(a,b,c) = 1, |b| ≤ a ≤ c, and the
    boundary rule: if |b| = a or a = c then b ≥ 0.

    Raises ValueError for d ≥ 0 or d ≢ 0,1 (mod 4) or |d| > 1e7.
    """
    if not isinstance(d, int):
        raise ValueError("class_number: d must be an integer")
    if d >= 0:
        raise ValueError("class_number: this implementation handles negative discriminants only")
    if d % 4 not in (0, 1):
        raise ValueError("class_number: d must be ≡ 0 or 1 (mod 4)")
    if d < -10_000_000:
        raise ValueError("class_number: |d| > 1e7 not supported (enumeration is too slow)")

    reduced: list[tuple[int, int, int]] = []
    a_max = math.floor(math.sqrt(abs(d) / 3))
    for a in range(1, a_max + 1):
        for b in range(-a, a + 1):
            num = b * b - d
            if num % (4 * a) != 0:
                continue
            c = num // (4 * a)
            if c < a:
                continue
            if _gcd(_gcd(a, b), c) != 1:
                continue
            if (abs(b) == a or a == c) and b < 0:
                continue
            reduced.append((a, b, c))

    return ClassNumberReport(
        discriminant=d,
        class_number=len(reduced),
        reduced_forms=tuple(reduced),
    )


def class_number_axis(report: ClassNumberReport, expected_ceiling: float = 8) -> float:
    """Reduce class-number h to K_axis = max(0, 1 − (h − 1)/ceiling)."""
    if not math.isfinite(expected_ceiling) or expected_ceiling < 1:
        raise ValueError("class_number_axis: expected_ceiling must be ≥ 1")
    t = 1 - (report.class_number - 1) / expected_ceiling
    return max(0.0, min(1.0, t))


# ---------------------------------------------------------------------------
# Primitive 20 — Gaussian residual goodness-of-fit
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ResidualReport:
    n: int
    mean: float
    sample_variance: float
    skewness: float
    excess_kurtosis: float
    jarque_bera: float
    verdict: str  # "GAUSSIAN" | "DRIFTING_MEAN" | "NON_GAUSSIAN" | "INSUFFICIENT"


@dataclass(frozen=True)
class ResidualThresholds:
    jb_critical: float = 5.99
    mean_tolerance: float = 0.5


_DEFAULT_RESIDUAL_THRESHOLDS = ResidualThresholds()


def residual_fit(
    residuals: Sequence[float],
    thresholds: ResidualThresholds = _DEFAULT_RESIDUAL_THRESHOLDS,
) -> ResidualReport:
    """Apply a Gaussian residual goodness-of-fit test.

    Computes mean, sample variance, skewness, excess kurtosis, and the
    Jarque–Bera statistic. Verdict is GAUSSIAN if JB ≤ jb_critical and
    |mean|/σ ≤ mean_tolerance; DRIFTING_MEAN if mean drift triggers;
    NON_GAUSSIAN if JB exceeds; INSUFFICIENT if n < 8.
    """
    n = len(residuals)
    if n < 8:
        return ResidualReport(
            n=n,
            mean=float("nan"),
            sample_variance=float("nan"),
            skewness=float("nan"),
            excess_kurtosis=float("nan"),
            jarque_bera=float("nan"),
            verdict="INSUFFICIENT",
        )
    for r in residuals:
        if not math.isfinite(r):
            raise ValueError("residual_fit: residuals must be finite numbers")

    mean = sum(residuals) / n
    m2 = m3 = m4 = 0.0
    for r in residuals:
        d = r - mean
        d2 = d * d
        m2 += d2
        m3 += d2 * d
        m4 += d2 * d2
    m2 /= n
    m3 /= n
    m4 /= n
    sample_variance = (n / (n - 1)) * m2

    sd = math.sqrt(m2)
    skewness = 0.0 if sd == 0 else m3 / (sd ** 3)
    kurtosis = 3.0 if sd == 0 else m4 / (m2 * m2)
    excess_kurtosis = kurtosis - 3

    jb = (n / 6) * (skewness * skewness + (excess_kurtosis * excess_kurtosis) / 4)

    sigma = math.sqrt(sample_variance)
    if sigma > 0 and abs(mean) / sigma > thresholds.mean_tolerance:
        verdict = "DRIFTING_MEAN"
    elif jb > thresholds.jb_critical:
        verdict = "NON_GAUSSIAN"
    else:
        verdict = "GAUSSIAN"

    return ResidualReport(
        n=n,
        mean=mean,
        sample_variance=sample_variance,
        skewness=skewness,
        excess_kurtosis=excess_kurtosis,
        jarque_bera=jb,
        verdict=verdict,
    )


def residual_axis(
    report: ResidualReport,
    thresholds: ResidualThresholds = _DEFAULT_RESIDUAL_THRESHOLDS,
) -> float:
    """Reduce a residual-fit report to F_residual = max(0, 1 − JB/(2·jb_critical)).

    INSUFFICIENT ⇒ 1 (no penalty); DRIFTING_MEAN ⇒ 0.
    """
    if report.verdict == "INSUFFICIENT":
        return 1.0
    if report.verdict == "DRIFTING_MEAN":
        return 0.0
    t = 1 - report.jarque_bera / (2 * thresholds.jb_critical)
    return max(0.0, min(1.0, t))
