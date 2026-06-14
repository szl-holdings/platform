# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1
"""SZL PINN vertical pack — Verified Physics-Informed NN Solver (heat / thermal).

Verified-Scientific-Compute vertical and SIBLING of the FE-NO mechanics vertical
(``szl_mechanics``). Wraps a clean-room, sovereign, pure-numpy Physics-Informed
Neural Network core into the Alloy Meridian substrate AND a verified-compute
service interface:

    solve_heat(domain, alpha, bc, ic) -> {"field": ..., "receipt": <in-toto>}
    solve_thermal(load_map)           -> {"temperature_field": ...,
                                          "landauer_floor_MODELED": ...,
                                          "receipt": <in-toto>}

THE MOAT (verified-scientific-compute): every physics solve emits a DSSE-style
in-toto provenance statement carrying a bounded-error *estimate*, a verified flag,
and the load-bearing ``modeled_not_measured: true`` honesty boundary. Same receipt
shape as ``szl_mechanics`` so a "scientific-compute" surface can route either
capability and verify both the same way. The statement is honest and UNSIGNED
here; signing happens on the szl_lake / khipu-consensus DSSE path (see
``receipt.py`` and ``MOAT.md``). Unsigned input is STRUCTURAL-ONLY at the a11oy
verify-api and never reports a false "verified/green".

ENERGY STORY (honest): the PINN MODELS heat/diffusion and a GPU-die thermal field;
it does NOT create or measure energy. The Landauer floor is a MODELED
thermodynamic floor, not a measured device power. Real joules are MEASURED only
via SZL's real power exporter. NO free-energy / over-unity / perpetual motion;
energy harvest = WASTED/stranded heat only.

ATTRIBUTION (cite-never-plagiarize — clean-room, NO paper/library code/text copied):
  * PINN method: Raissi, Perdikaris & Karniadakis (2019), "Physics-informed
    neural networks", J. Comput. Phys. 378:686-707, doi:10.1016/j.jcp.2018.10.045.
  * NVIDIA Modulus/PhysicsNeMo (Apache-2.0) & neurodiffeq (MIT): prior art, NOT copied.
  * DeepXDE (LGPL-2.1): METHOD-ONLY, NOT vendored.

Core math lives in ``_vendor/`` (clean-room core, vendored verbatim from
/home/user/workspace/pinn_szl/). The service/receipt/registration layer in this
package is independent of the core's internals and degrades honestly to a
documented STUB when the real core (or numpy) is absent.

Sovereign: solves marked ``sovereign=True`` run on own metal only.
"""

from . import service  # noqa: F401  (re-export the service entrypoint)

__all__ = ["service"]
