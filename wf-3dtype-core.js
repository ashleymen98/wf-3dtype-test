// wf-3dtype-core.js (v14)
// IMPORTANT: this file is a module. Load with <script type="module" src="..."></script>

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { LineSegments2 } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineMaterial.js";

const gsap = window.gsap;

// ---------------------------
// Version stamp
// ---------------------------
const CORE_VERSION =
  "core_v14_spin360RaycastEnter360 + explodeShape(diamMaster/ringAngle/noise/zSpread)";
console.log("[3DType/Core]", CORE_VERSION);
window.__WF_3DTYPE_CORE_VERSION__ = CORE_VERSION;

// ---------------------------
// Single-instance lifecycle
// ---------------------------
const TOOL_KEY = "__WF_3DTYPE_TOOL__";
if (window[TOOL_KEY]?.cleanup) window[TOOL_KEY].cleanup();
window[TOOL_KEY] = { cleanup: null };
window.__WF_3DTYPE_CORE_LOADED__ = true;

// ---------------------------
// DOM / page shell
// ---------------------------
const wrap = document.getElementById("three-wrap");
if (!wrap) throw new Error("#three-wrap not found");
wrap.innerHTML = "";

const prevOverflowHtml = document.documentElement.style.overflow;
const prevOverflowBody = document.body.style.overflow;
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";

// ---------------------------
// Fonts (presets)
// ---------------------------
const FONT_PRESETS = {
  "Helvetiker Regular":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json",
  "Helvetiker Bold":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json",
  "Optimer Regular":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_regular.typeface.json",
  "Optimer Bold":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_bold.typeface.json",
  "Gentilis Regular":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_regular.typeface.json",
  "Gentilis Bold":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_bold.typeface.json",
};
window.FONT_PRESETS = FONT_PRESETS;

// ---------------------------
// Params (base)
// ---------------------------
const params = (window.params ||= {
  aspect: "free",
  margin: 16,
  text: "CAN'T\nHAVE\nFORM\nW/OUT\nSPACE",

  fontSource: "preset",
  fontPreset: "Helvetiker Regular",
  fontUrl: "",

  size: 48,
  depth: 40,
  charSpacing: 0,
  lineSpacing: 1.05,
  align: "center",

    // Kerning (manual pairs)
  kerningOn: true,
  kerningStrength: 1.0,
  kerningPairsText:
    "AV:-18\nVA:-14\nTo:-10\nLY:-12\nLT:-10\nTa:-10\nYo:-10",


  // Background (ONLY solid/gradient now)
  bgMode: "solid", // solid | gradient
  bgSolid: "#111111",
  bgGradA: "#101018",
  bgGradB: "#1a0f24",
  bgGradAngle: 35,
  bgGradSoft: 0.65,

  // Face Fill (solid | gradient | checker | perLetter)
  faceMode: "gradient",
  faceUVSpace: "glyph", // glyph | world (checker forces world)
  faceSolid: "#ff0000",
  faceGradA: "#ff0055",
  faceGradB: "#00ffcc",
  faceGradC: "#0044ff",
  faceStopA: 0,
  faceStopB: 0.5,
  faceStopC: 1,
  faceGradDir: "horizontal",

  // Per-letter face colors
  faceLetterColors: [],

  // Face Checker controls (consistent across letters via WORLD UV)
  faceChkScale: 42,
  faceChkLineWidth: 3,
  faceChkRotate: 0,
  faceChkColorA: "#0e0e12",
  faceChkColorB: "#161623",
  faceChkLineColor: "#ffffff",

  // Sides
  sideMode: "gradient",
  sideUVSpace: "glyph",
  sideSolid: "#777777",
  sideGradA: "#111111",
  sideGradB: "#888888",
  sideGradC: "#ffffff",
  sideStopA: 0,
  sideStopB: 0.5,
  sideStopC: 1,
  sideGradDir: "horizontal",

  faceBright: 1,
  sideBright: 1,

  stroke: "#000000",
  strokeWidth: 3,
  edgeThreshold: 1,
  strokeFacesOnly: false,

  lightingMode: "accurate",
  cameraPreset: "front",

  // GSAP animation (no cylinder)
  animPreset: "depth",
  animSpeed: 1.2,
  animStagger: 0.03,
  animMinPct: 0,
  animMaxPct: 100,
  animEase: "power2.inOut",
  animLoop: true,
  animStaggerMode: "char",
  animStaggerFrom: "start",
  animRotateDeg: 35,
  animInflate: 0.18,
  animAlsoDepth: true,
  animAxis: "y",

  animSpinDeg: 360,

  // Explode preset (v14 upgraded)
  animExplodeAmount: 220, // base distance

  // Impact-style explode (NEW)



  // legacy ellipse scalers (kept)
  animExplodeDiameterX: 1.0,
  animExplodeDiameterY: 1.0,

  // NEW master diameter scaler
  animExplodeDiameter: 1.0,

  // NEW shape controls
  animExplodeShape: "burst", // burst | ring | sphere | lineX | lineY
  animExplodeRingAngle: 0, // deg (only for ring)
  animExplodeNoise: 0.15, // 0..1 (random per glyph)

  // field rotation + Z scatter
  animExplodeAngleOffset: 0, // deg rotate burst field
  animExplodeZAmount: 0, // add depth scatter in Z (world)
  animExplodeZSpread: 0.0, // extra sphere Z spread (0..~1)

  // per-char rotation during explode
  animExplodeRotDeg: 55,
  animExplodeRotAxis: "z", // x|y|z|random
  animExplodeRandomDir: true, // random +/- direction for explode rotation

  // Hover
  hoverMode: "lift", // lift | rotate | tilt | pulse |  | spin |  | explode | none
  proximityLift: true,
  proximityRadiusWorld: 140,
  proximityLiftAmount: 60,
  proximityFalloff: "smooth",
  cursorSmoothing: 0.85,
  liftSmoothing: 0.18,
  hoverRotateDeg: 20,
  hoverTiltDeg: 18,
  hoverPulse: 0.12,


  // Hover Spin360 (raycast + full 360 on enter + inertia via speed->duration)
  hoverSpin360Axis: "random", // x|y|z|random
  hoverSpin360RandomDir: true, // stable per-glyph +/- sign
  hoverSpin360BaseDur: 0.55, // seconds at slow movement
  hoverSpin360SpeedScale: 0.0045, // higher = faster cursor -> much shorter duration
  hoverSpin360MinDur: 0.12,
  hoverSpin360MaxDur: 0.9,
  hoverSpin360Ease: "power3.out",
  hoverSpin360MinHoverF: 0.20, // gate (prevents off-text triggers)
  hoverSpin360Lift: 0.12, // small lift (fraction of proximity lift)

  hoverExplodeAmount: 120,
  hoverExplodeTwistDeg: 35,

  // Collisions (2D repulsion on text plane)
  collideOn: true,
  collidePadding: 2.0,     // extra spacing between glyphs (world units)
  collideStrength: 0.65,   // how strongly to separate per iteration
  collideIters: 2,         // 1–4 typical
  collideMaxShift: 28,     // max drift away from intended position (world units)
  collideGrid: true,       // spatial hash accel


  // Repel
  repelAmount: 80,
  repelMinDistance: 6,
  repelClamp: 140,

  // Magnetic sweep
  magneticSweepOn: true,
  sweepAmount: 22,
  sweepBias: 1.0,
  sweepYMix: 0.25,

  // Heat bloom
  heatBloomOn: true,
  heatRadiusWorld: 160,
  heatBrightBoost: 0.55,
  heatGrainBoost: 1.25,
  heatHalfBoost: 1.0,
  heatSoftness: 0.35,

  overlayMode: false,

  // FX
  halftoneTarget: "both",
  halftoneOn: false,
  halftoneScale: 90,
  halftoneAngle: 25,
  halftoneStrength: 0.6,
  halftoneSoftness: 0.15,

  grainTarget: "both",
  grainOn: false,
  grainAmount: 0.12,
  grainScale: 220,
  grainSpeed: 0.35,

  // Idle
  waveOn: true,
  waveSpeed: 0.55,
  waveAmpY: 8,
  waveRotDeg: 6,
  waveFreq: 0.08,
  waveBy: "x",

  // Breathing extrusion
  breathOn: true,
  breathSpeed: 0.55,
  breathAmount: 0.06,

  // Gradient animation
  faceGradAnimOn: true,
  faceGradSpeed: 0.035,
  faceGradAngle: 25,
  sideGradAnimOn: true,
  sideGradSpeed: 0.035,
  sideGradAngle: 25,

  // Per-character Z
  charZOffsets: [],
});

// Patch defaults EVEN if params existed already
function ensureParam(key, val) {
  if (!(key in params)) params[key] = val;
}


// Collision defaults
ensureParam("collideOn", false);
ensureParam("collidePadding", 2.0);
ensureParam("collideStrength", 0.65);
ensureParam("collideIters", 2);
ensureParam("collideMaxShift", 28);
ensureParam("collideGrid", true);


// Keep older keys safe if they existed in saved params (no longer used)
ensureParam("hoverSpin360Boost", 0.018);
ensureParam("hoverSpin360MaxVel", 10.0);
ensureParam("hoverSpin360Damping", 7.5);

// Spin360 defaults
ensureParam("hoverSpin360Axis", "random");
ensureParam("hoverSpin360RandomDir", true);
ensureParam("hoverSpin360BaseDur", 0.55);
ensureParam("hoverSpin360SpeedScale", 0.0045);
ensureParam("hoverSpin360MinDur", 0.12);
ensureParam("hoverSpin360MaxDur", 0.9);
ensureParam("hoverSpin360Ease", "power3.out");
ensureParam("hoverSpin360MinHoverF", 0.2);
ensureParam("hoverSpin360Lift", 0.12);

// Explode (v14) defaults
ensureParam("animExplodeDiameterX", 1.0);
ensureParam("animExplodeDiameterY", 1.0);
ensureParam("animExplodeDiameter", 1.0); // NEW master

ensureParam("animExplodeZLift", 28);        // extra Z layering during explode (world units)
ensureParam("animExplodeDepthShrink", 0.22); // 0..0.5 how much to thin extrusion at full explode


ensureParam("animExplodeShape", "burst"); // NEW
ensureParam("animExplodeRingAngle", 0); // NEW
ensureParam("animExplodeNoise", 0.15); // NEW
ensureParam("animExplodeZSpread", 0.0); // NEW

ensureParam("animExplodeAngleOffset", 0);
ensureParam("animExplodeZAmount", 0);
ensureParam("animExplodeRotDeg", 55);
ensureParam("animExplodeRotAxis", "z");
ensureParam("animExplodeRandomDir", true);


// Option D (visual anti-clip) defaults
ensureParam("crowdOn", true);
ensureParam("crowdRadius", 42);        // world-ish units, try 32–64
ensureParam("crowdZAmount", 18);       // max Z lift, try 10–28
ensureParam("crowdZAlternate", true);  // alternate +/-
ensureParam("crowdZSmooth", 0.18);     // smoothing
ensureParam("crowdShrink", 0.06);      // 0..0.12 (6% default)
ensureParam("crowdSideFade", 0.55);    // 0..1 (55% fade max)
ensureParam("crowdLineOnly", true);    // keep it per-line (best for type)




ensureParam("faceLetterColors", []);
// Kerning defaults
ensureParam("kerningOn", true);
ensureParam("kerningStrength", 1.0);
ensureParam(
  "kerningPairsText",
  "AV:-18\nVA:-14\nTo:-10\nLY:-12\nLT:-10\nTa:-10\nYo:-10"
);


window.params = params;

