// js/scramble.js
export function initMainScrambleGated() {
  function startMainScramble(){
    const SYMBOLS = ["#","€","&","%","/","*","$","!"];
    const SPEED = 240;
    const HOVER_SPEED = 120;
    const LOOP_DELAY = 2000;
    const GLOBAL_PAGELOAD_OFFSET = 1000;

    const randSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const readVarMs = (el, varName, fallback=0) => {
      const v = getComputedStyle(el).getPropertyValue(varName).trim();
      const ms = parseInt(v, 10);
      return Number.isFinite(ms) ? ms : fallback;
    };

    function initOne(el){
      if (el.dataset.scrambleInit === "1") return;
      el.dataset.scrambleInit = "1";

      const originalText = el.textContent;
      if (!originalText || !originalText.trim()) return;

      el.dataset.scrambleHtml = el.dataset.scrambleHtml || el.innerHTML;
      el.innerHTML = "";

      const chars = [];
      const animatable = [];

      Array.from(originalText).forEach(ch => {
        const span = document.createElement("span");
        span.className = "scramble-char";
        span.dataset.original = ch;
        span.textContent = ch === " " ? "\u00A0" : ch;
        el.appendChild(span);
        chars.push(span);
        if (ch.trim() !== "") animatable.push(span);
      });

      el.style.visibility = "hidden";
      let running = false;

      let loadTimers = [];
      function runOnce(onDone){
        if (running || animatable.length === 0) return;
        running = true;
        loadTimers.forEach(t => clearTimeout(t));
        loadTimers = [];

        el.style.visibility = "visible";

        chars.forEach(s => {
          s.classList.remove("active-current","active-trail");
          s.textContent = "\u00A0";
        });

        const overlap = 0.6;
        const baseStagger = Math.max(12, Math.round(SPEED * (1 - overlap)));
        let completed = 0;

        animatable.forEach((span, i) => {
          const flashes = 1 + Math.floor(Math.random() * 1);
          const flashInterval = Math.max(12, Math.round(SPEED / 2));
          const start = i * baseStagger;

          for (let f = 0; f < flashes; f++){
            const t = setTimeout(()=>{
              span.classList.add("active-current");
              span.textContent = randSymbol();
              if (i>0){
                const trail = animatable[i-1];
                trail.classList.add("active-trail");
                trail.textContent = randSymbol();
              }
              if (i>1){
                const older = animatable[i-2];
                older && older.classList.remove("active-trail");
                if (older) older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
              }
            }, start + f * flashInterval);
            loadTimers.push(t);
          }

          const revealTime = start + flashes * flashInterval + Math.round(SPEED * 0.15);
          const tReveal = setTimeout(()=>{
            span.classList.remove("active-current","active-trail");
            span.textContent = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
            if (i>0){
              const prev = animatable[i-1];
              prev.classList.remove("active-trail");
              prev.textContent = prev.dataset.original === " " ? "\u00A0" : prev.dataset.original;
            }
            completed++;
            if (completed >= animatable.length){
              running = false;
              loadTimers.forEach(t => clearTimeout(t));
              loadTimers = [];
              if (typeof onDone === "function") onDone();
            }
          }, revealTime);
          loadTimers.push(tReveal);
        });
      }

      let hoverTimers = [];
      function runHoverOnce(onDone){
        if (running || animatable.length === 0) return;
        running = true;
        hoverTimers.forEach(t => clearTimeout(t));
        hoverTimers = [];

        const overlap = 0.5;
        const baseStagger = Math.max(20, Math.round(HOVER_SPEED * (1 - overlap)));
        let completed = 0;

        animatable.forEach((elSpan)=>elSpan.classList.remove("active-current","active-trail"));

        animatable.forEach((span, i) => {
          const flashes = 1 + Math.floor(Math.random() * 2);
          const flashInterval = Math.max(20, Math.round(HOVER_SPEED/2));
          const start = i * baseStagger;

          for(let f=0; f<flashes; f++){
            const t = setTimeout(()=>{
              span.classList.add("active-current");
              span.textContent = randSymbol();
              if (i>0){
                const trail = animatable[i-1];
                trail.classList.add("active-trail");
                trail.textContent = randSymbol();
              }
              if (i>1){
                const older = animatable[i-2];
                older && older.classList.remove("active-trail");
                if (older) older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
              }
            }, start + f*flashInterval);
            hoverTimers.push(t);
          }

          const revealTime = start + flashes*flashInterval + Math.round(HOVER_SPEED*0.1);
          const tReveal = setTimeout(()=>{
            span.classList.remove("active-current","active-trail");
            span.textContent = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
            if (i>0){
              const prev = animatable[i-1];
              prev.classList.remove("active-trail");
              prev.textContent = prev.dataset.original === " " ? "\u00A0" : prev.dataset.original;
            }
            completed++;
            if (completed >= animatable.length){
              running = false;
              hoverTimers.forEach(t => clearTimeout(t));
              hoverTimers = [];
              if (typeof onDone === "function") onDone();
            }
          }, revealTime);
          hoverTimers.push(tReveal);
        });
      }

      const loadDelay = readVarMs(el, "--scramble-load-delay", 0) + GLOBAL_PAGELOAD_OFFSET;
      const loopStartDelay = readVarMs(el, "--scramble-loop-start-delay", 0) + GLOBAL_PAGELOAD_OFFSET;
      const loopPause = readVarMs(el, "--scramble-loop-pause", LOOP_DELAY);

      setTimeout(() => {
        runOnce(() => {
          if (el.classList.contains("scramble-loop")){
            setTimeout(() => {
              (function loop(){
                runHoverOnce(() => setTimeout(loop, loopPause));
              })();
            }, loopStartDelay);
          } else {
            el.addEventListener("pointerenter", () => runHoverOnce());
            el.addEventListener("touchstart", () => runHoverOnce(), {passive:true});
          }
        });
      }, loadDelay);
    }

    function initAll(){
      document.querySelectorAll(".scramble-text").forEach(initOne);
    }

    initAll();
    window.Webflow = window.Webflow || [];
    window.Webflow.push(initAll);
    setTimeout(initAll, 200);
  }

  // Gate main scramble to preloader completion
  if (window.__PRELOADER_DONE === true) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startMainScramble, { once:true });
    } else {
      startMainScramble();
    }
  } else {
    window.addEventListener("preloader:done", () => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startMainScramble, { once:true });
      } else {
        startMainScramble();
      }
    }, { once:true });
  }
}
