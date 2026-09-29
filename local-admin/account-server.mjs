// 独立账户服务：只监听本机回环地址，只提供 /api/account/* 与 /api/account-admin/*。
//
// 边界（与方案 K、H 一致）：
// - 只读写自己的私密数据目录；不读写 archive-data、drafts、history、recycle-bin、site/ 与公开素材目录。
// - 用户接口与管理接口使用不同的前缀、不同的请求标记、不同的来源校验；管理接口不接受会话 Cookie 鉴权。
// - 公开反向代理只应转发 /api/account/ 前缀；本文件可作为独立进程启动，也可被本地服务直接挂载。

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAccountStore, AccountError, accountLimits, agreementVersion, accountStates } from './accounts.mjs';
import { createMailer, MailError } from './mail.mjs';
import { createSubmissionStore, readSubmissionForm, SubmissionError } from './submissions.mjs';
import { processProgressNotifications } from './notification-queue.mjs';

export const sessionCookieName = 'ljm_account_session';
const maximumBodyBytes = 16 * 1024;
// 账户投稿的图片与正文使用 multipart 直传；单件上限与免注册投稿一致（合计不超过 20 MB）。
const maximumUploadBytes = 24 * 1024 * 1024;

const securityHeaders = () => ({
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'no-referrer',
	'X-Robots-Tag': 'noindex, nofollow, noarchive',
	'Cache-Control': 'no-store',
});

const stripTrailingSlash = (value) => String(value ?? '').replace(/\/+$/, '');

const parseCookies = (header) => {
	const result = new Map();
	for (const part of String(header ?? '').split(';')) {
		const index = part.indexOf('=');
		if (index < 0) continue;
		result.set(part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim()));
	}
	return result;
};

