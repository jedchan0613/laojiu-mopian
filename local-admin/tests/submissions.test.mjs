import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSubmissionStore, createPublicSubmissionHandler, privacyChecks, submissionId, consentVersion } from '../submissions.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const siteDirectory = path.join(project, 'site');
const sharp = createRequire(path.join(siteDirectory, 'package.json'))('sharp');
const image = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#b98c60' } }).withExif({ IFD0: { Artist: 'PRIVATE-METADATA-FIXTURE' } }).jpeg().toBuffer();
async function fixture(t, options = {}) {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-submission-test-'));
 t.after(async () => { const resolved = path.resolve(root); assert.equal(path.dirname(resolved), path.resolve(os.tmpdir())); assert.ok(path.basename(resolved).startsWith('ljm-submission-test-')); await fs.rm(resolved, { recursive: true, force: true }); });
 const store = createSubmissionStore({ root, siteDirectory, ...options });
 const payload = { key: randomBytes(32).toString('hex'), website: '', title: '测试用虚构资料', description: '这是一份自动检查使用的虚构资料，不包含真实人物。', category: '照片', era: '', name: '测试投稿人', contact_type: 'email', contact: 'synthetic@example.invalid', attribution: 'anonymous', credit: '', people: 'none', consent_version: consentVersion, consents: { copies: true, rights: true, privacy: true, processing: true }, images: [{ name: 'screening-copy.jpg', buffer: image }] };
 return { store, root, payload };
}
test('接收、重试与回执：私密字段不外泄，元数据被移除，重新打开仍可查询', async t => {
 const { store, root, payload } = await fixture(t);
 const first = await store.create(payload); assert.equal(first.id, submissionId(payload.key));
 assert.equal((await store.create(payload)).repeated, true);
 assert.equal((await store.list()).length, 1);
 const stored = JSON.parse(await fs.readFile(path.join(root, first.id, 'record.json'), 'utf8'));
 assert.equal(stored.status, 'pending'); assert.equal(stored.key_hash.length, 64);
 assert.ok(!JSON.stringify(stored).includes(payload.key)); assert.equal(stored.fields.contact, payload.contact);
 const cleaned = await store.getImage(first.id, 'copy-01.jpg'); const meta = await sharp(cleaned).metadata();
 assert.equal(meta.exif, undefined); assert.equal(meta.format, 'jpeg'); assert.ok(!cleaned.includes(Buffer.from('PRIVATE-METADATA-FIXTURE')));
 const reloaded = createSubmissionStore({ root, siteDirectory });
 const summary = await reloaded.lookup({ id: first.id, key: payload.key });
 assert.deepEqual(Object.keys(summary).sort(), ['created_at', 'id', 'in_preparation', 'message', 'status', 'status_label', 'updated_at', 'withdrawal_requested'].sort());
 assert.ok(!JSON.stringify(summary).includes(payload.contact));
 await assert.rejects(store.lookup({ id: first.id, key: randomBytes(32).toString('hex') }), { statusCode: 404 });
 await assert.rejects(store.create({ ...payload, title: '修改后的标题' }), { statusCode: 409 });
 assert.ok(!(await store.detail(first.id)).key_hash);
});
test('服务端拒绝缺失授权、伪造格式、主档、损坏图片与过量提交', async t => {
 const { store, payload } = await fixture(t);
 for (const patch of [
  { consents: { ...payload.consents, rights: false } }, { consent_version: 'old' }, { contact: 'invalid-email' },
  { people: 'guess' }, { category: '伪造代码' }, { images: [] }, { images: Array(9).fill(payload.images[0]) },
  { images: [{ ...payload.images[0], name: 'original.jpg' }] },
  { images: [{ ...payload.images[0], name: 'master.tiff' }] },
  { images: [{ name: 'fake.jpg', buffer: Buffer.from('<script>alert(1)</script>') }] },
  { images: [{ name: 'wrong.png', buffer: image }] },
  { images: [{ name: 'huge.jpg', buffer: Buffer.alloc(5 * 1024 ** 2 + 1) }] },
  { website: 'bot' },
 ]) await assert.rejects(store.create({ ...payload, ...patch }));
 assert.equal((await store.list()).length, 0);
});
test('审核回复、版本冲突、停止处理与草稿门禁', async t => {
 const { store, payload } = await fixture(t); const { id } = await store.create(payload);
 await assert.rejects(store.review(id, { revision: 1, status: 'needs_info' }));
 const reply = await store.review(id, { revision: 1, status: 'needs_info', public_message: '请补充资料来源。', private_note: 'PRIVATE-NOTE-ONLY' });
 assert.equal(reply.revision, 2);
 await assert.rejects(store.review(id, { revision: 1, status: 'pending' }), { statusCode: 409 });
 const summary = await store.lookup({ id, key: payload.key }); assert.equal(summary.message, '请补充资料来源。'); assert.ok(!JSON.stringify(summary).includes('PRIVATE-NOTE'));
 let imported = false;
 await assert.rejects(store.transfer(id, { revision: 2, checks: privacyChecks.map(() => true), images: ['copy-01.jpg'] }, () => { imported = true; })); assert.equal(imported, false);
 await store.withdraw({ id, key: payload.key });
 assert.equal((await store.detail(id)).status, 'withdrawn');
 await assert.rejects(store.review(id, { revision: 3, status: 'approved', rights_reviewed: true }));
 assert.equal((await store.getImage(id, 'copy-01.jpg')).length > 0, true);
 await assert.rejects(store.getImage(id, '../record.json'), { statusCode: 404 });
});
test('逐项人工确认后只转为草稿；重复点击不产生重复编号；停止申请可追溯', async t => {
 const { store, payload } = await fixture(t); const { id } = await store.create(payload);
 await assert.rejects(store.review(id, { revision: 1, status: 'approved' }));
 await store.review(id, { revision: 1, status: 'approved', rights_reviewed: true });
 const transfer = { revision: 2, title: '人工整理后的题名', description: '已核实的说明', object_type: 'PHO', accession_date: '2026-09-05', checks: privacyChecks.map(() => true), images: ['copy-01.jpg'] };
 let imports = 0;
 const createDraft = async input => { imports++; assert.equal(input.title, transfer.title); assert.ok(!JSON.stringify(input).includes(payload.contact)); return 'LJM-20260905-PHO-001'; };
 await assert.rejects(store.transfer(id, { ...transfer, checks: [true] }, createDraft));
 await assert.rejects(store.transfer(id, { ...transfer, images: ['../record.json'] }, createDraft));
 const first = await store.transfer(id, transfer, createDraft); assert.equal(first.repeated, false);
 assert.equal((await store.transfer(id, transfer, createDraft)).repeated, true); assert.equal(imports, 1);
 await store.withdraw({ id, key: payload.key });
 const record = await store.detail(id); assert.equal(record.withdrawal_requested, true); assert.equal(record.linked_item_id, 'LJM-20260905-PHO-001');
 assert.ok(record.history.some(entry => entry.action === 'withdrawal_requested'));
});
test('失败的草稿操作保留审核资料，可安全重试', async t => {
 const { store, payload } = await fixture(t); const { id } = await store.create(payload);
 await store.review(id, { revision: 1, status: 'approved', rights_reviewed: true });
 await assert.rejects(store.transfer(id, { revision: 2, title: '测试标题', description: '', checks: privacyChecks.map(() => true), images: ['copy-01.jpg'] }, async () => { throw new Error('synthetic failure'); }));
 assert.equal((await store.detail(id)).linked_item_id, null); assert.equal((await store.detail(id)).revision, 2); assert.ok((await store.getImage(id, 'copy-01.jpg')).length);
});
test('容量上限停止接收，不影响已有回执', async t => {
 const { store, payload } = await fixture(t, { maxEntries: 1 }); const first = await store.create(payload);
 await assert.rejects(store.create({ ...payload, key: randomBytes(32).toString('hex') }), { statusCode: 503 });
 assert.equal((await store.lookup({ id: first.id, key: payload.key })).status, 'pending');
});
test('发布期间不能同时改变撤回状态；申请被接收后阻止发布', async t => {
 const { store, payload } = await fixture(t); const { id } = await store.create(payload);
 await store.review(id, { revision: 1, status: 'approved', rights_reviewed: true });
 await store.transfer(id, { revision: 2, title: '测试标题', description: '', checks: privacyChecks.map(() => true), images: ['copy-01.jpg'] }, async () => 'LJM-20260905-PHO-001');
 let release, entered;
 const pending = new Promise(resolve => { release = resolve; }); const started = new Promise(resolve => { entered = resolve; });
 const publication = store.guardPublication('LJM-20260905-PHO-001', async () => { entered(); await pending; return 'done'; });
 await started;
 await assert.rejects(store.withdraw({ id, key: payload.key }), { statusCode: 409 });
 release(); assert.equal(await publication, 'done');
 await store.withdraw({ id, key: payload.key });
 let called = false;
 await assert.rejects(store.guardPublication('LJM-20260905-PHO-001', async () => { called = true; }), { statusCode: 409 });
 assert.equal(called, false);
});
test('公开 HTTP 仅支持约定路由，限制来源、正文大小和频率', async t => {
 const { store, payload } = await fixture(t); let handler;
 const server = http.createServer(async (req, res) => { if (!await handler(req, res, new URL(req.url, 'http://test').pathname)) res.writeHead(404).end(); });
 server.listen(0, '127.0.0.1'); await once(server, 'listening');
 const origin = `http://127.0.0.1:${server.address().port}`; handler = createPublicSubmissionHandler({ store, origin, local: true });
 t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
 const jsonHeaders = { 'Content-Type': 'application/json', 'X-LJM-Submission': '1', Origin: origin };
 const formHeaders = { 'X-LJM-Submission': '1', Origin: origin };
 const submissionForm = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
   if (key === 'images') { for (const image of value) form.append('images', new Blob([image.buffer]), image.name); }
   else if (key === 'consents') { for (const [name, accepted] of Object.entries(value)) form.append(`consents_${name}`, String(accepted)); }
   else if (value === null || typeof value === 'object') continue;
   else form.append(key, String(value));
  }
  return form;
 };
 assert.equal((await fetch(`${origin}/api/submissions/config`)).status, 200);
 assert.equal((await fetch(`${origin}/api/admin/submissions`)).status, 404);
 assert.equal((await fetch(`${origin}/api/submissions/private.jpg`)).status, 404);
 assert.equal((await fetch(`${origin}/api/submissions`, { method: 'POST', headers: { ...jsonHeaders, Origin: 'https://evil.invalid' }, body: '{}' })).status, 403);
 assert.equal((await fetch(`${origin}/api/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: '{}' })).status, 403);
 assert.equal((await fetch(`${origin}/api/submissions/lookup`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ padding: 'x'.repeat(4200) }) })).status, 413);
 assert.equal((await fetch(`${origin}/api/submissions`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) })).status, 415);
 const created = await fetch(`${origin}/api/submissions`, { method: 'POST', headers: formHeaders, body: submissionForm() }); assert.equal(created.status, 201);
 const { id } = await created.json();
 const lookup = await fetch(`${origin}/api/submissions/lookup`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ id, key: payload.key }) }); assert.equal(lookup.status, 200);
 assert.ok(!(await lookup.text()).includes(payload.contact));
 for (let n = 0; n < 4; n++) {
  const response = await fetch(`${origin}/api/submissions`, { method: 'POST', headers: formHeaders, body: new FormData() });
  assert.equal(response.status, n === 3 ? 429 : 400);
 }
});
