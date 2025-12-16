import { initScramble } from "./scramble.js";
import { initPreloader } from "./preloader.js";

export function initHomePage() {
  initPreloader();
  initScramble();
}
