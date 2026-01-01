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
  "Droid Sans Regular":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_regular.typeface.json",
  "Droid Sans Bold":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_bold.typeface.json",
  "Droid Serif Regular":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_regular.typeface.json",
  "Droid Serif Bold":
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_bold.typeface.json",
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
  hoverMode: "lift", // lift | rotate | tilt | pulse | repel | spin |  | explode | none
  proximityLift: true,
  proximityRadiusWorld: 140,
  proximityLiftAmount: 60,
  proximityFalloff: "smooth",
  cursorSmoothing: 0.85,
  liftSmoothing: 0.18,
  hoverRotateDeg: 20,
  hoverTiltDeg: 18,
  hoverPulse: 0.12,

  // Hover spin (existing “spin” mode)
  hoverSpinDeg: 120,
  hoverSpinAxis: "z", // x|y|z|random
  hoverSpinRandomDir: true,
  hoverSpinRandomAmount: false,
  hoverSpinAmountJitter: 0.35, // 0..1

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

// Keep older keys safe if they existed in saved params (no longer used)
ensureParam("hoverSpin360Boost", 0.018);
ensureParam("hoverSpin360MaxVel", 10.0);
ensureParam("hoverSpin360Damping", 7.5);

// New defaults (spin)
ensureParam("hoverSpinAxis", "z");
ensureParam("hoverSpinRandomDir", true);
ensureParam("hoverSpinRandomAmount", false);
ensureParam("hoverSpinAmountJitter", 0.35);

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

ensureParam("animExplodeShape", "burst"); // NEW
ensureParam("animExplodeRingAngle", 0); // NEW
ensureParam("animExplodeNoise", 0.15); // NEW
ensureParam("animExplodeZSpread", 0.0); // NEW

ensureParam("animExplodeAngleOffset", 0);
ensureParam("animExplodeZAmount", 0);
ensureParam("animExplodeRotDeg", 55);
ensureParam("animExplodeRotAxis", "z");
ensureParam("animExplodeRandomDir", true);

ensureParam("faceLetterColors", []);

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
  const width = bb.max.x - bb.min.x;
  const left = bb.min.x;
  shapeGeo.dispose();

  let geo = new THREE.ExtrudeGeometry(shapes, { depth: params.depth, bevelEnabled: false, steps: 1 });
  geo.translate(-left, 0, 0);
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

  return { width, mesh, stroke };
}

function applyExtrusionTransform(entry) {
  const d = entry.baseDepth;
  const sZ = entry.mesh.scale.z;
  entry.mesh.position.z = (d * sZ) / 2;
  if (entry.stroke) {
    entry.stroke.position.z = entry.mesh.position.z;
    entry.stroke.scale.z = entry.mesh.scale.z;
  }
}

