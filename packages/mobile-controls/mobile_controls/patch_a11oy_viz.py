#!/usr/bin/env python3
"""Apply the canonical mobile retrofit edits to a11oy in-repo viz copies,
derived from the a11oy originals (not the standalones). Import path is a sibling
('./szl-mobile-controls.js') since these serve from /static/viz/<name>/."""
import sys, pathlib

base = pathlib.Path('/home/user/workspace/szl-shared-mobile/a11oy')

def patch(path, edits, label):
    p = base / path
    s = p.read_text()
    for old, new in edits:
        if old not in s:
            print(f"!! MISSING in {label}: {old[:60]!r}")
            sys.exit(1)
        assert s.count(old) == 1, f"non-unique in {label}: {old[:60]!r} ({s.count(old)}x)"
        s = s.replace(old, new)
    out = base / (path.replace('.js', '.patched.js'))
    out.write_text(s)
    print(f"OK {label} -> {out.name}")

IMPORT = "import { SZLMobileControls } from './szl-mobile-controls.js';"

# ---- DOCTRINE (PointerLock -> joystick) ----
doctrine_edits = [
 ("import * as THREE from 'three';\nimport { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';",
  "import * as THREE from 'three';\nimport { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';\n// SZL canonical mobile layer (additive — desktop WASD/pointer-lock untouched).\n"+IMPORT),
 ("  return new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});\n}",
  "  // Mobile (incl. iOS Safari): low-power, antialias off for battery + perf.\n  const H = SZLMobileControls.rendererHints();\n  return new THREE.WebGLRenderer({antialias:H.antialias, powerPreference:H.powerPreference});\n}"),
 ("const controls = new PointerLockControls(camera, document.body);\nscene.add(controls.object || camera);\nconst enterOverlay = document.getElementById('enterOverlay');\ndocument.getElementById('enterBtn').onclick = ()=> controls.lock();\ncontrols.addEventListener('lock', ()=> enterOverlay.style.display='none');\ncontrols.addEventListener('unlock', ()=> { enterOverlay.style.display='flex'; });",
  "const controls = new PointerLockControls(camera, document.body);\nscene.add(controls.object || camera);\nconst enterOverlay = document.getElementById('enterOverlay');\ndocument.getElementById('enterBtn').onclick = ()=> { if(!MC.isMobile) controls.lock(); else MC.enter(); };\ncontrols.addEventListener('lock', ()=> enterOverlay.style.display='none');\ncontrols.addEventListener('unlock', ()=> { if(!MC.isMobile) enterOverlay.style.display='flex'; });\n\n// ---- MOBILE: virtual joystick + drag-look + pinch-zoom, NO pointer lock (iOS) ----\nconst mEuler = new THREE.Euler(0,0,0,'YXZ');\nlet mPitch = 0, mYaw = 0;\nconst MC = new SZLMobileControls({\n  enterLabel: 'Enter (touch)',\n  onEnter(){ enterOverlay.style.display='none'; mEuler.setFromQuaternion(camera.quaternion); mYaw = mEuler.y; mPitch = mEuler.x; },\n  onExit(){ enterOverlay.style.display='flex'; }\n});\nif(MC.isMobile){\n  const eb = document.getElementById('enterBtn');\n  if(eb){ eb.textContent = 'Enter (touch — joystick + drag)'; eb.setAttribute('aria-label','Enter cathedral with touch controls'); }\n  const ft = document.querySelector('#hud footer span'); if(ft) ft.innerHTML = '<b>Joystick</b> walk · <b>drag right</b> look · <b>pinch</b> zoom · <b>tap</b> inspect';\n}"),
 ("document.addEventListener('click', ()=>{ if(controls.isLocked) clickPick(); });",
  "document.addEventListener('click', ()=>{ if(controls.isLocked) clickPick(); });\nif(MC.isMobile){\n  let tStart=0, tx=0, ty=0;\n  document.addEventListener('touchstart', e=>{ if(MC.active){ const t=e.changedTouches[0]; tStart=Date.now(); tx=t.clientX; ty=t.clientY; } }, {passive:true});\n  document.addEventListener('touchend', e=>{\n    if(!MC.active) return; const t=e.changedTouches[0];\n    const moved = Math.hypot(t.clientX-tx, t.clientY-ty);\n    if(Date.now()-tStart < 300 && moved < 14){\n      const ndc = new THREE.Vector2((t.clientX/innerWidth)*2-1, -(t.clientY/innerHeight)*2+1);\n      ray.setFromCamera(ndc, camera);\n      const hit = ray.intersectObjects([...PILLARS,...SORRIES,...WINDOWS], false);\n      if(hit.length){ mobilePick(hit[0].object.userData); }\n    }\n  }, {passive:true});\n}\nfunction mobilePick(ud){\n  if(ud.type==='axiom'){ const [name,sig]=AXIOMS[ud.i]; inspectBody.innerHTML=`<h2>Axiom ${ud.i+1}/14 — ${name}</h2><span class=\"k\">Lean type signature</span><pre>${sig}</pre>`; inspect.hidden=false; }\n  else if(ud.type==='sorry'){ const s=SORRY_DATA[ud.i]; if(s){ const url=GH+s.file+'#L'+s.line; inspectBody.innerHTML=`<h2>Sorry ${ud.i+1}/163</h2><pre>${s.file}:${s.line}</pre><a href=\"${url}\" target=\"_blank\" rel=\"noopener\">${url}</a>`; } else { inspectBody.innerHTML=`<h2>Sorry ${ud.i+1}/163</h2><pre>LOCKED count 163.</pre>`; } inspect.hidden=false; }\n  else if(ud.type==='axis'){ const [name,cat,floor]=AXES[ud.i]; inspectBody.innerHTML=`<h2>Axis ${ud.i+1}/13 — ${name}</h2><span class=\"k\">category</span><pre>${cat}</pre><span class=\"k\">gate</span><pre>${floor}</pre>`; inspect.hidden=false; }\n}"),
 ("  renderer.setSize(innerWidth, innerHeight);\n  renderer.setPixelRatio(Math.min(devicePixelRatio,2));",
  "  renderer.setSize(innerWidth, innerHeight);\n  renderer.setPixelRatio(SZLMobileControls.rendererHints().pixelRatio);"),
 ("      document.getElementById('pos').textContent = `x ${o.position.x.toFixed(0)}  z ${o.position.z.toFixed(0)}`;\n    }\n    const t = clock.getElapsedTime();",
  "      document.getElementById('pos').textContent = `x ${o.position.x.toFixed(0)}  z ${o.position.z.toFixed(0)}`;\n    }\n    if(MC.isMobile && MC.active){\n      const mv = MC.getMove(); const look = MC.consumeLook(); const fov = MC.consumeFov();\n      mYaw -= look.dx * 0.0024;\n      mPitch = Math.max(-Math.PI/2+0.05, Math.min(Math.PI/2-0.05, mPitch - look.dy*0.0024));\n      mEuler.set(mPitch, mYaw, 0, 'YXZ'); camera.quaternion.setFromEuler(mEuler);\n      const speed = 12; vel.set(mv.x, 0, mv.y);\n      if(vel.lengthSq()>0){ vel.normalize().multiplyScalar(speed*dt); controls.moveRight(vel.x); controls.moveForward(-vel.z); }\n      const o = controls.object || camera;\n      o.position.x = Math.max(-HALL_W/2+2.5, Math.min(HALL_W/2-2.5, o.position.x));\n      o.position.z = Math.max(-86, Math.min(63, o.position.z)); o.position.y = 4.2;\n      if(fov){ camera.fov = Math.max(40, Math.min(95, camera.fov + fov)); camera.updateProjectionMatrix(); }\n      document.getElementById('pos').textContent = `x ${o.position.x.toFixed(0)}  z ${o.position.z.toFixed(0)}`;\n    }\n    const t = clock.getElapsedTime();"),
 ("    renderer.render(scene, camera);\n    requestAnimationFrame(loop);\n  }\n  loop();",
  "    if(!document.hidden) renderer.render(scene, camera);\n    requestAnimationFrame(loop);\n  }\n  loop();"),
]

