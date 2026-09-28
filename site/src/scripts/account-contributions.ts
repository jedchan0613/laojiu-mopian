// 我的投稿：列出本人投稿、显示用户可见状态与当前最需要完成的一项操作，并支持关联旧投稿。
// 「已公开」不自行维护，而是用公开档案数据里的编号集合判断。

import { accountFetch, setStatus, toggle } from './account-client';

interface SubmissionSummary {
	id: string;
	revision: number;
	title: string;
	category: string;
	status: string;
	status_label: string;
	created_at: string;
	updated_at: string;
	image_count: number;
	linked_item_id: string | null;
	withdrawal_requested: boolean;
	change_request: { kind: string; status: string } | null;
	public_message: string;
}

const loading = document.querySelector('#contributions-loading');
const unauthenticated = document.querySelector('#contributions-unauth');
const content = document.querySelector('#contributions-content');
const list = document.querySelector('#contributions-list');
const empty = document.querySelector('#contributions-empty');
const summary = document.querySelector('#contributions-summary');
const status = document.querySelector('#contributions-status');

// 需要投稿人动手的状态：这些数量会显示在标题位置。
const actionable = new Set(['draft', 'needs_info', 'declined']);

const visibleState = (item: SubmissionSummary, publishedIds: Set<string>) => {
	if (item.linked_item_id && publishedIds.has(item.linked_item_id)) return { label: '已公开', alert: false };
	if (item.withdrawal_requested) return { label: '撤下处理中', alert: true };
	if (item.change_request?.status === 'received') return { label: '修改审核中', alert: true };
	return { label: item.status_label, alert: actionable.has(item.status) };
};

// 每张卡片只给一个当前最需要的操作，避免堆满按钮。
const primaryAction = (item: SubmissionSummary) => {
	if (item.status === 'draft') return { label: '继续编辑', href: `/me/contribution/?id=${item.id}` };
	if (item.status === 'needs_info') return { label: '补充材料', href: `/me/contribution/?id=${item.id}` };
	if (item.change_request?.status === 'received' || item.withdrawal_requested) return { label: '查看处理情况', href: `/me/contribution/?id=${item.id}` };
	return { label: '查看详情', href: `/me/contribution/?id=${item.id}` };
};

const card = (item: SubmissionSummary, publishedIds: Set<string>) => {
	const state = visibleState(item, publishedIds);
	const node = document.createElement('li');
	node.className = 'account-card';

	const placeholder = document.createElement('span');
	placeholder.className = 'account-card-placeholder';
	placeholder.textContent = `${item.image_count} 张图片`;
	node.append(placeholder);

	const pill = document.createElement('span');
	pill.className = 'account-card-state';
	if (state.alert) pill.dataset.alert = '1';
	pill.textContent = state.label;
	node.append(pill);

	const title = document.createElement('h3');
	title.textContent = item.title || '（未命名草稿）';
	node.append(title);

	const meta = document.createElement('p');
	meta.textContent = [item.category || '未选分类', `最近更新 ${new Date(item.updated_at).toLocaleDateString('zh-CN')}`].join(' · ');
	node.append(meta);

	if (item.public_message) {
		const message = document.createElement('p');
		message.className = 'account-hint';
		message.textContent = `站主说明：${item.public_message}`;
		node.append(message);
	}

	const actions = document.createElement('div');
	actions.className = 'account-card-actions';
	const action = primaryAction(item);
	const link = document.createElement('a');
	link.className = 'ui-text-link';
	link.href = action.href;
	link.textContent = action.label;
	actions.append(link);
	if (item.linked_item_id && publishedIds.has(item.linked_item_id)) {
		const publicLink = document.createElement('a');
		publicLink.className = 'ui-text-link';
		publicLink.href = `/archive/${item.linked_item_id}/`;
		publicLink.textContent = '打开公开页面';
		actions.append(publicLink);
	}
	node.append(actions);
	return node;
};

const load = async () => {
	try {
		const [result, publicRecords] = await Promise.all([
			accountFetch('/api/account/submissions'),
			fetch('/records.json', { headers: { Accept: 'application/json' } })
				.then((response) => (response.ok ? response.json() : { records: [] }))
				.catch(() => ({ records: [] })),
		]);
		const publishedIds = new Set<string>((publicRecords?.records ?? []).map((record: { id: string }) => record.id));
		const items = (result.items ?? []) as SubmissionSummary[];
		toggle(loading, false);
		toggle(content, true);
		const pending = items.filter((item) => actionable.has(item.status) || item.withdrawal_requested).length;
		if (summary) summary.textContent = pending ? `有 ${pending} 件需要你处理` : '目前没有待你处理的事项。';
		toggle(empty, items.length === 0);
		if (list) for (const item of items) list.append(card(item, publishedIds));
	} catch (error) {
		toggle(loading, false);
		if ((error as Error & { status?: number }).status === 401) {
			toggle(unauthenticated, true);
			return;
		}
		setStatus(status, error instanceof Error ? error.message : '暂时无法读取投稿。', 'error');
	}
};

const claimStatus = document.querySelector('#claim-status');
document.querySelector('#claim-submit')?.addEventListener('click', async () => {
	const button = document.querySelector<HTMLButtonElement>('#claim-submit');
	if (!document.querySelector<HTMLInputElement>('#claim-confirm')?.checked) {
		setStatus(claimStatus, '请先勾选确认，再提交关联。', 'error');
		return;
	}
	const id = document.querySelector<HTMLInputElement>('#claim-id')?.value.trim().toUpperCase() ?? '';
	const key = document.querySelector<HTMLInputElement>('#claim-key')?.value.trim() ?? '';
	if (!/^TG-[A-F0-9]{24}$/.test(id) || !/^[a-f0-9]{64}$/.test(key)) {
		setStatus(claimStatus, '请填写正确的投稿编号与查询密钥。', 'error');
		return;
	}
	if (button) button.disabled = true;
	setStatus(claimStatus, '正在核对…');
	try {
		const result = await accountFetch('/api/account/submissions/claim', { method: 'POST', body: { id, key } });
		setStatus(claimStatus, result.repeated ? '这份投稿已经关联到当前账号。' : '关联成功。以后可以在上方列表里查看它的处理进度。', 'ok');
		if (list) list.replaceChildren();
		await load();
	} catch (error) {
		setStatus(claimStatus, error instanceof Error ? error.message : '关联没有完成。', 'error');
	} finally {
		if (button) button.disabled = false;
	}
});

void load();

export {};
