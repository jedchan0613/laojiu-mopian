// 账户设置：昵称与通知偏好、更换邮箱、退出全部设备、数据导出与注销申请。
// 敏感操作全部以服务端确认为准；页面不自行宣称申请已经完成。

import { accountFetch, setStatus, toggle } from './account-client';

const byId = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`);

const loading = byId('settings-loading');
const unauthenticated = byId('settings-unauth');
const content = byId('settings-content');
const profileForm = byId<HTMLFormElement>('profile-form');
const nicknameInput = byId<HTMLInputElement>('profile-nickname');
const notifyInput = byId<HTMLInputElement>('profile-notify');
const profileStatus = byId('profile-status');

let changeTicket = '';
let oldCodeTicket = '';

const showAccount = (payload: any) => {
	byId('settings-nickname')!.textContent = String(payload.user?.nickname ?? '—');
	byId('settings-email')!.textContent = String(payload.user?.email ?? '—');
	byId('settings-state')!.textContent = String(payload.user?.status_label ?? '—');
	byId('settings-favorites')!.textContent = `${payload.favorites_count ?? 0} 件`;
	byId('settings-sessions')!.textContent = `${payload.active_sessions ?? 1} 台`;
	if (nicknameInput) nicknameInput.value = String(payload.user?.nickname ?? '');
	if (notifyInput) notifyInput.checked = Boolean(payload.user?.notify_progress);
	renderRequests(payload.requests ?? []);
};

const renderRequests = (requests: Array<Record<string, string>>) => {
	const list = byId<HTMLUListElement>('request-list');
	if (!list) return;
	list.replaceChildren();
	if (!requests.length) {
		const row = document.createElement('li');
		row.className = 'account-row';
		row.textContent = '还没有提交过申请。';
		list.append(row);
		return;
	}
	for (const item of requests) {
		const row = document.createElement('li');
		row.className = 'account-row';
		const term = document.createElement('dt');
		term.textContent = `${item.kind_label} · ${item.id}`;
		const value = document.createElement('dd');
		value.textContent = [item.status_label, item.public_message].filter(Boolean).join(' · ');
		row.append(term, value);
		list.append(row);
	}
};

const reload = async () => {
	const payload = await accountFetch('/api/account/me');
	showAccount(payload);
	return payload;
};

const load = async () => {
	try {
		await reload();
		toggle(loading, false);
		toggle(content, true);
	} catch (error) {
		toggle(loading, false);
		if ((error as Error & { status?: number }).status === 401) {
			toggle(unauthenticated, true);
			return;
		}
		setStatus(profileStatus, error instanceof Error ? error.message : '暂时无法读取账号信息。', 'error');
	}
};

profileForm?.addEventListener('submit', async (event) => {
	event.preventDefault();
	const button = profileForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
	if (button) button.disabled = true;
	setStatus(profileStatus, '正在保存…');
	try {
		const result = await accountFetch('/api/account/profile', {
			method: 'POST',
			body: { nickname: nicknameInput?.value.trim() ?? '', notify_progress: Boolean(notifyInput?.checked) },
		});
		await reload();
		setStatus(profileStatus, `已保存${(result as any).user?.nickname ? `：${(result as any).user.nickname}` : ''}。`, 'ok');
	} catch (error) {
		setStatus(profileStatus, error instanceof Error ? error.message : '保存没有完成。', 'error');
	} finally {
		if (button) button.disabled = false;
	}
});

const step = (visible: number) => {
	toggle(byId('email-step-1'), visible === 1);
	toggle(byId('email-step-2'), visible === 2);
	toggle(byId('email-step-3'), visible === 3);
	toggle(byId('email-step-4'), visible === 4);
};

const emailStatus = byId('email-status');
byId('email-start')?.addEventListener('click', async () => {
	setStatus(emailStatus, '正在向当前邮箱发送验证码…');
	try {
		const result = await accountFetch('/api/account/email/change/start', { method: 'POST', body: {} });
		oldCodeTicket = String((result as any).ticket ?? '');
		step(2);
		setStatus(emailStatus, '验证码已发送到当前邮箱，请在 10 分钟内完成验证。', 'ok');
	} catch (error) {
		setStatus(emailStatus, error instanceof Error ? error.message : '暂时无法开始更换邮箱。', 'error');
	}
});
byId('email-verify-old')?.addEventListener('click', async () => {
	setStatus(emailStatus, '正在验证…');
	try {
		const result = await accountFetch('/api/account/email/change/verify-old', {
			method: 'POST',
			body: { ticket: oldCodeTicket, code: byId<HTMLInputElement>('email-old-code')?.value.trim() ?? '' },
		});
		setStatus(emailStatus, '原邮箱已验证，请填写新邮箱。', 'ok');
		changeTicket = String((result as any).change_ticket ?? '');
		step(3);
	} catch (error) {
		setStatus(emailStatus, error instanceof Error ? error.message : '验证没有通过。', 'error');
	}
});
byId('email-send-new')?.addEventListener('click', async () => {
	setStatus(emailStatus, '正在发送…');
	try {
		const result = await accountFetch('/api/account/email/change/verify-new', {
			method: 'POST',
			body: { change_ticket: changeTicket, email: byId<HTMLInputElement>('email-new')?.value.trim() ?? '' },
		});
		changeTicket = String((result as any).change_ticket ?? '');
		step(4);
		setStatus(emailStatus, '验证码已发送到新邮箱，请完成验证。', 'ok');
	} catch (error) {
		setStatus(emailStatus, error instanceof Error ? error.message : '暂时无法发送验证码。', 'error');
	}
});
byId('email-confirm')?.addEventListener('click', async () => {
	setStatus(emailStatus, '正在完成更换…');
	try {
		const result = await accountFetch('/api/account/email/change/confirm', {
			method: 'POST',
			body: { change_ticket: changeTicket, code: byId<HTMLInputElement>('email-new-code')?.value.trim() ?? '' },
		});
		setStatus(emailStatus, `邮箱已更换为 ${(result as any).new_email}。为了安全，全部设备已退出登录，请使用新邮箱重新登录。`, 'ok');
		window.setTimeout(() => window.location.assign('/login/'), 2500);
	} catch (error) {
		setStatus(emailStatus, error instanceof Error ? error.message : '更换没有完成。', 'error');
	}
});

const securityStatus = byId('security-status');
byId('logout-all')?.addEventListener('click', async () => {
	setStatus(securityStatus, '正在退出全部设备…');
	try {
		const result = await accountFetch('/api/account/logout-all', { method: 'POST', body: {} });
		setStatus(securityStatus, `已退出全部设备（${(result as any).revoked ?? 0} 个登录凭证已撤销），正在返回首页…`, 'ok');
		window.setTimeout(() => window.location.assign('/'), 2000);
	} catch (error) {
		setStatus(securityStatus, error instanceof Error ? error.message : '暂时无法退出全部设备。', 'error');
	}
});

const requestStatus = byId('request-status');
byId('request-export')?.addEventListener('click', async () => {
	setStatus(requestStatus, '正在提交申请…');
	try {
		const result = await accountFetch('/api/account/requests', { method: 'POST', body: { kind: 'export' } });
		const request = (result as any).request;
		setStatus(requestStatus, `导出申请已收到，回执编号 ${request.id}。这是「已收到申请」，不是「导出完成」；站主确认后会通过私密方式联系你。`, 'ok');
		await reload();
	} catch (error) {
		setStatus(requestStatus, error instanceof Error ? error.message : '暂时无法提交申请。', 'error');
	}
});
byId('request-deletion')?.addEventListener('click', async () => {
	if (!byId<HTMLInputElement>('deletion-confirm')?.checked) {
		setStatus(requestStatus, '请先阅读并勾选确认，再提交注销申请。', 'error');
		return;
	}
	setStatus(requestStatus, '正在提交申请…');
	try {
		const result = await accountFetch('/api/account/requests', { method: 'POST', body: { kind: 'deletion' } });
		const request = (result as any).request;
		setStatus(requestStatus, `注销申请已收到，回执编号 ${request.id}。已立即退出全部设备并停止新投稿；公开档案不会随注销自动删除。`, 'ok');
		window.setTimeout(() => window.location.assign('/login/'), 3000);
	} catch (error) {
		setStatus(requestStatus, error instanceof Error ? error.message : '暂时无法提交申请。', 'error');
	}
});

void load();

export {};
