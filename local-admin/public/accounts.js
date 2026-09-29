// 账号与申请面板：读取账号概览、账号列表与人工申请，并处理暂停/恢复与申请状态。
// 所有操作都带管理请求标记；接口只在本机管理入口可用。

const message = document.querySelector('#desk-message');
const statsBox = document.querySelector('#account-stats');
const userList = document.querySelector('#user-list');
const requestList = document.querySelector('#request-list');

const say = (text, tone = '') => {
	if (!message) return;
	message.textContent = text;
	if (tone) message.setAttribute('data-tone', tone);
	else message.removeAttribute('data-tone');
};

const request = async (path, options = {}) => {
	const response = await fetch(path, {
		method: options.method ?? 'GET',
		headers: {
			'X-LJM-Admin-Request': '1',
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error ?? '操作没有完成。');
	return payload;
};

const element = (tag, className, text) => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
};

const formatTime = (value) => {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
};

const renderStats = (summary) => {
	if (!statsBox) return;
	statsBox.replaceChildren();
	const entries = [
		['注册账号', summary.users],
		['已暂停', summary.suspended],
		['注销处理中', summary.pending_deletion],
		['有效登录', summary.active_sessions],
		['收藏记录', summary.favorites],
		['待处理申请', summary.requests_received],
		['发信失败', summary.mail_failed],
	];
	for (const [label, value] of entries) {
		const card = element('div', 'stat');
		card.append(element('span', '', String(label)), element('strong', '', String(value ?? 0)));
		statsBox.append(card);
	}
};

const renderUsers = (users) => {
	if (!userList) return;
	userList.replaceChildren();
	if (!users.length) {
		userList.append(element('p', 'account-admin-empty', '目前还没有注册账号。'));
		return;
	}
	for (const user of users) {
		const card = element('article', 'account-admin-card');
		card.dataset.status = user.status;
		const title = element('h3', '', user.nickname || '（未设置昵称）');
		title.append(element('span', 'account-admin-badge', user.status_label));
		card.append(title);
		card.append(element('p', 'account-admin-meta', `邮箱：${user.email}`));
		card.append(element('p', 'account-admin-meta', `收藏 ${user.favorites} 件 · 有效登录 ${user.active_sessions} 台 · 注册于 ${formatTime(user.created_at)}`));
		card.append(element('p', 'account-admin-meta', `最近登录：${formatTime(user.last_login_at)}${user.suspended_reason ? ` · 暂停原因：${user.suspended_reason}` : ''}`));

		const actions = element('div', 'account-admin-actions');
		if (user.status === 'suspended') {
			const restore = element('button', '', '恢复账号');
			restore.type = 'button';
			restore.addEventListener('click', async () => {
				restore.disabled = true;
				try {
					await request(`/api/account-admin/users/${user.id}/status`, { method: 'POST', body: { status: 'active', reason: '' } });
					say(`已恢复账号 ${user.nickname || user.email}。`, '');
					await load();
				} catch (error) {
					restore.disabled = false;
					say(error instanceof Error ? error.message : '操作没有完成。', 'error');
				}
			});
			actions.append(restore);
		} else {
			const suspend = element('button', '', '暂停账号');
			suspend.type = 'button';
			suspend.dataset.danger = '1';
			suspend.addEventListener('click', async () => {
				const reason = window.prompt('暂停原因（会记录在操作日志里，必填）：', '');
				if (reason === null) return;
				suspend.disabled = true;
				try {
					await request(`/api/account-admin/users/${user.id}/status`, { method: 'POST', body: { status: 'suspended', reason } });
					say(`已暂停账号 ${user.nickname || user.email}，该账号的全部登录凭证已撤销。`, '');
					await load();
				} catch (error) {
					suspend.disabled = false;
					say(error instanceof Error ? error.message : '操作没有完成。', 'error');
				}
			});
			actions.append(suspend);
		}
		card.append(actions);
		userList.append(card);
	}
};

const renderRequests = (requests) => {
	if (!requestList) return;
	requestList.replaceChildren();
	if (!requests.length) {
		requestList.append(element('p', 'account-admin-empty', '目前没有待处理的人工申请。'));
		return;
	}
	for (const item of requests) {
		const card = element('article', 'account-admin-card');
		card.dataset.status = item.status;
		const title = element('h3', '', `${item.kind_label} · ${item.id}`);
		title.append(element('span', 'account-admin-badge', item.status_label));
		card.append(title);
		card.append(element('p', 'account-admin-meta', `账号：${item.user_nickname || '（未知）'}（${item.user_status || '—'}）· 提交于 ${formatTime(item.created_at)}`));
		if (item.public_message) card.append(element('p', 'account-admin-meta', `给用户的说明：${item.public_message}`));
		if (item.admin_note) card.append(element('p', 'account-admin-meta', `内部备注：${item.admin_note}`));

		const statusField = element('label', 'account-admin-field');
		statusField.append(element('span', '', '处理状态'));
		const select = document.createElement('select');
		for (const [value, label] of [['received', '已收到申请'], ['processing', '处理中'], ['done', '已完成'], ['rejected', '未通过']]) {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = label;
			if (item.status === value) option.selected = true;
			select.append(option);
		}
		statusField.append(select);
		card.append(statusField);

		const publicField = element('label', 'account-admin-field');
		publicField.append(element('span', '', '给用户看的说明（会显示在用户中心）'));
		const publicInput = document.createElement('textarea');
		publicInput.rows = 2;
		publicInput.maxLength = 1000;
		publicInput.value = item.public_message ?? '';
		publicField.append(publicInput);
		card.append(publicField);

		const noteField = element('label', 'account-admin-field');
		noteField.append(element('span', '', '内部备注（不会给用户看）'));
		const noteInput = document.createElement('textarea');
		noteInput.rows = 2;
		noteInput.maxLength = 2000;
		noteInput.value = item.admin_note ?? '';
		noteField.append(noteInput);
		card.append(noteField);

		const actions = element('div', 'account-admin-actions');
		const save = element('button', '', '保存处理结果');
		save.type = 'button';
		save.addEventListener('click', async () => {
			save.disabled = true;
			try {
				await request(`/api/account-admin/requests/${item.id}/review`, {
					method: 'POST',
					body: {
						status: select.value,
						public_message: publicInput.value,
						admin_note: noteInput.value,
					},
				});
				say(`申请 ${item.id} 已更新为「${select.options[select.selectedIndex].textContent}」。`, '');
				await load();
			} catch (error) {
				save.disabled = false;
				say(error instanceof Error ? error.message : '操作没有完成。', 'error');
			}
		});
		actions.append(save);
		card.append(actions);
		requestList.append(card);
	}
};

const load = async () => {
	try {
		const [summary, users, requests] = await Promise.all([
			request('/api/account-admin/summary'),
			request('/api/account-admin/users'),
			request('/api/account-admin/requests'),
		]);
		renderStats(summary);
		renderUsers(users.users ?? []);
		renderRequests(requests.requests ?? []);
		if (!message?.textContent) say(`读取于 ${new Date().toLocaleTimeString('zh-CN')}。`);
	} catch (error) {
		say(error instanceof Error ? error.message : '暂时无法读取账号数据。', 'error');
	}
};

document.querySelector('#refresh-accounts')?.addEventListener('click', () => void load());
void load();

export {};
