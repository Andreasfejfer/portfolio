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
    let object = { value: 1 };
    let tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      track,
      { xPercent: 0 },
      { xPercent: -50, duration: duration, ease: 'none' }
    );

    track.addEventListener('mouseenter', function () {
      gsap.fromTo(
        object,
        { value: 1 },
        {
          value: 0,
          duration: 1.2,
          onUpdate: () => { tl.timeScale(object.value); }
        }
      );
    });
    track.addEventListener('mouseleave', function () {
      gsap.fromTo(
        object,
        { value: 0 },
        {
          value: 1,
          duration: 1.2,
          onUpdate: () => { tl.timeScale(object.value); }
        }
      );
    });
  });
}

// Initialize only if body has 'page-index' class
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-index')) {
    initGsapMarquee({ trackSelector: '.marquee_track', duration: 14 });
  }
});
import "./core.js";
import { initHomePage } from "./page-home.js";

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("page-home")) {
    initHomePage();
  }
});
