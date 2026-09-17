interface FeaturedCarouselItem {
	src: string;
	srcset: string;
	width: number;
	height: number;
	description: string;
	itemId: string;
	title: string;
	dateDisplay: string;
	href: string;
}

const AUTOPLAY_DELAY = 6000;

document.querySelectorAll<HTMLElement>('[data-home-featured-carousel]').forEach((carousel) => {
	const image = carousel.querySelector<HTMLImageElement>('[data-home-carousel-image]');
	const recordLink = carousel.querySelector<HTMLAnchorElement>('[data-home-carousel-link]');
	const recordIndex = carousel.querySelector<HTMLElement>('[data-home-carousel-index]');
	const recordDate = carousel.querySelector<HTMLElement>('[data-home-carousel-date]');
	const recordTitle = carousel.querySelector<HTMLElement>('[data-home-carousel-title]');
	const likeButton = carousel.querySelector<HTMLButtonElement>('[data-archive-like]');
	const previousButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-previous]');
	const nextButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-next]');
	const toggleButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-toggle]');
	const toggleIcon = carousel.querySelector<HTMLElement>('[data-home-carousel-toggle-icon]');
	const toggleLabel = carousel.querySelector<HTMLElement>('[data-home-carousel-toggle-label]');
	const status = carousel.querySelector<HTMLElement>('[data-home-carousel-status]');
	const announcement = carousel.querySelector<HTMLElement>('[data-home-carousel-announcement]');
	const controls = carousel.querySelector<HTMLElement>('.hero-carousel-controls');

	let items: FeaturedCarouselItem[] = [];
	try {
		items = JSON.parse(carousel.dataset.carouselItems ?? '[]') as FeaturedCarouselItem[];
	} catch {
		controls?.remove();
		return;
	}
	if (!image || !recordLink || !previousButton || !nextButton || !toggleButton || items.length < 2) {
		// 初始化失败属于异常路径：直接移除控制栏，避免留下只占位不可见的空白。
		controls?.remove();
		return;
	}

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let activeIndex = 0;
	let autoplayTimer: number | undefined;
	let preloadedImage: HTMLImageElement | undefined;
	// 自动轮播意愿分三档：auto 跟随系统“减少动画”偏好，on/off 是访客手动指定。
	// 手动指定优先于系统偏好；auto 档在偏好从“减少动画”恢复默认时会自动恢复播放。
	let autoplayIntent: 'auto' | 'on' | 'off' = 'auto';
	let pointerInside = false;
	let focusInside = false;

	const stopAutoplay = () => {
		if (autoplayTimer === undefined) return;
		window.clearInterval(autoplayTimer);
		autoplayTimer = undefined;
	};

	const isAutoplayPaused = () =>
		autoplayIntent === 'off' || (autoplayIntent === 'auto' && prefersReducedMotion.matches);

	const canAutoplay = () =>
		!isAutoplayPaused() && !pointerInside && !focusInside && !document.hidden;

	const startAutoplay = () => {
		stopAutoplay();
		if (!canAutoplay()) return;
		autoplayTimer = window.setInterval(() => selectImage(activeIndex + 1), AUTOPLAY_DELAY);
	};

	const updateToggle = () => {
		const paused = isAutoplayPaused();
		toggleButton.setAttribute('aria-pressed', String(paused));
		toggleButton.setAttribute('aria-label', paused ? '播放自动轮播' : '暂停自动轮播');
		if (toggleIcon) toggleIcon.textContent = paused ? '▶' : 'Ⅱ';
		if (toggleLabel) toggleLabel.textContent = paused ? '播放' : '暂停';
	};

	const preloadNextImage = () => {
		const nextItem = items[(activeIndex + 1) % items.length];
		const candidate = new Image();
		candidate.sizes = image.sizes;
		if (nextItem.srcset) candidate.srcset = nextItem.srcset;
		const releaseCandidate = () => {
			if (preloadedImage === candidate) preloadedImage = undefined;
		};
		candidate.addEventListener('load', releaseCandidate, { once: true });
		candidate.addEventListener('error', releaseCandidate, { once: true });
		candidate.src = nextItem.src;
		preloadedImage = candidate;
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
		recordLink.href = item.href;
		recordLink.setAttribute('aria-label', `查看精选档案：${item.title}`);
		if (recordIndex) recordIndex.textContent = String(activeIndex + 1).padStart(2, '0');
		if (recordDate) recordDate.textContent = item.dateDisplay;
		if (recordTitle) recordTitle.textContent = item.title;
		if (likeButton) {
			likeButton.dataset.itemId = item.itemId;
			likeButton.setAttribute('aria-label', `为“${item.title}”点赞`);
			likeButton.dispatchEvent(new CustomEvent('archive-like-target-change'));
		}
		if (status) status.textContent = `第 ${activeIndex + 1} 张，共 ${items.length} 张`;
		if (announce && announcement) {
			announcement.textContent = `已显示第 ${activeIndex + 1} 张精选图片：${item.description}`;
		}
		if (!prefersReducedMotion.matches) {
			image.animate(
				[{ opacity: 0.58 }, { opacity: 1 }],
				{ duration: 260, easing: 'ease-out' },
			);
		}
		preloadNextImage();
	};

	const selectManually = (index: number) => {
		selectImage(index, true);
		startAutoplay();
	};

	previousButton.addEventListener('click', () => selectManually(activeIndex - 1));
	nextButton.addEventListener('click', () => selectManually(activeIndex + 1));

	toggleButton.addEventListener('click', () => {
		autoplayIntent = isAutoplayPaused() ? 'on' : 'off';
		updateToggle();
		startAutoplay();
		if (announcement) announcement.textContent = isAutoplayPaused() ? '自动轮播已暂停' : '自动轮播已播放';
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
	prefersReducedMotion.addEventListener('change', () => {
		updateToggle();
		startAutoplay();
	});

	carousel.dataset.carouselReady = '';
	updateToggle();
	selectImage(0);
	startAutoplay();
});
