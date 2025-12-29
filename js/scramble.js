// js/scramble.js
export function initScramble() {

  const LETTERS_AND_SYMBOLS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','!','@','#','$','%','^','&','*','-','_','+','=',';',':','<','>',','];
  const LEGACY_SYMBOLS = ["#","€","&","%","/","*","$","!"];
  const LEGACY_SPEED = 240;
  const EFFECT1 = {
    duration: 0.03,
    repeat: 3,
    repeatDelay: 0.04,
    stagger: 0.07
  };
  const EFFECT2 = {
    duration: 0.03,
    repeat: 2,
    repeatDelay: 0.05,
    stagger: 0.06,
    bgDuration: 1,
    bgEase: "expo",
    bgBackDuration: 0.6,
    bgBackEase: "power4"
  };
  const LOOP_DELAY = 2000;
  const LEGACY_HOVER_SPEED = 120;
  let preloaderJustFinished = false;

  const hasGsap = typeof window !== "undefined" && typeof gsap !== "undefined";

  const pickRandom = () => LETTERS_AND_SYMBOLS[Math.floor(Math.random() * LETTERS_AND_SYMBOLS.length)];
  const pickLegacy = () => LEGACY_SYMBOLS[Math.floor(Math.random() * LEGACY_SYMBOLS.length)];
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
    const isLoop = el.classList.contains("scramble-loop");

    if (el.classList.contains('scramble-black')) {
      el.classList.add('scramble-color-black');
    } else if (el.classList.contains('scramble-white')) {
      el.classList.add('scramble-color-white');
    }

    if (isScrollScramble) {
      hideScramble(el);
      el.dataset.scrambleScrollVisible = '0';
    }

    const originalNodes = Array.from(el.childNodes).map(n => n.cloneNode(true));
    if (!originalNodes.length) return;

    el.innerHTML = "";

    const preserveAll = el.dataset.scramblePreserve === "1" || el.classList.contains("scramble-preserve");
    let chars = [];
    let animatable = [];
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
        const preserve = node.dataset.scramblePreserve === "1" || node.classList.contains("scramble-preserve");
        if (preserve) {
          const clone = node.cloneNode(false);
          parent.appendChild(clone);
          clone.dataset.scramblePreserve = "1";
          Array.from(node.textContent).forEach(ch => {
            const span = document.createElement("span");
            span.className = "scramble-char";
            span.dataset.original = ch;
            span.dataset.scramblePreserve = "1";
            span.textContent = ch === " " ? "\u00A0" : ch;
            clone.appendChild(span);
            chars.push(span);
          });
          return;
        }
        const clone = node.cloneNode(false);
        parent.appendChild(clone);
        Array.from(node.childNodes).forEach(child => processNode(child, clone));
      }
    }

    function snapshotNode(node){
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent);
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Convert existing scramble chars back to plain text nodes
        if (node.classList && node.classList.contains("scramble-char")) {
          return document.createTextNode(node.textContent || node.dataset.original || "");
        }
        const clone = node.cloneNode(false);
        Array.from(node.childNodes).forEach(child => {
          const snapChild = snapshotNode(child);
          if (snapChild) clone.appendChild(snapChild);
        });
        return clone;
      }
      return null;
    }

    function rebuildFrom(nodes){
      el.innerHTML = "";
      chars = [];
      if (preserveAll) {
        const text = nodes.map(n => n.textContent || "").join("");
        Array.from(text).forEach(ch => {
          const span = document.createElement("span");
          span.className = "scramble-char";
          span.dataset.original = ch;
          span.textContent = ch === " " ? "\u00A0" : ch;
          el.appendChild(span);
          chars.push(span);
        });
        animatable = chars.filter(s => s.dataset.original.trim() !== "");
        return;
      }
      nodes.forEach(n => processNode(n, el));
      animatable = Array.from(el.querySelectorAll('.scramble-char')).filter(s => {
        if (s.dataset.scramblePreserve === "1") return true;
        return s.dataset.original.trim() !== "";
      });
    }

    rebuildFrom(originalNodes);

    const isHeadScramble = el.classList.contains('head') && el.classList.contains('scramble-text');
    const hasSeenPreloader = sessionStorage.getItem('preloader_shown_session') === "1";

    const onceKey = el.dataset.scrambleOnceKey || null;
    const onceFlagKey = onceKey ? `scramble_once:${onceKey}` : null;
    const hasPlayedOnce = onceFlagKey ? sessionStorage.getItem(onceFlagKey) === "1" : false;

    const skipAfterPreloader = hasSeenPreloader && !preloaderJustFinished && (isHeadScramble || !!onceFlagKey);
    const skipOnceReveal = hasPlayedOnce && !preloaderJustFinished;

    hideScramble(el);

    let running = false;
    let hoverLoopTimer = null;
    let pendingBack = false;
    let hovering = false;
    let legacyTimers = [];

    const setOriginalText = () => {
      chars.forEach(span => {
        span.classList.remove("active-current","active-trail");
        const ch = span.dataset.original;
        span.textContent = ch === " " ? "\u00A0" : ch;
        span.style.setProperty('--opa', '0');
      });
      if (hasGsap) {
        gsap.set(el, { '--anim': 0 });
      }
    };

    const killTweens = () => {
      if (!hasGsap) return;
      gsap.killTweensOf(chars);
      gsap.killTweensOf(el);
    };

    const clearLegacyTimers = () => {
      legacyTimers.forEach(t => clearTimeout(t));
      legacyTimers = [];
      running = false;
    };

    const playEffectOne = (onDone) => {
      rebuildFrom(Array.from(el.childNodes).map(n => snapshotNode(n)));
      if (running || animatable.length === 0) { onDone && onDone(); return; }
      running = true;
      killTweens();
      setOriginalText();
      showScramble(el);
      let completed = 0;

      animatable.forEach((span, idx) => {
        const original = span.dataset.original === " " ? "\u00A0" : span.dataset.original;
        let repeatCount = 0;

        if (!hasGsap) {
          span.textContent = original;
          completed++;
          if (completed >= animatable.length) {
            running = false;
            onDone && onDone();
          }
          return;
        }

        gsap.fromTo(span, { opacity: 0 }, {
          duration: EFFECT1.duration,
          repeat: EFFECT1.repeat,
          repeatRefresh: true,
          repeatDelay: EFFECT1.repeatDelay,
          delay: (idx + 1) * EFFECT1.stagger,
          innerHTML: () => pickRandom(),
          opacity: 1,
          onStart: () => {
            span.style.setProperty('--opa', '1');
          },
          onRepeat: () => {
            repeatCount++;
            if (repeatCount === 1) {
              span.style.setProperty('--opa', '0');
            }
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
    };

    const playLegacyEntry = (onDone) => {
      rebuildFrom(Array.from(el.childNodes).map(n => snapshotNode(n)));
      clearLegacyTimers();
      if (running || animatable.length === 0) { onDone && onDone(); return; }
      running = true;
      setOriginalText();
      showScramble(el);
      let completed = 0;

      const overlap = 0.6;
      const baseStagger = Math.max(12, Math.round(LEGACY_SPEED * (1 - overlap)));
      const flashInterval = Math.max(12, Math.round(LEGACY_SPEED / 2));

      animatable.forEach((span, i) => {
        const flashes = 1;
        const start = i * baseStagger;

        for (let f=0; f<flashes; f++){
          legacyTimers.push(setTimeout(() => {
            span.classList.add("active-current");
            span.textContent = pickLegacy();

            if (i>0){
              const trail = animatable[i-1];
              trail.classList.add("active-trail");
              trail.textContent = pickLegacy();
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

        const revealTime = start + flashes*flashInterval + Math.round(LEGACY_SPEED * 0.15);
        legacyTimers.push(setTimeout(() => {
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
            clearLegacyTimers();
            onDone && onDone();
          }
        }, revealTime));
      });
    };

    const playEffectTwo = (onDone) => {
      rebuildFrom(Array.from(el.childNodes).map(n => snapshotNode(n)));
      if (animatable.length === 0) { onDone && onDone(); return; }
      clearLegacyTimers();
      killTweens();
      running = true;
      setOriginalText();
      showScramble(el);
      let completed = 0;

      animatable.forEach((span, idx) => {
        const original = span.dataset.original === " " ? "\u00A0" : span.dataset.original;

        if (!hasGsap) {
          span.textContent = original;
          completed++;
          if (completed >= animatable.length) {
            running = false;
            onDone && onDone();
          }
          return;
        }

        gsap.fromTo(span, { opacity: 0 }, {
          duration: EFFECT2.duration,
          repeat: EFFECT2.repeat,
          repeatRefresh: true,
          repeatDelay: EFFECT2.repeatDelay,
          delay: (idx + 1) * EFFECT2.stagger,
          innerHTML: () => pickRandom(),
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

      if (hasGsap) {
        gsap.fromTo(el, { '--anim': 0 }, {
          duration: EFFECT2.bgDuration,
          ease: EFFECT2.bgEase,
          '--anim': 1
        });
      }
    };

    const playLegacyHover = (onDone) => {
      rebuildFrom(Array.from(el.childNodes).map(n => snapshotNode(n)));
      clearLegacyTimers();
      if (animatable.length === 0) { onDone && onDone(); return; }
      killTweens();
      running = true;
      setOriginalText();
      showScramble(el);
      let completed = 0;

      const overlap = 0.5;
      const baseStagger = Math.max(20, Math.round(LEGACY_HOVER_SPEED * (1 - overlap)));
      const flashInterval = Math.max(20, Math.round(LEGACY_HOVER_SPEED / 2));

      animatable.forEach((span, i) => {
        const flashes = 1 + Math.floor(Math.random() * 2);
        const start = i * baseStagger;

        for (let f=0; f<flashes; f++){
          legacyTimers.push(setTimeout(() => {
            span.classList.add("active-current");
            span.textContent = pickLegacy();

            if (i>0){
              const trail = animatable[i-1];
              trail.classList.add("active-trail");
              trail.textContent = pickLegacy();
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

        const revealTime = start + flashes*flashInterval + Math.round(LEGACY_HOVER_SPEED * 0.1);
        legacyTimers.push(setTimeout(() => {
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
            clearLegacyTimers();
            onDone && onDone();
          }
        }, revealTime));
      });
    };

    const animateBack = () => {
      clearLegacyTimers();
      if (hasGsap) {
        gsap.killTweensOf(el);
        gsap.to(el, {
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

    const clearHoverLoop = () => {
      if (hoverLoopTimer) {
        clearTimeout(hoverLoopTimer);
        hoverLoopTimer = null;
      }
    };

      const startHoverHandlers = () => {
        const startLoopingHover = () => {
          clearHoverLoop();
          clearLegacyTimers();
          const runLoop = () => {
          if (!hovering || pendingBack) {
            pendingBack = false;
            animateBack();
            return;
          }
          const runner = isLoop ? playLegacyHover : playEffectTwo;
          runner(() => {
            if (!hovering || pendingBack) {
              pendingBack = false;
              animateBack();
              return;
            }
            hoverLoopTimer = setTimeout(runLoop, loopPause);
          });
        };
        const delay = Math.max(0, loopStartDelay);
        if (delay === 0) runLoop();
        else hoverLoopTimer = setTimeout(runLoop, delay);
      };

      const startSingleHover = () => {
        clearHoverLoop();
        clearLegacyTimers();
        const runner = isLoop ? playLegacyHover : playEffectTwo;
        runner(() => {
          if (!hovering || pendingBack) {
            pendingBack = false;
            animateBack();
          }
        });
      };

      const onEnter = () => {
        hovering = true;
        pendingBack = false;
        running = false;
        clearHoverLoop();
        clearLegacyTimers();
        killTweens();
        if (isLoop) {
          startLoopingHover();
        } else {
          startSingleHover();
        }
      };

      const onLeave = () => {
        hovering = false;
        pendingBack = true;
        clearHoverLoop();
        clearLegacyTimers();
        if (!running) {
          animateBack();
        }
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("touchstart", onEnter, { passive:true });
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("touchend", onLeave, { passive:true });
    };

    if (skipAfterPreloader || skipOnceReveal) {
      setOriginalText();
      showScramble(el);
      startHoverHandlers();
      return;
    }

    if (isScrollScramble) {
      el.__scrambleTrigger = () => {
        setTimeout(() => {
          const entryRunner = isLoop ? playLegacyEntry : playEffectOne;
          entryRunner(() => startHoverHandlers());
        }, loadDelay);
      };
      return;
    }

    setTimeout(() => {
      const entryRunner = isLoop ? playLegacyEntry : playEffectOne;
      entryRunner(() => {
        startHoverHandlers();
      });
    }, loadDelay);
  }

  function initAll(){
    document.querySelectorAll(".scramble-text").forEach(initOne);
    // Safety: if anything is still hidden after init, reveal baseline text
    document.querySelectorAll(".scramble-text").forEach(el => {
      if (el.style.visibility === "hidden") {
        el.style.visibility = "visible";
        el.style.opacity = "1";
      }
    });
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

    const prevTops = new WeakMap();

    const setVisibleText = (el) => {
      Array.from(el.querySelectorAll('.scramble-char')).forEach(span => {
        const ch = span.dataset && typeof span.dataset.original !== "undefined" ? span.dataset.original : span.textContent;
        span.textContent = ch === " " ? "\u00A0" : ch;
      });
    };

    function triggerScramble(el) {
      el.dataset.scrambleScrollDone = '1';
      el.dataset.scrambleScrollVisible = '1';
      showScramble(el);
      const trigger = el.__scrambleTrigger;
      if (typeof trigger === "function") {
        trigger();
      } else {
        setVisibleText(el);
      }
    }

    function triggerFooterGroupIfNeeded() {
      if (footerTriggered || !footerContainer || !footerScrollEls.length) return;
      const rect = footerContainer.getBoundingClientRect();
      const offsetTrigger = window.innerHeight * 0.8;
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