function _updateDepth(entry) {
  const breath = entry._breathMul ?? 1;
  const zoff = entry.zOffset ?? 0;

  entry.mesh.scale.z = Math.max(0.0001, (entry.depthF ?? 1) * breath);
  applyExtrusionTransform(entry);

  entry.group.position.z = (entry.baseGroupZ ?? 0) + zoff + (entry.animOffsetZ || 0);
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

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === " ") {
        const sw = params.size * 0.35;
        entries.push({ space: true, width: sw });
        w += sw;
        continue;
      }
      const g = buildGlyph(ch);
      entries.push({ space: false, width: g.width, glyph: g });
      w += g.width;
      if (i !== chars.length - 1) w += params.charSpacing;
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

      const { mesh, stroke } = e.glyph;

      const group = new THREE.Group();
      group.position.set(x, y, 0);

      const inner = new THREE.Group();
      inner.add(mesh);
      if (params.strokeWidth > 0) inner.add(stroke);
      group.add(inner);

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
        group,
        inner,
        mesh,
        stroke,

        baseDepth: params.depth,

        baseGroupX: group.position.x,
        baseGroupY: group.position.y,
        baseGroupZ: group.position.z,
        baseRotX: group.rotation.x,
        baseRotY: group.rotation.y,
        baseRotZ: group.rotation.z,
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

    g.animOffsetX = 0;
    g.animOffsetY = 0;
    g.animOffsetZ = 0;
    g.animRotX = 0;
    g.animRotY = 0;
    g.animRotZ = 0;
    g.animScale = 1;

    g.group.rotation.x = g.baseRotX || 0;
    g.group.rotation.y = g.baseRotY || 0;
    g.group.rotation.z = g.baseRotZ || 0;
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
  const loop = !!params.animLoop;
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

  // Explode tuning (v14)
  const explodeAmt = Number(params.animExplodeAmount ?? 220);

  const exDX = Math.max(0.01, Number(params.animExplodeDiameterX ?? 1));
  const exDY = Math.max(0.01, Number(params.animExplodeDiameterY ?? 1));
  const exD = Math.max(0.0, Number(params.animExplodeDiameter ?? 1.0)); // master

  const exShape = String(params.animExplodeShape || "burst").toLowerCase();
  const exRingAng = THREE.MathUtils.degToRad(Number(params.animExplodeRingAngle ?? 0));
  const exNoise = clamp01(Number(params.animExplodeNoise ?? 0.15));

  const exAng = THREE.MathUtils.degToRad(Number(params.animExplodeAngleOffset ?? 0));
  const exZ = Number(params.animExplodeZAmount ?? 0);
  const exZSpread = Number(params.animExplodeZSpread ?? 0.0);

  const exRotAxisBase = String(params.animExplodeRotAxis || "z").toLowerCase();
  const exRotRad = THREE.MathUtils.degToRad(Number(params.animExplodeRotDeg ?? 55));
  const exRandDir = !!params.animExplodeRandomDir;

  function applyProxy(p) {
    for (const m of p.members) {
      let ox = 0,
        oy = 0,
        oz = 0;
      let arx = 0,
        ary = 0,
        arz = 0;
      let asc = 1;

      if (p.ex && p.ex !== 0) {
        // Stable base angle + field rotation
        const a0 = (m._expU || 0) + exAng;

        // Direction
        let dx = Math.cos(a0);
        let dy = Math.sin(a0);

        // Per-glyph noise on radius
        const n = 1 + (m._spinJitter || 0) * exNoise;

        // Ellipse scaling (with master diameter)
        let sx = exDX * exD * n;
        let sy = exDY * exD * n;

        // Z seed
        const zSeed = (m._expZ || 0);

        // Shape variants
        if (exShape === "ring") {
          // rotate direction around ring angle (independent control)
          const c = Math.cos(exRingAng),
            s = Math.sin(exRingAng);
          const rx2 = dx * c - dy * s;
          const ry2 = dx * s + dy * c;
          dx = rx2;
          dy = ry2;
          // ring stays on plane unless ZAmount explicitly used below
        } else if (exShape === "sphere") {
          // sphere adds extra Z spread (scaled by explodeAmt for predictable feel)
          oz += zSeed * (explodeAmt * exZSpread) * p.ex;
        } else if (exShape === "linex") {
          dx = Math.sign(dx || 1);
          dy = 0;
          sy = 0;
        } else if (exShape === "liney") {
          dx = 0;
          dy = Math.sign(dy || 1);
          sx = 0;
        } // burst default

        // Position offsets
        ox += dx * explodeAmt * sx * p.ex;
        oy += dy * explodeAmt * sy * p.ex;

        // Z scatter (optional, works for all shapes)
        oz += zSeed * exZ * p.ex;

        // per-char rotation on chosen/random axis
        let ax = exRotAxisBase;
        if (ax === "random") ax = stablePickAxis(m.overlayIndex || 0, "random", true);
        const dir = stablePickSign(m.overlayIndex || 0, exRandDir);
        const r = exRotRad * dir * p.ex;

        if (ax === "x") arx += r;
        else if (ax === "y") ary += r;
        else arz += r;
      }

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

      m.group.rotation.x = (m.baseRotX || 0) + m.animRotX;
      m.group.rotation.y = (m.baseRotY || 0) + m.animRotY;
      m.group.rotation.z = (m.baseRotZ || 0) + m.animRotZ;

      const bsx = m.baseScaleX || 1,
        bsy = m.baseScaleY || 1,
        bsz = m.baseScaleZ || 1;
      m.group.scale.set(bsx * m.animScale, bsy * m.animScale, bsz);

      m.depthF = typeof p.f === "number" ? p.f : 1;
      _updateDepth(m);

      // position offset is handled by hover system; we store anim offsets and apply in hover update
    }
  }

  for (const p of proxies) applyProxy(p);

  tl = gsap.timeline({ repeat: loop ? -1 : 0, yoyo: true });
  const preset = (params.animPreset || "depth").toLowerCase();
  const alsoDepth = preset === "depth" ? true : !!params.animAlsoDepth;

  const tweenVars = {
    duration,
    ease,
    stagger: { each: stagger, from: params.animStaggerFrom },
    onUpdate: () => {
      for (const p of proxies) applyProxy(p);
      _applyCharZOffsetsFromParams();
    },
  };

  for (const p of proxies) {
    p.f = alsoDepth ? minF : undefined;
    p.rx = 0;
    p.ry = 0;
    p.rz = 0;
    p.s = 1;
    p.ex = 0;
  }

  const axis = (params.animAxis || "y").toLowerCase();
  const depthTarget = maxF;

  if (preset === "depth") {
    tl.to(proxies, { ...tweenVars, f: depthTarget }, 0);
  } else if (preset === "twist") {
    const vars = { ...tweenVars };
    if (axis === "x") vars.rx = rotRad;
    else vars.ry = rotRad;
    if (alsoDepth) vars.f = depthTarget;
    tl.to(proxies, vars, 0);
  } else if (preset === "wobble") {
    const vars = { ...tweenVars, rz: rotRad };
    if (alsoDepth) vars.f = depthTarget;
    tl.to(proxies, vars, 0);
  } else if (preset === "inflate") {
    const vars = { ...tweenVars, s: 1 + inflateAmt };
    if (alsoDepth) vars.f = depthTarget;
    tl.to(proxies, vars, 0);
  } else if (preset === "spin") {
    const vars = { ...tweenVars };
    if (axis === "x") vars.rx = spinRad;
    else if (axis === "y") vars.ry = spinRad;
    else vars.rz = spinRad;
    if (alsoDepth) vars.f = depthTarget;
    tl.to(proxies, vars, 0);
  } else if (preset === "explode") {
    const vars = { ...tweenVars, ex: 1 };
    if (alsoDepth) vars.f = depthTarget;
    tl.to(proxies, vars, 0);
  } else {
    tl.to(proxies, { ...tweenVars, f: depthTarget }, 0);
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

let _hoveredGlyphIdx = -1;
let _spin360MissFrames = 0;
const SPIN360_MISS_FRAMES_BEFORE_RESET = 8; // ~8 frames = ~130ms @60fps
const SPIN360_RETRIGGER_COOLDOWN = 0.12; // seconds


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

  if (_hoveredGlyphIdx >= 0) {
    _spin360Reset(glyphs[_hoveredGlyphIdx]);
  }
  _hoveredGlyphIdx = -1;
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

  // speed -> duration (faster cursor => shorter duration)
  const sp = clamp(_cursorSpeed, 0, 2000);
  const dur = clamp(baseDur / (1 + sp * spScale), minDur, maxDur);

  let ax = String(params.hoverSpin360Axis || "z").toLowerCase();
  if (ax === "random") {
    if (!g._spin360Axis) g._spin360Axis = stablePickAxis(g.overlayIndex || 0, "random", true);
    ax = g._spin360Axis;
  }
  if (ax !== "x" && ax !== "y" && ax !== "z") ax = "z";

  const dir = stablePickSign(g.overlayIndex || 0, !!params.hoverSpin360RandomDir);
  const add = Math.PI * 2 * dir;

  // animate additive value, not rotation directly (so it layers with preset animation & hover lerp)
  const now = _fxTime || performance.now() * 0.001;

if (g._spin360Busy) return; // don’t retrigger mid-spin
if (g._spin360CooldownUntil && now < g._spin360CooldownUntil) return;

g._spin360Busy = true;

gsap.to(g, {
  _spin360Add: g._spin360Add + add,
  duration: dur,
  ease,
  overwrite: true,
  onComplete: () => {
    g._spin360Busy = false;
    g._spin360CooldownUntil = ( _fxTime || performance.now()*0.001 ) + SPIN360_RETRIGGER_COOLDOWN;

    if (Math.abs(g._spin360Add) > Math.PI * 50) {
      g._spin360Add = g._spin360Add % (Math.PI * 2);
    }
  },
});

}


