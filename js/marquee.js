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
  const itemByIdSelector = id => '.marquee__item[data-marquee-id="' + id + '"], .marquee_div[data-marquee-id="' + id + '"]';

  const setupVideo = node => {
    const video = node && node.tagName === 'VIDEO' ? node : node && node.querySelector ? node.querySelector('video') : null;
    if (!video) return;
    if (initializedVideos.has(video)) return;
    initializedVideos.add(video);

    const forcePlay = () => {
      video.play().catch(() => {});
    };

    video.autoplay = true;
    video.loop = true;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = 'auto';
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'auto');
    video.removeAttribute('controls');

    // Safety fallback: if the browser ignores loop, restart manually.
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      forcePlay();
    });

    // Some browsers can pause/stall autoplaying videos inside moving marquees.
    video.addEventListener('pause', () => {
      if (!video.ended && !video.seeking) forcePlay();
    });
    video.addEventListener('stalled', forcePlay);
    video.addEventListener('suspend', forcePlay);
    video.addEventListener('canplay', forcePlay);
    video.addEventListener('timeupdate', () => {
      if (!video.duration || !Number.isFinite(video.duration)) return;
      if (video.duration - video.currentTime < 0.08) {
        video.currentTime = 0;
        forcePlay();
      }
    });

    forcePlay();
  };

  marquee.querySelectorAll(videoSelector).forEach(setupVideo);

  // Assign a unique data-marquee-id to each item (before duplication)
  items.forEach((item, i) => {
    item.dataset.marqueeId = i;
  });

  // Remove all images from their parents and add to track
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

  // Duplicate items for seamless loop if not already duplicated.
  // Avoid innerHTML cloning to keep media nodes stable.
  if (track.children.length === items.length) {
    const clones = Array.from(track.children).map(node => node.cloneNode(true));
    const fragment = document.createDocumentFragment();
    clones.forEach(clone => fragment.appendChild(clone));
    track.appendChild(fragment);
  }

  track.querySelectorAll(videoSelector).forEach(setupVideo);

  const keepVideosPlaying = () => {
    track.querySelectorAll('video').forEach(video => {
      if (video.paused && !video.ended) {
        video.play().catch(() => {});
      }
    });
  };
  track.addEventListener('animationiteration', keepVideosPlaying);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) keepVideosPlaying();
  });

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
