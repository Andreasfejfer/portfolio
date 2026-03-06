// Infinite Marquee Animation Module
// Usage: import { initMarquee } from './marquee.js';
//        initMarquee({ selector: '.marquee', speed: 40 });

export function initMarquee({ selector = '.marquee', speed = 40 } = {}) {
  const marquee = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!marquee) return;

  const itemSelector = '.marquee__item, .marquee_div';
  const imageSelector = '.marquee__img, .marquee_img';
  const videoSelector = '.marquee_video, .marquue_video';
  const mediaSelector = imageSelector + ', ' + videoSelector;

  // Normalize legacy image-only markup into wrapper items.
  const normalizeToItem = node => {
    if (!node) return null;
    if (node.matches(itemSelector)) return node;
    if (!node.matches(mediaSelector)) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'marquee_div';
    if (node.parentNode) {
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
    }
    return wrapper;
  };

  let items = Array.from(marquee.querySelectorAll(itemSelector));
  if (!items.length) {
    items = Array.from(marquee.querySelectorAll(mediaSelector))
      .map(normalizeToItem)
      .filter(Boolean);
  }
  if (!items.length) return;
  const itemByIdSelector = id => '.marquee__item[data-marquee-id="' + id + '"], .marquee_div[data-marquee-id="' + id + '"]';

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

  marquee.querySelectorAll(videoSelector).forEach(setupVideo);

  // Assign a unique data-marquee-id to each item (before duplication)
  items.forEach((item, i) => {
    item.dataset.marqueeId = i;
  });

  // Remove all images from their parents and add to track
  let track = marquee.querySelector('.marquee__track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'marquee__track';
    items.forEach(item => {
      if (item.parentNode) item.parentNode.removeChild(item);
      track.appendChild(item);
    });
    marquee.appendChild(track);
  }

  // Duplicate images for seamless loop if not already duplicated
  if (track.children.length === items.length) {
    track.innerHTML += track.innerHTML;
  }

  track.querySelectorAll(videoSelector).forEach(setupVideo);

  // Set animation duration based on speed
  track.style.animationDuration = speed + 's';

  // Add hover effect: highlight all items with the same data-marquee-id
  track.addEventListener('mouseover', function (e) {
    const target = e.target.closest(itemSelector);
    if (target && target.dataset.marqueeId) {
      const id = target.dataset.marqueeId;
      marquee.querySelectorAll(itemByIdSelector(id)).forEach(item => {
        item.classList.add('marquee__item--active', 'marquee_div--active');
      });
    }
  });
  track.addEventListener('mouseout', function (e) {
    const target = e.target.closest(itemSelector);
    if (target && target.dataset.marqueeId) {
      const id = target.dataset.marqueeId;
      marquee.querySelectorAll(itemByIdSelector(id)).forEach(item => {
        item.classList.remove('marquee__item--active', 'marquee_div--active');
      });
    }
  });
}
