// wf-3dtype-core.js  (CLEAN SLATE v1)
// IMPORTANT: load as module:
// <script type="module" src="wf-3dtype-core.js"></script>

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";

const gsap = window.gsap;
const TAG = "[3DType/Core]";
const CORE_VERSION = "core_clean_v1_explode_radial";
console.log(TAG, CORE_VERSION);
window.__WF_3DTYPE_CORE_VERSION__ = CORE_VERSION;

// ------------------------------------------------------------
// Global params (UI edits these)
// ------------------------------------------------------------
const params = (window.params = window.params || {});
function ensureParam(k, v) {
  if (!(k in params)) params[k] = v;
}

// Defaults (kept minimal)
ensureParam("text", "EXPLODE\nME");
ensureParam("fontPreset", "Helvetiker");
ensureParam("fontSource", "preset");

// Type defaults
ensureParam("size", 72);
ensureParam("depth", 24);
ensureParam("charSpacing", 6);
ensureParam("lineHeight", 1.05); // multiplier

// Look defaults
ensureParam("bgSolid", "#111111");
ensureParam("faceSolid", "#ffffff");
ensureParam("sideSolid", "#ffffff");

// Explode defaults
ensureParam("animSpeed", 1.15);
ensureParam("animHold", 0.25);
ensureParam("animReturn", true);
ensureParam("animLoop", true);

ensureParam("explodeDistance", 220);
ensureParam("explodeRadialBoost", 0.85); // more distance for outer chars
ensureParam("explodeEdgeGain", 0.65);    // pushes edges further in addition
ensureParam("explodeJitter", 0.08);      // subtle per-char variation
ensureParam("explodeDebug", false);

// ------------------------------------------------------------
// Font presets (UI shows these)
// ------------------------------------------------------------
const FONT_PRESETS = (window.FONT_PRESETS = window.FONT_PRESETS || {
  Helvetiker: "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  Optimer: "https://threejs.org/examples/fonts/optimer_regular.typeface.json",
  Gentilis: "https://threejs.org/examples/fonts/gentilis_regular.typeface.json",
});

// ------------------------------------------------------------
// Three.js basics
// ------------------------------------------------------------
const canvasHost = document.getElementById("canvas") || document.body;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearColor(new THREE.Color(params.bgSolid), 1);
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.display = "block";
canvasHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 4000);
camera.position.set(0, 0, 700);

const lightA = new THREE.DirectionalLight(0xffffff, 1.0);
lightA.position.set(0.4, 0.9, 1.1);
scene.add(lightA);

const lightB = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(lightB);

function resize() {
  const w = canvasHost.clientWidth || window.innerWidth;
  const h = canvasHost.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// Expose tool refs so UI/debug can find them reliably
window.__WF_3DTYPE_TOOL__ = { scene, camera, renderer };

// ------------------------------------------------------------
// Materials
// ------------------------------------------------------------
let faceMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(params.faceSolid) });
let sideMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(params.sideSolid) });

// ------------------------------------------------------------
// Text build state
// ------------------------------------------------------------
let font = null;
let fontUrlLoaded = null;

let textRoot = new THREE.Group();
textRoot.name = "__wfTextRoot";
scene.add(textRoot);

// Per-character objects: { group, mesh, baseX,Y,Z, idx, line, word }
let chars = [];
window.__WF_CHARS__ = chars;

// Debug gizmo for explode center (dot only, always accurate)
let debugDot = null;
function ensureDebugDot() {
  if (debugDot) return debugDot;
  const g = new THREE.SphereGeometry(6, 16, 16);
  const m = new THREE.MeshBasicMaterial({ color: 0xff00ff, depthTest: false });
  debugDot = new THREE.Mesh(g, m);
  debugDot.renderOrder = 9999;
  debugDot.visible = false;
  debugDot.name = "__wfExplodeCenterDot";
  scene.add(debugDot);
  return debugDot;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
function stableRand01(i, salt = 1337) {
  let x = (i | 0) ^ ((salt | 0) + 0x9e3779b9);
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}
function parseLines(str) {
  return String(str ?? "").replace(/\r/g, "").split("\n");
}
function clearText() {
  while (textRoot.children.length) {
    const c = textRoot.children.pop();
    c.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
    });
  }
  chars.length = 0;
}
function computeCenterAndBoundsFromBases() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ch of chars) {
    const x = ch.baseX, y = ch.baseY;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) return { cx: 0, cy: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, w: 1, h: 1 };
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  return { cx, cy, minX, maxX, minY, maxY, w, h };
}