# ---- KHIPU (OrbitControls) ----
khipu_edits = [
 ("import * as THREE from 'three';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
  "import * as THREE from 'three';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';\n// SZL canonical mobile layer (additive).\n"+IMPORT+"\nconst SZL_MOBILE = SZLMobileControls.isMobileDevice();\nconst SZL_REDUCED = SZLMobileControls.prefersReducedMotion();"),
 ("  const r = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });\n  RENDER_BACKEND='webgl2';\n  return r;",
  "  const H = SZLMobileControls.rendererHints();\n  const r = new THREE.WebGLRenderer({ antialias:H.antialias, alpha:false, powerPreference:H.powerPreference });\n  RENDER_BACKEND='webgl2';\n  return r;"),
 ("    return { ok:false, entries: demoLedger(f.id, 320).map(normalize(f)) };",
  "    return { ok:false, entries: demoLedger(f.id, Math.round(320*SZLMobileControls.particleScale())).map(normalize(f)) };"),
 ("  renderer.setSize(innerWidth, innerHeight);\n  renderer.setPixelRatio(Math.min(devicePixelRatio,2));\n  document.getElementById('root').appendChild(renderer.domElement);\n  document.getElementById('renderPill').textContent = RENDER_BACKEND.toUpperCase();",
  "  renderer.setSize(innerWidth, innerHeight);\n  renderer.setPixelRatio(SZLMobileControls.rendererHints().pixelRatio);\n  document.getElementById('root').appendChild(renderer.domElement);\n  document.getElementById('renderPill').textContent = RENDER_BACKEND.toUpperCase();"),
 ("  controls = new OrbitControls(camera, renderer.domElement);\n  controls.enableDamping = true; controls.dampingFactor=0.06;\n  controls.minDistance=20; controls.maxDistance=400;",
  "  controls = new OrbitControls(camera, renderer.domElement);\n  controls.enableDamping = true; controls.dampingFactor=0.06;\n  controls.minDistance=20; controls.maxDistance=400;\n  if(SZL_MOBILE){ controls.rotateSpeed=0.6; controls.zoomSpeed=0.8; controls.enablePan=true; }"),
 ("  function loop(){\n    const t = clock.getElapsedTime();\n    scene.rotation.y = t*0.018;          // slow constellation drift\n    core.scale.setScalar(1+Math.sin(t*1.2)*0.06);\n    controls.update();\n    renderer.render(scene, camera);\n    requestAnimationFrame(loop);\n  }",
  "  function loop(){\n    const t = clock.getElapsedTime();\n    if(!SZL_REDUCED) scene.rotation.y = t*0.018;\n    core.scale.setScalar(1+(SZL_REDUCED?0:Math.sin(t*1.2)*0.06));\n    controls.update();\n    if(!document.hidden) renderer.render(scene, camera);\n    requestAnimationFrame(loop);\n  }"),
]

