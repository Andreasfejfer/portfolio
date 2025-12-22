

export function initHomePage() {
  initPreloader();
  // Only run scramble after preloader is done (and session key is set)
  window.addEventListener("preloader:done", () => {
    setTimeout(() => {
      initScramble();
    }, 0);
  }, { once: true });
  // If preloader already done (e.g. on internal navigation), do not run scramble
}
