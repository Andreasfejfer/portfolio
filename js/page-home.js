

export function initHomePage() {
  initPreloader();
  // Always run preloader scramble (handled inside preloader.js)
  // Only run main scramble after preloader is done (and session key is set)
  if (window.__PRELOADER_DONE === true) {
    // If preloader already done (internal navigation), do not run scramble
    return;
  }
  window.addEventListener("preloader:done", () => {
    setTimeout(() => {
      initScramble();
    }, 0);
  }, { once: true });
}
