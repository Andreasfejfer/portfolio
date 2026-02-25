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
  openBodyClass
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
  openSelector = "[data-overlay-open], a[href^='#']",
  closeSelector = "[data-overlay-close]",
  activePanelClass = "is-active",
  openBodyClass = "overlay-open"
} = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) return null;

  const view = createOverlayView({
    root,
    panelSelector,
    panelAttribute,
    activePanelClass,
    openBodyClass
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

  state.subscribe(route => {
    view.render(route);
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
    event => {
      const openTrigger = event.target.closest(openSelector);
      if (openTrigger) {
        const explicitRoute = openTrigger.getAttribute("data-overlay-open");
        const href = openTrigger.getAttribute("href");
        const route = resolveRoute(explicitRoute || (href && href.startsWith("#") ? href.slice(1) : null));
        if (route) {
          event.preventDefault();
          openRoute(route);
          return;
        }
      }

      const closeTrigger = event.target.closest(closeSelector);
      if (closeTrigger) {
        event.preventDefault();
        closeRoute();
      }
    },
    true
  );

  window.addEventListener("popstate", syncFromLocation, { passive: true });
  window.addEventListener("hashchange", syncFromLocation, { passive: true });

  return {
    open: openRoute,
    close: closeRoute,
    getCurrentRoute: state.getCurrentRoute
  };
}
