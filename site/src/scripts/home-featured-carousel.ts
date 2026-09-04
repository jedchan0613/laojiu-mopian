interface FeaturedCarouselItem {
	src: string;
	srcset: string;
	width: number;
	height: number;
	description: string;
}

const AUTOPLAY_DELAY = 6500;

document.querySelectorAll<HTMLElement>('[data-home-featured-carousel]').forEach((carousel) => {
	const image = carousel.querySelector<HTMLImageElement>('[data-home-carousel-image]');
	const previousButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-previous]');
	const nextButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-next]');
	const toggleButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-toggle]');
	const toggleIcon = carousel.querySelector<HTMLElement>('[data-home-carousel-toggle-icon]');
	const toggleLabel = carousel.querySelector<HTMLElement>('[data-home-carousel-toggle-label]');
	const status = carousel.querySelector<HTMLElement>('[data-home-carousel-status]');
	const announcement = carousel.querySelector<HTMLElement>('[data-home-carousel-announcement]');
	const dots = Array.from(carousel.querySelectorAll<HTMLButtonElement>('[data-home-carousel-dot]'));

	let items: FeaturedCarouselItem[] = [];
	try {
		items = JSON.parse(carousel.dataset.carouselItems ?? '[]') as FeaturedCarouselItem[];
	} catch {
		return;
	}
	if (!image || !previousButton || !nextButton || !toggleButton || items.length < 2) return;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let activeIndex = 0;
	let autoplayTimer: number | undefined;
	let userPaused = prefersReducedMotion.matches;
	let pointerInside = false;
	let focusInside = false;

	const stopAutoplay = () => {
		if (autoplayTimer === undefined) return;
		window.clearInterval(autoplayTimer);
		autoplayTimer = undefined;
	};

	const canAutoplay = () =>
		!userPaused && !pointerInside && !focusInside && !document.hidden;

	const startAutoplay = () => {
		stopAutoplay();
		if (!canAutoplay()) return;
		autoplayTimer = window.setInterval(() => selectImage(activeIndex + 1), AUTOPLAY_DELAY);
	};

	const updateToggle = () => {
		toggleButton.setAttribute('aria-pressed', String(userPaused));
		toggleButton.setAttribute('aria-label', userPaused ? '播放自动轮播' : '暂停自动轮播');
		if (toggleIcon) toggleIcon.textContent = userPaused ? '▶' : 'Ⅱ';
		if (toggleLabel) toggleLabel.textContent = userPaused ? '播放' : '暂停';
	};

	const selectImage = (index: number, announce = false) => {
		activeIndex = (index + items.length) % items.length;
		const item = items[activeIndex];
		if (item.srcset) image.srcset = item.srcset;
		else image.removeAttribute('srcset');
		image.src = item.src;
		image.alt = item.description;
		image.width = item.width;
		image.height = item.height;
		status && (status.textContent = `第 ${activeIndex + 1} 张，共 ${items.length} 张`);
		dots.forEach((dot, dotIndex) =>
			dot.setAttribute('aria-current', String(dotIndex === activeIndex)));
		if (announce && announcement) {
			announcement.textContent = `已显示第 ${activeIndex + 1} 张精选图片：${item.description}`;
		}
		if (!prefersReducedMotion.matches) {
			image.animate(
				[{ opacity: 0.58 }, { opacity: 1 }],
				{ duration: 260, easing: 'ease-out' },
			);
		}
	};

	const selectManually = (index: number) => {
		selectImage(index, true);
		startAutoplay();
	};

	previousButton.addEventListener('click', () => selectManually(activeIndex - 1));
	nextButton.addEventListener('click', () => selectManually(activeIndex + 1));
	dots.forEach((dot, index) => dot.addEventListener('click', () => selectManually(index)));

	toggleButton.addEventListener('click', () => {
		userPaused = !userPaused;
		updateToggle();
		startAutoplay();
		if (announcement) announcement.textContent = userPaused ? '自动轮播已暂停' : '自动轮播已播放';
	});

	carousel.addEventListener('mouseenter', () => {
		pointerInside = true;
		stopAutoplay();
	});
	carousel.addEventListener('mouseleave', () => {
		pointerInside = false;
		startAutoplay();
	});
	carousel.addEventListener('focusin', () => {
		focusInside = true;
		stopAutoplay();
	});
	carousel.addEventListener('focusout', (event) => {
		focusInside = event.relatedTarget instanceof Node && carousel.contains(event.relatedTarget);
		if (!focusInside) startAutoplay();
	});
	document.addEventListener('visibilitychange', startAutoplay);
	prefersReducedMotion.addEventListener('change', (event) => {
		if (event.matches) userPaused = true;
		updateToggle();
		startAutoplay();
	});

	carousel.dataset.carouselReady = '';
	updateToggle();
	selectImage(0);
	startAutoplay();
});
