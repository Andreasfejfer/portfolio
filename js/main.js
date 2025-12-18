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

    // Hover effect: highlight all images with the same data-marquee-id (use correct class)
    // Store original src/alt for all images
    const allImgs = Array.from(track.querySelectorAll('img.marquee_img'));
    allImgs.forEach(img => {
      img.dataset.originalSrc = img.src;
      img.dataset.originalAlt = img.alt;
    });

    track.addEventListener('mouseover', function (e) {
      const target = e.target.closest('img.marquee_img');
      if (target) {
        const newSrc = target.src;
        const newAlt = target.alt;
        allImgs.forEach(img => {
          img.src = newSrc;
          img.alt = newAlt;
          img.classList.add('marquee_img--active');
        });
      }
    });
    track.addEventListener('mouseout', function (e) {
      const target = e.target.closest('img.marquee_img');
      if (target) {
        allImgs.forEach(img => {
          img.src = img.dataset.originalSrc;
          img.alt = img.dataset.originalAlt;
          img.classList.remove('marquee_img--active');
        });
      }
    });
  }
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