// ---------------------------
// Utils
// ---------------------------
const ASPECTS = {
  "1:1": [1, 1],
  "4:5": [4, 5],
  "9:16": [9, 16],
  "9:18": [9, 18],
  "16:9": [16, 9],
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(Number(v), 0, 1);
const smoothstep01 = (x) => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};
const falloff = (u, mode) => {
  u = clamp(u, 0, 1);
  if (mode === "quadratic") return u * u;
  if (mode === "smooth") return smoothstep01(u);
  return u;
};
const srgbColor = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const disposeIf = (o) => {
  try {
    o?.dispose?.();
  } catch (e) {}
};
const fixStops = (a, b, c) => {
  a = clamp01(a);
  b = clamp01(b);
  c = clamp01(c);
  if (b < a) b = a;
  if (c < b) c = b;
  const eps = 0.001;
  if (b - a < eps) b = Math.min(1, a + eps);
  if (c - b < eps) c = Math.min(1, b + eps);
  return { a, b, c };
};
function hash01(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function stablePickAxis(idx, baseAxis, allowRandom) {
  let ax = String(baseAxis || "z").toLowerCase();
  if (ax !== "random" && !allowRandom) return ax;
  if (ax !== "random" && allowRandom === false) return ax;
  const u = hash01(idx + 77);
  return u < 0.333 ? "x" : u < 0.666 ? "y" : "z";
}
function stablePickSign(idx, enabled) {
  if (!enabled) return 1;
  return hash01(idx + 901) < 0.5 ? -1 : 1;
}
function stableJitter(idx) {
  return hash01(idx + 1337) * 2 - 1; // -1..1
}

// ---------------------------
// Advance width + Kerning
// ---------------------------
function _fontScale() {
  const res = font?.data?.resolution || 1000;
  return (Number(params.size) || 48) / res;
}

function getAdvanceWidth(ch, fallbackWidth) {
  const g = font?.data?.glyphs?.[ch];
  const ha = g?.ha;
  if (typeof ha === "number" && isFinite(ha)) return ha * _fontScale();
  return fallbackWidth;
}

function parseKerningPairs(text) {
  const map = Object.create(null);
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("//"));

  for (const line of lines) {
    const m =
      line.match(/^(.{2})\s*[:=,]\s*(-?\d+(\.\d+)?)$/) ||
      line.match(/^(.{2})\s+(-?\d+(\.\d+)?)$/);
    if (!m) continue;
    const pair = m[1];
    const val = Number(m[2]);
    if (!isFinite(val)) continue;
    map[pair] = val;
  }
  return map;
}

let _kernMap = null;
let _kernSrc = null;

function getKern(prevCh, ch) {
  if (!params.kerningOn) return 0;
  const strength = Number(params.kerningStrength ?? 1);

  const src = params.kerningPairsText || "";
  if (_kernMap === null || src !== _kernSrc) {
    _kernMap = parseKerningPairs(src);
    _kernSrc = src;
  }

  const v = _kernMap[`${prevCh}${ch}`];
  if (typeof v !== "number") return 0;

  // Scale kerning to font size (values are in font units)
  return v * strength * _fontScale();
}

// ---------------------------
// Three core
// ---------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.sortObjects = true;
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 8000);
camera.position.set(0, 140, 520);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = true;

const lightsGroup = new THREE.Group();
scene.add(lightsGroup);
const textGroup = new THREE.Group();
scene.add(textGroup);

const fontLoader = new FontLoader();
let font = null;

let raf = 0,
  tl = null;
const frame = { maxDim: 1 };
let glyphs = [],
  wordGroups = [],
  lineGroups = [];

let faceTex = null,
  sideTex = null,
  faceMat = null,
  sideMat = null;
let _bgTex = null;

let _fxTime = 0;
let _fxPrevTime = 0;
let _fxDt = 1 / 60;

const _fxMats = new Set();

// heat hover
const _hoverWorld = new THREE.Vector3(0, 0, 0);
let _hoverStrength = 0;

// ---------------------------
// Hover plane / raycast (DECLARE ONCE)
// ---------------------------
const _raycaster = new THREE.Raycaster();
const _hit = new THREE.Vector3();
const _stablePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _stableNormalW = new THREE.Vector3(0, 0, 1);
const _stablePointW = new THREE.Vector3(0, 0, 0);

function _refreshStablePlane() {
  textGroup.updateMatrixWorld(true);
  _stableNormalW
    .set(0, 0, 1)
    .applyQuaternion(textGroup.getWorldQuaternion(new THREE.Quaternion()))
    .normalize();
  textGroup.getWorldPosition(_stablePointW);
  _stablePlane.setFromNormalAndCoplanarPoint(_stableNormalW, _stablePointW);
}

