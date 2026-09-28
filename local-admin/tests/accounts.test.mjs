// 阶段二账户模块隔离测试：注册登录、权限隔离、收藏、退出、导出与注销申请。
//
// 全部使用虚构账号与临时目录；不读写真实档案、私密收件区或公开网站构建产物。

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { createAccountStore, accountLimits, agreementVersion } from '../accounts.mjs';
import { createMailer, MailError } from '../mail.mjs';
import { createAccountHandler, sessionCookieName } from '../account-server.mjs';

const createClock = (start = new Date('2026-09-27T00:00:00.000Z')) => {
	let current = start;
	const clock = () => current;
	clock.advance = (seconds) => {
		current = new Date(current.getTime() + seconds * 1000);
		return current;
	};
	return clock;
};

async function fixture(t, { mailer: customMailer, ...storeOptions } = {}) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-accounts-test-'));
	const mailDirectory = path.join(root, 'mail-outbox');
	const clock = createClock();
	const mailer = customMailer ?? createMailer({ transport: 'file', environment: 'development', directory: mailDirectory });
	const store = createAccountStore({
		directory: path.join(root, 'accounts'),
		mailer,
		environment: 'development',
		ipSalt: 'test-salt',
		now: clock,
		...storeOptions,
	});
	t.after(async () => {
		store.close();
		const resolved = path.resolve(root);
		assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
		assert.ok(path.basename(resolved).startsWith('ljm-accounts-test-'));
		await fs.rm(resolved, { recursive: true, force: true });
	});
	// 按收件人与用途读取最近一封投递中的验证码，避免同邮箱多次投递互相干扰。
	const readCode = async (to, purpose = 'login') => {
		const files = (await fs.readdir(mailDirectory)).filter((name) => name.endsWith('.json')).sort();
		for (let index = files.length - 1; index >= 0; index -= 1) {
			const message = JSON.parse(await fs.readFile(path.join(mailDirectory, files[index]), 'utf8'));
			if (message.to !== to || message.variables?.purpose !== purpose) continue;
			return message.text.match(/\d{6}/)?.[0] ?? '';
		}
		throw new Error(`没有找到发往 ${to}（${purpose}）的邮件。`);
	};
	// 超过重发间隔后重新请求验证码。
	const reissue = (email, ip = '10.0.0.1') => {
		clock.advance(accountLimits.codeResendSeconds + 1);
		return store.requestLoginCode({ email, ip });
	};
	// 走完"请求验证码 → 校验 → 首次开通"，返回账号与会话令牌。
	const register = async (email, { nickname = '', ip = '10.0.0.1' } = {}) => {
		const requested = await store.requestLoginCode({ email, ip });
		const code = await readCode(email, 'login');
		const verified = await store.verifyLoginCode({ email, ticket: requested.ticket, code, client: 'test-agent', ip });
		assert.equal(verified.state, 'onboarding');
		const completed = await store.completeOnboarding({
			onboardingTicket: verified.onboarding_ticket,
			agreement: agreementVersion,
			agreed: true,
			nickname,
			client: 'test-agent',
			ip,
		});
		return { email, token: completed.token, user: completed.user };
	};
	return { root, mailDirectory, mailer, store, clock, readCode, reissue, register };
}

test('首次开通：必须主动同意协议，默认昵称不含邮箱信息', async t => {
	const { store, readCode } = await fixture(t);
	const email = 'fresh@example.invalid';
	const requested = await store.requestLoginCode({ email, ip: '10.0.0.1' });
	assert.equal(requested.expires_in, accountLimits.codeTtlSeconds);
	const code = await readCode(email, 'login');
	const verified = await store.verifyLoginCode({ email, ticket: requested.ticket, code, client: 'agent', ip: '10.0.0.1' });
	assert.equal(verified.state, 'onboarding');
	// 未同意协议不能开通。
	await assert.rejects(store.completeOnboarding({ onboardingTicket: verified.onboarding_ticket, agreement: agreementVersion, agreed: false, client: 'agent', ip: '10.0.0.1' }), { statusCode: 400 });
	await assert.rejects(store.completeOnboarding({ onboardingTicket: verified.onboarding_ticket, agreement: 'old-version', agreed: true, client: 'agent', ip: '10.0.0.1' }), { statusCode: 400 });
	const completed = await store.completeOnboarding({ onboardingTicket: verified.onboarding_ticket, agreement: agreementVersion, agreed: true, nickname: '', client: 'agent', ip: '10.0.0.1' });
	assert.ok(completed.user.nickname.length > 0);
	assert.ok(!completed.user.nickname.includes('fresh'));
	assert.ok(!completed.user.nickname.includes('example'));
	const session = store.resolveSession(completed.token);
	assert.equal(session.user.agreement_version, agreementVersion);
	assert.equal(session.user.notify_progress, false);
	// 开通票据只能使用一次。
	await assert.rejects(store.completeOnboarding({ onboardingTicket: verified.onboarding_ticket, agreement: agreementVersion, agreed: true, client: 'agent', ip: '10.0.0.1' }));
});

