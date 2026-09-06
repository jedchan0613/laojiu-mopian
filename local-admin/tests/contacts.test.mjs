import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import {
	contactConsentVersion,
	contactId,
	createContactStore,
	createPublicContactHandler,
} from '../contacts.mjs';

async function fixture(t, options = {}) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-contact-test-'));
	t.after(async () => {
		const resolved = path.resolve(root);
		assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
		assert.ok(path.basename(resolved).startsWith('ljm-contact-test-'));
		await fs.rm(resolved, { recursive: true, force: true });
	});
	const store = createContactStore({ root, ...options });
	const payload = {
		key: randomBytes(32).toString('hex'),
		website: '',
		category: 'privacy',
		page_path: '/archive/LJM-20260808-PST-001/',
		reference: 'LJM-20260808-PST-001',
		name: '测试来信人',
		contact_type: 'email',
		contact: 'synthetic-contact@example.invalid',
		message: '这是一封自动检查使用的虚构隐私问题来信，不包含真实人物资料。',
		consent_version: contactConsentVersion,
		processing: true,
	};
	return { root, store, payload };
}

test('接收、重复提交与回执查询不会公开私密正文和联系方式', async t => {
	const { root, store, payload } = await fixture(t);
	const first = await store.create(payload);
	assert.equal(first.id, contactId(payload.key));
	assert.equal((await store.create(payload)).repeated, true);
	assert.equal((await store.list()).length, 1);
	const stored = JSON.parse(await fs.readFile(path.join(root, first.id, 'record.json'), 'utf8'));
	assert.equal(stored.status, 'received');
	assert.equal(stored.key_hash.length, 64);
	assert.ok(!JSON.stringify(stored).includes(payload.key));
	assert.equal(stored.fields.contact, payload.contact);
	const summary = await store.lookup({ id: first.id, key: payload.key });
	assert.deepEqual(Object.keys(summary).sort(), ['created_at', 'id', 'message', 'status', 'status_label', 'updated_at'].sort());
	assert.ok(!JSON.stringify(summary).includes(payload.contact));
	assert.ok(!JSON.stringify(summary).includes(payload.message));
	assert.ok(!(await store.detail(first.id)).key_hash);
	await assert.rejects(store.lookup({ id: first.id, key: randomBytes(32).toString('hex') }), { statusCode: 404 });
	await assert.rejects(store.create({ ...payload, message: '另一封内容完全不同的虚构来信。' }), { statusCode: 409 });
});

test('服务端拒绝缺失确认、伪造类型、危险页面地址和无效联系方式', async t => {
	const { store, payload } = await fixture(t);
	for (const patch of [
		{ processing: false },
		{ consent_version: 'old-version' },
		{ category: 'urgent' },
		{ contact: 'invalid-email' },
		{ contact_type: 'phone', contact: '123' },
		{ contact_type: 'none', contact: 'still-present@example.invalid' },
		{ page_path: '//evil.invalid/path' },
		{ page_path: 'https://evil.invalid/path' },
		{ message: '太短' },
		{ website: 'bot-filled-this' },
	]) await assert.rejects(store.create({ ...payload, ...patch }));
	assert.equal((await store.list()).length, 0);
	const anonymous = await store.create({ ...payload, contact_type: 'none', contact: '', name: '' });
	assert.equal((await store.detail(anonymous.id)).fields.contact_type, 'none');
});

test('人工处理支持状态回复、版本冲突和只读历史', async t => {
	const { store, payload } = await fixture(t);
	const { id } = await store.create(payload);
	await assert.rejects(store.review(id, { revision: 1, status: 'replied' }));
	const reviewed = await store.review(id, {
		revision: 1,
		status: 'reviewing',
		private_note: '仅供管理员查看的测试备注',
		public_message: '相关页面已进入人工核对。',
	});
	assert.equal(reviewed.revision, 2);
	assert.equal(reviewed.history.length, 2);
	await assert.rejects(store.review(id, { revision: 1, status: 'closed' }), { statusCode: 409 });
	const summary = await store.lookup({ id, key: payload.key });
	assert.equal(summary.message, '相关页面已进入人工核对。');
	assert.ok(!JSON.stringify(summary).includes('仅供管理员'));
	const replied = await store.review(id, { revision: 2, status: 'replied', public_message: '已经完成核对并回复。' });
	assert.equal(replied.status, 'replied');
});

test('容量上限停止接收，不影响已有联系回执', async t => {
	const { store, payload } = await fixture(t, { maxEntries: 1 });
	const first = await store.create(payload);
	await assert.rejects(store.create({ ...payload, key: randomBytes(32).toString('hex') }), { statusCode: 503 });
	assert.equal((await store.lookup({ id: first.id, key: payload.key })).status, 'received');
});

test('公开 HTTP 只开放联系约定路由，并限制来源、正文和频率', async t => {
	const { store, payload } = await fixture(t);
	let handler;
	const server = http.createServer(async (request, response) => {
		if (!await handler(request, response, new URL(request.url, 'http://test').pathname)) response.writeHead(404).end();
	});
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const origin = `http://127.0.0.1:${server.address().port}`;
	handler = createPublicContactHandler({ store, origin, local: true });
	t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
	const headers = { 'Content-Type': 'application/json', 'X-LJM-Contact': '1', Origin: origin };
	assert.equal((await fetch(`${origin}/api/contact/config`)).status, 200);
	assert.equal((await fetch(`${origin}/api/admin/contacts`)).status, 404);
	assert.equal((await fetch(`${origin}/api/contact/private`)).status, 404);
	assert.equal((await fetch(`${origin}/api/contact`, { method: 'POST', headers: { ...headers, Origin: 'https://evil.invalid' }, body: '{}' })).status, 403);
	assert.equal((await fetch(`${origin}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: '{}' })).status, 403);
	assert.equal((await fetch(`${origin}/api/contact/lookup`, { method: 'POST', headers, body: JSON.stringify({ padding: 'x'.repeat(4200) }) })).status, 413);
	const created = await fetch(`${origin}/api/contact`, { method: 'POST', headers, body: JSON.stringify(payload) });
	assert.equal(created.status, 201);
	const { id } = await created.json();
	const lookup = await fetch(`${origin}/api/contact/lookup`, { method: 'POST', headers, body: JSON.stringify({ id, key: payload.key }) });
	assert.equal(lookup.status, 200);
	assert.ok(!(await lookup.text()).includes(payload.contact));
	for (let index = 0; index < 3; index++) {
		const response = await fetch(`${origin}/api/contact`, { method: 'POST', headers, body: '{}' });
		assert.equal(response.status, index === 2 ? 429 : 400);
	}
});
