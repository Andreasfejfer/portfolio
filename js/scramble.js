// js/scramble.js
export function initScramble() {
  console.log("Scramble init");

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

    // Color mode: add class to parent for styling
    if (el.classList.contains('scramble-black')) {
      el.classList.add('scramble-color-black');
    } else if (el.classList.contains('scramble-white')) {
      el.classList.add('scramble-color-white');
    }

    // If .scramble-scroll, always start hidden and mark as not revealed
    if (el.classList.contains('scramble-scroll')) {
      el.style.visibility = 'hidden';
      el.dataset.scrambleScrollVisible = '0';
    }

    const originalText = el.textContent;
    if (!originalText || !originalText.trim()) return;

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

    // hide until entry reveal begins
    el.style.visibility = "hidden";

    let running = false;
    let loadTimers = [];
    let hoverTimers = [];

    function clearTimers(list){ list.forEach(t => clearTimeout(t)); list.length = 0; }

    function runOnce(onDone){
      if (running || animatable.length === 0) return;
      running = true;
      clearTimers(loadTimers);

      // show exactly when entry starts
      el.style.visibility = "visible";

      // start hidden
      chars.forEach(s => {
        s.classList.remove("active-current","active-trail");
        s.textContent = "\u00A0";
      });

      const overlap = 0.6;
      const baseStagger = Math.max(12, Math.round(SPEED * (1 - overlap)));
      let completed = 0;

      animatable.forEach((span, i) => {
        const flashes = 1;
        const flashInterval = Math.max(12, Math.round(SPEED / 2));
        const start = i * baseStagger;

        for (let f=0; f<flashes; f++){
          loadTimers.push(setTimeout(() => {
            span.classList.add("active-current");
            span.textContent = randSymbol();

            if (i>0){
              const trail = animatable[i-1];
              trail.classList.add("active-trail");
              trail.textContent = randSymbol();
            }
            if (i>1){
              const older = animatable[i-2];
              if (older){
                older.classList.remove("active-trail");
                older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
              }
            }
          }, start + f*flashInterval));
        }

        const revealTime = start + flashes*flashInterval + Math.round(SPEED * 0.15);
        loadTimers.push(setTimeout(() => {
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
            clearTimers(loadTimers);
            if (typeof onDone === "function") onDone();
          }
        }, revealTime));
      });
    }

    function runHoverOnce(onDone){
      if (running || animatable.length === 0) return;
      running = true;
      clearTimers(hoverTimers);

      const overlap = 0.5;
      const baseStagger = Math.max(20, Math.round(HOVER_SPEED * (1 - overlap)));
      let completed = 0;

      animatable.forEach(s => s.classList.remove("active-current","active-trail"));

      animatable.forEach((span, i) => {
        const flashes = 1 + Math.floor(Math.random() * 2);
        const flashInterval = Math.max(20, Math.round(HOVER_SPEED / 2));
        const start = i * baseStagger;

        for (let f=0; f<flashes; f++){
          hoverTimers.push(setTimeout(() => {
            span.classList.add("active-current");
            span.textContent = randSymbol();

            if (i>0){
              const trail = animatable[i-1];
              trail.classList.add("active-trail");
              trail.textContent = randSymbol();
            }
            if (i>1){
              const older = animatable[i-2];
              if (older){
                older.classList.remove("active-trail");
                older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
              }
            }
          }, start + f*flashInterval));
        }

        const revealTime = start + flashes*flashInterval + Math.round(HOVER_SPEED * 0.1);
        hoverTimers.push(setTimeout(() => {
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
            clearTimers(hoverTimers);
            if (typeof onDone === "function") onDone();
          }
        }, revealTime));
      });
    }

    const loadDelay = readVarMs(el, "--scramble-load-delay", 0) + GLOBAL_PAGELOAD_OFFSET;
    const loopStartDelay = readVarMs(el, "--scramble-loop-start-delay", 0) + GLOBAL_PAGELOAD_OFFSET;
    const loopPause = readVarMs(el, "--scramble-loop-pause", LOOP_DELAY);

    // If .scramble-scroll, defer animation to IntersectionObserver
    if (el.classList.contains('scramble-scroll')) {
      // Will be handled by observer
      return;
    }
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
          el.addEventListener("touchstart", () => runHoverOnce(), { passive:true });
        }
      });
    }, loadDelay);
  }

  // IntersectionObserver for .scramble-scroll
  let scrambleScrollObserver;
  function initAll(){
    document.querySelectorAll(".scramble-text").forEach(initOne);
    // Scramble-scroll logic
    // Group elements by offset value
    const offsetMap = {};
    scrollEls.forEach(el => {
      const offset = parseFloat(el.getAttribute('data-scramble-offset')) || 0.3;
      if (!offsetMap[offset]) offsetMap[offset] = [];
      offsetMap[offset].push(el);
    });
    // Create one observer per offset value
    Object.entries(offsetMap).forEach(([offset, els]) => {
      const threshold = parseFloat(offset);
      const observer = new window.IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          const el = entry.target;
          // Debug output
          // eslint-disable-next-line no-console
          console.log('[scramble-scroll]', {
            el,
            intersectionRatio: entry.intersectionRatio,
            threshold,
            isIntersecting: entry.isIntersecting
          });
          // Only trigger when crossing threshold and isIntersecting
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            if (!el.dataset.scrambleScrollDone) {
              el.dataset.scrambleScrollDone = '1';
              el.dataset.scrambleScrollVisible = '1';
              el.style.visibility = 'visible';
              // Run scramble animation (reuse runOnce logic)
              const chars = Array.from(el.querySelectorAll('.scramble-char'));
              const animatable = chars.filter(s => s.dataset.original.trim() !== "");
              let running = false;
              let loadTimers = [];
              function clearTimers(list){ list.forEach(t => clearTimeout(t)); list.length = 0; }
              function runOnce(onDone){
                if (running || animatable.length === 0) return;
                running = true;
                clearTimers(loadTimers);
                chars.forEach(s => {
                  s.classList.remove("active-current","active-trail");
                  s.textContent = "\u00A0";
                });
                const overlap = 0.6;
                const baseStagger = Math.max(12, Math.round(SPEED * (1 - overlap)));
                let completed = 0;
                animatable.forEach((span, i) => {
                  const flashes = 1;
                  const flashInterval = Math.max(12, Math.round(SPEED / 2));
                  const start = i * baseStagger;
                  for (let f=0; f<flashes; f++){
                    loadTimers.push(setTimeout(() => {
                      span.classList.add("active-current");
                      span.textContent = randSymbol();
                      if (i>0){
                        const trail = animatable[i-1];
                        trail.classList.add("active-trail");
                        trail.textContent = randSymbol();
                      }
                      if (i>1){
                        const older = animatable[i-2];
                        if (older){
                          older.classList.remove("active-trail");
                          older.textContent = older.dataset.original === " " ? "\u00A0" : older.dataset.original;
                        }
                      }
                    }, start + f*flashInterval));
                  }
                  const revealTime = start + flashes*flashInterval + Math.round(SPEED * 0.15);
                  loadTimers.push(setTimeout(() => {
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
                      clearTimers(loadTimers);
                      if (typeof onDone === "function") onDone();
                    }
                  }, revealTime));
                });
              }
              runOnce();
              // Only unobserve after animation is triggered
              observer.unobserve(el);
            }
          }
        });
      }, {
        threshold: [threshold]
      });
      els.forEach(el => {
        if (!el.dataset.scrambleScrollVisible || el.dataset.scrambleScrollVisible === '0') {
          el.style.visibility = 'hidden';
        }
        observer.observe(el);
      });
    });
  }

  // If preloader is done -> start now, else wait
  const start = () => {
    initAll();
    window.Webflow = window.Webflow || [];
    window.Webflow.push(initAll);
    setTimeout(initAll, 200);
  };

  if (window.__PRELOADER_DONE === true) start();
  else window.addEventListener("preloader:done", start, { once:true });
}
