import { initMarquee } from './marquee.js';
import { initPreloader } from './preloader.js';

// Initialize marquee and preloader only if body has 'page-index' class
document.addEventListener('DOMContentLoaded', () => {
	if (document.body.classList.contains('page-index')) {
		initPreloader();
		document.querySelectorAll('.s-marquee').forEach(el => {
			initMarquee({ selector: el, speed: 20 });
		});
	}
});
