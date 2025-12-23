// GSAP Marquee Animation with Perfect Loop
// Requires GSAP to be loaded globally (via CDN in Webflow footer)

try {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
} catch(e){}

let __PAGE_INDEX_RETURN_Y = null;
(function primeReturnScroll() {
  function run() {
    const body = document.body;
    if (!body || !body.classList.contains("page-index")) return;
    try {
      const data = sessionStorage.getItem("page_index_return");
      if (!data) return;
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.y === "number" && isFinite(parsed.y)) {
        __PAGE_INDEX_RETURN_Y = parsed.y;
        sessionStorage.removeItem("page_index_return");
        // Try to jump immediately to reduce flicker
        window.scrollTo(0, parsed.y);
        const wrapper = document.querySelector(".page_wrapper");
        if (wrapper) {
          wrapper.style.opacity = "0";
          wrapper.style.willChange = "opacity";
        }
        // Hide the document briefly to avoid showing the top before scroll snaps
        document.documentElement.style.visibility = "hidden";
        document.documentElement.dataset.returningIndex = "1";
      }
    } catch (e) {
      // ignore
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();


function waitForImages(track) {
  const images = Array.from(track.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();
  return Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }));
}

function duplicateMarqueeContent(track) {
  track.innerHTML += track.innerHTML;
}

async function initGsapMarquee({ trackSelector = '.marquee_track', duration = 14, fadeInDelayMs = 500, fadeInDurationMs = 600 } = {}) {
  const tracks = document.querySelectorAll(trackSelector);
  for (const track of tracks) {
    await waitForImages(track);
    // Assign unique data-marquee-id to each image before duplication (use correct class)
    const images = Array.from(track.querySelectorAll('img.marquee_img'));
    images.forEach((img, i) => {
      img.dataset.marqueeId = i;
    });
    duplicateMarqueeContent(track);
    const totalWidth = track.scrollWidth / 2;
    let object = { value: 1 };
    let tween = gsap.to(track, {
      x: () => `-${totalWidth}px`,
      duration: duration,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize(x => parseFloat(x) % totalWidth)
      }
    });
    // Fade images in a bit slower
    images.forEach(img => {
      img.style.opacity = "0";
      img.style.transition = `opacity ${fadeInDurationMs}ms ease`;
      setTimeout(() => {
        img.style.opacity = "1";
      }, fadeInDelayMs);
    });
    // Marquee no longer pauses on hover

    // Hover effect: highlight all images with the same data-marquee-id (use correct class)
    // Store original src/alt for all images
    const allImgs = Array.from(track.querySelectorAll('img.marquee_img'));
    allImgs.forEach(img => {
      img.dataset.originalSrc = img.src;
      img.dataset.originalAlt = img.alt;
    });

    let isHovering = false;
    let hoverTimeout = null;

    function activateAllImgs(target) {
      const newSrc = target.src;
      const newAlt = target.alt;
      allImgs.forEach(img => {
        img.src = newSrc;
        img.alt = newAlt;
        img.classList.add('marquee_img--active');
      });
    }
    function deactivateAllImgs() {
      allImgs.forEach(img => {
        img.src = img.dataset.originalSrc;
        img.alt = img.dataset.originalAlt;
        img.classList.remove('marquee_img--active');
      });
    }

    // Mouseenter on image: activate
    track.addEventListener('mouseenter', function (e) {
      const target = e.target.closest('img.marquee_img');
      if (target) {
        isHovering = true;
        clearTimeout(hoverTimeout);
        activateAllImgs(target);
      }
    }, true);

    // Mouseleave on image: deactivate
    track.addEventListener('mouseleave', function (e) {
      if (isHovering) {
        isHovering = false;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          deactivateAllImgs();
        }, 0);
      }
    }, true);
  }
}

// Initialize only if body has 'page-index' class
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-index')) {
    initGsapMarquee({ trackSelector: '.marquee_track', duration: 30 });
    initMarqueeTitleFloat();
  }
});
import "./core.js";
import { initHomePage } from "./page-home.js";
import { initPreloader } from "./preloader.js";
import { initScramble } from "./scramble.js";
import { initRepet } from "./repet.js";
import { initBackground } from "./background.js";

