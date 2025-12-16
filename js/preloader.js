// js/preloader.js

export async function initPreloader(options = {}) {
  const cfg = {
    // dine selectors
    preloaderSelector: ".preloader",
    preloaderTextSelector: ".scramble-text-preloader",

    // ting der skal fade ind efter preloader
    nameSelector: ".name",
    scteSelector: ".scte",

    // timing
    fadeDurationMs: 400,
    scteDelayMs: 500,

    // midlertidig: hvor længe vi "giver" preloader-tekst animationen
    // (vi kan senere skifte til at den venter på din rigtige scramble-finish)
    preloaderTextWaitMs: 1800,

    ...options,
  };

  const preloaderEl = document.querySelector(cfg.preloaderSelector);
  const preTextEl = document.querySelector(cfg.preloaderTextSelector);
  const nameEl = document.querySelector(cfg.nameSelector);
  const scteEl = document.querySelector(cfg.scteSelector);

  console.log("Preloader init");

  // Sørg for at .name og .scte ikke er synlige fra start
  hideInstant(nameEl);
  hideInstant(scteEl);

  // Hvis der ingen preloader er, så bare fortsæt
  if (!preloaderEl) {
    document.dispatchEvent(new CustomEvent("preloader:done"));
    return;
  }

  // Sørg for at preloaderen er synlig
  showInstant(preloaderEl);
  preloaderEl.style.opacity = "1";

  // Vent til alt er loadet (minimerer flash)
  await waitForWindowLoad();

  // Her: din preloader-tekst animation.
  // Lige nu: vi "giver" den tid til at køre (kan erstattes med rigtig hook bagefter).
  if (preTextEl) {
    showInstant(preTextEl);
  }
  await wait(cfg.preloaderTextWaitMs);

  // Fade preloader ud
  await fadeOut(preloaderEl, cfg.fadeDurationMs);
  preloaderEl.style.display = "none";

  // Fade ind: .name -> delay -> .scte
  await fadeIn(nameEl, cfg.fadeDurationMs);
  await wait(cfg.scteDelayMs);
  await fadeIn(scteEl, cfg.fadeDurationMs);

  // Signal til resten af sitet
  document.dispatchEvent(new CustomEvent("preloader:done"));
}

/* ---------------- helpers ---------------- */

function hideInstant(el) {
  if (!el) return;
  el.style.opacity = "0";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
}

function showInstant(el) {
  if (!el) return;
  el.style.visibility = "visible";
  el.style.pointerEvents = "";
}

function fadeOut(el, ms) {
  if (!el) return Promise.resolve();
  el.style.willChange = "opacity";
  el.style.transition = `opacity ${ms}ms ease`;
  el.style.opacity = "1";
  el.style.visibility = "visible";
  el.getBoundingClientRect(); // reflow
  el.style.opacity = "0";
  return wait(ms);
}

function fadeIn(el, ms) {
  if (!el) return Promise.resolve();
  el.style.willChange = "opacity";
  el.style.transition = `opacity ${ms}ms ease`;
  el.style.opacity = "0";
  el.style.visibility = "visible";
  el.style.pointerEvents = "auto";
  el.getBoundingClientRect(); // reflow
  el.style.opacity = "1";
  return wait(ms);
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function waitForWindowLoad() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((res) => window.addEventListener("load", res, { once: true }));
}
