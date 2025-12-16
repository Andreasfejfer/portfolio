import { initPreloader } from "./preloader.js";
import { initMainScrambleGated } from "./scramble.js";

export function initHomePage() {
  initPreloader();
  initMainScrambleGated();
}
