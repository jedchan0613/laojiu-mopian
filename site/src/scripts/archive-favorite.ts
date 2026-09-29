// 档案详情页的收藏按钮。
// 已登录：进入页面时读取自己的收藏列表，显示当前状态，点击即收藏或取消收藏（接口幂等）。
// 未登录：按钮仍显示，点击后引导到登录页，登录成功返回当前档案。
// 账户服务不可用（例如公开线上尚未开放账户能力）：按钮保持隐藏，不影响页面其他功能。

import { accountFetch } from './account-client';

type FavoriteItem = { item_id: string; created_at: string };

const button = document.querySelector<HTMLButtonElement>('[data-archive-favorite]');

const label = () => button?.querySelector<HTMLElement>('[data-favorite-label]') ?? null;

const render = (favorited: boolean) => {
	if (!button) return;
	button.hidden = false;
	button.disabled = false;
	button.setAttribute('aria-pressed', String(favorited));
	button.title = favorited ? '已收藏，点击取消收藏' : '收藏这件档案，便于以后在“我的收藏”中查看';
	const text = label();
	if (text) text.textContent = favorited ? '已收藏' : '收藏';
};

const renderGuest = () => {
	if (!button) return;
	button.hidden = false;
	button.disabled = false;
	button.setAttribute('aria-pressed', 'false');
	button.title = '登录后可以收藏这件档案';
	const text = label();
	if (text) text.textContent = '收藏';
};

const goLogin = () => {
	const next = `${window.location.pathname}${window.location.search}`;
	window.location.assign(`/login/?next=${encodeURIComponent(next)}`);
};

const initialize = () => {
	if (!button) return;
	const itemId = button.dataset.itemId ?? '';
	if (!itemId) return;

	let state: 'guest' | 'member' = 'guest';
	let favorited = false;

	button.addEventListener('click', async () => {
		if (state === 'guest') {
			goLogin();
			return;
		}
		button.disabled = true;
		try {
			await accountFetch('/api/account/favorites', {
				method: 'POST',
				body: { item_id: itemId, action: favorited ? 'remove' : 'add' },
			});
			favorited = !favorited;
			render(favorited);
		} catch (error) {
			const status = (error as Error & { status?: number }).status;
			if (status === 401) {
				// 登录已过期：按未登录处理，引导重新登录后返回本页。
				state = 'guest';
				goLogin();
				return;
			}
			button.disabled = false;
			button.title = error instanceof Error ? error.message : '收藏操作没有成功，请稍后再试';
			const text = label();
			if (text) text.textContent = '重试';
		}
	});

	void accountFetch('/api/account/favorites')
		.then((payload) => {
			const items = (payload.items ?? []) as FavoriteItem[];
			state = 'member';
			favorited = items.some((item) => item.item_id === itemId);
			render(favorited);
		})
		.catch((error: Error & { status?: number }) => {
			if (error.status === 401) {
				state = 'guest';
				renderGuest();
				return;
			}
			// 账户服务不可用：保持隐藏，不打扰正常浏览。
		});
};

initialize();

export {};
