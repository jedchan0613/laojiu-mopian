// 投稿工作台：新建、保存草稿、提交审核、查看进度、补充、撤回与申请修改或撤下。
// 图片只在点击「保存草稿」或「提交审核」时才上传；服务端以真实解码结果为准。

import { accountFetch, setStatus, toggle } from './account-client';

type KeptItem = { kind: 'kept'; filename: string; note: string; originalName: string };
type NewItem = { kind: 'new'; file: File; url: string; hash: string; note: string };
type Item = KeptItem | NewItem;

const byId = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`);
const loading = byId('workbench-loading');
const unauthenticated = byId('workbench-unauth');
const missing = byId('workbench-missing');
const content = byId('workbench-content');
const form = byId<HTMLFormElement>('workbench-form');
const statePanel = byId('workbench-state');
const statusEl = byId('wb-status');
const imageFeedback = byId('wb-image-feedback');
const previews = byId<HTMLUListElement>('wb-previews');
const countEl = byId('wb-count');
const previewList = byId('wb-preview');

const params = new URLSearchParams(window.location.search);
const submissionId = (params.get('id') ?? '').trim().toUpperCase();
const editing = /^TG-[A-F0-9]{24}$/.test(submissionId);

let consentVersion = '';
let detail: any = null;
let items: Item[] = [];
let dirty = false;
let busy = false;
// 网络超时后重试同一份新投稿，服务端会返回第一次保存的编号。
const requestKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');

const setFeedback = (message: string) => {
	if (statusEl) {
		statusEl.textContent = message;
		statusEl.removeAttribute('data-tone');
	}
};

// multipart 直传：与免注册投稿一致，保留上传进度与超时提示。
const upload = (url: string, data: FormData): Promise<any> => new Promise((resolve, reject) => {
	const request = new XMLHttpRequest();
	request.open('POST', url);
	request.timeout = 120_000;
	request.setRequestHeader('X-LJM-Account-Request', '1');
	request.upload.onprogress = (event) => {
		if (event.lengthComputable) setFeedback(`正在上传 ${Math.round((event.loaded / event.total) * 100)}%…`);
	};
	request.onload = () => {
		let payload: any = {};
		try { payload = JSON.parse(request.responseText); } catch { payload = {}; }
		if (request.status >= 200 && request.status < 300) resolve(payload);
		else reject(Object.assign(new Error(payload.error || '提交没有完成。'), { status: request.status }));
	};
	request.onerror = request.ontimeout = () => reject(new Error('连接中断或等待超时，请稍后重试；已经保存的内容不会丢失。'));
	request.send(data);
});

const field = <T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(name: string) =>
	form?.querySelector<T>(`[name="${name}"]`);

const readFields = () => ({
	title: field<HTMLInputElement>('title')?.value.trim() ?? '',
	category: field<HTMLSelectElement>('category')?.value ?? '',
	description: field<HTMLTextAreaElement>('description')?.value.trim() ?? '',
	era: field<HTMLInputElement>('era')?.value.trim() ?? '',
	place: field<HTMLInputElement>('place')?.value.trim() ?? '',
	source_note: field<HTMLTextAreaElement>('source_note')?.value.trim() ?? '',
	people: field<HTMLSelectElement>('people')?.value ?? '',
	attribution: form?.querySelector<HTMLInputElement>('input[name="attribution"]:checked')?.value ?? 'anonymous',
	credit: field<HTMLInputElement>('credit')?.value.trim() ?? '',
});

const buildFormData = () => {
	const kept = items.filter((item): item is KeptItem => item.kind === 'kept');
	const fresh = items.filter((item): item is NewItem => item.kind === 'new');
	const fields = readFields();
	const data = new FormData();
	data.append('request_key', requestKey);
	for (const [key, value] of Object.entries(fields)) if (key !== 'attribution') data.append(key, value);
	data.append('attribution', fields.attribution);
	data.append('keep', JSON.stringify(kept.map((item) => item.filename)));
	data.append('notes', JSON.stringify(Object.fromEntries(kept.map((item) => [item.filename, item.note]))));
	data.append('pending_notes', JSON.stringify(fresh.map((item) => item.note)));
	for (const item of fresh) data.append('images', item.file, item.file.name);
	return data;
};

const validConsents = () => ['copies', 'rights', 'privacy', 'processing']
	.every((key) => form?.querySelector<HTMLInputElement>(`[data-consent="${key}"]`)?.checked === true);

const applyConsents = (data: FormData) => {
	for (const key of ['copies', 'rights', 'privacy', 'processing']) {
		data.append(`consents_${key}`, 'true');
	}
	data.append('consent_version', consentVersion);
};

const describeItems = (item: Item) => (item.kind === 'kept' ? item.filename : '新图片');

const renderItems = () => {
	if (!previews) return;
	previews.replaceChildren();
	for (const [index, item] of items.entries()) {
		const node = document.createElement('li');
		const image = document.createElement('img');
		image.src = item.kind === 'kept' && detail ? `/api/account/submissions/${detail.id}/images/${item.filename}` : (item as NewItem).url;
		image.alt = `第 ${index + 1} 张图片副本`;
		image.loading = 'lazy';
		node.append(image);

		const note = document.createElement('input');
		note.type = 'text';
		note.maxLength = 300;
		note.placeholder = '这张图的说明（选填）';
		note.value = item.note;
		note.setAttribute('aria-label', `第 ${index + 1} 张图片的说明`);
		note.addEventListener('input', () => { item.note = note.value; dirty = true; });
		node.append(note);

		const caption = document.createElement('p');
		caption.textContent = item.kind === 'kept' ? `第 ${index + 1} 张 · 已保存` : `第 ${index + 1} 张 · 待上传`;
		node.append(caption);

		const actions = document.createElement('div');
		actions.className = 'workbench-preview-actions';
		const move = (label: string, delta: number) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = label;
			button.disabled = delta < 0 ? index === 0 : index === items.length - 1;
			button.addEventListener('click', () => {
				const target = index + delta;
				[items[index], items[target]] = [items[target], items[index]];
				dirty = true;
				renderItems();
			});
			return button;
		};
		const remove = document.createElement('button');
		remove.type = 'button';
		remove.textContent = '移除这张';
		remove.addEventListener('click', () => {
			const [removed] = items.splice(index, 1);
			if (removed.kind === 'new') URL.revokeObjectURL(removed.url);
			dirty = true;
			renderItems();
		});
		actions.append(move('上移', -1), move('下移', 1), remove);
		node.append(actions);
		previews.append(node);
	}
	const kept = items.filter((item) => item.kind === 'kept').length;
	const fresh = items.length - kept;
	if (imageFeedback) {
		imageFeedback.textContent = items.length
			? `共 ${items.length} / 8 张（已保存 ${kept} 张，待上传 ${fresh} 张）。第一张会作为封面。`
			: '尚未选择图片。';
	}
	renderPreview();
};

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (value) => value.toString(16).padStart(2, '0')).join('');

const addFiles = async (files: File[]) => {
	const errors: string[] = [];
	for (const file of files) {
		if (busy) return;
		if (items.length >= 8) { errors.push('最多选择 8 张图片。'); break; }
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name) || /(master|original|raw|主档|原始)/i.test(file.name)) {
			errors.push(`${file.name}：只接收 JPG、PNG、WebP 筛选副本。`);
			continue;
		}
		const freshSize = items.filter((item) => item.kind === 'new').reduce((sum, item) => sum + (item as NewItem).file.size, 0);
		if (!file.size || file.size > 5 * 1024 ** 2 || freshSize + file.size > 20 * 1024 ** 2) {
			errors.push(`${file.name}：每张最多 5 MB，每次合计最多 20 MB。`);
			continue;
		}
		const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()).then(hex);
		if (items.some((item) => item.kind === 'new' && item.hash === hash)) { errors.push(`${file.name}：已经选过相同图片。`); continue; }
		const url = URL.createObjectURL(file);
		try {
			await new Promise<void>((resolve, reject) => {
				const probe = new Image();
				probe.onload = () => (probe.naturalWidth * probe.naturalHeight <= 40_000_000 ? resolve() : reject());
				probe.onerror = reject;
				probe.src = url;
			});
			items.push({ kind: 'new', file, url, hash, note: '' });
			dirty = true;
		} catch {
			URL.revokeObjectURL(url);
			errors.push(`${file.name}：无法预览或像素过大，请重新导出副本。`);
		}
	}
	renderItems();
	if (errors.length && imageFeedback) imageFeedback.textContent += ` ${errors.join(' ')}`;
};

const renderPreview = () => {
	if (!previewList) return;
	const fields = readFields();
	const rows: Array<[string, string]> = [
		['题名', fields.title || '未填写'],
		['藏品分类', fields.category || '未选择'],
		['大致年代', fields.era || '未填写'],
		['大致地点', fields.place || '未填写'],
		['公开署名', fields.attribution === 'named' ? (fields.credit || '未填写署名') : '匿名'],
		['图片', items.length ? `${items.length} 张，第一张作为封面` : '尚未选择'],
	];
	previewList.replaceChildren();
	for (const [label, value] of rows) {
		const row = document.createElement('div');
		const term = document.createElement('dt');
		term.textContent = label;
		const detailText = document.createElement('dd');
		detailText.textContent = value;
		row.append(term, detailText);
		previewList.append(row);
	}
};

const fill = (record: any) => {
	const f = record.fields ?? {};
	if (field<HTMLInputElement>('title')) field<HTMLInputElement>('title')!.value = f.title ?? '';
	if (field<HTMLSelectElement>('category')) field<HTMLSelectElement>('category')!.value = f.category ?? '';
	if (field<HTMLTextAreaElement>('description')) field<HTMLTextAreaElement>('description')!.value = f.description ?? '';
	if (field<HTMLInputElement>('era')) field<HTMLInputElement>('era')!.value = f.era ?? '';
	if (field<HTMLInputElement>('place')) field<HTMLInputElement>('place')!.value = f.place ?? '';
	if (field<HTMLTextAreaElement>('source_note')) field<HTMLTextAreaElement>('source_note')!.value = f.source_note ?? '';
	if (field<HTMLSelectElement>('people')) field<HTMLSelectElement>('people')!.value = f.people ?? '';
	const named = (f.attribution ?? 'anonymous') === 'named';
	for (const input of form?.querySelectorAll<HTMLInputElement>('input[name="attribution"]') ?? []) input.checked = input.value === (named ? 'named' : 'anonymous');
	if (field<HTMLInputElement>('credit')) field<HTMLInputElement>('credit')!.value = f.credit ?? '';
	toggle(byId('wb-credit-field'), named);
	if (countEl) countEl.textContent = `${(f.description ?? '').length} / 3000`;
	items = (record.images ?? []).map((image: any) => ({ kind: 'kept', filename: image.filename, note: image.note ?? '', originalName: image.original_name ?? '' }));
	renderItems();
};

const statusLabels: Record<string, string> = { draft: '草稿', pending: '待审核', needs_info: '待补充', approved: '整理中', declined: '暂不采用', withdrawn: '已撤回' };

const renderState = (record: any) => {
	const list = byId('workbench-state-list');
	if (list) {
		const rows: Array<[string, string]> = [
			['投稿编号', record.id],
			['当前状态', record.withdrawal_requested ? '撤下处理中' : statusLabels[record.status] ?? record.status],
			['最近更新', new Date(record.updated_at).toLocaleString('zh-CN')],
			['图片数量', `${(record.images ?? []).length} 张`],
			['提交版本', `${(record.versions ?? []).length} 个`],
		];
		if (record.linked_item_id) rows.push(['关联档案', record.linked_item_id]);
		if (record.change_request) rows.push(['修改或撤下申请', ({ received: '已收到，等待站主处理', processing: '站主处理中', done: '已处理，请查看站主说明', rejected: '未通过，请查看站主说明' } as Record<string, string>)[record.change_request.status] ?? '状态待核实']);
		list.replaceChildren();
		for (const [label, value] of rows) {
			const row = document.createElement('div');
			const term = document.createElement('dt');
			term.textContent = label;
			const dd = document.createElement('dd');
			dd.textContent = value;
			row.append(term, dd);
			list.append(row);
		}
	}
	const message = byId('workbench-message');
	if (message) {
		if (record.public_message) {
			message.textContent = `站主的说明：${record.public_message}`;
			message.hidden = false;
		} else {
			message.hidden = true;
		}
	}
	const editable = record.status === 'draft';
	const withdrawButton = byId('wb-withdraw');
	if (withdrawButton) withdrawButton.textContent = ['needs_info', 'declined'].includes(record.status) ? '撤回并修改这份投稿' : '撤回这份投稿';
	toggle(byId('wb-withdraw'), !editable && !record.linked_item_id && record.status !== 'withdrawn' && !record.withdrawal_requested);
	toggle(byId('wb-discard'), editable);
	toggle(byId('wb-request-modify'), Boolean(record.linked_item_id) && !['received', 'processing'].includes(record.change_request?.status) && !record.withdrawal_requested);
	toggle(byId('wb-request-remove'), Boolean(record.linked_item_id) && !['received', 'processing'].includes(record.change_request?.status) && !record.withdrawal_requested);
	renderPreview();
};

const validate = (strict: boolean) => {
	if (strict && !items.length) { setStatus(statusEl, '请先选择至少一张经过筛选的图片副本。', 'error'); return false; }
	if (strict && form && !form.reportValidity()) { setStatus(statusEl, '请先补全标记为必填的内容。', 'error'); return false; }
	const fields = readFields();
	if (fields.title.length > 80 || fields.credit.length > 40) { setStatus(statusEl, '题名或署名过长，请适当精简。', 'error'); return false; }
	return true;
};

const reload = async () => {
	if (!editing) return;
	detail = await accountFetch(`/api/account/submissions/${submissionId}`);
	fill(detail);
	renderState(detail);
	toggle(form, detail.status === 'draft');
	dirty = false;
};

const saveDraft = async () => {
	if (busy) return;
	if (!validate(false)) return;
	busy = true;
	setFeedback('正在保存草稿…');
	try {
		if (editing) {
			const data = buildFormData();
			data.append('revision', String(detail.revision));
			data.append('mode', 'draft');
			await upload(`/api/account/submissions/${submissionId}/save`, data);
			await reload();
			setFeedback('草稿已保存，可以稍后回来继续编辑。');
		} else {
			const data = buildFormData();
			data.append('mode', 'draft');
			data.append('consent_version', consentVersion);
			const created = await upload('/api/account/submissions', data);
			window.location.assign(`/me/contribution/?id=${created.id}`);
			return;
		}
	} catch (error) {
		setStatus(statusEl, error instanceof Error ? error.message : '保存没有完成，请稍后重试。', 'error');
	} finally {
		busy = false;
	}
};

const submitForReview = async () => {
	if (busy) return;
	if (!consentVersion) { setStatus(statusEl, '页面信息尚未就绪，请刷新后重试。', 'error'); return; }
	if (!validConsents()) { setStatus(statusEl, '请逐项确认第三步的四点说明，它们不会被预先勾选。', 'error'); return; }
	if (!validate(true)) return;
	busy = true;
	setFeedback('正在提交审核…');
	const consents = { copies: true, rights: true, privacy: true, processing: true };
	try {
		if (!editing) {
			const data = buildFormData();
			data.append('mode', 'pending');
			applyConsents(data);
			const created = await upload('/api/account/submissions', data);
			window.location.assign(`/me/contribution/?id=${created.id}`);
			return;
		}
		const data = buildFormData();
		data.append('revision', String(detail.revision));
		data.append('mode', 'draft');
		const saved = await upload(`/api/account/submissions/${submissionId}/save`, data);
		await accountFetch(`/api/account/submissions/${submissionId}/submit`, {
			method: 'POST',
			body: { revision: saved.revision, consents, consent_version: consentVersion },
		});
		await reload();
		setFeedback('已提交审核。资料收到后会先由站主核对，未经确认不会公开。');
	} catch (error) {
		setStatus(statusEl, error instanceof Error ? error.message : '提交没有完成，请稍后重试。', 'error');
	} finally {
		busy = false;
	}
};

const runAction = async (label: string, action: () => Promise<any>) => {
	if (busy) return;
	busy = true;
	setFeedback(`正在${label}…`);
	try {
		await action();
		await reload();
		renderState(detail);
		setFeedback(`${label}已完成。`);
	} catch (error) {
		setStatus(byId('workbench-state-status'), error instanceof Error ? error.message : `${label}没有完成。`, 'error');
	} finally {
		busy = false;
	}
};

byId('wb-save')?.addEventListener('click', () => void saveDraft());
byId('wb-submit')?.addEventListener('click', () => void submitForReview());
byId('wb-withdraw')?.addEventListener('click', () => void runAction('撤回', () =>
	accountFetch(`/api/account/submissions/${submissionId}/withdraw`, { method: 'POST', body: {} })));
byId('wb-discard')?.addEventListener('click', () => {
	if (!window.confirm('草稿会移入回收区，不再出现在投稿列表里；已经保存的图片不会被永久删除。确定继续吗？')) return;
	void runAction('移入回收区', () => accountFetch(`/api/account/submissions/${submissionId}/discard`, { method: 'POST', body: {} }));
});
const requestChange = (kind: 'modify' | 'remove') => {
	const prompt = kind === 'modify' ? '请说明需要修改哪些内容（站主会看到）：' : '请说明需要撤下的原因（站主会看到，涉及隐私的会优先处理）：';
	const note = window.prompt(prompt, '');
	if (note === null) return;
	if (!note.trim()) { setStatus(byId('workbench-state-status'), '请填写说明后再提交申请。', 'error'); return; }
	void runAction(kind === 'modify' ? '提交修改申请' : '提交撤下申请', () =>
		accountFetch(`/api/account/submissions/${submissionId}/request`, { method: 'POST', body: { kind, note } }));
};
byId('wb-request-modify')?.addEventListener('click', () => requestChange('modify'));
byId('wb-request-remove')?.addEventListener('click', () => requestChange('remove'));

byId<HTMLInputElement>('wb-images')?.addEventListener('change', (event) => {
	const input = event.target as HTMLInputElement;
	void addFiles(Array.from(input.files ?? []));
	input.value = '';
});
form?.addEventListener('input', (event) => {
	dirty = true;
	const target = event.target as HTMLElement;
	if (target instanceof HTMLInputElement && target.name === 'attribution') toggle(byId('wb-credit-field'), target.value === 'named');
	if (target instanceof HTMLTextAreaElement && target.name === 'description' && countEl) countEl.textContent = `${target.value.length} / 3000`;
	renderPreview();
});
form?.addEventListener('change', () => renderPreview());
window.addEventListener('beforeunload', (event) => {
	if (dirty || busy) { event.preventDefault(); event.returnValue = ''; }
});

const load = async () => {
	try {
		// 账号协议版本用于开通账号；投稿的发布授权条款是另一套版本，必须单独向投稿通道获取。
		const [accountConfig, submissionConfig] = await Promise.all([
			accountFetch('/api/account/config'),
			fetch('/api/submissions/config', { headers: { Accept: 'application/json' } })
				.then((response) => (response.ok ? response.json() : {}))
				.catch(() => ({})),
		]);
		if (accountConfig.uploads_open === false) {
			const save = byId<HTMLButtonElement>('wb-save');
			const submit = byId<HTMLButtonElement>('wb-submit');
			if (save) save.disabled = true;
			if (submit) submit.disabled = true;
			setFeedback('投稿暂时暂停接收。已保存的资料仍可查看；账户内的撤回与申请入口照常使用。');
		}
		consentVersion = String((submissionConfig as { consent_version?: string })?.consent_version ?? '');
		if (editing) {
			await reload();
			toggle(statePanel, true);
			// 只有草稿可以继续编辑；其他状态只能查看进度与申请。
			toggle(form, detail.status === 'draft');
		} else {
			toggle(statePanel, false);
			toggle(form, true);
		}
		toggle(loading, false);
		toggle(content, true);
		if (!consentVersion) setFeedback('投稿通道暂未开放，暂时只能保存草稿的文字内容。');
	} catch (error) {
		toggle(loading, false);
		const code = (error as Error & { status?: number }).status;
		if (code === 401) { toggle(unauthenticated, true); return; }
		if (code === 404) { toggle(missing, true); return; }
		toggle(content, true);
		setStatus(statusEl, error instanceof Error ? error.message : '暂时无法打开投稿页面。', 'error');
	}
};

void load();

export {};
