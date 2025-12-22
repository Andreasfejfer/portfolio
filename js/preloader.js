// js/preloader.js
export function initPreloader() {

  window.__PRELOADER_DONE = false;

  const PRELOADER_SELECTOR = ".preloader";                 // <- din class
  const PRE_TEXT_SELECTOR  = ".scramble-text-preloader";
  const PRELOADER_KEY      = "preloader_shown_session";

  // timing
  const PRE_START_DELAY_MS = 500;
  const PRE_MIN_TOTAL_MS   = 4000;
  const PRE_HOLD_END_MS    = 250;
  const PRE_FADE_OUT_MS    = 1350; // match CSS

  // preloader text behavior
  const PRE_LOOP_COUNT     = 2;
  const PRE_LOOP_PAUSE_MS  = 600;

  const PRE_SPEED_REVEAL   = 240;
  const PRE_SPEED_LOOP     = 200;
  const PRE_SPEED_REVERSE  = 210;

  const SYMBOLS = ["#","€","&","%","/","*","$","!"];
  const randSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const preloaders = Array.from(document.querySelectorAll(PRELOADER_SELECTOR));
  const preTexts   = Array.from(document.querySelectorAll(PRE_TEXT_SELECTOR));

  const hardRemove = (el) => {
    el.style.opacity = "0";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.style.display = "none";
    try { el.remove(); } catch(e){}
  };

  const preDone = () => {
    window.__PRELOADER_DONE = true;
    document.documentElement.classList.remove("preloader-active");
    window.dispatchEvent(new CustomEvent("preloader:done"));
  };

  const preSkip = () => preDone();

  const preActive = preloaders.length > 0 && sessionStorage.getItem(PRELOADER_KEY) !== "1";

  if (!preloaders.length) {
    preSkip();
    return;
  }
  if (!preActive) {
    preloaders.forEach(hardRemove);
    preSkip();
    return;
  }

  // Prevent flash of normal scramble texts
  document.documentElement.classList.add("preloader-active");

  // lock scroll + show preloader
  document.documentElement.classList.add("preloader-lock");
  document.body.classList.add("preloader-lock");
  preloaders.forEach(el => {
    el.style.display = "flex";
    el.style.opacity = "1";
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";
  });

  // Build preloader text with scramble-char spans (hidden at start)
  function buildPreText(el){
    if (el.dataset.preBuilt === "1") return null;
    el.dataset.preBuilt = "1";

    const originalText = el.textContent || "";
    if (!originalText.trim()) return null;

    el.innerHTML = "";
    const chars = [];
    const animatable = [];

    Array.from(originalText).forEach(ch => {
      const span = document.createElement("span");
      span.className = "scramble-char";
      span.dataset.original = ch;
      span.textContent = "\u00A0"; // invisible at start
      el.appendChild(span);
      chars.push(span);
      if (ch.trim() !== "") animatable.push(span);
    });

    el.style.visibility = "visible";
    return { el, chars, animatable };
  }

  function preSetHidden(state){
    state.chars.forEach(s => {
      s.classList.remove("active-current","active-trail");
      s.textContent = "\u00A0";
    });
  }

  function preSetVisible(state){
    state.chars.forEach(s => {
      s.classList.remove("active-current","active-trail");
      const ch = s.dataset.original;
      s.textContent = (ch === " ") ? "\u00A0" : ch;
    });
  }

  // timer mgmt
  let preTimers = [];
  const preLater = (fn, ms) => {
    const t = setTimeout(fn, ms);
    preTimers.push(t);
    return t;
  };
  const preClearTimers = () => {
    preTimers.forEach(t => clearTimeout(t));
    preTimers = [];
  };

  // Reveal: hidden -> visible
  function preReveal(state, speed, onDone){
    preClearTimers();
    preSetHidden(state);

    const overlap = 0.6;
    const baseStagger = Math.max(12, Math.round(speed * (1 - overlap)));
    const flashInterval = Math.max(12, Math.round(speed / 2));

    let completed = 0;

    state.animatable.forEach((span, i) => {
      const flashes = 1;
      const start = i * baseStagger;

      for (let f=0; f<flashes; f++){
        preLater(() => {
          span.classList.add("active-current");
          span.textContent = randSymbol();

          if (i>0){
            const trail = state.animatable[i-1];
            trail.classList.add("active-trail");
            trail.textContent = randSymbol();
          }
          if (i>1){
            const older = state.animatable[i-2];
            if (older){
              older.classList.remove("active-trail");
              older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
            }
          }
        }, start + f*flashInterval);
      }

      const tReveal = start + flashes*flashInterval + Math.round(speed * 0.15);
      preLater(() => {
        span.classList.remove("active-current","active-trail");
        span.textContent = span.dataset.original === " " ? "\u00A0" : span.dataset.original;

        if (i>0){
          const prev = state.animatable[i-1];
          prev.classList.remove("active-trail");
          prev.textContent = prev.dataset.original === " " ? "\u00A0" : prev.dataset.original;
        }

        completed++;
        if (completed >= state.animatable.length){
          preClearTimers();
          onDone && onDone();
        }
      }, tReveal);
    });
  }

  // Loop-style: visible -> visible
  function preLoopOnce(state, speed, onDone){
    preClearTimers();
    preSetVisible(state);

    const overlap = 0.5;
    const baseStagger = Math.max(20, Math.round(speed * (1 - overlap)));
    const flashInterval = Math.max(18, Math.round(speed / 2));
    let completed = 0;

    state.animatable.forEach((span, i) => {
      const flashes = 1 + Math.floor(Math.random() * 2);
      const start = i * baseStagger;

      for (let f=0; f<flashes; f++){
        preLater(() => {
          span.classList.add("active-current");
          span.textContent = randSymbol();

          if (i>0){
            const trail = state.animatable[i-1];
            trail.classList.add("active-trail");
            trail.textContent = randSymbol();
          }
          if (i>1){
            const older = state.animatable[i-2];
            if (older){
              older.classList.remove("active-trail");
              older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
            }
          }
        }, start + f*flashInterval);
      }

      const tReveal = start + flashes*flashInterval + Math.round(speed * 0.1);
      preLater(() => {
        span.classList.remove("active-current","active-trail");
        span.textContent = span.dataset.original === " " ? "\u00A0" : span.dataset.original;

        if (i>0){
          const prev = state.animatable[i-1];
          prev.classList.remove("active-trail");
          prev.textContent = prev.dataset.original === " " ? "\u00A0" : prev.dataset.original;
        }

        completed++;
        if (completed >= state.animatable.length){
          preClearTimers();
          onDone && onDone();
        }
      }, tReveal);
    });
  }

  // Reverse: visible -> hidden
  function preReverse(state, speed, onDone){
    preClearTimers();
    preSetVisible(state);

    const overlap = 0.55;
    const baseStagger = Math.max(14, Math.round(speed * (1 - overlap)));
    const flashInterval = Math.max(14, Math.round(speed / 2));

    let completed = 0;

    for (let ri=0; ri<state.animatable.length; ri++){
      const i = state.animatable.length - 1 - ri;
      const span = state.animatable[i];
      const start = ri * baseStagger;

      preLater(() => {
        span.classList.add("active-current");
        span.textContent = randSymbol();

        const t1 = state.animatable[i+1];
        if (t1){
          t1.classList.add("active-trail");
          t1.textContent = randSymbol();
        }
      }, start);

      const tHide = start + flashInterval + Math.round(speed * 0.15);
      preLater(() => {
        span.classList.remove("active-current","active-trail");
        span.textContent = "\u00A0";

        const t1 = state.animatable[i+1];
        if (t1){
          t1.classList.remove("active-trail");
          t1.textContent = "\u00A0";
        }

        completed++;
        if (completed >= state.animatable.length){
          preSetHidden(state);
          preClearTimers();
          onDone && onDone();
        }
      }, tHide);
    }
  }

  const preState = buildPreText(preTexts[0]);
  const preStartedAt = performance.now();
  const preMinEndAt = preStartedAt + PRE_MIN_TOTAL_MS;

  function preFinishAfterMinAndLoaded() {
    const wait = Math.max(0, preMinEndAt - performance.now());
    setTimeout(() => {
      setTimeout(() => {
        preloaders.forEach(el => el.classList.add("is-hidden"));
        setTimeout(() => {
          preloaders.forEach(hardRemove);
          document.documentElement.classList.remove("preloader-lock");
          document.body.classList.remove("preloader-lock");
          sessionStorage.setItem(PRELOADER_KEY, "1");
          preDone();
        }, PRE_FADE_OUT_MS);
      }, PRE_HOLD_END_MS);
    }, wait);
  }

  // Wait for full page load only
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!preState){
        preFinishAfterMinAndLoaded();
        return;
      }

      // Force reflow to ensure layout is stable before animation
      document.body.offsetHeight;

      preReveal(preState, PRE_SPEED_REVEAL, () => {
        let loopsDone = 0;

        const runLoop = () => {
          preLoopOnce(preState, PRE_SPEED_LOOP, () => {
            loopsDone++;
            if (loopsDone < PRE_LOOP_COUNT){
              setTimeout(runLoop, PRE_LOOP_PAUSE_MS);
            } else {
              setTimeout(() => {
                preReverse(preState, PRE_SPEED_REVERSE, () => {
                  preFinishAfterMinAndLoaded();
                });
              }, PRE_LOOP_PAUSE_MS);
            }
          });
        };

        setTimeout(runLoop, PRE_LOOP_PAUSE_MS);
      });
    }, PRE_START_DELAY_MS);
  });
}

// Fallback: expose globally in case scripts load non-module
if (typeof window !== "undefined" && !window.initPreloader) {
  window.initPreloader = initPreloader;
}
