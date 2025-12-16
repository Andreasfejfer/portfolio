// js/preloader.js

export async function initPreloader(options = {}) {
  const cfg = {
    preloaderSelector: "#preloader",   // <- ændr hvis din hedder noget andet
    pageWrapperSelector: ".page_wrapper",
    nameSelector: ".name",
    scteSelector: ".scte",

    // timing
    fadeDurationMs: 400,
    scteDelayMs: 500,

    // hook: din preloader tekst-animation (returnér en Promise eller nothing)
    // fx: () => runYourPreloaderTextAnimation()
    runPreloaderText: null,

    ...options,
  };

  const preloaderEl = document.querySelector(cfg.preloaderSelector);
  const pageWrapperEl = document.querySelector(cfg.pageWrapperSelector);
  const nameEl = document.querySelector(cfg.nameSelector);
  const scteEl = document.querySelector(cfg.scteSelector);

  // Hvis der ingen preloader er, så bare fortsæt
  if (!preloaderEl) {
    console.log("Preloader init (no preloader found)");
    revealAfterPreloader({ nameEl, scteEl, cfg });
    document.dispatchEvent(new CustomEvent("preloader:done"));
    return;
  }

  console.log("Preloader init");

  // Sørg for at ting vi vil fade ind IKKE er synlige fra start
  hideInstant(nameEl);
  hideInstant(scteEl);

  // (valgfrit) skjul page wrapper indtil preloader er væk
  // Hvis du allerede gør det i CSS, kan du fjerne de 2 linjer:
  hideInstant(pageWrapperEl);
  showInstant(preloaderEl);

  // Vent til alt er loadet (images, fonts etc.) – så undgår vi flash
  await waitForWindowLoad();

  // Kør din preloader-tekst animation (hvis du sender en funktion ind)
  if (typeof cfg.runPreloaderText === "function") {
    try {
      await cfg.runPreloaderText();
    } catch (e) {
      console.warn("runPreloaderText failed, continuing:", e);
    }
  }

  // Fade preloader ud og fjern den
  await fadeOut(preloaderEl, cfg.fadeDurationMs);
  preloaderEl.style.display = "none";

  // Vis page wrapper (så dit site dukker op)
  showInstant(pageWrapperEl);

  // Fade in .name og .scte (0.5s delay på scte)
  await fadeIn(nameEl, cfg.fadeDurationMs);
  await wait(cfg.scteDelayMs);
  await fadeIn(scteEl, cfg.fadeDurationMs);

  // Fortæl resten af dit site: "preloader er færdig"
  document.dispatchEvent(new CustomEvent("preloader:done"));
}

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
  el.style.pointerEvents = "auto";
  // trigger reflow
  el.getBoundingClientRect();
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
  el.getBoundingClientRect();
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
