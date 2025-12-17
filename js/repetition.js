// GSAP-based repetition effect for .rep_img
// Requires GSAP to be loaded in the page (via CDN or local file)
export function initRepetitionEffectGSAP() {
	console.log('Repetition effect initialized');
	document.querySelectorAll('.rep_img').forEach(img => {
		// Ensure image is wrapped in a container
		if (!img.parentElement.classList.contains('rep_container')) {
			const wrapper = document.createElement('div');
			wrapper.className = 'rep_container';
			img.parentNode.insertBefore(wrapper, img);
			wrapper.appendChild(img);
		}

		// Create repeats container
		let repeats = img.parentElement.querySelector('.rep_repeats');
		if (!repeats) {
			repeats = document.createElement('div');
			repeats.className = 'rep_repeats';
			img.parentElement.appendChild(repeats);
		}

		let isHovering = false;
		let clones = [];

		img.addEventListener('mouseenter', () => {
			isHovering = true;
			img.classList.add('repeating');
			repeats.innerHTML = '';
			clones = [];
		});

		img.addEventListener('mousemove', (e) => {
			if (!isHovering) return;
			const rect = img.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const percent = Math.min(Math.max(mouseX / rect.width, 0), 1);

			// Direction: left if mouse is left half, right if right half
			const direction = percent < 0.5 ? -1 : 1;
			const strength = Math.abs(percent - 0.5) * 2; // 0 (center) to 1 (edge)
			const count = Math.floor(6 * strength) + 2; // 2-8 repetitions

			console.log('mousemove', { percent, direction, strength, count });

			repeats.innerHTML = '';
			clones = [];
			for (let i = 1; i < count; i++) {
				const clone = img.cloneNode();
				clone.classList.add('rep_repeat');
				clone.style.opacity = '0';
				// Remove margin, border, and set width/height to match original
				clone.style.margin = '0';
				clone.style.border = 'none';
				clone.style.width = img.offsetWidth + 'px';
				clone.style.height = img.offsetHeight + 'px';
				// Copy object-fit and object-position if present
				clone.style.objectFit = window.getComputedStyle(img).objectFit;
				clone.style.objectPosition = window.getComputedStyle(img).objectPosition;
				repeats.appendChild(clone);
				clones.push(clone);
			}

			clones.forEach((clone, i) => {
				const offset = direction * (i + 1) * 30 * strength; // more spread
				gsap.to(clone, {
					x: offset,
					scale: 1 - (i + 1) * 0.04,
					opacity: 0.35 - (i * 0.05),
					duration: 0.3,
					ease: 'power2.out',
				});
			});
		});

		img.addEventListener('mouseleave', () => {
			isHovering = false;
			img.classList.remove('repeating');
			// Debug: Do not remove clones on mouseleave so you can inspect them
			// clones.forEach(clone => {
			//   gsap.to(clone, {
			//     opacity: 0,
			//     duration: 0.2,
			//     onComplete: () => {
			//       if (clone.parentElement) clone.parentElement.removeChild(clone);
			//     }
			//   });
			// });
			// clones = [];
		});
	});
}
