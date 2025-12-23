// Layered hover + drag effect for elements with class "repet"
// Adapted from CodePen (effect 1) and scoped for Webflow usage.

const DEFAULT_LAYER_COUNT = 10;
const DEFAULT_SHAPE = "rectangle"; // rectangle, triangle, chevron, oval
const DEFAULT_EFFECT = "stroke"; // stroke or shade

function extractUrl(backgroundImage) {
  if (!backgroundImage || backgroundImage === "none") return null;
  const match = /url\((['"]?)(.*?)\1\)/.exec(backgroundImage);
  return match ? match[2] : null;
}

class RepetEffect {
  constructor(el) {
    if (el.dataset.repetInit === "1") return;
    el.dataset.repetInit = "1";

    this.el = el;
    this.layers = [];
    this.layerOutlines = [];
    this.layerShadows = [];

    this.innerTotal = parseInt(el.dataset.repetLayers || DEFAULT_LAYER_COUNT, 10);
    if (!Number.isFinite(this.innerTotal) || this.innerTotal < 2) {
      this.innerTotal = DEFAULT_LAYER_COUNT;
    }

    this.currentShape = (el.dataset.repetShape || DEFAULT_SHAPE).toLowerCase();
    this.currentEffect = (el.dataset.repetEffect || DEFAULT_EFFECT).toLowerCase();
    this.transformOrigin = "50% 50%";

    this.duration = 0.8;
    this.ease = "power2.inOut";
    this.scaleInterval = 0.06;
    this.parallaxStrength = 20;
    this.dragLerpFactor = 0.1;
    this.rotationThreshold = 30;

    this.mouseX = 0;
    this.mouseY = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.isHovered = false;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragDistance = 0;
    this.smoothDragDistance = 0;
    this.isRotationActive = false;
    this.currentRotation = 0;
    this.currentScale = 1;
    this.animationFrame = null;
    this.hoverTimeline = null;

    this.bgImage = this.resolveImageUrl();
    if (!this.bgImage) return;

    this.init();
  }

  resolveImageUrl() {
    const dataSrc = this.el.dataset.repetSrc;
    if (dataSrc) return dataSrc;

    const computedBg = getComputedStyle(this.el).backgroundImage;
    const parsed = extractUrl(computedBg);
    if (parsed) return parsed;

    const img = this.el.querySelector("img");
    if (img && img.src) return img.src;

    return null;
  }

  init() {
    this.el.classList.add("repet-ready");
    this.el.style.backgroundImage = "none";
    this.el.style.transformOrigin = this.transformOrigin;

    this.createLayers();
    this.createLayerOutlines();
    this.createHoverTimeline();
    this.bindEvents();
    this.startAnimationLoop();
  }

  createLayers() {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < this.innerTotal; i++) {
      const layer = document.createElement("div");
      layer.className = "repet__layer";
      if (i === 0) {
        layer.classList.add("repet__layer--base");
      } else {
        layer.classList.add(this.currentShape);
      }
      layer.dataset.layer = i;
      layer.style.backgroundImage = `url(${this.bgImage})`;
      frag.appendChild(layer);
    }

    // Clear existing children, but keep them as overlay if needed
    const overlay = document.createElement("div");
    overlay.className = "repet__overlay";
    while (this.el.firstChild) {
      overlay.appendChild(this.el.firstChild);
    }

    this.el.appendChild(frag);
    if (overlay.childNodes.length) {
      this.el.appendChild(overlay);
    }

    this.layers = Array.from(this.el.querySelectorAll(".repet__layer"));
    this.updateCenter();
  }

  updateCenter() {
    const rect = this.el.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
  }

  createLayerOutlines() {
    this.layerOutlines.forEach((outline) => outline.remove());
    this.layerShadows.forEach((shadow) => shadow.remove());
    this.layerOutlines = [];
    this.layerShadows = [];

    this.layers.forEach((layer, index) => {
      if (index === 0) return;

      const outlineElement = document.createElement("div");
      outlineElement.className = "repet__outline";
      outlineElement.dataset.layer = index;

      const outlineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      outlineSvg.setAttribute("viewBox", "0 0 100 100");
      outlineSvg.setAttribute("preserveAspectRatio", "none");

      const outlinePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      outlinePath.setAttribute("d", this.getLayerShapePath());
      outlinePath.setAttribute("stroke", "#ffffff");
      outlinePath.setAttribute("stroke-width", "1");
      outlinePath.setAttribute("fill", "none");
      outlinePath.setAttribute("vector-effect", "non-scaling-stroke");
      outlinePath.style.filter = "drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))";

      outlineSvg.appendChild(outlinePath);
      outlineElement.appendChild(outlineSvg);

      const shadowElement = document.createElement("div");
      shadowElement.className = "repet__shadow";
      shadowElement.dataset.layer = index;

      const shadowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      shadowSvg.setAttribute("viewBox", "0 0 100 100");
      shadowSvg.setAttribute("preserveAspectRatio", "none");

      for (let shadowLayer = 0; shadowLayer < 3; shadowLayer++) {
        const shadowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        shadowPath.setAttribute("d", this.getLayerShapePath());
        const alpha = 0.4 - shadowLayer * 0.08;
        const strokeWidth = 3 - shadowLayer * 0.8;
        shadowPath.setAttribute("fill", "none");
        shadowPath.setAttribute("stroke", `rgba(0, 0, 0, ${alpha})`);
        shadowPath.setAttribute("stroke-width", strokeWidth);
        shadowPath.setAttribute("vector-effect", "non-scaling-stroke");
        shadowSvg.appendChild(shadowPath);
      }

      shadowElement.appendChild(shadowSvg);

      layer.appendChild(outlineElement);
      layer.appendChild(shadowElement);

      this.layerOutlines.push(outlineElement);
      this.layerShadows.push(shadowElement);
    });
  }

  getLayerShapePath() {
    switch (this.currentShape) {
      case "triangle":
        return "M 50 5 L 10 95 L 90 95 Z";
      case "chevron":
        return "M 75 0 L 100 50 L 75 100 L 0 100 L 25 50 L 0 0 Z";
      case "oval":
        return "M 50 15 C 74.85 15 95 31.32 95 50 C 95 68.68 74.85 85 50 85 C 25.15 85 5 68.68 5 50 C 5 31.32 25.15 15 50 15 Z";
      case "rectangle":
      default:
        return "M 0 0 L 100 0 L 100 100 L 0 100 Z";
    }
  }

  createHoverTimeline() {
    const getScaleValue = (i) => {
      const scaleValue = 1 - this.scaleInterval * i;
      return scaleValue >= 0 ? scaleValue : 0;
    };

    if (this.hoverTimeline) {
      this.hoverTimeline.kill();
    }

    const reversed = Array.from(this.layers).reverse();

    this.hoverTimeline = gsap.timeline({ paused: true }).to(reversed, {
      scale: (i, target) => {
        const originalIndex = this.layers.indexOf(target);
        return getScaleValue(originalIndex);
      },
      duration: this.duration,
      ease: this.ease,
      stagger: 0.1,
    });
  }

  bindEvents() {
    this.el.addEventListener("mouseenter", () => {
      this.isHovered = true;
      this.updateCenter();
      this.hoverTimeline && this.hoverTimeline.play();
    });

    this.el.addEventListener("mouseleave", () => {
      this.isHovered = false;
      this.hoverTimeline && this.hoverTimeline.reverse();
      this.resetTransforms();
    });

    this.el.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.dragDistance = e.clientY - this.dragStartY;
      if (Math.abs(this.dragDistance) > this.rotationThreshold && !this.isRotationActive) {
        this.isRotationActive = true;
        this.el.classList.add("repet--rotation");
      }
    });

    this.el.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.dragStartY = e.clientY;
      this.el.classList.add("repet--dragging");
      e.preventDefault();
    });

    document.addEventListener("mouseup", () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.el.classList.remove("repet--dragging");
      if (this.isHovered) {
        this.el.classList.remove("repet--dragging");
      }
      gsap.to(this, {
        dragDistance: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    });

    this.el.addEventListener("touchstart", (e) => {
      this.isDragging = true;
      this.dragStartY = e.touches[0].clientY;
      this.el.classList.add("repet--dragging");
      e.preventDefault();
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
      if (!this.isDragging) return;
      this.dragDistance = e.touches[0].clientY - this.dragStartY;
      if (Math.abs(this.dragDistance) > this.rotationThreshold && !this.isRotationActive) {
        this.isRotationActive = true;
        this.el.classList.add("repet--rotation");
      }
    }, { passive: false });

    document.addEventListener("touchend", () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.el.classList.remove("repet--dragging");
      gsap.to(this, {
        dragDistance: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    });

    window.addEventListener("resize", () => {
      this.updateCenter();
      this.createLayerOutlines();
    });
  }

  startAnimationLoop() {
    const animate = () => {
      this.smoothDragDistance += (this.dragDistance - this.smoothDragDistance) * this.dragLerpFactor;

      if (this.isHovered) {
        if (this.isRotationActive) {
          this.updateDragRotation();
          this.updateEffectVisibility();
        } else if (!this.isDragging) {
          this.updateParallax();
          this.updateEffectVisibility();
        }
      }

      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  updateParallax() {
    const deltaX = (this.mouseX - this.centerX) / (this.el.offsetWidth / 2);
    const deltaY = (this.mouseY - this.centerY) / (this.el.offsetHeight / 2);

    this.layers.forEach((layer, index) => {
      if (index === 0) return;

      const layerMultiplier = index * 0.2;
      const parallaxX = deltaX * this.parallaxStrength * layerMultiplier * 0.5;
      const parallaxY = deltaY * this.parallaxStrength * layerMultiplier * 0.5;

      gsap.set(layer, {
        x: parallaxX,
        y: parallaxY,
        z: index * 10,
        transformPerspective: 1000,
      });
    });
  }

  updateDragRotation() {
    const rotationProgress = Math.min(Math.abs(this.smoothDragDistance) / 100, 1);

    this.layers.forEach((layer, index) => {
      if (index === 0) return;

      const baseRotation = (this.smoothDragDistance / 2) * rotationProgress;
      const layerRotation = baseRotation * (index * 0.3);

      const deltaX = (this.mouseX - this.centerX) / (this.el.offsetWidth / 2);
      const deltaY = (this.mouseY - this.centerY) / (this.el.offsetHeight / 2);

      const layerMultiplier = index * 0.3;
      const parallaxX = deltaX * this.parallaxStrength * layerMultiplier;
      const parallaxY = deltaY * this.parallaxStrength * layerMultiplier;

      gsap.set(layer, {
        x: parallaxX,
        y: parallaxY,
        z: index * 15,
        rotationX: deltaY * 15 * rotationProgress,
        rotationY: deltaX * -15 * rotationProgress,
        rotationZ: layerRotation,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      });
    });

    this.currentRotation = this.smoothDragDistance / 2;
    this.currentScale = 1 + Math.abs(rotationProgress) * 2;
  }

  updateEffectVisibility() {
    this.layerOutlines.forEach((outline) => {
      if (this.currentEffect === "stroke" && this.isRotationActive) {
        outline.classList.add("is-active");
      } else {
        outline.classList.remove("is-active");
      }
    });

    this.layerShadows.forEach((shadow) => {
      if (this.currentEffect === "shade" && this.isRotationActive) {
        shadow.classList.add("is-active");
      } else {
        shadow.classList.remove("is-active");
      }
    });
  }

  resetTransforms() {
    this.layers.forEach((layer, index) => {
      if (index === 0) return;
      gsap.to(layer, {
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    });

    gsap.to(this, {
      smoothDragDistance: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        this.dragDistance = 0;
      },
    });

    this.isRotationActive = false;
    this.el.classList.remove("repet--rotation");
    this.currentRotation = 0;
    this.currentScale = 1;

    this.layerOutlines.forEach((outline) => outline.classList.remove("is-active"));
    this.layerShadows.forEach((shadow) => shadow.classList.remove("is-active"));
  }
}

export function initRepet() {
  if (typeof window === "undefined" || typeof gsap === "undefined") return;
  const targets = Array.from(document.querySelectorAll(".repet"));
  targets.forEach((el) => new RepetEffect(el));
}

// Expose globally for non-module usage
if (typeof window !== "undefined" && !window.initRepet) {
  window.initRepet = initRepet;
}
