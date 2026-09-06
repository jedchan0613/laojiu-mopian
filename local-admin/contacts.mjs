import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { SubmissionError, readSubmissionJson } from './submissions.mjs';

export const contactLimits = Object.freeze({ requestBytes: 32 * 1024, maxEntries: 5000, maxStorageBytes: 100 * 1024 * 1024 });
export const contactConsentVersion = '2026-09-06-v1';
export const contactCategories = Object.freeze({
	collab: '合作洽谈',
	privacy: '隐私问题',
	other: '其他事宜',
});
export const contactStates = Object.freeze({
	received: '已收到',
	reviewing: '核对中',
	needs_info: '等待补充',
	replied: '已回复',
	closed: '已结束',
});

const fail = (message, status = 400) => { throw new SubmissionError(message, status); };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const idPattern = /^LX-[A-F0-9]{24}$/;
const keyPattern = /^[a-f0-9]{64}$/;
export const contactId = (key) => `LX-${hash(key).slice(0, 24).toUpperCase()}`;

const text = (value, name, min, max) => {
	if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
		fail(`请检查${name}（${min}—${max} 字）。`);
	}
	return value.trim();
};

const exists = (file) => fs.access(file).then(() => true, () => false);
const atomicJson = async (file, value) => {
	const temporary = `${file}.${randomUUID()}.tmp`;
	await fs.writeFile(temporary, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
	await fs.rename(temporary, file);
};

const normalizePagePath = (value) => {
	const pagePath = text(value ?? '', '来信页面', 0, 500);
	if (!pagePath) return '';
	if (!pagePath.startsWith('/') || pagePath.startsWith('//')) fail('来信页面地址无效。');
	let parsed;
	try { parsed = new URL(pagePath, 'https://public-site.invalid'); }
	catch { fail('来信页面地址无效。'); }
	if (parsed.origin !== 'https://public-site.invalid') fail('来信页面地址无效。');
	return `${parsed.pathname}${parsed.search}`;
};

const validateContact = (type, value) => {
	if (!['email', 'wechat', 'phone', 'none'].includes(type)) fail('请选择回复方式。');
	const contact = text(value ?? '', '联系方式', type === 'none' ? 0 : 3, type === 'none' ? 0 : 120);
	if (type === 'none' && contact) fail('选择无需回复时，不应填写联系方式。');
	if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) fail('邮箱格式不正确。');
	if (type === 'phone' && !/^\+?[\d ()-]{6,30}$/.test(contact)) fail('电话号码格式不正确。');
	return contact;
};

export function createContactStore({
	root,
	maxEntries = contactLimits.maxEntries,
	maxStorageBytes = contactLimits.maxStorageBytes,
}) {
	root = path.resolve(root);
	const safeId = (id) => { if (!idPattern.test(id ?? '')) fail('联系编号无效。', 404); return id; };
	const recordPath = (id) => path.join(root, safeId(id), 'record.json');
	const read = async (id) => {
		try { return JSON.parse(await fs.readFile(recordPath(id), 'utf8')); }
		catch (error) { if (error.code === 'ENOENT') fail('找不到这次联系。', 404); throw error; }
	};
	const locked = async (name, operation) => {
		await fs.mkdir(root, { recursive: true, mode: 0o700 });
		const lock = path.join(root, `.${name}.lock`);
		try { await fs.mkdir(lock, { mode: 0o700 }); }
		catch (error) { if (error.code === 'EEXIST') fail('当前正在处理，请稍后重试。', 409); throw error; }
		try { return await operation(); } finally { await fs.rmdir(lock); }
	};
	const all = async () => {
		await fs.mkdir(root, { recursive: true, mode: 0o700 });
		const entries = await fs.readdir(root, { withFileTypes: true });
		const records = [];
		for (const entry of entries) if (entry.isDirectory() && idPattern.test(entry.name)) records.push(await read(entry.name));
		return records.sort((a, b) => b.created_at.localeCompare(a.created_at));
	};
	const create = async (payload) => {
		if (!payload || !keyPattern.test(payload.key ?? '')) fail('联系凭证无效，请刷新后重试。');
		if (payload.website) fail('提交未通过，请稍后重试。');
		if (!Object.hasOwn(contactCategories, payload.category)) fail('请选择来信类型。');
		if (payload.consent_version !== contactConsentVersion || payload.processing !== true) fail('请阅读并确认私密保存说明。');

		const fields = {
			category: payload.category,
			name: text(payload.name ?? '', '称呼', 0, 40),
			contact_type: payload.contact_type,
			contact: validateContact(payload.contact_type, payload.contact),
			reference: text(payload.reference ?? '', '相关档案编号或页面地址', 0, 500),
			page_path: normalizePagePath(payload.page_path),
			message: text(payload.message, '简要说明', 10, 2000),
		};
		const id = contactId(payload.key);
		const fingerprint = hash(JSON.stringify({ fields, consent_version: contactConsentVersion }));
		return locked('intake', async () => locked(id, async () => {
			if (await exists(recordPath(id))) {
				const old = await read(id);
				if (old.fingerprint !== fingerprint) fail('这次留言已经收到。请用回执查询；如需另写一封，请重新打开页面。', 409);
				return { id, created_at: old.created_at, repeated: true };
			}
			const records = await all();
			const storageBytes = records.reduce((total, record) => total + Buffer.byteLength(JSON.stringify(record)), 0);
			if (records.length >= maxEntries || storageBytes + contactLimits.requestBytes > maxStorageBytes) {
				fail('联系收件区暂满，请稍后再试。', 503);
			}
			const now = new Date().toISOString();
			const record = {
				version: 1,
				revision: 1,
				id,
				created_at: now,
				updated_at: now,
				key_hash: hash(payload.key),
				fingerprint,
				fields,
				consent: { version: contactConsentVersion, confirmed_at: now, processing: true },
				status: 'received',
				private_note: '',
				public_message: '',
				history: [{ at: now, action: 'received' }],
			};
			const staging = path.join(root, `.incoming-${randomUUID()}`);
			await fs.mkdir(staging, { mode: 0o700 });
			await atomicJson(path.join(staging, 'record.json'), record);
			await fs.rename(staging, path.join(root, id));
			return { id, created_at: now, repeated: false };
		}));
	};
	const authenticate = async (id, key) => {
		if (!idPattern.test(id ?? '') || !keyPattern.test(key ?? '')) fail('联系编号或查询密钥不正确。', 404);
		let record;
		try { record = await read(id); }
		catch (error) { if (error.statusCode === 404) fail('联系编号或查询密钥不正确。', 404); throw error; }
		if (!timingSafeEqual(Buffer.from(record.key_hash, 'hex'), Buffer.from(hash(key), 'hex'))) fail('联系编号或查询密钥不正确。', 404);
		return record;
	};
	const publicSummary = (record) => ({
		id: record.id,
		status: record.status,
		status_label: contactStates[record.status],
		created_at: record.created_at,
		updated_at: record.updated_at,
		message: record.public_message,
	});
	const detail = (record) => {
		const { key_hash, fingerprint, ...safe } = record;
		return safe;
	};
	const review = async (id, payload) => locked(safeId(id), async () => {
		const record = await read(id);
		if (payload.revision !== record.revision) fail('联系记录已被其他操作更新，请刷新后再保存。', 409);
		if (!Object.hasOwn(contactStates, payload.status)) fail('处理状态无效。');
		const publicMessage = text(payload.public_message ?? '', '给来信人的说明', 0, 1000);
		if (['needs_info', 'replied'].includes(payload.status) && !publicMessage) fail('等待补充或已回复时，请填写给来信人的说明。');
		record.status = payload.status;
		record.private_note = text(payload.private_note ?? '', '内部备注', 0, 4000);
		record.public_message = publicMessage;
		record.revision++;
		record.updated_at = new Date().toISOString();
		record.history.push({
			at: record.updated_at,
			action: 'review',
			status: record.status,
			private_note: record.private_note,
			public_message: record.public_message,
		});
		await atomicJson(recordPath(id), record);
		return detail(record);
	});
	const list = async () => (await all()).map((record) => ({
		id: record.id,
		revision: record.revision,
		category: record.fields.category,
		name: record.fields.name,
		contact_type: record.fields.contact_type,
		status: record.status,
		created_at: record.created_at,
		updated_at: record.updated_at,
		page_path: record.fields.page_path,
	}));

	return {
		create,
		lookup: async ({ id, key }) => publicSummary(await authenticate(id, key)),
		review,
		list,
		detail: async (id) => detail(await read(id)),
	};
}