// ---------------------------
// Background texture (NO CHECKER MODE)
// ---------------------------
function makeBackgroundTexture() {
  const size = 1024;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");

  const mode = (params.bgMode || "solid").toLowerCase();

  if (mode === "solid") {
    ctx.fillStyle = params.bgSolid || "#111";
    ctx.fillRect(0, 0, size, size);
  } else {
    const a = params.bgGradA || "#111";
    const b = params.bgGradB || "#222";
    const ang = (Number(params.bgGradAngle || 0) * Math.PI) / 180;

    const cx = size / 2,
      cy = size / 2;
    const dx = Math.cos(ang),
      dy = Math.sin(ang);
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const x0 = cx - (dx / len) * size * 0.6;
    const y0 = cy - (dy / len) * size * 0.6;
    const x1 = cx + (dx / len) * size * 0.6;
    const y1 = cy + (dy / len) * size * 0.6;

    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    const soft = clamp01(Number(params.bgGradSoft ?? 0.65));
    g.addColorStop(0.0, a);
    g.addColorStop(soft, a);
    g.addColorStop(1.0 - soft, b);
    g.addColorStop(1.0, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function rebuildBackground() {
  disposeIf(_bgTex);
  _bgTex = makeBackgroundTexture();
  scene.background = _bgTex;
}
window.rebuildBackground = rebuildBackground;

// ---------------------------
// Face checker texture
// ---------------------------
function makeFaceCheckerTexture() {
  const size = 1024;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");

  const scale = Math.max(4, Number(params.faceChkScale ?? 42));
  const lineW = Math.max(0, Number(params.faceChkLineWidth ?? 3));
  const rotDeg = Number(params.faceChkRotate ?? 0);
  const colA = params.faceChkColorA || "#0e0e12";
  const colB = params.faceChkColorB || "#161623";
  const lineCol = params.faceChkLineColor || "#ffffff";

  ctx.fillStyle = colA;
  ctx.fillRect(0, 0, size, size);

  const rot = (rotDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(rot);
  ctx.translate(-size / 2, -size / 2);

  ctx.fillStyle = colB;
  for (let y = -scale; y < size + scale; y += scale) {
    for (let x = -scale; x < size + scale; x += scale) {
      const ix = Math.floor(x / scale);
      const iy = Math.floor(y / scale);
      if ((ix + iy) % 2 === 0) continue;
      ctx.fillRect(x, y, scale, scale);
    }
  }

  if (lineW > 0) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = lineCol;
    ctx.beginPath();
    for (let x = -scale; x <= size + scale; x += scale) {
      ctx.moveTo(x, -scale);
      ctx.lineTo(x, size + scale);
    }
    for (let y = -scale; y <= size + scale; y += scale) {
      ctx.moveTo(-scale, y);
      ctx.lineTo(size + scale, y);
    }
    ctx.stroke();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------
// FX shader hook (unchanged)
// ---------------------------
const _hash21 = `float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}`;
const _noise = `float noise2(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash21(i),b=hash21(i+vec2(1,0)),c=hash21(i+vec2(0,1)),d=hash21(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}`;

function _applyFX(mat, isFace) {
  if (!mat) return;
  mat.userData ||= {};
  if (mat.userData._fxApplied) return;
  mat.userData._fxApplied = 1;

  mat.customProgramCacheKey = () => `fx_v8_${isFace ? 1 : 0}`;

  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = { value: 0 };
    s.uniforms.uIsFace = { value: isFace ? 1 : 0 };

    s.uniforms.uHalftoneTarget = { value: 0 };
    s.uniforms.uGrainTarget = { value: 0 };

    s.uniforms.uFaceBright = { value: 1 };
    s.uniforms.uSideBright = { value: 1 };

    s.uniforms.uHalftoneOn = { value: 0 };
    s.uniforms.uHalftoneScale = { value: 90 };
    s.uniforms.uHalftoneAngle = { value: 25 };
    s.uniforms.uHalftoneStrength = { value: 0.6 };
    s.uniforms.uHalftoneSoftness = { value: 0.15 };

    s.uniforms.uGrainOn = { value: 0 };
    s.uniforms.uGrainAmount = { value: 0.12 };
    s.uniforms.uGrainScale = { value: 220 };
    s.uniforms.uGrainSpeed = { value: 0.35 };

    s.uniforms.uHeatOn = { value: 0 };
    s.uniforms.uHeatPos = { value: new THREE.Vector3(0, 0, 0) };
    s.uniforms.uHeatRadius = { value: 160 };
    s.uniforms.uHeatSoft = { value: 0.35 };
    s.uniforms.uHeatStrength = { value: 0 };
    s.uniforms.uHeatBright = { value: 0.55 };
    s.uniforms.uHeatGrainBoost = { value: 1.25 };
    s.uniforms.uHeatHalfBoost = { value: 1.0 };

    if (!s.vertexShader.includes("varying vec3 vWorldPos;")) {
      s.vertexShader = s.vertexShader
        .replace("#include <common>", `#include <common>\nvarying vec3 vWorldPos;`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>\nvec4 wp=modelMatrix*vec4(position,1.0);\nvWorldPos=wp.xyz;`
        );
    }

    const commonInject = `
varying vec3 vWorldPos;

uniform float uTime;
uniform float uIsFace;

uniform float uHalftoneTarget;
uniform float uGrainTarget;

uniform float uFaceBright;
uniform float uSideBright;

uniform float uHalftoneOn;
uniform float uHalftoneScale;
uniform float uHalftoneAngle;
uniform float uHalftoneStrength;
uniform float uHalftoneSoftness;

uniform float uGrainOn;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainSpeed;

uniform float uHeatOn;
uniform vec3  uHeatPos;
uniform float uHeatRadius;
uniform float uHeatSoft;
uniform float uHeatStrength;
uniform float uHeatBright;
uniform float uHeatGrainBoost;
uniform float uHeatHalfBoost;

${_hash21}
${_noise}

float halftoneMask(vec2 uv,float ang,float sc){
  float a=radians(ang);
  mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a));
  vec2 p=R*(uv*sc);
  vec2 g=fract(p)-.5;
  float d=length(g)*2.0;
  return 1.0-d;
}
float targetOK(float target,float isFace){
  if(target<0.5) return 1.0;
  if(target<1.5) return step(0.5,isFace);
  return 1.0-step(0.5,isFace);
}
float heatFalloff(float d,float r,float soft){
  float x=clamp(1.0-d/max(r,1e-6),0.0,1.0);
  float k=mix(1.0,2.6,clamp(soft,0.0,1.0));
  return smoothstep(0.0,1.0,pow(x,k));
}
`;
    if (!s.fragmentShader.includes("varying vec3 vWorldPos;")) {
      s.fragmentShader = s.fragmentShader.replace(
        "#include <common>",
        `#include <common>\n${commonInject}`
      );
    }

    const fxBlock = `
{
  vec2 uvFx = vec2(0.0);
  #ifdef USE_UV
    uvFx = vUv;
  #else
    uvFx = gl_FragCoord.xy * 0.001;
  #endif

  vec3 col = gl_FragColor.rgb;

  float b = mix(uSideBright, uFaceBright, step(0.5, uIsFace));
  col *= max(0.0, b);

  float heatF = 0.0;
  if(uHeatOn > 0.5){
    float d = length(vWorldPos.xy - uHeatPos.xy);
    heatF = heatFalloff(d, uHeatRadius, uHeatSoft) * clamp(uHeatStrength,0.0,1.0);
    col *= (1.0 + heatF * uHeatBright);
  }

  float halfStrength = uHalftoneStrength * (1.0 + heatF * uHeatHalfBoost);
  if(uHalftoneOn > 0.5 && halfStrength > 0.0001){
    float ok = targetOK(uHalftoneTarget, uIsFace);
    if(ok > 0.5){
      float m = halftoneMask(uvFx, uHalftoneAngle, uHalftoneScale);
      float dotv = smoothstep(0.5 - uHalftoneSoftness, 0.5 + uHalftoneSoftness, m);
      col = mix(col, col * dotv, clamp(halfStrength,0.0,1.0));
    }
  }

  float grainAmt = uGrainAmount * (1.0 + heatF * uHeatGrainBoost);
  if(uGrainOn > 0.5 && grainAmt > 0.0001){
    float ok = targetOK(uGrainTarget, uIsFace);
    if(ok > 0.5){
      float t = uTime * uGrainSpeed;
      float n = noise2(uvFx * uGrainScale + vec2(t, -t));
      float g = (n - 0.5) * 2.0;
      col += g * grainAmt;
    }
  }

  gl_FragColor.rgb = col;
}
`;
    if (s.fragmentShader.includes("#include <dithering_fragment>")) {
      s.fragmentShader = s.fragmentShader.replace(
        "#include <dithering_fragment>",
        `${fxBlock}\n#include <dithering_fragment>`
      );
    }

    mat.userData._fxUniforms = s.uniforms;
    _fxMats.add(mat);
  };

  mat.needsUpdate = true;
}

function _syncFXUniforms() {
  const halfT = params.halftoneTarget === "face" ? 1 : params.halftoneTarget === "side" ? 2 : 0;
  const grainT = params.grainTarget === "face" ? 1 : params.grainTarget === "side" ? 2 : 0;

  const faceB = Number(params.faceBright ?? 1);
  const sideB = Number(params.sideBright ?? 1);

  const heatOn = params.heatBloomOn ? 1 : 0;

  for (const m of _fxMats) {
    const u = m.userData?._fxUniforms;
    if (!u) continue;

    u.uTime.value = _fxTime;
    u.uHalftoneTarget.value = halfT;
    u.uGrainTarget.value = grainT;

    u.uFaceBright.value = faceB;
    u.uSideBright.value = sideB;

    u.uHalftoneOn.value = params.halftoneOn ? 1 : 0;
    u.uHalftoneScale.value = Number(params.halftoneScale || 90);
    u.uHalftoneAngle.value = Number(params.halftoneAngle || 25);
    u.uHalftoneStrength.value = Number(params.halftoneStrength || 0);
    u.uHalftoneSoftness.value = Number(params.halftoneSoftness || 0.15);

    u.uGrainOn.value = params.grainOn ? 1 : 0;
    u.uGrainAmount.value = Number(params.grainAmount || 0);
    u.uGrainScale.value = Number(params.grainScale || 220);
    u.uGrainSpeed.value = Number(params.grainSpeed || 0.35);

    u.uHeatOn.value = heatOn;
    u.uHeatPos.value.copy(_hoverWorld);
    u.uHeatRadius.value = Number(params.heatRadiusWorld || 160);
    u.uHeatSoft.value = clamp01(Number(params.heatSoftness ?? 0.35));
    u.uHeatStrength.value = clamp01(_hoverStrength);
    u.uHeatBright.value = Number(params.heatBrightBoost || 0);
    u.uHeatGrainBoost.value = Number(params.heatGrainBoost || 0);
    u.uHeatHalfBoost.value = Number(params.heatHalfBoost || 0);
  }
}
window._syncFXUniforms = _syncFXUniforms;

// ---------------------------
// Gradient animation
// ---------------------------
function _animateTex(tex, speed, angleDeg, phase = 0) {
  if (!tex) return;
  const sp = Number(speed || 0);
  if (sp === 0) return;

  const ang = THREE.MathUtils.degToRad(Number(angleDeg || 0));
  const dx = Math.cos(ang) * sp;
  const dy = Math.sin(ang) * sp;

  const ox = (dx * _fxTime + phase) % 1;
  const oy = (dy * _fxTime + phase) % 1;
  tex.offset.set(ox, oy);
}
function _applyGradientAnimation() {
  if (params.faceGradAnimOn && faceTex && params.faceMode === "gradient") {
    _animateTex(faceTex, params.faceGradSpeed, params.faceGradAngle, 0.0);
  }
  if (params.sideGradAnimOn && sideTex && params.sideMode === "gradient") {
    _animateTex(sideTex, params.sideGradSpeed, params.sideGradAngle, 0.17);
  }
}

function makeGradientTexture3(a, sa, b, sb, c, sc, dir) {
  const size = 512;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");

  let x0 = 0,
    y0 = 0,
    x1 = 0,
    y1 = size;
  if (dir === "horizontal") {
    x1 = size;
    y1 = 0;
  }
  if (dir === "diagonal") {
    x0 = 0;
    y0 = size;
    x1 = size;
    y1 = 0;
  }

  const s = fixStops(sa, sb, sc);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(s.a, a);
  g.addColorStop(s.b, b);
  g.addColorStop(s.c, c);

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------
// Sizing
// ---------------------------
function applyCanvasSizing() {
  if (params.aspect === "free") {
    wrap.style.width = "100vw";
    wrap.style.height = "100vh";
    wrap.style.position = "absolute";
    wrap.style.left = "0";
    wrap.style.top = "0";
    wrap.style.transform = "none";
    return;
  }
  const m = Math.max(0, Number(params.margin || 0));
  const availW = Math.max(320, innerWidth - m * 2);
  const availH = Math.max(320, innerHeight - m * 2);
  const [rw, rh] = ASPECTS[params.aspect] || [1, 1];

  let w = availW;
  let h = Math.round(w * (rh / rw));
  if (h > availH) {
    h = availH;
    w = Math.round(h * (rw / rh));
  }

  wrap.style.width = w + "px";
  wrap.style.height = h + "px";
  wrap.style.position = "absolute";
  wrap.style.left = "50%";
  wrap.style.top = "50%";
  wrap.style.transform = "translate(-50%,-50%)";
}

function resize() {
  applyCanvasSizing();
  const w = wrap.clientWidth,
    h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  textGroup.traverse((o) => {
    if (o?.material?.isLineMaterial) o.material.resolution.set(w, h);
  });
}
window.resize = resize;

// ---------------------------
// Materials
// ---------------------------
function rebuildFillMaterials() {
  for (const m of _fxMats) {
    try {
      m.userData._fxUniforms = null;
    } catch (e) {}
  }
  _fxMats.clear();

  disposeIf(faceTex);
  disposeIf(sideTex);
  disposeIf(faceMat);
  disposeIf(sideMat);

  // FACE
  if (params.faceMode === "gradient") {
    faceTex = makeGradientTexture3(
      params.faceGradA,
      params.faceStopA,
      params.faceGradB,
      params.faceStopB,
      params.faceGradC,
      params.faceStopC,
      params.faceGradDir
    );
  } else if (params.faceMode === "checker") {
    faceTex = makeFaceCheckerTexture();
  } else {
    faceTex = null;
  }

  // SIDE
  sideTex =
    params.sideMode === "gradient"
      ? makeGradientTexture3(
          params.sideGradA,
          params.sideStopA,
          params.sideGradB,
          params.sideStopB,
          params.sideGradC,
          params.sideStopC,
          params.sideGradDir
        )
      : null;

  const faceCommon = {
    map: faceTex || null,
    color: faceTex ? new THREE.Color(0xffffff) : srgbColor(params.faceSolid),
  };
  const sideCommon = {
    map: sideTex || null,
    color: sideTex ? new THREE.Color(0xffffff) : srgbColor(params.sideSolid),
  };

  if (params.lightingMode === "accurate") {
    faceMat = new THREE.MeshBasicMaterial(faceCommon);
    sideMat = new THREE.MeshStandardMaterial({ ...sideCommon, metalness: 0, roughness: 0.9 });
  } else {
    faceMat = new THREE.MeshStandardMaterial({ ...faceCommon, metalness: 0.05, roughness: 0.45 });
    sideMat = new THREE.MeshStandardMaterial({ ...sideCommon, metalness: 0.05, roughness: 0.55 });
  }

  if (faceMat.map) faceMat.map.flipY = false;
  if (sideMat.map) sideMat.map.flipY = false;

  faceMat.userData = {};
  sideMat.userData = {};

  _applyFX(faceMat, true);
  _applyFX(sideMat, false);

  faceMat.needsUpdate = true;
  sideMat.needsUpdate = true;
}
window.rebuildFillMaterials = rebuildFillMaterials;

// ---------------------------
// Lighting
// ---------------------------
function applyLightingMode() {
  while (lightsGroup.children.length) lightsGroup.remove(lightsGroup.children[0]);

  if (params.lightingMode === "accurate") {
    lightsGroup.add(new THREE.AmbientLight(0xffffff, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 0.25);
    key.position.set(0, 1, 1);
    lightsGroup.add(key);
  } else {
    lightsGroup.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(300, 450, 250);
    lightsGroup.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-300, 120, -250);
    lightsGroup.add(fill);
  }

  rebuildFillMaterials();
  rebuildBackground();
}
window.applyLightingMode = applyLightingMode;

// ---------------------------
// Stroke
// ---------------------------
function createStrokeMaterial() {
  const m = new LineMaterial({ color: 0x000000, linewidth: Number(params.strokeWidth || 2) });
  m.transparent = true;
  m.depthWrite = false;
  m.depthTest = !params.overlayMode;
  m.polygonOffset = true;
  m.polygonOffsetFactor = -1;
  m.polygonOffsetUnits = -1;
  m.color.set(srgbColor(params.stroke));
  m.resolution.set(wrap.clientWidth, wrap.clientHeight);
  return m;
}

function filterEdgesToFrontBackFaces(posArray, depth, eps = 1e-4) {
  const out = [];
  for (let i = 0; i < posArray.length; i += 6) {
    const z1 = posArray[i + 2],
      z2 = posArray[i + 5];
    const onBack = Math.abs(z1 - 0) < eps && Math.abs(z2 - 0) < eps;
    const onFront = Math.abs(z1 - depth) < eps && Math.abs(z2 - depth) < eps;
    if (onBack || onFront) out.push(...posArray.slice(i, i + 6));
  }
  return out;
}

// ---------------------------
// Clear
// ---------------------------
function clearText() {
  if (tl) {
    tl.kill();
    tl = null;
  }

  textGroup.traverse((o) => {
    if (!o) return;

    if (o.isMesh) {
      o.geometry?.dispose?.();
      if (Array.isArray(o.material)) {
        const face = o.material[0];
        const side = o.material[1];
        if (face && face !== faceMat) face.dispose?.();
        if (side && side !== sideMat) side.dispose?.();
      } else if (o.material && o.material !== faceMat && o.material !== sideMat) {
        o.material?.dispose?.();
      }
    }
    if (o.type === "LineSegments2" || o.isLineSegments2) {
      o.geometry?.dispose?.();
      o.material?.dispose?.();
    }
  });

  textGroup.clear();
  glyphs = [];
  wordGroups = [];
  lineGroups = [];
}
window.clearText = clearText;

// ---------------------------
// UVs
// ---------------------------
function writeUVsNonIndexed_Local(geo, depth) {
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const bb = geo.boundingBox;
  const minX = bb.min.x,
    minY = bb.min.y;
  const rangeX = Math.max(1e-6, bb.max.x - bb.min.x);
  const rangeY = Math.max(1e-6, bb.max.y - bb.min.y);

  const useXForSideU = rangeX >= rangeY;
  const d = Math.max(1e-6, depth);

  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;

  const uv = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i += 3) {
    const nz = nrm.getZ(i);
    const isCap = Math.abs(nz) > 0.9;

    for (let k = 0; k < 3; k++) {
      const vi = i + k;
      const x = pos.getX(vi),
        y = pos.getY(vi),
        z = pos.getZ(vi);

      let u, v;
      if (isCap) {
        u = (x - minX) / rangeX;
        v = (y - minY) / rangeY;
      } else {
        u = useXForSideU ? (x - minX) / rangeX : (y - minY) / rangeY;
        v = z / d;
      }
      uv[vi * 2] = clamp(u, 0, 1);
      uv[vi * 2 + 1] = clamp(v, 0, 1);
    }
  }

  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.attributes.uv.needsUpdate = true;
}

function applyWorldUVsNonIndexed(meshes, depth, faceWorld, sideWorld) {
  if (!faceWorld && !sideWorld) return;

  textGroup.updateMatrixWorld(true);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  const v = new THREE.Vector3();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());

  for (const mesh of meshes) {
    const geo = mesh.geometry;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;

    corners[0].set(bb.min.x, bb.min.y, bb.min.z);
    corners[1].set(bb.max.x, bb.min.y, bb.min.z);
    corners[2].set(bb.min.x, bb.max.y, bb.min.z);
    corners[3].set(bb.max.x, bb.max.y, bb.min.z);
    corners[4].set(bb.min.x, bb.min.y, bb.max.z);
    corners[5].set(bb.max.x, bb.min.y, bb.max.z);
    corners[6].set(bb.min.x, bb.max.y, bb.max.z);
    corners[7].set(bb.max.x, bb.max.y, bb.max.z);

    for (const c of corners) {
      v.copy(c);
      mesh.localToWorld(v);
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
  }

  const rangeX = Math.max(1e-6, maxX - minX);
  const rangeY = Math.max(1e-6, maxY - minY);
  const sideUseX = rangeX >= rangeY;
  const d = Math.max(1e-6, depth);

  const wpos = new THREE.Vector3();

  for (const mesh of meshes) {
    const geo = mesh.geometry;
    geo.computeVertexNormals();

    const pos = geo.attributes.position;
    const nrm = geo.attributes.normal;

    const uvArr = new Float32Array(pos.count * 2);
    if (geo.attributes.uv?.array && geo.attributes.uv.array.length === uvArr.length) {
      uvArr.set(geo.attributes.uv.array);
    }

    for (let i = 0; i < pos.count; i += 3) {
      const nz = nrm.getZ(i);
      const isCap = Math.abs(nz) > 0.9;

      for (let k = 0; k < 3; k++) {
        const vi = i + k;
        const x = pos.getX(vi),
          y = pos.getY(vi),
          z = pos.getZ(vi);

        if (isCap) {
          if (!faceWorld) continue;
          wpos.set(x, y, z);
          mesh.localToWorld(wpos);
          uvArr[vi * 2] = clamp((wpos.x - minX) / rangeX, 0, 1);
          uvArr[vi * 2 + 1] = clamp((wpos.y - minY) / rangeY, 0, 1);
        } else {
          if (!sideWorld) continue;
          wpos.set(x, y, z);
          mesh.localToWorld(wpos);
          uvArr[vi * 2] = clamp(sideUseX ? (wpos.x - minX) / rangeX : (wpos.y - minY) / rangeY, 0, 1);
          uvArr[vi * 2 + 1] = clamp(z / d, 0, 1);
        }
      }
    }

    geo.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));
    geo.attributes.uv.needsUpdate = true;
  }
}

