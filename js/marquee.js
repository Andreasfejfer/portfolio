// Infinite Marquee Animation Module
// Usage: import { initMarquee } from './marquee.js';
//        initMarquee({ selector: '.marquee', speed: 40 });

export function initMarquee({ selector = '.marquee', speed = 40 } = {}) {
  const marquee = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!marquee) return;

  // Only select image elements with the correct class
  const images = Array.from(marquee.querySelectorAll('.marquee__img'));
  if (!images.length) return;

  const setupVideo = video => {
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.play().catch(() => {});
  };

  marquee.querySelectorAll('.marquee_video').forEach(setupVideo);

  // Assign a unique data-marquee-id to each image (before duplication)
  images.forEach((img, i) => {
    img.dataset.marqueeId = i;
  });

  // Remove all images from their parents and add to track
  let track = marquee.querySelector('.marquee__track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'marquee__track';
    images.forEach(img => {
      if (img.parentNode) img.parentNode.removeChild(img);
      track.appendChild(img);
    });
    marquee.appendChild(track);
  }

  // Duplicate images for seamless loop if not already duplicated
  if (track.children.length === images.length) {
    track.innerHTML += track.innerHTML;
  }

  track.querySelectorAll('.marquee_video').forEach(setupVideo);

  // Set animation duration based on speed
  track.style.animationDuration = speed + 's';

  // Add hover effect: highlight all images with the same data-marquee-id
  track.addEventListener('mouseover', function (e) {
    const target = e.target.closest('.marquee__img');
    if (target && target.dataset.marqueeId) {
      const id = target.dataset.marqueeId;
      marquee.querySelectorAll('.marquee__img[data-marquee-id="' + id + '"]').forEach(img => {
        img.classList.add('marquee__img--active');
      });
    }
  });
  track.addEventListener('mouseout', function (e) {
    const target = e.target.closest('.marquee__img');
    if (target && target.dataset.marqueeId) {
      const id = target.dataset.marqueeId;
      marquee.querySelectorAll('.marquee__img[data-marquee-id="' + id + '"]').forEach(img => {
        img.classList.remove('marquee__img--active');
      });
    }
  });
}
