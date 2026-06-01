# --- the ADDITIVE registration block injected into each flagship serve.py/app.py ---
BLOCK_FASTAPI = '''
# ── Live 3D Wires (PURIQ / Doctrine v12) — ADDITIVE, ZERO BANDAID ────────────
# Bakes the "Live Wires" 3D panel into THIS flagship's cortex: /live-wires + the
# 3DWPP SSE stream + court-admissible BoE drill-down. Real in-process wire data
# (szl_wire / szl_jack); empty buffers render as IDLE wires (never faked).
# Signatures honestly PLACEHOLDER until Sigstore CI wired. Sign: Yachay.
try:
    import szl_live_wires as _live_wires
    _live_wires.register({APP}, ns="{NS}")
    import sys as _sys_lw
    print("[{NS}] Live 3D Wires registered: /live-wires + /api/{NS}/v1/wires/{{stream,boe}}", file=_sys_lw.stderr)
except Exception as _lw_e:
    import sys as _sys_lw
    print(f"[{NS}] Live 3D Wires NOT registered: {{_lw_e}}", file=_sys_lw.stderr)
'''