// ---------------------------
// Glyph building
// ---------------------------
function buildGlyph(ch) {
  const shapes = font.generateShapes(ch, params.size);

  const shapeGeo = new THREE.ShapeGeometry(shapes);
  shapeGeo.computeBoundingBox();
  const bb = shapeGeo.boundingBox;
const widthBBox = bb.max.x - bb.min.x;
const width = getAdvanceWidth(ch, widthBBox);
  const left = bb.min.x;
  shapeGeo.dispose();

  let geo = new THREE.ExtrudeGeometry(shapes, { depth: params.depth, bevelEnabled: false, steps: 1 });
  geo.translate(-left, 0, 0);
geo.computeBoundingBox();
const gbb = geo.boundingBox;

    // Approx collision radius (2D) from glyph bounds in local space
  const gw = (gbb.max.x - gbb.min.x);
  const gh = (gbb.max.y - gbb.min.y);
  const radius = 0.5 * Math.max(gw, gh);


// Visual center (true glyph center)
const centerVisual = {
  x: (gbb.min.x + gbb.max.x) * 0.5,
  y: (gbb.min.y + gbb.max.y) * 0.5,
  z: (gbb.min.z + gbb.max.z) * 0.5,
};

// Baseline center (for correct typing alignment + punctuation)
const centerBaseline = {
  x: centerVisual.x,
  y: 0,
  z: centerVisual.z,
};


  if (geo.index) geo = geo.toNonIndexed();
  writeUVsNonIndexed_Local(geo, params.depth);

  // per-glyph side clone (so FX + transparency stays safe)
  const sideMatLocal = sideMat.clone();
  sideMatLocal.userData = {};
  sideMatLocal.map = sideMat.map;
  sideMatLocal.color.copy(sideMat.color);
  sideMatLocal.transparent = true;
  sideMatLocal.opacity = 1;
  sideMatLocal.visible = true;
  _applyFX(sideMatLocal, false);
  sideMatLocal.needsUpdate = true;

  // Face material: will be replaced per glyph if faceMode === perLetter
  const mesh = new THREE.Mesh(geo, [faceMat, sideMatLocal]);

  const edges = new THREE.EdgesGeometry(geo, Number(params.edgeThreshold || 1));
  let pos = Array.from(edges.attributes.position.array);
  edges.dispose();

  if (params.strokeFacesOnly) pos = filterEdgesToFrontBackFaces(pos, params.depth, 1e-4);

  const lineGeo = new LineSegmentsGeometry();
  lineGeo.setPositions(pos);

  const stroke = new LineSegments2(lineGeo, createStrokeMaterial());
  stroke.computeLineDistances();
  stroke.isLineSegments2 = true;

   return { width, mesh, stroke, centerBaseline, centerVisual, radius };


}

function applyExtrusionTransform(entry) {
  const d = entry.baseDepth;
  const sZ = entry.mesh.scale.z;

  // keep glyph centered around pivot in Z
  const cz = (entry._geoCenterZ ?? (d * 0.5));
  const z = -cz * sZ;

  // preserve original X/Y offsets (so punctuation stays placed correctly)
  const mx = entry._meshBaseX ?? entry.mesh.position.x;
  const my = entry._meshBaseY ?? entry.mesh.position.y;

  entry.mesh.position.set(mx, my, z);

  if (entry.stroke) {
    const sx = entry._strokeBaseX ?? entry.stroke.position.x;
    const sy = entry._strokeBaseY ?? entry.stroke.position.y;
    entry.stroke.position.set(sx, sy, z);
    entry.stroke.scale.z = entry.mesh.scale.z;
  }
}



function _updateDepth(entry) {
  const breath = entry._breathMul ?? 1;
  const zoff = entry.zOffset ?? 0;

  entry.mesh.scale.z = Math.max(0.0001, (entry.depthF ?? 1) * breath);
  applyExtrusionTransform(entry);

entry.group.position.z =
  (entry.baseGroupZ ?? 0) +
  zoff +
  (entry.animOffsetZ || 0) +
  (entry.explodeZLift || 0) +
  (entry.crowdOffsetZ || 0);


}

function _ensureCharZOffsets() {
  if (!Array.isArray(params.charZOffsets)) params.charZOffsets = [];
  const n = glyphs.length;
  if (params.charZOffsets.length !== n) {
    const next = new Array(n);
    for (let i = 0; i < n; i++) next[i] = Number(params.charZOffsets[i] ?? 0);
    params.charZOffsets = next;
  }
}
function _applyCharZOffsetsFromParams() {
  _ensureCharZOffsets();
  for (let i = 0; i < glyphs.length; i++) {
    glyphs[i].zOffset = Number(params.charZOffsets[i] || 0);
    _updateDepth(glyphs[i]);
  }
}
window.__applyCharZOffsets = _applyCharZOffsetsFromParams;
window.__getCharCount = () => glyphs.length;

// Per-letter face colors
function _ensureFaceLetterColors() {
  if (!Array.isArray(params.faceLetterColors)) params.faceLetterColors = [];
  const n = glyphs.length;
  if (params.faceLetterColors.length !== n) {
    const next = new Array(n);
    for (let i = 0; i < n; i++) next[i] = String(params.faceLetterColors[i] ?? "#ffffff");
    params.faceLetterColors = next;
  }
}
function _applyPerLetterFaceMats() {
  if (!glyphs.length) return;
  if (params.faceMode !== "perLetter") return;

  _ensureFaceLetterColors();

  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const col = params.faceLetterColors[i] || "#ffffff";

    if (g._faceMatLocal && g._faceMatLocal !== faceMat) {
      try {
        g._faceMatLocal.dispose?.();
      } catch (e) {}
    }

    let m;
    if (params.lightingMode === "accurate") {
      m = new THREE.MeshBasicMaterial({ color: srgbColor(col) });
    } else {
      m = new THREE.MeshStandardMaterial({ color: srgbColor(col), metalness: 0.05, roughness: 0.45 });
    }
    m.userData = {};
    _applyFX(m, true);
    m.needsUpdate = true;

    g._faceMatLocal = m;

    if (Array.isArray(g.mesh.material)) g.mesh.material[0] = m;
    else g.mesh.material = [m, g.mesh.material];
  }
}
window.__applyPerLetterFaceMats = _applyPerLetterFaceMats;

// ---------------------------
// Text layout
// ---------------------------
const getAlign = () => {
  const a = (params.align || "center").toLowerCase();
  return a === "left" || a === "right" || a === "center" ? a : "center";
};

function buildText() {
  if (!font) return;

  clearText();
  rebuildBackground();

  const lines = String(params.text ?? "").replace(/\r/g, "").split("\n");
  const lineH = params.size * params.lineSpacing;
  const align = getAlign();

  const built = [];
  let maxLineW = 0;

  for (const line of lines) {
    if (!line.length) {
      built.push(null);
      continue;
    }
    const chars = Array.from(line);
    const entries = [];
    let w = 0;

   let prevCh = null;

for (let i = 0; i < chars.length; i++) {
  const ch = chars[i];

  if (ch === " ") {
    const sw = getAdvanceWidth(" ", params.size * 0.35);
    entries.push({ space: true, width: sw });
    w += sw;
    prevCh = null; // break kerning across spaces
    continue;
  }

  const kern = prevCh ? getKern(prevCh, ch) : 0;

  const g = buildGlyph(ch);
  entries.push({ space: false, width: g.width, kern, glyph: g });

  w += kern;
  w += g.width;

  if (i !== chars.length - 1) w += params.charSpacing;

  prevCh = ch;
}

    maxLineW = Math.max(maxLineW, w);
    built.push({ entries, width: w });
  }

  let y = 0,
    globalGlyphIndex = 0;

  for (let lineIdx = 0; lineIdx < built.length; lineIdx++) {
    const lineEntry = built[lineIdx];
    if (!lineEntry) {
      y -= lineH;
      continue;
    }

    let x = 0;
    if (align === "left") x = -maxLineW / 2;
    if (align === "center") x = -lineEntry.width / 2;
    if (align === "right") x = maxLineW / 2 - lineEntry.width;

    const currentLineGroup = [];
    let currentWordGroup = [];
    const flushWord = () => {
      if (currentWordGroup.length) {
        wordGroups.push(currentWordGroup);
        currentWordGroup = [];
      }
    };

    for (let i = 0; i < lineEntry.entries.length; i++) {
      const e = lineEntry.entries[i];
      if (e.space) {
        flushWord();
        x += e.width;
        continue;
      }
        if (e.kern) x += e.kern; // apply pair kerning before placing glyph


const { mesh, stroke, centerBaseline, centerVisual, radius } = e.glyph;


const group = new THREE.Group();
group.position.set(x, y, 0);

// inner is used by idle wave
const inner = new THREE.Group();
group.add(inner);

// pivotBaseline keeps text aligned to baseline (punctuation correct)
const pivot = new THREE.Group();
inner.add(pivot);

// rotCenter is offset so its origin is the TRUE visual center of the glyph.
// We'll apply Spin360 rotation to this group only.
const rot = new THREE.Group();
pivot.add(rot);

// delta from baseline-center space to visual-center space
rot.position.set(
  centerVisual.x - centerBaseline.x,
  centerVisual.y - centerBaseline.y,
  centerVisual.z - centerBaseline.z
);

// Place mesh so its VISUAL center is at rot's origin.
// Net result position relative to pivotBaseline is still -centerBaseline (so layout stays correct).
mesh.position.set(-centerVisual.x, -centerVisual.y, -centerVisual.z);
if (params.strokeWidth > 0) stroke.position.set(-centerVisual.x, -centerVisual.y, -centerVisual.z);

rot.add(mesh);
if (params.strokeWidth > 0) rot.add(stroke);

textGroup.add(group);



      const idx = globalGlyphIndex;

      // Tag mesh for hover picking
      mesh.userData.__glyphIndex = idx;

      // Explosion direction seed (stable)
      const a0 = hash01(idx + 17) * Math.PI * 2;

      // For hover explode (kept)
      const mag = 0.6 + 0.4 * hash01(idx + 91);
      const exu = Math.cos(a0) * mag;
      const eyu = Math.sin(a0) * mag;

      const ezj = stableJitter(idx + 2027);

      const entry = {

        rot,
        radius,
          crowdOffsetZ: 0,

_meshBaseX: -centerVisual.x,
_meshBaseY: -centerVisual.y,
_strokeBaseX: -centerVisual.x,
_strokeBaseY: -centerVisual.y,

_geoCenterZ: centerVisual.z, // use visual center for Z-centering
baseRotCX: rot.rotation.x,
baseRotCY: rot.rotation.y,
baseRotCZ: rot.rotation.z,

        group,
        inner,
        mesh,
        stroke,
        _spin360PendingReset: false,


        baseDepth: params.depth,

        baseGroupX: group.position.x,
        baseGroupY: group.position.y,
        baseGroupZ: group.position.z,
        pivot,
baseRotX: pivot.rotation.x,
baseRotY: pivot.rotation.y,
baseRotZ: pivot.rotation.z,

        baseScaleX: group.scale.x,
        baseScaleY: group.scale.y,
        baseScaleZ: group.scale.z,
        baseX: x,

        depthF: 1,
        _breathMul: 1,
        zOffset: 0,
        lineIndex: lineIdx,
        hoverF: 0,
        overlayIndex: idx,

        // animation offsets (GSAP presets)
        animOffsetX: 0,
        animOffsetY: 0,
        animOffsetZ: 0,
        animRotX: 0,
        animRotY: 0,
        animRotZ: 0,
        animScale: 1,

        // explode seeds
        _expU: a0,       // main stable angle
        _expX: exu,      // used by hover explode
        _expY: eyu,      // used by hover explode
        _expZ: ezj,      // stable z jitter
        _spinJitter: stableJitter(idx), // stable noise driver

        explodeF: 0,
        explodeZLift: 0, // additive channel


        // hover spin360 additive
        _spin360Axis: stablePickAxis(idx, params.hoverSpin360Axis, true),
        _spin360Add: 0,
      };

      _updateDepth(entry);

      glyphs.push(entry);
      currentWordGroup.push(entry);
      currentLineGroup.push(entry);

      x += e.width;
      if (i !== lineEntry.entries.length - 1) x += params.charSpacing;
      globalGlyphIndex++;
    }

    flushWord();
    if (currentLineGroup.length) lineGroups.push(currentLineGroup);
    y -= lineH;
  }

  const box = new THREE.Box3().setFromObject(textGroup);
  const sizeVec = new THREE.Vector3();
  const centerVec = new THREE.Vector3();
  box.getSize(sizeVec);
  box.getCenter(centerVec);

  textGroup.position.x -= centerVec.x;
  textGroup.position.y -= centerVec.y;
  textGroup.position.z -= centerVec.z;

  frame.maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);

  const meshes = glyphs.map((g) => g.mesh);

  const faceWorld =
    params.faceMode === "checker"
      ? true
      : params.faceMode !== "solid" && params.faceMode !== "perLetter" && params.faceUVSpace === "world";

  const sideWorld = params.sideMode === "gradient" && params.sideUVSpace === "world";

  applyWorldUVsNonIndexed(meshes, params.depth, faceWorld, sideWorld);

  textGroup.updateMatrixWorld(true);
  _refreshStablePlane();

  resize();
  reframeToText();

  renderer.compile(scene, camera);

  _applyCharZOffsetsFromParams();
  _applyPerLetterFaceMats();

  try {
    window.__rebuildZControls?.();
  } catch (e) {}

  try {
    window.__rebuildFaceColorControls?.();
  } catch (e) {}

  _syncFXUniforms();
}
window.buildText = buildText;

