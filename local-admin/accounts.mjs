// 账户业务数据层：账号、会话、验证码、收藏、导出与注销申请、邮件事件、审计与限流。
//
// 边界（与 AGENTS.md 和阶段二方案一致）：
// - 只使用 Node 内置 node:sqlite 与 node:crypto，不引入任何数据库驱动或第三方依赖。
// - 只读写自己的私密数据目录；不接触 archive-data、drafts、history、recycle-bin、site/ 与公开素材目录。
// - 账号业务数据与档案 core / metadata / public_view 完全分开；账号编号、投稿 TG- 编号、档案 LJM- 编号彼此独立。
// - 验证码只存不可逆摘要；会话令牌只存摘要；邮箱与来源地址只存用于限流聚合的摘要。

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';

export const accountLimits = Object.freeze({
	codeLength: 6,
	codeTtlSeconds: 600,
	codeResendSeconds: 60,
	codeMaxAttempts: 5,
	sessionIdleSeconds: 7 * 24 * 3600,
	sessionAbsoluteSeconds: 30 * 24 * 3600,
	emailPerHour: 5,
	ipPerHour: 20,
	siteMailPerDay: 500,
	favoritesMax: 1000,
	onboardingTtlSeconds: 1800,
	changeTokenTtlSeconds: 1800,
	requestsPerUserPerDay: 5,
	nicknameMaxLength: 24,
});

export const agreementVersion = '2026-09-27-v1';

export const requestKinds = Object.freeze({ export: '数据导出申请', deletion: '账号注销申请', unsuspend: '账号恢复申诉' });
export const requestStates = Object.freeze({ received: '已收到申请', processing: '处理中', done: '已完成', rejected: '未通过' });
export const accountStates = Object.freeze({ active: '正常', suspended: '已暂停', pending_deletion: '注销处理中' });

export class AccountError extends Error {
	constructor(message, statusCode = 400) {
		super(message);
		this.name = 'AccountError';
		this.statusCode = statusCode;
	}
}