test('已有账号直接登录；请求验证码不透露邮箱是否已注册', async t => {
	const { store, register, reissue, readCode } = await fixture(t);
	const account = await register('known@example.invalid');
	const known = await reissue('known@example.invalid', '10.0.0.2');
	const unknown = await store.requestLoginCode({ email: 'nobody@example.invalid', ip: '10.0.0.3' });
	assert.deepEqual(Object.keys(known).sort(), Object.keys(unknown).sort());
	const code = await readCode('known@example.invalid', 'login');
	const signedIn = await store.verifyLoginCode({ email: 'known@example.invalid', ticket: known.ticket, code, client: 'agent', ip: '10.0.0.2' });
	assert.equal(signedIn.state, 'signed_in');
	assert.equal(signedIn.user.id, account.user.id);
	assert.ok(signedIn.token);
});

test('验证码：60 秒防抖、重发后旧码作废、错误次数上限、过期失效', async t => {
	const { store, clock, readCode, reissue } = await fixture(t);
	const email = 'codes@example.invalid';
	const first = await store.requestLoginCode({ email, ip: '10.0.0.4' });
	const firstCode = await readCode(email, 'login');
	// 60 秒内不允许重复发送。
	await assert.rejects(store.requestLoginCode({ email, ip: '10.0.0.4' }), { statusCode: 429 });
	clock.advance(61);
	const second = await store.requestLoginCode({ email, ip: '10.0.0.4' });
	const secondCode = await readCode(email, 'login');
	assert.notEqual(firstCode, secondCode);
	// 重发后旧验证码失效。
	await assert.rejects(store.verifyLoginCode({ email, ticket: first.ticket, code: firstCode, client: 'a', ip: '10.0.0.4' }));
	// 连续输错到上限。
	for (let attempt = 0; attempt < accountLimits.codeMaxAttempts; attempt += 1) {
		await assert.rejects(store.verifyLoginCode({ email, ticket: second.ticket, code: '000000', client: 'a', ip: '10.0.0.4' }));
	}
	await assert.rejects(store.verifyLoginCode({ email, ticket: second.ticket, code: secondCode, client: 'a', ip: '10.0.0.4' }), { statusCode: 429 });
	// 过期后即使输入正确也不能通过。
	const third = await reissue(email, '10.0.0.4');
	const thirdCode = await readCode(email, 'login');
	clock.advance(accountLimits.codeTtlSeconds + 1);
	await assert.rejects(store.verifyLoginCode({ email, ticket: third.ticket, code: thirdCode, client: 'a', ip: '10.0.0.4' }));
});

test('退出当前设备与退出全部设备都真正撤销凭证', async t => {
	const { store, register, reissue, readCode } = await fixture(t);
	const account = await register('sessions@example.invalid');
	const second = await reissue(account.email, '10.0.0.5');
	const secondToken = (await store.verifyLoginCode({
		email: account.email, ticket: second.ticket, code: await readCode(account.email, 'login'), client: 'other', ip: '10.0.0.5',
	})).token;
	assert.ok(store.resolveSession(account.token));
	assert.ok(store.resolveSession(secondToken));
	store.signOut({ session: store.resolveSession(account.token) });
	assert.equal(store.resolveSession(account.token), null);
	assert.ok(store.resolveSession(secondToken));
	const result = store.signOutAll({ session: store.resolveSession(secondToken) });
	assert.equal(result.revoked >= 1, true);
	assert.equal(store.resolveSession(secondToken), null);
});

