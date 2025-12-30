// wf-3dtype-core.js
// IMPORTANT: this file is a module. Load with <script type="module" src="..."></script>

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js";
import { LineSegments2 } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineMaterial.js";

const gsap = window.gsap;

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
  "Helvetiker Regular": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json",
  "Helvetiker Bold":    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json",
  "Optimer Regular":    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_regular.typeface.json",
  "Optimer Bold":       "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_bold.typeface.json",
  "Gentilis Regular":   "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_regular.typeface.json",
  "Gentilis Bold":      "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_bold.typeface.json",
  "Droid Sans Regular": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_regular.typeface.json",
  "Droid Sans Bold":    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_sans_bold.typeface.json",
  "Droid Serif Regular":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_regular.typeface.json",
  "Droid Serif Bold":   "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_bold.typeface.json",
};
window.FONT_PRESETS = FONT_PRESETS;

// ---------------------------
// Params
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

  // (compat)
  bg: "#111111",

  // Background modes
  bgMode: "solid", // solid | gradient | checker
  bgSolid: "#111111",
  bgGradA: "#101018",
  bgGradB: "#1a0f24",
  bgGradAngle: 35,
  bgGradSoft: 0.65,

  bgCheckerType: "checker", // checker | grid | micro
  bgCheckerScale: 48,
  bgCheckerLine: 6,
  bgCheckerRound: 0,
  bgCheckerRotate: 0,
  bgCheckerJitter: 0,
  bgCheckerContrast: 0.22,
  bgCheckerOpacity: 1.0,
  bgCheckerColorA: "#0e0e12",
  bgCheckerColorB: "#161623",

  // Face Fill (solid | gradient | checker)
  faceMode: "gradient",
  faceUVSpace: "glyph", // glyph | world
  faceSolid: "#ff0000",
  faceGradA: "#ff0055",
  faceGradB: "#00ffcc",
  faceGradC: "#0044ff",
  faceStopA: 0,
  faceStopB: 0.5,
  faceStopC: 1,
  faceGradDir: "horizontal",

  // Face Checker controls
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

  // GSAP animation
  animPreset: "depth", // depth|twist|wobble|inflate|spin|explode|cylinder
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

  // NEW: Spin preset
  animSpinAxis: "y",      // x|y|z
  animSpinDeg: 180,       // degrees

  // NEW: Explode preset
  animExplodeOrigin: "center", // center|word|line
  animExplodeMode: "radial",   // radial|swirl|random|up|down|left|right
  animExplodeAmount: 55,
  animExplodeRotDeg: 45,
  animExplodeAxis: "z",        // x|y|z|random
  animExplodeRandPos: 0.35,
  animExplodeRandRot: 0.6,

  // NEW: Cylinder preset
  animCylRadius: 240,
  animCylWrapDeg: 260,
  animCylRotateDeg: 220,
  animCylFaceOut: true,
  animCylTwistDeg: 0,

  // Hover
  hoverMode: "lift", // lift|rotate|tilt|pulse|repel|spin|explode|none
  proximityLift: true,
  proximityRadiusWorld: 140,
  proximityLiftAmount: 60,
  proximityFalloff: "smooth",
  cursorSmoothing: 0.85,
  liftSmoothing: 0.18,
  hoverRotateDeg: 20,
  hoverTiltDeg: 18,
  hoverPulse: 0.12,

  // Repel
  repelAmount: 80,
  repelMinDistance: 6,
  repelClamp: 140,

  // NEW: Hover spin
  hoverSpinAxis: "random", // x|y|z|random
  hoverSpinDeg: 55,

  // NEW: Hover explode
  hoverExplodeOrigin: "center", // center|word|line
  hoverExplodeMode: "radial",
  hoverExplodeAmount: 35,
  hoverExplodeRotDeg: 28,
  hoverExplodeAxis: "z",        // x|y|z|random
  hoverExplodeRandPos: 0.45,
  hoverExplodeRandRot: 0.7,

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

window.params = params;

// ---------------------------
// Utils
// ---------------------------
const ASPECTS = { "1:1":[1,1], "4:5":[4,5], "9:16":[9,16], "9:18":[9,18], "16:9":[16,9] };
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const clamp01 = v => clamp(Number(v),0,1);
const smoothstep01 = x => { x = clamp(x,0,1); return x*x*(3-2*x); };
const falloff = (u,mode)=>{
  u = clamp(u,0,1);
  if(mode==="quadratic") return u*u;
  if(mode==="smooth") return smoothstep01(u);
  return u;
};
const srgbColor = hex => new THREE.Color(hex).convertSRGBToLinear();
const disposeIf = o => { try{o?.dispose?.()}catch(e){} };
const fixStops = (a,b,c)=>{
  a=clamp01(a); b=clamp01(b); c=clamp01(c);
  if(b<a) b=a; if(c<b) c=b;
  const eps=0.001;
  if(b-a<eps) b=Math.min(1,a+eps);
  if(c-b<eps) c=Math.min(1,b+eps);
  return {a,b,c};
};

// deterministic per-glyph randoms (stable across rebuilds)
function hash1(n){
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function hashSigned(n){ return hash1(n) * 2 - 1; }

// ---------------------------
// Three core
// ---------------------------
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.sortObjects = true;
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 8000);
camera.position.set(0,140,520);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = true;

const lightsGroup = new THREE.Group(); scene.add(lightsGroup);
const textGroup   = new THREE.Group(); scene.add(textGroup);

const fontLoader = new FontLoader();
let font = null;

let raf = 0, tl = null;
const frame = { maxDim: 1 };
let glyphs = [], wordGroups = [], lineGroups = [];

let faceTex = null, sideTex = null, faceMat = null, sideMat = null;
let _bgTex = null;

let _fxTime = 0;
const _fxMats = new Set();

// heat hover
const _hoverWorld = new THREE.Vector3(0,0,0);
let _hoverStrength = 0;

// explode/cylinder caches (recomputed each build)
let _centers = {
  global: { x: 0, y: 0 },
  words: [],
  lines: [],
  minX: 0,
  maxX: 1,
};

// ---------------------------
// Hover plane / raycast (DECLARE ONCE)
// ---------------------------
const _raycaster = new THREE.Raycaster();
const _hit = new THREE.Vector3();
const _stablePlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
const _stableNormalW = new THREE.Vector3(0,0,1);
const _stablePointW  = new THREE.Vector3(0,0,0);

function _refreshStablePlane(){
  textGroup.updateMatrixWorld(true);
  _stableNormalW
    .set(0,0,1)
    .applyQuaternion(textGroup.getWorldQuaternion(new THREE.Quaternion()))
    .normalize();
  textGroup.getWorldPosition(_stablePointW);
  _stablePlane.setFromNormalAndCoplanarPoint(_stableNormalW, _stablePointW);
}