const fail = (message, status = 400) => {
	throw new AccountError(message, status);
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[a-z0-9-]+$/i;
const itemIdPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const tokenPattern = /^[a-f0-9]{64}$/;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const iso = (date) => date.toISOString();
const addSeconds = (date, seconds) => new Date(date.getTime() + seconds * 1000);
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
const equalDigest = (left, right) => {
	const a = Buffer.from(String(left), 'utf8');
	const b = Buffer.from(String(right), 'utf8');
	return a.length === b.length && timingSafeEqual(a, b);
};

const schema = [
	`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		nickname TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'active',
		agreement_version TEXT NOT NULL DEFAULT '',
		agreement_accepted_at TEXT NOT NULL DEFAULT '',
		notify_progress INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		last_login_at TEXT NOT NULL DEFAULT '',
		suspended_at TEXT NOT NULL DEFAULT '',
		suspended_reason TEXT NOT NULL DEFAULT ''
	)`,
	`CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		token_hash TEXT NOT NULL UNIQUE,
		created_at TEXT NOT NULL,
		last_seen_at TEXT NOT NULL,
		idle_expires_at TEXT NOT NULL,
		absolute_expires_at TEXT NOT NULL,
		revoked_at TEXT NOT NULL DEFAULT '',
		revoked_reason TEXT NOT NULL DEFAULT '',
		client_hash TEXT NOT NULL DEFAULT ''
	)`,
	`CREATE TABLE IF NOT EXISTS verification_codes (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL,
		purpose TEXT NOT NULL,
		code_hash TEXT NOT NULL,
		salt TEXT NOT NULL,
		ticket TEXT NOT NULL,
		attempts INTEGER NOT NULL DEFAULT 0,
		max_attempts INTEGER NOT NULL,
		created_at TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		consumed_at TEXT NOT NULL DEFAULT '',
		request_ip_hash TEXT NOT NULL DEFAULT ''
	)`,
	`CREATE TABLE IF NOT EXISTS tickets (
		id TEXT PRIMARY KEY,
		kind TEXT NOT NULL,
		user_id TEXT NOT NULL DEFAULT '',
		email TEXT NOT NULL DEFAULT '',
		payload TEXT NOT NULL DEFAULT '{}',
		created_at TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		consumed_at TEXT NOT NULL DEFAULT ''
	)`,
	`CREATE TABLE IF NOT EXISTS favorites (
		user_id TEXT NOT NULL,
		item_id TEXT NOT NULL,
		created_at TEXT NOT NULL,
		PRIMARY KEY (user_id, item_id)
	)`,
	`CREATE TABLE IF NOT EXISTS requests (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		kind TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'received',
		public_message TEXT NOT NULL DEFAULT '',
		admin_note TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS mail_events (
		id TEXT PRIMARY KEY,
		to_hash TEXT NOT NULL,
		template TEXT NOT NULL,
		status TEXT NOT NULL,
		provider_id TEXT NOT NULL DEFAULT '',
		error TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS audit_log (
		id TEXT PRIMARY KEY,
		at TEXT NOT NULL,
		actor TEXT NOT NULL,
		action TEXT NOT NULL,
		target TEXT NOT NULL DEFAULT '',
		detail TEXT NOT NULL DEFAULT ''
	)`,
	`CREATE TABLE IF NOT EXISTS rate_limits (
		bucket TEXT PRIMARY KEY,
		window_start TEXT NOT NULL,
		count INTEGER NOT NULL,
		blocked_until TEXT NOT NULL DEFAULT ''
	)`,
	`CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
	`CREATE INDEX IF NOT EXISTS codes_email_purpose ON verification_codes (email, purpose)`,
	`CREATE INDEX IF NOT EXISTS favorites_user ON favorites (user_id)`,
	`CREATE INDEX IF NOT EXISTS requests_user ON requests (user_id)`,
];

/**
 * 只读读取器：供管理端在本机查询账号昵称与状态，不需要经过网络接口，也不会修改任何数据。
 * 账户服务未启动或数据库尚不存在时返回 null，调用方应降级显示。
 */
export function createAccountReader({ directory }) {
	if (!directory || !path.isAbsolute(directory)) return null;
	const databaseFile = path.join(directory, 'accounts.db');
	if (!fs.existsSync(databaseFile)) return null;
	let database;
	try {
		database = new DatabaseSync(databaseFile, { readOnly: true });
		database.exec('PRAGMA busy_timeout = 3000');
	} catch {
		return null;
	}
	return {
		listUsers: () => {
			try {
				return database.prepare('SELECT id, nickname, status FROM users').all()
					.map((row) => ({ id: row.id, nickname: row.nickname, status: row.status, status_label: accountStates[row.status] ?? row.status }));
			} catch {
				return [];
			}
		},
		close: () => database.close(),
	};
}

/**
 * 建立账户数据层。
 * @param {object} options
 * @param {string} options.directory 私密数据目录（会自动创建）
 * @param {object} options.mailer 邮件发送器，需提供 send({ to, template, variables })
 * @param {string} [options.environment] development | production，生产环境会拒绝测试投递通道
 * @param {string} [options.ipSalt] 来源地址摘要用的盐；缺失时用随机盐并落盘保存
 * @param {Function} [options.now] 取当前时间，便于测试注入
 */
export function createAccountStore({ directory, mailer, environment = 'development', ipSalt = '', now = () => new Date() }) {
	if (!directory || !path.isAbsolute(directory)) fail('账户数据目录必须是绝对路径。');
	if (!mailer || typeof mailer.send !== 'function') fail('必须提供邮件发送器。');
	if (!['development', 'production'].includes(environment)) fail('运行环境只能是 development 或 production。');
	fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
	const databaseFile = path.join(directory, 'accounts.db');
	const saltFile = path.join(directory, '.ip-salt');
	let salt = ipSalt;
	if (!salt) {
		try {
			salt = fs.readFileSync(saltFile, 'utf8').trim();
		} catch {
			salt = randomBytes(32).toString('hex');
			fs.writeFileSync(saltFile, `${salt}\n`, { mode: 0o600 });
		}
	}
	const database = new DatabaseSync(databaseFile);
	database.exec('PRAGMA journal_mode = WAL');
	database.exec('PRAGMA foreign_keys = ON');
	database.exec('PRAGMA busy_timeout = 5000');
	for (const statement of schema) database.exec(statement);
	if (!database.prepare('SELECT version FROM schema_version LIMIT 1').get()) {
		database.prepare('INSERT INTO schema_version (version) VALUES (1)').run();
	}
	const schemaVersion = database.prepare('SELECT version FROM schema_version LIMIT 1').get().version;

	const run = (sql, ...parameters) => database.prepare(sql).run(...parameters);
	const one = (sql, ...parameters) => database.prepare(sql).get(...parameters) ?? null;
	const many = (sql, ...parameters) => database.prepare(sql).all(...parameters);
	const ipHashOf = (ip) => digest(`${salt}:${String(ip ?? 'unknown')}`).slice(0, 32);
	const audit = (actor, action, target = '', detail = '') => {
		run('INSERT INTO audit_log (id, at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)',
			randomUUID(), iso(now()), String(actor ?? ''), String(action), String(target), typeof detail === 'string' ? detail : JSON.stringify(detail));
	};
	const recordMail = (toHash, template, status, providerId = '', error = '') => {
		run('INSERT INTO mail_events (id, to_hash, template, status, provider_id, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			randomUUID(), toHash, template, status, providerId, error, iso(now()));
	};

	// 限流：同一桶在窗口内累计计数，超过上限则给出明确的等待时间。
	const consume = (bucket, maximum, windowSeconds) => {
		const current = now();
		const row = one('SELECT bucket, window_start, count, blocked_until FROM rate_limits WHERE bucket = ?', bucket);
		const windowStart = row ? new Date(row.window_start) : null;
		const expired = !row || windowStart.getTime() + windowSeconds * 1000 <= current.getTime();
		if (row && row.blocked_until && new Date(row.blocked_until).getTime() > current.getTime()) {
			return { allowed: false, retryAfter: Math.ceil((new Date(row.blocked_until).getTime() - current.getTime()) / 1000) };
		}
		const count = expired ? 1 : row.count + 1;
		const start = expired ? current : windowStart;
		if (count > maximum) {
			const blockedUntil = addSeconds(current, 60);
			run(`INSERT INTO rate_limits (bucket, window_start, count, blocked_until) VALUES (?, ?, ?, ?)
				ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, count = excluded.count, blocked_until = excluded.blocked_until`,
				bucket, iso(start), count, iso(blockedUntil));
			return { allowed: false, retryAfter: 60 };
		}
		run(`INSERT INTO rate_limits (bucket, window_start, count, blocked_until) VALUES (?, ?, ?, '')
			ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, count = excluded.count, blocked_until = ''`,
			bucket, iso(start), count);
		return { allowed: true, retryAfter: 0 };
	};
	const requireAllowed = (bucket, maximum, windowSeconds, message) => {
		const result = consume(bucket, maximum, windowSeconds);
		if (!result.allowed) fail(message ?? `操作太频繁，请在 ${Math.max(result.retryAfter, 1)} 秒后再试。`, 429);
	};

	const generateCode = () => {
		const value = randomInt(0, 10 ** accountLimits.codeLength);
		return String(value).padStart(accountLimits.codeLength, '0');
	};

	// 发送验证码：先落库再发信；发信失败时作废该验证码并如实报错，不产生虚假成功。
	const issueCode = async ({ email, purpose, ip }) => {
		if (!mailer.available) fail('登录服务暂时不可用，邮件通道尚未配置完成。', 503);
		const current = now();
		const code = generateCode();
		const saltHex = randomBytes(16).toString('hex');
		const id = randomUUID();
		const ticket = randomBytes(24).toString('hex');
		const toHash = digest(email).slice(0, 32);
		// 重发即作废旧码，但不清空累计滥用限制。
		run(`UPDATE verification_codes SET consumed_at = ? WHERE email = ? AND purpose = ? AND consumed_at = ''`, iso(current), email, purpose);
		run(`INSERT INTO verification_codes (id, email, purpose, code_hash, salt, ticket, attempts, max_attempts, created_at, expires_at, consumed_at, request_ip_hash)
			VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, '', ?)`,
			id, email, purpose, digest(`${saltHex}:${code}`), saltHex, ticket, accountLimits.codeMaxAttempts,
			iso(current), iso(addSeconds(current, accountLimits.codeTtlSeconds)), ipHashOf(ip));
		let delivered;
		try {
			delivered = await mailer.send({ to: email, template: 'login-code', variables: { code, minutes: Math.round(accountLimits.codeTtlSeconds / 60), purpose } });
		} catch (error) {
			run(`UPDATE verification_codes SET consumed_at = ? WHERE id = ?`, iso(current), id);
			recordMail(toHash, 'login-code', 'failed', '', String(error?.message ?? error).slice(0, 300));
			fail('验证码暂时无法发送，请稍后再试。', 503);
		}
		recordMail(toHash, 'login-code', 'sent', String(delivered?.id ?? '').slice(0, 120));
		return { ticket, retry_after: accountLimits.codeResendSeconds, expires_in: accountLimits.codeTtlSeconds };
	};

	// 校验验证码：过期、已用、尝试超限都给出区分清楚的提示；比对使用恒定时间比较。
	const verifyCode = ({ email, purpose, ticket, code }) => {
		const current = now();
		const row = one('SELECT * FROM verification_codes WHERE ticket = ?', String(ticket ?? ''));
		if (!row || row.email !== email || row.purpose !== purpose) fail('验证码不正确或已失效，请重新获取。');
		if (row.consumed_at) fail('验证码已使用，请重新获取。');
		if (new Date(row.expires_at).getTime() <= current.getTime()) fail('验证码已过期，请重新获取。');
		if (row.attempts >= row.max_attempts) fail('验证码尝试次数过多，请重新获取。', 429);
		const submitted = String(code ?? '').trim();
		if (!new RegExp(`^\\d{${accountLimits.codeLength}}$`).test(submitted)) {
			run('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?', row.id);
			fail('请输入收到的验证码。');
		}
		if (!equalDigest(row.code_hash, digest(`${row.salt}:${submitted}`))) {
			run('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?', row.id);
			const left = row.max_attempts - row.attempts - 1;
			fail(left > 0 ? `验证码不正确，还可以尝试 ${left} 次。` : '验证码尝试次数过多，请重新获取。', left > 0 ? 400 : 429);
		}
		const consumed = run('UPDATE verification_codes SET consumed_at = ?, attempts = attempts + 1 WHERE id = ? AND consumed_at = \'\'', iso(current), row.id);
		if (consumed.changes !== 1) fail('验证码已使用，请重新获取。');
		return true;
	};

	// 一次性票据：票据编号本身就是不可猜测的随机值，只用于开通与换邮箱的跨步骤衔接。
	const createTicket = ({ kind, userId = '', email = '', payload = {}, ttlSeconds = accountLimits.onboardingTtlSeconds }) => {
		const current = now();
		const ticket = randomBytes(32).toString('hex');
		run(`INSERT INTO tickets (id, kind, user_id, email, payload, created_at, expires_at, consumed_at) VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
			ticket, kind, userId, email, JSON.stringify(payload), iso(current), iso(addSeconds(current, ttlSeconds)));
		return ticket;
	};
	const readTicket = ({ kind, ticket }) => {
		const current = now();
		const row = one('SELECT * FROM tickets WHERE id = ?', String(ticket ?? ''));
		if (!row || row.kind !== kind || row.consumed_at) fail('本次验证已失效，请重新开始。');
		if (new Date(row.expires_at).getTime() <= current.getTime()) fail('本次验证已超时，请重新开始。');
		return { ...row, payload: JSON.parse(row.payload || '{}') };
	};
	const consumeTicket = ({ kind, ticket }) => {
		const row = readTicket({ kind, ticket });
		const changed = run(`UPDATE tickets SET consumed_at = ? WHERE id = ? AND consumed_at = ''`, iso(now()), row.id).changes;
		if (changed !== 1) fail('本次验证已失效，请重新开始。');
		return row;
	};

	const publicUser = (row) => ({
		id: row.id,
		nickname: row.nickname,
		email: row.email,
		status: row.status,
		status_label: accountStates[row.status] ?? row.status,
		notify_progress: Boolean(row.notify_progress),
		agreement_version: row.agreement_version,
		created_at: row.created_at,
	});
	const defaultNickname = (email) => {
		// 默认昵称不含邮箱信息，也不能从邮箱推导。
		const suffix = createHash('sha256').update(`${email}:${randomBytes(8).toString('hex')}`).digest('hex').slice(0, 6);
		return `读者${suffix}`;
	};
	const cleanNickname = (value, fallback) => {
		const nickname = String(value ?? '').trim();
		if (!nickname) return fallback;
		if (nickname.length > accountLimits.nicknameMaxLength) fail(`昵称请控制在 ${accountLimits.nicknameMaxLength} 字以内。`);
		if (/[\u0000-\u001f<>]/.test(nickname)) fail('昵称不能包含特殊符号。');
		return nickname;
	};

	const createSession = ({ userId, client }) => {
		const current = now();
		const token = randomBytes(32).toString('hex');
		run(`INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, idle_expires_at, absolute_expires_at, revoked_at, revoked_reason, client_hash)
			VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?)`,
			randomUUID(), userId, digest(token), iso(current), iso(current),
			iso(addSeconds(current, accountLimits.sessionIdleSeconds)), iso(addSeconds(current, accountLimits.sessionAbsoluteSeconds)),
			client ? digest(String(client)).slice(0, 32) : '');
		return token;
	};

	const resolveSession = (token) => {
		if (!tokenPattern.test(String(token ?? ''))) return null;
		const current = now();
		const row = one(`SELECT s.*, u.email AS user_email, u.nickname AS user_nickname, u.status AS user_status,
			u.notify_progress AS user_notify, u.agreement_version AS user_agreement, u.created_at AS user_created
			FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`, digest(String(token)));
		if (!row || row.revoked_at) return null;
		if (row.user_status !== 'active') {
			revokeSession(row.id, 'account_inactive');
			return null;
		}
		if (new Date(row.absolute_expires_at).getTime() <= current.getTime()) {
			run(`UPDATE sessions SET revoked_at = ?, revoked_reason = 'absolute_expired' WHERE id = ?`, iso(current), row.id);
			return null;
		}
		if (new Date(row.idle_expires_at).getTime() <= current.getTime()) {
			run(`UPDATE sessions SET revoked_at = ?, revoked_reason = 'idle_expired' WHERE id = ?`, iso(current), row.id);
			return null;
		}
		run('UPDATE sessions SET last_seen_at = ?, idle_expires_at = ? WHERE id = ?',
			iso(current), iso(addSeconds(current, accountLimits.sessionIdleSeconds)), row.id);
		const user = one('SELECT * FROM users WHERE id = ?', row.user_id);
		if (!user) return null;
		// 统一布尔类型，避免调用方拿到 SQLite 的 0/1 后判断不一致。
		const normalized = { ...user, notify_progress: Boolean(user.notify_progress) };
		return { session_id: row.id, token, user: normalized, public: publicUser(normalized), session_created_at: row.created_at };
	};

	const revokeSession = (sessionId, reason) => run(`UPDATE sessions SET revoked_at = ?, revoked_reason = ? WHERE id = ? AND revoked_at = ''`, iso(now()), reason, sessionId);
	const revokeAllSessions = (userId, reason) => run(`UPDATE sessions SET revoked_at = ?, revoked_reason = ? WHERE user_id = ? AND revoked_at = ''`, iso(now()), reason, userId).changes;

	const activeSessionCount = (userId) => one(`SELECT COUNT(*) AS total FROM sessions WHERE user_id = ? AND revoked_at = '' AND absolute_expires_at > ?`, userId, iso(now())).total;

	const requireMailer = () => {
		if (!mailer.available) fail('登录服务暂时不可用，邮件通道尚未配置完成。', 503);
	};

	return {
		schemaVersion,
		databaseFile,
		close: () => database.close(),
		environment,

		// 通道可用性：未配置邮件时前端必须显示"服务不可用"，不能假装成功。
		status: () => ({
			available: Boolean(mailer.available),
			environment,
			agreement_version: agreementVersion,
			limits: {
				code_length: accountLimits.codeLength,
				code_ttl_seconds: accountLimits.codeTtlSeconds,
				resend_seconds: accountLimits.codeResendSeconds,
				max_attempts: accountLimits.codeMaxAttempts,
				nickname_max_length: accountLimits.nicknameMaxLength,
			},
		}),

		// 请求登录验证码。无论邮箱是否已注册，成功路径的返回完全一致。
		async requestLoginCode({ email, ip }) {
			const normalized = normalizeEmail(email);
			if (!emailPattern.test(normalized) || normalized.length > 160) fail('请输入正确的邮箱地址。');
			requireMailer();
			requireAllowed(`code:email:${digest(normalized).slice(0, 32)}`, accountLimits.emailPerHour, 3600, '该邮箱请求验证码过于频繁，请稍后再试。');
			requireAllowed(`code:ip:${ipHashOf(ip)}`, accountLimits.ipPerHour, 3600, '当前网络请求验证码过于频繁，请稍后再试。');
			requireAllowed(`mail:site:${iso(now()).slice(0, 10)}`, accountLimits.siteMailPerDay, 24 * 3600, '今日邮件额度已用完，请稍后再试。');
			const previous = one(`SELECT created_at FROM verification_codes WHERE email = ? AND purpose = 'login' ORDER BY created_at DESC LIMIT 1`, normalized);
			if (previous) {
				const wait = accountLimits.codeResendSeconds - Math.floor((now().getTime() - new Date(previous.created_at).getTime()) / 1000);
				if (wait > 0) fail(`请等待 ${wait} 秒后再重新发送验证码。`, 429);
			}
			const result = await issueCode({ email: normalized, purpose: 'login', ip });
			audit('system', 'code_requested', digest(normalized).slice(0, 12), { purpose: 'login' });
			return result;
		},

		// 校验登录验证码：已有账号直接登录并下发会话；新邮箱返回一次性开通票据。
		async verifyLoginCode({ email, ticket, code, client, ip }) {
			const normalized = normalizeEmail(email);
			if (!emailPattern.test(normalized)) fail('请输入正确的邮箱地址。');
			verifyCode({ email: normalized, purpose: 'login', ticket, code });
			const user = one('SELECT * FROM users WHERE email = ?', normalized);
			if (!user) {
				const ticket = createTicket({ kind: 'onboarding', email: normalized });
				audit('system', 'onboarding_started', digest(normalized).slice(0, 12));
				return { state: 'onboarding', onboarding_ticket: ticket, email: normalized };
			}
			if (user.status !== 'active') {
				audit('system', 'login_blocked_suspended', user.id);
				fail(user.status === 'suspended'
					? '该账号已暂停使用。你可以通过联系入口申请恢复或申请数据导出与注销。'
					: '该账号正在处理注销，暂时无法登录。如需帮助，请通过联系入口告知站主。', 403);
			}
			const token = createSession({ userId: user.id, client });
			run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', iso(now()), iso(now()), user.id);
			audit('user', 'signed_in', user.id, { ip: ipHashOf(ip) });
			return { state: 'signed_in', token, user: publicUser(user) };
		},

		// 首次开通：必须主动同意协议，记录协议版本与同意时间；昵称可留空使用默认昵称。
		async completeOnboarding({ onboardingTicket, agreement, agreed, nickname, client, ip }) {
			if (agreed !== true) fail('请先阅读并主动同意服务与隐私说明。');
			if (agreement !== agreementVersion) fail('协议版本已更新，请刷新页面后重新阅读。');
			const pending = readTicket({ kind: 'onboarding', ticket: onboardingTicket });
			const chosenNickname = cleanNickname(nickname, defaultNickname(pending.email));
			const ticket = consumeTicket({ kind: 'onboarding', ticket: onboardingTicket });
			const email = normalizeEmail(ticket.email);
			if (one('SELECT id FROM users WHERE email = ?', email)) fail('该邮箱已经开通账号，请直接登录。', 409);
			const current = now();
			const user = {
				id: `usr_${randomBytes(12).toString('hex')}`,
				email,
				nickname: chosenNickname,
			};
			run(`INSERT INTO users (id, email, nickname, status, agreement_version, agreement_accepted_at, notify_progress, created_at, updated_at, last_login_at, suspended_at, suspended_reason)
				VALUES (?, ?, ?, 'active', ?, ?, 0, ?, ?, ?, '', '')`,
				user.id, user.email, user.nickname, agreementVersion, iso(current), iso(current), iso(current), iso(current));
			const sessionToken = createSession({ userId: user.id, client });
			audit('user', 'account_created', user.id, { ip: ipHashOf(ip), agreement: agreementVersion });
			return { token: sessionToken, user: publicUser(one('SELECT * FROM users WHERE id = ?', user.id)) };
		},

		// 会话解析：每次请求都重新向服务器确认，Cookie 只是凭证，不是权限来源。
		resolveSession,
		signOut({ session }) {
			revokeSession(session.session_id, 'logout');
			audit('user', 'signed_out', session.user.id);
			return { ok: true };
		},
		signOutAll({ session }) {
			const total = revokeAllSessions(session.user.id, 'logout_all');
			audit('user', 'signed_out_all', session.user.id, { revoked: total });
			return { ok: true, revoked: total };
		},
		account({ session }) {
			const favorites = one('SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?', session.user.id).total;
			const requests = many('SELECT id, kind, status, created_at, updated_at FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', session.user.id);
			return {
				user: session.public,
				favorites_count: favorites,
				active_sessions: activeSessionCount(session.user.id),
				requests: requests.map((row) => ({ ...row, kind_label: requestKinds[row.kind] ?? row.kind, status_label: requestStates[row.status] ?? row.status })),
			};
		},
		updateProfile({ session, nickname, notifyProgress }) {
			const current = now();
			if (nickname !== undefined) {
				const clean = cleanNickname(nickname, session.user.nickname);
				run('UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?', clean, iso(current), session.user.id);
				audit('user', 'nickname_changed', session.user.id);
			}
			if (notifyProgress !== undefined) {
				run('UPDATE users SET notify_progress = ?, updated_at = ? WHERE id = ?', notifyProgress ? 1 : 0, iso(current), session.user.id);
				audit('user', 'notify_preference_changed', session.user.id, { notify_progress: Boolean(notifyProgress) });
			}
			return publicUser(one('SELECT * FROM users WHERE id = ?', session.user.id));
		},

		// 更换邮箱第一步：向当前邮箱发码。
		async requestEmailChange({ session, ip }) {
			requireMailer();
			const email = normalizeEmail(session.user.email);
			requireAllowed(`change:email:${digest(email).slice(0, 32)}`, accountLimits.emailPerHour, 3600, '该邮箱请求验证码过于频繁，请稍后再试。');
			requireAllowed(`mail:site:${iso(now()).slice(0, 10)}`, accountLimits.siteMailPerDay, 24 * 3600, '今日邮件额度已用完，请稍后再试。');
			const previous = one(`SELECT created_at FROM verification_codes WHERE email = ? AND purpose = 'email_change_old' ORDER BY created_at DESC LIMIT 1`, email);
			if (previous) {
				const wait = accountLimits.codeResendSeconds - Math.floor((now().getTime() - new Date(previous.created_at).getTime()) / 1000);
				if (wait > 0) fail(`请等待 ${wait} 秒后再重新发送验证码。`, 429);
			}
			return issueCode({ email, purpose: 'email_change_old', ip });
		},
		verifyEmailChange({ session, ticket, code }) {
			const email = normalizeEmail(session.user.email);
			verifyCode({ email, purpose: 'email_change_old', ticket, code });
			const changeTicket = createTicket({ kind: 'email_change', userId: session.user.id, email, ttlSeconds: accountLimits.changeTokenTtlSeconds });
			audit('user', 'email_change_old_verified', session.user.id);
			return { change_ticket: changeTicket };
		},
		// 更换邮箱第二步：向新邮箱发码；新邮箱已被占用时明确提示冲突。
		async requestEmailChangeConfirm({ changeTicket, userId, email, ip }) {
			requireMailer();
			const ticket = readTicket({ kind: 'email_change', ticket: changeTicket });
			// 换邮箱票据必须属于当前登录账号，避免凭证在账号之间串用。
			if (!userId || ticket.user_id !== userId) fail('本次验证已失效，请重新开始。');
			const normalized = normalizeEmail(email);
			if (!emailPattern.test(normalized) || normalized.length > 160) fail('请输入正确的新邮箱地址。');
			if (normalized === normalizeEmail(ticket.email)) fail('新邮箱与当前邮箱相同，不需要更换。');
			if (one('SELECT id FROM users WHERE email = ?', normalized)) fail('该邮箱已经绑定其他账号，请更换另一个邮箱。', 409);
			requireAllowed(`mail:site:${iso(now()).slice(0, 10)}`, accountLimits.siteMailPerDay, 24 * 3600, '今日邮件额度已用完，请稍后再试。');
			const issued = await issueCode({ email: normalized, purpose: 'email_change_new', ip });
			consumeTicket({ kind: 'email_change', ticket: changeTicket });
			const nextTicket = createTicket({
				kind: 'email_change_new',
				userId: ticket.user_id,
				email: normalized,
				payload: { old_email: ticket.email, code_ticket: issued.ticket },
				ttlSeconds: accountLimits.changeTokenTtlSeconds,
			});
			return { change_ticket: nextTicket, retry_after: issued.retry_after };
		},
		confirmEmailChange({ changeTicket, userId, code }) {
			const ticket = readTicket({ kind: 'email_change_new', ticket: changeTicket });
			if (!userId || ticket.user_id !== userId) fail('本次验证已失效，请重新开始。');
			const oldEmail = normalizeEmail(ticket.payload.old_email);
			const user = one('SELECT email FROM users WHERE id = ?', userId);
			if (!user || normalizeEmail(user.email) !== oldEmail) fail('账号邮箱已变化，请重新开始更换流程。', 409);
			if (one('SELECT id FROM users WHERE email = ?', normalizeEmail(ticket.email))) fail('该邮箱已经绑定其他账号，请更换另一个邮箱。', 409);
			verifyCode({ email: normalizeEmail(ticket.email), purpose: 'email_change_new', ticket: ticket.payload.code_ticket, code });
			consumeTicket({ kind: 'email_change_new', ticket: changeTicket });
			const current = now();
			run('UPDATE users SET email = ?, updated_at = ? WHERE id = ?', normalizeEmail(ticket.email), iso(current), ticket.user_id);
			// 邮箱变更属于敏感操作：撤销全部旧会话，原邮箱收到通知。
			revokeAllSessions(ticket.user_id, 'email_changed');
			audit('user', 'email_changed', ticket.user_id);
			return { ok: true, old_email: oldEmail, new_email: normalizeEmail(ticket.email) };
		},
		async notifyEmailChanged({ oldEmail, newEmail }) {
			try {
				const delivery = await mailer.send({ to: oldEmail, template: 'email-changed-notice', variables: { newEmail } });
				recordMail(digest(oldEmail).slice(0, 32), 'email-changed-notice', 'sent', String(delivery?.id ?? '').slice(0, 120));
			} catch (error) {
				recordMail(digest(oldEmail).slice(0, 32), 'email-changed-notice', 'failed', '', String(error?.message ?? error).slice(0, 300));
			}
		},

		listFavorites({ session }) {
			return many('SELECT item_id, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC', session.user.id)
				.map((row) => ({ item_id: row.item_id, created_at: row.created_at }));
		},
		toggleFavorite({ session, itemId, action }) {
			const id = String(itemId ?? '').trim();
			if (!itemIdPattern.test(id)) fail('档案编号格式不正确。', 400);
			const exists = one('SELECT 1 AS present FROM favorites WHERE user_id = ? AND item_id = ?', session.user.id, id);
			if (action === 'remove') {
				if (exists) {
					run('DELETE FROM favorites WHERE user_id = ? AND item_id = ?', session.user.id, id);
					audit('user', 'favorite_removed', session.user.id, { item_id: id });
				}
				return { item_id: id, favorited: false };
			}
			if (exists) return { item_id: id, favorited: true, repeated: true };
			const total = one('SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?', session.user.id).total;
			if (total >= accountLimits.favoritesMax) fail(`收藏数量已达上限（${accountLimits.favoritesMax} 件），请先取消部分收藏。`, 429);
			run('INSERT INTO favorites (user_id, item_id, created_at) VALUES (?, ?, ?)', session.user.id, id, iso(now()));
			audit('user', 'favorite_added', session.user.id, { item_id: id });
			return { item_id: id, favorited: true };
		},

		// 导出与注销申请：人工受理，系统只负责可靠记录、回执与可见状态。
		createRequest({ session, kind }) {
			if (!Object.hasOwn(requestKinds, kind) || kind === 'unsuspend') fail('不支持这种申请类型。');
			// 方案 D.7：注销、导出等敏感操作要求近期重新验证，防止被借用的长期会话被滥用。
			const recentLimit = 30 * 60 * 1000;
			const sessionAge = now().getTime() - new Date(session.session_created_at ?? 0).getTime();
			if (!session.session_created_at || sessionAge > recentLimit) {
				fail('为了账号安全，请先退出并重新登录，然后再提交这类申请。', 403);
			}
			requireAllowed(`request:user:${session.user.id}`, accountLimits.requestsPerUserPerDay, 24 * 3600, '今天提交的申请过多，请稍后再试。');
			const pending = one(`SELECT * FROM requests WHERE user_id = ? AND kind = ? AND status IN ('received', 'processing')`, session.user.id, kind);
			if (pending) {
				return { request: { id: pending.id, kind: pending.kind, status: pending.status, repeated: true }, signed_out: false };
			}
			const current = now();
			const id = `REQ-${randomBytes(10).toString('hex').toUpperCase()}`;
			run(`INSERT INTO requests (id, user_id, kind, status, public_message, admin_note, created_at, updated_at) VALUES (?, ?, ?, 'received', '', '', ?, ?)`,
				id, session.user.id, kind, iso(current), iso(current));
			// 注销申请：收到即撤销全部会话、停止新投稿；公开档案默认不随注销自动删除。
			let signedOut = false;
			if (kind === 'deletion') {
				run(`UPDATE users SET status = 'pending_deletion', updated_at = ? WHERE id = ?`, iso(current), session.user.id);
				revokeAllSessions(session.user.id, 'deletion_requested');
				signedOut = true;
			}
			audit('user', `request_${kind}`, session.user.id, { request_id: id });
			return { request: { id, kind, status: 'received', created_at: iso(current) }, signed_out: signedOut };
		},
		listRequests({ session }) {
			return many('SELECT id, kind, status, public_message, created_at, updated_at FROM requests WHERE user_id = ? ORDER BY created_at DESC', session.user.id)
				.map((row) => ({ ...row, kind_label: requestKinds[row.kind] ?? row.kind, status_label: requestStates[row.status] ?? row.status }));
		},

		// 投稿进度通知：只在用户主动开启通知偏好时返回收件人；注销处理中的账号不接收提醒。
		notificationRecipient(accountId) {
			const user = one('SELECT id, email, nickname, notify_progress, status FROM users WHERE id = ?', String(accountId ?? ''));
			if (!user || !user.notify_progress || user.status === 'pending_deletion') return null;
			return { email: user.email, nickname: user.nickname };
		},
		recordNotification({ accountId, template, status, error = '' }) {
			const user = one('SELECT email FROM users WHERE id = ?', String(accountId ?? ''));
			recordMail(
				user ? digest(user.email).slice(0, 32) : digest(String(accountId)).slice(0, 32),
				String(template), String(status), '', String(error).slice(0, 300),
			);
		},

		// ---------- 管理端（仅本机）----------
		adminSummary() {
			const mailFailed = one(`SELECT COUNT(*) AS total FROM mail_events WHERE status = 'failed'`).total;
			return {
				users: one('SELECT COUNT(*) AS total FROM users').total,
				suspended: one(`SELECT COUNT(*) AS total FROM users WHERE status = 'suspended'`).total,
				pending_deletion: one(`SELECT COUNT(*) AS total FROM users WHERE status = 'pending_deletion'`).total,
				active_sessions: one(`SELECT COUNT(*) AS total FROM sessions WHERE revoked_at = '' AND absolute_expires_at > ?`, iso(now())).total,
				favorites: one('SELECT COUNT(*) AS total FROM favorites').total,
				requests_received: one(`SELECT COUNT(*) AS total FROM requests WHERE status IN ('received', 'processing')`).total,
				mail_failed: mailFailed,
				agreement_version: agreementVersion,
			};
		},
		adminListUsers() {
			return many(`SELECT id, email, nickname, status, notify_progress, created_at, last_login_at, suspended_reason FROM users ORDER BY created_at DESC`)
				.map((row) => ({
					...row,
					status_label: accountStates[row.status] ?? row.status,
					notify_progress: Boolean(row.notify_progress),
					active_sessions: activeSessionCount(row.id),
					favorites: one('SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?', row.id).total,
				}));
		},
		adminSetUserStatus({ userId, status, reason, actor }) {
			if (!Object.hasOwn(accountStates, status)) fail('账号状态无效。');
			const user = one('SELECT * FROM users WHERE id = ?', String(userId ?? ''));
			if (!user) fail('找不到该账号。', 404);
			if (status === 'suspended' && !String(reason ?? '').trim()) fail('暂停账号必须填写原因。');
			const current = now();
			run(`UPDATE users SET status = ?, suspended_at = ?, suspended_reason = ?, updated_at = ? WHERE id = ?`,
				status, status === 'suspended' ? iso(current) : '', status === 'suspended' ? String(reason).trim().slice(0, 200) : '', iso(current), user.id);
			if (status === 'suspended') revokeAllSessions(user.id, 'suspended');
			audit(String(actor ?? 'admin'), `user_status_${status}`, user.id, { reason: String(reason ?? '').slice(0, 200) });
			return { id: user.id, status, status_label: accountStates[status] };
		},
		adminListRequests() {
			return many(`SELECT r.*, u.nickname AS user_nickname, u.status AS user_status FROM requests r LEFT JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC`)
				.map((row) => ({ ...row, kind_label: requestKinds[row.kind] ?? row.kind, status_label: requestStates[row.status] ?? row.status }));
		},
		adminReviewRequest({ requestId, status, publicMessage, adminNote, actor }) {
			if (!Object.hasOwn(requestStates, status)) fail('申请状态无效。');
			const request = one('SELECT * FROM requests WHERE id = ?', String(requestId ?? ''));
			if (!request) fail('找不到该申请。', 404);
			const current = now();
			run(`UPDATE requests SET status = ?, public_message = ?, admin_note = ?, updated_at = ? WHERE id = ?`,
				status, String(publicMessage ?? '').slice(0, 1000), String(adminNote ?? '').slice(0, 2000), iso(current), request.id);
			// 注销申请只在真正完成时标记账号状态；"已收到申请"不等于"已经注销"。
			if (request.kind === 'deletion' && status === 'done') {
				run(`UPDATE users SET status = 'pending_deletion', updated_at = ? WHERE id = ?`, iso(current), request.user_id);
			}
			if (request.kind === 'deletion' && status === 'rejected') {
				run(`UPDATE users SET status = 'active', updated_at = ? WHERE id = ?`, iso(current), request.user_id);
			}
			audit(String(actor ?? 'admin'), `request_${status}`, request.id, { kind: request.kind });
			return { id: request.id, status, status_label: requestStates[status] };
		},
		adminAudit(limit = 100) {
			return many('SELECT * FROM audit_log ORDER BY at DESC LIMIT ?', Math.min(Math.max(Number(limit) || 100, 1), 500));
		},
	};
}
