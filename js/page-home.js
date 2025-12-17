import { initPreloader } from "./preloader.js";
import { initScramble } from "./scramble.js";
import { initRepetitionEffectGSAP } from "./repitetion.js";

export function initHomePage() {
  initPreloader();
  initScramble();
  initRepetitionEffectGSAP();
}
