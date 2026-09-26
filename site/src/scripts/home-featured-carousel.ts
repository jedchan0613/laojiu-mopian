interface FeaturedCarouselItem {
	src: string;
	srcset: string;
	width: number;
	height: number;
	description: string;
	itemId: string;
	title: string;
	dateDisplay: string;
	recordInfo: string;
	href: string;
}

document.querySelectorAll<HTMLElement>('[data-home-featured-carousel]').forEach((carousel) => {
	const image = carousel.querySelector<HTMLImageElement>('[data-home-carousel-image]');
	const recordLink = carousel.querySelector<HTMLAnchorElement>('[data-home-carousel-link]');
	const recordDate = carousel.querySelector<HTMLElement>('[data-home-carousel-date]');
	const recordTitle = carousel.querySelector<HTMLElement>('[data-home-carousel-title]');
	const recordInfo = carousel.querySelector<HTMLElement>('[data-home-carousel-info]');
	const likeButton = carousel.querySelector<HTMLButtonElement>('[data-archive-like]');
	const previousButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-previous]');
	const nextButton = carousel.querySelector<HTMLButtonElement>('[data-home-carousel-next]');
	const dotsContainer = carousel.querySelector<HTMLElement>('[data-home-carousel-dots]');
	const dots = dotsContainer
		? Array.from(dotsContainer.querySelectorAll<HTMLButtonElement>('[data-home-carousel-dot]'))
		: [];
	const announcement = carousel.querySelector<HTMLElement>('[data-home-carousel-announcement]');
	const controls = carousel.querySelector<HTMLElement>('.hero-carousel-controls');

	let items: FeaturedCarouselItem[] = [];
	try {
		items = JSON.parse(carousel.dataset.carouselItems ?? '[]') as FeaturedCarouselItem[];
	} catch {
		controls?.remove();
		return;
	}
	if (!image || !recordLink || !previousButton || !nextButton || items.length < 2) {
		// 初始化失败属于异常路径：直接移除控制栏，避免留下只占位不可见的空白。
		controls?.remove();
		return;
	}

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let activeIndex = 0;
	let preloadedImage: HTMLImageElement | undefined;

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

	const syncDots = () => {
		dots.forEach((dot, index) => {
			dot.setAttribute('aria-current', String(index === activeIndex));
		});
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
		if (recordDate) recordDate.textContent = item.dateDisplay;
		if (recordTitle) recordTitle.textContent = item.title;
		if (recordInfo) recordInfo.textContent = item.recordInfo;
		if (likeButton) {
			likeButton.dataset.itemId = item.itemId;
			likeButton.setAttribute('aria-label', `为"${item.title}"点赞`);
			likeButton.dispatchEvent(new CustomEvent('archive-like-target-change'));
		}
		syncDots();
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

	previousButton.addEventListener('click', () => selectImage(activeIndex - 1, true));
	nextButton.addEventListener('click', () => selectImage(activeIndex + 1, true));

	dots.forEach((dot, index) => {
		dot.addEventListener('click', () => selectImage(index, true));
	});
	dotsContainer?.addEventListener('keydown', (event) => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		const index = dots.indexOf(document.activeElement as HTMLButtonElement);
		if (index < 0) return;
		event.preventDefault();
		const target = event.key === 'Home' ? 0 : event.key === 'End' ? dots.length - 1
			: (index + (event.key === 'ArrowRight' ? 1 : -1) + dots.length) % dots.length;
		selectImage(target, true);
		dots[target].focus();
	});

	carousel.dataset.carouselReady = '';
	selectImage(0);
});
