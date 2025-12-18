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
    // Assign unique data-marquee-id to each image before duplication
    const images = Array.from(track.querySelectorAll('img.marquee__img'));
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

    // Hover effect: highlight all images with the same data-marquee-id
    track.addEventListener('mouseover', function (e) {
      const target = e.target.closest('img.marquee__img');
      if (target && target.dataset.marqueeId) {
        const id = target.dataset.marqueeId;
        track.querySelectorAll('img.marquee__img[data-marquee-id="' + id + '"]').forEach(img => {
          img.classList.add('marquee__img--active');
        });
      }
    });
    track.addEventListener('mouseout', function (e) {
      const target = e.target.closest('img.marquee__img');
      if (target && target.dataset.marqueeId) {
        const id = target.dataset.marqueeId;
        track.querySelectorAll('img.marquee__img[data-marquee-id="' + id + '"]').forEach(img => {
          img.classList.remove('marquee__img--active');
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