// Simple page fade-out on internal navigation (no fade-in to avoid header flicker)
function initPageFade({ durationMs = 2000 } = {}) {
  if (window.__PAGE_FADE_BOUND) return;
  window.__PAGE_FADE_BOUND = true;

  const wrapper = document.querySelector(".page_wrapper");
  if (!wrapper) return;

  // Hint browser for smoother opacity changes
  wrapper.style.willChange = "opacity";

  const isInternalLink = (link) => {
    if (!link) return false;
    const href = link.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;
    if (link.hostname && link.hostname !== window.location.hostname) return false;
    if (link.closest("[data-skip-page-fade=\"1\"]")) return false;
    return true;
  };

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!isInternalLink(link)) return;

    // Respect modifier keys/new-tab intent
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    const href = link.getAttribute("href");
    wrapper.style.transition = `opacity ${durationMs}ms ease`;
    requestAnimationFrame(() => {
      wrapper.style.opacity = "0";
    });
    setTimeout(() => {
      window.location.href = href;
    }, durationMs);
  }, true);
}

function initMarqueeTitleFloat({
  trackSelector = ".marquee_track",
  titleSelector = ".s-title",
  itemSelector = ".w-dyn-item",
  targetTop = "40vh",
  targetLeft = "30vw",
  fadeDurationMs = 2000,
  extraNavDelayMs = 800
} = {}) {
  const tracks = Array.from(document.querySelectorAll(trackSelector));
  if (!tracks.length) return;

  const wrapper = document.querySelector(".page_wrapper");
  const RETURN_KEY = "page_index_return";

  function storeReturn(scrollY) {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({ y: scrollY }));
  }

  // Convert CSS length to px for scroll anchor
  function resolveToPx(val, axis = "y") {
    if (typeof val === "number") return val;
    if (!val || typeof val !== "string") return 0;
    const num = parseFloat(val);
    if (!isFinite(num)) return 0;
    if (val.endsWith("vh")) return (window.innerHeight * num) / 100;
    if (val.endsWith("vw")) return (window.innerWidth * num) / 100;
    if (val.endsWith("rem")) {
      const root = getComputedStyle(document.documentElement).fontSize;
      const rootPx = parseFloat(root) || 16;
      return rootPx * num;
    }
    if (val.endsWith("em")) {
      const root = getComputedStyle(document.documentElement).fontSize;
      const rootPx = parseFloat(root) || 16;
      return rootPx * num;
    }
    return num; // assume px
  }

  // Simple smooth scroll with ease-in-out
  function smoothScrollTo(y, duration = 1200) {
    const start = window.scrollY;
    const dist = y - start;
    if (Math.abs(dist) < 1 || duration <= 0) {
      window.scrollTo(0, y);
      return Promise.resolve();
    }
    const startTime = performance.now();
    return new Promise(resolve => {
      function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        // easeInOutSine
        const eased = -(Math.cos(Math.PI * t) - 1) / 2;
        window.scrollTo(0, start + dist * eased);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  tracks.forEach(track => {
    track.dataset.skipPageFade = "1";
    track.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      const img = e.target.closest(".marquee_img");
      if (!link || !img) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      const item = img.closest(itemSelector) || img.closest("[data-marquee-item]") || img.closest("a");
      const titleEl = item ? item.querySelector(titleSelector) : null;
      if (!titleEl) {
        window.location.href = link.href;
        return;
      }

      const titleRect = titleEl.getBoundingClientRect();
      const absTop = titleRect.top + window.scrollY;
      const targetTopPx = resolveToPx(targetTop, "y");
      const targetY = Math.max(0, absTop - targetTopPx);
      storeReturn(targetY);

      const scrollDuration = 1200;

      const runFloat = () => new Promise(resolve => {
        // Re-measure after scroll so we start from the current on-page spot
        const afterRect = titleEl.getBoundingClientRect();
        const clone = titleEl.cloneNode(true);
        Object.assign(clone.style, {
          position: "fixed",
          left: `${afterRect.left}px`,
          top: `${afterRect.top}px`,
          transform: "translate(0, 0)",
          margin: "0",
          pointerEvents: "none",
          zIndex: "2000",
          whiteSpace: "nowrap"
        });
        titleEl.style.visibility = "hidden";
        document.body.appendChild(clone);

        if (typeof gsap !== "undefined") {
          gsap.to(clone, {
            duration: scrollDuration / 1000,
            ease: "power3.inOut",
            top: `${afterRect.top}px`, // lock vertical, only move horizontally
            left: targetLeft,
            xPercent: 0,
            yPercent: 0,
            onComplete: resolve
          });
        } else {
          clone.style.transition = `all ${scrollDuration}ms ease-in-out`;
          requestAnimationFrame(() => {
            clone.style.top = `${afterRect.top}px`;
            clone.style.left = targetLeft;
            clone.style.transform = "translate(0, 0)";
          });
          setTimeout(resolve, scrollDuration);
        }
      });

      // Scroll first (title moves naturally), then float horizontally + fade together, then navigate
      smoothScrollTo(targetY, scrollDuration)
        .then(() => {
          const fadePromise = new Promise(resolve => {
            if (wrapper) {
              wrapper.style.willChange = "opacity";
              wrapper.style.opacity = "1";
              wrapper.style.transition = `opacity ${fadeDurationMs}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
              requestAnimationFrame(() => { wrapper.style.opacity = "0"; });
              setTimeout(resolve, fadeDurationMs + 10);
            } else {
              resolve();
            }
          });
          return Promise.all([runFloat(), fadePromise]);
        })
        .then(() => {
          setTimeout(() => {
            window.location.href = link.href;
          }, extraNavDelayMs);
        });
    });
  });
}

function initCmsReturnTitleFloat({
  linkSelector = ".return-index",
  fadeDurationMs = 2000,
  extraNavDelayMs = 800
} = {}) {
  const links = Array.from(document.querySelectorAll(linkSelector));
  if (!links.length) return;

  const wrapper = document.querySelector(".page_wrapper");

  links.forEach(link => {
    link.dataset.skipPageFade = "1";
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();

      const fadePromise = new Promise(resolve => {
        if (wrapper) {
          wrapper.style.willChange = "opacity";
          wrapper.style.opacity = "1";
          wrapper.style.transition = `opacity ${fadeDurationMs}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
          requestAnimationFrame(() => { wrapper.style.opacity = "0"; });
          setTimeout(resolve, fadeDurationMs + 10);
        } else {
          resolve();
        }
      });

      fadePromise.then(() => {
        setTimeout(() => {
          window.location.href = link.href;
        }, extraNavDelayMs);
      });
    });
  });
}

// Hint browser to prefetch likely next page(s)
function initPrefetchNext() {
  const PREFETCH_URLS = [
    "https://andreas-fejfer.webflow.io/work-index"
  ];
  PREFETCH_URLS.forEach(url => {
    if (!url) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = url;
    document.head.appendChild(link);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPageFade();
  initPrefetchNext();
  initRepet();
  initBackground();

  if (document.body.classList.contains("page-home")) {
    initHomePage();
    return;
  }

  // For other pages, still initialize preloader (no-ops if absent) and scramble
  initPreloader();
  initScramble();
  initCmsReturnTitleFloat();

  // Restore index scroll on return
  if (document.body.classList.contains("page-index")) {
    const wrapper = document.querySelector(".page_wrapper");
    const y = __PAGE_INDEX_RETURN_Y;
    if (y !== null) {
      if (wrapper) {
        wrapper.style.opacity = "0";
        wrapper.style.willChange = "opacity";
      }
      // Ensure we're at the right spot before showing
      window.scrollTo(0, y);
      // Give the browser a moment to settle, then fade in
      setTimeout(() => {
        requestAnimationFrame(() => {
          document.documentElement.style.visibility = "visible";
          delete document.documentElement.dataset.returningIndex;
          if (wrapper) {
            wrapper.style.transition = "opacity 1800ms ease";
            wrapper.style.opacity = "1";
          }
        });
      }, 500);
    } else if (wrapper) {
      // Normal load: reveal after a tiny delay to avoid flash
      setTimeout(() => {
        requestAnimationFrame(() => {
          wrapper.style.transition = "opacity 600ms ease";
          wrapper.style.opacity = "1";
        });
      }, 100);
    }
  }
});
