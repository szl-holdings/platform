/* SPDX-License-Identifier: Apache-2.0
 * © 2026 SZL Holdings — <LiveWires3D> React-Three-Fiber wrapper (PURIQ / Doctrine v12)
 * Sign: Yachay. git trailer: Perplexity Computer Agent.
 *
 * Thin RTF wrapper around the framework-agnostic core (live_wires_3d.js). The flagship
 * Docker Spaces serve the static HTML host (live_wires.html); React consumers (e.g. the
 * a11oy hub SPA, GitHub profile READMEs embed) use this component.
 *
 *   <LiveWires3D flagshipName="a11oy" wsEndpoint="/api/a11oy/v1/wires/stream" />
 *
 * Props:
 *   flagshipName : "a11oy"|"amaru"|"sentra"|"killinchu"|"rosie"
 *   wsEndpoint   : SSE stream URL (named wsEndpoint per task; transport is SSE — see 3DWPP_SPEC §2)
 *   boeBase      : BoE pull base (default /api/<ns>/v1/wires/boe)
 *   view         : "anatomy"|"wire"|"constellation"
 *   onPulseClick : (event3dwpp) => void  (host opens BoE modal; default = built-in modal)
 */
import React, { useEffect, useRef, useState } from "react";

export default function LiveWires3D({
  flagshipName = "a11oy",
  wsEndpoint,
  boeBase,
  view = "wire",
  onPulseClick,
  onWireHover,
}) {
  const elRef = useRef(null);
  const instRef = useRef(null);
  const [stats, setStats] = useState({ pulses: 0, webgpu: false });
  const ns = flagshipName.toLowerCase();
  const stream = wsEndpoint || `/api/${ns}/v1/wires/stream`;
  const boe = boeBase || `/api/${ns}/v1/wires/boe`;

  useEffect(() => {
    let canceled = false;
    function boot() {
      if (canceled || !window.LiveWires3D || !window.THREE) return;
      instRef.current = window.LiveWires3D.mount({
        el: elRef.current,
        flagshipName: ns,
        streamUrl: stream,
        boeBase: boe,
        view,
        onPulseClick: onPulseClick || ((ev) => defaultModal(ev, boe)),
        onWireHover,
        onHeartbeat: () => setStats(instRef.current.stats()),
      });
    }
    // ensure THREE + core are present (host injects via <script> CDN)
    ensureScripts(["https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
                   "./live_wires_3d.js"]).then(boot);
    const id = setInterval(() => instRef.current && setStats(instRef.current.stats()), 1500);
    return () => { canceled = true; clearInterval(id); instRef.current && instRef.current.destroy(); };
  }, [ns]);

  useEffect(() => { instRef.current && instRef.current.setView(view); }, [view]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 520, background: "#070b12" }}>
      <div ref={elRef} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", top: 12, right: 12, padding: "8px 12px", background: "rgba(14,20,30,.82)",
        border: "1px solid #1e293b", borderRadius: 10, color: "#cbd5e1", font: "12px ui-monospace,monospace" }}>
        <b style={{ color: "#fbbf24" }}>LIVE</b> · {stats.webgpu ? "WebGPU" : "WebGL2"} · pulses {stats.pulses}
      </div>
    </div>
  );
}

function ensureScripts(urls) {
  return urls.reduce((p, src) => p.then(() => new Promise((res) => {
    if ([...document.scripts].some((s) => s.src.includes(src.replace("./", "")))) return res();
    const el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = res; document.body.appendChild(el);
  })), Promise.resolve());
}

// minimal built-in modal if host supplies none
function defaultModal(ev, boe) {
  fetch(`${boe}/${encodeURIComponent(ev.receipt_hash)}`).then((r) => r.json()).then((b) => {
    // host apps should override onPulseClick; this is the no-op-safe fallback.
    console.log("[LiveWires3D] BoE", b);
    alert(`Wire ${ev.wire_letter} · ${ev.source_flagship}→${ev.target_flagship || "·"}\n` +
      `receipt ${ev.receipt_hash}\nΛ=${ev.lambda_value} Yuyay=${ev.yuyay_score}\n` +
      `HUKLLA=${(ev.hukulla_tripwires || []).join(",") || "clean"}\n${ev.honesty || ""}`);
  }).catch(() => {});
}