const sessionCookie = (token, secure, maxAgeSeconds) =>
	`${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
const clearedCookie = (secure) =>
	`${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;

export function createAccountHandler({
	store,
	submissionStore = null,
	origin,
	adminOrigin,
	local = false,
	trustProxy = false,
	secureCookies = false,
	registrationOpen = true,
	uploadsOpen = true,
	ipRateLimit = { maximum: 120, windowSeconds: 600 },
}) {
	if (!store) throw new Error('账户服务必须提供数据层。');
	if (!origin) throw new Error('账户服务必须显式配置公开站来源地址。');
	const publicOrigins = new Set([stripTrailingSlash(origin)]);
	if (local) publicOrigins.add(stripTrailingSlash(origin).replace('127.0.0.1', 'localhost'));
	const adminOrigins = new Set([stripTrailingSlash(adminOrigin || origin)]);
	const globalRate = new Map();

	const send = (response, status, value, extraHeaders = {}) => {
		if (response.headersSent) return;
		const body = JSON.stringify(value);
		response.writeHead(status, {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Length': Buffer.byteLength(body),
			...securityHeaders(),
			...extraHeaders,
		});
		response.end(body);
	};
	const fail = (message, status = 400) => {
		throw new AccountError(message, status);
	};

	const readJson = async (request) => {
		const declared = Number.parseInt(request.headers['content-length'] ?? '0', 10);
		if (Number.isFinite(declared) && declared > maximumBodyBytes) fail('提交内容过大。', 413);
		const chunks = [];
		let total = 0;
		for await (const chunk of request) {
			total += chunk.length;
			if (total > maximumBodyBytes) fail('提交内容过大。', 413);
			chunks.push(chunk);
		}
		if (!total) return {};
		if (!(request.headers['content-type'] ?? '').startsWith('application/json')) fail('提交格式无效。', 415);
		try {
			const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail('提交内容必须是有效表单。');
			return parsed;
		} catch (error) {
			if (error instanceof AccountError) throw error;
			fail('提交内容无法读取。');
		}
	};

	const clientAddress = (request) => {
		const value = trustProxy ? request.headers['x-ljm-client-ip'] : request.socket.remoteAddress;
		return typeof value === 'string' && value.length <= 100 ? value : '';
	};

	// 用户接口：来源必须是公开站；写操作额外要求专用请求标记，防止其他网页代为提交。
	const requireAccountOrigin = (request, mutate) => {
		const header = request.headers.origin;
		if (header && !publicOrigins.has(stripTrailingSlash(header))) fail('已阻止来自其他网页的请求。', 403);
		if (mutate) {
			if (!header) fail('缺少来源信息，请从网站页面重试。', 403);
			if (request.headers['x-ljm-account-request'] !== '1') fail('请求标记无效。', 403);
		}
	};
	// 管理接口：来源必须是管理入口，且写操作必须带管理标记。
	// 管理鉴权不依赖登录会话；即使浏览器同时带着账号 Cookie，也不能凭它调用管理接口。
	const requireAdminOrigin = (request, mutate) => {
		const header = stripTrailingSlash(request.headers.origin);
		if (!adminOrigins.has(header)) fail('管理操作只能从本地档案管理入口发起。', 403);
		if (mutate && request.headers['x-ljm-admin-request'] !== '1') fail('管理操作标记无效。', 403);
	};

	const throttleAddress = (request) => {
		const address = clientAddress(request);
		if (!address) fail('无法确认请求来源。', 403);
		const now = Date.now();
		const previous = globalRate.get(address) ?? { count: 0, until: now + ipRateLimit.windowSeconds * 1000 };
		if (previous.until <= now) {
			previous.count = 0;
			previous.until = now + ipRateLimit.windowSeconds * 1000;
		}
		previous.count += 1;
		globalRate.set(address, previous);
		if (globalRate.size > 5000) {
			for (const [key, value] of globalRate) if (value.until <= now) globalRate.delete(key);
		}
		if (previous.count > ipRateLimit.maximum) fail('当前访问过于频繁，请稍后再试。', 429);
	};

	const requireSession = (request) => {
		const token = parseCookies(request.headers.cookie).get(sessionCookieName);
		const session = store.resolveSession(token);
		if (!session) fail('登录状态已过期，请重新登录。', 401);
		return session;
	};

	const withCookies = (response, cookies = [], status = 200, value = {}) => {
		send(response, status, value, cookies.length ? { 'Set-Cookie': cookies } : {});
	};

	// multipart 表单里的保留图片清单必须可解析；错误清单不能被当成“移除全部图片”。
	const accountPayloadFromForm = (form) => {
		const asJson = (value, fallback, valid) => {
			if (value === undefined) return fallback;
			try {
				const parsed = JSON.parse(String(value ?? ''));
				if (!valid(parsed)) fail('图片清单或说明格式无效，请刷新后重试。');
				return parsed;
			} catch (error) {
				if (error instanceof AccountError) throw error;
				fail('图片清单或说明格式无效，请刷新后重试。');
			}
		};
		const stringArray = (value) => Array.isArray(value) && value.every((part) => typeof part === 'string');
		const pendingNotes = asJson(form.pending_notes, [], stringArray);
		return {
			fields: {
				title: form.title,
				description: form.description,
				category: form.category,
				era: form.era,
				place: form.place,
				source_note: form.source_note,
				people: form.people,
				attribution: form.attribution,
				credit: form.credit,
			},
			keep: asJson(form.keep, [], stringArray),
			notes: asJson(form.notes, {}, (value) => value !== null && typeof value === 'object' && !Array.isArray(value)),
			images: (Array.isArray(form.images) ? form.images : []).map((image, index) => ({
				name: image?.name,
				buffer: image?.buffer,
				note: Array.isArray(pendingNotes) ? pendingNotes[index] ?? '' : '',
			})),
			consents: form.consents ?? {},
			consent_version: form.consent_version ?? '',
			request_key: form.request_key ?? '',
			website: form.website ?? '',
		};
	};
	const requireSubmissionStore = () => {
		if (!submissionStore) fail('投稿功能暂不可用。', 503);
		return submissionStore;
	};

	return async (request, response, pathname) => {
		const isAccount = pathname.startsWith('/api/account/');
		const isAdmin = pathname.startsWith('/api/account-admin/');
		if (!isAccount && !isAdmin) return false;
		try {
			throttleAddress(request);
			if (isAdmin) return await handleAdmin(request, response, pathname);
			return await handleAccount(request, response, pathname);
		} catch (error) {
			const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
			if (!['AccountError', 'MailError', 'SubmissionError'].includes(error?.name) && status >= 500) console.error(error);
			send(response, status, { error: error instanceof Error && error.message ? error.message : '暂时无法完成操作，请稍后再试。' });
			return true;
		}
	};

	async function handleAccount(request, response, pathname) {
		const method = request.method ?? 'GET';
		const mutation = method !== 'GET' && method !== 'HEAD';
		const client = request.headers['user-agent'] ?? '';

		if (pathname === '/api/account/config') {
			if (method !== 'GET') fail('不支持此操作。', 405);
			// 这里不读取会话：可用性检查不应产生会话副作用，登录态由 /api/account/me 判断。
			return withCookies(response, [], 200, { ...store.status(), registration_open: registrationOpen, uploads_open: uploadsOpen }), true;
		}
		requireAccountOrigin(request, mutation);
		const address = clientAddress(request);

		if (pathname === '/api/account/code' && method === 'POST') {
			const payload = await readJson(request);
			const result = await store.requestLoginCode({ email: payload.email, ip: address });
			return withCookies(response, [], 200, { ok: true, ...result }), true;
		}
		if (pathname === '/api/account/verify' && method === 'POST') {
			const payload = await readJson(request);
			const result = await store.verifyLoginCode({ email: payload.email, ticket: payload.ticket, code: payload.code, client, ip: address });
			if (result.state === 'signed_in') {
				const { token, ...rest } = result;
				return withCookies(response, [sessionCookie(token, secureCookies, accountLimits.sessionAbsoluteSeconds)], 200, rest), true;
			}
			return withCookies(response, [], 200, result), true;
		}
		if (pathname === '/api/account/onboarding' && method === 'POST') {
			if (!registrationOpen) fail('新账号开通暂时关闭，已有账号仍可登录。', 503);
			const payload = await readJson(request);
			const result = await store.completeOnboarding({
				onboardingTicket: payload.onboarding_ticket,
				agreement: payload.agreement_version,
				agreed: payload.agreed,
				nickname: payload.nickname,
				client,
				ip: address,
			});
			return withCookies(response, [sessionCookie(result.token, secureCookies, accountLimits.sessionAbsoluteSeconds)], 200, { state: 'signed_in', user: result.user }), true;
		}
		if (pathname === '/api/account/me' && method === 'GET') {
			const session = requireSession(request);
			return withCookies(response, [], 200, store.account({ session })), true;
		}
		if (pathname === '/api/account/profile' && method === 'POST') {
			const session = requireSession(request);
			const payload = await readJson(request);
			return withCookies(response, [], 200, { user: store.updateProfile({ session, nickname: payload.nickname, notifyProgress: payload.notify_progress }) }), true;
		}
		if (pathname === '/api/account/email/change/start' && method === 'POST') {
			const session = requireSession(request);
			return withCookies(response, [], 200, { ok: true, ...(await store.requestEmailChange({ session, ip: address })) }), true;
		}
		if (pathname === '/api/account/email/change/verify-old' && method === 'POST') {
			const session = requireSession(request);
			const payload = await readJson(request);
			return withCookies(response, [], 200, store.verifyEmailChange({ session, ticket: payload.ticket, code: payload.code })), true;
		}
		if (pathname === '/api/account/email/change/verify-new' && method === 'POST') {
			const session = requireSession(request);
			const payload = await readJson(request);
			return withCookies(response, [], 200, await store.requestEmailChangeConfirm({
				changeTicket: payload.change_ticket, userId: session.user.id, email: payload.email, ip: address,
			})), true;
		}
		if (pathname === '/api/account/email/change/confirm' && method === 'POST') {
			const session = requireSession(request);
			const payload = await readJson(request);
			const result = store.confirmEmailChange({
				changeTicket: payload.change_ticket, userId: session.user.id, code: payload.code,
			});
			await store.notifyEmailChanged({ oldEmail: result.old_email, newEmail: result.new_email });
			return withCookies(response, [clearedCookie(secureCookies)], 200, result), true;
		}
		if (pathname === '/api/account/logout' && method === 'POST') {
			const session = requireSession(request);
			store.signOut({ session });
			return withCookies(response, [clearedCookie(secureCookies)], 200, { ok: true }), true;
		}
		if (pathname === '/api/account/logout-all' && method === 'POST') {
			const session = requireSession(request);
			const result = store.signOutAll({ session });
			return withCookies(response, [clearedCookie(secureCookies)], 200, result), true;
		}
		if (pathname === '/api/account/favorites' && method === 'GET') {
			const session = requireSession(request);
			return withCookies(response, [], 200, { items: store.listFavorites({ session }) }), true;
		}
		if (pathname === '/api/account/favorites' && method === 'POST') {
			const session = requireSession(request);
			const payload = await readJson(request);
			return withCookies(response, [], 200, store.toggleFavorite({ session, itemId: payload.item_id, action: payload.action === 'remove' ? 'remove' : 'add' })), true;
		}
		if (pathname === '/api/account/requests' && method === 'GET') {
			const session = requireSession(request);
			return withCookies(response, [], 200, { requests: store.listRequests({ session }) }), true;
		}
		if (pathname === '/api/account/requests' && method === 'POST') {
			const session = requireSession(request);
			const payload = await readJson(request);
			const result = store.createRequest({ session, kind: payload.kind });
			return withCookies(response, result.signed_out ? [clearedCookie(secureCookies)] : [], 200, result), true;
		}

		// ---------- 账户投稿 ----------
		// 与免注册投稿共用同一个私密收件区、同一套人工审核与发布门禁；这里只增加归属账号、草稿与申请。
		if (pathname === '/api/account/submissions' && method === 'GET') {
			const session = requireSession(request);
			const instances = requireSubmissionStore();
			return withCookies(response, [], 200, { items: await instances.listAccountSubmissions({ accountId: session.user.id }), quota: await instances.accountUsage(session.user.id) }), true;
		}
		if (pathname === '/api/account/submissions' && method === 'POST') {
			if (!uploadsOpen) fail('新投稿暂时暂停接收，已有投稿仍可查看和撤回。', 503);
			const session = requireSession(request);
			const instances = requireSubmissionStore();
			const form = await readSubmissionForm(request, maximumUploadBytes);
			const mode = form.mode === 'pending' ? 'pending' : 'draft';
			return withCookies(response, [], 200, await instances.createAccountSubmission({
				accountId: session.user.id, mode, payload: accountPayloadFromForm(form),
			})), true;
		}
		if (pathname === '/api/account/submissions/claim' && method === 'POST') {
			const session = requireSession(request);
			const instances = requireSubmissionStore();
			const payload = await readJson(request);
			return withCookies(response, [], 200, await instances.claimSubmission({
				id: String(payload.id ?? '').trim().toUpperCase(),
				key: String(payload.key ?? '').trim(),
				accountId: session.user.id,
			})), true;
		}
		const submissionImageRoute = /^\/api\/account\/submissions\/(TG-[A-F0-9]{24})\/images\/([A-Za-z0-9._-]+)$/.exec(pathname);
		if (submissionImageRoute && method === 'GET') {
			const session = requireSession(request);
			const instances = requireSubmissionStore();
			const image = await instances.getAccountImage({ id: submissionImageRoute[1], accountId: session.user.id, filename: submissionImageRoute[2] });
			response.writeHead(200, {
				...securityHeaders(),
				'Content-Type': 'image/jpeg',
				'Content-Length': String(image.length),
				'Cross-Origin-Resource-Policy': 'same-origin',
			});
			response.end(image);
			return true;
		}
		const submissionRoute = /^\/api\/account\/submissions\/(TG-[A-F0-9]{24})(?:\/(save|submit|withdraw|discard|request))?$/.exec(pathname);
		if (submissionRoute) {
			const session = requireSession(request);
			const instances = requireSubmissionStore();
			const [, submissionId, action] = submissionRoute;
			if (!action && method === 'GET') {
				return withCookies(response, [], 200, await instances.getAccountSubmission({ id: submissionId, accountId: session.user.id })), true;
			}
			if (action === 'save' && method === 'POST') {
				if (!uploadsOpen) fail('投稿编辑暂时暂停，已保存的内容仍可查看。', 503);
				const form = await readSubmissionForm(request, maximumUploadBytes);
				if (form.keep === undefined) fail('缺少原有图片清单，请刷新后重试。');
				return withCookies(response, [], 200, await instances.saveAccountSubmission({
					id: submissionId, accountId: session.user.id,
					revision: Number.parseInt(form.revision ?? '', 10),
					payload: accountPayloadFromForm(form),
				})), true;
			}
			if (method === 'POST' && ['submit', 'withdraw', 'discard', 'request'].includes(action)) {
				if (action === 'submit' && !uploadsOpen) fail('提交审核暂时暂停，草稿仍会保存。', 503);
				const payload = await readJson(request);
				if (action === 'submit') {
					return withCookies(response, [], 200, await instances.submitAccountSubmission({
						id: submissionId, accountId: session.user.id,
						revision: Number.parseInt(payload.revision ?? '', 10),
						payload: { consents: payload.consents, consent_version: payload.consent_version, website: payload.website },
					})), true;
				}
				if (action === 'withdraw') return withCookies(response, [], 200, await instances.withdrawAccountSubmission({ id: submissionId, accountId: session.user.id })), true;
				if (action === 'discard') return withCookies(response, [], 200, await instances.discardAccountSubmission({ id: submissionId, accountId: session.user.id })), true;
				return withCookies(response, [], 200, await instances.requestAccountChange({
					id: submissionId, accountId: session.user.id, kind: payload.kind, note: payload.note,
				})), true;
			}
			fail('不支持此操作。', 405);
		}
		fail('此地址不存在。', 404);
	}

	async function handleAdmin(request, response, pathname) {
		const method = request.method ?? 'GET';
		const mutation = method !== 'GET' && method !== 'HEAD';
		requireAdminOrigin(request, mutation);

		if (pathname === '/api/account-admin/summary' && method === 'GET') {
			return withCookies(response, [], 200, store.adminSummary()), true;
		}
		if (pathname === '/api/account-admin/users' && method === 'GET') {
			return withCookies(response, [], 200, { users: store.adminListUsers(), states: accountStates }), true;
		}
		const userRoute = /^\/api\/account-admin\/users\/(usr_[a-f0-9]{24})\/status$/.exec(pathname);
		if (userRoute && method === 'POST') {
			const payload = await readJson(request);
			return withCookies(response, [], 200, store.adminSetUserStatus({ userId: userRoute[1], status: payload.status, reason: payload.reason, actor: 'admin' })), true;
		}
		if (pathname === '/api/account-admin/requests' && method === 'GET') {
			return withCookies(response, [], 200, { requests: store.adminListRequests() }), true;
		}
		const requestRoute = /^\/api\/account-admin\/requests\/(REQ-[A-F0-9]{20})\/review$/.exec(pathname);
		if (requestRoute && method === 'POST') {
			const payload = await readJson(request);
			return withCookies(response, [], 200, store.adminReviewRequest({
				requestId: requestRoute[1],
				status: payload.status,
				publicMessage: payload.public_message,
				adminNote: payload.admin_note,
				actor: 'admin',
			})), true;
		}
		if (pathname === '/api/account-admin/audit' && method === 'GET') {
			return withCookies(response, [], 200, { entries: store.adminAudit(Number(new URL(request.url, origin).searchParams.get('limit') ?? 100)) }), true;
		}
		fail('此地址不存在。', 404);
	}
}

// ---------------------------------------------------------------------------
// 独立进程启动：node local-admin/account-server.mjs
// ---------------------------------------------------------------------------

const filePath = fileURLToPath(import.meta.url);
// 线上通过 app/current 这类软链启动，启动参数是软链路径而 import.meta.url 已是真实路径，
// 因此必须比较真实路径，否则会误判为"被 import"而直接退出。
const isDirectRun = (() => {
	if (!process.argv[1]) return false;
	try {
		return fs.realpathSync(process.argv[1]) === filePath;
	} catch {
		return path.resolve(process.argv[1]) === filePath;
	}
})();

if (isDirectRun) {
	const projectRoot = path.resolve(path.dirname(filePath), '..');
	const environment = (process.env.LJM_ACCOUNT_ENV ?? 'development').trim().toLowerCase();
	const port = Number.parseInt(process.env.LJM_ACCOUNT_PORT ?? '4175', 10);
	const origin = stripTrailingSlash(process.env.LJM_ACCOUNT_ORIGIN?.trim() || '');
	const adminOrigin = stripTrailingSlash(process.env.LJM_ADMIN_ORIGIN?.trim() || 'http://127.0.0.1:4173');
	const dataRoot = process.env.LJM_ACCOUNT_DATA_DIR?.trim();
	const transport = (process.env.LJM_MAIL_TRANSPORT ?? 'none').trim().toLowerCase();
	const publicRoots = [
		path.join(projectRoot, 'site'),
		path.join(projectRoot, 'public-assets'),
		path.join(projectRoot, 'local-admin', 'public'),
		process.env.LJM_PUBLIC_RELEASES_DIR?.trim(),
	].filter(Boolean).map((value) => path.resolve(value));

	const stop = (message) => {
		process.stderr.write(`${message}\n`);
		process.exit(1);
	};
	if (!origin) stop('必须显式配置 LJM_ACCOUNT_ORIGIN（公开网站来源地址）。');
	if (!['development', 'production'].includes(environment)) stop('LJM_ACCOUNT_ENV 只能是 development 或 production。');
	const switchValue = (name) => {
		const value = (process.env[name] ?? (environment === 'production' ? 'false' : 'true')).trim().toLowerCase();
		if (!['true', 'false'].includes(value)) stop(`${name} 只能是 true 或 false。`);
		return value === 'true';
	};
	const registrationOpen = switchValue('LJM_ACCOUNT_REGISTRATION_OPEN');
	const uploadsOpen = switchValue('LJM_ACCOUNT_UPLOADS_OPEN');
	if (!Number.isInteger(port) || port < 1024 || port > 65535) stop('LJM_ACCOUNT_PORT 无效。');
	if (!dataRoot || !path.isAbsolute(dataRoot)) stop('必须显式配置网站目录之外的 LJM_ACCOUNT_DATA_DIR 绝对路径。');
	const resolvedDataRoot = path.resolve(dataRoot);
	for (const publicRoot of publicRoots) {
		const relative = path.relative(publicRoot, resolvedDataRoot);
		if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative))) stop('账户私密目录不能位于公开目录内。');
	}
	if (environment === 'production' && transport !== 'https') {
		stop('生产环境必须使用正式邮件通道（LJM_MAIL_TRANSPORT=https）。');
	}

	const mailer = createMailer({
		transport,
		environment,
		directory: path.join(resolvedDataRoot, 'mail-outbox'),
		endpoint: process.env.LJM_MAIL_API_ENDPOINT?.trim() || '',
		apiKey: process.env.LJM_MAIL_API_KEY?.trim() || '',
		from: process.env.LJM_MAIL_FROM?.trim() || '',
	});
	const store = createAccountStore({
		directory: resolvedDataRoot,
		mailer,
		environment,
		ipSalt: process.env.LJM_ACCOUNT_IP_SALT?.trim() || '',
	});
	// 私密收件区与账户数据同属私密资料，同样不能落在公开目录内。
	const siteDirectory = path.resolve(process.env.LJM_SITE_DIR?.trim() || path.join(projectRoot, 'site'));
	const submissionRoot = path.resolve(process.env.LJM_SUBMISSION_DATA_DIR?.trim() || path.join(resolvedDataRoot, 'submissions'));
	for (const publicRoot of publicRoots) {
		const relative = path.relative(publicRoot, submissionRoot);
		if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative))) stop('私密投稿目录不能位于公开目录内。');
	}
	// 进度通知：只在投稿人主动开启通知偏好时发送；发送失败只记录，不回退审核结果。
	const notifier = async ({ accountId, event, title }) => {
		const recipient = store.notificationRecipient(accountId);
		if (!recipient) return;
		try {
			await mailer.send({ to: recipient.email, template: 'submission-progress', variables: { event, title } });
			store.recordNotification({ accountId, template: 'submission-progress', status: 'sent' });
		} catch (error) {
			store.recordNotification({ accountId, template: 'submission-progress', status: 'failed', error: error instanceof Error ? error.message : String(error) });
		}
	};
	const submissionStore = createSubmissionStore({ root: submissionRoot, siteDirectory, notifier });
	const handler = createAccountHandler({
		store,
		submissionStore,
		origin,
		adminOrigin,
		local: environment !== 'production',
		trustProxy: true,
		secureCookies: environment === 'production',
		registrationOpen,
		uploadsOpen,
	});
	const server = http.createServer(async (request, response) => {
		try {
			const pathname = new URL(request.url ?? '/', origin).pathname;
			if (pathname === '/healthz' && request.method === 'GET') {
				response.writeHead(200, securityHeaders()).end(JSON.stringify({ ok: true }));
				return;
			}
			if (!await handler(request, response, pathname)) {
				response.writeHead(404, securityHeaders()).end(JSON.stringify({ error: '此地址不存在。' }));
			}
		} catch {
			if (!response.headersSent) response.writeHead(500, securityHeaders()).end(JSON.stringify({ error: '暂时无法完成操作。' }));
			else response.end();
		}
	});
	server.requestTimeout = 30_000;
	server.headersTimeout = 15_000;
	server.maxConnections = 60;
	let processingNotifications = false;
	const flushNotifications = async () => {
		if (processingNotifications) return;
		processingNotifications = true;
		try {
			await processProgressNotifications(submissionRoot, {
				recipientFor: accountId => store.notificationRecipient(accountId),
				send: payload => mailer.send(payload),
				record: event => store.recordNotification(event),
			});
		} catch (error) { console.error('进度提醒队列处理失败：', error instanceof Error ? error.message : String(error)); }
		finally { processingNotifications = false; }
	};
	const notificationTimer = setInterval(() => { void flushNotifications(); }, 30_000);
	void flushNotifications();
	server.listen(port, '127.0.0.1', () => {
		console.log(`账户服务已启动：127.0.0.1:${port}（${environment}，邮件通道：${mailer.describe().transport}，协议版本：${agreementVersion}）`);
	});
	for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
		clearInterval(notificationTimer);
		server.close();
		store.close();
	});
}
