// Blur-in scroll effect inspired by Codrops ScrollBlurTypography (effect #2)
// Applies to elements matched by the provided selector (default: .h-in).
function splitIntoChars(el) {
  if (el.dataset.hInSplit === "1") {
    return Array.from(el.querySelectorAll(".h-in__char"));
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
        span.className = "h-in__char";
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
  el.dataset.hInSplit = "1";
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

export function initScrollBlurHeadings({ selector = ".h-in" } = {}) {
  if (typeof gsap === "undefined") return;
  if (!registerScrollTrigger()) return;

  document.querySelectorAll(selector).forEach(el => {
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
}
