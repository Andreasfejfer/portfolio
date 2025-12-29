// js/scramble.js
export function initScramble() {

  const SYMBOLS = ["#","€","&","%","/","*","$","!"];
  const SPEED = 240;
  const HOVER_SPEED = 120;
  const LOOP_DELAY = 2000;
  const GLOBAL_PAGELOAD_OFFSET = 1000;
  let preloaderJustFinished = false;

  const randSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const hideScramble = (el) => {
    el.classList.remove('scramble-visible');
    el.style.visibility = 'hidden';
  };
  const showScramble = (el) => {
    el.classList.add('scramble-visible');
    el.style.visibility = 'visible';
  };

  const readVarMs = (el, varName, fallback=0) => {
    const v = getComputedStyle(el).getPropertyValue(varName).trim();
    const ms = parseInt(v, 10);
    return Number.isFinite(ms) ? ms : fallback;
  };

  function initOne(el){
    if (el.dataset.scrambleInit === "1") return;
    el.dataset.scrambleInit = "1";
    const isScrollScramble = el.classList.contains('scramble-scroll');

    // Color mode: add class to parent for styling
    if (el.classList.contains('scramble-black')) {
      el.classList.add('scramble-color-black');
    } else if (el.classList.contains('scramble-white')) {
      el.classList.add('scramble-color-white');
    }

    // If .scramble-scroll, always start hidden and mark as not revealed
    if (isScrollScramble) {
      hideScramble(el);
      el.dataset.scrambleScrollVisible = '0';
    }

    // Scramble only text nodes, preserve child elements (e.g. <span>, <br>),
    // but collect all animatable spans in document order for unified animation
    const originalNodes = Array.from(el.childNodes);
    if (!originalNodes.length) return;

    el.innerHTML = "";

    const chars = [];
    // We'll collect animatable spans in document order, even inside children
    function processNode(node, parent) {
      if (node.nodeType === Node.TEXT_NODE) {
        Array.from(node.textContent).forEach(ch => {
          const span = document.createElement("span");
          span.className = "scramble-char";
          span.dataset.original = ch;
          span.textContent = ch === " " ? "\u00A0" : ch;
          parent.appendChild(span);
          chars.push(span);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
        parent.appendChild(document.createElement("br"));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // For other elements (e.g. span), clone and recurse into children
        const clone = node.cloneNode(false); // shallow clone
        parent.appendChild(clone);
        Array.from(node.childNodes).forEach(child => processNode(child, clone));
      }
    }

    originalNodes.forEach(n => processNode(n, el));

    // Now, collect all animatable spans in document order (deep)
    const animatable = Array.from(el.querySelectorAll('.scramble-char')).filter(s => s.dataset.original.trim() !== "");

    const isHeadScramble = el.classList.contains('head') && el.classList.contains('scramble-text');
    const hasSeenPreloader = sessionStorage.getItem('preloader_shown_session') === "1";

    // Optional: mark elements to reveal only once (e.g. headers) using data-scramble-once-key
    // (explicit key required; no implicit default grouping)
    const onceKey = el.dataset.scrambleOnceKey || null;
    const onceFlagKey = onceKey ? `scramble_once:${onceKey}` : null;
    const hasPlayedOnce = onceFlagKey ? sessionStorage.getItem(onceFlagKey) === "1" : false;

    // If the preloader already ran this session and we are not immediately after it,
    // skip the entry animation for headers or any once-key elements.
    const skipAfterPreloader = hasSeenPreloader && !preloaderJustFinished && (isHeadScramble || !!onceFlagKey);
    const skipOnceReveal = hasPlayedOnce && !preloaderJustFinished;

    

    // hide until entry reveal begins (unless we short-circuit for head after preloader)
    hideScramble(el);

    let running = false;
    let loadTimers = [];
    let hoverTimers = [];

    function clearTimers(list){ list.forEach(t => clearTimeout(t)); list.length = 0; }

    function runOnce(onDone){
      if (running || animatable.length === 0) return;
      running = true;
      clearTimers(loadTimers);

      // show exactly when entry starts
      showScramble(el);

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

    const loadDelay = readVarMs(el, "--scramble-load-delay", 0);
    const loopStartDelay = readVarMs(el, "--scramble-loop-start-delay", 0);
    const loopPause = readVarMs(el, "--scramble-loop-pause", LOOP_DELAY);
    const startHoverLoop = () => {
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
    };

    // Short-circuit header/once-marked elements after the preloader on later pages
    if (skipAfterPreloader || skipOnceReveal) {
      animatable.forEach(span => {
        span.classList.remove("active-current","active-trail");
        span.textContent = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
      });
      showScramble(el);
      startHoverLoop();
      return;
    }

    // If .scramble-scroll, defer animation to IntersectionObserver
    if (isScrollScramble) {
      el.__scrambleTrigger = () => {
        setTimeout(() => {
          runOnce(() => startHoverLoop());
        }, loadDelay);
      };
      return;
    }
    setTimeout(() => {
      runOnce(() => {
        startHoverLoop();
      });
    }, loadDelay);
  }

  // IntersectionObserver for .scramble-scroll
  function initAll(){
    
    document.querySelectorAll(".scramble-text").forEach(initOne);
    // Scramble-scroll logic
    const scrollEls = Array.from(document.querySelectorAll('.scramble-scroll'));
    scrollEls.forEach(el => {
      if (!el.dataset.scrambleScrollVisible || el.dataset.scrambleScrollVisible === '0') {
        hideScramble(el);
      }
    });
    const footerEl = document.querySelector('.footer');
    const footerInfoEl = footerEl ? footerEl.querySelector('.footer-info') : null;
    const footerContainer = footerInfoEl || footerEl;
    const footerScrollEls = footerContainer ? scrollEls.filter(el => footerContainer.contains(el)) : [];
    let footerTriggered = false;

    // Track previous top for each element
    const prevTops = new WeakMap();
    function triggerScramble(el) {
      el.dataset.scrambleScrollDone = '1';
      el.dataset.scrambleScrollVisible = '1';
      showScramble(el);
      const trigger = el.__scrambleTrigger;
      if (typeof trigger === "function") {
        trigger();
      } else {
        // Fallback: reuse legacy inline animation if trigger is missing
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
      }
    }

    function triggerFooterGroupIfNeeded() {
      if (footerTriggered || !footerContainer || !footerScrollEls.length) return;
      const rect = footerContainer.getBoundingClientRect();
      const offsetTrigger = window.innerHeight * 0.8; // 20% offset from bottom
      if (rect.top <= offsetTrigger && rect.bottom >= 0) {
        footerTriggered = true;
        footerScrollEls.forEach(triggerScramble);
      }
    }

    function checkScrambleScroll() {
      triggerFooterGroupIfNeeded();
      scrollEls.forEach(el => {
        if (el.dataset.scrambleScrollDone) return;
        const percent = parseFloat(el.getAttribute('data-scramble-offset')) || 70;
        const rect = el.getBoundingClientRect();
        const triggerPoint = window.innerHeight * (percent / 100);
        const prevTop = prevTops.get(el);
        // On first check, trigger if already in trigger zone
        if (prevTop === undefined && rect.top <= triggerPoint && rect.bottom > 0) {
          triggerScramble(el);
        }
        // On scroll, trigger only if crossing from above to below
        else if (
          prevTop !== undefined &&
          prevTop > triggerPoint &&
          rect.top <= triggerPoint &&
          rect.bottom > 0
        ) {
          triggerScramble(el);
        }
        // Update previous top
        prevTops.set(el, rect.top);
      });
    }

    window.addEventListener('scroll', checkScrambleScroll, { passive: true });
    window.addEventListener('resize', checkScrambleScroll);
    // Initial check in case already in view
    setTimeout(checkScrambleScroll, 10);
  }

  // If preloader is done -> start now, else wait
  const start = () => {
  
    preloaderJustFinished = window.__PRELOADER_JUST_FINISHED === true;
    if (preloaderJustFinished) {
      window.__PRELOADER_JUST_FINISHED = false;
    }
    initAll();
    window.Webflow = window.Webflow || [];
    window.Webflow.push(initAll);
    setTimeout(initAll, 200);
  };

  if (window.__PRELOADER_DONE === true) start();
  else window.addEventListener("preloader:done", start, { once:true });
}

// Fallback: expose globally in case scripts load non-module
if (typeof window !== "undefined" && !window.initScramble) {
  window.initScramble = initScramble;
}