test('用户之间互相隔离：越权读取、越权换邮箱都被拒绝', async t => {
	const { store, register, readCode } = await fixture(t);
	const a = await register('user-a@example.invalid', { ip: '10.0.1.1' });
	const b = await register('user-b@example.invalid', { ip: '10.0.2.1' });
	const sessionA = store.resolveSession(a.token);
	const sessionB = store.resolveSession(b.token);
	store.toggleFavorite({ session: sessionA, itemId: 'LJM-20260808-PHO-001', action: 'add' });
	assert.equal(store.listFavorites({ session: sessionA }).length, 1);
	assert.equal(store.listFavorites({ session: sessionB }).length, 0);
	assert.equal(store.account({ session: sessionB }).favorites_count, 0);
	// A 的换邮箱票据不能被 B 使用。
	const start = await store.requestEmailChange({ session: sessionA, ip: '10.0.1.1' });
	const changeTicket = store.verifyEmailChange({ session: sessionA, ticket: start.ticket, code: await readCode(a.email, 'email_change_old') }).change_ticket;
	await assert.rejects(store.requestEmailChangeConfirm({ changeTicket, userId: b.user.id, email: 'stolen@example.invalid', ip: '10.0.2.1' }), { statusCode: 400 });
	// B 的会话也不能读取 A 的申请。
	store.createRequest({ session: sessionA, kind: 'export' });
	assert.equal(store.listRequests({ session: sessionB }).length, 0);
	assert.equal(store.listRequests({ session: sessionA }).length, 1);
});

test('邮箱变更：原邮箱与新邮箱都要验证，完成后撤销全部旧会话', async t => {
	const { store, clock, register, readCode } = await fixture(t);
	const account = await register('change@example.invalid');
	const session = store.resolveSession(account.token);
	const start = await store.requestEmailChange({ session, ip: '10.0.3.1' });
	const changeTicket = store.verifyEmailChange({ session, ticket: start.ticket, code: await readCode(account.email, 'email_change_old') }).change_ticket;
	// 新邮箱已经被占用时必须提示冲突。
	await register('taken@example.invalid', { ip: '10.0.3.9' });
	await assert.rejects(store.requestEmailChangeConfirm({ changeTicket, userId: account.user.id, email: 'taken@example.invalid', ip: '10.0.3.1' }), { statusCode: 409 });
	// 重新走一遍，换到未被占用的新邮箱。
	clock.advance(61);
	const retry = await store.requestEmailChange({ session, ip: '10.0.3.1' });
	const secondTicket = store.verifyEmailChange({ session, ticket: retry.ticket, code: await readCode(account.email, 'email_change_old') }).change_ticket;
	const pending = await store.requestEmailChangeConfirm({ changeTicket: secondTicket, userId: account.user.id, email: 'moved@example.invalid', ip: '10.0.3.1' });
	const result = store.confirmEmailChange({ changeTicket: pending.change_ticket, userId: account.user.id, code: await readCode('moved@example.invalid', 'email_change_new') });
	assert.equal(result.new_email, 'moved@example.invalid');
	// 完成后旧会话全部撤销。
	assert.equal(store.resolveSession(account.token), null);
});

test('收藏：格式校验、重复点击不产生重复记录、取消后不残留', async t => {
	const { store, register } = await fixture(t);
	const account = await register('favorites@example.invalid');
	const session = store.resolveSession(account.token);
	assert.deepEqual(store.toggleFavorite({ session, itemId: 'LJM-20260808-PHO-001', action: 'add' }), { item_id: 'LJM-20260808-PHO-001', favorited: true });
	assert.equal(store.toggleFavorite({ session, itemId: 'LJM-20260808-PHO-001', action: 'add' }).repeated, true);
	assert.equal(store.listFavorites({ session }).length, 1);
	assert.equal(store.toggleFavorite({ session, itemId: 'LJM-20260808-PHO-001', action: 'remove' }).favorited, false);
	assert.equal(store.listFavorites({ session }).length, 0);
	// 重复取消不会报错，也不会留下记录。
	assert.equal(store.toggleFavorite({ session, itemId: 'LJM-20260808-PHO-001', action: 'remove' }).favorited, false);
	assert.throws(() => store.toggleFavorite({ session, itemId: 'not-an-item-id', action: 'add' }), { statusCode: 400 });
});

