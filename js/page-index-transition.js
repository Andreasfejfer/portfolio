const DEFAULTS = {
  trackSelector: ".marquee_track",
  triggerSelector: "a, img.marquee_img",
  richSelector: "[data-marquee-rich]",
  titleAttr: "data-marquee-title",
  richAttr: "data-marquee-rich",
  navigateDelay: 950,
};

function buildOverlay() {
  let container = document.querySelector(".marquee-transition");
  if (container) {
    return {
      container,
      scrim: container.querySelector(".marquee-transition__scrim"),
      titleEl: container.querySelector(".marquee-transition__title"),
      contentWrap: container.querySelector(".marquee-transition__content-wrap"),
      content: container.querySelector(".marquee-transition__content"),
      closeBtn: container.querySelector(".marquee-transition__close"),
    };
  }

  container = document.createElement("div");
  container.className = "marquee-transition";
  container.innerHTML = `
    <div class="marquee-transition__scrim"></div>
    <div class="marquee-transition__title"></div>
    <div class="marquee-transition__content-wrap">
      <div class="marquee-transition__content"></div>
    </div>
    <button class="marquee-transition__close" type="button" aria-label="Close">Close</button>
  `;
  document.body.appendChild(container);

  return {
    container,
    scrim: container.querySelector(".marquee-transition__scrim"),
    titleEl: container.querySelector(".marquee-transition__title"),
    contentWrap: container.querySelector(".marquee-transition__content-wrap"),
    content: container.querySelector(".marquee-transition__content"),
    closeBtn: container.querySelector(".marquee-transition__close"),
  };
}

function readTitle(trigger) {
  if (!trigger) return "";
  return (
    trigger.getAttribute("data-marquee-title") ||
    trigger.getAttribute("data-title") ||
    trigger.getAttribute("alt") ||
    trigger.getAttribute("aria-label") ||
    trigger.textContent ||
    ""
  ).trim();
}

function readRich(trigger, options) {
  if (!trigger) return "";
  const root =
    trigger.closest("[data-marquee-item]") ||
    trigger.closest("a") ||
    trigger.parentElement;

  const fromAttr =
    (root && root.getAttribute(options.richAttr)) ||
    trigger.getAttribute(options.richAttr) ||
    "";
  if (fromAttr) return fromAttr;

  const fromNode =
    (root && root.querySelector(options.richSelector)) ||
    trigger.closest(options.richSelector);
  if (fromNode) return fromNode.innerHTML;

  return "";
}

export function initMarqueeTransition(userOptions = {}) {
  const options = { ...DEFAULTS, ...userOptions };
  const tracks = Array.from(document.querySelectorAll(options.trackSelector));
  if (!tracks.length) return;

  const hasGsap = typeof gsap !== "undefined";
  const overlay = buildOverlay();
  const state = {
    busy: false,
    activeTimeline: null,
  };

  const body = document.body;

  function clearTimeline() {
    if (state.activeTimeline) {
      state.activeTimeline.kill();
      state.activeTimeline = null;
    }
  }

  function closeOverlay() {
    clearTimeline();
    if (hasGsap) {
      gsap.to(overlay.container, {
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          overlay.container.classList.remove("is-active");
          body.classList.remove("is-marquee-transition-open");
        },
      });
    } else {
      overlay.container.style.opacity = "0";
      overlay.container.classList.remove("is-active");
      body.classList.remove("is-marquee-transition-open");
    }
  }

  function openOverlay({ trigger, title, html, href }) {
    if (state.busy) return;
    state.busy = true;
    clearTimeline();

    overlay.titleEl.textContent = title || "";
    overlay.content.innerHTML = html || "";
    overlay.container.classList.add("is-active");
    body.classList.add("is-marquee-transition-open");

    const rect = trigger.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const targetX = window.innerWidth / 2;
    const targetY = Math.max(56, window.innerHeight * 0.12);

    if (!hasGsap) {
      overlay.container.style.opacity = "1";
      state.busy = false;
      if (href) window.location.assign(href);
      return;
    }

    overlay.container.style.opacity = "1";
    overlay.scrim.style.opacity = "1";

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        state.busy = false;
        if (href) {
          setTimeout(() => {
            window.location.assign(href);
          }, options.navigateDelay);
        }
      },
    });

    tl.set(overlay.scrim, { autoAlpha: 0 })
      .set(overlay.titleEl, {
        x: startX,
        y: startY,
        xPercent: -50,
        yPercent: -50,
        scale: 0.92,
      })
      .set(overlay.contentWrap, { autoAlpha: 0, y: 40 })
      .to(overlay.scrim, { autoAlpha: 1, duration: 0.45 }, 0)
      .to(
        overlay.titleEl,
        {
          x: targetX,
          y: targetY,
          xPercent: -50,
          yPercent: 0,
          scale: 1,
          duration: 0.7,
        },
        0
      )
      .to(
        overlay.contentWrap,
        { autoAlpha: 1, y: 0, duration: 0.6 },
        0.12
      );

    state.activeTimeline = tl;
  }

  function handleClick(event) {
    const trigger = event.target.closest(options.triggerSelector);
    if (!trigger) return;
    const link = trigger.closest("a[href]");
    if (link && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      return;
    }

    const title = readTitle(trigger);
    const html = readRich(trigger, options);
    const href = link ? link.getAttribute("href") : null;
    if (!title && !html) return;

    event.preventDefault();
    event.stopPropagation();
    openOverlay({ trigger, title, html, href });
  }

  tracks.forEach((track) => {
    track.dataset.skipPageFade = "1";
    track.dataset.marqueeTransition = "1";
    track.addEventListener("click", handleClick);
  });

  overlay.scrim.addEventListener("click", closeOverlay);
  overlay.closeBtn.addEventListener("click", closeOverlay);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
  });
}

// Fallback global exposure
if (typeof window !== "undefined" && !window.initMarqueeTransition) {
  window.initMarqueeTransition = initMarqueeTransition;
}
