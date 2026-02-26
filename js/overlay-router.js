function normalizeRoute(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().replace(/^#/, "");
  return value || null;
}

function parseRouteFromHash(hash) {
  return normalizeRoute(hash ? hash.slice(1) : null);
}

function buildHash(route) {
  return route ? `#${route}` : "";
}

function loadLazyMedia(container) {
  if (!container || container.dataset.overlayLazyLoaded === "1") return;
  container.dataset.overlayLazyLoaded = "1";

  container.querySelectorAll("img[data-src], img[data-srcset]").forEach(img => {
    const src = img.getAttribute("data-src");
    const srcset = img.getAttribute("data-srcset");
    if (src) {
      img.setAttribute("src", src);
      img.removeAttribute("data-src");
    }
    if (srcset) {
      img.setAttribute("srcset", srcset);
      img.removeAttribute("data-srcset");
    }
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });

  container.querySelectorAll("source[data-srcset]").forEach(source => {
    const srcset = source.getAttribute("data-srcset");
    if (!srcset) return;
    source.setAttribute("srcset", srcset);
    source.removeAttribute("data-srcset");
  });

  container.querySelectorAll("iframe[data-src]").forEach(iframe => {
    const src = iframe.getAttribute("data-src");
    if (!src) return;
    iframe.setAttribute("src", src);
    iframe.removeAttribute("data-src");
  });

  container.querySelectorAll("video[data-src], video[data-poster], video source[data-src]").forEach(node => {
    const video = node.tagName === "VIDEO" ? node : node.closest("video");
    if (!video) return;
    const src = video.getAttribute("data-src");
    const poster = video.getAttribute("data-poster");
    if (poster) {
      video.setAttribute("poster", poster);
      video.removeAttribute("data-poster");
    }
    if (src) {
      video.setAttribute("src", src);
      video.removeAttribute("data-src");
    }
    if (video.preload === "none") video.preload = "metadata";
    video.querySelectorAll("source[data-src]").forEach(source => {
      const sourceSrc = source.getAttribute("data-src");
      if (!sourceSrc) return;
      source.setAttribute("src", sourceSrc);
      source.removeAttribute("data-src");
    });
    if (typeof video.load === "function") video.load();
  });
}

function createOverlayState(validRoutes) {
  let currentRoute = null;
  const listeners = new Set();

  const isValidRoute = route => !!route && validRoutes.has(route);

  const notify = () => {
    listeners.forEach(listener => listener(currentRoute));
  };

  return {
    getCurrentRoute() {
      return currentRoute;
    },
    isValidRoute,
    setRoute(route) {
      const next = isValidRoute(route) ? route : null;
      if (next === currentRoute) return false;
      currentRoute = next;
      notify();
      return true;
    },
    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

function createOverlayView({
  root,
  panelSelector,
  panelAttribute,
  activePanelClass,
  openBodyClass,
  lazyLoadOnOpen
}) {
  const panels = Array.from(root.querySelectorAll(panelSelector));
  const panelByRoute = new Map();
  panels.forEach(panel => {
    const route = normalizeRoute(panel.getAttribute(panelAttribute));
    if (!route) return;
    panelByRoute.set(route, panel);
  });

  let renderedRoute = null;

  const render = route => {
    if (route === renderedRoute) return;
    renderedRoute = route;

    const hasOpenPanel = !!route;

    panelByRoute.forEach((panel, panelRoute) => {
      const isActive = panelRoute === route;
      panel.classList.toggle(activePanelClass, isActive);
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", String(!isActive));
      if ("inert" in panel) panel.inert = !isActive;
      if (isActive && lazyLoadOnOpen) loadLazyMedia(panel);
    });

    root.classList.toggle(activePanelClass, hasOpenPanel);
    document.body.classList.toggle(openBodyClass, hasOpenPanel);
    document.documentElement.classList.toggle(openBodyClass, hasOpenPanel);
  };

  const getRoutes = () => new Set(panelByRoute.keys());

  return { render, getRoutes };
}

export function initOverlayRouter({
  rootSelector = "[data-overlay-root]",
  panelSelector = "[data-overlay-panel]",
  panelAttribute = "data-overlay-panel",
  openSelector = "[data-overlay-open]",
  closeSelector = "[data-overlay-close]",
  activePanelClass = "is-active",
  openBodyClass = "overlay-open",
  lazyLoadOnOpen = true,
  beforeOpen = null,
  beforeClose = null,
  onRouteChange = null
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) return null;

  const view = createOverlayView({
    root,
    panelSelector,
    panelAttribute,
    activePanelClass,
    openBodyClass,
    lazyLoadOnOpen
  });

  const state = createOverlayState(view.getRoutes());

  const resolveRoute = raw => {
    const route = normalizeRoute(raw);
    return state.isValidRoute(route) ? route : null;
  };

  const readRouteFromLocation = () => resolveRoute(parseRouteFromHash(window.location.hash));

  const writeHistory = (route, { replace = false } = {}) => {
    const hash = buildHash(route);
    const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
    const payload = { overlayRoute: route };
    if (replace) {
      window.history.replaceState(payload, "", nextUrl);
    } else {
      window.history.pushState(payload, "", nextUrl);
    }
  };

  const syncFromLocation = () => {
    state.setRoute(readRouteFromLocation());
  };

  const openRoute = (route, { replace = false } = {}) => {
    const next = resolveRoute(route);
    if (!next || next === state.getCurrentRoute()) return;
    writeHistory(next, { replace });
    state.setRoute(next);
  };

  const closeRoute = () => {
    if (!state.getCurrentRoute()) return;
    const historyRoute = resolveRoute(window.history.state && window.history.state.overlayRoute);
    if (historyRoute) {
      window.history.back();
      return;
    }
    writeHistory(null, { replace: true });
    state.setRoute(null);
  };

  const runCloseRoute = async (event = null) => {
    if (!state.getCurrentRoute()) return;
    if (typeof beforeClose === "function") {
      const shouldContinue = await beforeClose({
        route: state.getCurrentRoute(),
        event,
        close: () => closeRoute()
      });
      if (shouldContinue === false) return;
    }
    closeRoute();
  };

  state.subscribe(route => {
    view.render(route);
    if (typeof onRouteChange === "function") onRouteChange(route);
  });

  const initialRoute = readRouteFromLocation();
  if (initialRoute) {
    writeHistory(null, { replace: true });
    writeHistory(initialRoute);
    state.setRoute(initialRoute);
  } else {
    writeHistory(null, { replace: true });
    state.setRoute(null);
  }

  document.addEventListener(
    "click",
    async event => {
      const openTrigger = event.target.closest(openSelector);
      if (openTrigger) {
        const explicitRoute = openTrigger.getAttribute("data-overlay-open");
        const href = openTrigger.getAttribute("href");
        const route = resolveRoute(explicitRoute || (href && href.startsWith("#") ? href.slice(1) : null));
        if (route) {
          event.preventDefault();
          if (typeof beforeOpen === "function") {
            const shouldContinue = await beforeOpen({
              route,
              trigger: openTrigger,
              event,
              open: () => openRoute(route)
            });
            if (shouldContinue === false) return;
            if (state.getCurrentRoute() === route) return;
          }
          openRoute(route);
          return;
        }
      }

      const closeTrigger = event.target.closest(closeSelector);
      if (closeTrigger) {
        event.preventDefault();
        runCloseRoute(event);
      }
    },
    true
  );

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!state.getCurrentRoute()) return;
    runCloseRoute(event);
  });

  window.addEventListener("popstate", syncFromLocation, { passive: true });
  window.addEventListener("hashchange", syncFromLocation, { passive: true });

  return {
    open: openRoute,
    close: closeRoute,
    getCurrentRoute: state.getCurrentRoute
  };
}
