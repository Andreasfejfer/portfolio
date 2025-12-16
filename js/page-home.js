import { initScramble } from "./scramble.js";
import { initPreloader } from "./preloader.js";

export async function initHomePage() {
  await initPreloader({
    // Her kan vi senere hooke din preloader-tekst/scramble ind:
    // runPreloaderText: () => yourPreloaderTextPromise(),
  });

  // ALT andet starter først når preloader er done:
  initScramble();

  // Eller brug eventet, hvis du foretrækker:
  // document.addEventListener("preloader:done", () => {
  //   initScramble();
  // }, { once: true });
}