test('导出与注销申请：注销立即撤销会话并停止登录，“已收到”不等于“已完成”', async t => {
	const { store, register } = await fixture(t);
	const account = await register('requests@example.invalid');
	const session = store.resolveSession(account.token);
	const exported = store.createRequest({ session, kind: 'export' });
	assert.equal(exported.request.status, 'received');
	assert.equal(exported.signed_out, false);
	assert.equal(store.createRequest({ session, kind: 'export' }).request.repeated, true);
	const deletion = store.createRequest({ session, kind: 'deletion' });
	assert.equal(deletion.signed_out, true);
	assert.equal(store.resolveSession(account.token), null);
	assert.equal(store.adminSummary().requests_received, 2);
	assert.equal(store.adminListRequests().length, 2);
	// 处理完成前账号标记为注销处理中；公开档案不随注销自动删除。
	assert.equal(store.adminListUsers().find((user) => user.id === account.user.id).status, 'pending_deletion');
	store.adminReviewRequest({ requestId: deletion.request.id, status: 'processing', publicMessage: '正在核实，请留意邮件。', adminNote: '内部备注不外泄', actor: 'admin' });
	const reviewed = store.adminListRequests().find((item) => item.id === deletion.request.id);
	assert.equal(reviewed.status, 'processing');
	assert.equal(reviewed.status_label, '处理中');
	assert.notEqual(reviewed.status_label, '已完成');
	// 注销完成后才标记为完成；不可逆清理仍需逐次授权，本测试不做任何删除。
	store.adminReviewRequest({ requestId: deletion.request.id, status: 'done', publicMessage: '已按约定处理。', adminNote: '', actor: 'admin' });
	assert.equal(store.adminListRequests().find((item) => item.id === deletion.request.id).status_label, '已完成');
});

test('受限账号：暂停后立即停止登录，恢复后可以重新登录', async t => {
	const { store, register, reissue, readCode } = await fixture(t);
	const account = await register('suspended@example.invalid');
	const suspended = store.adminSetUserStatus({ userId: account.user.id, status: 'suspended', reason: '测试暂停', actor: 'admin' });
	assert.equal(suspended.status_label, '已暂停');
	assert.equal(store.resolveSession(account.token), null);
	const requested = await reissue(account.email, '10.0.5.1');
	const code = await readCode(account.email, 'login');
	await assert.rejects(store.verifyLoginCode({ email: account.email, ticket: requested.ticket, code, client: 'a', ip: '10.0.5.1' }), { statusCode: 403 });
	// 暂停必须填写原因。
	assert.throws(() => store.adminSetUserStatus({ userId: account.user.id, status: 'suspended', reason: '', actor: 'admin' }));
	assert.equal(store.adminSetUserStatus({ userId: account.user.id, status: 'active', reason: '', actor: 'admin' }).status_label, '正常');
	assert.throws(() => store.adminSetUserStatus({ userId: 'usr_000000000000000000000000', status: 'active', reason: '', actor: 'admin' }), { statusCode: 404 });
});

test('邮件失败：不留可用验证码、不产生虚假成功，并留下失败记录', async t => {
	const failing = { available: true, send: async () => { throw new Error('synthetic mail failure'); } };
	const { store } = await fixture(t, { mailer: failing });
	await assert.rejects(store.requestLoginCode({ email: 'broken@example.invalid', ip: '10.0.6.1' }), { statusCode: 503 });
	await assert.rejects(store.verifyLoginCode({ email: 'broken@example.invalid', ticket: 'anything', code: '000000', client: 'a', ip: '10.0.6.1' }));
	assert.equal(store.adminSummary().mail_failed, 1);
});

test('邮件未配置：明确报不可用，不假装成功', async t => {
	const { store } = await fixture(t, { mailer: createMailer({ transport: 'none' }) });
	assert.equal(store.status().available, false);
	await assert.rejects(store.requestLoginCode({ email: 'nochannel@example.invalid', ip: '10.0.7.1' }), { statusCode: 503 });
});