// ---------------------------
// Background texture
// ---------------------------
function makeBackgroundTexture(){
  const size = 1024;
  const cv = document.createElement("canvas");
  cv.width = size; cv.height = size;
  const ctx = cv.getContext("2d");

  const mode = (params.bgMode || "solid").toLowerCase();

  if(mode === "solid"){
    ctx.fillStyle = params.bgSolid || params.bg || "#111";
    ctx.fillRect(0,0,size,size);
  }

  if(mode === "gradient"){
    const a = params.bgGradA || "#111";
    const b = params.bgGradB || "#222";
    const ang = (Number(params.bgGradAngle||0) * Math.PI)/180;

    const cx=size/2, cy=size/2;
    const dx=Math.cos(ang), dy=Math.sin(ang);
    const len=Math.sqrt(dx*dx+dy*dy) || 1;

    const x0 = cx - (dx/len) * size*0.6;
    const y0 = cy - (dy/len) * size*0.6;
    const x1 = cx + (dx/len) * size*0.6;
    const y1 = cy + (dy/len) * size*0.6;

    const g = ctx.createLinearGradient(x0,y0,x1,y1);
    const soft = clamp01(Number(params.bgGradSoft ?? 0.65));
    g.addColorStop(0.0, a);
    g.addColorStop(soft, a);
    g.addColorStop(1.0-soft, b);
    g.addColorStop(1.0, b);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);
  }

  if(mode === "checker"){
    const type = params.bgCheckerType || "checker";
    const scale = Math.max(4, Number(params.bgCheckerScale || 48));
    const line  = Math.max(1, Number(params.bgCheckerLine || 6));
    const round = clamp(Number(params.bgCheckerRound||0), 0, 0.45);
    const rot   = (Number(params.bgCheckerRotate||0) * Math.PI)/180;
    const jitter = clamp01(Number(params.bgCheckerJitter||0));
    const contrast = clamp01(Number(params.bgCheckerContrast||0.22));
    const opacity  = clamp01(Number(params.bgCheckerOpacity ?? 1));

    const colA = params.bgCheckerColorA || "#0f0f14";
    const colB = params.bgCheckerColorB || "#191924";

    ctx.globalAlpha = opacity;
    ctx.fillStyle = colA;
    ctx.fillRect(0,0,size,size);

    ctx.save();
    ctx.translate(size/2, size/2);
    ctx.rotate(rot);
    ctx.translate(-size/2, -size/2);

    function rr(x,y,w,h,r){
      const rad = Math.min(w,h)*r;
      ctx.beginPath();
      ctx.moveTo(x+rad,y);
      ctx.arcTo(x+w,y,x+w,y+h,rad);
      ctx.arcTo(x+w,y+h,x,y+h,rad);
      ctx.arcTo(x,y+h,x,y,rad);
      ctx.arcTo(x,y,x+w,y,rad);
      ctx.closePath();
    }
    function j(){
      if(jitter<=0) return 0;
      return (Math.random()*2-1) * jitter * scale * 0.15;
    }

    ctx.fillStyle = colB;

    if(type === "checker"){
      const step = scale;
      for(let y=-step; y<size+step; y+=step){
        for(let x=-step; x<size+step; x+=step){
          const ix = Math.floor(x/step);
          const iy = Math.floor(y/step);
          if((ix+iy) % 2 === 0) continue;
          rr(x+j(), y+j(), step, step, round);
          ctx.fill();
        }
      }
    }

    if(type === "grid"){
      ctx.globalAlpha = opacity * contrast;
      ctx.fillStyle = colB;
      const step = scale;
      for(let x=-step; x<size+step; x+=step){
        rr(x+j(), -step, line, size+step*2, round);
        ctx.fill();
      }
      for(let y=-step; y<size+step; y+=step){
        rr(-step, y+j(), size+step*2, line, round);
        ctx.fill();
      }
    }

    if(type === "micro"){
      const step = Math.max(8, scale*0.5);
      ctx.globalAlpha = opacity * contrast;
      ctx.fillStyle = colB;
      for(let x=-step; x<size+step; x+=step){
        rr(x, -step, Math.max(1, line*0.5), size+step*2, round);
        ctx.fill();
      }
      for(let y=-step; y<size+step; y+=step){
        rr(-step, y, size+step*2, Math.max(1, line*0.5), round);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    if(contrast < 1){
      ctx.globalAlpha = (1-contrast) * 0.35;
      ctx.fillStyle = colA;
      ctx.fillRect(0,0,size,size);
      ctx.globalAlpha = 1;
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1,1);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function rebuildBackground(){
  disposeIf(_bgTex);
  _bgTex = makeBackgroundTexture();
  scene.background = _bgTex;
}
window.rebuildBackground = rebuildBackground;

// ---------------------------
// Face checker texture
// ---------------------------
function makeFaceCheckerTexture(){
  const size = 1024;
  const cv = document.createElement("canvas");
  cv.width=size; cv.height=size;
  const ctx = cv.getContext("2d");

  const scale = Math.max(4, Number(params.faceChkScale ?? 42));
  const lineW = Math.max(0, Number(params.faceChkLineWidth ?? 3));
  const rotDeg = Number(params.faceChkRotate ?? 0);
  const colA = params.faceChkColorA || "#0e0e12";
  const colB = params.faceChkColorB || "#161623";
  const lineCol = params.faceChkLineColor || "#ffffff";

  ctx.fillStyle = colA;
  ctx.fillRect(0,0,size,size);

  const rot = (rotDeg * Math.PI)/180;
  ctx.save();
  ctx.translate(size/2,size/2);
  ctx.rotate(rot);
  ctx.translate(-size/2,-size/2);

  ctx.fillStyle = colB;
  for(let y=-scale; y<size+scale; y+=scale){
    for(let x=-scale; x<size+scale; x+=scale){
      const ix = Math.floor(x/scale);
      const iy = Math.floor(y/scale);
      if((ix+iy) % 2 === 0) continue;
      ctx.fillRect(x,y,scale,scale);
    }
  }

  if(lineW > 0){
    ctx.lineWidth = lineW;
    ctx.strokeStyle = lineCol;
    ctx.beginPath();
    for(let x=-scale; x<=size+scale; x+=scale){
      ctx.moveTo(x, -scale);
      ctx.lineTo(x, size+scale);
    }
    for(let y=-scale; y<=size+scale; y+=scale){
      ctx.moveTo(-scale, y);
      ctx.lineTo(size+scale, y);
    }
    ctx.stroke();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1,1);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------
// FX shader hook (unchanged)
// ---------------------------
const _hash21=`float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}`;
const _noise=`float noise2(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash21(i),b=hash21(i+vec2(1,0)),c=hash21(i+vec2(0,1)),d=hash21(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}`;

function _applyFX(mat,isFace){
  if(!mat) return;
  mat.userData ||= {};
  if(mat.userData._fxApplied) return;
  mat.userData._fxApplied = 1;

  mat.customProgramCacheKey = ()=>`fx_v8_${isFace?1:0}`;

  mat.onBeforeCompile = (s)=>{
    s.uniforms.uTime={value:0};
    s.uniforms.uIsFace={value:isFace?1:0};

    s.uniforms.uHalftoneTarget={value:0};
    s.uniforms.uGrainTarget={value:0};

    s.uniforms.uFaceBright={value:1};
    s.uniforms.uSideBright={value:1};

    s.uniforms.uHalftoneOn={value:0};
    s.uniforms.uHalftoneScale={value:90};
    s.uniforms.uHalftoneAngle={value:25};
    s.uniforms.uHalftoneStrength={value:.6};
    s.uniforms.uHalftoneSoftness={value:.15};

    s.uniforms.uGrainOn={value:0};
    s.uniforms.uGrainAmount={value:.12};
    s.uniforms.uGrainScale={value:220};
    s.uniforms.uGrainSpeed={value:.35};

    // Heat bloom
    s.uniforms.uHeatOn={value:0};
    s.uniforms.uHeatPos={value:new THREE.Vector3(0,0,0)};
    s.uniforms.uHeatRadius={value:160};
    s.uniforms.uHeatSoft={value:.35};
    s.uniforms.uHeatStrength={value:0};
    s.uniforms.uHeatBright={value:.55};
    s.uniforms.uHeatGrainBoost={value:1.25};
    s.uniforms.uHeatHalfBoost={value:1.0};

    if(!s.vertexShader.includes("varying vec3 vWorldPos;")){
      s.vertexShader = s.vertexShader
        .replace("#include <common>", `#include <common>\nvarying vec3 vWorldPos;`)
        .replace("#include <begin_vertex>", `#include <begin_vertex>\nvec4 wp=modelMatrix*vec4(position,1.0);\nvWorldPos=wp.xyz;`);
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
    if(!s.fragmentShader.includes("varying vec3 vWorldPos;")){
      s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\n${commonInject}`);
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
    if(s.fragmentShader.includes("#include <dithering_fragment>")){
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

function _syncFXUniforms(){
  const halfT = (params.halftoneTarget==="face")?1:(params.halftoneTarget==="side")?2:0;
  const grainT = (params.grainTarget==="face")?1:(params.grainTarget==="side")?2:0;

  const faceB = Number(params.faceBright ?? 1);
  const sideB = Number(params.sideBright ?? 1);

  const heatOn = params.heatBloomOn ? 1 : 0;

  for(const m of _fxMats){
    const u = m.userData?._fxUniforms;
    if(!u) continue;

    u.uTime.value = _fxTime;
    u.uHalftoneTarget.value = halfT;
    u.uGrainTarget.value = grainT;

    u.uFaceBright.value = faceB;
    u.uSideBright.value = sideB;

    u.uHalftoneOn.value = params.halftoneOn ? 1 : 0;
    u.uHalftoneScale.value = Number(params.halftoneScale||90);
    u.uHalftoneAngle.value = Number(params.halftoneAngle||25);
    u.uHalftoneStrength.value = Number(params.halftoneStrength||0);
    u.uHalftoneSoftness.value = Number(params.halftoneSoftness||.15);

    u.uGrainOn.value = params.grainOn ? 1 : 0;
    u.uGrainAmount.value = Number(params.grainAmount||0);
    u.uGrainScale.value = Number(params.grainScale||220);
    u.uGrainSpeed.value = Number(params.grainSpeed||.35);

    u.uHeatOn.value = heatOn;
    u.uHeatPos.value.copy(_hoverWorld);
    u.uHeatRadius.value = Number(params.heatRadiusWorld||160);
    u.uHeatSoft.value = clamp01(Number(params.heatSoftness ?? 0.35));
    u.uHeatStrength.value = clamp01(_hoverStrength);
    u.uHeatBright.value = Number(params.heatBrightBoost||0);
    u.uHeatGrainBoost.value = Number(params.heatGrainBoost||0);
    u.uHeatHalfBoost.value = Number(params.heatHalfBoost||0);
  }
}
window._syncFXUniforms = _syncFXUniforms;

// ---------------------------
// Gradient animation
// ---------------------------
function _animateTex(tex, speed, angleDeg, phase=0){
  if(!tex) return;
  const sp = Number(speed||0);
  if(sp === 0) return;

  const ang = THREE.MathUtils.degToRad(Number(angleDeg||0));
  const dx = Math.cos(ang) * sp;
  const dy = Math.sin(ang) * sp;

  const ox = (dx * _fxTime + phase) % 1;
  const oy = (dy * _fxTime + phase) % 1;
  tex.offset.set(ox, oy);
}
function _applyGradientAnimation(){
  if(params.faceGradAnimOn && faceTex && params.faceMode==="gradient"){
    _animateTex(faceTex, params.faceGradSpeed, params.faceGradAngle, 0.0);
  }
  if(params.sideGradAnimOn && sideTex && params.sideMode==="gradient"){
    _animateTex(sideTex, params.sideGradSpeed, params.sideGradAngle, 0.17);
  }
}

function makeGradientTexture3(a,sa,b,sb,c,sc,dir){
  const size=512;
  const cv=document.createElement("canvas");
  cv.width=size; cv.height=size;
  const ctx=cv.getContext("2d");

  let x0=0,y0=0,x1=0,y1=size;
  if(dir==="horizontal"){ x1=size; y1=0; }
  if(dir==="diagonal"){ x0=0; y0=size; x1=size; y1=0; }

  const s=fixStops(sa,sb,sc);
  const g=ctx.createLinearGradient(x0,y0,x1,y1);
  g.addColorStop(s.a,a);
  g.addColorStop(s.b,b);
  g.addColorStop(s.c,c);

  ctx.fillStyle=g;
  ctx.fillRect(0,0,size,size);

  const tex=new THREE.CanvasTexture(cv);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(1,1);
  tex.offset.set(0,0);
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.needsUpdate=true;
  return tex;
}

// ---------------------------
// Sizing
// ---------------------------
function applyCanvasSizing(){
  if(params.aspect==="free"){
    wrap.style.width="100vw";
    wrap.style.height="100vh";
    wrap.style.position="absolute";
    wrap.style.left="0";
    wrap.style.top="0";
    wrap.style.transform="none";
    return;
  }
  const m=Math.max(0,Number(params.margin||0));
  const availW=Math.max(320,innerWidth-m*2);
  const availH=Math.max(320,innerHeight-m*2);
  const [rw,rh]=ASPECTS[params.aspect]||[1,1];

  let w=availW;
  let h=Math.round(w*(rh/rw));
  if(h>availH){ h=availH; w=Math.round(h*(rw/rh)); }

  wrap.style.width=w+"px";
  wrap.style.height=h+"px";
  wrap.style.position="absolute";
  wrap.style.left="50%";
  wrap.style.top="50%";
  wrap.style.transform="translate(-50%,-50%)";
}

function resize(){
  applyCanvasSizing();
  const w=wrap.clientWidth, h=wrap.clientHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  textGroup.traverse(o=>{ if(o?.material?.isLineMaterial) o.material.resolution.set(w,h); });
}
window.resize = resize;

// ---------------------------
// Materials (with face checker)
// ---------------------------
function rebuildFillMaterials(){
  for(const m of _fxMats){ try{ m.userData._fxUniforms=null; }catch(e){} }
  _fxMats.clear();

  disposeIf(faceTex); disposeIf(sideTex);
  disposeIf(faceMat); disposeIf(sideMat);

  // FACE
  if(params.faceMode==="gradient"){
    faceTex = makeGradientTexture3(
      params.faceGradA,params.faceStopA,
      params.faceGradB,params.faceStopB,
      params.faceGradC,params.faceStopC,
      params.faceGradDir
    );
  }else if(params.faceMode==="checker"){
    faceTex = makeFaceCheckerTexture();
  }else{
    faceTex = null;
  }

  // SIDE
  sideTex = (params.sideMode==="gradient")
    ? makeGradientTexture3(
        params.sideGradA,params.sideStopA,
        params.sideGradB,params.sideStopB,
        params.sideGradC,params.sideStopC,
        params.sideGradDir
      )
    : null;

  const faceCommon = { map: faceTex||null, color: faceTex ? new THREE.Color(0xffffff) : srgbColor(params.faceSolid) };
  const sideCommon = { map: sideTex||null, color: sideTex ? new THREE.Color(0xffffff) : srgbColor(params.sideSolid) };

  if(params.lightingMode==="accurate"){
    faceMat = new THREE.MeshBasicMaterial(faceCommon);
    sideMat = new THREE.MeshStandardMaterial({ ...sideCommon, metalness:0, roughness:.9 });
  }else{
    faceMat = new THREE.MeshStandardMaterial({ ...faceCommon, metalness:.05, roughness:.45 });
    sideMat = new THREE.MeshStandardMaterial({ ...sideCommon, metalness:.05, roughness:.55 });
  }

  if(faceMat.map) faceMat.map.flipY=false;
  if(sideMat.map) sideMat.map.flipY=false;

  faceMat.userData = {};
  sideMat.userData = {};

  _applyFX(faceMat,true);
  _applyFX(sideMat,false);

  faceMat.needsUpdate = true;
  sideMat.needsUpdate = true;
}
window.rebuildFillMaterials = rebuildFillMaterials;

// ---------------------------
// Lighting
// ---------------------------
function applyLightingMode(){
  while(lightsGroup.children.length) lightsGroup.remove(lightsGroup.children[0]);

  if(params.lightingMode==="accurate"){
    lightsGroup.add(new THREE.AmbientLight(0xffffff,1.25));
    const key=new THREE.DirectionalLight(0xffffff,.25);
    key.position.set(0,1,1);
    lightsGroup.add(key);
  }else{
    lightsGroup.add(new THREE.AmbientLight(0xffffff,.65));
    const key=new THREE.DirectionalLight(0xffffff,.95); key.position.set(300,450,250); lightsGroup.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,.25); fill.position.set(-300,120,-250); lightsGroup.add(fill);
  }

  rebuildFillMaterials();
  rebuildBackground();
}
window.applyLightingMode = applyLightingMode;

// ---------------------------
// Stroke
// ---------------------------
function createStrokeMaterial(){
  const m=new LineMaterial({ color:0x000000, linewidth:Number(params.strokeWidth||2) });
  m.transparent=true;
  m.depthWrite=false;
  m.depthTest=!params.overlayMode;
  m.polygonOffset=true;
  m.polygonOffsetFactor=-1;
  m.polygonOffsetUnits=-1;
  m.color.set(srgbColor(params.stroke));
  m.resolution.set(wrap.clientWidth, wrap.clientHeight);
  return m;
}

function filterEdgesToFrontBackFaces(posArray, depth, eps=1e-4){
  const out=[];
  for(let i=0;i<posArray.length;i+=6){
    const z1=posArray[i+2], z2=posArray[i+5];
    const onBack=(Math.abs(z1-0)<eps)&&(Math.abs(z2-0)<eps);
    const onFront=(Math.abs(z1-depth)<eps)&&(Math.abs(z2-depth)<eps);
    if(onBack||onFront) out.push(...posArray.slice(i,i+6));
  }
  return out;
}

// ---------------------------
// Clear
// ---------------------------
function clearText(){
  if(tl){ tl.kill(); tl=null; }

  textGroup.traverse(o=>{
    if(!o) return;

    if(o.isMesh){
      o.geometry?.dispose?.();
      if(Array.isArray(o.material)){
        const side=o.material[1];
        if(side && side!==sideMat) side.dispose?.();
      }
      if(o.material && o.material!==faceMat && o.material!==sideMat) o.material?.dispose?.();
    }
    if(o.type==="LineSegments2" || o.isLineSegments2){
      o.geometry?.dispose?.();
      o.material?.dispose?.();
    }
  });

  textGroup.clear();
  glyphs=[]; wordGroups=[]; lineGroups=[];
}
window.clearText = clearText;

// ---------------------------
// UVs
// ---------------------------
function writeUVsNonIndexed_Local(geo, depth){
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const bb=geo.boundingBox;
  const minX=bb.min.x, minY=bb.min.y;
  const rangeX=Math.max(1e-6, bb.max.x-bb.min.x);
  const rangeY=Math.max(1e-6, bb.max.y-bb.min.y);

  const useXForSideU = rangeX >= rangeY;
  const d = Math.max(1e-6, depth);

  const pos=geo.attributes.position;
  const nrm=geo.attributes.normal;

  const uv=new Float32Array(pos.count*2);

  for(let i=0;i<pos.count;i+=3){
    const nz=nrm.getZ(i);
    const isCap=Math.abs(nz)>.9;

    for(let k=0;k<3;k++){
      const vi=i+k;
      const x=pos.getX(vi), y=pos.getY(vi), z=pos.getZ(vi);

      let u,v;
      if(isCap){
        u=(x-minX)/rangeX; v=(y-minY)/rangeY;
      }else{
        u=useXForSideU ? ((x-minX)/rangeX) : ((y-minY)/rangeY);
        v=z/d;
      }
      uv[vi*2]=clamp(u,0,1);
      uv[vi*2+1]=clamp(v,0,1);
    }
  }

  geo.setAttribute("uv", new THREE.BufferAttribute(uv,2));
  geo.attributes.uv.needsUpdate=true;
}

function applyWorldUVsNonIndexed(meshes, depth, faceWorld, sideWorld){
  if(!faceWorld && !sideWorld) return;

  textGroup.updateMatrixWorld(true);

  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  const v=new THREE.Vector3();
  const corners=Array.from({length:8},()=>new THREE.Vector3());

  for(const mesh of meshes){
    const geo=mesh.geometry;
    geo.computeBoundingBox();
    const bb=geo.boundingBox;

    corners[0].set(bb.min.x,bb.min.y,bb.min.z);
    corners[1].set(bb.max.x,bb.min.y,bb.min.z);
    corners[2].set(bb.min.x,bb.max.y,bb.min.z);
    corners[3].set(bb.max.x,bb.max.y,bb.min.z);
    corners[4].set(bb.min.x,bb.min.y,bb.max.z);
    corners[5].set(bb.max.x,bb.min.y,bb.max.z);
    corners[6].set(bb.min.x,bb.max.y,bb.max.z);
    corners[7].set(bb.max.x,bb.max.y,bb.max.z);

    for(const c of corners){
      v.copy(c);
      mesh.localToWorld(v);
      minX=Math.min(minX,v.x); maxX=Math.max(maxX,v.x);
      minY=Math.min(minY,v.y); maxY=Math.max(maxY,v.y);
    }
  }

  const rangeX=Math.max(1e-6, maxX-minX);
  const rangeY=Math.max(1e-6, maxY-minY);
  const sideUseX = rangeX >= rangeY;
  const d=Math.max(1e-6, depth);

  const wpos=new THREE.Vector3();

  for(const mesh of meshes){
    const geo=mesh.geometry;
    geo.computeVertexNormals();

    const pos=geo.attributes.position;
    const nrm=geo.attributes.normal;

    const uvArr=new Float32Array(pos.count*2);
    if(geo.attributes.uv?.array && geo.attributes.uv.array.length===uvArr.length){
      uvArr.set(geo.attributes.uv.array);
    }

    for(let i=0;i<pos.count;i+=3){
      const nz=nrm.getZ(i);
      const isCap=Math.abs(nz)>.9;

      for(let k=0;k<3;k++){
        const vi=i+k;
        const x=pos.getX(vi), y=pos.getY(vi), z=pos.getZ(vi);

        if(isCap){
          if(!faceWorld) continue;
          wpos.set(x,y,z);
          mesh.localToWorld(wpos);
          uvArr[vi*2]   = clamp((wpos.x-minX)/rangeX,0,1);
          uvArr[vi*2+1] = clamp((wpos.y-minY)/rangeY,0,1);
        }else{
          if(!sideWorld) continue;
          wpos.set(x,y,z);
          mesh.localToWorld(wpos);
          uvArr[vi*2]   = clamp(sideUseX ? ((wpos.x-minX)/rangeX) : ((wpos.y-minY)/rangeY),0,1);
          uvArr[vi*2+1] = clamp(z/d,0,1);
        }
      }
    }

    geo.setAttribute("uv", new THREE.BufferAttribute(uvArr,2));
    geo.attributes.uv.needsUpdate=true;
  }
}

// ---------------------------
// Glyph building
// ---------------------------
function buildGlyph(ch){
  const shapes=font.generateShapes(ch, params.size);

  const shapeGeo=new THREE.ShapeGeometry(shapes);
  shapeGeo.computeBoundingBox();
  const bb=shapeGeo.boundingBox;
  const width=bb.max.x-bb.min.x;
  const left=bb.min.x;
  shapeGeo.dispose();

  let geo=new THREE.ExtrudeGeometry(shapes,{ depth:params.depth, bevelEnabled:false, steps:1 });
  geo.translate(-left,0,0);
  if(geo.index) geo = geo.toNonIndexed();
  writeUVsNonIndexed_Local(geo, params.depth);

  const sideMatLocal = sideMat.clone();
  sideMatLocal.userData = {};
  sideMatLocal.map = sideMat.map;
  sideMatLocal.color.copy(sideMat.color);
  sideMatLocal.transparent = true;
  sideMatLocal.opacity = 1;
  sideMatLocal.visible = true;
  _applyFX(sideMatLocal,false);
  sideMatLocal.needsUpdate=true;

  const mesh=new THREE.Mesh(geo, [faceMat, sideMatLocal]);

  const edges=new THREE.EdgesGeometry(geo, Number(params.edgeThreshold||1));
  let pos=Array.from(edges.attributes.position.array);
  edges.dispose();

  if(params.strokeFacesOnly) pos=filterEdgesToFrontBackFaces(pos, params.depth, 1e-4);

  const lineGeo=new LineSegmentsGeometry();
  lineGeo.setPositions(pos);

  const stroke=new LineSegments2(lineGeo, createStrokeMaterial());
  stroke.computeLineDistances();
  stroke.isLineSegments2=true;

  return { width, mesh, stroke };
}

function applyExtrusionTransform(entry){
  const d=entry.baseDepth;
  const sZ=entry.mesh.scale.z;
  entry.mesh.position.z=(d*sZ)/2;
  if(entry.stroke){
    entry.stroke.position.z=entry.mesh.position.z;
    entry.stroke.scale.z=entry.mesh.scale.z;
  }
}
function _updateDepth(entry){
  const breath = entry._breathMul ?? 1;
  const zoff = entry.zOffset ?? 0;

  entry.mesh.scale.z = Math.max(0.0001, (entry.depthF ?? 1) * breath);
  applyExtrusionTransform(entry);

  entry.group.position.z = (entry.baseGroupZ ?? 0) + zoff;
}

function _ensureCharZOffsets(){
  if(!Array.isArray(params.charZOffsets)) params.charZOffsets=[];
  const n=glyphs.length;
  if(params.charZOffsets.length !== n){
    const next=new Array(n);
    for(let i=0;i<n;i++) next[i]=Number(params.charZOffsets[i] ?? 0);
    params.charZOffsets=next;
  }
}
function _applyCharZOffsetsFromParams(){
  _ensureCharZOffsets();
  for(let i=0;i<glyphs.length;i++){
    glyphs[i].zOffset = Number(params.charZOffsets[i] || 0);
    _updateDepth(glyphs[i]);
  }
}
window.__applyCharZOffsets = _applyCharZOffsetsFromParams;
window.__getCharCount = ()=>glyphs.length;

// ---------------------------
// Text layout
// ---------------------------
const getAlign=()=>{
  const a=(params.align||"center").toLowerCase();
  return (a==="left"||a==="right"||a==="center")?a:"center";
};

function _computeCentersAndCylinderParam(){
  // global
  let sx=0, sy=0;
  for(const g of glyphs){ sx += (g.baseGroupX||0); sy += (g.baseGroupY||0); }
  const n = Math.max(1, glyphs.length);
  _centers.global.x = sx / n;
  _centers.global.y = sy / n;

  // word centers
  _centers.words = wordGroups.map(group=>{
    let wx=0, wy=0;
    for(const g of group){ wx += (g.baseGroupX||0); wy += (g.baseGroupY||0); }
    const m=Math.max(1, group.length);
    return { x: wx/m, y: wy/m };
  });

  // line centers
  _centers.lines = lineGroups.map(group=>{
    let lx=0, ly=0;
    for(const g of group){ lx += (g.baseGroupX||0); ly += (g.baseGroupY||0); }
    const m=Math.max(1, group.length);
    return { x: lx/m, y: ly/m };
  });

  // cylinder t from x span (use baseGroupX after centering textGroup)
  let minX=Infinity, maxX=-Infinity;
  for(const g of glyphs){
    minX=Math.min(minX, g.baseGroupX||0);
    maxX=Math.max(maxX, g.baseGroupX||0);
  }
  if(!isFinite(minX) || !isFinite(maxX) || Math.abs(maxX-minX)<1e-6){
    minX = -1; maxX = 1;
  }
  _centers.minX = minX;
  _centers.maxX = maxX;

  const span = Math.max(1e-6, maxX - minX);
  for(const g of glyphs){
    g._cylT = ((g.baseGroupX||0) - minX) / span; // 0..1
  }
}

function buildText(){
  if(!font) return;

  clearText();
  rebuildBackground();

  const lines=String(params.text??"").replace(/\r/g,"").split("\n");
  const lineH=params.size*params.lineSpacing;
  const align=getAlign();

  const built=[];
  let maxLineW=0;

  for(const line of lines){
    if(!line.length){ built.push(null); continue; }
    const chars=Array.from(line);
    const entries=[];
    let w=0;

    for(let i=0;i<chars.length;i++){
      const ch=chars[i];
      if(ch===" "){
        const sw=params.size*0.35;
        entries.push({space:true,width:sw});
        w+=sw;
        continue;
      }
      const g=buildGlyph(ch);
      entries.push({space:false,width:g.width,glyph:g});
      w+=g.width;
      if(i!==chars.length-1) w+=params.charSpacing;
    }

    maxLineW=Math.max(maxLineW,w);
    built.push({entries,width:w});
  }

  let y=0, globalGlyphIndex=0;
  let wordIdxCounter = 0;

  for(let lineIdx=0; lineIdx<built.length; lineIdx++){
    const lineEntry=built[lineIdx];
    if(!lineEntry){ y-=lineH; continue; }

    let x=0;
    if(align==="left")   x=-maxLineW/2;
    if(align==="center") x=-lineEntry.width/2;
    if(align==="right")  x=(maxLineW/2)-lineEntry.width;

    const currentLineGroup=[];
    let currentWordGroup=[];
    let currentWordIndex = -1;
    const flushWord=()=>{
      if(currentWordGroup.length){
        // stamp word index
        for(const g of currentWordGroup){ g.wordIndex = currentWordIndex; }
        wordGroups.push(currentWordGroup);
        currentWordGroup=[];
      }
    };

    for(let i=0;i<lineEntry.entries.length;i++){
      const e=lineEntry.entries[i];
      if(e.space){
        flushWord();
        x+=e.width;
        continue;
      }

      // start a new word group when we first see glyph after a space
      if(currentWordGroup.length === 0){
        currentWordIndex = wordIdxCounter++;
      }

      const {mesh, stroke} = e.glyph;

      const group=new THREE.Group();
      group.position.set(x,y,0);

      const inner=new THREE.Group();
      inner.add(mesh);
      if(params.strokeWidth>0) inner.add(stroke);
      group.add(inner);

      textGroup.add(group);

      const entry={
        group, inner, mesh, stroke,
        baseDepth: params.depth,
        baseGroupX: group.position.x,
        baseGroupY: group.position.y,
        baseGroupZ: group.position.z,
        baseRotX: group.rotation.x, baseRotY: group.rotation.y, baseRotZ: group.rotation.z,
        baseScaleX: group.scale.x, baseScaleY: group.scale.y, baseScaleZ: group.scale.z,
        baseX: x,
        depthF: 1,
        _breathMul: 1,
        zOffset: 0,
        lineIndex: lineIdx,
        wordIndex: currentWordIndex,
        hoverF: 0,
        overlayIndex: globalGlyphIndex,

        // animation-driven baselines (for hover to stack correctly when anim moves positions)
        animBaseX: null,
        animBaseY: null,
        animBaseZ: null,
        animRotX: null,
        animRotY: null,
        animRotZ: null,
        animScaleX: null,
        animScaleY: null,
        animScaleZ: null,

        _cylT: 0,
      };

      _updateDepth(entry);

      glyphs.push(entry);
      currentWordGroup.push(entry);
      currentLineGroup.push(entry);

      x += e.width;
      if(i!==lineEntry.entries.length-1) x += params.charSpacing;
      globalGlyphIndex++;
    }

    flushWord();
    if(currentLineGroup.length) lineGroups.push(currentLineGroup);
    y -= lineH;
  }

  const box=new THREE.Box3().setFromObject(textGroup);
  const sizeVec=new THREE.Vector3();
  const centerVec=new THREE.Vector3();
  box.getSize(sizeVec);
  box.getCenter(centerVec);

  textGroup.position.x -= centerVec.x;
  textGroup.position.y -= centerVec.y;
  textGroup.position.z -= centerVec.z;

  frame.maxDim = Math.max(sizeVec.x,sizeVec.y,sizeVec.z);

  // IMPORTANT: After centering textGroup, refresh baseGroupX/Y to be the true centered coords
  // (the group local positions haven't changed; but our hover/anim logic uses them as-local coords)
  // Since we centered by moving textGroup, the local baseGroupX/Y remain correct for local space interactions.

  const meshes = glyphs.map(g=>g.mesh);

  // IMPORTANT: faceWorld should be true for gradient + checker if UV space is world
  const faceWorld = (params.faceMode!=="solid" && params.faceUVSpace==="world");
  const sideWorld = (params.sideMode==="gradient" && params.sideUVSpace==="world");

  applyWorldUVsNonIndexed(meshes, params.depth, faceWorld, sideWorld);

  textGroup.updateMatrixWorld(true);
  _refreshStablePlane();

  _computeCentersAndCylinderParam();

  resize();
  reframeToText();

  renderer.compile(scene,camera);

  _applyCharZOffsetsFromParams();
  try{ window.__rebuildZControls?.(); }catch(e){}
  _syncFXUniforms();
}
window.buildText = buildText;

// ---------------------------
// Fonts
// ---------------------------
async function setFontFromUrl(url){
  const u=String(url||"").trim();
  if(!u) return;
  try{
    await new Promise((res,rej)=>fontLoader.load(u,f=>{font=f;res();},undefined,rej));
    buildText();
    if(window.__tp_animPlaying) playAnimation();
  }catch(e){
    console.error(e);
    alert("Font load failed. Use a THREE typeface JSON (.typeface.json).");
  }
}
function setFontFromUploadedJsonText(t){
  try{
    font = fontLoader.parse(JSON.parse(t));
    buildText();
    if(window.__tp_animPlaying) playAnimation();
  }catch(e){
    console.error(e);
    alert("Could not parse font. Upload a THREE typeface JSON (.typeface.json).");
  }
}
window.setFontFromUploadedJsonText = setFontFromUploadedJsonText;

async function applyFontSelection(){
  if(params.fontSource==="preset") return setFontFromUrl(FONT_PRESETS[params.fontPreset]);
  if(params.fontSource==="url") return setFontFromUrl(params.fontUrl);
}
window.applyFontSelection = applyFontSelection;

// ---------------------------
// Camera
// ---------------------------
function tweenCamera(toPos,toTarget,duration=.85){
  if(!gsap){
    camera.position.copy(toPos);
    controls.target.copy(toTarget);
    controls.update();
    return;
  }
  gsap.to(camera.position,{x:toPos.x,y:toPos.y,z:toPos.z,duration,ease:"power2.inOut",onUpdate:()=>controls.update()});
  gsap.to(controls.target,{x:toTarget.x,y:toTarget.y,z:toTarget.z,duration,ease:"power2.inOut",onUpdate:()=>controls.update()});
}
function applyCameraPreset(){
  const dist=Math.max(420,frame.maxDim*1.25);
  const lift=Math.max(120,frame.maxDim*.35);
  let pos;
  if(params.cameraPreset==="front") pos=new THREE.Vector3(0,0,dist);
  else if(params.cameraPreset==="isoLeft") pos=new THREE.Vector3(-dist,lift,dist);
  else pos=new THREE.Vector3(dist,lift,dist);
  tweenCamera(pos,new THREE.Vector3(0,0,0),.85);
}
function reframeToText(){
  const dist=Math.max(420,frame.maxDim*1.25);
  const lift=Math.max(140,frame.maxDim*.35);
  tweenCamera(new THREE.Vector3(0,lift*.2,dist),new THREE.Vector3(0,0,0),.85);
}
window.applyCameraPreset = applyCameraPreset;
window.reframeToText = reframeToText;

// ---------------------------
// GSAP Preset Animation (extended: spin/explode/cylinder)
// ---------------------------
function stopAnimation(){
  if(tl){ tl.kill(); tl=null; }
  for(const g of glyphs){
    g.depthF=1;

    g.group.position.x = g.baseGroupX||0;
    g.group.position.y = g.baseGroupY||0;
    // z handled by _updateDepth + zOffset
    g.group.rotation.x=g.baseRotX||0;
    g.group.rotation.y=g.baseRotY||0;
    g.group.rotation.z=g.baseRotZ||0;
    g.group.scale.set(g.baseScaleX||1,g.baseScaleY||1,g.baseScaleZ||1);

    g.animBaseX = null; g.animBaseY = null; g.animBaseZ = null;
    g.animRotX = null; g.animRotY = null; g.animRotZ = null;
    g.animScaleX = null; g.animScaleY = null; g.animScaleZ = null;

    _updateDepth(g);
  }
  _applyCharZOffsetsFromParams();
}
window.stopAnimation = stopAnimation;

function playAnimation(){
  if(!gsap || !glyphs.length) return;
  if(tl){ tl.kill(); tl=null; }

  const duration=Number(params.animSpeed||1.2);
  const stagger=Number(params.animStagger||.03);
  const ease=params.animEase||"power2.inOut";
  const loop=!!params.animLoop;
  const minF=Math.max(0,Number(params.animMinPct||0)/100);
  const maxF=Math.max(0,Number(params.animMaxPct||100)/100);

  let groups=[];
  if(params.animStaggerMode==="word") groups=wordGroups;
  else if(params.animStaggerMode==="line") groups=lineGroups;
  else groups=glyphs.map(g=>[g]);

  // Proxy now includes optional position channels
  const proxies=groups.filter(g=>g&&g.length).map((members,gi)=>({
    // depth factor
    f:minF,
    // rotation deltas
    rx:0,ry:0,rz:0,
    // uniform scale
    s:1,
    // position offsets (local)
    ox:0, oy:0,
    // per-proxy metadata
    members,
    _gi: gi
  }));

  const rotRad=THREE.MathUtils.degToRad(Number(params.animRotateDeg||35));
  const inflateAmt=Number(params.animInflate||.18);

  function applyProxy(p){
    for(const m of p.members){
      // base pos + animation offsets
      const bx = (m.baseGroupX||0);
      const by = (m.baseGroupY||0);

      const px = bx + (p.ox||0);
      const py = by + (p.oy||0);

      m.group.position.x = px;
      m.group.position.y = py;

      // rotation
      const rx = (m.baseRotX||0) + (p.rx||0);
      const ry = (m.baseRotY||0) + (p.ry||0);
      const rz = (m.baseRotZ||0) + (p.rz||0);

      m.group.rotation.x = rx;
      m.group.rotation.y = ry;
      m.group.rotation.z = rz;

      // scale
      const bsx=(m.baseScaleX||1),bsy=(m.baseScaleY||1),bsz=(m.baseScaleZ||1);
      m.group.scale.set(bsx*(p.s||1),bsy*(p.s||1),bsz);

      // depth factor
      m.depthF = (typeof p.f==="number") ? p.f : 1;
      _updateDepth(m);

      // cache animated baselines so hover can stack cleanly
      m.animBaseX = px; m.animBaseY = py; m.animBaseZ = m.group.position.z;
      m.animRotX = rx;  m.animRotY = ry;  m.animRotZ = rz;
      m.animScaleX = m.group.scale.x; m.animScaleY = m.group.scale.y; m.animScaleZ = m.group.scale.z;
    }
  }

  for(const p of proxies) applyProxy(p);

  tl=gsap.timeline({repeat:loop?-1:0,yoyo:true});
  const preset=(params.animPreset||"depth").toLowerCase();
  const alsoDepth=(preset==="depth")?true:!!params.animAlsoDepth;

  const tweenVars={
    duration, ease,
    stagger:{each:stagger,from:params.animStaggerFrom},
    onUpdate:()=>{ for(const p of proxies) applyProxy(p); _applyCharZOffsetsFromParams(); }
  };

  // reset proxy fields before tween
  for(const p of proxies){ p.f=alsoDepth?minF:undefined; p.rx=0; p.ry=0; p.rz=0; p.s=1; p.ox=0; p.oy=0; }

  const axis=(params.animAxis||"y").toLowerCase();
  const depthTarget=maxF;

  // -------------------
  // Existing presets
  // -------------------
  if(preset==="depth"){
    tl.to(proxies,{...tweenVars,f:depthTarget},0);
    return;
  }
  if(preset==="twist"){
    const vars={...tweenVars};
    if(axis==="x") vars.rx=rotRad; else vars.ry=rotRad;
    if(alsoDepth) vars.f=depthTarget;
    tl.to(proxies,vars,0);
    return;
  }
  if(preset==="wobble"){
    const vars={...tweenVars,rz:rotRad};
    if(alsoDepth) vars.f=depthTarget;
    tl.to(proxies,vars,0);
    return;
  }
  if(preset==="inflate"){
    const vars={...tweenVars,s:1+inflateAmt};
    if(alsoDepth) vars.f=depthTarget;
    tl.to(proxies,vars,0);
    return;
  }

  // -------------------
  // NEW: Spin (axis)
  // -------------------
  if(preset==="spin"){
    const ax = (params.animSpinAxis || "y").toLowerCase();
    const spinRad = THREE.MathUtils.degToRad(Number(params.animSpinDeg ?? 180));
    const vars={...tweenVars};
    if(ax==="x") vars.rx=spinRad;
    else if(ax==="z") vars.rz=spinRad;
    else vars.ry=spinRad;
    if(alsoDepth) vars.f=depthTarget;
    tl.to(proxies,vars,0);
    return;
  }

  // -------------------
  // NEW: Explode
  // -------------------
  if(preset==="explode"){
    const originMode = (params.animExplodeOrigin || "center").toLowerCase();
    const mode = (params.animExplodeMode || "radial").toLowerCase();
    const amt = Number(params.animExplodeAmount ?? 55);
    const rotDeg = Number(params.animExplodeRotDeg ?? 45);
    const rotAxis = (params.animExplodeAxis || "z").toLowerCase();
    const randPos = clamp01(Number(params.animExplodeRandPos ?? 0.35));
    const randRot = clamp01(Number(params.animExplodeRandRot ?? 0.6));

    // per proxy we’ll compute average direction based on its members
    function proxyCenter(p){
      let cx=0, cy=0;
      for(const m of p.members){ cx += (m.baseGroupX||0); cy += (m.baseGroupY||0); }
      const n=Math.max(1, p.members.length);
      return { x: cx/n, y: cy/n };
    }

    function getOriginFor(p){
      if(originMode==="word"){
        // take the first member's wordIndex
        const wi = p.members[0]?.wordIndex ?? 0;
        return _centers.words[wi] || _centers.global;
      }
      if(originMode==="line"){
        const li = p.members[0]?.lineIndex ?? 0;
        return _centers.lines[li] || _centers.global;
      }
      return _centers.global;
    }

    // We animate a normalized scalar "k" from 0..1 and use it in applyProxy via ox/oy/r*
    const explodeTargets = proxies.map((p, i)=>{
      const c = proxyCenter(p);
      const o = getOriginFor(p);

      let dx = c.x - o.x;
      let dy = c.y - o.y;

      // if centered, fake a direction
      if(Math.abs(dx)+Math.abs(dy) < 1e-6){
        const a = hash1(i+19) * Math.PI*2;
        dx = Math.cos(a);
        dy = Math.sin(a);
      }
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      dx /= len; dy /= len;

      if(mode==="up"){ dx=0; dy=1; }
      if(mode==="down"){ dx=0; dy=-1; }
      if(mode==="left"){ dx=-1; dy=0; }
      if(mode==="right"){ dx=1; dy=0; }
      if(mode==="random"){
        const a = hash1(i+77) * Math.PI*2;
        dx = Math.cos(a); dy = Math.sin(a);
      }
      if(mode==="swirl"){
        const tx=-dy, ty=dx;
        dx=tx; dy=ty;
      }

      const posVar = 1 + randPos * hashSigned(i+3);
      const rotVar = 1 + randRot * hashSigned(i+7);

      // store in proxy user data
      p.__ex = dx * amt * posVar;
      p.__ey = dy * amt * posVar;
      p.__rr = THREE.MathUtils.degToRad(rotDeg * rotVar);

      // pick axis if random
      p.__axis = rotAxis;
      if(rotAxis==="random"){
        const r = hash1(i+101);
        p.__axis = (r<0.333) ? "x" : (r<0.666) ? "y" : "z";
      }
      return p;
    });

    // We tween a temp value on each proxy, then map to ox/oy + rotations
    for(const p of explodeTargets){
      p.k = 0;
    }

    const vars = {
      duration, ease,
      stagger:{each:stagger,from:params.animStaggerFrom},
      onUpdate:()=>{
        for(const p of explodeTargets){
          const k = p.k || 0;
          p.ox = (p.__ex||0) * k;
          p.oy = (p.__ey||0) * k;

          const rr = (p.__rr||0) * k;
          p.rx = 0; p.ry = 0; p.rz = 0;
          if(p.__axis==="x") p.rx = rr;
          else if(p.__axis==="y") p.ry = rr;
          else p.rz = rr;

          if(alsoDepth) p.f = lerp(minF, depthTarget, k);
        }
        for(const p of explodeTargets) applyProxy(p);
        _applyCharZOffsetsFromParams();
      }
    };

    tl.to(explodeTargets, { k: 1, ...vars }, 0);
    return;
  }

  // -------------------
  // NEW: Cylinder
  // -------------------
  if(preset==="cylinder"){
    const r = Math.max(10, Number(params.animCylRadius ?? 240));
    const wrapRad = THREE.MathUtils.degToRad(Number(params.animCylWrapDeg ?? 260));
    const phaseRad = THREE.MathUtils.degToRad(Number(params.animCylRotateDeg ?? 220));
    const twistRad = THREE.MathUtils.degToRad(Number(params.animCylTwistDeg ?? 0));
    const faceOut = !!params.animCylFaceOut;

    for(const p of proxies){ p.k = 0; }

    const vars = {
      duration, ease,
      stagger:{each:stagger,from:params.animStaggerFrom},
      onUpdate:()=>{
        for(const p of proxies){
          const k = p.k || 0;
          const phase = phaseRad * k;

          // apply per member (cylinder is per-char even in grouped staggers)
          for(const m of p.members){
            const t = clamp01(m._cylT ?? 0.5);
            const baseAng = (t - 0.5) * wrapRad;
            const ang = baseAng + phase;

            // local cylinder offsets
            const cx = (r * Math.cos(ang)) - r; // center-ish
            const cz = (r * Math.sin(ang));

            m.group.position.x = (m.baseGroupX||0) + cx;
            m.group.position.y = (m.baseGroupY||0);
            // z is handled by _updateDepth, but cylinder needs additional z offset:
            // we add it AFTER depth sets group.position.z, so store and apply here:
            const baseZ = (m.baseGroupZ||0) + (m.zOffset||0);
            m.group.position.z = baseZ + cz;

            // rotation
            let ry = (m.baseRotY||0);
            if(faceOut) ry = (m.baseRotY||0) + ang;
            const rz = (m.baseRotZ||0) + twistRad * k;

            m.group.rotation.x = (m.baseRotX||0);
            m.group.rotation.y = ry;
            m.group.rotation.z = rz;

            // depth
            if(alsoDepth){
              m.depthF = lerp(minF, depthTarget, k);
            }else{
              m.depthF = 1;
            }
            _updateDepth(m);

            // cache animated baselines
            m.animBaseX = m.group.position.x;
            m.animBaseY = m.group.position.y;
            m.animBaseZ = m.group.position.z;
            m.animRotX  = m.group.rotation.x;
            m.animRotY  = m.group.rotation.y;
            m.animRotZ  = m.group.rotation.z;
            m.animScaleX = m.group.scale.x;
            m.animScaleY = m.group.scale.y;
            m.animScaleZ = m.group.scale.z;
          }
        }
        _applyCharZOffsetsFromParams();
      }
    };

    tl.to(proxies, { k: 1, ...vars }, 0);
    return;
  }

  // fallback: depth
  tl.to(proxies,{...tweenVars,f:depthTarget},0);
}
window.playAnimation = playAnimation;

// ---------------------------
// Hover (repel fixed) + heat world position + NEW spin/explode hover
// ---------------------------
let pointerActive=false;
let pointerNDC=new THREE.Vector2(0,0);
const cursorLocal=new THREE.Vector3(0,0,0);
const cursorLocalTarget=new THREE.Vector3(0,0,0);
const _cursorDelta=new THREE.Vector3();

function _updatePointerFromEvent(e){
  const r=renderer.domElement.getBoundingClientRect();
  const x=e.clientX-r.left, y=e.clientY-r.top;
  pointerActive=(x>=0&&y>=0&&x<=r.width&&y<=r.height);
  if(!pointerActive) return;
  pointerNDC.x=(x/r.width)*2-1;
  pointerNDC.y=-(y/r.height)*2+1;
}
function onPointerMove(e){ _updatePointerFromEvent(e); }
function onPointerEnter(e){ _updatePointerFromEvent(e); }
function onPointerLeave(){ pointerActive=false; _hoverStrength=0; }

function getCursorLocalOnTextPlane(outLocal){
  _raycaster.setFromCamera(pointerNDC,camera);
  const ok=_raycaster.ray.intersectPlane(_stablePlane,_hit);
  if(!ok) return false;

  _hoverWorld.copy(_hit);
  outLocal.copy(_hit);
  textGroup.worldToLocal(outLocal);
  return true;
}

function resetHoverTransforms(){
  const chase=clamp(Number(params.liftSmoothing||.18),.001,1);
  for(const g of glyphs){
    const bx = (g.animBaseX ?? g.baseGroupX ?? 0);
    const by = (g.animBaseY ?? g.baseGroupY ?? 0);

    g.group.position.x=lerp(g.group.position.x, bx, chase);
    g.group.position.y=lerp(g.group.position.y, by, chase);

    const brx=(g.animRotX ?? g.baseRotX ?? 0);
    const bry=(g.animRotY ?? g.baseRotY ?? 0);
    const brz=(g.animRotZ ?? g.baseRotZ ?? 0);

    g.group.rotation.x=lerp(g.group.rotation.x, brx, chase);
    g.group.rotation.y=lerp(g.group.rotation.y, bry, chase);
    g.group.rotation.z=lerp(g.group.rotation.z, brz, chase);

    const bsx=(g.animScaleX ?? g.baseScaleX ?? 1);
    const bsy=(g.animScaleY ?? g.baseScaleY ?? 1);
    const bsz=(g.animScaleZ ?? g.baseScaleZ ?? 1);

    g.group.scale.x=lerp(g.group.scale.x, bsx, chase);
    g.group.scale.y=lerp(g.group.scale.y, bsy, chase);
    g.group.scale.z=lerp(g.group.scale.z, bsz, chase);
  }
}

function updateHoverEffects(){
  if(!glyphs.length || params.hoverMode==="none"){ resetHoverTransforms(); _hoverStrength=0; return; }
  if(!params.proximityLift){ resetHoverTransforms(); _hoverStrength=0; return; }
  if(!pointerActive){ resetHoverTransforms(); _hoverStrength=0; return; }

  if(getCursorLocalOnTextPlane(cursorLocalTarget)){
    const ms=clamp(Number(params.cursorSmoothing||.85),0,.98);
    const a=1-ms;
    _cursorDelta.copy(cursorLocalTarget).sub(cursorLocal);
    const maxStep=40;
    const len=_cursorDelta.length();
    if(len>maxStep) _cursorDelta.multiplyScalar(maxStep/len);
    cursorLocal.addScaledVector(_cursorDelta,a);
  }else{
    resetHoverTransforms();
    _hoverStrength=0;
    return;
  }

  const r=Math.max(1e-6,Number(params.proximityRadiusWorld||140));
  const invR=1/r;
  const chase=clamp(Number(params.liftSmoothing||.18),.001,1);
  const mode=params.proximityFalloff||"smooth";
  const lift=Number(params.proximityLiftAmount||60);
  const rot=THREE.MathUtils.degToRad(Number(params.hoverRotateDeg||20));
  const tilt=THREE.MathUtils.degToRad(Number(params.hoverTiltDeg||18));
  const pulse=Number(params.hoverPulse||.12);
  const hoverMode=(params.hoverMode||"lift").toLowerCase();

  // NEW hover spin
  const spinDeg = Number(params.hoverSpinDeg ?? 55);
  const spinRad = THREE.MathUtils.degToRad(spinDeg);
  const spinAxis = (params.hoverSpinAxis || "random").toLowerCase();

  // NEW hover explode
  const hexOriginMode = (params.hoverExplodeOrigin || "center").toLowerCase();
  const hexMode = (params.hoverExplodeMode || "radial").toLowerCase();
  const hexAmt = Number(params.hoverExplodeAmount ?? 35);
  const hexRotDeg = Number(params.hoverExplodeRotDeg ?? 28);
  const hexRotAxis = (params.hoverExplodeAxis || "z").toLowerCase();
  const hexRandPos = clamp01(Number(params.hoverExplodeRandPos ?? 0.45));
  const hexRandRot = clamp01(Number(params.hoverExplodeRandRot ?? 0.7));

  const sweepOn=!!params.magneticSweepOn;
  const sweepAmt=Number(params.sweepAmount||0);
  const sweepBias=Number(params.sweepBias||1);
  const sweepYMix=Number(params.sweepYMix||0.25);

  let maxF=0;

  for(const g of glyphs){
    const cx = (g.animBaseX ?? g.baseX ?? 0); // hover center in local X space
    const cy = (g.animBaseY ?? g.baseGroupY ?? 0);
    const dx=cursorLocal.x-cx, dy=cursorLocal.y-cy;
    const d=Math.sqrt(dx*dx+dy*dy);
    const u=d<r?(1-d*invR):0;
    g.hoverF=falloff(u,mode);
    maxF=Math.max(maxF,g.hoverF);
  }
  _hoverStrength=maxF;

  for(const g of glyphs){
    const f=g.hoverF||0;

    const bx = (g.animBaseX ?? g.baseGroupX ?? 0);
    const by = (g.animBaseY ?? g.baseGroupY ?? 0);

    const brx=(g.animRotX ?? g.baseRotX ?? 0);
    const bry=(g.animRotY ?? g.baseRotY ?? 0);
    const brz=(g.animRotZ ?? g.baseRotZ ?? 0);

    const bsx=(g.animScaleX ?? g.baseScaleX ?? 1);
    const bsy=(g.animScaleY ?? g.baseScaleY ?? 1);
    const bsz=(g.animScaleZ ?? g.baseScaleZ ?? 1);

    const cx = (g.animBaseX ?? g.baseX ?? 0);
    const cy = (g.animBaseY ?? g.baseGroupY ?? 0);

    const dx=cursorLocal.x-cx, dy=cursorLocal.y-cy;
    const d=Math.sqrt(dx*dx+dy*dy)||1;

    let tx=bx, ty=by;
    let rx=brx, ry=bry, rz=brz;
    let sx=bsx, sy=bsy, sz=bsz;

    if(hoverMode==="lift"){
      ty += lift*f;
    }else if(hoverMode==="rotate"){
      rz += rot*f;
    }else if(hoverMode==="tilt"){
      const nx=dx/d, ny=dy/d;
      rx += (-ny)*tilt*f;
      ry += ( nx)*tilt*f;
    }else if(hoverMode==="pulse"){
      const s=1+pulse*f;
      sx*=s; sy*=s;
    }else if(hoverMode==="repel"){
      const minD=Math.max(0.001,Number(params.repelMinDistance ?? 6));
      const amt =Number(params.repelAmount ?? 80);
      const cap =Number(params.repelClamp ?? 140);
      const dd=Math.max(d,minD);

      // push AWAY from cursor
      const nx = (-dx)/dd;
      const ny = (-dy)/dd;

      let push=amt*f;
      if(push>cap) push=cap;

      tx += nx*push;
      ty += ny*push;
    }else if(hoverMode==="spin"){
      const ax = (spinAxis==="random")
        ? ((hash1((g.overlayIndex||0)+123) < 0.333) ? "x" : (hash1((g.overlayIndex||0)+123) < 0.666) ? "y" : "z")
        : spinAxis;

      if(ax==="x") rx += spinRad*f;
      else if(ax==="y") ry += spinRad*f;
      else rz += spinRad*f;
    }else if(hoverMode==="explode"){
      // origin
      let ox = _centers.global.x, oy = _centers.global.y;
      if(hexOriginMode==="word"){
        const wi = g.wordIndex ?? 0;
        const o = _centers.words[wi];
        if(o){ ox=o.x; oy=o.y; }
      }else if(hexOriginMode==="line"){
        const li = g.lineIndex ?? 0;
        const o = _centers.lines[li];
        if(o){ ox=o.x; oy=o.y; }
      }

      let ex = (g.baseGroupX||0) - ox;
      let ey = (g.baseGroupY||0) - oy;

      if(Math.abs(ex)+Math.abs(ey) < 1e-6){
        const a = hash1((g.overlayIndex||0)+19) * Math.PI*2;
        ex = Math.cos(a); ey = Math.sin(a);
      }
      const len = Math.sqrt(ex*ex+ey*ey) || 1;
      ex/=len; ey/=len;

      if(hexMode==="up"){ ex=0; ey=1; }
      if(hexMode==="down"){ ex=0; ey=-1; }
      if(hexMode==="left"){ ex=-1; ey=0; }
      if(hexMode==="right"){ ex=1; ey=0; }
      if(hexMode==="random"){
        const a = hash1((g.overlayIndex||0)+77) * Math.PI*2;
        ex = Math.cos(a); ey = Math.sin(a);
      }
      if(hexMode==="swirl"){
        const tx2=-ey, ty2=ex;
        ex=tx2; ey=ty2;
      }

      const posVar = 1 + hexRandPos * hashSigned((g.overlayIndex||0)+3);
      const rotVar = 1 + hexRandRot * hashSigned((g.overlayIndex||0)+7);

      const push = hexAmt * posVar * f;
      tx += ex*push;
      ty += ey*push;

      const rr = THREE.MathUtils.degToRad(hexRotDeg * rotVar) * f;

      let ax = hexRotAxis;
      if(ax==="random"){
        const r2 = hash1((g.overlayIndex||0)+101);
        ax = (r2<0.333) ? "x" : (r2<0.666) ? "y" : "z";
      }
      if(ax==="x") rx += rr;
      else if(ax==="y") ry += rr;
      else rz += rr;
    }

    if(sweepOn && sweepAmt>0.0001){
      const nx=dx/d, ny=dy/d;
      const tnx=-ny, tny=nx;
      const blend=clamp(sweepBias,0,2);
      const mx=lerp(tnx,nx,(blend-1));
      const my=lerp(tny,ny,(blend-1));
      tx += mx*sweepAmt*f;
      ty += my*sweepAmt*f*sweepYMix;
    }

    g.group.position.x=lerp(g.group.position.x,tx,chase);
    g.group.position.y=lerp(g.group.position.y,ty,chase);

    g.group.rotation.x=lerp(g.group.rotation.x,rx,chase);
    g.group.rotation.y=lerp(g.group.rotation.y,ry,chase);
    g.group.rotation.z=lerp(g.group.rotation.z,rz,chase);

    g.group.scale.x=lerp(g.group.scale.x,sx,chase);
    g.group.scale.y=lerp(g.group.scale.y,sy,chase);
    g.group.scale.z=lerp(g.group.scale.z,sz,chase);
  }
}
window.updateHoverEffects = updateHoverEffects;

// ---------------------------
// Idle wave + breathing
// ---------------------------
function applyIdleMotion(){
  if(!glyphs.length) return;
  const t=_fxTime;

  const breathOn=!!params.breathOn;
  const breathAmt=Math.max(0,Number(params.breathAmount||0));
  const breathSpd=Math.max(0.0001,Number(params.breathSpeed||0.55));
  const breathMul=breathOn?(1+breathAmt*Math.sin(t*(Math.PI*2)*breathSpd)):1;

  const waveOn=!!params.waveOn;
  const waveSpd=Math.max(0.0001,Number(params.waveSpeed||0.55));
  const waveAmpY=Number(params.waveAmpY||0);
  const waveRot=THREE.MathUtils.degToRad(Number(params.waveRotDeg||0));
  const waveFreq=Number(params.waveFreq||0.08);
  const waveBy=(params.waveBy==="line")?"line":"x";

  for(const g of glyphs){
    g._breathMul=breathMul;
    _updateDepth(g);

    if(!g.inner) continue;
    if(!waveOn){
      g.inner.position.y=0;
      g.inner.rotation.z=0;
      continue;
    }

    const phaseBase=(waveBy==="line")
      ? (g.lineIndex||0)*1.15
      : (g.baseX||0)*waveFreq;

    const w=Math.sin(phaseBase + t*(Math.PI*2)*waveSpd);
    g.inner.position.y=waveAmpY*w;
    g.inner.rotation.z=waveRot*w;
  }

  _applyCharZOffsetsFromParams();
}

// ---------------------------
// Init + loop
// ---------------------------
function init(){
  applyLightingMode();
  resize();
  applyFontSelection();
}
init();

addEventListener("resize", resize);
renderer.domElement.style.touchAction="none";
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerenter", onPointerEnter);
renderer.domElement.addEventListener("pointerleave", onPointerLeave);

function loop(){
  raf=requestAnimationFrame(loop);
  controls.update();
  _fxTime=performance.now()*0.001;

  updateHoverEffects();
  applyIdleMotion();

  _applyGradientAnimation();
  _syncFXUniforms();

  renderer.render(scene,camera);
}
loop();

// ---------------------------
// Cleanup
// ---------------------------
window[TOOL_KEY].cleanup = () => {
  try{ delete window.__WF_3DTYPE_CORE_LOADED__; }catch(e){}
  try{ renderer.domElement.removeEventListener("pointermove",onPointerMove); }catch(e){}
  try{ renderer.domElement.removeEventListener("pointerenter",onPointerEnter); }catch(e){}
  try{ renderer.domElement.removeEventListener("pointerleave",onPointerLeave); }catch(e){}
  try{ if(tl) tl.kill(); }catch(e){}
  try{ cancelAnimationFrame(raf); }catch(e){}
  try{ clearText(); }catch(e){}
  try{ disposeIf(faceTex); disposeIf(sideTex); disposeIf(faceMat); disposeIf(sideMat); }catch(e){}
  try{ disposeIf(_bgTex); }catch(e){}
  try{ for(const m of _fxMats){ m.onBeforeCompile=null; } _fxMats.clear(); }catch(e){}
  try{ renderer?.dispose?.(); }catch(e){}
  try{ wrap.innerHTML=""; }catch(e){}
  document.documentElement.style.overflow = prevOverflowHtml;
  document.body.style.overflow = prevOverflowBody;
};
