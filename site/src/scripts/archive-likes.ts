type LikeState = {
	count: number;
	liked: boolean;
};

type LikeButton = HTMLButtonElement & {
	dataset: DOMStringMap & { itemId?: string };
};

const buttons = [...document.querySelectorAll<LikeButton>('[data-archive-like]')];
const numberFormatter = new Intl.NumberFormat('zh-CN');
const maxItemsPerRequest = 20;
const states = new Map<string, LikeState>();
const loadingItems = new Set<string>();

function buttonsFor(itemId: string) {
	return buttons.filter((button) => button.dataset.itemId === itemId);
}

function renderButton(button: LikeButton, state: LikeState) {
	const label = button.querySelector<HTMLElement>('[data-like-label]');
	const count = button.querySelector<HTMLElement>('[data-like-count]');
	button.hidden = false;
	button.disabled = state.liked;
	button.setAttribute('aria-pressed', String(state.liked));
	button.title = state.liked ? '这个访问地址已经赞过这件档案' : '为这件档案点赞';
	if (label) label.textContent = state.liked ? '已赞' : '点赞';
	if (count) count.textContent = numberFormatter.format(state.count);
}

function setState(itemId: string, state: LikeState) {
	states.set(itemId, state);
	for (const button of buttonsFor(itemId)) renderButton(button, state);
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

async function loadItemStates(itemIds: string[]) {
	const pendingItemIds = [...new Set(itemIds)]
		.filter((itemId) => itemId && !states.has(itemId) && !loadingItems.has(itemId));
	if (pendingItemIds.length === 0) return;
	for (const itemId of pendingItemIds) loadingItems.add(itemId);
	try {
		for (let index = 0; index < pendingItemIds.length; index += maxItemsPerRequest) {
			const batch = pendingItemIds.slice(index, index + maxItemsPerRequest);
			const payload = await requestJson(`/api/likes?items=${encodeURIComponent(batch.join(','))}`) as {
				items?: Record<string, LikeState>;
			};
			for (const itemId of batch) {
				const state = payload.items?.[itemId];
				if (!state || !Number.isInteger(state.count) || state.count < 0 || typeof state.liked !== 'boolean') {
					throw new Error('点赞接口数据格式不正确');
				}
				setState(itemId, state);
			}
		}
	} catch {
		setUnavailable();
	} finally {
		for (const itemId of pendingItemIds) loadingItems.delete(itemId);
	}
}

function initializeLikes() {
	if (buttons.length === 0) return;

	for (const button of buttons) {
		button.addEventListener('archive-like-target-change', () => {
			const itemId = button.dataset.itemId;
			const state = itemId ? states.get(itemId) : undefined;
			if (state) {
				renderButton(button, state);
				return;
			}
			button.hidden = true;
			button.disabled = true;
			if (itemId) void loadItemStates([itemId]);
		});
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

	const initialItemIds = [...new Set(buttons.map((button) => button.dataset.itemId).filter(Boolean))] as string[];
	const loadInitialStates = () => { void loadItemStates(initialItemIds); };
	if (document.readyState === 'complete') window.setTimeout(loadInitialStates, 0);
	else window.addEventListener('load', loadInitialStates, { once: true });
}

initializeLikes();
