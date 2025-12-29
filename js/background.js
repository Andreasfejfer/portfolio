const PAIR_GAP_PX = 20;
const PAIRS_PER_20VW = 3;
const MIN_PAIR_SPACING_PX = 100;
const MAX_PAIRS = 11;
const LINE_SELECTOR = ".background__line";
const ROOT_SELECTOR = ".background, .blackbg";

export function initBackground() {
  const roots = Array.from(document.querySelectorAll(ROOT_SELECTOR)).filter(
    (root) => root && root.dataset.backgroundInit !== "1"
  );
  if (!roots.length) return;

  roots.forEach((root) => {
    root.dataset.backgroundInit = "1";

    const render = () => {
      const availableWidth = Math.max(root.clientWidth || 0, 1);
      const styles = getComputedStyle(root);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const available = availableWidth - paddingLeft - paddingRight;
      if (available <= 0) return;

      const baseSpacing = (available * 0.2) / PAIRS_PER_20VW;
      const initialSpacing = Math.max(baseSpacing, MIN_PAIR_SPACING_PX);
      const targetCount = Math.round(available / initialSpacing);

      let pairCount = Math.max(1, targetCount);
      if (pairCount % 2 === 0) pairCount += 1;
      pairCount = Math.min(pairCount, MAX_PAIRS);

      let pairSpacing = pairCount > 1 ? available / (pairCount - 1) : available;
      while (pairCount > 1 && pairSpacing < MIN_PAIR_SPACING_PX) {
        pairCount = Math.max(1, pairCount - 2);
        pairSpacing = pairCount > 1 ? available / (pairCount - 1) : available;
      }

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
  });
}
