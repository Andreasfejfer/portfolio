// GSAP-based repetition effect for .rep_img
// Requires GSAP to be loaded in the page (via CDN or local file)
export function initRepetitionEffectGSAP() {
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

			repeats.innerHTML = '';
			clones = [];
			for (let i = 1; i < count; i++) {
				const clone = img.cloneNode();
				clone.classList.add('rep_repeat');
				clone.style.opacity = '0';
				repeats.appendChild(clone);
				clones.push(clone);
			}

			clones.forEach((clone, i) => {
				const offset = direction * (i + 1) * 12 * strength;
				gsap.to(clone, {
					x: offset,
					scale: 1 - (i + 1) * 0.04,
					opacity: 0.5 - (i * 0.06),
					duration: 0.3,
					ease: 'power2.out',
				});
			});
		});

		img.addEventListener('mouseleave', () => {
			isHovering = false;
			img.classList.remove('repeating');
			clones.forEach(clone => {
				gsap.to(clone, {
					opacity: 0,
					duration: 0.2,
					onComplete: () => {
						if (clone.parentElement) clone.parentElement.removeChild(clone);
					}
				});
			});
			clones = [];
		});
	});
}
