import { initScramble } from "./scramble.js";
import { initPreloader } from "./preloader.js";

export async function initHomePage() {
  await initPreloader({
    // justér hvis din preloader-tekst skal have mere/mindre tid
    preloaderTextWaitMs: 1800,
  });

  // Alt andet starter først efter preloader er færdig
  initScramble();
}
