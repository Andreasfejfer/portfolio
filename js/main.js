// GSAP Marquee Animation with Perfect Loop
// Requires GSAP to be loaded globally (via CDN in Webflow footer)


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

async function initGsapMarquee({ trackSelector = '.marquee_track', duration = 14 } = {}) {
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
  targetTop = "8rem",
  fadeDurationMs = 2000,
  scrollWaitMs = 350,
  extraNavDelayMs = 120
} = {}) {
  const tracks = Array.from(document.querySelectorAll(trackSelector));
  if (!tracks.length) return;

  const wrapper = document.querySelector(".page_wrapper");
  const RETURN_KEY = "page_index_return";

  function storeReturn(scrollY) {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({ y: scrollY }));
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

      const targetY = Math.max(0, (item.getBoundingClientRect().top + window.scrollY));
      storeReturn(targetY);
      window.scrollTo({ top: targetY, behavior: "smooth" });

      const rect = titleEl.getBoundingClientRect();
      const clone = titleEl.cloneNode(true);
      Object.assign(clone.style, {
        position: "fixed",
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + rect.height / 2}px`,
        transform: "translate(-50%, -50%)",
        margin: "0",
        pointerEvents: "none",
        zIndex: "2000",
        whiteSpace: "nowrap"
      });
      document.body.appendChild(clone);

      const run = () => {
        if (typeof gsap !== "undefined") {
          gsap.to(clone, {
            duration: 0.6,
            ease: "power3.out",
            top: targetTop,
            left: "50%",
            xPercent: -50,
            yPercent: 0
          });
        } else {
          clone.style.top = targetTop;
          clone.style.left = "50%";
          clone.style.transform = "translate(-50%, 0)";
        }

        if (wrapper) {
          wrapper.style.transition = `opacity ${fadeDurationMs}ms ease`;
          requestAnimationFrame(() => {
            wrapper.style.opacity = "0";
          });
        }

        setTimeout(() => {
          window.location.href = link.href;
        }, fadeDurationMs + extraNavDelayMs);
      };

      setTimeout(run, scrollWaitMs);
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

  // Restore index scroll on return
  if (document.body.classList.contains("page-index")) {
    try {
      const data = sessionStorage.getItem("page_index_return");
      if (data) {
        const parsed = JSON.parse(data);
        sessionStorage.removeItem("page_index_return");
        if (parsed && typeof parsed.y === "number" && isFinite(parsed.y)) {
          setTimeout(() => {
            window.scrollTo({ top: parsed.y, behavior: "auto" });
          }, 50);
        }
      }
    } catch (err) {
      // ignore
    }
  }
});
