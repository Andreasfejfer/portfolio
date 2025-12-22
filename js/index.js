import { initMarquee } from './marquee.js';
import { initPreloader } from './preloader.js';
import { initScramble } from './scramble.js';

// Initialize page effects on page-index (and any page that loads this bundle)
document.addEventListener('DOMContentLoaded', () => {
	// Preloader will no-op if absent; scramble handles skip logic across pages
	initPreloader();
	initScramble();

	if (document.body.classList.contains('page-index')) {
		document.querySelectorAll('.s-marquee').forEach(el => {
			initMarquee({ selector: el, speed: 20 });
		});
	}
});
