import { initMarquee } from './marquee.js';

// Initialize marquee only if body has 'page-index' class
document.addEventListener('DOMContentLoaded', () => {
	if (document.body.classList.contains('page-index')) {
		document.querySelectorAll('.s-marquee').forEach(el => {
			initMarquee({ selector: el, speed: 20 });
		});
	}
});