// ---------------------------
// Fonts
// ---------------------------
async function setFontFromUrl(url) {
  const u = String(url || "").trim();
  if (!u) return;
  try {
    await new Promise((res, rej) =>
      fontLoader.load(
        u,
        (f) => {
          font = f;
          res();
        },
        undefined,
        rej
      )
    );
    buildText();
    if (window.__tp_animPlaying) playAnimation();
  } catch (e) {
    console.error(e);
    alert("Font load failed. Use a THREE typeface JSON (.typeface.json).");
  }
}
function setFontFromUploadedJsonText(t) {
  try {
    font = fontLoader.parse(JSON.parse(t));
    buildText();
    if (window.__tp_animPlaying) playAnimation();
  } catch (e) {
    console.error(e);
    alert("Could not parse font. Upload a THREE typeface JSON (.typeface.json).");
  }
}
window.setFontFromUploadedJsonText = setFontFromUploadedJsonText;

async function applyFontSelection() {
  if (params.fontSource === "preset") return setFontFromUrl(FONT_PRESETS[params.fontPreset]);
  if (params.fontSource === "url") return setFontFromUrl(params.fontUrl);
}
window.applyFontSelection = applyFontSelection;

// ---------------------------
// Camera
// ---------------------------
function tweenCamera(toPos, toTarget, duration = 0.85) {
  if (!gsap) {
    camera.position.copy(toPos);
    controls.target.copy(toTarget);
    controls.update();
    return;
  }
  gsap.to(camera.position, {
    x: toPos.x,
    y: toPos.y,
    z: toPos.z,
    duration,
    ease: "power2.inOut",
    onUpdate: () => controls.update(),
  });
  gsap.to(controls.target, {
    x: toTarget.x,
    y: toTarget.y,
    z: toTarget.z,
    duration,
    ease: "power2.inOut",
    onUpdate: () => controls.update(),
  });
}
function applyCameraPreset() {
  const dist = Math.max(420, frame.maxDim * 1.25);
  const lift = Math.max(120, frame.maxDim * 0.35);
  let pos;
  if (params.cameraPreset === "front") pos = new THREE.Vector3(0, 0, dist);
  else if (params.cameraPreset === "isoLeft") pos = new THREE.Vector3(-dist, lift, dist);
  else pos = new THREE.Vector3(dist, lift, dist);
  tweenCamera(pos, new THREE.Vector3(0, 0, 0), 0.85);
}
function reframeToText() {
  const dist = Math.max(420, frame.maxDim * 1.25);
  const lift = Math.max(140, frame.maxDim * 0.35);
  tweenCamera(new THREE.Vector3(0, lift * 0.2, dist), new THREE.Vector3(0, 0, 0), 0.85);
}
window.applyCameraPreset = applyCameraPreset;
window.reframeToText = reframeToText;

// ---------------------------
// GSAP Preset Animation
// ---------------------------
function stopAnimation() {
  if (tl) {
    tl.kill();
    tl = null;
  }
  for (const g of glyphs) {
    g.depthF = 1;
   const bx = (g.baseGroupX || 0) + (g.animOffsetX || 0);
const by = (g.baseGroupY || 0) + (g.animOffsetY || 0);
g._tx = bx;
g._ty = by;

    g.animOffsetX = 0;
    g.animOffsetY = 0;
    g.animOffsetZ = 0;
    g.animRotX = 0;
    g.animRotY = 0;
    g.animRotZ = 0;
    g.animScale = 1;

   g.pivot.rotation.x = g.baseRotX || 0;
g.pivot.rotation.y = g.baseRotY || 0;
g.pivot.rotation.z = g.baseRotZ || 0;
g.group.rotation.set(0,0,0);
g.pivot.rotation.set(g.baseRotX||0, g.baseRotY||0, g.baseRotZ||0);

    g.group.scale.set(g.baseScaleX || 1, g.baseScaleY || 1, g.baseScaleZ || 1);

    _updateDepth(g);
  }
  
  _applyCharZOffsetsFromParams();
}
window.stopAnimation = stopAnimation;

