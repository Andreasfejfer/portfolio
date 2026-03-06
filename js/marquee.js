// Infinite Marquee Animation Module
// Usage: import { initMarquee } from './marquee.js';
//        initMarquee({ selector: '.marquee', speed: 40 });

export function initMarquee({ selector = '.marquee', speed = 40 } = {}) {
  const marquee = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!marquee) return;
  if (marquee.dataset.marqueeInit === '1') return;
  marquee.dataset.marqueeInit = '1';

  const itemSelector = '.marquee__item, .marquee_div';
  const imageSelector = '.marquee__img, .marquee_img';
  const videoSelector = '.marquee_video, .marquue_video';
  const mediaSelector = imageSelector + ', ' + videoSelector;
  const initializedVideos = new WeakSet();

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

  const setupVideo = node => {
    const video = node && node.tagName === 'VIDEO' ? node : node && node.querySelector ? node.querySelector('video') : null;
    if (!video) return;
    if (initializedVideos.has(video)) return;
    initializedVideos.add(video);

    video.autoplay = true;
    video.loop = true;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'metadata';
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.removeAttribute('controls');

    const play = () => video.play().catch(() => {});
    video.addEventListener('ended', play);
    video.addEventListener('canplay', play);
    video.addEventListener('pause', () => {
      if (!video.ended && !video.seeking) play();
    });
    play();
  };

  marquee.querySelectorAll(videoSelector).forEach(setupVideo);

  // Assign a unique data-marquee-id to each item for hover class handling.
  items.forEach((item, i) => {
    item.dataset.marqueeId = i;
  });

  // Remove all items from their parents and add to track
  let track = marquee.querySelector('.marquee__track, .marquee_track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'marquee__track marquee_track';
    items.forEach(item => {
      if (item.parentNode) item.parentNode.removeChild(item);
      track.appendChild(item);
    });
    marquee.appendChild(track);
  }

  track.querySelectorAll(videoSelector).forEach(setupVideo);
  track.classList.add('marquee_track--js');
  track.style.setProperty('animation', 'none', 'important');
  track.style.setProperty('animation-name', 'none', 'important');
  track.style.setProperty('animation-duration', '0s', 'important');
  if (window.gsap && typeof window.gsap.killTweensOf === 'function') {
    window.gsap.killTweensOf(track);
  }

  const getItemOuterWidth = el => {
    const style = window.getComputedStyle(el);
    const ml = parseFloat(style.marginLeft) || 0;
    const mr = parseFloat(style.marginRight) || 0;
    return el.getBoundingClientRect().width + ml + mr;
  };

  const getPixelsPerSecond = () => {
    const total = Array.from(track.children).reduce((sum, child) => sum + getItemOuterWidth(child), 0);
    if (!total) return 0;
    // Keep existing API semantics where `speed` was duration-like.
    return Math.max(10, total / Math.max(1, speed));
  };

  let pxPerSecond = getPixelsPerSecond();
  let offset = 0;
  let last = 0;
  let lastVideoCheck = 0;
  let rafId = 0;

  const recycle = () => {
    let first = track.firstElementChild;
    while (first) {
      const firstWidth = getItemOuterWidth(first);
      if (firstWidth <= 0) break;
      if (offset > -firstWidth) break;
      offset += firstWidth;
      track.appendChild(first);
      first = track.firstElementChild;
    }
  };

  const tick = now => {
    if (!last) last = now;
    const dt = (now - last) / 1000;
    last = now;
    offset -= pxPerSecond * dt;
    recycle();
    track.style.transform = 'translate3d(' + offset + 'px, 0, 0)';
    if (now - lastVideoCheck > 500) {
      keepVideosPlaying();
      lastVideoCheck = now;
    }
    rafId = requestAnimationFrame(tick);
  };

  const keepVideosPlaying = () => {
    track.querySelectorAll('video').forEach(video => {
      if (video.paused && !video.ended) video.play().catch(() => {});
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      keepVideosPlaying();
      last = 0;
    }
  });
  window.addEventListener('resize', () => {
    pxPerSecond = getPixelsPerSecond();
    recycle();
  });

  rafId = requestAnimationFrame(tick);

  // Add hover effect: highlight matching item id.
  track.addEventListener('mouseover', function (e) {
    const target = e.target.closest(itemSelector);
    if (target && target.dataset.marqueeId) {
      const id = target.dataset.marqueeId;
      track.querySelectorAll('.marquee__item[data-marquee-id="' + id + '"], .marquee_div[data-marquee-id="' + id + '"]').forEach(item => {
        item.classList.add('marquee__item--active', 'marquee_div--active');
      });
    }
  });
  track.addEventListener('mouseout', function (e) {
    const target = e.target.closest(itemSelector);
    if (target && target.dataset.marqueeId) {
      const id = target.dataset.marqueeId;
      track.querySelectorAll('.marquee__item[data-marquee-id="' + id + '"], .marquee_div[data-marquee-id="' + id + '"]').forEach(item => {
        item.classList.remove('marquee__item--active', 'marquee_div--active');
      });
    }
  });

  // Optional cleanup hook if needed by host app.
  marquee.__destroyMarquee = () => {
    cancelAnimationFrame(rafId);
  };
}
