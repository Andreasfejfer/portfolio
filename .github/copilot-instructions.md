# Copilot Instructions for AI Coding Agents

## Project Overview
This is a minimal, modular JavaScript/CSS portfolio site. The codebase is organized for clarity and separation of concerns, with each feature in its own file. There is no build system or framework—scripts are loaded directly in the browser.

## Key Components
- **js/main.js**: Entry point. Initializes the homepage if the body has `page-home` class.
- **js/page-home.js**: Orchestrates homepage features by calling `initPreloader` and `initScramble`.
- **js/preloader.js**: Handles the preloader animation and session logic. Relies on `fontfaceobserver.js` for font loading.
- **js/scramble.js**: Implements animated text scrambling effects, with CSS hooks for color and timing.
- **js/fontfaceobserver.js**: Third-party font loading utility (BSD-3-Clause).
- **css/global.css**: Contains all styles, including preloader and scramble effect classes.

## Patterns & Conventions
- **No build step**: All files are plain JS/CSS, loaded as-is. Do not introduce bundlers or transpilers.
- **Module imports**: Use ES module imports for code organization. All imports are relative and reference sibling files.
- **Initialization**: Features are initialized via explicit `init*` functions, called from the main entry point or orchestrator modules.
- **Selectors**: DOM elements are selected using class-based selectors defined in CSS and referenced in JS constants.
- **Session logic**: Preloader uses `window.__PRELOADER_DONE` and sessionStorage to avoid repeat animations.
- **CSS variables**: Used for timing and animation customization (see `.scramble-delay-*` classes).

## Developer Workflow
- **Edit JS/CSS directly**: No compilation required. Reload the browser to see changes.
- **Add new features**: Create a new JS file, export an `init*` function, and import/call it from the relevant orchestrator (e.g., `page-home.js`).
- **Testing**: Manual, via browser. No automated tests or test runner present.
- **FontFaceObserver**: Ensure `js/fontfaceobserver.js` is included in HTML before scripts that depend on it.

## Examples
- To add a new homepage effect:
  1. Create `js/my-effect.js` with `export function initMyEffect() { ... }`.
  2. Import and call it in `js/page-home.js`.
- To customize scramble timing, add a class like `.scramble-delay-3000` in CSS and use it on the relevant element.

## Integration Points
- No external APIs or backend integration.
- All logic is client-side and self-contained.

## References
- See `js/main.js`, `js/page-home.js`, `js/preloader.js`, and `js/scramble.js` for core patterns.
- CSS hooks and variables are defined in `css/global.css`.

---
For questions or unclear patterns, review the orchestrator modules and CSS for examples before introducing new approaches.
