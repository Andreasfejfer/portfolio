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
		let lastCount = 0;
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
			const count = Math.floor(8 * percent) + 2; // 2-10 repetitions

			// Only update if count changes or clones are missing
			if (count !== lastCount || clones.length !== count - 1) {
				repeats.innerHTML = '';
				clones = [];
				for (let i = 1; i < count; i++) {
					const clone = img.cloneNode();
					clone.classList.add('rep_repeat');
					clone.style.opacity = '0';
					repeats.appendChild(clone);
					clones.push(clone);
				}
				lastCount = count;
			}

			// Animate each clone with GSAP
			clones.forEach((clone, i) => {
				const offset = (i + 1) * 10 * percent;
				const skew = 10 * percent * (i + 1);
				const scale = 1 - (i + 1) * 0.04;
				gsap.to(clone, {
					x: offset,
					skewX: skew,
					scale: scale,
					opacity: 0.7 - (i + 1) * 0.06,
					duration: 0.35,
					ease: 'power2.out',
				});
			});
		});

		img.addEventListener('mouseleave', () => {
			isHovering = false;
			img.classList.remove('repeating');
			// Animate out and remove
			clones.forEach((clone, i) => {
				gsap.to(clone, {
					opacity: 0,
					duration: 0.3,
					onComplete: () => {
						if (clone.parentElement) clone.parentElement.removeChild(clone);
					}
				});
			});
			clones = [];
			lastCount = 0;
		});
	});
}
