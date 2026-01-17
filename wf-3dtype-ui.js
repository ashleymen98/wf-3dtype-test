// wf-3dtype-ui.js
(function () {
  const TAG = "[3DType/UI]";
  const UI_VERSION =
    "ui_v14_explodeShapeControls + explodeAxis + spin360EnterRaycast";
  console.log(TAG, UI_VERSION);
  window.__WF_3DTYPE_UI_VERSION__ = UI_VERSION;

  const wait = (cond, ms = 40, limit = 450) =>
    new Promise((res, rej) => {
      let n = 0;
      const t = setInterval(() => {
        let ok = false;
        try {
          ok = !!cond();
        } catch (e) {}
        if (ok) {
          clearInterval(t);
          res();
          return;
        }
        if (++n > limit) {
          clearInterval(t);
          rej(new Error("UI timed out waiting for deps/layout."));
        }
      }, ms);
    });

  function debounce(fn, ms = 90) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  wait(
    () =>
      window.Tweakpane &&
      window.params &&
      window.buildText &&
      window.rebuildFillMaterials &&
      window.playAnimation &&
      window.stopAnimation &&
      window._syncFXUniforms &&
      window.applyFontSelection &&
      window.setFontFromUploadedJsonText &&
      window.__applyCharZOffsets &&
      window.__getCharCount &&
      window.__WF_3DTYPE_TOOL__ &&
      document.getElementById("pane") &&
      (document.getElementById("pane-inner") || document.getElementById("pane")),
    40,
    650
  )
    .then(() => waitForPaneLayoutReady())
    .then(() => mountUI())
    .catch((err) => console.warn(TAG, err.message));

  function waitForPaneLayoutReady() {
    return wait(() => {
      const host =
        document.getElementById("pane-inner") || document.getElementById("pane");
      if (!host) return false;
      const r = host.getBoundingClientRect();
      return r.height > 40;
    }, 40, 250);
  }

  function mountUI() {
    const paneOuter = document.getElementById("pane");
    const paneHost = document.getElementById("pane-inner") || paneOuter;
    if (!paneOuter || !paneHost) {
      console.warn(TAG, "#pane/#pane-inner missing");
      return;
    }

    const prev = document.getElementById("__tp_root");
    if (prev) prev.remove();

    const root = document.createElement("div");
    root.id = "__tp_root";
    paneHost.appendChild(root);

    let rescueUsed = false;

    function ensureParam(params, key, val) {
      if (!(key in params)) params[key] = val;
    }

    function buildEverything() {
      try {
        window.__tp_ui_cleanup?.();
      } catch (e) {}
      root.innerHTML = "";

      const params = window.params;

      // ---------------------------
      // SAFE DEFAULTS
      // ---------------------------


      ensureParam(params, "bgMode", "solid");
      ensureParam(params, "bgSolid", "#111111");
      ensureParam(params, "bgGradA", "#101018");
      ensureParam(params, "bgGradB", "#1a0f24");
      ensureParam(params, "bgGradAngle", 35);
      ensureParam(params, "bgGradSoft", 0.65);

      ensureParam(params, "faceMode", "gradient");
      ensureParam(params, "faceUVSpace", "glyph");
      ensureParam(params, "faceSolid", "#ff0000");
      ensureParam(params, "faceLetterColors", []);

      // Kerning defaults
      ensureParam(params, "kerningOn", true);
      ensureParam(params, "kerningStrength", 1.0);
      ensureParam(params,
      "kerningPairsText",
      "AV:-18\nVA:-14\nTo:-10\nLY:-12\nLT:-10\nTa:-10\nYo:-10"
      );

      ensureParam(params, "faceChkScale", 42);
      ensureParam(params, "faceChkLineWidth", 3);
      ensureParam(params, "faceChkRotate", 0);
      ensureParam(params, "faceChkColorA", "#0e0e12");
      ensureParam(params, "faceChkColorB", "#161623");
      ensureParam(params, "faceChkLineColor", "#ffffff");

      ensureParam(params, "repelAmount", 80);
      ensureParam(params, "repelMinDistance", 6);
      ensureParam(params, "repelClamp", 140);

      // Anim tuning
      ensureParam(params, "animSpinDeg", 360);

      // Explode (upgraded axis controls + shape controls)


      // ------------------------------------------------------------
      // Explode (clean + consistent defaults)
      // ------------------------------------------------------------

      ensureParam(params, "animExplodeImpactMix", 0.45);       // how much impact drives motion
      ensureParam(params, "animExplodeImpactProfile", "center"); // center|edge

      ensureParam(params, "animExplodeClipScaleDown", 0.08);
      ensureParam(params, "animExplodeImpactPreset", "center"); // center|tl|tr|bl|br
      ensureParam(params, "animExplodeDepthShrink", 0.22);
      ensureParam(params, "animExplodeAmount", 220);
      ensureParam(params, "animExplodeDiameterX", 1.0);
      ensureParam(params, "animExplodeDiameterY", 1.0);
      ensureParam(params, "animExplodeDiameter", 1.0); // master
      ensureParam(params, "animExplodeAngleOffset", 0);
      ensureParam(params, "animExplodeZAmount", 0);
      ensureParam(params, "animExplodeZSpread", 0.0);
      ensureParam(params, "animExplodeRotDeg", 55);
      ensureParam(params, "animExplodeRotAxis", "z");
      ensureParam(params, "animExplodeRandomDir", true);  
      ensureParam(params, "animExplodeShape", "burst"); // burst | ring | sphere | linex | liney
      ensureParam(params, "animExplodeRingAngle", 0);
      ensureParam(params, "animExplodeNoise", 0.15);
      
      // ------------------------------------------------------------
      // Impact-style explode
      // ------------------------------------------------------------
      ensureParam(params, "animExplodeImpactOn", true);
      ensureParam(params, "animExplodeImpactDir", "front"); // front | back
      ensureParam(params, "animExplodeImplode", false);     // inward instead of outward
      
      ensureParam(params, "animExplodeImpactStrength", 1.0);
      ensureParam(params, "animExplodeImpactRadius", 260);
      ensureParam(params, "animExplodeImpactFalloff", 2.2);
      ensureParam(params, "animExplodeImpactX", 0.0);       // -1..1
      ensureParam(params, "animExplodeImpactY", 0.0);       // -1..1
      ensureParam(params, "animExplodeImpactZPush", 160);
      ensureParam(params, "animExplodeImpactRadialBoost", 0.55);
      
      // ------------------------------------------------------------
      // Explode OUT/RETURN timing + easing
      // (these are the ONLY ease/return keys we’ll use)
      // ------------------------------------------------------------
      ensureParam(params, "animExplodeHold", 0.30);           // pause at full explode
      ensureParam(params, "animExplodeReturn", true);         // whether it comes back
      ensureParam(params, "animExplodeReturnHold", 0.30);     // pause after return
      ensureParam(params, "animExplodeEaseOut", "expo.out");  // explode easing
      ensureParam(params, "animExplodeEaseIn", "expo.in");    // return easing

      // ------------------------------------------------------------
      // Explode rotation variance
      // (these are the ONLY rot variance keys we’ll use)
      // ------------------------------------------------------------
      ensureParam(params, "animExplodeRotMinDeg", 10);
      ensureParam(params, "animExplodeRotMaxDeg", 90);
      
      // ------------------------------------------------------------
      // Optional clip-scale (anti-clipping helper)
      // ------------------------------------------------------------
      ensureParam(params, "animExplodeClipScaleOn", false);
      ensureParam(params, "animExplodeClipScaleDown", 0.08);

      // Hover Spin360 (NEW fixed mapping)
      ensureParam(params, "hoverSpin360Axis", "random");
      ensureParam(params, "hoverSpin360RandomDir", true);
      ensureParam(params, "hoverSpin360BaseDur", 0.55);
      ensureParam(params, "hoverSpin360SpeedScale", 0.0045);
      ensureParam(params, "hoverSpin360MinDur", 0.12);
      ensureParam(params, "hoverSpin360MaxDur", 0.9);
      ensureParam(params, "hoverSpin360Ease", "power3.out");
      ensureParam(params, "hoverSpin360MinHoverF", 0.2);
      ensureParam(params, "hoverSpin360Lift", 0.12);

      const Pane = window.Tweakpane.Pane;
      const pane = new Pane({ container: root, title: "Controls" });

      const tab = pane.addTab({
        pages: [{ title: "Type" }, { title: "Look" }, { title: "Motion" }],
      });
      const tType = tab.pages[0];
      const tLook = tab.pages[1];
      const tMotion = tab.pages[2];

      function folderContent(folder) {
        return (
          folder?.element?.querySelector('[class*="fldv_c"]') ||
          folder?.element?.querySelector('[class*="folder"] [class*="content"]') ||
          folder?.element
        );
      }

      // =========================================================
      // Shift+H hide/show
      // =========================================================
      const CONTROLS_KEY = "__tp_controls_hidden";

      function isTypingTarget(el) {
        if (!el) return false;
        const tag = (el.tagName || "").toLowerCase();
        return tag === "input" || tag === "textarea" || el.isContentEditable;
      }

      function setHidden(hidden) {
        const paneEl = document.getElementById("pane");
        if (!paneEl) return;
        paneEl.style.display = hidden ? "none" : "";
        window[CONTROLS_KEY] = hidden;
      }

      function onKeyDown(e) {
        if (!e.shiftKey) return;
        const k = (e.key || "").toLowerCase();
        if (k !== "h") return;
        if (isTypingTarget(e.target)) return;

        e.preventDefault();
        e.stopPropagation();
        setHidden(!window[CONTROLS_KEY]);
      }
      window.addEventListener("keydown", onKeyDown, true);

      // =========================================================
      // TAB RESCUE
      // =========================================================
      function getTabButtons() {
        const row =
          root.querySelector(".tp-tbv_t") || root.querySelector("[class*='tbv_t']");
        if (!row) return [];
        return Array.from(row.querySelectorAll("button"));
      }
      function getPages() {
        return Array.from(root.querySelectorAll(".tp-tbpv, [class*='tbpv']"));
      }
      function activeIndex() {
        const btns = getTabButtons();
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].getAttribute("aria-selected") === "true") return i;
        }
        return 0;
      }
      function activePageLooksEmpty() {
        const pages = getPages();
        if (!pages.length) return false;

        const i = activeIndex();
        const p = pages[i] || pages[0];
        if (!p) return false;

        const h = p.getBoundingClientRect().height;
        if (h > 6) return false;

        const anyVisible = Array.from(p.querySelectorAll("*")).some((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        });
        return !anyVisible;
      }

      const rescueCheck = debounce(() => {
        const idx = activeIndex();
        if (idx === 0) return;

        if (activePageLooksEmpty()) {
          if (rescueUsed) return;
          rescueUsed = true;
          console.warn(TAG, "Tab render glitch detected. Rebuilding pane once (rescue).");
          setTimeout(() => buildEverything(), 0);
        }
      }, 60);

      function attachRescueToTabClicks() {
        const btns = getTabButtons();
        btns.forEach((b) => {
          b.addEventListener("click", () => setTimeout(rescueCheck, 0), {
            passive: true,
          });
        });
        setTimeout(rescueCheck, 80);
      }

      // ---------------------------
      // Canvas
      // ---------------------------
      const fCanvas = tType.addFolder({ title: "Canvas" });
      fCanvas.addBinding(params, "aspect", {
        label: "ratio",
        options: {
          Free: "free",
          "1:1": "1:1",
          "4:5": "4:5",
          "9:16": "9:16",
          "9:18": "9:18",
          "16:9": "16:9",
        },
      });
      fCanvas.addBinding(params, "margin", { label: "margin", min: 0, max: 64, step: 1 });

      // ---------------------------
      // Text
      // ---------------------------
      const fText = tType.addFolder({ title: "Text" });
      const textWrap = document.createElement("div");
      textWrap.className = "tp-custom-text";
      textWrap.innerHTML = `
        <label>Content</label>
        <textarea spellcheck="false"></textarea>
      `;
      const ta = textWrap.querySelector("textarea");
      ta.value = params.text || "";
      folderContent(fText).appendChild(textWrap);

      const onTextInput = debounce(() => {
        params.text = ta.value;
        window.buildText();
        try {
          window.__rebuildZControls?.();
        } catch (e) {}
        try {
          window.__rebuildFaceColorControls?.();
        } catch (e) {}
        if (window.__tp_animPlaying) window.playAnimation();
      }, 60);
      ta.addEventListener("input", onTextInput);

      // ---------------------------
      // Font
      // ---------------------------
      const fFont = tType.addFolder({ title: "Font" });
      const presets = window.FONT_PRESETS || {};
      const presetKeys = Object.keys(presets);
      const presetOptions = {};
      presetKeys.forEach((k) => (presetOptions[k] = k));

      ensureParam(params, "fontSource", "preset");
      ensureParam(params, "fontPreset", presetKeys[0] || "");
      ensureParam(params, "fontUrl", "");

      if (params.fontSource === "preset" && presetKeys.length && !presets[params.fontPreset]) {
        params.fontPreset = presetKeys[0];
      }

      const bSource = fFont.addBinding(params, "fontSource", {
        label: "source",
        options: { Preset: "preset", URL: "url", Upload: "upload" },
      });
      const bPreset = fFont.addBinding(params, "fontPreset", {
        label: "preset",
        options: presetOptions,
      });
      const bUrl = fFont.addBinding(params, "fontUrl", { label: "url" });

      const uploadWrap = document.createElement("div");
      uploadWrap.className = "tp-custom-font";
      uploadWrap.innerHTML = `
        <label>Upload typeface JSON</label>
        <div class="row">
          <button type="button" data-pick>Choose file</button>
          <span class="hint" data-name>None</span>
        </div>
        <input type="file" accept=".json,.typeface.json,application/json" />
        <div class="hint">Must be a THREE typeface JSON (.typeface.json export).</div>
      `;
      const fileInput = uploadWrap.querySelector("input[type=file]");
      const pickBtn = uploadWrap.querySelector("[data-pick]");
      const nameEl = uploadWrap.querySelector("[data-name]");
      pickBtn.addEventListener("click", () => fileInput.click());
      folderContent(fFont).appendChild(uploadWrap);

      fFont.addButton({ title: "Apply font" }).on("click", async () => {
        try {
          await window.applyFontSelection();
          window.buildText();
          try {
            window.__rebuildZControls?.();
          } catch (e) {}
          try {
            window.__rebuildFaceColorControls?.();
          } catch (e) {}
          if (window.__tp_animPlaying) window.playAnimation();
        } catch (e) {
          console.warn(TAG, "apply font failed", e);
          alert("Font load failed. See console.");
        }
      });

      function refreshFontUI() {
        const isPreset = params.fontSource === "preset";
        const isUrl = params.fontSource === "url";
        const isUpload = params.fontSource === "upload";
        bPreset.element.style.display = isPreset ? "" : "none";
        bUrl.element.style.display = isUrl ? "" : "none";
        uploadWrap.style.display = isUpload ? "" : "none";
      }
      refreshFontUI();

      fileInput.addEventListener("change", async () => {
        if (!fileInput.files || !fileInput.files[0]) return;
        const file = fileInput.files[0];
        nameEl.textContent = file.name;

        try {
          const text = await file.text();
          params.fontSource = "upload";
          refreshFontUI();

          let obj;
          try {
            obj = JSON.parse(text);
          } catch (parseErr) {
            console.warn(TAG, "JSON.parse failed:", parseErr);
            alert("That file isn’t valid JSON.");
            return;
          }

          if (!obj || !obj.glyphs) {
            console.warn(TAG, "Not a THREE typeface JSON. Keys:", Object.keys(obj || {}));
            alert(
              "This JSON is not a THREE typeface font (missing 'glyphs'). Convert the font to .typeface.json first."
            );
            return;
          }

          window.setFontFromUploadedJsonText(text);
          window.buildText();
          try {
            window.__rebuildZControls?.();
          } catch (e) {}
          try {
            window.__rebuildFaceColorControls?.();
          } catch (e) {}
          if (window.__tp_animPlaying) window.playAnimation();
        } catch (e) {
          console.warn(TAG, "Upload failed:", e);
          alert("Could not load this font JSON. Check console for details.");
        }
      });

      pane.on("change", (ev) => {
        const k = ev?.target?.key;
        if (!k) return;
        if (k === "fontSource") {
          refreshFontUI();
          return;
        }
      });

      // ---------------------------
      // Typography
      // ---------------------------
      const fTypeControls = tType.addFolder({ title: "Typography" });
      fTypeControls.addBinding(params, "size", { min: 12, max: 140, step: 1 });
      fTypeControls.addBinding(params, "depth", { min: 0, max: 240, step: 1 });
      fTypeControls.addBinding(params, "charSpacing", {
        label: "char spacing",
        min: -30,
        max: 80,
        step: 1,
      });
      fTypeControls.addBinding(params, "lineSpacing", {
        label: "line spacing",
        min: 0.8,
        max: 2.5,
        step: 0.01,
      });
      fTypeControls.addBinding(params, "align", {
        options: { Center: "center", Left: "left", Right: "right" },
      });

      // ---------------------------
// Kerning
// ---------------------------
const fKerning = tType.addFolder({ title: "Kerning" });
fKerning.addBinding(params, "kerningOn", { label: "enabled" });
fKerning.addBinding(params, "kerningStrength", {
  label: "strength",
  min: 0,
  max: 2,
  step: 0.01,
});

const kernWrap = document.createElement("div");
kernWrap.className = "tp-custom-kerning";
kernWrap.innerHTML = `
  <label style="display:block;margin:6px 0 4px;">Pairs (one per line)</label>
  <textarea spellcheck="false" style="width:100%;min-height:120px;resize:vertical;"></textarea>
  <div class="hint" style="opacity:.7;font-size:11px;margin-top:4px;">
    Format: <code>LY:-12</code> (negative = tighter). Comments: <code>#</code> or <code>//</code>
  </div>
`;
const kernTA = kernWrap.querySelector("textarea");
kernTA.value = params.kerningPairsText || "";
folderContent(fKerning).appendChild(kernWrap);

const onKernInput = debounce(() => {
  params.kerningPairsText = kernTA.value;
  window.buildText();
  try {
    window.__rebuildZControls?.();
  } catch (e) {}
  try {
    window.__rebuildFaceColorControls?.();
  } catch (e) {}
  if (window.__tp_animPlaying) window.playAnimation();
}, 80);

kernTA.addEventListener("input", onKernInput);


      // ---------------------------
      // Per-letter Z
      // ---------------------------
      const fCharZ = tType.addFolder({ title: "Per-letter Z" });
      const ZMIN = -200,
        ZMAX = 200,
        ZSTEP = 1;
      let zProxy = {};
      let zBindings = [];
      let zNoGlyphBlade = null;

      function ensureZArray() {
        const n = window.__getCharCount();
        if (!Array.isArray(params.charZOffsets)) params.charZOffsets = [];
        if (params.charZOffsets.length !== n) {
          const next = new Array(n);
          for (let i = 0; i < n; i++) next[i] = Number(params.charZOffsets[i] ?? 0);
          params.charZOffsets = next;
        }
      }
      function syncProxyFromParams() {
  ensureZArray();

  // ✅ do not reassign zProxy (bindings keep old reference)
  for (const k in zProxy) delete zProxy[k];

  for (let i = 0; i < params.charZOffsets.length; i++) {
    zProxy["c" + i] = Number(params.charZOffsets[i] || 0);
  }
}

      function syncParamsFromProxy() {
        for (let i = 0; i < params.charZOffsets.length; i++) {
          params.charZOffsets[i] = Number(zProxy["c" + i] || 0);
        }
      }
      function clearZBindings() {
        for (const b of zBindings) {
          try {
            b.dispose?.();
          } catch (e) {}
        }
        zBindings.length = 0;
        if (zNoGlyphBlade) {
          try {
            zNoGlyphBlade.dispose?.();
          } catch (e) {}
          zNoGlyphBlade = null;
        }
      }
      function rebuildZControls() {
        ensureZArray();
        clearZBindings();
        syncProxyFromParams();
        const n = params.charZOffsets.length;
        if (n === 0) {
          zNoGlyphBlade = fCharZ.addBlade({ view: "text", value: "(No glyphs)" });
          return;
        }
        for (let i = 0; i < n; i++) {
          const b = fCharZ.addBinding(zProxy, "c" + i, {
            label: String(i + 1),
            min: ZMIN,
            max: ZMAX,
            step: ZSTEP,
          });
          b.on("change", () => {
            syncParamsFromProxy();
            window.__applyCharZOffsets();
          });
          zBindings.push(b);
        }
      }

      fCharZ.addButton({ title: "Ramp" }).on("click", () => {
        ensureZArray();
        const n = params.charZOffsets.length;
        if (n <= 1) return;
        const span = 120;
        for (let i = 0; i < n; i++)
          params.charZOffsets[i] = Math.round(lerp(-span, span, i / (n - 1)));
        syncProxyFromParams();
        zBindings.forEach((b) => b.refresh());
        window.__applyCharZOffsets();
      });
      fCharZ.addButton({ title: "Reset" }).on("click", () => {
        ensureZArray();
        params.charZOffsets.fill(0);
        syncProxyFromParams();
        zBindings.forEach((b) => b.refresh());
        window.__applyCharZOffsets();
      });
      fCharZ.addButton({ title: "Random" }).on("click", () => {
        ensureZArray();
        const span = 140;
        for (let i = 0; i < params.charZOffsets.length; i++)
          params.charZOffsets[i] = Math.round((Math.random() * 2 - 1) * span);
        syncProxyFromParams();
        zBindings.forEach((b) => b.refresh());
        window.__applyCharZOffsets();
      });

      window.__rebuildZControls = rebuildZControls;

      // ---------------------------
      // LOOK
      // ---------------------------
      const fBg = tLook.addFolder({ title: "Background" });

      const bBgMode = fBg.addBinding(params, "bgMode", {
        label: "mode",
        options: { Solid: "solid", Gradient: "gradient" },
      });
      const bBgSolid = fBg.addBinding(params, "bgSolid", {
        label: "solid",
        view: "color",
      });

      const fBgGrad = fBg.addFolder({ title: "Gradient" });
      const bBgGradA = fBgGrad.addBinding(params, "bgGradA", { label: "A", view: "color" });
      const bBgGradB = fBgGrad.addBinding(params, "bgGradB", { label: "B", view: "color" });
      const bBgGradAngle = fBgGrad.addBinding(params, "bgGradAngle", {
        label: "angle",
        min: 0,
        max: 360,
        step: 1,
      });
      const bBgGradSoft = fBgGrad.addBinding(params, "bgGradSoft", {
        label: "soft",
        min: 0,
        max: 1,
        step: 0.01,
      });

      function refreshBgUI() {
        const m = params.bgMode;
        bBgSolid.element.style.display = m === "solid" ? "" : "none";
        fBgGrad.element.style.display = m === "gradient" ? "" : "none";
      }
      refreshBgUI();

      function rebuildBg() {
        try {
          window.rebuildBackground?.();
        } catch (e) {}
      }

      [bBgMode, bBgSolid, bBgGradA, bBgGradB, bBgGradAngle, bBgGradSoft].forEach((b) => {
        try {
          b.on("change", () => {
            if (b === bBgMode) refreshBgUI();
            rebuildBg();
          });
        } catch (e) {}
      });

      const fFill = tLook.addFolder({ title: "Fill" });
      const fFace = fFill.addFolder({ title: "Faces" });

      const bFaceMode = fFace.addBinding(params, "faceMode", {
        label: "mode",
        options: {
          Solid: "solid",
          Gradient: "gradient",
          Checker: "checker",
          "Per Letter": "perLetter",
        },
      });

      const bFaceUV = fFace.addBinding(params, "faceUVSpace", {
        label: "UV",
        options: { Glyph: "glyph", World: "world" },
      });

      const bFaceSolid = fFace.addBinding(params, "faceSolid", { view: "color" });

      const bFaceGradA = fFace.addBinding(params, "faceGradA", { label: "A", view: "color" });
      const bFaceStopA = fFace.addBinding(params, "faceStopA", { label: "A stop", min: 0, max: 1, step: 0.01 });
      const bFaceGradB = fFace.addBinding(params, "faceGradB", { label: "B", view: "color" });
      const bFaceStopB = fFace.addBinding(params, "faceStopB", { label: "B stop", min: 0, max: 1, step: 0.01 });
      const bFaceGradC = fFace.addBinding(params, "faceGradC", { label: "C", view: "color" });
      const bFaceStopC = fFace.addBinding(params, "faceStopC", { label: "C stop", min: 0, max: 1, step: 0.01 });
      const bFaceDir = fFace.addBinding(params, "faceGradDir", {
        label: "dir",
        options: { Vertical: "vertical", Horizontal: "horizontal", Diagonal: "diagonal" },
      });

      const fFaceChk = fFace.addFolder({ title: "Face Checker" });
      fFaceChk.addBinding(params, "faceChkScale", { label: "scale", min: 4, max: 200, step: 1 });
      fFaceChk.addBinding(params, "faceChkLineWidth", { label: "line width", min: 0, max: 40, step: 1 });
      fFaceChk.addBinding(params, "faceChkRotate", { label: "rotate", min: 0, max: 360, step: 1 });
      fFaceChk.addBinding(params, "faceChkColorA", { label: "square A", view: "color" });
      fFaceChk.addBinding(params, "faceChkColorB", { label: "square B", view: "color" });
      fFaceChk.addBinding(params, "faceChkLineColor", { label: "line", view: "color" });

      const fPerLetter = fFace.addFolder({ title: "Per-letter Colors" });
      let faceProxy = {};
      let faceBindings = [];
      let faceNoGlyphBlade = null;

      function ensureFaceArray() {
        const n = window.__getCharCount();
        if (!Array.isArray(params.faceLetterColors)) params.faceLetterColors = [];
        if (params.faceLetterColors.length !== n) {
          const next = new Array(n);
          for (let i = 0; i < n; i++) next[i] = String(params.faceLetterColors[i] ?? "#ffffff");
          params.faceLetterColors = next;
        }
      }
      function syncFaceProxyFromParams() {
  ensureFaceArray();

  // ✅ IMPORTANT: do NOT reassign faceProxy (bindings keep old reference)
  // Instead, mutate the existing object in-place.
  for (const k in faceProxy) delete faceProxy[k];

  for (let i = 0; i < params.faceLetterColors.length; i++) {
    faceProxy["c" + i] = String(params.faceLetterColors[i] || "#ffffff");
  }
}

      function syncFaceParamsFromProxy() {
        for (let i = 0; i < params.faceLetterColors.length; i++) {
          params.faceLetterColors[i] = String(faceProxy["c" + i] || "#ffffff");
        }
      }
      function clearFaceBindings() {
        for (const b of faceBindings) {
          try {
            b.dispose?.();
          } catch (e) {}
        }
        faceBindings.length = 0;
        if (faceNoGlyphBlade) {
          try {
            faceNoGlyphBlade.dispose?.();
          } catch (e) {}
          faceNoGlyphBlade = null;
        }
      }
      function rebuildFaceColorControls() {
        ensureFaceArray();
        clearFaceBindings();
        syncFaceProxyFromParams();
        const n = params.faceLetterColors.length;
        if (n === 0) {
          faceNoGlyphBlade = fPerLetter.addBlade({ view: "text", value: "(No glyphs)" });
          return;
        }
        for (let i = 0; i < n; i++) {
          const b = fPerLetter.addBinding(faceProxy, "c" + i, {
            label: String(i + 1),
            view: "color",
          });
          b.on("change", () => {
            syncFaceParamsFromProxy();
            try {
              window.__applyPerLetterFaceMats?.();
            } catch (e) {}
          });
          faceBindings.push(b);
        }
      }
      window.__rebuildFaceColorControls = rebuildFaceColorControls;

      fPerLetter.addButton({ title: "Randomize" }).on("click", () => {
        ensureFaceArray();
        for (let i = 0; i < params.faceLetterColors.length; i++) {
          const r = Math.floor(Math.random() * 255).toString(16).padStart(2, "0");
          const g = Math.floor(Math.random() * 255).toString(16).padStart(2, "0");
          const b = Math.floor(Math.random() * 255).toString(16).padStart(2, "0");
          params.faceLetterColors[i] = `#${r}${g}${b}`;
        }
        syncFaceProxyFromParams();
        faceBindings.forEach((b) => b.refresh());
        try {
          window.__applyPerLetterFaceMats?.();
        } catch (e) {}
      });
      fPerLetter.addButton({ title: "Reset" }).on("click", () => {
        ensureFaceArray();
        params.faceLetterColors.fill("#ffffff");
        syncFaceProxyFromParams();
        faceBindings.forEach((b) => b.refresh());
        try {
          window.__applyPerLetterFaceMats?.();
        } catch (e) {}
      });

      function refreshFaceUI() {
        const m = params.faceMode;
        bFaceUV.element.style.display = m === "gradient" ? "" : "none";
        bFaceSolid.element.style.display = m === "solid" ? "" : "none";

        const gradOn = m === "gradient";
        [bFaceGradA, bFaceStopA, bFaceGradB, bFaceStopB, bFaceGradC, bFaceStopC, bFaceDir].forEach(
          (b) => (b.element.style.display = gradOn ? "" : "none")
        );

        fFaceChk.element.style.display = m === "checker" ? "" : "none";
        fPerLetter.element.style.display = m === "perLetter" ? "" : "none";
      }
      refreshFaceUI();

      const fSide = fFill.addFolder({ title: "Extrusion" });
      fSide.addBinding(params, "sideMode", { label: "mode", options: { Solid: "solid", Gradient: "gradient" } });
      fSide.addBinding(params, "sideUVSpace", { label: "UV", options: { Glyph: "glyph", World: "world" } });
      fSide.addBinding(params, "sideSolid", { view: "color" });
      fSide.addBinding(params, "sideGradA", { label: "A", view: "color" });
      fSide.addBinding(params, "sideStopA", { label: "A stop", min: 0, max: 1, step: 0.01 });
      fSide.addBinding(params, "sideGradB", { label: "B", view: "color" });
      fSide.addBinding(params, "sideStopB", { label: "B stop", min: 0, max: 1, step: 0.01 });
      fSide.addBinding(params, "sideGradC", { label: "C", view: "color" });
      fSide.addBinding(params, "sideStopC", { label: "C stop", min: 0, max: 1, step: 0.01 });
      fSide.addBinding(params, "sideGradDir", {
        label: "dir",
        options: { Vertical: "vertical", Horizontal: "horizontal", Diagonal: "diagonal" },
      });

      const fGrad = tLook.addFolder({ title: "Gradient Animation" });
      const fFaceGrad = fGrad.addFolder({ title: "Faces" });
      fFaceGrad.addBinding(params, "faceGradAnimOn", { label: "enabled" });
      fFaceGrad.addBinding(params, "faceGradSpeed", { label: "speed", min: 0, max: 0.25, step: 0.005 });
      fFaceGrad.addBinding(params, "faceGradAngle", { label: "angle", min: 0, max: 360, step: 1 });

      const fSideGrad = fGrad.addFolder({ title: "Extrusion" });
      fSideGrad.addBinding(params, "sideGradAnimOn", { label: "enabled" });
      fSideGrad.addBinding(params, "sideGradSpeed", { label: "speed", min: 0, max: 0.25, step: 0.005 });
      fSideGrad.addBinding(params, "sideGradAngle", { label: "angle", min: 0, max: 360, step: 1 });

      const fBright = tLook.addFolder({ title: "Brightness" });
      fBright.addBinding(params, "faceBright", { label: "face", min: 0, max: 3, step: 0.01 });
      fBright.addBinding(params, "sideBright", { label: "extrusion", min: 0, max: 3, step: 0.01 });

      const fStroke = tLook.addFolder({ title: "Stroke" });
      fStroke.addBinding(params, "stroke", { view: "color" });
      fStroke.addBinding(params, "strokeWidth", { label: "width", min: 0, max: 12, step: 1 });
      fStroke.addBinding(params, "edgeThreshold", { label: "edge detect", min: 0, max: 30, step: 0.5 });
      fStroke.addBinding(params, "strokeFacesOnly", { label: "faces only" });

      const fFx = tLook.addFolder({ title: "Effects" });
      const fHalf = fFx.addFolder({ title: "Halftone" });
      fHalf.addBinding(params, "halftoneOn", { label: "enabled" });
      fHalf.addBinding(params, "halftoneTarget", { label: "target", options: { Both: "both", Faces: "face", Extrusion: "side" } });
      fHalf.addBinding(params, "halftoneScale", { label: "scale", min: 10, max: 400, step: 1 });
      fHalf.addBinding(params, "halftoneAngle", { label: "angle", min: 0, max: 90, step: 1 });
      fHalf.addBinding(params, "halftoneStrength", { label: "strength", min: 0, max: 1, step: 0.01 });
      fHalf.addBinding(params, "halftoneSoftness", { label: "soft", min: 0.01, max: 0.49, step: 0.01 });

      const fGr = tLook.addFolder({ title: "Grain" });
      fGr.addBinding(params, "grainOn", { label: "enabled" });
      fGr.addBinding(params, "grainTarget", { label: "target", options: { Both: "both", Faces: "face", Extrusion: "side" } });
      fGr.addBinding(params, "grainAmount", { label: "amount", min: 0, max: 0.6, step: 0.01 });
      fGr.addBinding(params, "grainScale", { label: "scale", min: 20, max: 900, step: 1 });
      fGr.addBinding(params, "grainSpeed", { label: "speed", min: 0, max: 2, step: 0.01 });

      const fLight = tLook.addFolder({ title: "Lighting" });
      fLight.addBinding(params, "lightingMode", { options: { Accurate: "accurate", Studio: "studio" } });

      const fCam = tLook.addFolder({ title: "Camera" });
      fCam.addBinding(params, "cameraPreset", { options: { Front: "front", "Iso Left": "isoLeft", "Iso Right": "isoRight" } });
      fCam.addButton({ title: "Apply preset" }).on("click", () => window.applyCameraPreset());
      fCam.addButton({ title: "Reframe" }).on("click", () => window.reframeToText());


 // ---------------------------
      // physics
      // ---------------------------

      const fCollide = tMotion.addFolder({ title: "Collisions" });
fCollide.addBinding(params, "collideOn", { label: "enabled" });
fCollide.addBinding(params, "collidePadding", { label: "padding", min: 0, max: 30, step: 0.5 });
fCollide.addBinding(params, "collideStrength", { label: "strength", min: 0, max: 2, step: 0.01 });
fCollide.addBinding(params, "collideIters", { label: "iters", min: 0, max: 6, step: 1 });
fCollide.addBinding(params, "collideMaxShift", { label: "max shift", min: 0, max: 200, step: 1 });
fCollide.addBinding(params, "collideGrid", { label: "grid accel" });

      // ---------------------------
      // Motion
      // ---------------------------
      const fAnim = tMotion.addFolder({ title: "Animation" });
      fAnim.addBinding(params, "animPreset", {
        label: "preset",
        options: {
          Depth: "depth",
          Twist: "twist",
          Inflate: "inflate",
          Spin: "spin",
          Explode: "explode",

        },
      });
      fAnim.addBinding(params, "animSpeed", { label: "speed", min: 0.1, max: 4, step: 0.05 });
      fAnim.addBinding(params, "animStagger", { label: "stagger", min: 0, max: 0.3, step: 0.005 });
      fAnim.addBinding(params, "animEase", {
        label: "ease",
        options: {
          "power2.inOut": "power2.inOut",
          "sine.inOut": "sine.inOut",
          "expo.inOut": "expo.inOut",
          "elastic.out(1,0.35)": "elastic.out(1,0.35)",
          "steps(6)": "steps(6)",
        },
      });
      fAnim.addBinding(params, "animLoop", { label: "loop" });
      fAnim.addBinding(params, "animStaggerMode", { label: "stagger by", options: { Character: "char", Word: "word", Line: "line" } });
      fAnim.addBinding(params, "animStaggerFrom", { label: "direction", options: { Start: "start", End: "end", Center: "center", Edges: "edges", Random: "random" } });
      fAnim.addBinding(params, "animMinPct", { label: "min % depth", min: 0, max: 100, step: 1 });
      fAnim.addBinding(params, "animMaxPct", { label: "max % depth", min: 0, max: 200, step: 1 });
      fAnim.addBinding(params, "animAxis", { label: "axis", options: { X: "x", Y: "y", Z: "z" } });
      fAnim.addBinding(params, "animRotateDeg", { label: "rotate deg", min: 0, max: 180, step: 1 });
      fAnim.addBinding(params, "animInflate", { label: "inflate", min: 0, max: 0.6, step: 0.01 });
      fAnim.addBinding(params, "animAlsoDepth", { label: "also depth" });

      const fPresetEx = tMotion.addFolder({ title: "Preset Tuning" });
      fPresetEx.addBinding(params, "animSpinDeg", { label: "spin deg", min: 0, max: 1440, step: 5 });




      // ------------------------------------------------------------
// Explode (Preset Tuning folder)
// ------------------------------------------------------------
const fExplode = fPresetEx.addFolder({ title: "Explode" });

// Distance / field
fExplode.addBinding(params, "animExplodeAmount", { label: "distance", min: 0, max: 900, step: 5 });
fExplode.addBinding(params, "animExplodeAngleOffset", { label: "field angle", min: 0, max: 360, step: 1 });

// Ellipse / diameter controls
fExplode.addBinding(params, "animExplodeDiameter", { label: "diam master", min: 0, max: 3, step: 0.01 });
fExplode.addBinding(params, "animExplodeDiameterX", { label: "diam X", min: 0.1, max: 3, step: 0.01 });
fExplode.addBinding(params, "animExplodeDiameterY", { label: "diam Y", min: 0.1, max: 3, step: 0.01 });

// Shape (IMPORTANT: values must match core: burst|ring|sphere|linex|liney)
fExplode.addBinding(params, "animExplodeShape", {
  label: "shape",
  options: {
    Burst: "burst",
    Ring: "ring",
    Sphere: "sphere",
    "Line X": "linex",
    "Line Y": "liney",
  },
});
fExplode.addBinding(params, "animExplodeRingAngle", { label: "ring angle", min: 0, max: 360, step: 1 });


fExplode.addBinding(params, "animExplodeImpactPreset", {
  label: "impact preset",
  options: {
    Center: "center",
    "Top Left": "tl",
    "Top Right": "tr",
    "Bottom Left": "bl",
    "Bottom Right": "br",
  },
}).on("change", () => {
  const p = params.animExplodeImpactPreset;

  // normalized -1..1 space
  const map = {
    center: [0, 0],
    tl: [-0.8, -0.8],
    tr: [0.8, -0.8],
    bl: [-0.8, 0.8],
    br: [0.8, 0.8],
  };

  const v = map[p] || [0, 0];
  params.animExplodeImpactX = v[0];
  params.animExplodeImpactY = v[1];

  // keep UI in sync
  pane.refresh();

  if (window.__tp_animPlaying) window.playAnimation();
});


// Z controls
fExplode.addBinding(params, "animExplodeZAmount", { label: "Z amt", min: -400, max: 400, step: 1 });
fExplode.addBinding(params, "animExplodeZSpread", { label: "Z spread", min: 0, max: 2, step: 0.01 });

// Noise / randomness
fExplode.addBinding(params, "animExplodeNoise", { label: "noise", min: 0, max: 1, step: 0.01 });

// Rotation (base + variance)
fExplode.addBinding(params, "animExplodeRotAxis", {
  label: "rot axis",
  options: { X: "x", Y: "y", Z: "z", Random: "random" },
});
fExplode.addBinding(params, "animExplodeRandomDir", { label: "random dir" });

// Keep your existing single value (still useful), but ALSO add variance controls
fExplode.addBinding(params, "animExplodeRotDeg", { label: "rot deg (legacy)", min: 0, max: 720, step: 5 });
fExplode.addBinding(params, "animExplodeRotMinDeg", { label: "rot min", min: 0, max: 720, step: 1 });
fExplode.addBinding(params, "animExplodeRotMaxDeg", { label: "rot max", min: 0, max: 720, step: 1 });

// Impact (mass hit)
const fImpact = fExplode.addFolder({ title: "Impact" });
fImpact.addBinding(params, "animExplodeImpactOn", { label: "enabled" });
fImpact.addBinding(params, "animExplodeImpactDir", {
  label: "dir",
  options: {
    Front: "front",
    Back: "back",
    Left: "left",
    Right: "right",
  },
});
fImpact.addBinding(params, "animExplodeImplode", { label: "implode" });

fImpact.addBinding(params, "animExplodeImpactStrength", { label: "strength", min: 0, max: 3, step: 0.01 });
fImpact.addBinding(params, "animExplodeImpactRadius", { label: "radius", min: 20, max: 1200, step: 5 });
fImpact.addBinding(params, "animExplodeImpactFalloff", { label: "falloff", min: 0.2, max: 6, step: 0.05 });

fImpact.addBinding(params, "animExplodeImpactProfile", {
  label: "profile",
  options: { Center: "center", Edge: "edge" },
});

fImpact.addBinding(params, "animExplodeImpactMix", {
  label: "impact mix",
  min: 0,
  max: 1,
  step: 0.01,
});


fImpact.addBinding(params, "animExplodeImpactX", { label: "center X", min: -1, max: 1, step: 0.01 });
fImpact.addBinding(params, "animExplodeImpactY", { label: "center Y", min: -1, max: 1, step: 0.01 });

fImpact.addBinding(params, "animExplodeImpactZPush", { label: "Z push", min: 0, max: 600, step: 5 });
fImpact.addBinding(params, "animExplodeImpactRadialBoost", { label: "radial boost", min: 0, max: 2, step: 0.01 });

// Timing + easing (OUT / RETURN)
const fTiming = fExplode.addFolder({ title: "Timing + Ease" });
fTiming.addBinding(params, "animExplodeHold", { label: "hold (out)", min: 0, max: 3, step: 0.01 });
fTiming.addBinding(params, "animExplodeReturn", { label: "return" });
fTiming.addBinding(params, "animExplodeReturnHold", { label: "hold (return)", min: 0, max: 3, step: 0.01 });

fTiming.addBinding(params, "animExplodeEaseOut", {
  label: "ease out",
  options: {
    "expo.out": "expo.out",
    "power4.out": "power4.out",
    "power3.out": "power3.out",
    "sine.out": "sine.out",
    "circ.out": "circ.out",
  },
});

fTiming.addBinding(params, "animExplodeEaseIn", {
  label: "ease in",
  options: {
    "expo.in": "expo.in",
    "expo.inOut": "expo.inOut",
    "power4.in": "power4.in",
    "power3.in": "power3.in",
    "sine.in": "sine.in",
    "circ.in": "circ.in",
  },
});

// Optional anti-clipping helper (scale-down during explode)
const fClip = fExplode.addFolder({ title: "Anti-clipping" });
fClip.addBinding(params, "animExplodeClipScaleOn", { label: "scale down" });
fClip.addBinding(params, "animExplodeClipScaleDown", { label: "amount", min: 0, max: 0.4, step: 0.005 });


      

      fAnim.addButton({ title: "Play" }).on("click", () => {
        window.__tp_animPlaying = true;
        window.playAnimation();
      });
      fAnim.addButton({ title: "Stop" }).on("click", () => {
        window.__tp_animPlaying = false;
        window.stopAnimation();
      });

      
      const fIdle = tMotion.addFolder({ title: "Idle Wave" });
      fIdle.addBinding(params, "waveOn", { label: "enabled" });
      fIdle.addBinding(params, "waveBy", { label: "by", options: { X: "x", Line: "line" } });
      fIdle.addBinding(params, "waveSpeed", { label: "speed", min: 0, max: 2, step: 0.01 });
      fIdle.addBinding(params, "waveAmpY", { label: "amp Y", min: 0, max: 40, step: 1 });
      fIdle.addBinding(params, "waveRotDeg", { label: "rot deg", min: 0, max: 25, step: 1 });
      fIdle.addBinding(params, "waveFreq", { label: "freq", min: 0.01, max: 0.3, step: 0.01 });

      const fBreath = tMotion.addFolder({ title: "Breathing Extrusion" });
      fBreath.addBinding(params, "breathOn", { label: "enabled" });
      fBreath.addBinding(params, "breathSpeed", { label: "speed", min: 0, max: 2, step: 0.01 });
      fBreath.addBinding(params, "breathAmount", { label: "amount", min: 0, max: 0.2, step: 0.005 });

      const fHover = tMotion.addFolder({ title: "Hover" });
      fHover.addBinding(params, "hoverMode", {
        label: "mode",
        options: {
          Lift: "lift",
          Rotate: "rotate",
          Tilt: "tilt",
          Pulse: "pulse",
          Repel: "repel",
          "Spin360 (Enter 360°)": "spin360",
          Explode: "explode",
          None: "none",
        },
      });
      fHover.addBinding(params, "proximityLift", { label: "enabled" });
      fHover.addBinding(params, "proximityRadiusWorld", { label: "radius", min: 10, max: 800, step: 1 });
      fHover.addBinding(params, "proximityLiftAmount", { label: "lift", min: 0, max: 400, step: 1 });
      fHover.addBinding(params, "hoverRotateDeg", { label: "rotate", min: 0, max: 180, step: 1 });
      fHover.addBinding(params, "hoverTiltDeg", { label: "tilt", min: 0, max: 90, step: 1 });
      fHover.addBinding(params, "hoverPulse", { label: "pulse", min: 0, max: 0.8, step: 0.01 });

      const fHover360 = tMotion.addFolder({ title: "Hover Spin360 (mode: Spin360)" });
      fHover360.addBinding(params, "hoverSpin360Axis", { label: "axis", options: { X: "x", Y: "y", Z: "z", Random: "random" } });
      fHover360.addBinding(params, "hoverSpin360RandomDir", { label: "random dir" });
      fHover360.addBinding(params, "hoverSpin360BaseDur", { label: "base dur", min: 0.05, max: 2.0, step: 0.01 });
      fHover360.addBinding(params, "hoverSpin360SpeedScale", { label: "speed scale", min: 0, max: 0.02, step: 0.0005 });
      fHover360.addBinding(params, "hoverSpin360MinDur", { label: "min dur", min: 0.03, max: 1.5, step: 0.01 });
      fHover360.addBinding(params, "hoverSpin360MaxDur", { label: "max dur", min: 0.05, max: 3.0, step: 0.01 });
      fHover360.addBinding(params, "hoverSpin360Ease", {
        label: "ease",
        options: {
          "power3.out": "power3.out",
          "power2.out": "power2.out",
          "expo.out": "expo.out",
          "sine.out": "sine.out",
          "back.out(1.4)": "back.out(1.4)",
        },
      });
      fHover360.addBinding(params, "hoverSpin360MinHoverF", { label: "min hover", min: 0, max: 1, step: 0.01 });
      fHover360.addBinding(params, "hoverSpin360Lift", { label: "lift %", min: 0, max: 0.6, step: 0.01 });

      fHover.addBinding(params, "proximityFalloff", {
        label: "falloff",
        options: { linear: "linear", quadratic: "quadratic", smooth: "smooth" },
      });
      fHover.addBinding(params, "cursorSmoothing", {
        label: "cursor smooth",
        min: 0,
        max: 0.98,
        step: 0.01,
      });
      fHover.addBinding(params, "liftSmoothing", { label: "smooth", min: 0.01, max: 0.6, step: 0.01 });

      const fRepel = fHover.addFolder({ title: "Repel" });
      fRepel.addBinding(params, "repelAmount", { label: "amount", min: 0, max: 400, step: 1 });
      fRepel.addBinding(params, "repelMinDistance", { label: "min dist", min: 0.1, max: 40, step: 0.1 });
      fRepel.addBinding(params, "repelClamp", { label: "clamp", min: 0, max: 600, step: 1 });

      const fMag = tMotion.addFolder({ title: "Magnetic Sweep" });
      fMag.addBinding(params, "magneticSweepOn", { label: "enabled" });
      fMag.addBinding(params, "sweepAmount", { label: "amount", min: 0, max: 120, step: 1 });
      fMag.addBinding(params, "sweepBias", { label: "bias", min: 0, max: 2, step: 0.01 });
      fMag.addBinding(params, "sweepYMix", { label: "Y mix", min: 0, max: 1, step: 0.01 });

      const fHeat = tMotion.addFolder({ title: "Heat Bloom" });
      fHeat.addBinding(params, "heatBloomOn", { label: "enabled" });
      fHeat.addBinding(params, "heatRadiusWorld", { label: "radius", min: 40, max: 520, step: 1 });
      fHeat.addBinding(params, "heatSoftness", { label: "soft", min: 0, max: 1, step: 0.01 });
      fHeat.addBinding(params, "heatBrightBoost", { label: "bright", min: 0, max: 1.5, step: 0.01 });
      fHeat.addBinding(params, "heatGrainBoost", { label: "grain boost", min: 0, max: 3, step: 0.01 });
      fHeat.addBinding(params, "heatHalfBoost", { label: "half boost", min: 0, max: 3, step: 0.01 });

      // ---------------------------
      // Routing
      // ---------------------------
      const FX_KEYS = new Set([
        "halftoneOn",
        "halftoneTarget",
        "halftoneScale",
        "halftoneAngle",
        "halftoneStrength",
        "halftoneSoftness",
        "grainOn",
        "grainTarget",
        "grainAmount",
        "grainScale",
        "grainSpeed",
        "faceBright",
        "sideBright",
        "heatBloomOn",
        "heatRadiusWorld",
        "heatSoftness",
        "heatBrightBoost",
        "heatGrainBoost",
        "heatHalfBoost",
      ]);

      const REBUILD_KEYS = new Set([
        "aspect",
        "margin",
        "size",
        "depth",
        "charSpacing",
        "lineSpacing",
        "align",
        "faceMode",
        "faceUVSpace",
        "faceSolid",
        "faceGradA",
        "faceGradB",
        "faceGradC",
        "faceStopA",
        "faceStopB",
        "faceStopC",
        "faceGradDir",
        "faceChkScale",
        "faceChkLineWidth",
        "faceChkRotate",
        "faceChkColorA",
        "faceChkColorB",
        "faceChkLineColor",
        "sideMode",
        "sideUVSpace",
        "sideSolid",
        "sideGradA",
        "sideGradB",
        "sideGradC",
        "sideStopA",
        "sideStopB",
        "sideStopC",
        "sideGradDir",
        "stroke",
        "strokeWidth",
        "edgeThreshold",
        "strokeFacesOnly",
        "lightingMode",
        "kerningOn",
        "kerningStrength",
        "kerningPairsText",

      ]);

      const ANIM_KEYS = new Set([
        "animExplodeImpactOn",
"animExplodeImpactDir",
"animExplodeImplode",
"animExplodeImpactStrength",
"animExplodeImpactRadius",
"animExplodeImpactFalloff",
"animExplodeImpactX",
"animExplodeImpactY",
"animExplodeImpactZPush",
"animExplodeImpactRadialBoost",
        "animExplodeHold",
"animExplodeReturn",
"animExplodeReturnHold",
"animExplodeEaseOut",
"animExplodeEaseIn",
"animExplodeRotMinDeg",
"animExplodeRotMaxDeg",
"animExplodeImpactMix",
"animExplodeImpactProfile",


        
        "animPreset",
        "animSpeed",
        "animStagger",
        "animMinPct",
        "animMaxPct",
        "animEase",
        "animLoop",
        "animStaggerMode",
        "animStaggerFrom",
        "animRotateDeg",
        "animInflate",
        "animAlsoDepth",
        "animAxis",
        "animSpinDeg",

        // explode upgraded keys
        "animExplodeAmount",
        "animExplodeDiameterX",
        "animExplodeDiameterY",
        "animExplodeDiameter", // NEW
        "animExplodeShape", // NEW
        "animExplodeRingAngle", // NEW
        "animExplodeNoise", // NEW
        "animExplodeAngleOffset",
        "animExplodeZAmount",
        "animExplodeZSpread", // NEW
        "animExplodeRotDeg",
        "animExplodeRotAxis",
        "animExplodeRandomDir",
      ]);

      const HOVER_KEYS = new Set([
        "hoverMode",
        "proximityLift",
        "proximityRadiusWorld",
        "proximityLiftAmount",
        "hoverRotateDeg",
        "hoverTiltDeg",
        "hoverPulse",
        "proximityFalloff",
        "cursorSmoothing",
        "liftSmoothing",
        "repelAmount",
        "repelMinDistance",
        "repelClamp",
    
        // spin360 enter 360
        "hoverSpin360Axis",
        "hoverSpin360RandomDir",
        "hoverSpin360BaseDur",
        "hoverSpin360SpeedScale",
        "hoverSpin360MinDur",
        "hoverSpin360MaxDur",
        "hoverSpin360Ease",
        "hoverSpin360MinHoverF",
        "hoverSpin360Lift",
      ]);

      const GRAD_ANIM_KEYS = new Set([
        "faceGradAnimOn",
        "faceGradSpeed",
        "faceGradAngle",
        "sideGradAnimOn",
        "sideGradSpeed",
        "sideGradAngle",
      ]);

      pane.on("change", (ev) => {
        const k = ev?.target?.key;
        if (!k) return;

        if (k === "fontSource" || k === "fontPreset" || k === "fontUrl") return;

        if (k === "faceMode") {
          refreshFaceUI();
          setTimeout(() => {
            try {
              rebuildFaceColorControls();
            } catch (e) {}
          }, 0);
        }

        if (
          k === "bgMode" ||
          k === "bgSolid" ||
          k === "bgGradA" ||
          k === "bgGradB" ||
          k === "bgGradAngle" ||
          k === "bgGradSoft"
        ) {
          refreshBgUI();
          rebuildBg();
          return;
        }

        if (FX_KEYS.has(k)) {
          window._syncFXUniforms();
          return;
        }
        if (GRAD_ANIM_KEYS.has(k)) {
          return;
        }

        if (k === "cameraPreset") {
          window.applyCameraPreset();
          return;
        }

        if (HOVER_KEYS.has(k)) {
          return;
        }

        if (ANIM_KEYS.has(k)) {
          if (window.__tp_animPlaying) window.playAnimation();
          return;
        }

        if (k === "faceLetterColors") {
          try {
            window.__applyPerLetterFaceMats?.();
          } catch (e) {}
          return;
        }

        if (REBUILD_KEYS.has(k)) {
          if (k === "lightingMode") window.applyLightingMode();
          window.rebuildFillMaterials();
          window.buildText();
          try {
            window.__rebuildZControls?.();
          } catch (e) {}
          try {
            window.__rebuildFaceColorControls?.();
          } catch (e) {}
          if (window.__tp_animPlaying) window.playAnimation();
          return;
        }
      });

      // Initial build
      window.buildText();
      window._syncFXUniforms();

      // Build per-letter controls after text exists
      rebuildZControls();
      rebuildFaceColorControls();

          attachRescueToTabClicks();

      window.__tp_ui_cleanup = () => {
        try {
          ta.removeEventListener("input", onTextInput);
        } catch (e) {}

        try {
          kernTA.removeEventListener("input", onKernInput);
        } catch (e) {}

        try {
          window.removeEventListener("keydown", onKeyDown, true);
        } catch (e) {}

        try {
          pane.dispose();
        } catch (e) {}
      };
    } // end buildEverything

    // build once on mount
    buildEverything();
  } // end mountUI
})();

















