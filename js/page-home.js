import { initScramble } from "./scramble.js?v=1";
import { initPreloader } from "./preloader.js?v=1";

export function initHomePage() {
  initPreloader();
  initScramble();
}
