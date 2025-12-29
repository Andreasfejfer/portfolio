// js/scramble.js
export function initScramble() {
  const LETTERS_AND_SYMBOLS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!','@','#','$','%','^','&','*','-','_','+','=',';',':','<','>',','];
  const EFFECT1 = { duration: 0.03, repeat: 3, repeatDelay: 0.04, stagger: 0.07 };
  const EFFECT2 = { duration: 0.03, repeat: 2, repeatDelay: 0.05, stagger: 0.06, bgDuration: 1, bgEase: "expo", bgBackDuration: 0.6, bgBackEase: "power4" };
  const LOOP_DELAY = 2000;
  let preloaderJustFinished = false;

  const randSymbol = () => LETTERS_AND_SYMBOLS[Math.floor(Math.random() * LETTERS_AND_SYMBOLS.length)];
  const hasGsap = () => (typeof window !== "undefined" && typeof window.gsap !== "undefined");

  const hideScramble = (el) => {
    el.classList.remove('scramble-visible');
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
  };
  const showScramble = (el) => {
    el.classList.add('scramble-visible');
    el.style.visibility = 'visible';
    el.style.opacity = '1';
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
    const isLoop = el.classList.contains('scramble-loop');

    if (el.classList.contains('scramble-black')) {
      el.classList.add('scramble-color-black');
    } else if (el.classList.contains('scramble-white')) {
      el.classList.add('scramble-color-white');
    }

    if (isScrollScramble) {
      hideScramble(el);
      el.dataset.scrambleScrollVisible = '0';
    }

    const originalNodes = Array.from(el.childNodes);
    if (!originalNodes.length) return;

    el.innerHTML = "";

    const chars = [];
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
        const clone = node.cloneNode(false);
        parent.appendChild(clone);
        Array.from(node.childNodes).forEach(child => processNode(child, clone));
      }
    }
    originalNodes.forEach(n => processNode(n, el));

    const animatable = Array.from(el.querySelectorAll('.scramble-char')).filter(s => s.dataset.original.trim() !== "");

    const isHeadScramble = el.classList.contains('head') && el.classList.contains('scramble-text');
    const hasSeenPreloader = sessionStorage.getItem('preloader_shown_session') === "1";
    const onceKey = el.dataset.scrambleOnceKey || null;
    const onceFlagKey = onceKey ? `scramble_once:${onceKey}` : null;
    const hasPlayedOnce = onceFlagKey ? sessionStorage.getItem(onceFlagKey) === "1" : false;
    const skipAfterPreloader = hasSeenPreloader && !preloaderJustFinished && (isHeadScramble || !!onceFlagKey);
    const skipOnceReveal = hasPlayedOnce && !preloaderJustFinished;

    hideScramble(el);

    let running = false;
    let loadTimers = [];
    let hoverTimer = null;

    const clearHoverTimer = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };

    const setOriginalText = () => {
      chars.forEach(span => {
        span.classList.remove("active-current","active-trail");
        const ch = span.dataset.original;
        span.textContent = ch === " " ? "\u00A0" : ch;
        span.style.setProperty('--opa', '0');
      });
      if (hasGsap()) {
        window.gsap.set(el, { '--anim': 0 });
      }
    };

    const killTweens = () => {
      if (!hasGsap()) return;
      window.gsap.killTweensOf(chars);
      window.gsap.killTweensOf(el);
    };

    function runEntry(onDone){
      if (!hasGsap()) { setOriginalText(); showScramble(el); onDone && onDone(); return; }
      if (running || animatable.length === 0) { onDone && onDone(); return; }
      running = true;
      clearTimers(loadTimers);
      killTweens();
      showScramble(el);
      setOriginalText();
      let completed = 0;
      animatable.forEach((span, idx) => {
        const original = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
        let repeatCount = 0;
        window.gsap.fromTo(span, { opacity: 0 }, {
          duration: EFFECT1.duration,
          repeat: EFFECT1.repeat,
          repeatRefresh: true,
          repeatDelay: EFFECT1.repeatDelay,
          delay: (idx + 1) * EFFECT1.stagger,
          innerHTML: () => randSymbol(),
          opacity: 1,
          onStart: () => span.style.setProperty('--opa', '1'),
          onRepeat: () => {
            repeatCount++;
            if (repeatCount === 1) span.style.setProperty('--opa', '0');
          },
          onComplete: () => {
            span.style.setProperty('--opa', '0');
            span.innerHTML = original;
            completed++;
            if (completed >= animatable.length) {
              running = false;
              onDone && onDone();
            }
          }
        });
      });
    }

    function runHover(onDone){
      if (!hasGsap()) { setOriginalText(); showScramble(el); onDone && onDone(); return; }
      if (running || animatable.length === 0) { onDone && onDone(); return; }
      running = true;
      killTweens();
      setOriginalText();
      showScramble(el);
      let completed = 0;
      animatable.forEach((span, idx) => {
        const original = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
        window.gsap.fromTo(span, { opacity: 0 }, {
          duration: EFFECT2.duration,
          repeat: EFFECT2.repeat,
          repeatRefresh: true,
          repeatDelay: EFFECT2.repeatDelay,
          delay: (idx + 1) * EFFECT2.stagger,
          innerHTML: () => randSymbol(),
          opacity: 1,
          onComplete: () => {
            span.innerHTML = original;
            completed++;
            if (completed >= animatable.length) {
              running = false;
              onDone && onDone();
            }
          }
        });
      });
      window.gsap.fromTo(el, { '--anim': 0 }, {
        duration: EFFECT2.bgDuration,
        ease: EFFECT2.bgEase,
        '--anim': 1
      });
    }

    const animateBack = () => {
      if (hasGsap()) {
        window.gsap.killTweensOf(chars);
        window.gsap.killTweensOf(el);
        window.gsap.to(el, {
          duration: EFFECT2.bgBackDuration,
          ease: EFFECT2.bgBackEase,
          '--anim': 0,
          onComplete: setOriginalText
        });
      } else {
        setOriginalText();
      }
      running = false;
    };

    const loadDelay = readVarMs(el, "--scramble-load-delay", 0);
    const loopStartDelay = readVarMs(el, "--scramble-loop-start-delay", 0);
    const loopPause = readVarMs(el, "--scramble-loop-pause", LOOP_DELAY);

    const startHoverHandlers = () => {
      const startLoopingHover = () => {
        clearHoverTimer();
        const loop = () => {
          runHover(() => {
            if (!el.matches(':hover')) {
              animateBack();
              return;
            }
            hoverTimer = setTimeout(loop, loopPause);
          });
        };
        hoverTimer = setTimeout(loop, loopStartDelay);
      };

      const startSingleHover = () => {
        clearHoverTimer();
        runHover(() => {
          if (!el.matches(':hover')) {
            animateBack();
          }
        });
      };

      el.addEventListener("pointerenter", () => {
        if (isLoop) startLoopingHover();
        else startSingleHover();
      });
      el.addEventListener("touchstart", () => {
        if (isLoop) startLoopingHover();
        else startSingleHover();
      }, { passive:true });
      el.addEventListener("pointerleave", () => {
        clearHoverTimer();
        animateBack();
      });
      el.addEventListener("touchend", () => {
        clearHoverTimer();
        animateBack();
      }, { passive:true });
    };

    if (skipAfterPreloader || skipOnceReveal) {
      animatable.forEach(span => {
        span.classList.remove("active-current","active-trail");
        span.textContent = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
      });
      showScramble(el);
      startHoverHandlers();
      return;
    }

    if (isScrollScramble) {
      el.__scrambleTrigger = () => {
        setTimeout(() => {
          runEntry(() => startHoverHandlers());
        }, loadDelay);
      };
      return;
    }
    setTimeout(() => {
      runEntry(() => {
        startHoverHandlers();
      });
    }, loadDelay);
  }

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
        if (prevTop === undefined && rect.top <= triggerPoint && rect.bottom > 0) {
          triggerScramble(el);
        }
        else if (
          prevTop !== undefined &&
          prevTop > triggerPoint &&
          rect.top <= triggerPoint &&
          rect.bottom > 0
        ) {
          triggerScramble(el);
        }
        prevTops.set(el, rect.top);
      });
    }

    window.addEventListener('scroll', checkScrambleScroll, { passive: true });
    window.addEventListener('resize', checkScrambleScroll);
    // Initial check in case already in view
    setTimeout(checkScrambleScroll, 10);
  }

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
