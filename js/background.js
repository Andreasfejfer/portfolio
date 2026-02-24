const DEFAULT_PAIR_GAP_PX = 20;
const DEFAULT_PAIRS_BY_BREAKPOINT = {
  desktop: 11,
  laptop: 9,
  tablet: 7,
  mobile: 5,
  tiny: 3,
};
const LINE_SELECTOR = ".background__line";
const ROOT_SELECTOR = ".background, .blackbg";

function parseCssNumber(value) {
  if (!value) return null;
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function resolvePairGapPx(styles) {
  const cssGap = parseCssNumber(styles.getPropertyValue("--bg-pair-gap"));
  return cssGap && cssGap > 0 ? cssGap : DEFAULT_PAIR_GAP_PX;
}

function resolvePairsByBreakpoint(styles) {
  const desktop =
    parseCssNumber(styles.getPropertyValue("--bg-pairs-desktop")) ??
    DEFAULT_PAIRS_BY_BREAKPOINT.desktop;
  const laptop =
    parseCssNumber(styles.getPropertyValue("--bg-pairs-laptop")) ??
    DEFAULT_PAIRS_BY_BREAKPOINT.laptop;
  const tablet =
    parseCssNumber(styles.getPropertyValue("--bg-pairs-tablet")) ??
    DEFAULT_PAIRS_BY_BREAKPOINT.tablet;
  const mobile =
    parseCssNumber(styles.getPropertyValue("--bg-pairs-mobile")) ??
    DEFAULT_PAIRS_BY_BREAKPOINT.mobile;
  const tiny =
    parseCssNumber(styles.getPropertyValue("--bg-pairs-tiny")) ??
    DEFAULT_PAIRS_BY_BREAKPOINT.tiny;

  return { desktop, laptop, tablet, mobile, tiny };
}

function normalizePairCount(value) {
  let count = Math.max(1, Math.round(value));
  if (count % 2 === 0) count += 1;
  return count;
}

function resolvePairCount(viewportWidth, styles) {
  const pairs = resolvePairsByBreakpoint(styles);

  if (viewportWidth >= 1440) return normalizePairCount(pairs.desktop);
  if (viewportWidth >= 1200) return normalizePairCount(pairs.laptop);
  if (viewportWidth >= 900) return normalizePairCount(pairs.tablet);
  if (viewportWidth >= 560) return normalizePairCount(pairs.mobile);
  return normalizePairCount(pairs.tiny);
}

export function initBackground() {
  const roots = Array.from(document.querySelectorAll(ROOT_SELECTOR)).filter(
    (root) => root && root.dataset.backgroundInit !== "1"
  );
  if (!roots.length) return;

  roots.forEach((root) => {
    root.dataset.backgroundInit = "1";

    const render = () => {
      const documentWidth = document.documentElement.clientWidth || window.innerWidth;
      const scrollbarWidth = Math.max(0, window.innerWidth - documentWidth);
      const styles = getComputedStyle(root);
      const isFixed = styles.position === "fixed";

      // Keep fixed background width aligned with the document content box (excludes scrollbar width).
      root.style.left = "0px";
      root.style.right = isFixed ? `${scrollbarWidth}px` : "0px";

      const availableWidth = Math.max(root.clientWidth || 0, 1);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const available = availableWidth - paddingLeft - paddingRight;
      if (available <= 0) return;

      const pairGap = resolvePairGapPx(styles);
      const pairCount = resolvePairCount(documentWidth, styles);
      const pairSpacing = pairCount > 1 ? available / (pairCount - 1) : available;

      const totalSpan = (pairCount - 1) * pairSpacing;
      const start = paddingLeft + (available - totalSpan) / 2;

      root.style.setProperty("--bg-pairs", String(pairCount));
      root.style.setProperty("--bg-intervals", String(Math.max(1, pairCount - 1)));
      root.style.setProperty("--bg-interval", `${pairSpacing}px`);

      const frag = document.createDocumentFragment();
      for (let i = 0; i < pairCount; i++) {
        const center = start + i * pairSpacing;
        [-pairGap / 2, pairGap / 2].forEach((offset) => {
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
