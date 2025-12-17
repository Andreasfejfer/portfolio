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
			// At the edge (strength=1), count=15; at center (strength=0), count=2
			const minCount = 2;
			const maxCount = 15;
			const count = Math.round((maxCount - minCount) * strength + minCount);

			// Flicker/lag effect: clear and re-add with a small delay if mouse moves fast
			if (img._repFlickerTimeout) clearTimeout(img._repFlickerTimeout);
			repeats.innerHTML = '';
			clones = [];
			img._repFlickerTimeout = setTimeout(() => {
				for (let i = 1; i < count; i++) {
					const clone = img.cloneNode();
					clone.classList.add('rep_repeat');
					clone.style.opacity = '1';
					clone.style.margin = '0';
					clone.style.border = 'none';
					clone.style.width = img.offsetWidth + 'px';
					clone.style.height = img.offsetHeight + 'px';
					clone.style.objectFit = window.getComputedStyle(img).objectFit;
					clone.style.objectPosition = window.getComputedStyle(img).objectPosition;
					repeats.appendChild(clone);
					clones.push(clone);
				}

				// Animate original image as well
				const allImages = [img, ...clones];
				allImages.forEach((el, i) => {
					// Original image is index 0, so push it further
					const base = (i === 0) ? 1.2 : 1;
					const offset = direction * (i + 1) * 60 * strength * base; // much more spread
					gsap.to(el, {
						x: offset,
						scaleY: 1,
						scaleX: 1,
						opacity: 1,
						duration: 0.45,
						ease: 'power3.out',
					});
				});
			}, 12 + Math.random() * 30); // 12-42ms delay for flicker/lag

			// (moved into flicker timeout above)
		});

		img.addEventListener('mouseleave', () => {
			isHovering = false;
			img.classList.remove('repeating');
			// Animate all images (original and clones) back to normal
			const allImages = [img, ...clones];
			allImages.forEach((el, i) => {
				gsap.to(el, {
					x: 0,
					scaleY: 1,
					scaleX: 1,
					opacity: 1,
					duration: 0.7,
					ease: 'power3.inOut',
					onComplete: () => {
						if (i > 0 && el.parentElement) el.parentElement.removeChild(el);
					}
				});
			});
			clones = [];
		});
	});
}