# ---- ROUTER (OrbitControls) ----
router_edits = [
 ("import * as THREE from 'three';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';\nimport { TIERS, ORGANS, MODELS } from './models.js';",
  "import * as THREE from 'three';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';\nimport { TIERS, ORGANS, MODELS } from './models.js';\n// SZL canonical mobile layer (additive).\n"+IMPORT+"\nconst SZL_MOBILE = SZLMobileControls.isMobileDevice();\nconst SZL_REDUCED = SZLMobileControls.prefersReducedMotion();"),
 ("  return new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});\n}",
  "  const H = SZLMobileControls.rendererHints();\n  return new THREE.WebGLRenderer({antialias:H.antialias, powerPreference:H.powerPreference});\n}"),
 ("  renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));\n  document.getElementById('root').appendChild(renderer.domElement);\n  document.getElementById('renderPill').textContent=BACKEND.toUpperCase();\n  controls=new OrbitControls(camera, renderer.domElement); controls.enableDamping=true; controls.dampingFactor=0.06;\n  controls.minDistance=30; controls.maxDistance=220; controls.maxPolarAngle=Math.PI*0.49;",
  "  renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(SZLMobileControls.rendererHints().pixelRatio);\n  document.getElementById('root').appendChild(renderer.domElement);\n  document.getElementById('renderPill').textContent=BACKEND.toUpperCase();\n  controls=new OrbitControls(camera, renderer.domElement); controls.enableDamping=true; controls.dampingFactor=0.06;\n  controls.minDistance=30; controls.maxDistance=220; controls.maxPolarAngle=Math.PI*0.49;\n  if(SZL_MOBILE){ controls.rotateSpeed=0.6; controls.zoomSpeed=0.8; controls.enablePan=true; }"),
 ("    const dt=clock.getDelta(); const t=clock.getElapsedTime();\n    scene.rotation.y = t*0.04;",
  "    const dt=clock.getDelta(); const t=clock.getElapsedTime();\n    if(!SZL_REDUCED) scene.rotation.y = t*0.04;"),
 ("    controls.update(); renderer.render(scene,camera); requestAnimationFrame(loop);",
  "    controls.update(); if(!document.hidden) renderer.render(scene,camera); requestAnimationFrame(loop);"),
]

patch('viz-doctrine-app.js', doctrine_edits, 'doctrine')
patch('viz-khipu-app.js', khipu_edits, 'khipu')
patch('viz-router-app.js', router_edits, 'router')
print("ALL PATCHED")