function playAnimation() {
  if (!gsap || !glyphs.length) return;
  if (tl) {
    tl.kill();
    tl = null;
  }

  const duration = Number(params.animSpeed || 1.2);
  const stagger = Number(params.animStagger || 0.03);
  const ease = params.animEase || "power2.inOut";
  const shouldLoop = !!params.animLoop;

  const minF = Math.max(0, Number(params.animMinPct || 0) / 100);
  const maxF = Math.max(0, Number(params.animMaxPct || 100) / 100);

  let groups = [];
  if (params.animStaggerMode === "word") groups = wordGroups;
  else if (params.animStaggerMode === "line") groups = lineGroups;
  else groups = glyphs.map((g) => [g]);

  const proxies = groups
    .filter((g) => g && g.length)
    .map((members) => ({
      f: minF,
      rx: 0,
      ry: 0,
      rz: 0,
      s: 1,
      ex: 0,
      members,
    }));

  const rotRad = THREE.MathUtils.degToRad(Number(params.animRotateDeg || 35));
  const inflateAmt = Number(params.animInflate || 0.18);
  const spinRad = THREE.MathUtils.degToRad(Number(params.animSpinDeg ?? 360));

  // ------------------------------------------------------------
  // Explode tuning (v14 + impact + holds + easing + rot variance)
  // ------------------------------------------------------------
  const explodeAmt = Number(params.animExplodeAmount ?? 220);

  const exDX = Math.max(0.01, Number(params.animExplodeDiameterX ?? 1));
  const exDY = Math.max(0.01, Number(params.animExplodeDiameterY ?? 1));
  const exD = Math.max(0.0, Number(params.animExplodeDiameter ?? 1.0)); // master

  // IMPORTANT: normalize shape names so your dropdown ALWAYS maps
  const exShapeRaw = String(params.animExplodeShape || "burst");
  const exShape = exShapeRaw.replace(/\s+/g, "").toLowerCase(); // "Line X" -> "linex"
  const exRingAng = THREE.MathUtils.degToRad(Number(params.animExplodeRingAngle ?? 0));
  const exNoise = clamp01(Number(params.animExplodeNoise ?? 0.15));

  const exAng = THREE.MathUtils.degToRad(Number(params.animExplodeAngleOffset ?? 0));
  const exZ = Number(params.animExplodeZAmount ?? 0);
  const exZSpread = Number(params.animExplodeZSpread ?? 0.0);

  const exZLift = Number(params.animExplodeZLift ?? 28); // extra Z layering during explode
  const exDepthShrink = clamp01(Number(params.animExplodeDepthShrink ?? 0.22)); // thin extrusion during explode

  const exRotAxisBase = String(params.animExplodeRotAxis || "z").toLowerCase();
  const exRandDir = !!params.animExplodeRandomDir;

  // NEW: rotation variation (min/max degrees)
  const exRotMinDeg = Number(params.animExplodeRotMinDeg ?? (params.animExplodeRotDeg ?? 55));
  const exRotMaxDeg = Number(params.animExplodeRotMaxDeg ?? (params.animExplodeRotDeg ?? 55));

  // NEW: explode OUT/RETURN eases + hold times
  const exEaseOut = String(params.animExplodeEaseOut || "expo.out");
  const exEaseIn = String(params.animExplodeEaseIn || "expo.in");
  const exHold = Math.max(0, Number(params.animExplodeHold ?? 0));         // seconds pause at full explode
  const exReturnHold = Math.max(0, Number(params.animExplodeReturnHold ?? 0)); // seconds pause after return
  const exReturn = params.animExplodeReturn == null ? true : !!params.animExplodeReturn;

  // Impact-style explode (existing)
  const exImpactOn = !!params.animExplodeImpactOn;
  const exImpactDir = String(params.animExplodeImpactDir || "front").toLowerCase(); // front|back
  const exImplode = !!params.animExplodeImplode;
  const exImpactStrength = Number(params.animExplodeImpactStrength ?? 1.0);
  const exImpactRadius = Math.max(1, Number(params.animExplodeImpactRadius ?? 260));
  const exImpactFalloff = Math.max(0.01, Number(params.animExplodeImpactFalloff ?? 2.2));
  const exImpactX = Number(params.animExplodeImpactX ?? 0); // -1..1
  const exImpactY = Number(params.animExplodeImpactY ?? 0); // -1..1
  const exImpactZPush = Number(params.animExplodeImpactZPush ?? 160);
  const exImpactRadialBoost = Number(params.animExplodeImpactRadialBoost ?? 0.55);

  // ------------------------------------------------------------
  // Helpers (local, safe)
  // ------------------------------------------------------------
  function smooth01(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // stable 0..1 random from an integer seed (repeatable)
  function stable01(seed) {
    // xorshift-ish hash -> [0,1)
    let x = (seed | 0) + 0x6D2B79F5;
    x = Math.imul(x ^ (x >>> 15), 1 | x);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }

  function getGlyphXY(m) {
    if (typeof m.layoutX === "number" && typeof m.layoutY === "number") return [m.layoutX, m.layoutY];
    if (typeof m.baseX === "number" && typeof m.baseY === "number") return [m.baseX, m.baseY];
    const px = m.pivot?.position?.x ?? 0;
    const py = m.pivot?.position?.y ?? 0;
    return [px, py];
  }

  function applyProxy(p) {
    for (const m of p.members) {
      let ox = 0, oy = 0, oz = 0;
      let arx = 0, ary = 0, arz = 0;
      let asc = 1;

      // ---------------------------
      // Explode (upgraded + impact)
      // ---------------------------
      if (p.ex && p.ex !== 0) {
        const a0 = (m._expU || 0) + exAng;

        let dx = Math.cos(a0);
        let dy = Math.sin(a0);

        const n = 1 + (m._spinJitter || 0) * exNoise;

        let sx = exDX * exD * n;
        let sy = exDY * exD * n;

        const zSeed = m._expZ || 0;

        // stable Z layering during explode (reduces clipping)
        m.explodeZLift = zSeed * exZLift * p.ex;
        if (p.z0 == null) p.z0 = p.z || 0;

        // NEW: Impact field (mass hits from front/back)
        let impactMul = 1;
        let impactZ = 0;

        if (exImpactOn) {
          const [gx, gy] = getGlyphXY(m);

          const cx = (exImpactX || 0) * exImpactRadius;
          const cy = (exImpactY || 0) * exImpactRadius;

          const ddx = gx - cx;
          const ddy = gy - cy;
          const dist = Math.hypot(ddx, ddy);

          const t = 1 - dist / exImpactRadius;
          const prox = smooth01(t);

          const impulse = Math.pow(prox, exImpactFalloff) * exImpactStrength;

          impactMul = 1 + exImpactRadialBoost * impulse;

          const dirZ = exImpactDir === "back" ? 1 : -1;
          impactZ = dirZ * exImpactZPush * impulse;
        }

        // -------------------------------------------------
        // Shape controls (these SHOULD look different)
        // -------------------------------------------------
        if (exShape === "ring") {
          const c = Math.cos(exRingAng), s = Math.sin(exRingAng);
          const rx2 = dx * c - dy * s;
          const ry2 = dx * s + dy * c;
          dx = rx2; dy = ry2;

          // ring == keep XY, but a bit less noisy Z unless user adds it
          // (still allows exZ + impactZ)
        } else if (exShape === "sphere") {
          // sphere adds Z dispersion on top of existing exZ + impactZ
          oz += zSeed * (explodeAmt * exZSpread) * p.ex;
        } else if (exShape === "linex") {
          dx = Math.sign(dx || 1);
          dy = 0;
          sy = 0; // kill Y
        } else if (exShape === "liney") {
          dx = 0;
          dy = Math.sign(dy || 1);
          sx = 0; // kill X
        } else {
          // "burst" -> default (dx,dy already radial)
        }

        // Apply explode with impact feel
        const inOut = exImplode ? -1 : 1;

        ox += dx * explodeAmt * sx * p.ex * impactMul * inOut;
        oy += dy * explodeAmt * sy * p.ex * impactMul * inOut;

        oz += zSeed * exZ * p.ex;
        oz += impactZ * p.ex;

        // per-char rotation on chosen/random axis + NEW min/max variance
        let ax = exRotAxisBase;
        if (ax === "random") ax = stablePickAxis(m.overlayIndex || 0, "random", true);

        const sign = stablePickSign(m.overlayIndex || 0, exRandDir);
        const r01 = stable01((m.overlayIndex || 0) + 1337);
        const rDeg = lerp(exRotMinDeg, exRotMaxDeg, r01);
        const r = THREE.MathUtils.degToRad(rDeg) * sign * p.ex;

        if (ax === "x") arx += r;
        else if (ax === "y") ary += r;
        else arz += r;
      } else {
        m.explodeZLift = 0;
      }

      // ---------------------------
      // Shared proxy transforms
      // ---------------------------
      arx += p.rx || 0;
      ary += p.ry || 0;
      arz += p.rz || 0;

      asc *= p.s || 1;

      m.animOffsetX = ox;
      m.animOffsetY = oy;
      m.animOffsetZ = oz;

      m.animRotX = arx;
      m.animRotY = ary;
      m.animRotZ = arz;

      m.animScale = asc;

      m.pivot.rotation.x = (m.baseRotX || 0) + m.animRotX;
      m.pivot.rotation.y = (m.baseRotY || 0) + m.animRotY;
      m.pivot.rotation.z = (m.baseRotZ || 0) + m.animRotZ;

      const bsx = m.baseScaleX || 1;
      const bsy = m.baseScaleY || 1;
      const bsz = m.baseScaleZ || 1;
      m.group.scale.set(bsx * m.animScale, bsy * m.animScale, bsz);

      m.explodeF = p.ex || 0;

      // depth thinning during explode
      const baseF = typeof p.f === "number" ? p.f : 1;
      const thinMul = 1 - exDepthShrink * m.explodeF;
      m.depthF = baseF * thinMul;

      _updateDepth(m);
    }
  }

  // Apply once immediately so the initial state matches params
  for (const p of proxies) applyProxy(p);

  const preset = (params.animPreset || "depth").toLowerCase();
  const alsoDepth = preset === "depth" ? true : !!params.animAlsoDepth;

  const tweenVars = {
    duration,
    stagger: { each: stagger, from: params.animStaggerFrom },
    onUpdate: () => {
      for (const p of proxies) applyProxy(p);
      _applyCharZOffsetsFromParams();
    },
  };

  // Reset proxy channels
  for (const p of proxies) {
    p.f = alsoDepth ? minF : undefined;
    p.rx = 0; p.ry = 0; p.rz = 0;
    p.s = 1;
    p.ex = 0;
  }

  const axis = (params.animAxis || "y").toLowerCase();
  const depthTarget = maxF;

  if (tl) { tl.kill(); tl = null; }

  // ------------------------------------------------------------
  // Timeline routing
  // ------------------------------------------------------------
  if (preset === "blast") {
    // unchanged (your blast logic)
    tl = gsap.timeline({ repeat: shouldLoop ? -1 : 0 });

    tl.to(
      proxies,
      {
        ...tweenVars,
        ease: blastEaseOut,
        bl: 1,
        ...(alsoDepth ? { f: depthTarget } : {}),
      },
      0
    );

    if (blastReturn) {
      tl.to(
        proxies,
        {
          ...tweenVars,
          ease: blastEaseIn,
          bl: 0,
          ...(alsoDepth ? { f: minF } : {}),
        },
        ">-0.05"
      );
    }

  } else if (preset === "explode") {
    // NEW: explode is OUT -> HOLD -> (optional) RETURN -> HOLD
    tl = gsap.timeline({ repeat: shouldLoop ? -1 : 0 });

    // OUT
    {
      const vars = { ...tweenVars, ease: exEaseOut, ex: 1 };
      if (alsoDepth) vars.f = depthTarget;
      tl.to(proxies, vars, 0);
    }

    // HOLD at full explode
    if (exHold > 0) {
      tl.to({}, { duration: exHold }, ">");
    }

    // RETURN
    if (exReturn) {
      const vars = { ...tweenVars, ease: exEaseIn, ex: 0 };
      if (alsoDepth) vars.f = minF;
      tl.to(proxies, vars, ">");
    }

    // HOLD after return (before repeating)
    if (exReturnHold > 0) {
      tl.to({}, { duration: exReturnHold }, ">");
    }

  } else {
    // Default presets use yoyo (unchanged)
    tl = gsap.timeline({ repeat: shouldLoop ? -1 : 0, yoyo: true });

    if (preset === "depth") {
      tl.to(proxies, { ...tweenVars, ease, f: depthTarget }, 0);

    } else if (preset === "twist") {
      const vars = { ...tweenVars, ease };
      if (axis === "x") vars.rx = rotRad;
      else vars.ry = rotRad;
      if (alsoDepth) vars.f = depthTarget;
      tl.to(proxies, vars, 0);

    } else if (preset === "inflate") {
      const vars = { ...tweenVars, ease, s: 1 + inflateAmt };
      if (alsoDepth) vars.f = depthTarget;
      tl.to(proxies, vars, 0);

    } else if (preset === "spin") {
      const vars = { ...tweenVars, ease };
      if (axis === "x") vars.rx = spinRad;
      else if (axis === "y") vars.ry = spinRad;
      else vars.rz = spinRad;
      if (alsoDepth) vars.f = depthTarget;
      tl.to(proxies, vars, 0);
    }
  }
}

window.playAnimation = playAnimation;






// ---------------------------
// Hover (Spin360 fixed: raycast enter + full 360)
// ---------------------------
let pointerActive = false;
let pointerNDC = new THREE.Vector2(0, 0);

const cursorLocal = new THREE.Vector3(0, 0, 0);
const cursorLocalTarget = new THREE.Vector3(0, 0, 0);
const _cursorDelta = new THREE.Vector3();

let _prevCursorLocal = new THREE.Vector3(0, 0, 0);
let _cursorSpeed = 0; // smoothed units/sec

let _spin360PrevIdx = -1;          // last raycast-hit glyph index
let _spin360PrevGlyph = null;      // actual glyph ref for easier handling
let _spin360MissFrames = 0;
const SPIN360_MISS_FRAMES_BEFORE_RESET = 8; // ~8 frames = ~130ms @60fps



function _updatePointerFromEvent(e) {
  const r = renderer.domElement.getBoundingClientRect();
  const x = e.clientX - r.left,
    y = e.clientY - r.top;
  pointerActive = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
  if (!pointerActive) return;
  pointerNDC.x = (x / r.width) * 2 - 1;
  pointerNDC.y = -(y / r.height) * 2 + 1;
}
function onPointerMove(e) {
  _updatePointerFromEvent(e);
}
function onPointerEnter(e) {
  _updatePointerFromEvent(e);
}
function onPointerLeave() {
  pointerActive = false;
  _hoverStrength = 0;

  // If we were on a glyph, mark it as "left".
  if (_spin360PrevGlyph) {
    // if it's spinning, let it finish then reset
    if (_spin360PrevGlyph._spin360Busy || _spin360PrevGlyph._spin360Lock) {
      _spin360PrevGlyph._spin360PendingReset = true;
    } else {
      _spin360Reset(_spin360PrevGlyph);
    }
  }

  _spin360PrevIdx = -1;
  _spin360PrevGlyph = null;
  _spin360MissFrames = 0;
}



function getCursorLocalOnTextPlane(outLocal) {
  _raycaster.setFromCamera(pointerNDC, camera);
  const ok = _raycaster.ray.intersectPlane(_stablePlane, _hit);
  if (!ok) return false;

  _hoverWorld.copy(_hit);
  outLocal.copy(_hit);
  textGroup.worldToLocal(outLocal);
  return true;
}

function _raycastGlyphIndexUnderCursor() {
  if (!pointerActive || !glyphs.length) return -1;
  _raycaster.setFromCamera(pointerNDC, camera);
  const objs = glyphs.map((g) => g.mesh);
  const hits = _raycaster.intersectObjects(objs, false);
  if (!hits || !hits.length) return -1;
  const idx = hits[0]?.object?.userData?.__glyphIndex;
  return typeof idx === "number" ? idx : -1;
}

function _spin360Trigger(g) {
  if (!gsap || !g) return;

  const baseDur = clamp(Number(params.hoverSpin360BaseDur ?? 0.55), 0.05, 4);
  const spScale = Math.max(0, Number(params.hoverSpin360SpeedScale ?? 0.0045));
  const minDur = clamp(Number(params.hoverSpin360MinDur ?? 0.12), 0.03, 4);
  const maxDur = clamp(Number(params.hoverSpin360MaxDur ?? 0.9), 0.03, 4);
  const ease = params.hoverSpin360Ease || "power3.out";

  const sp = clamp(_cursorSpeed, 0, 2000);
  const dur = clamp(baseDur / (1 + sp * spScale), minDur, maxDur);

  // already spinning? let it finish
  if (g._spin360Busy) return;

  // choose axis (stable per glyph)
  let ax = String(params.hoverSpin360Axis || "z").toLowerCase();
  if (ax === "random") {
    if (!g._spin360Axis) g._spin360Axis = stablePickAxis(g.overlayIndex || 0, "random", true);
    ax = g._spin360Axis;
  }
  if (ax !== "x" && ax !== "y" && ax !== "z") ax = "z";

  const dir = stablePickSign(g.overlayIndex || 0, !!params.hoverSpin360RandomDir);
  const add = Math.PI * 2 * dir;

  g._spin360Busy = true;
  g._spin360Lock = true;      // <<< IMPORTANT: ignore raycast misses while true
  g._spin360Dur = dur;        // used to improve rotation lerp while spinning

  gsap.to(g, {
    _spin360Add: g._spin360Add + add,
    duration: dur,
    ease,
    overwrite: true,
   onComplete: () => {
  g._spin360Busy = false;
  g._spin360Lock = false;

  // prevent runaway growth
  if (Math.abs(g._spin360Add) > Math.PI * 50) {
    g._spin360Add = g._spin360Add % (Math.PI * 2);
  }

  // If cursor left while spinning, reset now
  if (g._spin360PendingReset) {
    g._spin360PendingReset = false;
    _spin360Reset(g);
  }
},

  });
}

function _spin360Reset(g) {
  if (!gsap || !g) return;

  // if a spin is in progress, kill it then reset cleanly
  g._spin360Lock = false;
  g._spin360Busy = false;

  gsap.to(g, {
    _spin360Add: 0,
    duration: 0.35,
    ease: "power3.out",
    overwrite: true,
    onComplete: () => {
      // fully re-arm for next hover-in
      g._spin360Add = 0;
      g._spin360Busy = false;
      g._spin360Lock = false;
    },
  });
}



function resetHoverTransforms() {
  const chase = clamp(Number(params.liftSmoothing || 0.18), 0.001, 1);

  // axis base for additive spin360 application
  const spin360AxisBase = String(params.hoverSpin360Axis || "random").toLowerCase();

  for (const g of glyphs) {
    const bx = (g.baseGroupX || 0) + (g.animOffsetX || 0);
    const by = (g.baseGroupY || 0) + (g.animOffsetY || 0);

    g.group.position.x = lerp(g.group.position.x, bx, chase);
    g.group.position.y = lerp(g.group.position.y, by, chase);

    let brx = (g.baseRotX || 0) + (g.animRotX || 0);
    let bry = (g.baseRotY || 0) + (g.animRotY || 0);
    let brz = (g.baseRotZ || 0) + (g.animRotZ || 0);

    
   g.pivot.rotation.x = lerp(g.pivot.rotation.x, brx, chase);
g.pivot.rotation.y = lerp(g.pivot.rotation.y, bry, chase);
g.pivot.rotation.z = lerp(g.pivot.rotation.z, brz, chase);


    const bsx = (g.baseScaleX || 1) * (g.animScale || 1);
    const bsy = (g.baseScaleY || 1) * (g.animScale || 1);
    const bsz = g.baseScaleZ || 1;

    g.group.scale.x = lerp(g.group.scale.x, bsx, chase);
    g.group.scale.y = lerp(g.group.scale.y, bsy, chase);
    g.group.scale.z = lerp(g.group.scale.z, bsz, chase);
  }
}


  


function _clampLen(dx, dy, maxLen) {
  const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
  if (d <= maxLen) return { dx, dy };
  const s = maxLen / d;
  return { dx: dx * s, dy: dy * s };
}

function _resolveCollisions2D(glyphs) {
  if (!params.collideOn) return;

  const iters = Math.max(0, Math.floor(params.collideIters || 0));
  if (!iters) return;

  const pad = Math.max(0, Number(params.collidePadding ?? 0));
  const strength = clamp(Number(params.collideStrength ?? 0.65), 0, 2);
  const maxShift = Math.max(0, Number(params.collideMaxShift ?? 0));

  // Build candidate positions from intended targets:
  // g._cx, g._cy are the solver positions (start at intended target each frame)
  for (const g of glyphs) {
    g._cx = g._tx;
    g._cy = g._ty;
  }

  // Spatial hash (optional but helps a ton if you have many glyphs)
  const useGrid = !!params.collideGrid;

  // Pick a reasonable cell size based on max radius
  let maxR = 0;
  for (const g of glyphs) maxR = Math.max(maxR, Number(g.radius || 0));
  const cellSize = Math.max(8, (maxR + pad) * 2);

  for (let iter = 0; iter < iters; iter++) {
    let grid = null;

    if (useGrid) {
      grid = new Map();
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        const cx = Math.floor(g._cx / cellSize);
        const cy = Math.floor(g._cy / cellSize);
        const key = cx + "," + cy;
        let arr = grid.get(key);
        if (!arr) grid.set(key, (arr = []));
        arr.push(i);
      }
    }

    for (let i = 0; i < glyphs.length; i++) {
      const a = glyphs[i];
      const ar = Math.max(0, Number(a.radius || 0)) + pad;

      // Neighbor search
      let candidates = null;

      if (useGrid && grid) {
        const gcx = Math.floor(a._cx / cellSize);
        const gcy = Math.floor(a._cy / cellSize);
        candidates = [];
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const key = (gcx + ox) + "," + (gcy + oy);
            const bucket = grid.get(key);
            if (bucket) candidates.push(...bucket);
          }
        }
      } else {
        // brute force
        candidates = null; // means j loop all
      }

      const loopList = candidates || null;

      const jStart = 0;
      const jEnd = loopList ? loopList.length : glyphs.length;

      for (let jj = jStart; jj < jEnd; jj++) {
        const j = loopList ? loopList[jj] : jj;
        if (j <= i) continue; // each pair once

        const b = glyphs[j];
        const br = Math.max(0, Number(b.radius || 0)) + pad;

        const dx = b._cx - a._cx;
        const dy = b._cy - a._cy;

        const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        const minD = ar + br;

        if (dist >= minD) continue;

        // Push apart (half each)
        const overlap = (minD - dist);
        const nx = dx / dist;
        const ny = dy / dist;

        const push = overlap * 0.5 * strength;

        a._cx -= nx * push;
        a._cy -= ny * push;
        b._cx += nx * push;
        b._cy += ny * push;
      }
    }

    // Clamp drift from intended position (prevents “exploding layout”)
    if (maxShift > 0) {
      for (const g of glyphs) {
        const dx = g._cx - g._tx;
        const dy = g._cy - g._ty;
        const c = _clampLen(dx, dy, maxShift);
        g._cx = g._tx + c.dx;
        g._cy = g._ty + c.dy;
      }
    }
  }

  // Output: overwrite intended targets with resolved ones
  for (const g of glyphs) {
    g._tx = g._cx;
    g._ty = g._cy;
  }
}

