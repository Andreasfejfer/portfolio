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
		const maxCount = 15;

		// Create all clones once, keep them hidden initially
		function createClones() {
			repeats.innerHTML = '';
			clones = [];
			for (let i = 1; i < maxCount; i++) {
				const clone = img.cloneNode();
				clone.classList.add('rep_repeat');
				clone.style.opacity = '0';
				clone.style.margin = '0';
				clone.style.border = 'none';
				clone.style.width = img.offsetWidth + 'px';
				clone.style.height = img.offsetHeight + 'px';
				clone.style.objectFit = window.getComputedStyle(img).objectFit;
				clone.style.objectPosition = window.getComputedStyle(img).objectPosition;
				clone.style.position = 'absolute';
				clone.style.top = '0';
				clone.style.left = '0';
				clone.style.pointerEvents = 'none';
				repeats.appendChild(clone);
				clones.push(clone);
			}
		}
		createClones();

		img.addEventListener('mouseenter', () => {
			isHovering = true;
			img.classList.add('repeating');
			// Show all clones (opacity 0, will be set on mousemove)
			clones.forEach(clone => {
				clone.style.opacity = '0';
			});
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
			const count = Math.round((maxCount - minCount) * strength + minCount);

			// Only show the needed number of clones
			clones.forEach((clone, i) => {
				if (i < count - 1) {
					clone.style.visibility = 'visible';
					gsap.to(clone, {
						x: direction * (i + 1) * 60 * strength,
						opacity: 1,
						duration: 0.18,
						scaleX: 1,
						scaleY: 1,
						ease: 'power3.out',
					});
				} else {
					gsap.to(clone, {
						opacity: 0,
						duration: 0.18,
						onComplete: () => {
							clone.style.visibility = 'hidden';
						}
					});
				}
			});
			// Animate original image
			gsap.to(img, {
				x: direction * 1.2 * 60 * strength,
				scaleX: 1,
				scaleY: 1,
				opacity: 1,
				duration: 0.18,
				ease: 'power3.out',
			});
		});

		img.addEventListener('mouseleave', () => {
			isHovering = false;
			img.classList.remove('repeating');
			// Fade out all clones and reset transforms
			clones.forEach((clone, i) => {
				gsap.to(clone, {
					x: 0,
					opacity: 0,
					duration: 0.3,
					ease: 'power3.inOut',
					onComplete: () => {
						clone.style.visibility = 'hidden';
					}
				});
			});
			gsap.to(img, {
				x: 0,
				scaleX: 1,
				scaleY: 1,
				opacity: 1,
				duration: 0.3,
				ease: 'power3.inOut',
			});
		});
	});
}