// ------------------------------------------------------------
// Font loading
// ------------------------------------------------------------
const fontLoader = new FontLoader();

async function loadFontFromUrl(url) {
  if (!url) throw new Error("No font URL");
  if (font && fontUrlLoaded === url) return font;

  return new Promise((resolve, reject) => {
    fontLoader.load(
      url,
      (f) => {
        font = f;
        fontUrlLoaded = url;
        resolve(f);
      },
      undefined,
      reject
    );
  });
}

async function ensureFont() {
  const preset = params.fontPreset;
  const url = FONT_PRESETS[preset];
  if (!url) throw new Error("Unknown font preset: " + preset);
  return loadFontFromUrl(url);
}

// ------------------------------------------------------------
// Build text: per-character ExtrudeGeometry (material array: [face, side])
// ------------------------------------------------------------
function buildText() {
  if (!font) return;

  clearText();

  const size = Number(params.size || 72);
  const depth = Number(params.depth || 24);
  const charSpacing = Number(params.charSpacing || 0);
  const lh = Number(params.lineHeight || 1.0);
  const lines = parseLines(params.text);

  // Basic layout:
  // - each character width from shapes bbox
  // - center align each line
  const lineData = [];

  // Measure each char width
  for (let li = 0; li < lines.length; li++) {
    const s = lines[li];
    const items = [];
    let x = 0;

    for (let ci = 0; ci < s.length; ci++) {
      const ch = s[ci];
      if (ch === " ") {
        // simple space width
        const w = size * 0.35 + charSpacing;
        items.push({ ch, isSpace: true, w });
        x += w;
        continue;
      }

      const shapes = font.generateShapes(ch, size);
      const geo2 = new THREE.ShapeGeometry(shapes);
      geo2.computeBoundingBox();
      const bb = geo2.boundingBox;

      const w = (bb ? (bb.max.x - bb.min.x) : size * 0.6) + charSpacing;
      geo2.dispose();

      items.push({ ch, shapes, isSpace: false, w });
      x += w;
    }

    lineData.push({ items, width: x });
  }

  const totalH = lines.length > 0 ? (lines.length - 1) * (size * lh) : 0;

  // Create meshes
  let globalIndex = 0;
  for (let li = 0; li < lineData.length; li++) {
    const { items, width } = lineData[li];
    const startX = -width * 0.5;
    const y = totalH * 0.5 - li * (size * lh);

    let x = startX;

    // word index counter (for future)
    let wordIndex = 0;
    let inWord = false;

    for (let ci = 0; ci < items.length; ci++) {
      const it = items[ci];

      if (it.isSpace) {
        x += it.w;
        inWord = false;
        continue;
      }

      if (!inWord) {
        wordIndex++;
        inWord = true;
      }

      const extrude = new THREE.ExtrudeGeometry(it.shapes, {
        depth: depth,
        bevelEnabled: false,
        curveSegments: 8,
      });
      extrude.computeBoundingBox();

      // Center each character around its own bbox left edge
      const bb = extrude.boundingBox;
      const gx = bb ? -bb.min.x : 0;
      const gy = bb ? -bb.min.y : 0;

      // Mesh with material array:
      // group 0: front, group 1: back, group 2: sides (three uses materials[0], [1], [2] if present)
      // BUT ExtrudeGeometry in three uses: 0.. (front/back) and sides.
      // Easiest: just use [faceMat, faceMat, sideMat]
      const mesh = new THREE.Mesh(extrude, [faceMat, faceMat, sideMat]);

      const group = new THREE.Group();
      group.add(mesh);

      // Position mesh so its baseline-ish aligns
      mesh.position.x = gx;
      mesh.position.y = gy;
      mesh.position.z = -depth * 0.5;

      group.position.set(x, y, 0);

      textRoot.add(group);

      // Store per-char base pose
      chars.push({
        group,
        mesh,
        idx: globalIndex,
        line: li,
        word: wordIndex,
        baseX: group.position.x,
        baseY: group.position.y,
        baseZ: group.position.z,
      });

      // Advance
      const adv = it.w;
      x += adv;
      globalIndex++;
    }
  }

  // Re-center root around its computed center (so camera framing is sane)
  const b = computeCenterAndBoundsFromBases();
  // shift root so center is at 0,0
  textRoot.position.set(-b.cx, -b.cy, 0);

  // Also shift stored bases with root shift
  for (const ch of chars) {
    ch.baseX = ch.baseX - b.cx;
    ch.baseY = ch.baseY - b.cy;
    ch.group.position.set(ch.baseX, ch.baseY, ch.baseZ);
  }

  // place debug dot at (0,0) in root space (true center)
  const dot = ensureDebugDot();
  dot.position.set(0, 0, 8);
}