// ---------------------------
// Option D: crowd metric (NO XY movement)
// ---------------------------
function computeCrowdMetric() {
  if (!params.crowdOn || !glyphs.length) return;

  const crowdR = Math.max(1e-6, Number(params.crowdRadius || 42));
  const invCrowdR = 1 / crowdR;
  const lineOnly = !!params.crowdLineOnly;

  // reset
  for (const g of glyphs) g._crowd = 0;

  // O(n^2) – fine for typical glyph counts
  for (let i = 0; i < glyphs.length; i++) {
    const a = glyphs[i];
    const ax = a._tx ?? ((a.baseGroupX || 0) + (a.animOffsetX || 0));
    const ay = a._ty ?? ((a.baseGroupY || 0) + (a.animOffsetY || 0));

    for (let j = i + 1; j < glyphs.length; j++) {
      const b = glyphs[j];
      if (lineOnly && a.lineIndex !== b.lineIndex) continue;

      const bx = b._tx ?? ((b.baseGroupX || 0) + (b.animOffsetX || 0));
      const by = b._ty ?? ((b.baseGroupY || 0) + (b.animOffsetY || 0));

      const dx = bx - ax;
      const dy = by - ay;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d >= crowdR) continue;

      const c = 1 - d * invCrowdR;
      a._crowd += c;
      b._crowd += c;
    }
  }

  // normalize
  for (const g of glyphs) {
    g._crowd = clamp01((g._crowd || 0) * 0.65);
  }
}