test('生产环境必须拒绝本机测试投递通道', () => {
	assert.throws(() => createMailer({ transport: 'file', environment: 'production', directory: os.tmpdir() }), MailError);
	assert.doesNotThrow(() => createMailer({ transport: 'none', environment: 'production' }));
});

test('公开 HTTP：来源校验、登录态、Cookie 属性与管理接口隔离', async t => {
	const { store, readCode } = await fixture(t);
	let handler;
	const server = http.createServer(async (request, response) => {
		const pathname = new URL(request.url, 'http://test').pathname;
		if (!await handler(request, response, pathname)) response.writeHead(404).end();
	});
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const origin = `http://127.0.0.1:${server.address().port}`;
	const adminOrigin = 'http://127.0.0.1:4173';
	handler = createAccountHandler({ store, origin, adminOrigin, local: true, trustProxy: false });
	t.after(() => { server.closeAllConnections(); return new Promise((resolve) => server.close(resolve)); });

	const jsonHeaders = (extra = {}) => ({ 'Content-Type': 'application/json', 'X-LJM-Account-Request': '1', Origin: origin, ...extra });
	assert.equal((await fetch(`${origin}/api/account/config`)).status, 200);
	assert.equal((await fetch(`${origin}/api/account/me`)).status, 401);
	// 缺少请求标记或来源不正确都不能提交。
	assert.equal((await fetch(`${origin}/api/account/code`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: '{}' })).status, 403);
	assert.equal((await fetch(`${origin}/api/account/code`, { method: 'POST', headers: jsonHeaders({ Origin: 'https://evil.invalid' }), body: '{}' })).status, 403);
	// 管理接口不能从公开来源调用，也不能只靠会话 Cookie。
	assert.equal((await fetch(`${origin}/api/account-admin/summary`, { headers: { Origin: origin } })).status, 403);
	assert.equal((await fetch(`${origin}/api/account-admin/summary`, { headers: { Origin: adminOrigin } })).status, 200);

	const email = 'http-flow@example.invalid';
	const issued = await fetch(`${origin}/api/account/code`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ email }) });
	assert.equal(issued.status, 200);
	const code = await readCode(email, 'login');
	const verified = await fetch(`${origin}/api/account/verify`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ email, ticket: (await issued.json()).ticket, code }) });
	assert.equal(verified.status, 200);
	const verifiedBody = await verified.json();
	assert.equal(verifiedBody.state, 'onboarding');
	const onboarded = await fetch(`${origin}/api/account/onboarding`, {
		method: 'POST',
		headers: jsonHeaders(),
		body: JSON.stringify({ onboarding_ticket: verifiedBody.onboarding_ticket, agreement_version: agreementVersion, agreed: true, nickname: '测试读者' }),
	});
	assert.equal(onboarded.status, 200);
	const cookie = onboarded.headers.getSetCookie()[0];
	assert.ok(cookie.startsWith(`${sessionCookieName}=`));
	assert.ok(cookie.includes('HttpOnly'));
	assert.ok(cookie.includes('SameSite=Lax'));
	assert.ok(!cookie.includes('Secure'));
	const sessionValue = cookie.split(';')[0];
	const me = await fetch(`${origin}/api/account/me`, { headers: { Cookie: sessionValue } });
	assert.equal(me.status, 200);
	const meBody = await me.json();
	assert.equal(meBody.user.nickname, '测试读者');
	assert.equal(meBody.user.email, email);
	assert.equal(meBody.favorites_count, 0);
	assert.ok(!JSON.stringify(meBody).includes('accountHash'));
	// 收藏与退出。
	const favorited = await fetch(`${origin}/api/account/favorites`, { method: 'POST', headers: jsonHeaders({ Cookie: sessionValue }), body: JSON.stringify({ item_id: 'LJM-20260808-PCD-001', action: 'add' }) });
	assert.equal(favorited.status, 200);
	assert.equal((await favorited.json()).favorited, true);
	const loggedOut = await fetch(`${origin}/api/account/logout`, { method: 'POST', headers: jsonHeaders({ Cookie: sessionValue }), body: '{}' });
	assert.equal(loggedOut.status, 200);
	assert.ok(loggedOut.headers.getSetCookie()[0].includes('Max-Age=0'));
	assert.equal((await fetch(`${origin}/api/account/me`, { headers: { Cookie: sessionValue } })).status, 401);
	// 响应不得被公共缓存，也不得被搜索引擎收录。
	const configResponse = await fetch(`${origin}/api/account/config`);
	assert.equal(configResponse.headers.get('cache-control'), 'no-store');
	assert.ok(String(configResponse.headers.get('x-robots-tag')).includes('noindex'));
	// 不存在的地址不能被账户服务吞掉。
	assert.equal((await fetch(`${origin}/api/account/unknown-route`)).status, 404);
});

