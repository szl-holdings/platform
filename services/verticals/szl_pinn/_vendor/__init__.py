# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""Vendored clean-room SZL PINN core (energy / heat-transfer physics-ML).

Dropped here VERBATIM from /home/user/workspace/pinn_szl/ (clean-room, sovereign,
pure-numpy). Sibling of services/verticals/szl_mechanics/_vendor/ (the FE-NO
operator core). Files:

    szl_pinn_core.py              # 1D heat PINN  u_t = alpha*u_xx (analytic-MLP, exact derivs)
    szl_pinn_thermal.py           # 2D steady GPU-die thermal PINN + MODELED Landauer floor
    szl_pinn_validate.py          # validation harness (RUNS both solves; writes receipts/png)
    innovations/conformal_interval.py  # split-conformal honest error band (MEASURED coverage)
    innovations/lambda_gate.py         # deny-by-default Lambda gate + free-energy guard
    CORE_README.md, ATTRIBUTION.md, requirements.txt

CLEAN-ROOM: this is SZL's independent implementation. NO paper/library code or
text is copied. Attribution (method only) lives in the package header and every
receipt: PINN method = Raissi, Perdikaris & Karniadakis (2019), J. Comput. Phys.
378:686-707, doi:10.1016/j.jcp.2018.10.045. DeepXDE (LGPL) is method-only — NOT
vendored; NVIDIA Modulus (Apache-2.0) / neurodiffeq (MIT) acknowledged as prior
art, NOT copied. See ATTRIBUTION.md.

The vendored core uses intra-core ABSOLUTE imports (``from szl_pinn_core import
...``) exactly as authored. To preserve the clean-room files byte-for-byte we
make this vendor directory importable on ``sys.path`` so those absolute imports
resolve, without editing the verbatim core. ``core_adapter`` then imports the
core via ``from ._vendor import szl_pinn_core`` / ``szl_pinn_thermal``.

HONEST: if numpy is absent the import fails and ``core_adapter`` degrades to a
documented, clearly-labelled STUB (verified=False, stub=True).
"""

from __future__ import annotations

import os as _os
import sys as _sys

# Make the verbatim core's intra-package absolute imports resolve.
_VENDOR_DIR = _os.path.dirname(_os.path.abspath(__file__))
if _VENDOR_DIR not in _sys.path:
    _sys.path.insert(0, _VENDOR_DIR)