// ------------------------------------------------------------
// Look updates
// ------------------------------------------------------------
function rebuildLook() {
  renderer.setClearColor(new THREE.Color(params.bgSolid), 1);

  // Replace materials (safe)
  faceMat.color.set(params.faceSolid);
  sideMat.color.set(params.sideSolid);
}

// ------------------------------------------------------------
// Explode animation (RADIAL from true center)
// - characters move away from center
// - outer characters travel further (radialBoost + edgeGain)
// ------------------------------------------------------------
let tl = null;
let animProxy = { ex: 0 };

function applyExplode() {
  const ex = clamp01(animProxy.ex);

  // true center in our current layout = (0,0) because we recentered root
  const cx = 0;
  const cy = 0;

  // debug dot follows computed center (and should ALWAYS stay correct)
  const dot = ensureDebugDot();
  dot.visible = !!params.explodeDebug;
  dot.position.set(cx, cy, 8);

  const distAmt = Number(params.explodeDistance || 220);
  const radialBoost = Number(params.explodeRadialBoost || 0);
  const edgeGain = Number(params.explodeEdgeGain || 0);
  const jitter = Math.max(0, Number(params.explodeJitter || 0));

  // bounds for normalization (from bases)
  const b = computeCenterAndBoundsFromBases();
  const maxR = Math.max(1, Math.hypot(b.w * 0.5, b.h * 0.5));

  for (const ch of chars) {
    const bx = ch.baseX;
    const by = ch.baseY;

    const dx = bx - cx;
    const dy = by - cy;
    const r = Math.hypot(dx, dy);

    let ux = 0, uy = 0;
    if (r > 1e-6) {
      ux = dx / r;
      uy = dy / r;
    } else {
      // if char is at center, give it a stable outward direction
      const a = stableRand01(ch.idx, 911) * Math.PI * 2;
      ux = Math.cos(a);
      uy = Math.sin(a);
    }

    // 0 at center, 1 at outer edge
    const rn = clamp01(r / maxR);

    // radial growth:
    // - base push grows with rn (edges go further)
    // - edgeGain adds extra emphasis to top/bottom/left/right extremes naturally via rn
    const growth = 1 + radialBoost * rn + edgeGain * (rn * rn);

    // stable variation per char
    const j = (stableRand01(ch.idx, 222) * 2 - 1) * jitter;

    const amt = distAmt * ex * (growth + j);

    const ox = ux * amt;
    const oy = uy * amt;

    ch.group.position.x = bx + ox;
    ch.group.position.y = by + oy;
    ch.group.position.z = ch.baseZ;
  }
}

function playAnimation() {
  if (!gsap || !chars.length) return;

  if (tl) {
    tl.kill();
    tl = null;
  }

  const dur = Math.max(0.05, Number(params.animSpeed || 1.15));
  const hold = Math.max(0, Number(params.animHold || 0.25));
  const loop = !!params.animLoop;
  const doReturn = !!params.animReturn;

  animProxy.ex = 0;
  applyExplode();

  tl = gsap.timeline({ repeat: loop ? -1 : 0 });

  // OUT
  tl.to(animProxy, {
    ex: 1,
    duration: dur,
    ease: "expo.out",
    onUpdate: applyExplode,
  });

  // HOLD
  if (hold > 0) tl.to({}, { duration: hold });

  // RETURN
  if (doReturn) {
    tl.to(animProxy, {
      ex: 0,
      duration: Math.max(0.05, dur * 0.9),
      ease: "expo.inOut",
      onUpdate: applyExplode,
    });
    if (hold > 0) tl.to({}, { duration: hold });
  }
}

function stopAnimation() {
  if (tl) {
    tl.kill();
    tl = null;
  }
  animProxy.ex = 0;
  applyExplode();
}

// ------------------------------------------------------------
// Public API for UI
// ------------------------------------------------------------
window.buildText = async function () {
  try {
    await ensureFont();
    buildText();
    rebuildLook();
  } catch (e) {
    console.warn(TAG, "buildText failed:", e);
  }
};

window.playAnimation = playAnimation;
window.stopAnimation = stopAnimation;

// simple: called by UI when font preset changes
window.applyFontSelection = async function () {
  await ensureFont();
};

window.rebuildLook = rebuildLook;

// ------------------------------------------------------------
// Render loop
// ------------------------------------------------------------
function tick() {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// Initial build
window.buildText();