function _spin360Reset(g) {
  if (!gsap || !g) return;
  if (!g._spin360Add) return;

  gsap.to(g, {
    _spin360Add: 0,
    duration: 0.35,
    ease: "power3.out",
    overwrite: true,
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

    const add = g._spin360Add || 0;
    let ax = spin360AxisBase;
    if (ax === "random")
      ax =
        g._spin360Axis || (g._spin360Axis = stablePickAxis(g.overlayIndex || 0, "random", true));
    if (add !== 0) {
      if (ax === "x") brx += add;
      else if (ax === "y") bry += add;
      else brz += add;
    }

    g.group.rotation.x = lerp(g.group.rotation.x, brx, chase);
    g.group.rotation.y = lerp(g.group.rotation.y, bry, chase);
    g.group.rotation.z = lerp(g.group.rotation.z, brz, chase);

    const bsx = (g.baseScaleX || 1) * (g.animScale || 1);
    const bsy = (g.baseScaleY || 1) * (g.animScale || 1);
    const bsz = g.baseScaleZ || 1;

    g.group.scale.x = lerp(g.group.scale.x, bsx, chase);
    g.group.scale.y = lerp(g.group.scale.y, bsy, chase);
    g.group.scale.z = lerp(g.group.scale.z, bsz, chase);
  }
}

function updateHoverEffects() {
  if (!glyphs.length || (params.hoverMode || "none") === "none") {
    resetHoverTransforms();
    _hoverStrength = 0;
    return;
  }
  if (!params.proximityLift) {
    resetHoverTransforms();
    _hoverStrength = 0;
    return;
  }
  if (!pointerActive) {
    resetHoverTransforms();
    _hoverStrength = 0;
    return;
  }

  if (getCursorLocalOnTextPlane(cursorLocalTarget)) {
    const ms = clamp(Number(params.cursorSmoothing || 0.85), 0, 0.98);
    const a = 1 - ms;
    _cursorDelta.copy(cursorLocalTarget).sub(cursorLocal);
    const maxStep = 40;
    const len = _cursorDelta.length();
    if (len > maxStep) _cursorDelta.multiplyScalar(maxStep / len);
    cursorLocal.addScaledVector(_cursorDelta, a);
  } else {
    resetHoverTransforms();
    _hoverStrength = 0;
    return;
  }

  // cursor speed (smoothed)
  const dist = cursorLocal.distanceTo(_prevCursorLocal);
  const inst = dist / Math.max(1e-6, _fxDt);
  _cursorSpeed = lerp(_cursorSpeed, inst, 0.22);
  _prevCursorLocal.copy(cursorLocal);

  const r = Math.max(1e-6, Number(params.proximityRadiusWorld || 140));
  const invR = 1 / r;
  const chase = clamp(Number(params.liftSmoothing || 0.18), 0.001, 1);
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

  // Spin (simple)
  const spinBaseRad = THREE.MathUtils.degToRad(Number(params.hoverSpinDeg ?? 120));
  const spinAxisBase = String(params.hoverSpinAxis || "z").toLowerCase();
  const spinRandDir = !!params.hoverSpinRandomDir;
  const spinRandAmt = !!params.hoverSpinRandomAmount;
  const spinJit = clamp01(Number(params.hoverSpinAmountJitter ?? 0.35));

  // Explode (hover)
  const explodeAmt = Number(params.hoverExplodeAmount ?? 120);
  const explodeTwist = THREE.MathUtils.degToRad(Number(params.hoverExplodeTwistDeg ?? 35));

  // Spin360 (fixed)
  const spin360AxisBase = String(params.hoverSpin360Axis || "random").toLowerCase();
  const minHoverF = clamp01(Number(params.hoverSpin360MinHoverF ?? 0.2));
  const spin360Lift = clamp01(Number(params.hoverSpin360Lift ?? 0.12));

  let maxF = 0;

  for (const g of glyphs) {
    const c = { x: g.baseX || 0, y: g.baseGroupY || 0 };
    const dx = cursorLocal.x - c.x,
      dy = cursorLocal.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const u = d < r ? 1 - d * invR : 0;
    g.hoverF = falloff(u, mode);
    maxF = Math.max(maxF, g.hoverF);
  }
  _hoverStrength = maxF;

// Spin360: trigger ONLY on actual mesh hover enter (raycast)
if (hoverMode === "spin360") {
  const idx = _raycastGlyphIndexUnderCursor();
  const allowed = _hoverStrength >= minHoverF;

  if (allowed && idx >= 0) {
    _spin360MissFrames = 0;

    if (idx !== _hoveredGlyphIdx) {
      if (_hoveredGlyphIdx >= 0) _spin360Reset(glyphs[_hoveredGlyphIdx]);
      _hoveredGlyphIdx = idx;
      _spin360Trigger(glyphs[idx]);
    }
  } else {
    // don’t instantly reset; require consecutive misses
    _spin360MissFrames++;

    if (_spin360MissFrames >= SPIN360_MISS_FRAMES_BEFORE_RESET) {
      if (_hoveredGlyphIdx >= 0) _spin360Reset(glyphs[_hoveredGlyphIdx]);
      _hoveredGlyphIdx = -1;
      _spin360MissFrames = 0;
    }
  }
} else {
  // not in spin360 mode -> ensure state clears
  _spin360MissFrames = 0;

  if (_hoveredGlyphIdx >= 0) _spin360Reset(glyphs[_hoveredGlyphIdx]);
  _hoveredGlyphIdx = -1;
}


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
    const dx = cursorLocal.x - c.x,
      dy = cursorLocal.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    let tx = bx,
      ty = by;
    let rx = brx,
      ry = bry,
      rz = brz;
    let sx = bsx,
      sy = bsy,
      sz = bsz;

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
      const nx = dx / d,
        ny = dy / d;
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
    } else if (hoverMode === "spin") {
      let ax = spinAxisBase;
      if (ax === "random") ax = stablePickAxis(g.overlayIndex || 0, "random", true);

      const dir = stablePickSign(g.overlayIndex || 0, spinRandDir);
      let amt = spinBaseRad;

      if (spinRandAmt) {
        const j = g._spinJitter || 0;
        amt = spinBaseRad * (1 + j * spinJit);
      }

      const sgnAmt = amt * dir;
      if (ax === "x") rx += sgnAmt * f;
      else if (ax === "y") ry += sgnAmt * f;
      else rz += sgnAmt * f;

      const s = 1 + (pulse * 0.6) * f;
      sx *= s;
      sy *= s;
    } else if (hoverMode === "spin360") {
      // In spin360 mode we still allow subtle lift + sweep for feel
      ty += lift * spin360Lift * f;
    } else if (hoverMode === "explode") {
      // hover explode
      tx += (g._expX || 0) * explodeAmt * f;
      ty += (g._expY || 0) * explodeAmt * f;
      rz += (g._expX || 0) * explodeTwist * f;
      const s = 1 + (pulse * 0.9) * f;
      sx *= s;
      sy *= s;
      ty += lift * 0.25 * f;
    }

    // Apply additive spin360 rotation ALWAYS
    const add = g._spin360Add || 0;
    if (add !== 0) {
      let ax = spin360AxisBase;
      if (ax === "random")
        ax =
          g._spin360Axis || (g._spin360Axis = stablePickAxis(g.overlayIndex || 0, "random", true));
      if (ax === "x") rx += add;
      else if (ax === "y") ry += add;
      else rz += add;
    }

    if (sweepOn && sweepAmt > 0.0001) {
      const nx = dx / d,
        ny = dy / d;
      const tnx = -ny,
        tny = nx;
      const blend = clamp(sweepBias, 0, 2);
      const mx = lerp(tnx, nx, blend - 1);
      const my = lerp(tny, ny, blend - 1);
      tx += mx * sweepAmt * f;
      ty += my * sweepAmt * f * sweepYMix;
    }

    g.group.position.x = lerp(g.group.position.x, tx, chase);
    g.group.position.y = lerp(g.group.position.y, ty, chase);

    g.group.rotation.x = lerp(g.group.rotation.x, rx, chase);
    g.group.rotation.y = lerp(g.group.rotation.y, ry, chase);
    g.group.rotation.z = lerp(g.group.rotation.z, rz, chase);

    g.group.scale.x = lerp(g.group.scale.x, sx, chase);
    g.group.scale.y = lerp(g.group.scale.y, sy, chase);
    g.group.scale.z = lerp(g.group.scale.z, sz, chase);
  }
}
window.updateHoverEffects = updateHoverEffects;

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

function loop() {
  raf = requestAnimationFrame(loop);
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
loop();

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