test('限流：验证码按来源地址设限', async t => {
	const { store } = await fixture(t);
	let blocked = 0;
	for (let index = 0; index <= accountLimits.ipPerHour; index += 1) {
		try {
			await store.requestLoginCode({ email: `limit-${index}@example.invalid`, ip: '10.0.8.1' });
		} catch (error) {
			blocked += 1;
			assert.equal(error.statusCode, 429);
		}
	}
	// 超出单地址上限后必须被拒绝，且不是"悄悄成功"。
	assert.equal(blocked, 1);
	assert.equal(store.adminSummary().mail_failed, 0);
});

test('正式邮件通道：请求格式正确，失败时不泄漏密钥', async t => {
	void t;
	const calls = [];
	const mailer = createMailer({
		transport: 'https',
		environment: 'production',
		endpoint: 'https://api.example.invalid/emails',
		apiKey: 'secret-key-value',
		from: '老旧默片 <no-reply@example.invalid>',
		fetchImpl: async (url, options) => {
			calls.push({ url, options });
			return new Response(JSON.stringify({ id: 'msg_1' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
		},
	});
	assert.equal(mailer.available, true);
	const sent = await mailer.send({ to: 'reader@example.invalid', template: 'login-code', variables: { code: '123456', minutes: 10, purpose: 'login' } });
	assert.equal(sent.id, 'msg_1');
	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, 'https://api.example.invalid/emails');
	assert.equal(calls[0].options.method, 'POST');
	assert.equal(calls[0].options.headers.Authorization, 'Bearer secret-key-value');
	const body = JSON.parse(calls[0].options.body);
	assert.equal(body.from, '老旧默片 <no-reply@example.invalid>');
	assert.deepEqual(body.to, ['reader@example.invalid']);
	assert.ok(body.subject.includes('验证码'));
	assert.ok(body.text.includes('123456'));
	// 失败时只报告原因，不把密钥写进错误信息。
	const failing = createMailer({
		transport: 'https', environment: 'production',
		endpoint: 'https://api.example.invalid/emails', apiKey: 'secret-key-value', from: 'a@example.invalid',
		fetchImpl: async () => new Response('bad request', { status: 400 }),
	});
	const error = await failing.send({ to: 'reader@example.invalid', template: 'login-code', variables: { code: '000000', minutes: 10, purpose: 'login' } }).catch((caught) => caught);
	assert.ok(error instanceof MailError);
	assert.ok(!String(error.message).includes('secret-key-value'));
	// 投稿进度通知同样走同一个通道，模板内容不含图片、正文或联系方式。
	const progress = await mailer.send({ to: 'reader@example.invalid', template: 'submission-progress', variables: { event: 'needs_info', title: '测试用的虚构旧物' } });
	assert.ok(progress.id);
	const progressBody = JSON.parse(calls[calls.length - 1].options.body);
	assert.ok(progressBody.subject.includes('需要你补充资料'));
	assert.ok(!progressBody.text.includes('@'));
});

test('正式通道配置不完整时视为未配置，不会假装可用', async t => {
	void t;
	const mailer = createMailer({ transport: 'https', environment: 'production', endpoint: 'https://api.example.invalid/emails', from: 'a@example.invalid' });
	assert.equal(mailer.available, false);
	assert.equal(mailer.describe().transport, 'none');
	const error = await mailer.send({ to: 'reader@example.invalid', template: 'login-code', variables: { code: '000000', minutes: 10, purpose: 'login' } }).catch((caught) => caught);
	assert.ok(error instanceof MailError);
	assert.equal(error.statusCode, 503);
});
