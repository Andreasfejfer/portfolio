// Infinite Marquee Animation Module
// Usage: import { initMarquee } from './marquee.js';
//        initMarquee({ selector: '.marquee', speed: 20 });

export function initMarquee({ selector = '.marquee', speed = 20 } = {}) {
  const marquee = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!marquee) return;
  let track = marquee.querySelector('.marquee__track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'marquee__track';
    while (marquee.firstChild) {
      track.appendChild(marquee.firstChild);
    }
    marquee.appendChild(track);
  }
  // Duplicate images for seamless loop
  if (track.children.length && track.children.length === [...track.children].length / 2) {
    track.innerHTML += track.innerHTML;
  }
  // Set animation duration based on speed
  track.style.animationDuration = speed + 's';
}