function updateHoverEffects() {
  if (!glyphs.length) return;

  const chase = clamp(Number(params.liftSmoothing || 0.18), 0.001, 1);

  // ---------------------------
  // Cursor tracking / hover enable
  // ---------------------------
  let canHover = !!params.proximityLift && pointerActive;

  if (canHover) {
    if (getCursorLocalOnTextPlane(cursorLocalTarget)) {
      const ms = clamp(Number(params.cursorSmoothing || 0.85), 0, 0.98);
      const a = 1 - ms;

      _cursorDelta.copy(cursorLocalTarget).sub(cursorLocal);

      const maxStep = 40;
      const len = _cursorDelta.length();
      if (len > maxStep) _cursorDelta.multiplyScalar(maxStep / len);

      cursorLocal.addScaledVector(_cursorDelta, a);
    } else {
      canHover = false;
    }
  }

  if (!canHover) {
    _hoverStrength = 0;
    // don't return — we still want to settle transforms back
  }

  // cursor speed (smoothed units/sec)
  const dist = cursorLocal.distanceTo(_prevCursorLocal);
  const inst = dist / Math.max(1e-6, _fxDt);
  _cursorSpeed = lerp(_cursorSpeed, inst, 0.22);
  _prevCursorLocal.copy(cursorLocal);

  // ---------------------------
  // Shared params
  // ---------------------------
  const r = Math.max(1e-6, Number(params.proximityRadiusWorld || 140));
  const invR = 1 / r;
  const mode = params.proximityFalloff || "smooth";

  const lift = Number(params.proximityLiftAmount || 60);
  const rot = THREE.MathUtils.degToRad(Number(params.hoverRotateDeg || 20));
  const tilt = THREE.MathUtils.degToRad(Number(params.hoverTiltDeg || 18));
  const pulse = Number(params.hoverPulse || 0.12);
  const hoverMode = (params.hoverMode || "lift").toLowerCase();

  const sweepOn = !!params.magneticSweepOn;
  const sweepAmt = Number(params.sweepAmount || 0);
  const sweepBias = Number(params.sweepBias || 1);
  const sweepYMix = Number(params.sweepYMix || 0.25);

  // Explode (hover)
  const explodeAmt = Number(params.hoverExplodeAmount ?? 120);
  const explodeTwist = THREE.MathUtils.degToRad(Number(params.hoverExplodeTwistDeg ?? 35));

  // Spin360
  const spin360AxisBase = String(params.hoverSpin360Axis || "random").toLowerCase();
  const minHoverF = clamp01(Number(params.hoverSpin360MinHoverF ?? 0.2));
  const spin360Lift = clamp01(Number(params.hoverSpin360Lift ?? 0.12));

  // ---------------------------
  // Pass 0: compute hoverF + hover strength
  // ---------------------------
  let maxF = 0;
  for (const g of glyphs) {
    const c = { x: g.baseX || 0, y: g.baseGroupY || 0 };
    const dx = cursorLocal.x - c.x;
    const dy = cursorLocal.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    const u = d < r ? 1 - d * invR : 0;
    g.hoverF = falloff(u, mode);

    if (g.hoverF > maxF) maxF = g.hoverF;
  }
  _hoverStrength = maxF;

  // ---------------------------
  // Spin360 enter/leave detection (raycast)
  // ---------------------------
  if (hoverMode === "spin360") {
    const idx = _raycastGlyphIndexUnderCursor();
    const allowed = _hoverStrength >= minHoverF;

    if (allowed && idx >= 0) {
      _spin360MissFrames = 0;

      // moved off a previous glyph
      if (_spin360PrevIdx !== -1 && _spin360PrevIdx !== idx && _spin360PrevGlyph) {
        const prev = _spin360PrevGlyph;
        if (prev._spin360Busy || prev._spin360Lock) prev._spin360PendingReset = true;
        else _spin360Reset(prev);
      }

      // entered a new glyph
      if (idx !== _spin360PrevIdx) {
        _spin360PrevIdx = idx;
        _spin360PrevGlyph = glyphs[idx];
        _spin360PrevGlyph._spin360PendingReset = false;
        _spin360Trigger(_spin360PrevGlyph);
      }
    } else {
      _spin360MissFrames++;

      if (_spin360MissFrames >= SPIN360_MISS_FRAMES_BEFORE_RESET) {
        if (_spin360PrevGlyph) {
          const prev = _spin360PrevGlyph;
          if (prev._spin360Busy || prev._spin360Lock) prev._spin360PendingReset = true;
          else _spin360Reset(prev);
        }
        _spin360PrevIdx = -1;
        _spin360PrevGlyph = null;
        _spin360MissFrames = 0;
      }
    }
  } else {
    // leaving spin360 mode
    _spin360MissFrames = 0;
    if (_spin360PrevGlyph) {
      const prev = _spin360PrevGlyph;
      if (prev._spin360Busy || prev._spin360Lock) prev._spin360PendingReset = true;
      else _spin360Reset(prev);
    }
    _spin360PrevIdx = -1;
    _spin360PrevGlyph = null;
  }

  // ---------------------------
  // PASS 1: compute intended targets + baseline pivot rotations/scales
  // (DO NOT solve collisions here)
  // ---------------------------
  for (const g of glyphs) {
    const f = g.hoverF || 0;

    const bx = (g.baseGroupX || 0) + (g.animOffsetX || 0);
    const by = (g.baseGroupY || 0) + (g.animOffsetY || 0);

    let brx = (g.baseRotX || 0) + (g.animRotX || 0);
    let bry = (g.baseRotY || 0) + (g.animRotY || 0);
    let brz = (g.baseRotZ || 0) + (g.animRotZ || 0);

    const bsx = (g.baseScaleX || 1) * (g.animScale || 1);
    const bsy = (g.baseScaleY || 1) * (g.animScale || 1);
    const bsz = g.baseScaleZ || 1;

    const c = { x: g.baseX || 0, y: g.baseGroupY || 0 };
    const dx = cursorLocal.x - c.x;
    const dy = cursorLocal.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    let tx = bx, ty = by;
    let rx = brx, ry = bry, rz = brz;
    let sx = bsx, sy = bsy, sz = bsz;

    if (hoverMode === "lift") {
      ty += lift * f;

    } else if (hoverMode === "rotate") {
      const ax = String(params.hoverRotateAxis || "z").toLowerCase();
      let pick = ax;
      if (pick === "random") pick = stablePickAxis(g.overlayIndex || 0, "random", true);
      if (pick === "x") rx += rot * f;
      else if (pick === "y") ry += rot * f;
      else rz += rot * f;

    } else if (hoverMode === "tilt") {
      const nx = dx / d, ny = dy / d;
      rx += -ny * tilt * f;
      ry += nx * tilt * f;

    } else if (hoverMode === "pulse") {
      const s = 1 + pulse * f;
      sx *= s;
      sy *= s;

    } else if (hoverMode === "repel") {
      const minD = Math.max(0.001, Number(params.repelMinDistance ?? 6));
      const amt = Number(params.repelAmount ?? 80);
      const cap = Number(params.repelClamp ?? 140);
      const dd = Math.max(d, minD);

      const nx = -dx / dd;
      const ny = -dy / dd;

      let push = amt * f;
      if (push > cap) push = cap;

      tx += nx * push;
      ty += ny * push;

    } else if (hoverMode === "spin360") {
      // still allow subtle lift for feel
      ty += lift * spin360Lift * f;

    } else if (hoverMode === "explode") {
      tx += (g._expX || 0) * explodeAmt * f;
      ty += (g._expY || 0) * explodeAmt * f;
      rz += (g._expX || 0) * explodeTwist * f;

      const s = 1 + (pulse * 0.9) * f;
      sx *= s; sy *= s;
      ty += lift * 0.25 * f;
    }

    if (sweepOn && sweepAmt > 0.0001) {
      const nx = dx / d, ny = dy / d;
      const tnx = -ny, tny = nx;

      const blend = clamp(sweepBias, 0, 2);
      const mx = lerp(tnx, nx, blend - 1);
      const my = lerp(tny, ny, blend - 1);

      tx += mx * sweepAmt * f;
      ty += my * sweepAmt * f * sweepYMix;
    }

    // store intended targets (for collision solver)
    g._tx = tx;
    g._ty = ty;

    // baseline pivot rotations (smoothed; slightly stiffer while spinning)
    const chaseRot = (g._spin360Busy || g._spin360Lock) ? Math.max(chase, 0.65) : chase;
    g.pivot.rotation.x = lerp(g.pivot.rotation.x, rx, chaseRot);
    g.pivot.rotation.y = lerp(g.pivot.rotation.y, ry, chaseRot);
    g.pivot.rotation.z = lerp(g.pivot.rotation.z, rz, chaseRot);

    // scale (safe to lerp here)
    g.group.scale.x = lerp(g.group.scale.x, sx, chase);
    g.group.scale.y = lerp(g.group.scale.y, sy, chase);
    g.group.scale.z = lerp(g.group.scale.z, sz, chase);

    // compute spin360 center-rotation targets and store for later pass
    const add = g._spin360Add || 0;

    let crx = g.baseRotCX || 0;
    let cry = g.baseRotCY || 0;
    let crz = g.baseRotCZ || 0;

    if (add !== 0) {
      let ax = spin360AxisBase;
      if (ax === "random") {
        ax = g._spin360Axis || (g._spin360Axis = stablePickAxis(g.overlayIndex || 0, "random", true));
      }
      if (ax === "x") crx += add;
      else if (ax === "y") cry += add;
      else crz += add;
    }

    g._crx = crx;
    g._cry = cry;
    g._crz = crz;
  }

  // ---------------------------
  // PASS 2: collisions ONCE (now that everyone has _tx/_ty)
  // ---------------------------
  _resolveCollisions2D(glyphs);

  // ---------------------------
  // PASS 3: crowd metric ONCE (after collisions)
  // ---------------------------
  computeCrowdMetric();

  // ---------------------------
  // PASS 4: apply spin360 rotation + apply final positions
  // ---------------------------
  for (const g of glyphs) {
    const chaseRot2 = (g._spin360Busy || g._spin360Lock) ? Math.max(chase, 0.65) : chase;

    g.rot.rotation.x = lerp(g.rot.rotation.x, g._crx || 0, chaseRot2);
    g.rot.rotation.y = lerp(g.rot.rotation.y, g._cry || 0, chaseRot2);
    g.rot.rotation.z = lerp(g.rot.rotation.z, g._crz || 0, chaseRot2);

    g.group.position.x = lerp(g.group.position.x, g._tx || 0, chase);
    g.group.position.y = lerp(g.group.position.y, g._ty || 0, chase);
  }

  // ---------------------------
  // PASS 5: Option D crowd visual cheats (Z + shrink + side fade)
  // ---------------------------
  if (params.crowdOn) {
    const zAmt = Number(params.crowdZAmount || 18);
    const alt = !!params.crowdZAlternate;
    const sm = clamp(Number(params.crowdZSmooth || 0.18), 0.001, 1);

    const shrinkAmt = clamp01(Number(params.crowdShrink || 0.06));
    const sideFadeAmt = clamp01(Number(params.crowdSideFade || 0.55));

    for (const g of glyphs) {
      const crowdF = clamp01(g._crowd || 0);

      // Z layering
      if (crowdF > 0.0001) {
        const sgn = alt ? stablePickSign(g.overlayIndex || 0, true) : 1;
        const targetZ = sgn * zAmt * crowdF;
g.crowdOffsetZ = lerp(g.crowdOffsetZ || 0, targetZ, sm);
        _updateDepth(g);
      } else {
g.crowdOffsetZ = lerp(g.crowdOffsetZ || 0, 0, sm);
        _updateDepth(g);
      }

      // micro-shrink (non-compounding feel; still subtle)
      if (shrinkAmt > 0.0001) {
        const s = 1 - shrinkAmt * crowdF;
        g.group.scale.x = lerp(g.group.scale.x, g.group.scale.x * s, 0.35);
        g.group.scale.y = lerp(g.group.scale.y, g.group.scale.y * s, 0.35);
      }

      // fade sidewalls
      if (g.mesh?.material && Array.isArray(g.mesh.material)) {
        const side = g.mesh.material[1];
        if (side) {
          side.transparent = true;
          const targetOp = 1 - sideFadeAmt * crowdF;
          side.opacity = lerp(side.opacity ?? 1, targetOp, 0.25);
          side.needsUpdate = true;
        }
      }
    }
  } else {
    // ensure side opacity returns if crowd is off
    for (const g of glyphs) {
      if (g.mesh?.material && Array.isArray(g.mesh.material)) {
        const side = g.mesh.material[1];
        if (side && side.opacity !== 1) {
          side.opacity = lerp(side.opacity ?? 1, 1, 0.25);
          side.needsUpdate = true;
        }
      }
    }
  }
}


// ---------------------------
// Idle wave + breathing
// ---------------------------
function applyIdleMotion() {
  if (!glyphs.length) return;
  const t = _fxTime;

  const breathOn = !!params.breathOn;
  const breathAmt = Math.max(0, Number(params.breathAmount || 0));
  const breathSpd = Math.max(0.0001, Number(params.breathSpeed || 0.55));
  const breathMul = breathOn ? 1 + breathAmt * Math.sin(t * (Math.PI * 2) * breathSpd) : 1;

  const waveOn = !!params.waveOn;
  const waveSpd = Math.max(0.0001, Number(params.waveSpeed || 0.55));
  const waveAmpY = Number(params.waveAmpY || 0);
  const waveRot = THREE.MathUtils.degToRad(Number(params.waveRotDeg || 0));
  const waveFreq = Number(params.waveFreq || 0.08);
  const waveBy = params.waveBy === "line" ? "line" : "x";

  for (const g of glyphs) {
    g._breathMul = breathMul;
    _updateDepth(g);

    if (!g.inner) continue;
    if (!waveOn) {
      g.inner.position.y = 0;
      g.inner.rotation.z = 0;
      continue;
    }

    const phaseBase = waveBy === "line" ? (g.lineIndex || 0) * 1.15 : (g.baseX || 0) * waveFreq;

    const w = Math.sin(phaseBase + t * (Math.PI * 2) * waveSpd);
    g.inner.position.y = waveAmpY * w;
    g.inner.rotation.z = waveRot * w;
  }

  _applyCharZOffsetsFromParams();
}

// ---------------------------
// Init + loop
// ---------------------------
function init() {
  applyLightingMode();
  resize();
  applyFontSelection();
}
init();

addEventListener("resize", resize);
renderer.domElement.style.touchAction = "none";
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerenter", onPointerEnter);
renderer.domElement.addEventListener("pointerleave", onPointerLeave);

function renderLoop() {
  raf = requestAnimationFrame(renderLoop);
  controls.update();

  _fxTime = performance.now() * 0.001;
  _fxDt = clamp(_fxTime - _fxPrevTime, 1 / 240, 1 / 20);
  _fxPrevTime = _fxTime;

  updateHoverEffects();
  applyIdleMotion();

  _applyGradientAnimation();
  _syncFXUniforms();

  renderer.render(scene, camera);
}
renderLoop();

// ---------------------------
// Cleanup
// ---------------------------
window[TOOL_KEY].cleanup = () => {
  try {
    delete window.__WF_3DTYPE_CORE_LOADED__;
  } catch (e) {}
  try {
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
  } catch (e) {}
  try {
    renderer.domElement.removeEventListener("pointerenter", onPointerEnter);
  } catch (e) {}
  try {
    renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
  } catch (e) {}
  try {
    if (tl) tl.kill();
  } catch (e) {}
  try {
    cancelAnimationFrame(raf);
  } catch (e) {}
  try {
    clearText();
  } catch (e) {}
  try {
    disposeIf(faceTex);
    disposeIf(sideTex);
    disposeIf(faceMat);
    disposeIf(sideMat);
  } catch (e) {}
  try {
    disposeIf(_bgTex);
  } catch (e) {}
  try {
    for (const m of _fxMats) {
      m.onBeforeCompile = null;
    }
    _fxMats.clear();
  } catch (e) {}
  try {
    renderer?.dispose?.();
  } catch (e) {}
  try {
    wrap.innerHTML = "";
  } catch (e) {}
  document.documentElement.style.overflow = prevOverflowHtml;
  document.body.style.overflow = prevOverflowBody;
};




















