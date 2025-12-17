// GSAP Marquee Animation with Perfect Loop
// Requires GSAP to be loaded globally (via CDN in Webflow footer)

function duplicateMarqueeContent(trackSelector = '.marquee_track') {
  document.querySelectorAll(trackSelector).forEach(track => {
    // Duplicate all children for seamless loop
    track.innerHTML += track.innerHTML;
  });
}

function initGsapMarquee({ trackSelector = '.marquee_track', duration = 14 } = {}) {
  duplicateMarqueeContent(trackSelector);

  document.querySelectorAll(trackSelector).forEach(track => {
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

    track.addEventListener('mouseenter', function () {
      gsap.to(object, {
        value: 0,
        duration: 1.2,
        onUpdate: () => { tween.timeScale(object.value); }
      });
    });
    track.addEventListener('mouseleave', function () {
      gsap.to(object, {
        value: 1,
        duration: 1.2,
        onUpdate: () => { tween.timeScale(object.value); }
      });
    });
  });
}

// Initialize only if body has 'page-index' class
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-index')) {
    initGsapMarquee({ trackSelector: '.marquee_track', duration: 30 });
  }
});
import "./core.js";
import { initHomePage } from "./page-home.js";

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("page-home")) {
    initHomePage();
  }
});