export function createPublicContactHandler({ store, origin, local = false, trustProxy = false }) {
	const rate = new Map();
	let active = 0;
	const send = (response, code, data) => {
		response.writeHead(code, {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff',
			'Referrer-Policy': 'no-referrer',
			'X-Robots-Tag': 'noindex, nofollow',
			...(code === 429 ? { 'Retry-After': '600' } : {}),
		});
		response.end(JSON.stringify(data));
	};
	return async (request, response, pathname) => {
		if (!pathname.startsWith('/api/contact')) return false;
		let admitted = false;
		try {
			const actions = new Set(['/api/contact', '/api/contact/lookup']);
			if (pathname === '/api/contact/config' && request.method === 'GET') {
				send(response, 200, {
					available: true,
					local_preview: local,
					limits: { requestBytes: contactLimits.requestBytes, messageCharacters: 2000 },
					consent_version: contactConsentVersion,
				});
				return true;
			}
			if (!actions.has(pathname)) fail('此地址不存在。', 404);
			if (request.method !== 'POST') fail('不支持此操作。', 405);
			const origins = new Set([origin, ...(local ? [origin.replace('127.0.0.1', 'localhost')] : [])]);
			if (!origins.has(request.headers.origin) || request.headers['x-ljm-contact'] !== '1') fail('提交来源不正确，请从网站联系挂件重试。', 403);
			const now = Date.now();
			for (const [key, value] of rate) if (value.until <= now) rate.delete(key);
			const address = trustProxy ? request.headers['x-ljm-client-ip'] : request.socket.remoteAddress;
			if (!address || typeof address !== 'string' || address.length > 100) fail('无法确认提交来源。', 403);
			const bucket = `${hash(address)}:${pathname === '/api/contact' ? 'submit' : 'lookup'}`;
			const previous = rate.get(bucket) ?? { count: 0, until: now + 600_000 };
			if (rate.size >= 5000 && !rate.has(bucket)) fail('当前访问较多，请稍后再试。', 429);
			previous.count++;
			rate.set(bucket, previous);
			if (previous.count > (pathname === '/api/contact' ? 3 : 40)) fail('操作太频繁，请十分钟后再试。', 429);
			if (active >= 2) fail('当前正在接收其他留言，请稍后再试。', 503);
			active++;
			admitted = true;
			const payload = await readSubmissionJson(request, pathname === '/api/contact' ? contactLimits.requestBytes : 4096);
			const data = pathname === '/api/contact' ? await store.create(payload) : await store.lookup(payload);
			send(response, pathname === '/api/contact' ? 201 : 200, data);
		} catch (error) {
			if (!response.headersSent) send(response, error instanceof SubmissionError ? error.statusCode : 500, {
				error: error instanceof SubmissionError ? error.message : '暂时无法完成联系，请稍后重试。',
			});
		} finally {
			if (admitted) active--;
		}
		return true;
	};
}
