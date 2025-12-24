// Blur-in scroll effect inspired by Codrops ScrollBlurTypography (effect #2)
// Applies to elements matched by the provided selector (default: .h-in).
function splitIntoChars(el, { charClass = "h-in__char", flag = "hInSplit" } = {}) {
  if (el.dataset[flag] === "1") {
    return Array.from(el.querySelectorAll(`.${charClass}`));
  }

  const chars = [];
  const originalNodes = Array.from(el.childNodes);
  el.innerHTML = "";

  function process(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const ch of node.textContent) {
        if (ch === " ") {
          parent.appendChild(document.createTextNode(" "));
          continue;
        }
        const span = document.createElement("span");
        span.className = charClass;
        span.textContent = ch;
        parent.appendChild(span);
        chars.push(span);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
      parent.appendChild(document.createElement("br"));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      Array.from(node.childNodes).forEach(child => process(child, clone));
    }
  }

  originalNodes.forEach(n => process(n, el));
  el.dataset[flag] = "1";
  return chars;
}

function splitNameIntoWordsAndChars(el) {
  if (el.dataset.nameSplit === "1") {
    return Array.from(el.querySelectorAll(".name__char"));
  }

  const text = el.textContent || "";
  el.innerHTML = "";
  const chars = [];

  const tokens = text.split(/(\s+)/);
  tokens.forEach(token => {
    if (/^\s+$/.test(token)) {
      el.appendChild(document.createTextNode(token));
      return;
    }
    if (!token) return;
    const word = document.createElement("span");
    word.className = "name__word";
    token.split("").forEach(ch => {
      const c = document.createElement("span");
      c.className = "name__char";
      c.textContent = ch;
      word.appendChild(c);
      chars.push(c);
    });
    el.appendChild(word);
  });

  el.dataset.nameSplit = "1";
  return chars;
}

function registerScrollTrigger() {
  if (typeof gsap === "undefined") return false;

  const plugin =
    typeof ScrollTrigger !== "undefined"
      ? ScrollTrigger
      : gsap.plugins?.ScrollTrigger || gsap.core?.globals?.ScrollTrigger;

  if (!plugin) return false;
  gsap.registerPlugin(plugin);
  return true;
}

function loadScrollTriggerFromCdn() {
  return new Promise(resolve => {
    const existing = document.querySelector('script[data-h-in-scrolltrigger]');
    if (existing) {
      existing.addEventListener("load", () => resolve(registerScrollTrigger()));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
    script.async = true;
    script.dataset.hInScrolltrigger = "1";
    script.onload = () => resolve(registerScrollTrigger());
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function initScrollBlurHeadings({ selector = ".h-in" } = {}) {
  if (typeof gsap === "undefined") return;

  const start = registerScrollTrigger()
    ? Promise.resolve(true)
    : loadScrollTriggerFromCdn();

  start.then(ok => {
    if (!ok) return;

    document.querySelectorAll(selector).forEach(el => {
      if (el.classList.contains("name")) return; // skip names to avoid scroll effect
      if (el.dataset.hInInit === "1") return;
      const chars = splitIntoChars(el);
      if (!chars.length) return;

      el.dataset.hInInit = "1";

      gsap.set(chars, {
        filter: "blur(10px) brightness(30%)",
        willChange: "filter"
      });

      gsap.fromTo(
        chars,
        { filter: "blur(10px) brightness(30%)", willChange: "filter" },
        {
          ease: "none",
          filter: "blur(0px) brightness(100%)",
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            start: "top bottom-=15%",
            end: "bottom center+=15%",
            scrub: true
          }
        }
      );
    });
  });
}

export function initRevealNames({ selector = ".name, .sc1", durationSeconds = 2, stagger = 0.05 } = {}) {
  if (typeof gsap === "undefined") return;

  const START_FILTER = "blur(10px) brightness(0%)"; // Codrops effect #1 styling

  const start = registerScrollTrigger()
    ? Promise.resolve(true)
    : loadScrollTriggerFromCdn();

  start.then(ok => {
    if (!ok) return;

    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.nameInit === "1") return;
      const chars = splitNameIntoWordsAndChars(el);
      if (!chars.length) return;

      el.dataset.nameInit = "1";

      gsap.fromTo(
        chars,
        { filter: "blur(10px) brightness(0%)", willChange: "filter" },
        {
          ease: "none",
          filter: "blur(0px) brightness(100%)",
          stagger,
          scrollTrigger: {
            trigger: el,
            start: "top bottom-=15%",
            end: "bottom center+=15%",
            scrub: true
          }
        }
      );
    });
  });
}
