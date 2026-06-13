# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""SZL Mechanics vertical pack — Verified Solid-Mechanics Solver (FE-NO).

Verified-Scientific-Compute vertical. Wraps a clean-room Finite-Element /
Neural-Operator (FE-NO) solid-mechanics solver into the Alloy Meridian
substrate AND a verified-compute service interface:

    solve(geometry, bcs) -> {"solution": ..., "receipt": <in-toto statement>}

THE MOAT (verified-scientific-compute): every physics solve emits a DSSE-style
in-toto provenance statement carrying a bounded-error *estimate* + a verified
flag. Not just fast compute — *attestable* compute. The statement is honest
and UNSIGNED here; signing happens on the szl_lake / khipu-consensus DSSE path
(see ``receipt.py`` and ``MOAT.md``). Unsigned input is STRUCTURAL-ONLY at the
a11oy verify-api and never reports a false "verified/green".

ATTRIBUTION (cite-never-plagiarize — clean-room, NO paper code/text copied):
  * FE-NO method family: arXiv:2606.08796 (method attribution only).
  * DeepONet operator-learning architecture: Lu, Jin, Pang, Zhang & Karniadakis,
    "Learning nonlinear operators via DeepONet based on the universal
    approximation theorem of operators", Nature Machine Intelligence 3 (2021)
    218-229. doi:10.1038/s42256-021-00302-5.

Core math lives in ``_vendor/`` (Dev 1's clean-room core, vendored verbatim
from /home/user/workspace/feno_szl/). The service/receipt/registration layer
in this package is independent of the core's internals and degrades honestly to
a documented STUB when the real core is absent.

Research seams (NOT installed as hard deps):
  * DeepONet / neural-operator libraries (deepxde-style operator learning)
  * Schwarz / domain-decomposition iterative solvers
  * Finite-element kernels (own-metal sovereign GPU fabric)

Sovereign: solves marked ``sovereign=True`` run on own metal only.
"""

from . import service  # noqa: F401  (re-export the service entrypoint)

__all__ = ["service"]
