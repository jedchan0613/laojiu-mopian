type LikeState = {
	count: number;
	liked: boolean;
};

type LikeButton = HTMLButtonElement & {
	dataset: DOMStringMap & { itemId?: string };
};

const buttons = [...document.querySelectorAll<LikeButton>('[data-archive-like]')];
const numberFormatter = new Intl.NumberFormat('zh-CN');

function buttonsFor(itemId: string) {
	return buttons.filter((button) => button.dataset.itemId === itemId);
}

function setState(itemId: string, state: LikeState) {
	for (const button of buttonsFor(itemId)) {
		const label = button.querySelector<HTMLElement>('[data-like-label]');
		const count = button.querySelector<HTMLElement>('[data-like-count]');
		button.hidden = false;
		button.disabled = state.liked;
		button.setAttribute('aria-pressed', String(state.liked));
		button.title = state.liked ? '这个访问地址已经赞过这件档案' : '为这件档案点赞';
		if (label) label.textContent = state.liked ? '已赞' : '点赞';
		if (count) count.textContent = numberFormatter.format(state.count);
	}
}

function setUnavailable(message = '点赞服务暂时不可用') {
	for (const button of buttons) {
		const label = button.querySelector<HTMLElement>('[data-like-label]');
		const count = button.querySelector<HTMLElement>('[data-like-count]');
		button.disabled = true;
		button.hidden = true;
		button.title = message;
		if (label) label.textContent = '暂不可用';
		if (count) count.textContent = '';
	}
}

async function requestJson(url: string, init?: RequestInit) {
	const response = await fetch(url, {
		...init,
		headers: { Accept: 'application/json', ...init?.headers },
	});
	if (!response.ok) throw new Error(`点赞接口返回 ${response.status}`);
	return response.json();
}

async function initializeLikes() {
	if (buttons.length === 0) return;
	const itemIds = [...new Set(buttons.map((button) => button.dataset.itemId).filter(Boolean))] as string[];
	try {
		const payload = await requestJson(`/api/likes?items=${encodeURIComponent(itemIds.join(','))}`) as {
			items?: Record<string, LikeState>;
		};
		for (const itemId of itemIds) {
			const state = payload.items?.[itemId];
			if (!state || !Number.isInteger(state.count) || state.count < 0 || typeof state.liked !== 'boolean') {
				throw new Error('点赞接口数据格式不正确');
			}
			setState(itemId, state);
		}
	} catch {
		setUnavailable();
		return;
	}

	for (const button of buttons) {
		button.addEventListener('click', async () => {
			const itemId = button.dataset.itemId;
			if (!itemId || button.getAttribute('aria-pressed') === 'true') return;
			for (const matchingButton of buttonsFor(itemId)) matchingButton.disabled = true;
			try {
				const result = await requestJson(`/api/likes/${encodeURIComponent(itemId)}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: '{}',
				}) as LikeState;
				if (!Number.isInteger(result.count) || result.count < 0 || result.liked !== true) {
					throw new Error('点赞接口数据格式不正确');
				}
				setState(itemId, result);
			} catch {
				for (const matchingButton of buttonsFor(itemId)) {
					const label = matchingButton.querySelector<HTMLElement>('[data-like-label]');
					matchingButton.disabled = false;
					matchingButton.title = '点赞没有成功，请稍后再试';
					if (label) label.textContent = '重试';
				}
			}
		});
	}
}

void initializeLikes();
