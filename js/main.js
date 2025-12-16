import "./core.js";
import { initHomePage } from "./page-home.js";

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("page-home")) {
    initHomePage();
  }
});
