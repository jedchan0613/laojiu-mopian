// 我的收藏：读取自己的收藏编号，与公开档案摘要合并展示。
// 摘要来自公开数据；不在摘要里的编号（例如已经撤下）显示为「暂不可查看」，不展示任何缓存图片。

import { accountFetch, setStatus, toggle } from './account-client';

interface PublicRecord {
	id: string;
	title: string;
	type_label: string;
	date_display: string;
	cover: string | null;
	href: string;
}

const loading = document.querySelector('#favorites-loading');
const unauthenticated = document.querySelector('#favorites-unauth');
const content = document.querySelector('#favorites-content');
const list = document.querySelector('#favorites-list');
const empty = document.querySelector('#favorites-empty');
const counter = document.querySelector('#favorites-count');
const status = document.querySelector('#favorites-status');

const renderCard = (itemId: string, record: PublicRecord | undefined, createdAt: string) => {
	const card = document.createElement('li');
	card.className = 'account-card';
	card.dataset.itemId = itemId;

	if (record?.cover) {
		const image = document.createElement('img');
		image.className = 'account-card-image';
		image.src = record.cover;
		image.alt = record.title ? `${record.title} 的封面` : '档案封面';
		image.loading = 'lazy';
		image.decoding = 'async';
		card.append(image);
	} else {
		const placeholder = document.createElement('span');
		placeholder.className = 'account-card-placeholder';
		placeholder.textContent = record ? '暂无封面' : '暂不可查看';
		card.append(placeholder);
	}

	const title = document.createElement('h3');
	if (record) {
		const link = document.createElement('a');
		link.href = record.href;
		link.textContent = record.title;
		title.append(link);
	} else {
		title.textContent = '暂不可查看';
	}
	card.append(title);

	const meta = document.createElement('p');
	meta.textContent = record
		? [record.type_label, record.date_display].filter(Boolean).join(' · ')
		: '这份档案当前不在公开列表中';
	card.append(meta);

	const hint = document.createElement('p');
	hint.className = 'account-hint';
	hint.textContent = `收藏于 ${new Date(createdAt).toLocaleDateString('zh-CN')}`;
	card.append(hint);

	const actions = document.createElement('div');
	actions.className = 'account-card-actions';
	const remove = document.createElement('button');
	remove.type = 'button';
	remove.textContent = '取消收藏';
	remove.addEventListener('click', async () => {
		remove.disabled = true;
		try {
			await accountFetch('/api/account/favorites', { method: 'POST', body: { item_id: itemId, action: 'remove' } });
			card.remove();
			const remaining = list ? list.children.length : 0;
			if (counter) counter.textContent = String(remaining);
			toggle(empty, remaining === 0);
			setStatus(status, '已取消收藏。', 'ok');
		} catch (error) {
			remove.disabled = false;
			setStatus(status, error instanceof Error ? error.message : '暂时无法取消收藏。', 'error');
		}
	});
	actions.append(remove);
	card.append(actions);
	return card;
};

const load = async () => {
	try {
		const [favorites, summary] = await Promise.all([
			accountFetch('/api/account/favorites'),
			fetch('/records.json', { headers: { Accept: 'application/json' } })
				.then((response) => (response.ok ? response.json() : { records: [] }))
				.catch(() => ({ records: [] })),
		]);
		const index = new Map<string, PublicRecord>();
		for (const record of (summary?.records ?? []) as PublicRecord[]) index.set(record.id, record);
		const items = (favorites.items ?? []) as Array<{ item_id: string; created_at: string }>;
		toggle(loading, false);
		toggle(content, true);
		if (counter) counter.textContent = String(items.length);
		toggle(empty, items.length === 0);
		if (!items.length || !list) return;
		for (const item of items) list.append(renderCard(item.item_id, index.get(item.item_id), item.created_at));
	} catch (error) {
		toggle(loading, false);
		const errorStatus = (error as Error & { status?: number }).status;
		if (errorStatus === 401) {
			toggle(unauthenticated, true);
			return;
		}
		setStatus(status, error instanceof Error ? error.message : '暂时无法读取收藏。', 'error');
	}
};

void load();

export {};
