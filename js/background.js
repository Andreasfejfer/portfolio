const PAIR_GAP_PX = 20;
const PAIRS_PER_20VW = 3;
const MIN_PAIR_SPACING_PX = 80;
const LINE_SELECTOR = ".background__line";

export function initBackground() {
  const root = document.querySelector(".background");
  if (!root || root.dataset.backgroundInit === "1") return;
  root.dataset.backgroundInit = "1";

  const render = () => {
    const availableWidth = Math.max(root.clientWidth || 0, 1);
    const styles = getComputedStyle(root);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const available = availableWidth - paddingLeft - paddingRight;
    if (available <= 0) return;

    // Base spacing: 3 pairs every 20vw of the drawable area; clamp to keep at least 80px between pairs
    const baseSpacing = (available * 0.2) / PAIRS_PER_20VW;
    const pairSpacing = Math.max(baseSpacing, MIN_PAIR_SPACING_PX);

    let pairCount = Math.max(1, Math.round(available / pairSpacing));
    if (pairCount % 2 === 0) pairCount += 1; // ensure a center pair

    const totalSpan = (pairCount - 1) * pairSpacing;
    const start = paddingLeft + (available - totalSpan) / 2;

    const frag = document.createDocumentFragment();

    for (let i = 0; i < pairCount; i++) {
      const center = start + i * pairSpacing;
      [-PAIR_GAP_PX / 2, PAIR_GAP_PX / 2].forEach((offset) => {
        const line = document.createElement("span");
        line.className = "background__line";
        line.style.left = `${center + offset}px`;
        frag.appendChild(line);
      });
    }

    root.querySelectorAll(LINE_SELECTOR).forEach((node) => node.remove());
    root.appendChild(frag);
  };

  render();

  let resizeRaf = null;
  const onResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      render();
      resizeRaf = null;
    });
  };

  window.addEventListener("resize", onResize, { passive: true });
}
