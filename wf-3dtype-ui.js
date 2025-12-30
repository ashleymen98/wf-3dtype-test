// wf-3dtype-ui.js
(function(){
  const TAG="[3DType/UI]";

  // ---------------------------
  // Version stamp (helps detect cache)
  // ---------------------------
  const UI_VERSION = "ui_v9_scrollfix+bg+faceChecker+repel+heat";
  console.log(TAG, UI_VERSION, "core:", window.__WF_3DTYPE_CORE_VERSION__ || "(unknown)");
  window.__WF_3DTYPE_UI_VERSION__ = UI_VERSION;

  // ---------------------------
  // Pane scroll / layout fix (critical)
  // ---------------------------
  (function injectPaneCSS(){
    const id="__wf3dtype_pane_css_v9";
    if(document.getElementById(id)) return;

    const css = `
      /* Make sure the pane can actually scroll (Webflow layouts often clip it) */
      #pane, #pane-inner { max-height: 100vh; overflow: auto !important; }
      #pane-inner { -webkit-overflow-scrolling: touch; }

      /* Tweakpane inner scroll containers (class names vary across builds) */
      #pane .tp-rotv_c, #pane [class*="rotv_c"] { max-height: 100vh; overflow: auto !important; }
      #pane .tp-tbpv,  #pane [class*="tbpv"]   { overflow: visible; }

      /* If your pane is positioned/fixed, ensure it stays usable */
      #pane { pointer-events: auto; }
    `;
    const style=document.createElement("style");
    style.id=id;
    style.textContent=css;
    document.head.appendChild(style);
  })();

  const wait=(cond,ms=40,limit=450)=>new Promise((res,rej)=>{
    let n=0;
    const t=setInterval(()=>{
      let ok=false;
      try{ ok=!!cond(); }catch(e){}
      if(ok){ clearInterval(t); res(); return; }
      if(++n>limit){ clearInterval(t); rej(new Error("UI timed out waiting for deps/layout.")); }
    },ms);
  });

  function debounce(fn,ms=90){let t;return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)};}
  function lerp(a,b,t){ return a+(b-a)*t; }

  wait(() => (
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
    (document.getElementById("pane-inner") || document.getElementById("pane"))
  ), 40, 500)
  .then(()=>waitForPaneLayoutReady())
  .then(()=>mountUI())
  .catch(err=>console.warn(TAG,err.message));

  function waitForPaneLayoutReady(){
    return wait(()=>{
      const host = document.getElementById("pane-inner") || document.getElementById("pane");
      if(!host) return false;
      const r = host.getBoundingClientRect();
      return r.height > 40;
    }, 40, 250);
  }

  function mountUI(){
    const paneOuter = document.getElementById("pane");
    const paneHost  = document.getElementById("pane-inner") || paneOuter;
    if(!paneOuter || !paneHost){ console.warn(TAG,"#pane/#pane-inner missing"); return; }

    const prev = document.getElementById("__tp_root");
    if(prev) prev.remove();

    const root = document.createElement("div");
    root.id="__tp_root";
    paneHost.appendChild(root);

    let rescueUsed = false;

    function buildEverything(){
      try{ window.__tp_ui_cleanup?.(); }catch(e){}
      root.innerHTML = "";

      const params = window.params;

      // ---------------------------
      // ✅ SAFE DEFAULTS (Background)
      // ---------------------------
      if(!("bgMode" in params)) params.bgMode="solid";
      if(!("bgSolid" in params)) params.bgSolid = params.bg || "#111111";

      if(!("bgGradA" in params)) params.bgGradA="#101018";
      if(!("bgGradB" in params)) params.bgGradB="#1a0f24";
      if(!("bgGradAngle" in params)) params.bgGradAngle=35;
      if(!("bgGradSoft" in params)) params.bgGradSoft=0.65;

      if(!("bgCheckerType" in params)) params.bgCheckerType="checker";
      if(!("bgCheckerScale" in params)) params.bgCheckerScale=48;
      if(!("bgCheckerLine" in params)) params.bgCheckerLine=6;
      if(!("bgCheckerRound" in params)) params.bgCheckerRound=0;
      if(!("bgCheckerRotate" in params)) params.bgCheckerRotate=0;
      if(!("bgCheckerJitter" in params)) params.bgCheckerJitter=0;
      if(!("bgCheckerContrast" in params)) params.bgCheckerContrast=0.22;
      if(!("bgCheckerOpacity" in params)) params.bgCheckerOpacity=1.0;
      if(!("bgCheckerColorA" in params)) params.bgCheckerColorA="#0e0e12";
      if(!("bgCheckerColorB" in params)) params.bgCheckerColorB="#161623";

      // ---------------------------
      // ✅ SAFE DEFAULTS (Face checker)
      // ---------------------------
      if(!("faceChkScale" in params)) params.faceChkScale=42;
      if(!("faceChkLineWidth" in params)) params.faceChkLineWidth=3;
      if(!("faceChkRotate" in params)) params.faceChkRotate=0;
      if(!("faceChkColorA" in params)) params.faceChkColorA="#0e0e12";
      if(!("faceChkColorB" in params)) params.faceChkColorB="#161623";
      if(!("faceChkLineColor" in params)) params.faceChkLineColor="#ffffff";

      // ---------------------------
      // ✅ SAFE DEFAULTS (Repel)
      // ---------------------------
      if(!("repelAmount" in params)) params.repelAmount=80;
      if(!("repelMinDistance" in params)) params.repelMinDistance=6;
      if(!("repelClamp" in params)) params.repelClamp=140;

      const Pane = window.Tweakpane.Pane;
      const pane = new Pane({ container: root, title: "Controls" });

      const tab = pane.addTab({ pages: [{title:"Type"},{title:"Look"},{title:"Motion"}] });
      const tType   = tab.pages[0];
      const tLook   = tab.pages[1];
      const tMotion = tab.pages[2];

      function folderContent(folder){
        return (
          folder?.element?.querySelector('[class*="fldv_c"]') ||
          folder?.element?.querySelector('[class*="folder"] [class*="content"]') ||
          folder?.element
        );
      }

      // =========================================================
      // Shift+H hide/show
      // =========================================================
      const CONTROLS_KEY="__tp_controls_hidden";

      function isTypingTarget(el){
        if(!el) return false;
        const tag = (el.tagName||"").toLowerCase();
        return tag === "input" || tag === "textarea" || el.isContentEditable;
      }

      function setHidden(hidden){
        const paneEl=document.getElementById("pane");
        if(!paneEl) return;
        paneEl.style.display=hidden?"none":"";
        window[CONTROLS_KEY]=hidden;
      }

      function onKeyDown(e){
        if(!e.shiftKey) return;
        const k=(e.key||"").toLowerCase();
        if(k!=="h") return;
        if(isTypingTarget(e.target)) return;

        e.preventDefault();
        e.stopPropagation();
        setHidden(!window[CONTROLS_KEY]);
      }
      window.addEventListener("keydown", onKeyDown, true);

      // =========================================================
      // Collapse shell detection
      // =========================================================
      const paneShell = document.getElementById("pane");

      function findFoldButton(){
        return root.querySelector("button[aria-expanded]") ||
               root.querySelector(".tp-rotv_t button[aria-expanded]") ||
               root.querySelector("[class*='rotv_t'] button[aria-expanded]");
      }

      let foldObserver=null, reattachObserver=null;

      function syncCollapsedFromButton(){
        if(!paneShell) return;
        const btn = findFoldButton();
        if(!btn) return;
        const expanded = btn.getAttribute("aria-expanded");
        if(expanded == null) return;
        paneShell.classList.toggle("is-collapsed", expanded === "false");
      }

      function attachFoldObserver(){
        const btn = findFoldButton();
        if(!btn) return false;
        syncCollapsedFromButton();
        foldObserver = new MutationObserver(syncCollapsedFromButton);
        foldObserver.observe(btn, { attributes:true, attributeFilter:["aria-expanded"] });
        return true;
      }

      if(!attachFoldObserver()){
        reattachObserver = new MutationObserver(()=>{
          if(attachFoldObserver()){
            try{ reattachObserver.disconnect(); }catch(e){}
          }
        });
        reattachObserver.observe(root, { childList:true, subtree:true });
      }

      // =========================================================
      // TAB RESCUE
      // =========================================================
      function getTabButtons(){
        const row = root.querySelector(".tp-tbv_t") || root.querySelector("[class*='tbv_t']");
        if(!row) return [];
        return Array.from(row.querySelectorAll("button"));
      }

      function getPages(){
        return Array.from(root.querySelectorAll(".tp-tbpv, [class*='tbpv']"));
      }

      function activeIndex(){
        const btns = getTabButtons();
        for(let i=0;i<btns.length;i++){
          if(btns[i].getAttribute("aria-selected")==="true") return i;
        }
        return 0;
      }

      function activePageLooksEmpty(){
        const pages = getPages();
        if(!pages.length) return false;

        const i = activeIndex();
        const p = pages[i] || pages[0];
        if(!p) return false;

        const h = p.getBoundingClientRect().height;
        if(h > 6) return false;

        const anyVisible = Array.from(p.querySelectorAll("*")).some(el=>{
          const r = el.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        });
        return !anyVisible;
      }

      const rescueCheck = debounce(()=>{
        const idx = activeIndex();
        if(idx === 0) return;

        if(activePageLooksEmpty()){
          if(rescueUsed) return;
          rescueUsed = true;
          console.warn(TAG,"Tab render glitch detected. Rebuilding pane once (rescue).");
          setTimeout(()=>buildEverything(), 0);
        }
      }, 60);

      function attachRescueToTabClicks(){
        const btns = getTabButtons();
        btns.forEach(b=>{
          b.addEventListener("click", ()=>setTimeout(rescueCheck, 0), { passive:true });
        });
        setTimeout(rescueCheck, 80);
      }

      // ---------------------------
      // Canvas
      // ---------------------------
      const fCanvas=tType.addFolder({title:"Canvas"});
      fCanvas.addBinding(params,"aspect",{label:"ratio",options:{Free:"free","1:1":"1:1","4:5":"4:5","9:16":"9:16","9:18":"9:18","16:9":"16:9"}});
      fCanvas.addBinding(params,"margin",{label:"margin",min:0,max:64,step:1});

      // ---------------------------
      // Text
      // ---------------------------
      const fText=tType.addFolder({title:"Text"});
      const textWrap=document.createElement("div");
      textWrap.className="tp-custom-text";
      textWrap.innerHTML=`
        <label>Content</label>
        <textarea spellcheck="false"></textarea>
      `;
      const ta=textWrap.querySelector("textarea");
      ta.value=params.text||"";
      folderContent(fText).appendChild(textWrap);

      const onTextInput=debounce(()=>{
        params.text=ta.value;
        window.buildText();
        try{ window.__rebuildZControls?.(); }catch(e){}
        if(window.__tp_animPlaying) window.playAnimation();
      },60);
      ta.addEventListener("input",onTextInput);

      // ---------------------------
      // Font
      // ---------------------------
      const fFont=tType.addFolder({title:"Font"});
      const presets = window.FONT_PRESETS || {};
      const presetKeys = Object.keys(presets);
      const presetOptions = {};
      presetKeys.forEach(k => presetOptions[k]=k);

      if(!("fontSource" in params)) params.fontSource="preset";
      if(!("fontPreset" in params)) params.fontPreset=presetKeys[0] || "";
      if(!("fontUrl" in params)) params.fontUrl="";
      if(params.fontSource==="preset" && presetKeys.length && !presets[params.fontPreset]){
        params.fontPreset = presetKeys[0];
      }

      const bSource = fFont.addBinding(params,"fontSource",{label:"source",options:{Preset:"preset",URL:"url",Upload:"upload"}});
      const bPreset = fFont.addBinding(params,"fontPreset",{label:"preset",options:presetOptions});
      const bUrl    = fFont.addBinding(params,"fontUrl",{label:"url"});

      const uploadWrap=document.createElement("div");
      uploadWrap.className="tp-custom-font";
      uploadWrap.innerHTML=`
        <label>Upload typeface JSON</label>
        <div class="row">
          <button type="button" data-pick>Choose file</button>
          <span class="hint" data-name>None</span>
        </div>
        <input type="file" accept=".json,.typeface.json,application/json" />
        <div class="hint">Must be a THREE typeface JSON (.typeface.json export).</div>
      `;
      const fileInput=uploadWrap.querySelector("input[type=file]");
      const pickBtn  =uploadWrap.querySelector("[data-pick]");
      const nameEl   =uploadWrap.querySelector("[data-name]");
      pickBtn.addEventListener("click",()=>fileInput.click());
      folderContent(fFont).appendChild(uploadWrap);

      fFont.addButton({title:"Apply font"}).on("click", async ()=>{
        try{
          await window.applyFontSelection();
          window.buildText();
          try{ window.__rebuildZControls?.(); }catch(e){}
          if(window.__tp_animPlaying) window.playAnimation();
        }catch(e){
          console.warn(TAG,"apply font failed",e);
          alert("Font load failed. See console.");
        }
      });

      function refreshFontUI(){
        const isPreset=params.fontSource==="preset";
        const isUrl=params.fontSource==="url";
        const isUpload=params.fontSource==="upload";
        bPreset.element.style.display=isPreset?"":"none";
        bUrl.element.style.display=isUrl?"":"none";
        uploadWrap.style.display=isUpload?"":"none";
      }
      refreshFontUI();

      fileInput.addEventListener("change", async ()=>{
        if(!fileInput.files || !fileInput.files[0]) return;
        const file = fileInput.files[0];
        nameEl.textContent = file.name;

        try{
          const text = await file.text();
          params.fontSource = "upload";
          refreshFontUI();

          let obj;
          try{ obj = JSON.parse(text); }
          catch(parseErr){
            console.warn(TAG, "JSON.parse failed:", parseErr);
            alert("That file isn’t valid JSON.");
            return;
          }

          if(!obj || !obj.glyphs){
            console.warn(TAG, "Not a THREE typeface JSON. Keys:", Object.keys(obj||{}));
            alert("This JSON is not a THREE typeface font (missing 'glyphs'). Convert the font to .typeface.json first.");
            return;
          }

          window.setFontFromUploadedJsonText(text);
          window.buildText();
          try{ window.__rebuildZControls?.(); }catch(e){}
          if(window.__tp_animPlaying) window.playAnimation();

        }catch(e){
          console.warn(TAG, "Upload failed:", e);
          alert("Could not load this font JSON. Check console for details.");
        }
      });

      pane.on("change",(ev)=>{
        const k=ev?.target?.key;
        if(!k) return;
        if(k==="fontSource"){ refreshFontUI(); return; }
      });

      // ---------------------------
      // Typography
      // ---------------------------
      const fTypeControls=tType.addFolder({title:"Typography"});
      fTypeControls.addBinding(params,"size",{min:12,max:140,step:1});
      fTypeControls.addBinding(params,"depth",{min:0,max:240,step:1});
      fTypeControls.addBinding(params,"charSpacing",{label:"char spacing",min:-30,max:80,step:1});
      fTypeControls.addBinding(params,"lineSpacing",{label:"line spacing",min:.8,max:2.5,step:.01});
      fTypeControls.addBinding(params,"align",{options:{Center:"center",Left:"left",Right:"right"}});

      // ---------------------------
      // Per-letter Z
      // ---------------------------
      const fCharZ=tType.addFolder({title:"Per-letter Z"});
      const ZMIN=-200, ZMAX=200, ZSTEP=1;
      let zProxy = {};
      let zBindings = [];
      let zNoGlyphBlade = null;

      function ensureZArray(){
        const n=window.__getCharCount();
        if(!Array.isArray(params.charZOffsets)) params.charZOffsets=[];
        if(params.charZOffsets.length!==n){
          const next=new Array(n);
          for(let i=0;i<n;i++) next[i]=Number(params.charZOffsets[i] ?? 0);
          params.charZOffsets=next;
        }
      }
      function syncProxyFromParams(){
        ensureZArray();
        zProxy = {};
        for(let i=0;i<params.charZOffsets.length;i++){
          zProxy["c"+i] = Number(params.charZOffsets[i] || 0);
        }
      }
      function syncParamsFromProxy(){
        for(let i=0;i<params.charZOffsets.length;i++){
          params.charZOffsets[i] = Number(zProxy["c"+i] || 0);
        }
      }
      function clearZBindings(){
        for(const b of zBindings){ try{ b.dispose?.(); }catch(e){} }
        zBindings.length = 0;
        if(zNoGlyphBlade){ try{ zNoGlyphBlade.dispose?.(); }catch(e){} zNoGlyphBlade=null; }
      }
      function rebuildZControls(){
        ensureZArray();
        clearZBindings();
        syncProxyFromParams();
        const n=params.charZOffsets.length;
        if(n===0){
          zNoGlyphBlade=fCharZ.addBlade({view:"text", value:"(No glyphs)"});
          return;
        }
        for(let i=0;i<n;i++){
          const b=fCharZ.addBinding(zProxy,"c"+i,{ label:String(i+1), min:ZMIN, max:ZMAX, step:ZSTEP });
          b.on("change",()=>{ syncParamsFromProxy(); window.__applyCharZOffsets(); });
          zBindings.push(b);
        }
      }

      fCharZ.addButton({title:"Ramp"}).on("click",()=>{
        ensureZArray();
        const n=params.charZOffsets.length;
        if(n<=1) return;
        const span=120;
        for(let i=0;i<n;i++) params.charZOffsets[i]=Math.round(lerp(-span,span,i/(n-1)));
        syncProxyFromParams(); zBindings.forEach(b=>b.refresh()); window.__applyCharZOffsets();
      });
      fCharZ.addButton({title:"Reset"}).on("click",()=>{
        ensureZArray();
        params.charZOffsets.fill(0);
        syncProxyFromParams(); zBindings.forEach(b=>b.refresh()); window.__applyCharZOffsets();
      });
      fCharZ.addButton({title:"Random"}).on("click",()=>{
        ensureZArray();
        const span=140;
        for(let i=0;i<params.charZOffsets.length;i++) params.charZOffsets[i]=Math.round((Math.random()*2-1)*span);
        syncProxyFromParams(); zBindings.forEach(b=>b.refresh()); window.__applyCharZOffsets();
      });

      window.__rebuildZControls=rebuildZControls;
      rebuildZControls();

      // ---------------------------
      // LOOK
      // ---------------------------
      const fBg=tLook.addFolder({title:"Background"});

      const bBgMode = fBg.addBinding(params,"bgMode",{label:"mode",options:{Solid:"solid",Gradient:"gradient",Checker:"checker"}});
      const bBgSolid = fBg.addBinding(params,"bgSolid",{label:"solid",view:"color"});

      const fBgGrad = fBg.addFolder({title:"Gradient"});
      const bBgGradA = fBgGrad.addBinding(params,"bgGradA",{label:"A",view:"color"});
      const bBgGradB = fBgGrad.addBinding(params,"bgGradB",{label:"B",view:"color"});
      const bBgGradAngle = fBgGrad.addBinding(params,"bgGradAngle",{label:"angle",min:0,max:360,step:1});
      const bBgGradSoft  = fBgGrad.addBinding(params,"bgGradSoft",{label:"soft",min:0,max:1,step:0.01});

      const fBgChecker = fBg.addFolder({title:"Checker"});
      const bChkType = fBgChecker.addBinding(params,"bgCheckerType",{label:"type",options:{Checker:"checker",Grid:"grid",Micro:"micro"}});
      const bChkScale = fBgChecker.addBinding(params,"bgCheckerScale",{label:"scale",min:4,max:240,step:1});
      const bChkLine  = fBgChecker.addBinding(params,"bgCheckerLine",{label:"line",min:1,max:60,step:1});
      const bChkRound = fBgChecker.addBinding(params,"bgCheckerRound",{label:"round",min:0,max:0.45,step:0.01});
      const bChkRot   = fBgChecker.addBinding(params,"bgCheckerRotate",{label:"rotate",min:0,max:360,step:1});
      const bChkJit   = fBgChecker.addBinding(params,"bgCheckerJitter",{label:"jitter",min:0,max:1,step:0.01});
      const bChkCon   = fBgChecker.addBinding(params,"bgCheckerContrast",{label:"contrast",min:0,max:1,step:0.01});
      const bChkOp    = fBgChecker.addBinding(params,"bgCheckerOpacity",{label:"opacity",min:0,max:1,step:0.01});
      const bChkA     = fBgChecker.addBinding(params,"bgCheckerColorA",{label:"A",view:"color"});
      const bChkB     = fBgChecker.addBinding(params,"bgCheckerColorB",{label:"B",view:"color"});

      function refreshBgUI(){
        const m = params.bgMode;
        bBgSolid.element.style.display = (m==="solid") ? "" : "none";
        fBgGrad.element.style.display  = (m==="gradient") ? "" : "none";
        fBgChecker.element.style.display = (m==="checker") ? "" : "none";
      }
      refreshBgUI();

      function rebuildBg(){
        try{ window.rebuildBackground?.(); }catch(e){}
      }

      [bBgMode,bBgSolid,bBgGradA,bBgGradB,bBgGradAngle,bBgGradSoft,bChkType,bChkScale,bChkLine,bChkRound,bChkRot,bChkJit,bChkCon,bChkOp,bChkA,bChkB]
        .forEach(b=>{
          try{ b.on("change", ()=>{
            if(b===bBgMode) refreshBgUI();
            rebuildBg();
          }); }catch(e){}
        });

      const fFill=tLook.addFolder({title:"Fill"});
      const fFace=fFill.addFolder({title:"Faces"});

      fFace.addBinding(params,"faceMode",{label:"mode",options:{Solid:"solid",Gradient:"gradient",Checker:"checker"}});
      fFace.addBinding(params,"faceUVSpace",{label:"UV",options:{Glyph:"glyph",World:"world"}});
      fFace.addBinding(params,"faceSolid",{view:"color"});

      fFace.addBinding(params,"faceGradA",{label:"A",view:"color"}); fFace.addBinding(params,"faceStopA",{label:"A stop",min:0,max:1,step:.01});
      fFace.addBinding(params,"faceGradB",{label:"B",view:"color"}); fFace.addBinding(params,"faceStopB",{label:"B stop",min:0,max:1,step:.01});
      fFace.addBinding(params,"faceGradC",{label:"C",view:"color"}); fFace.addBinding(params,"faceStopC",{label:"C stop",min:0,max:1,step:.01});
      fFace.addBinding(params,"faceGradDir",{label:"dir",options:{Vertical:"vertical",Horizontal:"horizontal",Diagonal:"diagonal"}});

      const fFaceChk = fFace.addFolder({title:"Face Checker"});
      fFaceChk.addBinding(params,"faceChkScale",{label:"scale",min:4,max:200,step:1});
      fFaceChk.addBinding(params,"faceChkLineWidth",{label:"line width",min:0,max:40,step:1});
      fFaceChk.addBinding(params,"faceChkRotate",{label:"rotate",min:0,max:360,step:1});
      fFaceChk.addBinding(params,"faceChkColorA",{label:"square A",view:"color"});
      fFaceChk.addBinding(params,"faceChkColorB",{label:"square B",view:"color"});
      fFaceChk.addBinding(params,"faceChkLineColor",{label:"line",view:"color"});

      function refreshFaceUI(){
        fFaceChk.element.style.display = (params.faceMode==="checker") ? "" : "none";
      }
      refreshFaceUI();

      const fSide=fFill.addFolder({title:"Extrusion"});
      fSide.addBinding(params,"sideMode",{label:"mode",options:{Solid:"solid",Gradient:"gradient"}});
      fSide.addBinding(params,"sideUVSpace",{label:"UV",options:{Glyph:"glyph",World:"world"}});
      fSide.addBinding(params,"sideSolid",{view:"color"});
      fSide.addBinding(params,"sideGradA",{label:"A",view:"color"}); fSide.addBinding(params,"sideStopA",{label:"A stop",min:0,max:1,step:.01});
      fSide.addBinding(params,"sideGradB",{label:"B",view:"color"}); fSide.addBinding(params,"sideStopB",{label:"B stop",min:0,max:1,step:.01});
      fSide.addBinding(params,"sideGradC",{label:"C",view:"color"}); fSide.addBinding(params,"sideStopC",{label:"C stop",min:0,max:1,step:.01});
      fSide.addBinding(params,"sideGradDir",{label:"dir",options:{Vertical:"vertical",Horizontal:"horizontal",Diagonal:"diagonal"}});

      const fGrad=tLook.addFolder({title:"Gradient Animation"});
      const fFaceGrad=fGrad.addFolder({title:"Faces"});
      fFaceGrad.addBinding(params,"faceGradAnimOn",{label:"enabled"});
      fFaceGrad.addBinding(params,"faceGradSpeed",{label:"speed",min:0,max:0.25,step:0.005});
      fFaceGrad.addBinding(params,"faceGradAngle",{label:"angle",min:0,max:360,step:1});

      const fSideGrad=fGrad.addFolder({title:"Extrusion"});
      fSideGrad.addBinding(params,"sideGradAnimOn",{label:"enabled"});
      fSideGrad.addBinding(params,"sideGradSpeed",{label:"speed",min:0,max:0.25,step:0.005});
      fSideGrad.addBinding(params,"sideGradAngle",{label:"angle",min:0,max:360,step:1});

      const fBright=tLook.addFolder({title:"Brightness"});
      fBright.addBinding(params,"faceBright",{label:"face",min:0,max:3,step:.01});
      fBright.addBinding(params,"sideBright",{label:"extrusion",min:0,max:3,step:.01});

      const fStroke=tLook.addFolder({title:"Stroke"});
      fStroke.addBinding(params,"stroke",{view:"color"});
      fStroke.addBinding(params,"strokeWidth",{label:"width",min:0,max:12,step:1});
      fStroke.addBinding(params,"edgeThreshold",{label:"edge detect",min:0,max:30,step:.5});
      fStroke.addBinding(params,"strokeFacesOnly",{label:"faces only"});

      const fFx=tLook.addFolder({title:"Effects"});
      const fHalf=fFx.addFolder({title:"Halftone"});
      fHalf.addBinding(params,"halftoneOn",{label:"enabled"});
      fHalf.addBinding(params,"halftoneTarget",{label:"target",options:{Both:"both",Faces:"face",Extrusion:"side"}});
      fHalf.addBinding(params,"halftoneScale",{label:"scale",min:10,max:400,step:1});
      fHalf.addBinding(params,"halftoneAngle",{label:"angle",min:0,max:90,step:1});
      fHalf.addBinding(params,"halftoneStrength",{label:"strength",min:0,max:1,step:.01});
      fHalf.addBinding(params,"halftoneSoftness",{label:"soft",min:0.01,max:.49,step:.01});

      const fGr=tLook.addFolder({title:"Grain"});
      fGr.addBinding(params,"grainOn",{label:"enabled"});
      fGr.addBinding(params,"grainTarget",{label:"target",options:{Both:"both",Faces:"face",Extrusion:"side"}});
      fGr.addBinding(params,"grainAmount",{label:"amount",min:0,max:.6,step:.01});
      fGr.addBinding(params,"grainScale",{label:"scale",min:20,max:900,step:1});
      fGr.addBinding(params,"grainSpeed",{label:"speed",min:0,max:2,step:.01});

      const fLight=tLook.addFolder({title:"Lighting"});
      fLight.addBinding(params,"lightingMode",{options:{Accurate:"accurate",Studio:"studio"}});

      const fCam=tLook.addFolder({title:"Camera"});
      fCam.addBinding(params,"cameraPreset",{options:{Front:"front","Iso Left":"isoLeft","Iso Right":"isoRight"}});
      fCam.addButton({title:"Apply preset"}).on("click",()=>window.applyCameraPreset());
      fCam.addButton({title:"Reframe"}).on("click",()=>window.reframeToText());

      // ---------------------------
      // Motion
      // ---------------------------
      const fAnim=tMotion.addFolder({title:"Animation"});
      fAnim.addBinding(params,"animPreset",{label:"preset",options:{"Depth":"depth","Twist":"twist","Wobble":"wobble","Inflate":"inflate"}});
      fAnim.addBinding(params,"animSpeed",{label:"speed",min:.1,max:4,step:.05});
      fAnim.addBinding(params,"animStagger",{label:"stagger",min:0,max:.3,step:.005});
      fAnim.addBinding(params,"animEase",{label:"ease",options:{"power2.inOut":"power2.inOut","sine.inOut":"sine.inOut","expo.inOut":"expo.inOut","elastic.out(1,0.35)":"elastic.out(1,0.35)","steps(6)":"steps(6)"}});
      fAnim.addBinding(params,"animLoop",{label:"loop"});
      fAnim.addBinding(params,"animStaggerMode",{label:"stagger by",options:{Character:"char",Word:"word",Line:"line"}});
      fAnim.addBinding(params,"animStaggerFrom",{label:"direction",options:{Start:"start",End:"end",Center:"center",Edges:"edges",Random:"random"}});
      fAnim.addBinding(params,"animMinPct",{label:"min % depth",min:0,max:100,step:1});
      fAnim.addBinding(params,"animMaxPct",{label:"max % depth",min:0,max:200,step:1});
      fAnim.addBinding(params,"animAxis",{label:"axis",options:{X:"x",Y:"y"}});
      fAnim.addBinding(params,"animRotateDeg",{label:"rotate deg",min:0,max:180,step:1});
      fAnim.addBinding(params,"animInflate",{label:"inflate",min:0,max:.6,step:.01});
      fAnim.addBinding(params,"animAlsoDepth",{label:"also depth"});
      fAnim.addButton({title:"Play"}).on("click",()=>{window.__tp_animPlaying=true;window.playAnimation();});
      fAnim.addButton({title:"Stop"}).on("click",()=>{window.__tp_animPlaying=false;window.stopAnimation();});

      const fIdle=tMotion.addFolder({title:"Idle Wave"});
      fIdle.addBinding(params,"waveOn",{label:"enabled"});
      fIdle.addBinding(params,"waveBy",{label:"by",options:{X:"x",Line:"line"}});
      fIdle.addBinding(params,"waveSpeed",{label:"speed",min:0,max:2,step:.01});
      fIdle.addBinding(params,"waveAmpY",{label:"amp Y",min:0,max:40,step:1});
      fIdle.addBinding(params,"waveRotDeg",{label:"rot deg",min:0,max:25,step:1});
      fIdle.addBinding(params,"waveFreq",{label:"freq",min:0.01,max:0.30,step:0.01});

      const fBreath=tMotion.addFolder({title:"Breathing Extrusion"});
      fBreath.addBinding(params,"breathOn",{label:"enabled"});
      fBreath.addBinding(params,"breathSpeed",{label:"speed",min:0,max:2,step:.01});
      fBreath.addBinding(params,"breathAmount",{label:"amount",min:0,max:0.20,step:0.005});

      const fHover=tMotion.addFolder({title:"Hover"});
      fHover.addBinding(params,"hoverMode",{label:"mode",options:{Lift:"lift",Rotate:"rotate",Tilt:"tilt",Pulse:"pulse",Repel:"repel",None:"none"}});
      fHover.addBinding(params,"proximityLift",{label:"enabled"});
      fHover.addBinding(params,"proximityRadiusWorld",{label:"radius",min:10,max:800,step:1});
      fHover.addBinding(params,"proximityLiftAmount",{label:"lift",min:0,max:400,step:1});
      fHover.addBinding(params,"hoverRotateDeg",{label:"rotate",min:0,max:180,step:1});
      fHover.addBinding(params,"hoverTiltDeg",{label:"tilt",min:0,max:90,step:1});
      fHover.addBinding(params,"hoverPulse",{label:"pulse",min:0,max:.8,step:.01});
      fHover.addBinding(params,"proximityFalloff",{label:"falloff",options:{linear:"linear",quadratic:"quadratic",smooth:"smooth"}});
      fHover.addBinding(params,"cursorSmoothing",{label:"cursor smooth",min:0,max:.98,step:.01});
      fHover.addBinding(params,"liftSmoothing",{label:"smooth",min:.01,max:.6,step:.01});

      const fRepel=fHover.addFolder({title:"Repel"});
      fRepel.addBinding(params,"repelAmount",{label:"amount",min:0,max:400,step:1});
      fRepel.addBinding(params,"repelMinDistance",{label:"min dist",min:0.1,max:40,step:0.1});
      fRepel.addBinding(params,"repelClamp",{label:"clamp",min:0,max:600,step:1});

      const fMag=tMotion.addFolder({title:"Magnetic Sweep"});
      fMag.addBinding(params,"magneticSweepOn",{label:"enabled"});
      fMag.addBinding(params,"sweepAmount",{label:"amount",min:0,max:120,step:1});
      fMag.addBinding(params,"sweepBias",{label:"bias",min:0,max:2,step:.01});
      fMag.addBinding(params,"sweepYMix",{label:"Y mix",min:0,max:1,step:.01});

      const fHeat=tMotion.addFolder({title:"Heat Bloom"});
      fHeat.addBinding(params,"heatBloomOn",{label:"enabled"});
      fHeat.addBinding(params,"heatRadiusWorld",{label:"radius",min:40,max:520,step:1});
      fHeat.addBinding(params,"heatSoftness",{label:"soft",min:0,max:1,step:.01});
      fHeat.addBinding(params,"heatBrightBoost",{label:"bright",min:0,max:1.5,step:.01});
      fHeat.addBinding(params,"heatGrainBoost",{label:"grain boost",min:0,max:3,step:.01});
      fHeat.addBinding(params,"heatHalfBoost",{label:"half boost",min:0,max:3,step:.01});

      // ---------------------------
      // Routing
      // ---------------------------
      const FX_KEYS=new Set([
        "halftoneOn","halftoneTarget","halftoneScale","halftoneAngle","halftoneStrength","halftoneSoftness",
        "grainOn","grainTarget","grainAmount","grainScale","grainSpeed",
        "faceBright","sideBright",
        "heatBloomOn","heatRadiusWorld","heatSoftness","heatBrightBoost","heatGrainBoost","heatHalfBoost"
      ]);

      const REBUILD_KEYS=new Set([
        "aspect","margin","size","depth","charSpacing","lineSpacing","align",
        "faceMode","faceUVSpace","faceSolid",
        "faceGradA","faceGradB","faceGradC","faceStopA","faceStopB","faceStopC","faceGradDir",
        "faceChkScale","faceChkLineWidth","faceChkRotate","faceChkColorA","faceChkColorB","faceChkLineColor",
        "sideMode","sideUVSpace","sideSolid","sideGradA","sideGradB","sideGradC","sideStopA","sideStopB","sideStopC","sideGradDir",
        "stroke","strokeWidth","edgeThreshold","strokeFacesOnly",
        "lightingMode"
      ]);

      const ANIM_KEYS=new Set([
        "animPreset","animSpeed","animStagger","animMinPct","animMaxPct","animEase","animLoop","animStaggerMode","animStaggerFrom",
        "animRotateDeg","animInflate","animAlsoDepth","animAxis"
      ]);

      const GRAD_ANIM_KEYS=new Set([
        "faceGradAnimOn","faceGradSpeed","faceGradAngle",
        "sideGradAnimOn","sideGradSpeed","sideGradAngle"
      ]);

      pane.on("change",(ev)=>{
        const k=ev?.target?.key;
        if(!k) return;

        if(k==="fontSource" || k==="fontPreset" || k==="fontUrl") return;

        if(k==="faceMode"){ refreshFaceUI(); }

        if(FX_KEYS.has(k)){ window._syncFXUniforms(); return; }
        if(ANIM_KEYS.has(k)){ if(window.__tp_animPlaying) window.playAnimation(); return; }
        if(GRAD_ANIM_KEYS.has(k)){ return; }

        if(k==="cameraPreset"){ window.applyCameraPreset(); return; }

        if(REBUILD_KEYS.has(k)){
          if(k==="lightingMode") window.applyLightingMode();
          window.rebuildFillMaterials();
          window.buildText();
          try{ window.__rebuildZControls?.(); }catch(e){}
          if(window.__tp_animPlaying) window.playAnimation();
          return;
        }
      });

      window.buildText();
      window._syncFXUniforms();
      try{ window.__rebuildZControls?.(); }catch(e){}

      attachRescueToTabClicks();

      window.__tp_ui_cleanup = ()=>{
        try{ ta.removeEventListener("input", onTextInput); }catch(e){}
        try{ window.removeEventListener("keydown", onKeyDown, true); }catch(e){}
        try{ foldObserver?.disconnect?.(); }catch(e){}
        try{ reattachObserver?.disconnect?.(); }catch(e){}
        try{ pane.dispose(); }catch(e){}
      };
    }

    buildEverything();
  }
})();
