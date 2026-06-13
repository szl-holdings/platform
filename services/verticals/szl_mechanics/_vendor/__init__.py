# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
"""Vendored clean-room FE-NO core (Dev 1).

Drop the following files here VERBATIM from /home/user/workspace/feno_szl/ once
Dev 1 reports done (poll feno_szl/dev1_feno_core.md):

    szl_feno_core.py        # FE-NO solid-mechanics solver (exposes solve(...))
    szl_point_deeponet.py   # point-DeepONet operator surrogate
    szl_feno_validate.py    # validation / bounded-error ESTIMATE

CLEAN-ROOM: this is Dev 1's independent implementation. NO paper code/text is
copied. Attribution (method only) lives in the package header and every receipt:
arXiv:2606.08796 (FE-NO) + DeepONet (Lu et al. 2021, doi:10.1038/s42256-021-00302-5).

Until then, ``core_adapter`` degrades to a documented, clearly-labelled STUB
(verified=False, stub=True). TODO(dev1-core): vendor + remove the stub branch.
"""
