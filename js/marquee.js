// Infinite Marquee Animation Module
// Usage: import { initMarquee } from './marquee.js';
//        initMarquee({ selector: '.marquee', speed: 20 });

export function initMarquee({ selector = '.marquee', speed = 20 } = {}) {
  const marquee = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!marquee) return;

  // Only select image elements with the correct class
  const images = Array.from(marquee.querySelectorAll('.marquee__img'));
  if (!images.length) return;

  // Remove images from marquee and add to track
  let track = marquee.querySelector('.marquee__track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'marquee__track';
    images.forEach(img => track.appendChild(img));
    marquee.appendChild(track);
  }

  // Duplicate images for seamless loop if not already duplicated
  if (track.children.length === images.length) {
    track.innerHTML += track.innerHTML;
  }

  // Set animation duration based on speed
  track.style.animationDuration = speed + 's';
}
