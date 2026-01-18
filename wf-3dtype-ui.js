// wf-3dtype-ui.js (CLEAN SLATE v1)
(function () {
  const TAG = "[3DType/UI]";
  const UI_VERSION = "ui_clean_v1_text_font_look_explode_only";
  console.log(TAG, UI_VERSION);
  window.__WF_3DTYPE_UI_VERSION__ = UI_VERSION;

  const wait = (cond, ms = 40, limit = 400) =>
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
          rej(new Error("UI timed out waiting for deps."));
        }
      }, ms);
    });

  function debounce(fn, ms = 120) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  wait(
    () =>
      window.Tweakpane &&
      window.params &&
      window.buildText &&
      window.playAnimation &&
      window.stopAnimation &&
      window.rebuildLook &&
      window.FONT_PRESETS &&
      (document.getElementById("pane") || document.body),
    40,
    650
  )
    .then(() => mountUI())
    .catch((err) => console.warn(TAG, err.message));

  function mountUI() {
    const host = document.getElementById("pane") || document.body;

    // replace any previous
    const prev = document.getElementById("__tp_root");
    if (prev) prev.remove();

    const root = document.createElement("div");
    root.id = "__tp_root";
    root.style.position = host === document.body ? "fixed" : "relative";
    root.style.top = host === document.body ? "16px" : "";
    root.style.right = host === document.body ? "16px" : "";
    root.style.width = host === document.body ? "320px" : "100%";
    root.style.zIndex = "9999";
    host.appendChild(root);

    const params = window.params;

    // Ensure minimal keys exist
    function ensureParam(k, v) {
      if (!(k in params)) params[k] = v;
    }

    ensureParam("text", "EXPLODE\nME");
    ensureParam("fontPreset", "Helvetiker");
    ensureParam("size", 72);
    ensureParam("depth", 24);
    ensureParam("charSpacing", 6);
    ensureParam("lineHeight", 1.05);

    ensureParam("bgSolid", "#111111");
    ensureParam("faceSolid", "#ffffff");
    ensureParam("sideSolid", "#ffffff");

    ensureParam("animSpeed", 1.15);
    ensureParam("animHold", 0.25);
    ensureParam("animReturn", true);
    ensureParam("animLoop", true);

    ensureParam("explodeDistance", 220);
    ensureParam("explodeRadialBoost", 0.85);
    ensureParam("explodeEdgeGain", 0.65);
    ensureParam("explodeJitter", 0.08);
    ensureParam("explodeDebug", false);

    const Pane = window.Tweakpane.Pane;
    const pane = new Pane({ container: root, title: "Controls (Clean)" });

    // Tabs
    const tab = pane.addTab({
      pages: [{ title: "Type" }, { title: "Look" }, { title: "Explode" }],
    });

    const tType = tab.pages[0];
    const tLook = tab.pages[1];
    const tExplode = tab.pages[2];

    // ---------------------------
    // TYPE
    // ---------------------------
    const fText = tType.addFolder({ title: "Text" });

    // custom textarea
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <label style="display:block;margin:6px 0 4px;opacity:.8;">Content</label>
      <textarea spellcheck="false" style="width:100%;min-height:120px;resize:vertical;"></textarea>
    `;
    const ta = wrap.querySelector("textarea");
    ta.value = params.text || "";
    fText.element.appendChild(wrap);

    const onTextInput = debounce(() => {
      params.text = ta.value;
      window.buildText();
      if (window.__tp_animPlaying) window.playAnimation();
    }, 120);
    ta.addEventListener("input", onTextInput);

    const fFont = tType.addFolder({ title: "Font" });
    const presetKeys = Object.keys(window.FONT_PRESETS || {});
    const presetOptions = {};
    presetKeys.forEach((k) => (presetOptions[k] = k));

    fFont.addBinding(params, "fontPreset", {
      label: "preset",
      options: presetOptions,
    }).on("change", async () => {
      await window.applyFontSelection?.();
      await window.buildText?.();
      if (window.__tp_animPlaying) window.playAnimation();
    });

    const fType = tType.addFolder({ title: "Typography" });
    fType.addBinding(params, "size", { label: "size", min: 12, max: 160, step: 1 }).on("change", rebuildAndReplay);
    fType.addBinding(params, "depth", { label: "depth", min: 0, max: 200, step: 1 }).on("change", rebuildAndReplay);
    fType.addBinding(params, "charSpacing", { label: "char spacing", min: -20, max: 80, step: 1 }).on("change", rebuildAndReplay);
    fType.addBinding(params, "lineHeight", { label: "line height", min: 0.7, max: 2.2, step: 0.01 }).on("change", rebuildAndReplay);

    function rebuildAndReplay() {
      window.buildText();
      if (window.__tp_animPlaying) window.playAnimation();
    }

    // ---------------------------
    // LOOK (minimal: background + face + extrusion)
    // ---------------------------
    const fBg = tLook.addFolder({ title: "Background" });
    fBg.addBinding(params, "bgSolid", { label: "color", view: "color" }).on("change", () => window.rebuildLook());

    const fFill = tLook.addFolder({ title: "Fill" });
    fFill.addBinding(params, "faceSolid", { label: "faces", view: "color" }).on("change", () => window.rebuildLook());
    fFill.addBinding(params, "sideSolid", { label: "extrusion", view: "color" }).on("change", () => window.rebuildLook());

    // ---------------------------
    // EXPLODE (only animation)
    // ---------------------------
    const fAnim = tExplode.addFolder({ title: "Animation" });
    fAnim.addBinding(params, "animSpeed", { label: "speed", min: 0.05, max: 3, step: 0.05 }).on("change", replayIfPlaying);
    fAnim.addBinding(params, "animHold", { label: "hold", min: 0, max: 2, step: 0.01 }).on("change", replayIfPlaying);
    fAnim.addBinding(params, "animReturn", { label: "return" }).on("change", replayIfPlaying);
    fAnim.addBinding(params, "animLoop", { label: "loop" }).on("change", replayIfPlaying);

    const fExp = tExplode.addFolder({ title: "Explode Tuning" });
    fExp.addBinding(params, "explodeDistance", { label: "distance", min: 0, max: 900, step: 5 }).on("change", replayIfPlaying);
    fExp.addBinding(params, "explodeRadialBoost", { label: "radial boost", min: 0, max: 3, step: 0.01 }).on("change", replayIfPlaying);
    fExp.addBinding(params, "explodeEdgeGain", { label: "edge gain", min: 0, max: 3, step: 0.01 }).on("change", replayIfPlaying);
    fExp.addBinding(params, "explodeJitter", { label: "jitter", min: 0, max: 0.8, step: 0.01 }).on("change", replayIfPlaying);
    fExp.addBinding(params, "explodeDebug", { label: "debug center" }).on("change", () => {
      // no need to replay; render loop will reflect
    });

    const row = tExplode.addFolder({ title: "Controls" });
    row.addButton({ title: "Play" }).on("click", () => {
      window.__tp_animPlaying = true;
      window.playAnimation();
    });
    row.addButton({ title: "Stop" }).on("click", () => {
      window.__tp_animPlaying = false;
      window.stopAnimation();
    });

    function replayIfPlaying() {
      if (window.__tp_animPlaying) window.playAnimation();
    }
  }
})();
